#!/usr/bin/env node
/**
 * 文中に書いた版番号を全部拾い、**存在しない版を名乗っている箇所**を報告する。
 *
 * ## なぜ要るか
 *
 * 版の同期で手間なのは、機械が持っている場所（stack.json / package.json /
 * marketplace.json）ではなく、**文の中に書いた版**である。
 * README の「v0.13.0 以降」、SKILL.md の「v0.14.0+ 推奨」、site の説明文。
 * これらはどの検査にも引っかからず、古いまま残る。
 *
 * ## 何を測るか / 何を測らないか
 *
 * 測る: 文中の版が、その部品の**今ある版より新しい**か。
 *       新しければ、その版はまだ存在しない —— 未来の版を既にあるものとして書いている。
 *
 * 測らない: 文中の版が古いこと。「2026-08-27 のリリース（reader 0.13.0）」は
 *       正しい記述で、書き換えてはいけない。だからこの道具は**一切書き換えない**。
 *       古い言及は `--all` で一覧に出すだけで、終了コードには影響しない。
 *
 * ## 版をどこから取るか
 *
 * stack.json（`published`、無ければ `local.version`）。stack.json 自身が npm と
 * 合っているかは `generate-stack.mjs --check` の仕事で、ここでは重ねない。
 *
 * ## 部品名が無い版は拾わない
 *
 * 版を部品に結びつけるのは、同じ行にある**部品名**だけである。
 * ディレクトリからは推測しない（CHANGELOG が全部その部品の版になってしまう）。
 * つまり「0.15.0 にする」とだけ書いた行は見落とす。これは既知の穴で、
 * 部品名を書く習慣とセットで初めて効く。
 *
 * ## この検査自体を壊して確かめた（T-3）
 *
 *   node scripts/version-mentions.mjs --t3
 *
 * `scripts/fixtures/version-mentions-t3.md` を 1 枚流して、拾い方と**拾わない所**を
 * 突き合わせる（11 件）。検体に版は焼き込まない —— `__READER_NOW__` は走らせるときに
 * stack.json の版に置き換わる。焼き込むと reader が上がった日に検体の意味が変わる。
 *
 * 拾わない側の行には**必ず部品名を隣に置いてある**。部品名の無い行を並べても、
 * 拾わないことの証明にはならない（そもそも拾いようがない）。
 *
 * さらに、この --t3 が本当に落ちるかを、規則を 1 つずつ外して確かめた:
 *
 *   隣接の規則を外す         → veraPDF 1.30.0 / biome 2.5.4 / 節番号 3.8.5 を拾う（3 件）
 *   節番号ガードを外す       → 3.8.5 を normativepdf の版として拾う
 *   ignore 印を効かなくする  → 4.4.3 を writer の版として拾う
 *   後ろの .数字 ガードを外す → 1.9.10.1 を 1.9.10 として拾う
 *   いまの版を取り違える     → 現行版を past と判定する
 *
 * この過程で 2 つ見つかった。どちらも通常経路では出ない:
 *   - 照合が `said` の完全一致だった。1.9.10.1 を拾ったときの報告は `1.9.10` なので、
 *     完全一致では「拾わなかった」と報告していた（前方一致に直した）。
 *   - 失敗時にだけ使う関数が宣言より前で呼ばれていた（ReferenceError）。
 * また、§ を見る条件と `ISO|Table|…` を見る条件は、外しても何も変わらなかった。
 * 隣接の規則が先に止めていたので消した（外して何も変わらない条件は何も守っていない）。
 *
 * ## 使い方
 *
 *   node scripts/version-mentions.mjs           # 存在しない版を名乗る箇所だけ
 *   node scripts/version-mentions.mjs --all     # 拾った言及を部品ごとに全部出す
 *   node scripts/version-mentions.mjs --json    # 機械で読む形
 *   node scripts/version-mentions.mjs --t3      # この検査自体が測れているかを見る
 *
 * 終了コード: 0 = 未来の版は無い / 1 = ある / 2 = 走れなかった
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const args = process.argv.slice(2);
let showAll = false;
let asJson = false;
let t3 = false;
for (const a of args) {
  if (a === '--all') showAll = true;
  else if (a === '--json') asJson = true;
  else if (a === '--t3') t3 = true;
  else {
    console.error(`知らない引数: ${a}\n使い方: node scripts/version-mentions.mjs [--all] [--json] [--t3]`);
    process.exit(2);
  }
}

/**
 * 部品名として認める書き方。**手で書く**（自動で作ると、何を拾って何を拾わないかが
 * 読めなくなる）。長いものから当てるので、`pdf-read` が `pdf-reader-mcp` を
 * 食うことはない。
 */
