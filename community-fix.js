#!/usr/bin/env node
/*
Community Fix Script

Run from any project root:
  npx --yes node ./scripts/community-fix.js
or
  node scripts/community-fix.js

It will:
- Add/merge a safe "overrides" block into package.json
- Remove node_modules and package-lock.json (or pnpm-lock.yaml/yarn.lock if present)
- Reinstall dependencies using npm ci (safest reproducible install)

Default safe overrides (can be extended):
  chalk: 5.3.0
  strip-ansi: 7.1.0
  color-convert: 2.0.1
  color-name: 1.1.4
  is-core-module: 2.13.1
  error-ex: 1.3.2
  has-ansi: 5.0.1

Note: The script is conservative and will create a backup package.json.bak before modifying.
*/

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SAFE_OVERRIDES = {
  chalk: '5.3.0',
  'strip-ansi': '7.1.0',
  'color-convert': '2.0.1',
  'color-name': '1.1.4',
  'is-core-module': '2.13.1',
  'error-ex': '1.3.2',
  'has-ansi': '5.0.1',
};

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');
}

function mergeOverrides(pkg) {
  pkg.overrides = pkg.overrides || {};
  for (const [k, v] of Object.entries(SAFE_OVERRIDES)) {
    if (!pkg.overrides[k]) pkg.overrides[k] = v;
  }
  return pkg;
}

function removeIfExists(file) {
  if (fs.existsSync(file)) {
    if (fs.lstatSync(file).isDirectory()) {
      execSync(`rm -rf ${JSON.stringify(file)}`);
    } else {
      fs.unlinkSync(file);
    }
  }
}

function main() {
  const projectPath = process.cwd();
  const pkgPath = path.join(projectPath, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.error('package.json not found. Run from a Node project root.');
    process.exit(1);
  }

  // Backup
  const backup = path.join(projectPath, 'package.json.bak');
  fs.copyFileSync(pkgPath, backup);
  console.log('Created backup:', backup);

  // Merge overrides
  const pkg = readJson(pkgPath);
  const updated = mergeOverrides(pkg);
  writeJson(pkgPath, updated);
  console.log('Applied safe overrides to package.json');

  // Remove installs and lockfiles
  removeIfExists(path.join(projectPath, 'node_modules'));
  removeIfExists(path.join(projectPath, 'package-lock.json'));
  removeIfExists(path.join(projectPath, 'pnpm-lock.yaml'));
  removeIfExists(path.join(projectPath, 'yarn.lock'));
  console.log('Removed node_modules and lockfiles');

  // Reinstall using npm ci (falls back to npm install if package-lock is missing)
  try {
    execSync('npm ci', { stdio: 'inherit' });
  } catch (e) {
    console.warn('npm ci failed (possibly no lockfile). Falling back to npm install...');
    execSync('npm install', { stdio: 'inherit' });
  }

  console.log('\nDone. Your dependencies have been reinstalled with safe overrides.');
}

if (require.main === module) {
  main();
}
