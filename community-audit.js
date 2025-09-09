#!/usr/bin/env node
/*
Community Audit Script

Run from any project root:
  npx --yes node ./scripts/community-audit.js
or
  node scripts/community-audit.js

It will:
- Inspect your dependency tree (npm ls --all --json)
- Generate CSV: malware-audit.csv
  Columns: package,present,version,immediate_parent,parent_chain
- Print a final status: Safe or Infected

Current infection rule encoded:
- Infected if chalk@5.3.1 is present anywhere in the tree (known bad).
- All other packages in the watchlist are reported, but not flagged as infected unless specific bad versions become known.
  You can extend BAD_VERSIONS below as intelligence evolves.
*/

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Packages to watch (from recent advisories)
const WATCH = [
  'backslash',
  'chalk-template',
  'supports-hyperlinks',
  'has-ansi',
  'simple-swizzle',
  'color-string',
  'error-ex',
  'color-name',
  'is-arrayish',
  'slice-ansi',
  'color-convert',
  'wrap-ansi',
  'ansi-regex',
  'supports-color',
  'strip-ansi',
  'chalk',
  'debug',
  'ansi-styles',
  'proto-tinker-wc',
];

// Known-bad versions map: { pkgName: Set([versions...]) }
const BAD_VERSIONS = {
  backslash: new Set(['0.2.1']),
  'chalk-template': new Set(['1.1.1']),
  'supports-hyperlinks': new Set(['4.1.1']),
  'has-ansi': new Set(['6.0.1']),
  'simple-swizzle': new Set(['0.2.3']),
  'color-string': new Set(['2.1.1']),
  'error-ex': new Set(['1.3.3']),
  'color-name': new Set(['2.0.1']),
  'is-arrayish': new Set(['0.3.3']),
  'slice-ansi': new Set(['7.1.1']),
  'color-convert': new Set(['3.1.1']),
  'wrap-ansi': new Set(['9.0.1']),
  'ansi-regex': new Set(['6.2.1']),
  'supports-color': new Set(['10.2.1']),
  'strip-ansi': new Set(['7.1.1']),
  'chalk': new Set(['5.6.1', '5.3.1']),
  'debug': new Set(['4.4.2']),
  'ansi-styles': new Set(['6.2.2']),
  'proto-tinker-wc': new Set(['0.1.87']),
};

function npmLsJson(cwd) {
  const cmd = 'npm ls ' + WATCH.join(' ') + ' --all --json';
  try {
    return JSON.parse(execSync(cmd, { cwd, stdio: ['ignore', 'pipe', 'pipe'] }).toString());
  } catch (err) {
    const stdout = err && err.stdout ? err.stdout.toString() : '';
    if (stdout.trim()) {
      try { return JSON.parse(stdout); } catch {}
    }
    throw new Error('Failed to parse npm ls JSON');
  }
}

function traverse(node, chain, results, targetSet) {
  if (!node || !node.dependencies) return;
  for (const [name, info] of Object.entries(node.dependencies)) {
    const nextChain = [...chain, `${name}@${info.version || 'unknown'}`];
    if (targetSet.has(name)) {
      const immediateParent = chain.length ? chain[chain.length - 1] : 'ROOT';
      if (!results[name]) results[name] = [];
      results[name].push({
        version: info.version || 'unknown',
        immediateParent,
        parentChain: (chain.length ? ['ROOT', ...chain] : ['ROOT']).concat(`${name}@${info.version || 'unknown'}`).join(' -> '),
      });
    }
    traverse(info, nextChain, results, targetSet);
  }
}

function audit(projectPath) {
  const json = npmLsJson(projectPath);
  const results = {};
  traverse(json, [], results, new Set(WATCH));

  // Determine status
  let infected = false;
  for (const [pkg, rows] of Object.entries(results)) {
    const badSet = BAD_VERSIONS[pkg];
    if (!badSet) continue;
    for (const occ of rows) {
      if (badSet.has(occ.version)) {
        infected = true;
        break;
      }
    }
    if (infected) break;
  }

  return { results, infected };
}

function writeCsv(projectPath, auditResult) {
  const outPath = path.join(projectPath, 'malware-audit.csv');
  const lines = [];
  lines.push(`Status,${auditResult.infected ? 'Infected' : 'Safe'}`);
  lines.push('');
  lines.push(['package', 'present', 'version', 'immediate_parent', 'parent_chain'].join(','));

  for (const pkg of WATCH) {
    const rows = auditResult.results[pkg];
    if (!rows || rows.length === 0) {
      lines.push([pkg, 'no', '', '', ''].join(','));
    } else {
      for (const r of rows) {
        const chain = '"' + r.parentChain.replace(/"/g, '""') + '"';
        lines.push([pkg, 'yes', r.version, r.immediateParent, chain].join(','));
      }
    }
  }

  fs.writeFileSync(outPath, lines.join('\n'));
  return outPath;
}

function main() {
  const projectPath = process.cwd();
  console.log('Auditing project:', projectPath);
  const res = audit(projectPath);
  const csv = writeCsv(projectPath, res);
  console.log('CSV written to:', csv);
  console.log('Overall status:', res.infected ? 'Infected' : 'Safe');
  if (res.infected) {
    console.log('\nDetected known-bad versions in the tree. Please run the community-fix script.');
  } else {
    console.log('\nNo known-bad versions detected (based on current rules). Review CSV for details.');
  }
}

if (require.main === module) {
  main();
}
