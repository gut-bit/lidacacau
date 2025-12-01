/**
 * LidaCacau - GitHub Sync Script
 * 
 * Pushes all source files to GitHub repository using Octokit.
 * Uses Replit's GitHub integration for authentication.
 */

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

async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}

const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  '.expo',
  'static-build',
  '.replit',
  'replit.nix',
  '.upm',
  '.config',
  '.cache',
  '*.log',
  '.DS_Store',
  'tmp',
  '/tmp',
];

function shouldIgnore(filePath: string): boolean {
  const normalizedPath = filePath.replace(/\\/g, '/');
  return IGNORE_PATTERNS.some(pattern => {
    if (pattern.startsWith('*.')) {
      return normalizedPath.endsWith(pattern.slice(1));
    }
    return normalizedPath.includes(pattern);
  });
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
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }

  return files;
}

async function main() {
  console.log('=== LidaCacau GitHub Sync ===\n');

  try {
    const octokit = await getUncachableGitHubClient();
    
    const { data: user } = await octokit.users.getAuthenticated();
    console.log(`Authenticated as: ${user.login}`);

    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      per_page: 100,
      sort: 'updated'
    });

    let repo = repos.find(r => r.name.toLowerCase() === 'lidacacau');
    const owner = user.login;
    const repoName = 'lidacacau';

    if (!repo) {
      console.log(`Creating repository: ${repoName}`);
      const { data: newRepo } = await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        description: 'LidaCacau - Marketplace Rural para Uruara/PA',
        private: false,
        auto_init: false,
      });
      repo = newRepo;
      console.log(`Repository created: ${newRepo.html_url}`);
    } else {
      console.log(`Repository found: ${repo.html_url}`);
    }

    const workspaceDir = process.cwd();
    const files = getAllFiles(workspaceDir);
    console.log(`\nFound ${files.length} files to sync`);

    let currentTreeSha: string | undefined;
    try {
      const { data: ref } = await octokit.git.getRef({
        owner,
        repo: repoName,
        ref: 'heads/main'
      });
      currentTreeSha = ref.object.sha;
      
      const { data: commit } = await octokit.git.getCommit({
        owner,
        repo: repoName,
        commit_sha: currentTreeSha
      });
      currentTreeSha = commit.tree.sha;
    } catch (e) {
      console.log('No existing main branch, creating new repository...');
    }

    console.log('Creating file blobs...');
    const treeItems: Array<{
      path: string;
      mode: '100644';
      type: 'blob';
      sha: string;
    }> = [];

    for (const file of files) {
      const filePath = path.join(workspaceDir, file);
      const content = fs.readFileSync(filePath);
      const base64Content = content.toString('base64');

      try {
        const { data: blob } = await octokit.git.createBlob({
          owner,
          repo: repoName,
          content: base64Content,
          encoding: 'base64'
        });

        treeItems.push({
          path: file.replace(/\\/g, '/'),
          mode: '100644',
          type: 'blob',
          sha: blob.sha
        });
        
        process.stdout.write('.');
      } catch (error: any) {
        console.error(`\nError uploading ${file}: ${error.message}`);
      }
    }
    console.log('\n');

    console.log('Creating tree...');
    const { data: tree } = await octokit.git.createTree({
      owner,
      repo: repoName,
      tree: treeItems,
      base_tree: currentTreeSha
    });

    console.log('Creating commit...');
    const commitMessage = `Production deployment: splash screen fix, API server, PostgreSQL integration

Changes:
- Fixed splash screen freeze issue with AppInitializer component
- Updated Express.js server configuration
- PostgreSQL database integration with Drizzle ORM
- EAS build and update configuration
- Security improvements and rate limiting

Deployed to:
- Expo: production branch
- Web: lidacacau.com (Autoscale)`;

    let parentSha: string | undefined;
    try {
      const { data: ref } = await octokit.git.getRef({
        owner,
        repo: repoName,
        ref: 'heads/main'
      });
      parentSha = ref.object.sha;
    } catch (e) {
      // No parent for first commit
    }

    const { data: commit } = await octokit.git.createCommit({
      owner,
      repo: repoName,
      message: commitMessage,
      tree: tree.sha,
      parents: parentSha ? [parentSha] : []
    });

    console.log('Updating main branch...');
    try {
      await octokit.git.updateRef({
        owner,
        repo: repoName,
        ref: 'heads/main',
        sha: commit.sha,
        force: true
      });
    } catch (e) {
      await octokit.git.createRef({
        owner,
        repo: repoName,
        ref: 'refs/heads/main',
        sha: commit.sha
      });
    }

    console.log(`\n✅ Successfully pushed to GitHub!`);
    console.log(`Repository: https://github.com/${owner}/${repoName}`);
    console.log(`Commit: ${commit.sha.substring(0, 7)}`);

  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
