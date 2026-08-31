#!/usr/bin/env node
/**
 * Skill が分岐に使うフィールドが、サーバの応答に**実在するか**を実測する。
 *
 * ## なぜ要るか
 *
 * Skill は MCP サーバの応答の形に依存している。サーバの版が上がって形が変わると、
 * Skill の分岐は**落ちずに素通りする** —— 例外にはならず、条件が false になるだけである。
 *
 * 実例（2026-08-31）: `pdf-read` の Phase 1 は `metadata.isEncrypted` が true なら
 * 停止すると書いてあった。reader 0.14.0 は、利用者パスワード付きの文書で
 * **`metadata` を丸ごと `null` にする**（鍵が導けず pdfjs が開けないため。§7.6.4.3.2）。
 * その結果この分岐は一度も発火しなくなったが、**何も落ちなかった**。
 *
 * Skill の `evals/` が測っているのは発火（この文でこの Skill が呼ばれるか）だけで、
 * サーバとの契約は測っていない。ここがその対になる。
 *
 * ## 何を測るか
 *
 * 下の CONTRACTS は、**SKILL.md に書いてある分岐と 1 対 1 で対応**している。
 * 各行が「どの Skill の・どの段の・何を根拠にした分岐か」を名乗るので、落ちた行を見れば
 * どの手順が成り立たなくなったかが分かる。数を増やすことより、
 * **落ちた行から SKILL.md の該当箇所に行けること**を優先する。
 *
 * 🔴 検体はここにバイト列で持つ。外部のコーパスや qpdf を要求すると、
 * それが無い環境で**検査が飛ばされる**（飛ばされた検査は「通った」ではない）。
 *
 * ## この検査自体を壊して確かめた（T-3）
 *
 * 壊す先が無い検査は何も測っていない。ここは版を下げることで壊せる。
 *
 *   node scripts/skill-contract-probe.mjs                    → 30 件とも実在した（reader 0.14.0）
 *   node scripts/skill-contract-probe.mjs --published 0.13.0 → 🔴 16 件が実在しない（30 件中）
 *
 * 0.13.0 で落ちた 16 件は、`scope` を持たない版で pdf-read / pdf-publish の
 * どの段が成り立たなくなるかをそのまま名指しする。逆に言えば、0.14.0 で
 * 直した箇所と 1 対 1 で対応している。
 *
 * ## 使い方
 *
 *   node scripts/skill-contract-probe.mjs                 # 手元の mcp/<server>/dist を使う
 *   node scripts/skill-contract-probe.mjs --published     # npm の公開版（latest）を使う
 *   node scripts/skill-contract-probe.mjs --published 0.13.0  # 版を指定する
 *
 * mcp/ と skill/ はこのリポジトリでは追跡していないので、CI は `--published` で回す。
 * CI が測っているのは「いま npm にある版で、SKILL.md の手順が成り立つか」である。
 *
 * 終了コード: 0 = 全部実在した / 1 = 実在しないものがある / 2 = 検査を回せなかった
 */

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
let usePublished = false;
/** `--published` は既定で latest。版を書けばその版で回す（利用者が掴んでいる版で試せる）。 */
let publishedRange = 'latest';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--published') {
    usePublished = true;
    if (args[i + 1] && !args[i + 1].startsWith('--')) publishedRange = args[++i];
  } else {
    console.error(`知らない引数: ${args[i]}\n使い方: node scripts/skill-contract-probe.mjs [--published [<版>]]`);
    process.exit(2);
  }
}

/**
 * 検体。`scripts/golden-specimens-halves.mjs`（pdf-reader-mcp）が作るものと同じバイト列で、
 * sha が合わなくなったらどちらかが動いたということ。
 */
