const { spawn } = require("child_process");
const path = require("path");

console.log("=================================");
console.log("  LidaCacau Production Build");
console.log("  Web version for mobile browsers");
console.log("=================================\n");

const buildProcess = spawn("node", [path.join(__dirname, "build-web.js")], {
  stdio: "inherit",
  shell: true
});

buildProcess.on("close", (code) => {
  process.exit(code || 0);
});

buildProcess.on("error", (err) => {
  console.error("Build failed:", err.message);
  process.exit(1);
});
