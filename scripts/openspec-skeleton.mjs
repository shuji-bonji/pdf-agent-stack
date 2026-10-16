#!/usr/bin/env node
/**
 * openspec-skeleton.mjs — tools/list から OpenSpec の正本の下書きを起こす。
 *
 * PDF family の各 MCP サーバーに OpenSpec を入れるとき、ツールごとに
 * `openspec/specs/<capability>/spec.md` の初版を起こす。その下書きを、コードの
 * シンボルではなく、サーバーが実際に返す tools/list（名前・description・inputSchema）
 * から作る（計画 docs/specs/31 §3.3。strata の spec-excavate はシンボル単位で
 * 1 サーバー 315 件を出し、ツールの説明は全部 TODO だった）。
 *
 * 出すもの（1 ツール = 1 ファイル。capability はツール名の _ を - にしたもの）:
 *   - front matter（spec_id / kind: tool / introduced_by）
 *   - Purpose: 翻訳メモリ（scripts/i18n/<server>.ja.json の `<tool>|prose`）があれば
 *     その最初の段落、無ければ description の最初の段落
 *   - 001 受け付ける引数: inputSchema の各引数の型・必須・既定値・制約を表にする
 *   - 002 知らない引数を受け付けない: inputSchema.additionalProperties が false のときだけ
 *   - description の全文を HTML コメントで添える（振る舞いの要求を書くときの材料）
 *
 * 出さないもの: 振る舞いの要求。tools/list からは「どう振る舞うか」は分からない。
 * Scenario の THEN は `TODO` のまま出すので、既存のテストを読んで書き、ID をテスト名に
 * 付けてから正本にする。下書きのまま openspec/specs/ に置かないこと
 * （`openspec validate` は通るが、`spec-ids check` は「テストに無い ID」で止まる）。
 *
 * 使い方:
 *   node scripts/openspec-skeleton.mjs <server-dir> --out <dir> [--slug <change>] [--domain <D>] [--tool <name>]...
 *     <server-dir>  例: mcp/pdf-spec-mcp（dist/index.js を node で起動する）
 *     --out         下書きを書くディレクトリ。<out>/<capability>/spec.md
 *     --slug        introduced_by に入れる変更の名前（省くと TODO）
 *     --domain      仕様 ID の領域（例: SPEC）。省くと <server-dir>/openspec/spec-ids.json の domain
 *     --tool        このツールだけ（複数指定可）。省くと全部
 *   <server-dir>/openspec/specs/<capability>/spec.md が既にあるツールは飛ばす。
 *
 * dist が src より古いときは止まる（scripts/dist-freshness.mjs。tools/list が古い dist の
 * ものになるため。pdf-reader-mcp 0.17.0 のリファレンスで実際に起きた）。
 */

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkDistFreshness } from './dist-freshness.mjs';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');

/* ---------------- 引数 ---------------- */

function parseArgs(argv) {
  const o = { tools: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') o.out = argv[++i];
    else if (a === '--slug') o.slug = argv[++i];
    else if (a === '--domain') o.domain = argv[++i];
    else if (a === '--tool') o.tools.push(argv[++i]);
    else if (!a.startsWith('--') && !o.serverDir) o.serverDir = a;
    else throw new Error(`知らない引数: ${a}`);
  }
  if (!o.serverDir || !o.out) {
    throw new Error('使い方: node scripts/openspec-skeleton.mjs <server-dir> --out <dir> [--slug <change>] [--domain <D>] [--tool <name>]...');
  }
  return o;
}

/* ---------------- MCP handshake（生 JSON-RPC over stdio） ---------------- */

function handshake(serverDir) {
  return new Promise((resolveHS, rejectHS) => {
    const p = spawn('node', [join(serverDir, 'dist/index.js')], { cwd: serverDir, stdio: ['pipe', 'pipe', 'pipe'] });
    let stderrTail = '';
    p.stderr.on('data', (d) => {
      stderrTail = (stderrTail + d).slice(-2000);
    });
    const timer = setTimeout(() => {
      p.kill();
      rejectHS(new Error(`handshake timeout (30s)${stderrTail ? `\n--- server stderr ---\n${stderrTail}` : ''}`));
    }, 30_000);
    let buf = '';
    const pending = new Map();
    p.stdout.on('data', (d) => {
      buf += d;
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i);
        buf = buf.slice(i + 1);
        if (!line.trim()) continue;
        let msg;
        try {
          msg = JSON.parse(line);
        } catch {
          continue; // 依存が stdout に漏らす行は読み飛ばす
        }
        if (msg.id != null && pending.has(msg.id)) pending.get(msg.id)(msg);
      }
    });
    p.on('error', rejectHS);
    // 起動の途中で落ちたら（依存が読めないなど）、30 秒待たずにその場で止める
    p.on('exit', (code, signal) => {
      clearTimeout(timer);
      rejectHS(new Error(`サーバーが応答の前に終了した（code ${code}${signal ? `, ${signal}` : ''}）${stderrTail ? `\n--- server stderr ---\n${stderrTail}` : ''}`));
    });
    const send = (m) => p.stdin.write(`${JSON.stringify(m)}\n`);
    const rpc = (id, method, params) =>
      new Promise((res) => {
        pending.set(id, res);
        send({ jsonrpc: '2.0', id, method, params });
      });
    (async () => {
      const init = await rpc(1, 'initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'openspec-skeleton', version: '0.0.1' },
      });
      send({ jsonrpc: '2.0', method: 'notifications/initialized' });
      const tools = await rpc(2, 'tools/list', {});
      clearTimeout(timer);
      p.removeAllListeners('exit');
      p.kill();
      resolveHS({ serverInfo: init.result.serverInfo, tools: tools.result.tools });
    })().catch((e) => {
      clearTimeout(timer);
      p.kill();
      rejectHS(e);
    });
  });
}