const SPECIMENS = {
  okOk: {
    name: 'halves-ok-ok-page2-unobserved.pdf',
    note: '抽出も観測もできる。2 ページ目だけ内容ストリームが読めない',
    sha256: 'ffd6e5b0a63087a87d0443911f95beaf',
    base64:
      'JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUiA1IDAgUl0gL0NvdW50IDIgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA1OTUgODQyXSAvUmVzb3VyY2VzIDw8IC9Gb250IDw8IC9GMSA3IDAgUiA+PiA+PiAvQ29udGVudHMgNCAwIFIgPj4KZW5kb2JqCjQgMCBvYmoKPDwgL0xlbmd0aCA0OSA+PgpzdHJlYW0KQlQgL0YxIDEyIFRmIDcyIDcyMCBUZCAoUGFnZSBvbmUgaGFzIHRleHQpIFRqIEVUCgplbmRzdHJlYW0KZW5kb2JqCjUgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA1OTUgODQyXSAvUmVzb3VyY2VzIDw8IC9Gb250IDw8IC9GMSA3IDAgUiA+PiA+PiAvQ29udGVudHMgNiAwIFIgPj4KZW5kb2JqCjYgMCBvYmoKPDwgL0ZpbHRlciAvRmxhdGVEZWNvZGUgL0xlbmd0aCAyMyA+PgpzdHJlYW0Kbm90LWRlZmxhdGUtZGF0YS1hdC1hbGwKZW5kc3RyZWFtCmVuZG9iago3IDAgb2JqCjw8IC9UeXBlIC9Gb250IC9TdWJ0eXBlIC9UeXBlMSAvQmFzZUZvbnQgL0hlbHZldGljYSA+PgplbmRvYmoKeHJlZgowIDgKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNjQgMDAwMDAgbiAKMDAwMDAwMDEyNyAwMDAwMCBuIAowMDAwMDAwMjUzIDAwMDAwIG4gCjAwMDAwMDAzNTIgMDAwMDAgbiAKMDAwMDAwMDQ3OCAwMDAwMCBuIAowMDAwMDAwNTcyIDAwMDAwIG4gCnRyYWlsZXIKPDwgL1NpemUgOCAvUm9vdCAxIDAgUiA+PgpzdGFydHhyZWYKNjQyCiUlRU9GCg==',
  },
  okFail: {
    name: 'halves-ok-fail-header.pdf',
    note: 'ヘッダが "%PDF-" で版が無い。抽出はできるが観測が止まる',
    sha256: '1ea2bc609416ad1875f13b841bb919fa',
    base64:
      'JVBERi0KJeLjz9MKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA1OTUgODQyXSAvUmVzb3VyY2VzIDw8IC9Gb250IDw8IC9GMSA1IDAgUiA+PiA+PiAvQ29udGVudHMgNCAwIFIgPj4KZW5kb2JqCjQgMCBvYmoKPDwgL0xlbmd0aCA1OSA+PgpzdHJlYW0KQlQgL0YxIDEyIFRmIDcyIDcyMCBUZCAoT25lIHBhZ2Ugd2l0aCByZWFkYWJsZSB0ZXh0KSBUaiBFVAoKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8IC9UeXBlIC9Gb250IC9TdWJ0eXBlIC9UeXBlMSAvQmFzZUZvbnQgL0hlbHZldGljYSA+PgplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEyIDAwMDAwIG4gCjAwMDAwMDAwNjEgMDAwMDAgbiAKMDAwMDAwMDExOCAwMDAwMCBuIAowMDAwMDAwMjQ0IDAwMDAwIG4gCjAwMDAwMDAzNTMgMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSA2IC9Sb290IDEgMCBSID4+CnN0YXJ0eHJlZgo0MjMKJSVFT0YK',
  },
  failOk: {
    name: 'halves-fail-ok-password.pdf',
    note: '空でない利用者パスワード付き（§7.6.4.3.2 で鍵が導けない）。抽出は止まるが観測はできる',
    sha256: '600979071ac725c14ce803bad7b17430',
    base64:
      'JVBERi0xLjcKJb/3ov4KMSAwIG9iago8PCAvUGFnZXMgMiAwIFIgL1R5cGUgL0NhdGFsb2cgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL0NvdW50IDEgL0tpZHMgWyAzIDAgUiBdIC9UeXBlIC9QYWdlcyA+PgplbmRvYmoKMyAwIG9iago8PCAvQ29udGVudHMgNCAwIFIgL01lZGlhQm94IFsgMCAwIDU5NSA4NDIgXSAvUGFyZW50IDIgMCBSIC9SZXNvdXJjZXMgPDwgL0ZvbnQgPDwgL0YxIDUgMCBSID4+ID4+IC9UeXBlIC9QYWdlID4+CmVuZG9iago0IDAgb2JqCjw8IC9MZW5ndGggNjUgL0ZpbHRlciAvRmxhdGVEZWNvZGUgPj4Kc3RyZWFtCrce4tXxLn+U0PwplZNqM42P0db8GIKBO/oVNVJECOZhpjVD0ay8x2y1FwNMvvBW/kIVeO2ndXVJTJmYwMXX02udZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8IC9CYXNlRm9udCAvSGVsdmV0aWNhIC9TdWJ0eXBlIC9UeXBlMSAvVHlwZSAvRm9udCA+PgplbmRvYmoKNiAwIG9iago8PCAvRmlsdGVyIC9TdGFuZGFyZCAvTGVuZ3RoIDEyOCAvTyA8Mzg0YTE2ZGJjNDIyMTYzZTE3NGEyNjhhOGMwODNjOTg3YTlkNWY0ZTQ5NWQwMzUyMzYzOTBiZDYxOTlmOGQzND4gL1AgLTQgL1IgMyAvVSA8MDYyOTFmNjZmOTcyM2ViMGU3ODM5M2RhODJiNmQwOWYwMTIyNDU2YTkxYmFlNTEzNDI3M2E2ZGIxMzRjODdjND4gL1YgMiA+PgplbmRvYmoKeHJlZgowIDcKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNjQgMDAwMDAgbiAKMDAwMDAwMDEyMyAwMDAwMCBuIAowMDAwMDAwMjUxIDAwMDAwIG4gCjAwMDAwMDAzODYgMDAwMDAgbiAKMDAwMDAwMDQ1NiAwMDAwMCBuIAp0cmFpbGVyIDw8IC9Sb290IDEgMCBSIC9TaXplIDcgL0lEIFs8MzE0MTU5MjY1MzU4OTc5MzIzODQ2MjY0MzM4MzI3OTU+PDMxNDE1OTI2NTM1ODk3OTMyMzg0NjI2NDMzODMyNzk1Pl0gL0VuY3J5cHQgNiAwIFIgPj4Kc3RhcnR4cmVmCjY2MwolJUVPRgo=',
  },
  failFail: {
    name: 'halves-fail-fail-no-objects.pdf',
    note: '%PDF- も間接オブジェクトも無い。どちらの読み手も開けない',
    sha256: '5aa1144699b1ffe99640b53a53bd431b',
    base64:
      'JSFOb3QtQS1QREYtQXQtQWxsClRoaXMgZmlsZSBoYXMgbm8gUERGIGhlYWRlciBhbmQgbm8gaW5kaXJlY3Qgb2JqZWN0cy4KVGhlcmUgaXMgbm90aGluZyBoZXJlIGZvciBlaXRoZXIgcmVhZGVyIHRvIHJlY29uc3RydWN0Lgo=',
  },
};

