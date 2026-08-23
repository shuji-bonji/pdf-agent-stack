#!/usr/bin/env node
/**
 * stack.json を実測から生成し、CI では npm と突き合わせる。
 *
 * **正典は npm**（公開されている版）。ローカルの git tag / package.json は
 * 「手元が公開版より進んでいないか」を見るための参考値でしかない。
 * CI にはローカルの clone が無いので、**照合は npm だけで完結する**ように分けてある。
 *
 *   node scripts/generate-stack.mjs            # 生成（手元）
 *   node scripts/generate-stack.mjs --check    # 照合のみ（CI）。ずれていれば exit 1
 *   node scripts/generate-stack.mjs --readme   # README.md の表を差し替え
 *   node scripts/generate-stack.mjs --root /path/to/pdf-agent-stack
 *
 * 依存なし（Node 20+）。
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

/** 束ねディレクトリ（scripts/ の 1 つ上）。CI では clone が無くても動く */
const ROOT = resolve(value('root', join(HERE, '..')));
const STACK_FILE = join(ROOT, 'stack.json');
const README_FILE = join(ROOT, 'README.md');

/**
 * 構成の台帳 —— **ここだけが手で書く場所**。
 *
 * 2 軸で分類する（`Document-Note/mcps/PDFfamily/specs/19` の層構造 + 配布形態）:
 *   layer  役割     canon / structure / judgment / action / procedure / orchestration / evaluation / hub
 *   form   配布形態 mcp-server / library / skill / plugin / app / site / marketplace
 *
 * **「誰が起動するか」が form を決める**:
 *   mcp-server = LLM が呼ぶ / library = 開発者のコードが import する
 *   app        = 人・シェル・CI が起動する / skill = LLM が読む
 */
const REGISTRY = [
  { name: 'pdf-spec-mcp',          dir: 'mcp/pdf-spec-mcp',            npm: '@shuji-bonji/pdf-spec-mcp',    layer: 'canon',         form: 'mcp-server',  public: true },
  { name: 'pdf-reader-mcp',        dir: 'mcp/pdf-reader-mcp',          npm: '@shuji-bonji/pdf-reader-mcp',  layer: 'structure',     form: 'mcp-server',  public: true },
  { name: 'pdf-verify-mcp',        dir: 'mcp/pdf-verify-mcp',          npm: '@shuji-bonji/pdf-verify-mcp',  layer: 'judgment',      form: 'mcp-server',  public: true },
  { name: 'pdf-writer-mcp',        dir: 'mcp/pdf-writer-mcp',          npm: '@shuji-bonji/pdf-writer-mcp',  layer: 'action',        form: 'mcp-server',  public: true },
  { name: 'pdf-constraints',       dir: 'lib/pdf-constraints',         npm: '@shuji-bonji/pdf-constraints', layer: 'judgment',      form: 'library',     public: true },
  { name: 'normativepdf',          dir: 'lib/normativepdf',            npm: 'normativepdf',                 layer: 'action',        form: 'library',     public: true,  note: '段階 0（COS + パーサ）。verify 0.15.0 が第 1 消費者 = revision-diff の歩行層' },
  { name: 'pdf-trust-skill',       dir: 'skill/pdf-trust-skill',       npm: null,                           layer: 'procedure',     form: 'skill',       public: true },
  { name: 'pdf-publish-skill',     dir: 'skill/pdf-publish-skill',     npm: null,                           layer: 'procedure',     form: 'skill',       public: true },
  { name: 'pdf-read-skill',        dir: 'skill/pdf-read-skill',        npm: null,                           layer: 'procedure',     form: 'skill',       public: true,  note: '読み取り。前提 = pdf-reader-mcp v0.12.0+' },
  { name: 'pdf-specialist-plugin', dir: 'agent/pdf-specialist-plugin', npm: null,                           layer: 'orchestration', form: 'plugin',      public: true },
  { name: 'pdf-agent-pipeline',    dir: 'agent/pdf-agent-pipeline',    npm: null,                           layer: 'orchestration', form: 'app',         public: false, note: 'private: true。runAudit() 切り出しでライブラリ化予定' },
  { name: 'pdf-agent-stack',       dir: '.',                           npm: null,                           layer: 'hub',           form: 'site',        public: false, note: '本リポジトリ。site/ に VitePress' },
];

/** 外部にあり、この束ねの配下に置かないもの（参照だけ残す） */
const EXTERNAL = [
  { name: 'claude-plugins', layer: 'distribution', form: 'marketplace', public: true, note: 'PDF 専用ではないので束ねの外' },
];

