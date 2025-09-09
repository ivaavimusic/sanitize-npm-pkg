#!/usr/bin/env node
/*
Deep Scan using SafeDep vet (optional, third-party)

This script assists users in running a deep malicious package scan with SafeDep's `vet` tool.
It NEVER downloads or installs anything without explicit user confirmation.

Supported OS flows:
- macOS/Linux: Offer to install Homebrew (if missing), then install vet via Homebrew.
- Windows: Provide official binary download URL and prompt user to confirm, then ask for path to vet.exe to run it.

By default, we run `vet scan -D . --malware-query` (query mode; no API key required).
Optionally, users can enable active malware analysis `--malware` (requires SafeDep Cloud API key).

IMPORTANT: This uses a third-party security tool. Please independently review:
- GitHub: https://github.com/safedep/vet
- X: https://x.com/safedepio
- Founder X: https://x.com/abh1sek
*/

const os = require('os');
const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

const WINDOWS_DOWNLOAD = 'https://github.com/safedep/vet/releases/download/v1.12.5/vet_Windows_x86_64.zip';

function rl() {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

function ask(q) {
  return new Promise(res => {
    const r = rl();
    r.question(q, answer => { r.close(); res(answer.trim()); });
  });
}

function hasCmd(cmd) {
  try { execSync(`${cmd} --version`, { stdio: 'ignore' }); return true; } catch { return false; }
}

async function confirm(msg) {
  const a = (await ask(`${msg} [y/N]: `)).toLowerCase();
  return a === 'y' || a === 'yes';
}

async function runVetScan(vetCmd, projectDir) {
  console.log(`\nAbout to run: ${vetCmd} scan -D ${projectDir} --malware-query`);
  const ok = await confirm('Proceed to run vet in query-only mode (no API key)?');
  if (!ok) { console.log('Aborted.'); return; }

  await new Promise((resolve, reject) => {
    const p = spawn(vetCmd, ['scan', '-D', projectDir, '--malware-query'], { stdio: 'inherit' });
    p.on('exit', code => code === 0 ? resolve() : reject(new Error(`vet exited with code ${code}`)));
  });

  const enableActive = await confirm('\nEnable active malware analysis (--malware)? Requires SafeDep Cloud API key (free for OSS).');
  if (!enableActive) {
    console.log('\nCompleted query-only scan.');
    return;
  }

  console.log('\nTip: Run `vet cloud quickstart` to set up your API key if not already configured.');
  const proceedActive = await confirm('Proceed with `vet scan -D . --malware` now?');
  if (!proceedActive) { console.log('Skipped active analysis.'); return; }

  await new Promise((resolve, reject) => {
    const p = spawn(vetCmd, ['scan', '-D', projectDir, '--malware'], { stdio: 'inherit' });
    p.on('exit', code => code === 0 ? resolve() : reject(new Error(`vet exited with code ${code}`)));
  });
}

async function main() {
  console.log('Deep Scan using SafeDep vet (third-party)');
  console.log('Please verify the project yourself before proceeding: https://github.com/safedep/vet');

  const cwd = process.cwd();
  const platform = os.platform();

  if (platform === 'darwin' || platform === 'linux') {
    // macOS/Linux flow
    let vetCmd = 'vet';

    if (!hasCmd('brew')) {
      const installBrew = await confirm('\nHomebrew not detected. Install Homebrew now?');
      if (!installBrew) {
        console.log('Homebrew installation declined. You can install vet via direct binary or container.');
      } else {
        const reviewBrew = await confirm('Homebrew will be downloaded from https://brew.sh. Continue?');
        if (!reviewBrew) { console.log('Declined.'); return; }
        try {
          // Official install command from brew.sh
          execSync('/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"', { stdio: 'inherit' });
          console.log('Homebrew installed. Please ensure brew is on your PATH.');
        } catch (e) {
          console.error('Homebrew installation failed or was interrupted.');
          return;
        }
      }
    }

    if (!hasCmd('vet')) {
      const installVet = await confirm('\nInstall safedep/tap/vet via Homebrew now?');
      if (!installVet) { console.log('Declined vet installation.'); return; }

      const warn = await confirm('We will run: brew tap safedep/tap && brew install safedep/tap/vet. Continue?');
      if (!warn) { console.log('Declined.'); return; }

      try {
        execSync('brew tap safedep/tap', { stdio: 'inherit' });
        execSync('brew install safedep/tap/vet', { stdio: 'inherit' });
      } catch (e) {
        console.error('Failed to install vet via Homebrew.');
        return;
      }
    }

    await runVetScan(vetCmd, cwd);
  } else if (platform === 'win32') {
    console.log('\nWindows detected. Official binary URL:');
    console.log(WINDOWS_DOWNLOAD);

    const ok = await confirm('Open the download page or proceed with manual download?');
    if (!ok) { console.log('Download canceled.'); return; }

    console.log('Please download and unzip, then provide the full path to vet.exe (e.g., C:/Tools/vet/vet.exe).');
    const vetPath = await ask('Path to vet.exe: ');
    if (!vetPath || !fs.existsSync(vetPath)) {
      console.error('Invalid path to vet.exe. Aborting.');
      return;
    }

    await runVetScan(vetPath, cwd);
  } else {
    console.log(`Unsupported platform: ${platform}. Please install vet manually from https://github.com/safedep/vet/releases`);
  }
}

if (require.main === module) {
  main().catch(err => { console.error(err.message || err); process.exit(1); });
}