/**
 * 契約。**SKILL.md の分岐と 1 対 1**。
 *
 * `where` は落ちたときに開く場所、`why` はその分岐が何をしているか。
 * `expect` は「実在すること」の主張で、値そのものを固定しない —— 値の凍結は
 * 各サーバのゴールデンの仕事で、ここが見るのは**分岐の材料が在るか**である。
 * ただし分岐が値で決まるもの（`code` が `ENCRYPTED_PDF` かどうか等）は値まで見る。
 */
const CONTRACTS = [
  // ---- pdf-read ----
  {
    skill: 'pdf-read',
    where: 'SKILL.md Phase 0 の表',
    why: '文書の性質を測って経路を選ぶ',
    server: 'pdf-reader-mcp',
    specimen: 'okOk',
    call: { tool: 'summarize', args: { response_format: 'json' } },
    expect: [
      { path: 'metadata.pageCount', kind: 'number' },
      { path: 'metadata.isEncrypted', kind: 'boolean' },
      { path: 'metadata.isTagged', kind: 'boolean' },
      { path: 'textExtractability', kind: 'string' },
      { path: 'unreadablePages', kind: 'array' },
      { path: 'next', kind: 'array' },
    ],
  },
  {
    skill: 'pdf-read',
    where: 'SKILL.md Phase 0「数字より先に scope を読む」',
    why: '行われなかった読みを、行われて 0 だった読みと見分ける',
    server: 'pdf-reader-mcp',
    specimen: 'okOk',
    call: { tool: 'summarize', args: { response_format: 'json' } },
    expect: [
      { path: 'scope.metadata.status', kind: 'string' },
      { path: 'scope.textPreview.status', kind: 'string' },
      { path: 'scope.imageCount.status', kind: 'string' },
      { path: 'scope.extractabilityObservation.status', kind: 'string' },
    ],
  },
  {
    skill: 'pdf-read',
    where: 'SKILL.md Phase 1「isEncrypted: true、または scope.metadata.code が ENCRYPTED_PDF」',
    why: '暗号化文書で停止する。🔴 2026-08-31: metadata が null になり、isEncrypted だけを見ていた版はここを素通りしていた',
    server: 'pdf-reader-mcp',
    specimen: 'failOk',
    call: { tool: 'summarize', args: { response_format: 'json' } },
    expect: [
      { path: 'metadata', kind: 'null' },
      { path: 'scope.metadata.code', equals: 'ENCRYPTED_PDF' },
    ],
  },
  {
    skill: 'pdf-read',
    where: 'SKILL.md Phase 0「textExtractability が null なら読めるとも読めないとも言えない」',
    why: '観測が行われなかったことを、観測して extracted でなかったことと分ける',
    server: 'pdf-reader-mcp',
    specimen: 'okFail',
    call: { tool: 'summarize', args: { response_format: 'json' } },
    expect: [
      { path: 'scope.extractabilityObservation.status', equals: 'failed' },
      { path: 'textExtractability', kind: 'null' },
      { path: 'unreadablePages', kind: 'null' },
    ],
  },
  {
    skill: 'pdf-read',
    where: 'SKILL.md Phase 3「read_text に明示の pages を渡して読む」',
    why: '本文を読む。text が null か空文字かで「取り出せなかった」と「0 字だった」を分ける',
    server: 'pdf-reader-mcp',
    specimen: 'failOk',
    call: { tool: 'read_text', args: { response_format: 'json' } },
    expect: [
      { path: 'scope.textExtraction.status', equals: 'failed' },
      { path: 'pages.0.text', kind: 'null' },
      { path: 'pages.0.extractability.state', kind: 'string' },
    ],
  },
  {
    skill: 'pdf-read',
    where: 'SKILL.md Phase 3「search_text が 0 件のときは unsearchablePages / note を読む」',
    why: '探せなかったことを 0 件と混同しない',
    server: 'pdf-reader-mcp',
    specimen: 'failOk',
    call: { tool: 'search_text', args: { query: 'a', response_format: 'json' } },
    expect: [{ path: 'totalMatches', kind: 'null' }, { path: 'matches', kind: 'null' }],
  },
  {
    skill: 'pdf-read',
    where: 'SKILL.md Phase 4「render_page に pages を明示して呼ぶ」',
    why: 'テキストとして読めないページを画像で読む',
    server: 'pdf-reader-mcp',
    specimen: 'okOk',
    call: { tool: 'render_page', args: { pages: '1', dpi: 36 }, text: true },
    expect: [{ path: '_blocks', contains: 'image' }],
  },

  // ---- pdf-publish ----
  {
    skill: 'pdf-publish',
    where: 'SKILL.md Phase 2「まず scope を読む」',
    why: '読み戻せていないのに読み戻し済みと名乗らない',
    server: 'pdf-reader-mcp',
    specimen: 'okOk',
    call: { tool: 'read_text', args: { response_format: 'json' } },
    expect: [
      { path: 'scope.textExtraction.status', kind: 'string' },
      { path: 'pages.0.text', kind: 'string' },
    ],
  },
  {
    skill: 'pdf-publish',
    where: 'SKILL.md Phase 2-3「inspect_fonts でフォントが埋め込まれているか」',
    why: 'conformance 水準では必須の観測',
    server: 'pdf-reader-mcp',
    specimen: 'okOk',
    call: { tool: 'inspect_fonts', args: { response_format: 'json' } },
    expect: [{ path: 'fonts', kind: 'array' }, { path: 'embeddedCount', kind: 'number' }],
  },
  {
    skill: 'pdf-publish',
    where: 'SKILL.md Phase 2-4「inspect_tags で構造木が意図どおりか」',
    why: 'タグ付き出力の照合',
    server: 'pdf-reader-mcp',
    specimen: 'okOk',
    call: { tool: 'inspect_tags', args: { response_format: 'json' } },
    expect: [{ path: 'isTagged', kind: 'boolean' }],
  },

  // ---- pdf-trust ----
  {
    skill: 'pdf-trust',
    where: 'SKILL.md 前提 MCP「署名フィールド構造・メタデータ」',
    why: '署名フィールドを構造側から確認する',
    server: 'pdf-reader-mcp',
    specimen: 'okOk',
    call: { tool: 'inspect_signatures', args: { response_format: 'json' } },
    expect: [{ path: 'totalFields', kind: 'number' }, { path: 'fields', kind: 'array' }],
  },
  {
    skill: 'pdf-trust',
    where: 'SKILL.md Phase「locate_objects にオブジェクト番号を渡す」',
    why: '変わったオブジェクトをページと矩形に落とす',
    server: 'pdf-reader-mcp',
    specimen: 'okOk',
    call: { tool: 'locate_objects', args: { object_numbers: [1, 2], response_format: 'json' } },
    expect: [{ path: 'objects', kind: 'array' }, { path: 'objects.0.found', kind: 'boolean' }],
  },
];

