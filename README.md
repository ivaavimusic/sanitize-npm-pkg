# sanitize-npm-pkg

Ultra‑simple scripts to audit and sanitize your project from recently reported malware‑infected npm packages like chalk. One‑liners. No Cloning Required.

Warning: The optional deep scan uses a third‑party tool (SafeDep vet). Review it yourself before using.

## TL;DR – One‑liners (macOS/Linux)

- Quick Audit (creates malware-audit.csv with Safe/Infected at the top)
  ```bash
  curl -fsSL https://raw.githubusercontent.com/ivaavimusic/sanitize-npm-pkg/main/scripts/community-audit.js -o audit.js && node audit.js
  ```

- Auto‑Fix (applies safe overrides, removes node_modules + lockfiles, reinstalls)
  ```bash
  curl -fsSL https://raw.githubusercontent.com/ivaavimusic/sanitize-npm-pkg/main/scripts/community-fix.js -o fix.js && node fix.js
  ```

- Optional Deep Scan with vet (asks confirmation before any download/install)
  ```bash
  curl -fsSL https://raw.githubusercontent.com/ivaavimusic/sanitize-npm-pkg/main/scripts/community-deep-scan.js -o deep-scan.js && node deep-scan.js
  ```

## TL;DR – One‑liners (Windows PowerShell)

- Quick Audit
  ```powershell
  iwr -useb https://raw.githubusercontent.com/ivaavimusic/sanitize-npm-pkg/main/scripts/community-audit.js | out-file -encoding ascii audit.js; node audit.js
  ```

- Auto‑Fix
  ```powershell
  iwr -useb https://raw.githubusercontent.com/ivaavimusic/sanitize-npm-pkg/main/scripts/community-fix.js | out-file -encoding ascii fix.js; node fix.js
  ```

- Optional Deep Scan with vet
  ```powershell
  iwr -useb https://raw.githubusercontent.com/ivaavimusic/sanitize-npm-pkg/main/scripts/community-deep-scan.js | out-file -encoding ascii deep-scan.js; node deep-scan.js
  ```

## Prerequisite: Node.js (simple install)

- macOS (Homebrew, LTS 20.x)
  ```bash
  brew update && brew install node@20
  echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zprofile  # Apple Silicon
  echo 'export PATH="/usr/local/opt/node@20/bin:$PATH"' >> ~/.zprofile    # Intel Macs
  exec $SHELL -l; node -v; npm -v
  ```

- Debian/Ubuntu (NodeSource LTS 20.x)
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  node -v; npm -v
  ```

- Windows
  Download LTS from https://nodejs.org/en/download and then run `node -v` and `npm -v` in PowerShell.

## What the scripts do

- community-audit.js
  - Scans your dependency tree (npm ls --all --json)
  - Writes malware-audit.csv with a top line: `Status,Safe` or `Status,Infected`
  - Lists, for each watched package: present, version, immediate parent, full parent chain

- community-fix.js
  - Backs up package.json to package.json.bak
  - Adds safe overrides to pin away from bad versions
  - Removes node_modules and lockfiles; reinstalls with `npm ci` (fallback to `npm install`)

- community-deep-scan.js (optional)
  - Guides you to run SafeDep vet
  - Always asks before any download/install
  - Default is query‑only mode (`vet scan -D . --malware-query`); can optionally enable `--malware` if you have a SafeDep API key

## Infected versions this checks for

If any of these exact versions are present in your dependency tree, you are considered Infected:

```
backslash@0.2.1
chalk-template@1.1.1
supports-hyperlinks@4.1.1
has-ansi@6.0.1
simple-swizzle@0.2.3
color-string@2.1.1
error-ex@1.3.3
color-name@2.0.1
is-arrayish@0.3.3
slice-ansi@7.1.1
color-convert@3.1.1
wrap-ansi@9.0.1
ansi-regex@6.2.1
supports-color@10.2.1
strip-ansi@7.1.1
chalk@5.6.1 (and 5.3.1)
debug@4.4.2
ansi-styles@6.2.2
proto-tinker-wc@0.1.87
```

The audit script prints exactly where they come from (immediate parent + full chain).

## Interpreting results

- After running `node audit.js`, open malware-audit.csv.
- If the first line reads `Status,Safe`, you’re good.
- If it reads `Status,Infected`, run the fix one‑liner and re‑audit:
  ```bash
  node fix.js && node audit.js
  ```

## About the threat

- This repository tracks a recent wave of npm supply‑chain compromises where popular utility packages were published with malicious payloads at specific versions. Many well‑known frameworks and CLIs depend on these utilities, so you can be exposed via transitive dependencies without directly installing the package.
- The audit focuses on exact versions reported as malicious. The fix pins safe versions via overrides to prevent accidental upgrades into compromised versions.
- For additional assurance, the optional deep scan uses SafeDep vet to query known malicious packages (and, with an API key, perform active analysis).

## Disclaimers

- Use at your own risk. This list is based on currently known bad versions and may not be exhaustive.
- The deep scan (`vet`) is a third‑party tool. Review it yourself: https://github.com/safedep/vet
- No automatic third‑party installs occur without your explicit confirmation in the deep scan script.

## Author

- X: https://x.com/ivaavimusic
