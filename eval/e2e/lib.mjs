/**
 * E2E の部品: サーバーの起動・呼び出し・検体の PDF。
 *
 * どのサーバーを起動するか:
 * - 既定: `npm run setup` が stack.json の公開版を入れた `node_modules/@shuji-bonji/<name>`
 * - `PDF_E2E_LOCAL=1`: このリポジトリの `mcp/<name>`（手元でビルドした dist）
 * - `PDF_E2E_<KEY>_DIR=<dir>`: そのサーバーだけ別の置き場（dist と node_modules を持つ dir）
 *   KEY は READER / WRITER / VERIFY / SPEC
 */
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const STACK_ROOT = join(HERE, '..', '..');

export const SERVERS = {
  reader: 'pdf-reader-mcp',
  writer: 'pdf-writer-mcp',
  verify: 'pdf-verify-mcp',
  spec: 'pdf-spec-mcp',
};

/** サーバーの置き場（dist/index.js と node_modules を持つ dir） */
export function serverDir(key) {
  const override = process.env[`PDF_E2E_${key.toUpperCase()}_DIR`];
  if (override) return override;
  if (process.env.PDF_E2E_LOCAL) return join(STACK_ROOT, 'mcp', SERVERS[key]);
  return join(HERE, 'node_modules', '@shuji-bonji', SERVERS[key]);
}

/** どの版を起動しているか（報告用） */
export function serverVersion(key) {
  const require = createRequire(join(serverDir(key), 'package.json'));
  return require(join(serverDir(key), 'package.json')).version;
}

/**
 * サーバーを stdio で起動し、`call(name, args)` を持つ接続を返す。
 * `call` は `{ isError, text, json }` を返す（json は本文が JSON のときだけ）。
 */
export async function start(key, env = {}) {
  const client = new Client({ name: 'pdf-agent-stack-e2e', version: '0' });
  const merged = { ...process.env, ...env };
  for (const [k, v] of Object.entries(merged)) if (v === undefined) delete merged[k];
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [join(serverDir(key), 'dist', 'index.js')],
      env: merged,
      stderr: 'ignore',
    }),
  );
  return {
    async call(name, args) {
      const result = await client.callTool({ name, arguments: args });
      const text = result.content.find((c) => c.type === 'text')?.text ?? '';
      let json;
      try {
        json = JSON.parse(text);
      } catch {
        json = undefined;
      }
      return {
        isError: result.isError === true,
        text,
        json,
        kinds: result.content.map((c) => c.type),
      };
    },
    /** `tools/list` の応答の tools（名前と inputSchema を持つ） */
    async listTools() {
      return (await client.listTools()).tools;
    },
    close: () => client.close(),
  };
}

/** 使い捨ての作業フォルダー。`done()` で消す */
export function workDir(prefix) {
  const dir = mkdtempSync(join(tmpdir(), `pdf-e2e-${prefix}-`));
  return { dir, done: () => rmSync(dir, { recursive: true, force: true }) };
}

/** n ページの最小の PDF（相互参照表つき） */
export function minimalPdf(pages = 1) {
  const objs = [
    '<</Type/Catalog/Pages 2 0 R>>',
    `<</Type/Pages/Kids[${Array.from({ length: pages }, (_, i) => `${3 + i} 0 R`).join(' ')}]/Count ${pages}>>`,
  ];
  for (let i = 0; i < pages; i++) objs.push('<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>');
  let s = '%PDF-1.4\n';
  const offsets = [];
  objs.forEach((o, i) => {
    offsets.push(s.length);
    s += `${i + 1} 0 obj${o}endobj\n`;
  });
  const xref = s.length;
  s += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  s += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  return `${s}trailer<</Root 1 0 R/Size ${objs.length + 1}>>\nstartxref\n${xref}\n%%EOF\n`;
}

export function writeMinimalPdf(path, pages = 1) {
  writeFileSync(path, minimalPdf(pages));
}

/**
 * reader が解決する `@hyzyla/pdfium` の置き場。入っていなければ null。
 * パッケージの `exports` が `package.json` を公開していないので、本体を解決してから
 * `package.json` のあるフォルダーまで上へたどる。
 */
export function pdfiumDir() {
  let entry;
  try {
    const require = createRequire(join(serverDir('reader'), 'package.json'));
    entry = require.resolve('@hyzyla/pdfium');
  } catch {
    return null;
  }
  for (let dir = dirname(entry); dir !== dirname(dir); dir = dirname(dir)) {
    if (existsSync(join(dir, 'package.json')) && dir.endsWith(join('@hyzyla', 'pdfium'))) return dir;
  }
  return null;
}

/** writer に日本語フォントを渡さない（ASCII の本文だけを使う）環境 */
export const WRITER_ENV = { PDF_WRITER_FONT: undefined };
