/**
 * stack.json の公開版（published）を node_modules に入れる。package-lock は書き換えない。
 * PDF_E2E_LOCAL=1 のときは何もしない（このリポジトリの mcp/<name> を使う）。
 * `--print` のときは入れずに、入れる版（`<npm>@<版>` を空白区切り）を 1 行出して終わる。
 * E5（.github/workflows/e2e-os-matrix.yml）が、この setup が止まったときに同じ版を別の経路で入れるのに使う。
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SERVERS } from './lib.mjs';

if (process.env.PDF_E2E_LOCAL) {
  console.log('PDF_E2E_LOCAL is set: using mcp/<name>/dist from this repository');
  process.exit(0);
}
const here = dirname(fileURLToPath(import.meta.url));
const stack = JSON.parse(readFileSync(join(here, '..', '..', 'stack.json'), 'utf8'));
const specs = Object.values(SERVERS).map((name) => {
  const repo = stack.repos.find((r) => r.name === name);
  if (!repo?.published) throw new Error(`stack.json has no published version for ${name}`);
  return `${repo.npm}@${repo.published}`;
});
if (process.argv.includes('--print')) {
  console.log(specs.join(' '));
  process.exit(0);
}
console.log(`installing ${specs.join(' ')}`);
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
execFileSync(npm, ['install', '--no-save', '--no-audit', '--no-fund', ...specs], { cwd: here, stdio: 'inherit' });