/* ---------------- 実行 ---------------- */

const sha = (b) => createHash('sha256').update(b).digest('hex').slice(0, 32);
const scratch = mkdtempSync(join(tmpdir(), 'skill-contract-'));
const files = {};
for (const [key, s] of Object.entries(SPECIMENS)) {
  const bytes = Buffer.from(s.base64, 'base64');
  if (sha(bytes) !== s.sha256) {
    console.error(`🔴 検体のバイト列が変わっている: ${s.name}（この検査が測るものも変わった）`);
    process.exit(2);
  }
  const p = join(scratch, s.name);
  writeFileSync(p, bytes);
  files[key] = p;
}

/** サーバの入口を決める。手元の dist を優先し、--published なら npm から入れる。 */
function serverEntry(name) {
  const local = join(ROOT, 'mcp', name, 'dist/index.js');
  if (!usePublished && existsSync(local)) return { entry: local, from: `mcp/${name}/dist` };
  const dir = join(scratch, 'node_modules', '@shuji-bonji', name);
  if (!existsSync(dir)) {
    writeFileSync(join(scratch, 'package.json'), '{"name":"probe","private":true}\n');
    execFileSync(
      'npm',
      ['install', '--silent', '--no-fund', '--no-audit', '--prefix', scratch, `@shuji-bonji/${name}@${publishedRange}`],
      { stdio: 'inherit' },
    );
  }
  return { entry: join(dir, 'dist/index.js'), from: `npm @shuji-bonji/${name}@${publishedRange}` };
}