const sh = (cmd, cmdArgs, opts = {}) => {
  try {
    return execFileSync(cmd, cmdArgs, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 60_000, ...opts }).trim();
  } catch {
    return null;
  }
};

/** npm の公開版。**これが正典** */
const npmVersion = (pkg) => (pkg ? sh('npm', ['view', pkg, 'version']) : null);

/** ローカルの版。clone が無ければ null（CI ではこれが全部 null になる） */
function localState(entry) {
  const dir = join(ROOT, entry.dir);
  if (!existsSync(dir)) return { present: false, version: null, tag: null, dirty: null };

  // package.json（MCP / ライブラリ / アプリ）→ 無ければ plugin.json（Skill / plugin）
  let version = null;
  for (const file of ['package.json', 'plugin.json', '.claude-plugin/plugin.json']) {
    const p = join(dir, file);
    if (!existsSync(p)) continue;
    try {
      version = JSON.parse(readFileSync(p, 'utf8')).version ?? null;
      if (version) break;
    } catch {
      /* 壊れていれば次を試す */
    }
  }

  const tag = sh('git', ['-C', dir, 'describe', '--tags', '--abbrev=0']);
  const status = sh('git', ['-C', dir, 'status', '--porcelain']);
  const unpushed = sh('git', ['-C', dir, 'log', '--oneline', '@{u}..HEAD']);
  return {
    present: true,
    version,
    tag,
    dirty: status === null ? null : status.length > 0,
    unpushedCommits: unpushed === null ? null : (unpushed ? unpushed.split('\n').length : 0),
  };
}

/**
 * 一致の判定。**「ずれ」と「まだ測っていない」を混ぜない**。
 * 測れなかったものを一致扱いにすると、指標が空振りする（eval で 9 回学んだ）。
 */
function consistencyOf(entry, npmVer, local) {
  if (!entry.npm) return { status: 'not_published', detail: 'npm 未公開のため照合対象外' };
  if (npmVer === null) return { status: 'not_measured', detail: 'npm view が応答しなかった' };
  if (!local.present) return { status: 'npm_only', detail: `npm ${npmVer}（ローカル未確認）` };
  if (local.version === null) return { status: 'not_measured', detail: 'ローカルの version を読めなかった' };
  if (local.version === npmVer) return { status: 'match', detail: `${npmVer}` };
  return { status: 'drift', detail: `npm ${npmVer} ≠ local ${local.version}` };
}

function build() {
  const repos = REGISTRY.map((entry) => {
    const npmVer = npmVersion(entry.npm);
    const local = localState(entry);
    return {
      name: entry.name,
      dir: entry.dir,
      npm: entry.npm,
      layer: entry.layer,
      form: entry.form,
      public: entry.public,
      ...(entry.note ? { note: entry.note } : {}),
      published: npmVer,
      local: local.present ? { version: local.version, tag: local.tag, dirty: local.dirty, unpushedCommits: local.unpushedCommits } : null,
      consistency: consistencyOf(entry, npmVer, local),
    };
  });

  return {
    $comment: [
      'PDF Agent Stack の構成表。**手で書くのは scripts/generate-stack.mjs の REGISTRY だけ**。',
      '版は実測（npm view / ローカルの package.json・git tag）で、推測は書かない。',
      '正典は npm（published）。local は「手元が公開版より進んでいないか」の参考値。',
      'layer = 役割 / form = 配布形態（誰が起動するか）。2 軸で見ると、同じ役割を違う形態で',
      '実装したもの（pdf-specialist = plugin / pdf-agent-pipeline = app）が並べて見える。',
    ],
    generatedAt: new Date().toISOString(),
    generatedBy: 'scripts/generate-stack.mjs',
    npmScope: '@shuji-bonji',
    repos,
    external: EXTERNAL,
  };
}

const LABEL = {
  match: '一致', drift: '⚠ ずれ', not_measured: '未測定', npm_only: 'npm のみ', not_published: '未公開',
};