/* ---------------- 下書きの組み立て ---------------- */

const capabilityOf = (tool) => tool.replace(/_/g, '-');
const idPrefix = (domain, cap) => `SPEC-${domain}-${cap.toUpperCase()}`;

function firstParagraph(text) {
  const paras = String(text ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  // 「[DEPRECATED …]」のような 1 行の札だけの段落は飛ばす
  return paras.find((p) => !/^\[[^\]]*\]$/.test(p)) ?? '';
}

function typeOf(s) {
  if (!s || typeof s !== 'object') return '?';
  if (s.enum) return s.enum.map((v) => `\`${JSON.stringify(v)}\``).join(' / ');
  if (Array.isArray(s.type)) return s.type.join(' | ');
  if (s.type === 'array') return `${typeOf(s.items)}[]`;
  if (s.anyOf || s.oneOf) return (s.anyOf ?? s.oneOf).map(typeOf).join(' | ');
  return s.type ?? '?';
}

function constraintsOf(s) {
  const c = [];
  if (!s || typeof s !== 'object') return '';
  for (const [k, label] of [
    ['minimum', '最小'],
    ['maximum', '最大'],
    ['exclusiveMinimum', '下限（含まない）'],
    ['exclusiveMaximum', '上限（含まない）'],
    ['minLength', '最小長'],
    ['maxLength', '最大長'],
    ['minItems', '最小件数'],
    ['maxItems', '最大件数'],
  ]) {
    if (s[k] != null) c.push(`${label} ${s[k]}`);
  }
  if (s.pattern) c.push(`形 \`${s.pattern}\``);
  if (s.format) c.push(`format ${s.format}`);
  return c.join('、');
}

const cell = (v) => String(v).replace(/\|/g, '\\|').replace(/\n+/g, ' ');

function renderSpec({ tool, domain, slug, server, version, purpose, purposeSource }) {
  const cap = capabilityOf(tool.name);
  const pre = idPrefix(domain, cap);
  const schema = tool.inputSchema ?? {};
  const props = schema.properties ?? {};
  const required = new Set(schema.required ?? []);
  const names = Object.keys(props);

  let purposeText = purpose.replace(/\s*\n\s*/g, ' ').trim();
  // config.yaml の rules: Purpose は 50 文字以上
  if (purposeText.length < 50) purposeText += `（MCP ツール \`${tool.name}\` の入力と応答を定める）`;

  const L = [];
  L.push('---', `spec_id: ${domain}`, 'kind: tool', `introduced_by: ${slug ?? 'TODO'}`, '---');
  L.push(`# ${cap}`, '', '## Purpose', '', purposeText, '');
  L.push(
    `<!-- 下書き: scripts/openspec-skeleton.mjs が ${server} v${version} の tools/list から起こした。`,
    `     Purpose の出どころ: ${purposeSource}。`,
    '     001・002 は inputSchema に書いてある事実だけ。振る舞いの要求は、既存のテストが固定している',
    '     振る舞いから起こし、THEN の TODO を埋め、ID をテスト名に付けてから正本にする。 -->',
    ''
  );
  L.push('## できないこと', '', '- TODO（このツールがしないこと・ほかのツールやサーバーの仕事）', '');
  L.push('## Requirements', '');

  // 001 受け付ける引数
  L.push(`### Requirement: ${pre}-001 受け付ける引数`, '');
  if (names.length === 0) {
    L.push(`\`${tool.name}\` は引数を取らない（SHALL）。`, '');
  } else {
    const req = names.filter((n) => required.has(n));
    L.push(
      `\`${tool.name}\` は次の引数を受け付ける（SHALL）。` +
        (req.length ? `必須の引数は ${req.map((n) => `\`${n}\``).join('・')} で、` : '必須の引数は無く、') +
        'ほかは省ける（SHALL）。',
      ''
    );
    L.push('| 引数 | 型 | 必須 | 既定値 | 制約 |', '|---|---|---|---|---|');
    for (const n of names) {
      const s = props[n] ?? {};
      L.push(
        `| \`${n}\` | ${cell(typeOf(s))} | ${required.has(n) ? '必須' : '—'} | ${
          s.default !== undefined ? `\`${cell(JSON.stringify(s.default))}\`` : '—'
        } | ${cell(constraintsOf(s) || '—')} |`
      );
    }
    L.push('');
  }
  const firstReq = names.find((n) => required.has(n));
  if (firstReq) {
    L.push(
      `#### Scenario: 必須の引数 ${firstReq} を省くと受け付けない`,
      `- **WHEN** \`${firstReq}\` を渡さずに \`${tool.name}\` を呼ぶ`,
      '- **THEN** TODO（エラーの形を既存のテストから写す）',
      ''
    );
  }
  const firstDefault = names.find((n) => !required.has(n) && props[n]?.default !== undefined);
  if (firstDefault) {
    L.push(
      `#### Scenario: ${firstDefault} を省くと既定値 ${JSON.stringify(props[firstDefault].default)} で動く`,
      `- **WHEN** \`${firstDefault}\` を渡さずに \`${tool.name}\` を呼ぶ`,
      `- **THEN** \`${firstDefault}: ${JSON.stringify(props[firstDefault].default)}\` を渡したときと同じ応答を返す`,
      ''
    );
  }
  if (!firstReq && !firstDefault) {
    L.push(
      '#### Scenario: TODO',
      `- **WHEN** TODO（\`${tool.name}\` を呼ぶ条件）`,
      '- **THEN** TODO',
      ''
    );
  }

  // 002 知らない引数（inputSchema が閉じているときだけ）
  if (schema.additionalProperties === false) {
    L.push(`### Requirement: ${pre}-002 知らない引数を受け付けない`, '');
    L.push(
      `\`${tool.name}\` は、上の表に無い引数を渡されたら受け付けない（SHALL）。inputSchema の additionalProperties は false。`,
      ''
    );
    L.push(
      '#### Scenario: 表に無い引数を渡すと受け付けない',
      `- **WHEN** \`${tool.name}\` に表に無い引数を 1 つ足して呼ぶ`,
      '- **THEN** TODO（エラーの形を既存のテストから写す）',
      ''
    );
  }

  L.push('<!-- description の全文（tools/list の実応答）:', '');
  L.push(String(tool.description ?? '').replace(/-->/g, '--&gt;'));
  L.push('-->', '');
  return L.join('\n');
}