function at(value, path) {
  let cur = value;
  for (const key of path.split('.')) {
    if (cur == null) return undefined;
    cur = cur[key];
  }
  return cur;
}

function kindOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (v === undefined) return 'absent';
  return typeof v;
}

/**
 * stdio の JSON-RPC を直に話す。**SDK には依存しない** ——
 * この束ねリポジトリに node_modules は無く、`generate-reference.mjs` も同じ理由で
 * 生の JSON-RPC を話している。ここで SDK を入れると、検査が動く条件が増える。
 */
function startServer(entry) {
  const p = spawn(process.execPath, [entry], { stdio: ['pipe', 'pipe', 'pipe'] });
  let stderrTail = '';
  p.stderr.on('data', (d) => {
    stderrTail = (stderrTail + d).slice(-2000);
  });
  let buf = '';
  const pending = new Map();
  // stdout に非 JSON の行が混じることがある（ネイティブ拡張の警告）。落とさず読み飛ばす。
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
        continue;
      }
      if (msg.id != null && pending.has(msg.id)) {
        const { resolve: r, timer } = pending.get(msg.id);
        clearTimeout(timer);
        pending.delete(msg.id);
        r(msg);
      }
    }
  });

  let nextId = 1;
  const rpc = (method, params, ms = 60_000) =>
    new Promise((res, rej) => {
      const id = nextId++;
      const timer = setTimeout(() => {
        pending.delete(id);
        rej(new Error(`${method} が ${ms} ms で返らなかった${stderrTail ? `\n${stderrTail.slice(-300)}` : ''}`));
      }, ms);
      pending.set(id, { resolve: res, timer });
      p.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
    });

  return {
    async handshake() {
      const init = await rpc('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'skill-contract-probe', version: '0' },
      }, 20_000);
      p.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })}\n`);
      const tools = await rpc('tools/list', {}, 20_000);
      return { serverInfo: init.result?.serverInfo, tools: tools.result?.tools ?? [] };
    },
    async call(name, args) {
      const r = await rpc('tools/call', { name, arguments: args });
      if (r.error) throw new Error(`${r.error.code}: ${r.error.message}`);
      return r.result ?? {};
    },
    close() {
      p.kill();
    },
  };
}

const servers = new Map();
async function serverFor(name) {
  if (servers.has(name)) return servers.get(name);
  const { entry, from } = serverEntry(name);
  if (!existsSync(entry)) {
    console.error(`🔴 ${name} の入口が無い: ${entry}`);
    process.exit(2);
  }
  const s = startServer(entry);
  const info = await s.handshake();
  console.log(`  ${name} v${info.serverInfo?.version ?? '?'}: ${info.tools.length} ツール（${from}）`);
  servers.set(name, s);
  return s;
}

console.log('Skill の契約 probe');
let failures = 0;
let checked = 0;
let lastSkill = '';

for (const c of CONTRACTS) {
  const server = await serverFor(c.server);
  if (c.skill !== lastSkill) {
    console.log(`\n[${c.skill}]`);
    lastSkill = c.skill;
  }
  let body;
  let blocks = [];
  try {
    const res = await server.call(c.call.tool, {
      file_path: files[c.specimen],
      ...c.call.args,
    });
    blocks = (res.content ?? []).map((b) => b.type);
    const text = res.content?.find((b) => b.type === 'text')?.text ?? '';
    body = c.call.text ? { _text: text } : JSON.parse(text);
  } catch (error) {
    console.log(`  🔴 ${c.call.tool}(${c.specimen}) が呼べなかった: ${String(error).slice(0, 90)}`);
    console.log(`     ${c.where} — ${c.why}`);
    failures++;
    continue;
  }
  body._blocks = blocks;

  const bad = [];
  for (const e of c.expect) {
    checked++;
    const v = at(body, e.path);
    if (e.contains !== undefined) {
      if (!Array.isArray(v) || !v.includes(e.contains)) bad.push(`${e.path} に ${e.contains} が無い（${JSON.stringify(v)}）`);
    } else if (e.equals !== undefined) {
      if (v !== e.equals) bad.push(`${e.path} = ${JSON.stringify(v)}（期待 ${JSON.stringify(e.equals)}）`);
    } else if (kindOf(v) !== e.kind) {
      bad.push(`${e.path} は ${kindOf(v)}（期待 ${e.kind}）`);
    }
  }
  if (bad.length) {
    failures += bad.length;
    console.log(`  🔴 ${c.call.tool}(${c.specimen})`);
    console.log(`     ${c.where}`);
    console.log(`     ${c.why}`);
    for (const b of bad) console.log(`     - ${b}`);
  } else {
    console.log(`  OK  ${c.call.tool}(${c.specimen})  ${c.where}`);
  }
}

for (const s of servers.values()) s.close();

console.log(
  failures
    ? `\n🔴 ${failures} 件の分岐材料が実在しない（${checked} 件中）。上の「where」の箇所が成り立たなくなっている`
    : `\n${checked} 件とも実在した`,
);
process.exit(failures ? 1 : 0);
