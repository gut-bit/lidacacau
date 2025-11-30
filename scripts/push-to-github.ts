import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  return accessToken;
}

async function getGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'static-build',
  '.expo',
  '.cache',
  '*.log',
  '.replit',
  'replit.nix',
  '.upm',
  '.config',
  'package-lock.json'
];

function shouldIgnore(filePath: string): boolean {
  const parts = filePath.split('/');
  return parts.some(part => 
    IGNORE_PATTERNS.some(pattern => {
      if (pattern.startsWith('*')) {
        return part.endsWith(pattern.slice(1));
      }
      return part === pattern;
    })
  );
}

function getAllFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    
    if (shouldIgnore(relativePath)) continue;
    
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir));
    } else {
      files.push(relativePath);
    }
  }
  
  return files;
}

async function main() {
  console.log('Connecting to GitHub...');
  const octokit = await getGitHubClient();
  
  const owner = 'gut-bit';
  const repo = 'lidacacau';
  
  console.log(`Pushing to ${owner}/${repo}...`);
  
  const user = await octokit.users.getAuthenticated();
  console.log(`Authenticated as: ${user.data.login}`);
  
  let repoExists = false;
  try {
    await octokit.repos.get({ owner, repo });
    repoExists = true;
    console.log('Repository exists, updating...');
  } catch (e: any) {
    if (e.status === 404) {
      console.log('Creating new repository...');
      await octokit.repos.createForAuthenticatedUser({
        name: repo,
        description: 'LidaCacau - Marketplace Rural para Uruara/PA',
        private: false,
        auto_init: false
      });
      repoExists = true;
    } else {
      throw e;
    }
  }
  
  const projectDir = '/home/runner/workspace';
  const files = getAllFiles(projectDir);
  
  console.log(`Found ${files.length} files to upload...`);
  
  let defaultBranch = 'main';
  try {
    const repoInfo = await octokit.repos.get({ owner, repo });
    defaultBranch = repoInfo.data.default_branch || 'main';
  } catch (e) {
    defaultBranch = 'main';
  }
  
  let baseTreeSha: string | undefined;
  let parentCommitSha: string | undefined;
  
  try {
    const refData = await octokit.git.getRef({ owner, repo, ref: `heads/${defaultBranch}` });
    parentCommitSha = refData.data.object.sha;
    const commitData = await octokit.git.getCommit({ owner, repo, commit_sha: parentCommitSha });
    baseTreeSha = commitData.data.tree.sha;
  } catch (e) {
    console.log('No existing commits, creating initial commit...');
  }
  
  console.log('Creating blobs for files...');
  const treeItems: any[] = [];
  
  for (const file of files) {
    const filePath = path.join(projectDir, file);
    try {
      const content = fs.readFileSync(filePath);
      const isText = !content.includes(0x00);
      
      const blob = await octokit.git.createBlob({
        owner,
        repo,
        content: isText ? content.toString('utf8') : content.toString('base64'),
        encoding: isText ? 'utf-8' : 'base64'
      });
      
      treeItems.push({
        path: file,
        mode: '100644',
        type: 'blob',
        sha: blob.data.sha
      });
      
      process.stdout.write('.');
    } catch (e: any) {
      console.error(`\nError uploading ${file}: ${e.message}`);
    }
  }
  
  console.log('\nCreating tree...');
  const tree = await octokit.git.createTree({
    owner,
    repo,
    tree: treeItems,
    base_tree: baseTreeSha
  });
  
  console.log('Creating commit...');
  const commit = await octokit.git.createCommit({
    owner,
    repo,
    message: 'LidaCacau - Full codebase from Replit\n\nIncludes:\n- Expo React Native app\n- Login with error handling\n- Mock services for development\n- PostgreSQL schema for production',
    tree: tree.data.sha,
    parents: parentCommitSha ? [parentCommitSha] : []
  });
  
  console.log('Updating branch reference...');
  try {
    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${defaultBranch}`,
      sha: commit.data.sha,
      force: true
    });
  } catch (e) {
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${defaultBranch}`,
      sha: commit.data.sha
    });
  }
  
  console.log('\n✅ Success! Code pushed to GitHub.');
  console.log(`\n📦 Repository: https://github.com/${owner}/${repo}`);
  console.log(`📥 Download ZIP: https://github.com/${owner}/${repo}/archive/refs/heads/${defaultBranch}.zip`);
  console.log(`📋 Clone command: git clone https://github.com/${owner}/${repo}.git`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
