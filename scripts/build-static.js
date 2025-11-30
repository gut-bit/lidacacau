#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Validating static build files...');

const requiredFiles = [
  'static-build/index.html',
  'static-build/favicon.ico',
  'static-build/_expo/static/js/web/index-cfe764660b8ff805b317c593b1855c35.js'
];

let missing = [];
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    missing.push(file);
  } else {
    const size = fs.statSync(file).size;
    console.log(`✓ ${file} (${size} bytes)`);
  }
}

if (missing.length > 0) {
  console.error('ERROR: Missing files:', missing);
  process.exit(1);
}

console.log('✓ All static files ready for deployment');
process.exit(0);