const ALIASES = {
  'pdf-spec-mcp': ['pdf-spec-mcp', '@shuji-bonji/pdf-spec-mcp', 'pdf-spec', 'spec-mcp'],
  'pdf-reader-mcp': ['pdf-reader-mcp', '@shuji-bonji/pdf-reader-mcp', 'pdf-reader', 'reader-mcp', 'reader'],
  'pdf-verify-mcp': ['pdf-verify-mcp', '@shuji-bonji/pdf-verify-mcp', 'pdf-verify', 'verify-mcp', 'verify'],
  'pdf-writer-mcp': ['pdf-writer-mcp', '@shuji-bonji/pdf-writer-mcp', 'pdf-writer', 'writer-mcp', 'writer'],
  'pdf-constraints': ['pdf-constraints', '@shuji-bonji/pdf-constraints'],
  normativepdf: ['normativepdf'],
  'pdf-trust-skill': ['pdf-trust-skill', 'pdf-trust'],
  'pdf-publish-skill': ['pdf-publish-skill', 'pdf-publish'],
  'pdf-read-skill': ['pdf-read-skill', 'pdf-read'],
  'pdf-specialist-plugin': ['pdf-specialist-plugin', 'pdf-specialist'],
  'pdf-agent-pipeline': ['pdf-agent-pipeline'],
};

/* ---- 今ある版を stack.json から取る ---- */
let stack;
try {
  stack = JSON.parse(readFileSync(join(ROOT, 'stack.json'), 'utf8'));
} catch (error) {
  console.error(`stack.json が読めない: ${error.message}`);
  process.exit(2);
}
const current = new Map();
for (const r of stack.repos ?? []) {
  const v = r.published || r.local?.version;
  if (v) current.set(r.name, { version: v, from: r.published ? 'npm' : '手元の package.json' });
}
for (const name of Object.keys(ALIASES)) {
  if (!current.has(name)) {
    console.error(`🔴 ${name} の版が stack.json から取れない。node scripts/generate-stack.mjs で作り直すこと`);
    process.exit(2);
  }
}

/* ---- 走査する先 ---- */
const SKIP_DIR = new Set([
  '.git', 'node_modules', 'dist', 'build', 'coverage', '.svelte-kit', '.vercel',
  '.golden', '.next', 'out', 'tmp', '_to_delete', 'fixtures',
]);
const EXT = new Set(['.md', '.mdx', '.svelte', '.html', '.ts', '.tsx', '.js', '.mjs', '.cjs', '.yml', '.yaml', '.txt', '.json']);
const SKIP_FILE = /(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$/;

function files(dir, acc = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIR.has(e.name)) continue;
      files(p, acc);
    } else if (e.isFile()) {
      const dot = e.name.lastIndexOf('.');
      if (dot < 0 || !EXT.has(e.name.slice(dot))) continue;
      if (SKIP_FILE.test(p)) continue;
      try {
        if (statSync(p).size > 2_000_000) continue; // 生成物が混じったときの保険
      } catch {
        continue;
      }
      acc.push(p);
    }
  }
  return acc;
}