function printSummary(stack) {
  const w = (s, n) => String(s ?? '—').padEnd(n, ' ');
  console.log(`# stack.json（${stack.generatedAt}）\n`);
  console.log(`  ${w('リポジトリ', 24)} ${w('layer', 14)} ${w('form', 12)} ${w('npm', 9)} ${w('local', 9)} 照合`);
  for (const r of stack.repos) {
    console.log(
      `  ${w(r.name, 24)} ${w(r.layer, 14)} ${w(r.form, 12)} ${w(r.published, 9)} ${w(r.local?.version, 9)} ${LABEL[r.consistency.status]}`,
    );
  }
  const drift = stack.repos.filter((r) => r.consistency.status === 'drift');
  const unmeasured = stack.repos.filter((r) => r.consistency.status === 'not_measured');
  const dirty = stack.repos.filter((r) => r.local?.dirty);
  const unpushed = stack.repos.filter((r) => r.local?.unpushedCommits > 0);
  console.log();
  if (drift.length) for (const r of drift) console.log(`  ⚠ ${r.name}: ${r.consistency.detail}`);
  if (unmeasured.length) console.log(`  ・未測定 ${unmeasured.length} 件（指標に数えない）`);
  if (dirty.length) console.log(`  ・未コミットの変更: ${dirty.map((r) => r.name).join(', ')}`);
  if (unpushed.length) console.log(`  ・未 push: ${unpushed.map((r) => `${r.name}(${r.local.unpushedCommits})`).join(', ')}`);
}

/** README.md のマーカー間を差し替える（無ければ何もしない） */
function renderReadmeTable(stack) {
  const rows = stack.repos
    .filter((r) => r.layer !== 'hub')
    .map((r) => {
      const ver = r.published ?? r.local?.version ?? '—';
      const npm = r.npm ? `\`${r.npm}\`` : '—';
      return `| [${r.name}](https://github.com/shuji-bonji/${r.name}) | ${r.layer} | ${r.form} | ${ver} | ${npm} |`;
    });
  return [
    '<!-- stack:begin — scripts/generate-stack.mjs が生成。手で編集しない -->',
    '',
    `> 版は実測（${stack.generatedAt.slice(0, 10)} 時点の \`npm view\`）。`,
    '',
    '| リポジトリ | 役割 | 配布形態 | 版 | npm |',
    '| --- | --- | --- | --- | --- |',
    ...rows,
    '',
    '<!-- stack:end -->',
  ].join('\n');
}

function updateReadme(stack) {
  if (!existsSync(README_FILE)) {
    console.log(`\n  README.md が無いので表だけ出力します:\n`);
    console.log(renderReadmeTable(stack));
    return;
  }
  const src = readFileSync(README_FILE, 'utf8');
  const begin = src.indexOf('<!-- stack:begin');
  const end = src.indexOf('<!-- stack:end -->');
  if (begin < 0 || end < 0) {
    console.log('\n  README.md に <!-- stack:begin --> / <!-- stack:end --> が無いので差し替えません。');
    console.log('  以下を貼り付けてください:\n');
    console.log(renderReadmeTable(stack));
    return;
  }
  const next = src.slice(0, begin) + renderReadmeTable(stack) + src.slice(end + '<!-- stack:end -->'.length);
  writeFileSync(README_FILE, next);
  console.log(`\n  README.md の表を更新しました`);
}

// ── 照合モード（CI）──────────────────────────────────────────
// **ローカルの clone を前提にしない。** npm だけで判定する。
if (flag('check')) {
  if (!existsSync(STACK_FILE)) {
    console.error(`stack.json がありません: ${STACK_FILE}`);
    process.exit(2);
  }
  const stack = JSON.parse(readFileSync(STACK_FILE, 'utf8'));
  const problems = [];
  let checked = 0;
  for (const r of stack.repos) {
    if (!r.npm) continue;
    const now = npmVersion(r.npm);
    if (now === null) {
      problems.push({ kind: 'not_measured', name: r.name, detail: 'npm view が応答しなかった' });
      continue;
    }
    checked += 1;
    if (now !== r.published) {
      problems.push({ kind: 'drift', name: r.name, detail: `stack.json ${r.published} ≠ npm ${now}` });
    }
  }
  const drift = problems.filter((p) => p.kind === 'drift');
  const unmeasured = problems.filter((p) => p.kind === 'not_measured');
  console.log(`# stack.json 照合（npm ${checked} 件）`);
  for (const p of problems) console.log(`  ${p.kind === 'drift' ? '⚠' : '・'} ${p.name}: ${p.detail}`);
  if (unmeasured.length) {
    // **測れなかったものを緑にしない。** 判定不能は判定不能として返す
    console.log(`\n  判定不能 ${unmeasured.length} 件 — 指標を信用しない`);
    process.exit(2);
  }
  if (drift.length) {
    console.log(`\n  ずれ ${drift.length} 件 — \`node scripts/generate-stack.mjs\` で更新すること`);
    process.exit(1);
  }
  console.log('\n  すべて一致');
  process.exit(0);
}

// ── 生成モード（手元）────────────────────────────────────────
const stack = build();
writeFileSync(STACK_FILE, `${JSON.stringify(stack, null, 2)}\n`);
printSummary(stack);
console.log(`\n  書き出し: ${STACK_FILE}`);
if (flag('readme')) updateReadme(stack);
