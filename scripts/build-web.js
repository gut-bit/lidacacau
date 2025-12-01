const fs = require("fs");
const path = require("path");
const { spawn, execSync } = require("child_process");

function exitWithError(message) {
  console.error("ERROR:", message);
  process.exit(1);
}

function clearBuildDirectories() {
  console.log("Clearing previous builds...");
  
  const dirsToRemove = ["static-build", "dist"];
  for (const dir of dirsToRemove) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
  
  fs.mkdirSync("static-build", { recursive: true });
}

async function runExpoExport() {
  console.log("Building web version with Expo...");
  
  const buildEnv = { ...process.env };
  delete buildEnv.EXPO_PUBLIC_API_BASE_URL;
  delete buildEnv.API_BASE_URL;
  buildEnv.NODE_ENV = "production";
  
  console.log("API Base URL for production: /api (relative path)");
  
  return new Promise((resolve, reject) => {
    const exportProcess = spawn("npx", [
      "expo", "export", 
      "--platform", "web",
      "--output-dir", "dist"
    ], {
      stdio: "inherit",
      shell: true,
      env: buildEnv
    });
    
    exportProcess.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Expo export failed with code ${code}`));
      }
    });
    
    exportProcess.on("error", (err) => {
      reject(err);
    });
  });
}

function copyToStaticBuild() {
  console.log("Copying to static-build...");
  
  if (!fs.existsSync("dist")) {
    exitWithError("dist directory not found after Expo export");
  }
  
  const copyRecursive = (src, dest) => {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };
  
  copyRecursive("dist", "static-build");
  
  fs.rmSync("dist", { recursive: true, force: true });
}

function addMobileMetaTags() {
  console.log("Optimizing for mobile browsers...");
  
  const indexPath = path.join("static-build", "index.html");
  
  if (!fs.existsSync(indexPath)) {
    exitWithError("index.html not found in static-build");
  }
  
  let html = fs.readFileSync(indexPath, "utf-8");
  
  const mobileMetaTags = `
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="theme-color" content="#F15A29">
    <meta name="apple-mobile-web-app-title" content="LidaCacau">
    <link rel="apple-touch-icon" href="/favicon.ico">
    <link rel="manifest" href="/manifest.json">
  `;
  
  html = html.replace('</head>', mobileMetaTags + '\n  </head>');
  
  const loadingStyles = `
    <style id="app-loading">
      .app-loading-screen {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, #F15A29 0%, #d14d22 100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      .app-loading-screen.hidden {
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
      }
      .app-loading-logo {
        width: 80px;
        height: 80px;
        border-radius: 16px;
        margin-bottom: 24px;
        animation: pulse 1.5s ease-in-out infinite;
      }
      .app-loading-text {
        color: white;
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 8px;
      }
      .app-loading-subtitle {
        color: rgba(255,255,255,0.8);
        font-size: 14px;
      }
      .app-loading-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid rgba(255,255,255,0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-top: 24px;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
    </style>
  `;
  
  html = html.replace('</head>', loadingStyles + '\n  </head>');
  
  const processEnvPolyfill = `
    <script>
      // Polyfill for process.env (required for Metro bundler compatibility)
      if (typeof process === 'undefined') {
        window.process = { env: {} };
      } else if (typeof process.env === 'undefined') {
        process.env = {};
      }
      // Set common environment flags
      process.env.NODE_ENV = 'production';
      process.env.JEST_WORKER_ID = undefined;
      process.env.NODE_DEBUG = '';
    </script>
  `;
  
  html = html.replace('<head>', '<head>' + processEnvPolyfill);
  
  const loadingScreen = `
    <div id="app-loading-screen" class="app-loading-screen">
      <img src="/favicon.ico" alt="LidaCacau" class="app-loading-logo">
      <div class="app-loading-text">LidaCacau</div>
      <div class="app-loading-subtitle">Confianca de quem e da Lida</div>
      <div class="app-loading-spinner"></div>
    </div>
    <script>
      window.addEventListener('load', function() {
        setTimeout(function() {
          var loadingScreen = document.getElementById('app-loading-screen');
          if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(function() {
              loadingScreen.remove();
            }, 300);
          }
        }, 500);
      });
    </script>
  `;
  
  html = html.replace('<div id="root">', loadingScreen + '\n    <div id="root">');
  
  fs.writeFileSync(indexPath, html);
}

function createPWAManifest() {
  console.log("Creating PWA manifest...");
  
  const manifest = {
    name: "LidaCacau",
    short_name: "LidaCacau",
    description: "Marketplace Rural - Confianca de quem e da Lida",
    start_url: "/",
    display: "standalone",
    background_color: "#F15A29",
    theme_color: "#F15A29",
    orientation: "portrait",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon"
      }
    ]
  };
  
  fs.writeFileSync(
    path.join("static-build", "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );
}

function logBuildStats() {
  console.log("\nBuild Statistics:");
  
  const getDirectorySize = (dir) => {
    let size = 0;
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      const filePath = path.join(dir, file.name);
      if (file.isDirectory()) {
        size += getDirectorySize(filePath);
      } else {
        size += fs.statSync(filePath).size;
      }
    }
    return size;
  };
  
  const totalSize = getDirectorySize("static-build");
  console.log(`  Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  
  const countFiles = (dir) => {
    let count = 0;
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      if (file.isDirectory()) {
        count += countFiles(path.join(dir, file.name));
      } else {
        count++;
      }
    }
    return count;
  };
  
  console.log(`  Total files: ${countFiles("static-build")}`);
}

async function main() {
  console.log("=================================");
  console.log("  LidaCacau Web Build");
  console.log("  Para navegadores mobile");
  console.log("=================================\n");
  
  try {
    clearBuildDirectories();
    await runExpoExport();
    copyToStaticBuild();
    addMobileMetaTags();
    createPWAManifest();
    logBuildStats();
    
    console.log("\n✅ Build completo!");
    console.log("📁 Output: static-build/");
    console.log("🌐 Pronto para deploy no lidacacau.com");
    
  } catch (error) {
    exitWithError(error.message);
  }
}

main();
