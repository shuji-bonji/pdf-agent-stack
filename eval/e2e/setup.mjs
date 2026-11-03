/**
 * stack.json の公開版（published）を node_modules に入れる。package-lock は書き換えない。
 * PDF_E2E_LOCAL=1 のときは何もしない（このリポジトリの mcp/<name> を使う）。
 * `--print` のときは入れずに、入れる版（`<npm>@<版>` を空白区切り）を 1 行出して終わる。
 * E5（.github/workflows/e2e-os-matrix.yml）が、ジョブの Summary に起動した版を書くのに使う。
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
const args = ['install', '--no-save', '--no-audit', '--no-fund', ...specs];
// `npm run setup` から起動されると、npm は自分の本体（npm-cli.js）のパスを npm_execpath に入れる。
// それを node で実行すれば、Windows でも npm.cmd を経由しない。Node.js 20.12 以降、.cmd を shell 指定なしで
// execFileSync すると spawnSync npm.cmd EINVAL で止まる（2026-11 試用の F-13。E5 の Windows 2 本で再現）。
// pnpm や yarn から起動されたときは npm_execpath が npm のものではないので、使わない。
const npmCli = process.env.npm_execpath;
if (npmCli && /npm-cli\.[cm]?js$/.test(npmCli)) {
  execFileSync(process.execPath, [npmCli, ...args], { cwd: here, stdio: 'inherit' });
} else {
  // `node setup.mjs` を直接起動したとき。Windows の npm.cmd は shell を通さないと起動できない。
  // 引数は stack.json から組んだパッケージ名と版だけなので、shell に渡しても解釈される文字は無い。
  const win = process.platform === 'win32';
  execFileSync(win ? 'npm.cmd' : 'npm', args, { cwd: here, stdio: 'inherit', shell: win });
}