/* ---- 行の中で版と部品名を結ぶ ---- */
const aliasList = Object.entries(ALIASES)
  .flatMap(([name, list]) => list.map((a) => ({ name, alias: a })))
  .sort((x, y) => y.alias.length - x.alias.length);

const VERSION = /v?(\d+)\.(\d+)\.(\d+)/g;

/**
 * 版と同じ形をしていて版ではないもの。
 *
 * ISO の条番号（§9.10.1）や `ISO 32000-2` は、下の GLUE_BEFORE が `§` も英字も
 * 通さないので、ここまで来ない。**§ を見る条件も書いていたが、--t3 で外しても
 * 何も変わらなかったので消した**（外して何も変わらない条件は、何も守っていない）。
 * 残っているのは、隣接の規則では止まらない 2 つだけである。
 */
function notAVersion(line, at, matched) {
  // `1.9.10.1` は先頭から `1.9.10` が取れる。後ろに `.数字` が続けば 4 つ組の一部。
  if (/^\.\d/.test(line.slice(at + matched.length, at + matched.length + 2))) return true;
  // 見出しや箇条書きの節番号（`### 3.8.5 normativepdf 0.9.0 に…`。version-mentions:ignore）。
  // 行頭側に記号と空白しか無ければ、版ではなく番号である。
  if (/^[\s#*\-+>|]*$/.test(line.slice(0, at))) return true;
  return false;
}

/**
 * 版に見える文字列が、その部品の版ではないと分かっている行に付ける印。
 * 隣り合わせで結ぶ規則は、`spec / writer が 4.4.3`（zod の版。version-mentions:ignore）のような文で
 * 誤って結ぶ。文を直せない・直したくないときはこれを行に足す。
 */
const IGNORE = 'version-mentions:ignore';
/**
 * 部品名と版は**隣り合っていなければ結ばない**。
 *
 * 同じ行にあるだけで結ぶと、`verify の biome 版不整合（^2.3.14 指定）` の 2.3.14 が
 * verify の版になり、`veraPDF 1.30.0` も `pyHanko 0.36.2` も拾ってしまう。
 * 間に入ってよいのは下の文字だけで、それも数文字まで。
 *
 * 代わりに `| pdf-reader-mcp | 0.14.0 |` のような表のセル跨ぎは拾わない。
 * これは既知の穴で、狭くした側の代償である（見落とす方が、嘘を出すよりまし）。
 */
const GLUE_BEFORE = /^[\s@:=/^~,()`*「」【】]*(は|を|が|で|の)?[\s]*$/;
const GLUE_AFTER = /^\s*(の)?\s*$/;
const BEFORE = 8;
const AFTER = 6;

const cmp = (a, b) => {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
};

function aliasHits(line) {
  const hits = [];
  const lower = line.toLowerCase();
  const taken = new Array(line.length).fill(false);
  for (const { name, alias } of aliasList) {
    let from = 0;
    for (;;) {
      const i = lower.indexOf(alias, from);
      if (i < 0) break;
      from = i + 1;
      // 語の途中には当てない（`preader` や `readers` を拾わない）
      const before = line[i - 1] ?? ' ';
      const after = line[i + alias.length] ?? ' ';
      if (/[a-z0-9]/i.test(before) || /[a-z]/i.test(after)) continue;
      if (taken.slice(i, i + alias.length).some(Boolean)) continue; // 長い別名が先に取った
      for (let k = i; k < i + alias.length; k++) taken[k] = true;
      hits.push({ name, alias, index: i });
    }
  }
  return hits.sort((a, b) => a.index - b.index);
}

/** 1 ファイル分の文字列から言及を拾う。--t3 は同じ関数に検体を流し込む。 */
function scan(text, rel, out) {
  if (!/\d+\.\d+\.\d+/.test(text)) return out;
  const lines = text.split('\n');
  for (let n = 0; n < lines.length; n++) {
    const line = lines[n];
    if (!/\d+\.\d+\.\d+/.test(line)) continue;
    if (line.includes(IGNORE)) continue;
    const hits = aliasHits(line);
    if (!hits.length) continue;
    VERSION.lastIndex = 0;
    let m;
    while ((m = VERSION.exec(line))) {
      const at = m.index;
      if (notAVersion(line, at, m[0])) continue;
      // 版そのものが別名の一部（`pdf-reader-mcp@0.14.0` の右側）でも、結ぶ相手は同じ
      let bound = null;
      for (const h of hits) {
        const end = h.index + h.alias.length;
        if (end > at) continue;
        const glue = line.slice(end, at);
        if (glue.length <= BEFORE && GLUE_BEFORE.test(glue)) bound = h; // 直前で最も近いもの
      }
      if (!bound) {
        const end = at + m[0].length;
        bound = hits.find((h) => {
          if (h.index < end) return false;
          const glue = line.slice(end, h.index);
          return glue.length <= AFTER && GLUE_AFTER.test(glue);
        }) ?? null;
      }
      if (!bound) continue;
      const said = [Number(m[1]), Number(m[2]), Number(m[3])];
      const cur = current.get(bound.name);
      const now = cur.version.split('.').map(Number);
      const order = cmp(said, now);
      out.push({
        file: rel,
        line: n + 1,
        component: bound.name,
        alias: bound.alias,
        said: m[0],
        now: cur.version,
        verdict: order > 0 ? 'future' : order === 0 ? 'current' : 'past',
        text: line.trim().slice(0, 160),
      });
    }
  }
  return out;
}

if (t3) {
  runT3();
} else {
  const all = [];
  for (const file of files(ROOT)) {
    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    scan(text, relative(ROOT, file), all);
  }
  report(all);
}

/**
 * 壊す先が無い検査は何も測っていない。検体を 1 枚流して、拾い方と**拾わない所**の
 * 両方を突き合わせる。検体に版は焼き込まない（reader が上がった日に意味が変わる）。
 */
function runT3() {
  const fixture = join(ROOT, 'scripts/fixtures/version-mentions-t3.md');
  const now = current.get('pdf-reader-mcp').version;
  const text = readFileSync(fixture, 'utf8').replaceAll('__READER_NOW__', now);
  const got = scan(text, 'version-mentions-t3.md', []);
  const want = [
    ['pdf-reader-mcp', 'v99.0.0', 'future', '存在しない版'],
    ['pdf-reader-mcp', now, 'current', 'いまの版'],
    ['pdf-reader-mcp', '0.0.1', 'past', '過去の記述。落とさない'],
    ['pdf-read-skill', 'v9.9.9', 'future', 'pdf-read は pdf-reader-mcp ではない'],
    ['normativepdf', current.get('normativepdf').version, 'current', '節番号の隣にある本物の版は拾う'],
  ];
  /**
   * 拾ってはいけないもの。`line` はその行を見分ける文字列、`token` は結んではいけない
   * 数字、`why` は効いている規則。
   *
   * 🔴 `said` の**完全一致**で照合してはいけない。`1.9.10.1` を拾ってしまったときに
   * 出るのは `1.9.10` で、完全一致だと「拾わなかった」と報告する。
   * 前方一致で見る（拾った側が短くなるため）。
   */
  const neverPick = [
    ['veraPDF', '1.30.0', '間に「が使う veraPDF」が挟まる（隣接していない）'],
    ['biome', '2.5.4', '間に「の biome」が挟まる（隣接していない）'],
    ['§9.10.1', '9.10.1', '§ の後ろ'],
    ['1.9.10.1', '1.9.10.1', '後ろに .数字 が続く（4 つ組の一部）'],
    ['3.8.5 normativepdf', '3.8.5', '見出しの節番号'], // version-mentions:ignore
    ['zod の版', '4.4.3', 'version-mentions:ignore を書いた行'],
  ];

  let bad = 0;
  for (const [component, said, verdict, why] of want) {
    const hit = got.find((m) => m.component === component && m.said === said);
    if (!hit) {
      console.log(`🔴 拾えていない: ${component} ${said}（${why}）`);
      bad++;
    } else if (hit.verdict !== verdict) {
      console.log(`🔴 ${component} ${said} を ${hit.verdict} と判定した（期待 ${verdict}。${why}）`);
      bad++;
    } else {
      console.log(`OK  ${component} ${said} → ${verdict}（${why}）`);
    }
  }
  for (const [marker, token, why] of neverPick) {
    if (!text.includes(marker)) {
      console.log(`🔴 検体に「${marker}」の行が無い。この検査は何も測っていない`);
      bad++;
      continue;
    }
    const hit = got.find((m) => m.text.includes(marker) && token.startsWith(m.said.replace(/^v/, '')));
    if (hit) {
      console.log(`🔴 拾ってはいけないものを拾った: ${token} → ${hit.component}（報告は ${hit.said}。${why}）`);
      bad++;
    } else {
      console.log(`OK  ${token} は拾わなかった（${why}）`);
    }
  }
  console.log(bad ? `\n🔴 T-3 が ${bad} 件合わない。この検査はいま測れていない` : `\nT-3: ${want.length + neverPick.length} 件とも一致`);
  process.exitCode = bad ? 1 : 0;
}

function report(mentions) {
const future = mentions.filter((m) => m.verdict === 'future');
const exitCode = future.length ? 1 : 0;

// 出力が大きいので `process.exit()` は使わない。パイプに書き終わる前にプロセスが
// 終わり、JSON が途中で切れる（--json を jq に渡して初めて分かる類の壊れ方）。
process.exitCode = exitCode;

if (asJson) {
  console.log(JSON.stringify({ current: Object.fromEntries(current), mentions }, null, 2));
} else {
  const byComponent = new Map();
  for (const m of mentions) {
    if (!byComponent.has(m.component)) byComponent.set(m.component, []);
    byComponent.get(m.component).push(m);
  }

  if (showAll) {
    for (const name of Object.keys(ALIASES)) {
      const list = byComponent.get(name) ?? [];
      const cur = current.get(name);
      const past = list.filter((m) => m.verdict === 'past').length;
      const same = list.filter((m) => m.verdict === 'current').length;
      const fut = list.filter((m) => m.verdict === 'future').length;
      console.log(
        `\n[${name}] いま ${cur.version}（${cur.from}） — 言及 ${list.length} 件（同じ ${same} / 古い ${past} / 未来 ${fut}）`,
      );
      for (const m of list) {
        const mark = m.verdict === 'future' ? '🔴' : m.verdict === 'past' ? '  ' : 'OK';
        console.log(`  ${mark} ${m.file}:${m.line}  ${m.said}`);
        if (m.verdict !== 'current') console.log(`       ${m.text}`);
      }
    }
    console.log('');
  }

  if (future.length) {
    console.log(`🔴 まだ存在しない版を名乗っている箇所が ${future.length} 件（拾った言及 ${mentions.length} 件中）\n`);
    for (const m of future) {
      console.log(`  ${m.file}:${m.line}`);
      console.log(`    ${m.component} は ${m.now} なのに ${m.said} と書いてある（「${m.alias}」で結んだ）`);
      console.log(`    ${m.text}`);
    }
    console.log('\n書き換えはしない。上の行を開いて、公開した版か、公開予定であることが分かる書き方に直すこと。');
    console.log(`その部品の版ではないと分かっている行には、行内に ${IGNORE} と書けば飛ばす`);
  } else {
    console.log(
      `拾った版の言及 ${mentions.length} 件（${byComponent.size} 部品）。まだ存在しない版を名乗っている箇所は無い` +
        (showAll ? '' : '\n一覧は --all'),
    );
  }
}
}
