# sanitize-npm-pkg

Simple scripts to check if your project has malware-infected npm packages (like chalk). No coding required!

## 🚨 Is my project infected?

### Step 1: Install Node.js if you don't have it

- **Windows**: Download from [nodejs.org](https://nodejs.org/en/download/) (LTS version)
- **Mac with Homebrew**: `brew install node`
- **Mac without Homebrew**: Download from [nodejs.org](https://nodejs.org/en/download/) or install Homebrew first:
  ```bash
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  brew install node
  ```
- **Linux**: `sudo apt install nodejs npm` (Ubuntu/Debian) or `sudo dnf install nodejs npm` (Fedora/RHEL)

### Step 2: Run the audit (safe, read-only)

Copy-paste this single command in your project folder:

**Mac/Linux:**
```bash
curl -fsSL https://raw.githubusercontent.com/ivaavimusic/sanitize-npm-pkg/main/community-audit.js -o audit.js && node audit.js
```

**Windows PowerShell:**
```powershell
iwr -useb https://raw.githubusercontent.com/ivaavimusic/sanitize-npm-pkg/main/community-audit.js | out-file -encoding ascii audit.js; node audit.js
```

### Step 3: Check the results

- Open the `malware-audit.csv` file created in your project folder
- First line will say either `Status,Safe` or `Status,Infected`

### Step 4: If infected, run the fix

**Mac/Linux:**
```bash
curl -fsSL https://raw.githubusercontent.com/ivaavimusic/sanitize-npm-pkg/main/community-fix.js -o fix.js && node fix.js
```

**Windows PowerShell:**
```powershell
iwr -useb https://raw.githubusercontent.com/ivaavimusic/sanitize-npm-pkg/main/community-fix.js | out-file -encoding ascii fix.js; node fix.js
```

### Step 5 (Optional): Deep scan with vet

This uses a third-party tool (SafeDep vet). It will ask for confirmation before any downloads.

**Mac/Linux:**
```bash
curl -fsSL https://raw.githubusercontent.com/ivaavimusic/sanitize-npm-pkg/main/community-deep-scan.js -o deep-scan.js && node deep-scan.js
```

**Windows PowerShell:**
```powershell
iwr -useb https://raw.githubusercontent.com/ivaavimusic/sanitize-npm-pkg/main/community-deep-scan.js | out-file -encoding ascii deep-scan.js; node deep-scan.js
```

**Windows Node.js Installation:**
1. Download LTS from [nodejs.org](https://nodejs.org/en/download)
2. Open PowerShell and run:
   ```powershell
   node -v
   npm -v
   ```

## What the scripts do

### community-audit.js
- Scans your dependency tree (`npm ls --all --json`)
- Writes `malware-audit.csv` with a top line: `Status,Safe` or `Status,Infected`
- Lists, for each watched package: present, version, immediate parent, full parent chain

### community-fix.js
- Backs up `package.json` to `package.json.bak`
- Adds safe overrides to pin away from bad versions
- Removes `node_modules` and lockfiles; reinstalls with `npm ci` (fallback to `npm install`)

### community-deep-scan.js (optional)
- Guides you to run SafeDep vet
- Always asks before any download/install
- Default is query‑only mode:
  ```bash
  vet scan -D . --malware-query
  ```
- Can optionally enable `--malware` if you have a SafeDep API key

## Infected versions this checks for

If any of these exact versions are present in your dependency tree, you are considered infected:

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

## Detailed Explanations and Findings: 
- [We just found malicious code in the npm ecosystem](https://jdstaerk.substack.com/p/we-just-found-malicious-code-in-the)
- [NPM debug and chalk packages compromised](https://www.aikido.dev/blog/npm-debug-and-chalk-packages-compromised)

## Disclaimers

- Use at your own risk. This list is based on currently known bad versions and may not be exhaustive.
- The deep scan (`vet`) is a third‑party tool. Review it yourself: https://github.com/safedep/vet
- No automatic third‑party installs occur without your explicit confirmation in the deep scan script.

## Author

- X: https://x.com/ivaavimusic