/* ---------------- main ---------------- */

async function main() {
  const o = parseArgs(process.argv.slice(2));
  const serverDir = resolve(o.serverDir);
  if (!existsSync(join(serverDir, 'dist/index.js'))) throw new Error(`${serverDir}/dist/index.js がありません。先に npm run build`);

  const fresh = checkDistFreshness(serverDir);
  if (fresh.missing.length || fresh.stale.length) {
    console.error(`✗ ${serverDir}/dist が src からビルドされていません。npm run build してから実行してください`);
    for (const f of [...fresh.missing, ...fresh.stale].slice(0, 5)) console.error(`    ${f}`);
    process.exit(1);
  }

  let domain = o.domain;
  const cfgPath = join(serverDir, 'openspec/spec-ids.json');
  if (!domain && existsSync(cfgPath)) domain = JSON.parse(readFileSync(cfgPath, 'utf8')).domain;
  if (!domain) throw new Error('--domain を指定してください（openspec/spec-ids.json がまだ無いため）');

  const { serverInfo, tools } = await handshake(serverDir);
  const server = basename(serverDir).replace(/-mcp$/, '');
  const memPath = join(ROOT, 'scripts/i18n', `${server}.ja.json`);
  const memory = existsSync(memPath) ? JSON.parse(readFileSync(memPath, 'utf8')) : {};

  const wanted = o.tools.length ? tools.filter((t) => o.tools.includes(t.name)) : tools;
  const unknown = o.tools.filter((n) => !tools.some((t) => t.name === n));
  if (unknown.length) throw new Error(`tools/list に無いツール: ${unknown.join(', ')}`);

  console.log(`${serverInfo.name} v${serverInfo.version} — tools/list ${tools.length} 件、下書きの対象 ${wanted.length} 件`);
  let wrote = 0;
  for (const tool of wanted) {
    const cap = capabilityOf(tool.name);
    if (existsSync(join(serverDir, 'openspec/specs', cap, 'spec.md'))) {
      console.log(`  skip ${cap}（正本がある）`);
      continue;
    }
    const ja = memory[`${tool.name}|prose`]?.text;
    const purpose = firstParagraph(ja) || firstParagraph(tool.description);
    const purposeSource = ja ? `翻訳メモリ scripts/i18n/${server}.ja.json の ${tool.name}|prose（原文と同期しているかは確かめていない）` : 'tools/list の description（英語）';
    const text = renderSpec({ tool, domain, slug: o.slug, server: serverInfo.name, version: serverInfo.version, purpose, purposeSource });
    const out = join(resolve(o.out), cap, 'spec.md');
    mkdirSync(join(resolve(o.out), cap), { recursive: true });
    writeFileSync(out, text);
    wrote++;
    console.log(`  wrote ${out}`);
  }
  console.log(`${wrote} 件を書いた。THEN の TODO を埋め、ID をテスト名に付けてから openspec/specs/ へ移すこと`);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
