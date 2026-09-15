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
 * 🔴 **応答が `isError` かどうかも契約の一部である。** 同じツールでも、成功応答と
 * エラー応答は別の形の本文を返す。`expectError: true` の契約はエラー本文に対する主張で、
 * 取り違えたら `expect` を見る前に落とす —— エラー本文を「フィールドが欠けた成功応答」として
 * 報告すると、**「呼べなかった」と「呼べたが分岐材料が無い」が同じ顔になる**。
 *
 * 🔴 **測れない契約は、通った契約に混ぜない。** `unmeasurable` を持つ契約は、規約は生きているが
 * それを起こす検体が作れないもので、`—` で出して件数を別に数える。消して 0 件にすると、
 * 何を測っていないのかが分からなくなる。
 *
 * ## この検査自体を壊して確かめた（T-3）
 *
 * 壊す先が無い検査は何も測っていない。ここは版を下げることで壊せる。
 * 数字は reader 0.15.0 に合わせ直したあとの実測（2026-09-15 JST）。
 *
 *   node scripts/skill-contract-probe.mjs --published        → 29 件とも実在した（0.15.0。ほかに測れない 1 件）
 *   node scripts/skill-contract-probe.mjs --published 0.14.0 → 🔴 5 件が実在しない（25 件中）
 *   node scripts/skill-contract-probe.mjs --published 0.13.0 → 🔴 10 件が実在しない（29 件中）
 *
 * 0.14.0 で落ちる 5 件は、pdf-lib を撤去した 0.15.0 で変わった箇所と 1 対 1 で対応する
 * —— 鍵が導けない暗号化文書がエラーで返るようになったこと（3 件）と、空パスワードの
 * 文書を復号して §9.10.1 を観測できるようになったこと（2 件）。0.13.0 で落ちる 10 件は、
 * `scope` を持たない版で pdf-read / pdf-publish のどの段が成り立たなくなるかを名指しする。
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
    note: 'ヘッダが "%PDF-" で版が無い。pdf-lib はここで止まったが、0.15.0 の recover は読む（ok/ok になった）',
    sha256: '1ea2bc609416ad1875f13b841bb919fa',
    base64:
      'JVBERi0KJeLjz9MKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA1OTUgODQyXSAvUmVzb3VyY2VzIDw8IC9Gb250IDw8IC9GMSA1IDAgUiA+PiA+PiAvQ29udGVudHMgNCAwIFIgPj4KZW5kb2JqCjQgMCBvYmoKPDwgL0xlbmd0aCA1OSA+PgpzdHJlYW0KQlQgL0YxIDEyIFRmIDcyIDcyMCBUZCAoT25lIHBhZ2Ugd2l0aCByZWFkYWJsZSB0ZXh0KSBUaiBFVAoKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8IC9UeXBlIC9Gb250IC9TdWJ0eXBlIC9UeXBlMSAvQmFzZUZvbnQgL0hlbHZldGljYSA+PgplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDEyIDAwMDAwIG4gCjAwMDAwMDAwNjEgMDAwMDAgbiAKMDAwMDAwMDExOCAwMDAwMCBuIAowMDAwMDAwMjQ0IDAwMDAwIG4gCjAwMDAwMDAzNTMgMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSA2IC9Sb290IDEgMCBSID4+CnN0YXJ0eHJlZgo0MjMKJSVFT0YK',
  },
  failOk: {
    name: 'halves-fail-ok-password.pdf',
    note: '空でない利用者パスワード付き（§7.6.4.3.2 で鍵が導けない）。0.14.0 は観測だけできたが、0.15.0 は両方止まり isError になる',
    sha256: '600979071ac725c14ce803bad7b17430',
    base64:
      'JVBERi0xLjcKJb/3ov4KMSAwIG9iago8PCAvUGFnZXMgMiAwIFIgL1R5cGUgL0NhdGFsb2cgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL0NvdW50IDEgL0tpZHMgWyAzIDAgUiBdIC9UeXBlIC9QYWdlcyA+PgplbmRvYmoKMyAwIG9iago8PCAvQ29udGVudHMgNCAwIFIgL01lZGlhQm94IFsgMCAwIDU5NSA4NDIgXSAvUGFyZW50IDIgMCBSIC9SZXNvdXJjZXMgPDwgL0ZvbnQgPDwgL0YxIDUgMCBSID4+ID4+IC9UeXBlIC9QYWdlID4+CmVuZG9iago0IDAgb2JqCjw8IC9MZW5ndGggNjUgL0ZpbHRlciAvRmxhdGVEZWNvZGUgPj4Kc3RyZWFtCrce4tXxLn+U0PwplZNqM42P0db8GIKBO/oVNVJECOZhpjVD0ay8x2y1FwNMvvBW/kIVeO2ndXVJTJmYwMXX02udZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8IC9CYXNlRm9udCAvSGVsdmV0aWNhIC9TdWJ0eXBlIC9UeXBlMSAvVHlwZSAvRm9udCA+PgplbmRvYmoKNiAwIG9iago8PCAvRmlsdGVyIC9TdGFuZGFyZCAvTGVuZ3RoIDEyOCAvTyA8Mzg0YTE2ZGJjNDIyMTYzZTE3NGEyNjhhOGMwODNjOTg3YTlkNWY0ZTQ5NWQwMzUyMzYzOTBiZDYxOTlmOGQzND4gL1AgLTQgL1IgMyAvVSA8MDYyOTFmNjZmOTcyM2ViMGU3ODM5M2RhODJiNmQwOWYwMTIyNDU2YTkxYmFlNTEzNDI3M2E2ZGIxMzRjODdjND4gL1YgMiA+PgplbmRvYmoKeHJlZgowIDcKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE1IDAwMDAwIG4gCjAwMDAwMDAwNjQgMDAwMDAgbiAKMDAwMDAwMDEyMyAwMDAwMCBuIAowMDAwMDAwMjUxIDAwMDAwIG4gCjAwMDAwMDAzODYgMDAwMDAgbiAKMDAwMDAwMDQ1NiAwMDAwMCBuIAp0cmFpbGVyIDw8IC9Sb290IDEgMCBSIC9TaXplIDcgL0lEIFs8MzE0MTU5MjY1MzU4OTc5MzIzODQ2MjY0MzM4MzI3OTU+PDMxNDE1OTI2NTM1ODk3OTMyMzg0NjI2NDMzODMyNzk1Pl0gL0VuY3J5cHQgNiAwIFIgPj4Kc3RhcnR4cmVmCjY2MwolJUVPRgo=',
  },
  encEmpty: {
    name: 'encrypted-empty-user-password.pdf',
    note:
      '利用者パスワードが空（RC4 128・/V 2 /R 3）。§7.6.4.3.2 のとおり空パスワードから鍵が導けるので、' +
      '0.15.0 は復号して読む（0.14.0 は本文だけ読め、§9.10.1 の観測は not_observed になった）',
    /**
     * okOk を qpdf で暗号化したもの。バイト列はこれで再現する:
     *   qpdf --allow-weak-crypto --static-id --encrypt --user-password= \
     *        --owner-password=owner --bits=128 -- halves-ok-ok-page2-unobserved.pdf out.pdf
     * RC4 を選ぶのは golden-specimens-halves.mjs と同じ理由 —— AES-256（/R 6）は鍵の生成に
     * 乱数が入るので、同じ入力から同じバイト列が出ない。強度の話ではない。
     */
    sha256: '329af8b7a68720a13f09cffa37557907',
    base64:
      'JVBERi0xLjcKJb/3ov4KMSAwIG9iago8PCAvUGFnZXMgMiAwIFIgL1R5cGUgL0NhdGFsb2cgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL0NvdW50IDIgL0tpZHMgWyAzIDAgUiA0IDAgUiBdIC9UeXBlIC9QYWdlcyA+PgplbmRvYmoKMyAwIG9iago8PCAvQ29udGVudHMgNSAwIFIgL01lZGlhQm94IFsgMCAwIDU5NSA4NDIgXSAvUGFyZW50IDIgMCBSIC9SZXNvdXJjZXMgPDwgL0ZvbnQgPDwgL0YxIDYgMCBSID4+ID4+IC9UeXBlIC9QYWdlID4+CmVuZG9iago0IDAgb2JqCjw8IC9Db250ZW50cyA3IDAgUiAvTWVkaWFCb3ggWyAwIDAgNTk1IDg0MiBdIC9QYXJlbnQgMiAwIFIgL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNiAwIFIgPj4gPj4gL1R5cGUgL1BhZ2UgPj4KZW5kb2JqCjUgMCBvYmoKPDwgL0xlbmd0aCA1NSAvRmlsdGVyIC9GbGF0ZURlY29kZSA+PgpzdHJlYW0K4VVHU2Ku9s7BI/mLv3I4c2yA0JqQWow7tVSDV9UZIGr7HbVnsmyfe/VXriWZffH9v9E2JS8bLWVuZHN0cmVhbQplbmRvYmoKNiAwIG9iago8PCAvQmFzZUZvbnQgL0hlbHZldGljYSAvU3VidHlwZSAvVHlwZTEgL1R5cGUgL0ZvbnQgPj4KZW5kb2JqCjcgMCBvYmoKPDwgL0ZpbHRlciAvRmxhdGVEZWNvZGUgL0xlbmd0aCAyMyA+PgpzdHJlYW0K9H5Mb/uNxx0IHEpHVUHb4JTJdml3lVllbmRzdHJlYW0KZW5kb2JqCjggMCBvYmoKPDwgL0ZpbHRlciAvU3RhbmRhcmQgL0xlbmd0aCAxMjggL08gPDU2NmZhODczZWUzM2M3OTdjZDNiOTA0ZmRhZGY4MTRhZmEzNGRmOWEzOGY2ZWQ0MWI5ODRlMmM2ZGEyYWE2ZjU+IC9QIC00IC9SIDMgL1UgPGUyMWNjM2QxM2IwZmFhOTkzNGRiN2QyMGYxMWUzMzNlMDEyMjQ1NmE5MWJhZTUxMzQyNzNhNmRiMTM0Yzg3YzQ+IC9WIDIgPj4KZW5kb2JqCnhyZWYKMCA5CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMDY0IDAwMDAwIG4gCjAwMDAwMDAxMjkgMDAwMDAgbiAKMDAwMDAwMDI1NyAwMDAwMCBuIAowMDAwMDAwMzg1IDAwMDAwIG4gCjAwMDAwMDA1MTAgMDAwMDAgbiAKMDAwMDAwMDU4MCAwMDAwMCBuIAowMDAwMDAwNjczIDAwMDAwIG4gCnRyYWlsZXIgPDwgL1Jvb3QgMSAwIFIgL1NpemUgOSAvSUQgWzwzMTQxNTkyNjUzNTg5NzkzMjM4NDYyNjQzMzgzMjc5NT48MzE0MTU5MjY1MzU4OTc5MzIzODQ2MjY0MzM4MzI3OTU+XSAvRW5jcnlwdCA4IDAgUiA+PgpzdGFydHhyZWYKODgwCiUlRU9GCg==',
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
    where: 'SKILL.md Phase 1「利用者パスワードが空でない → isError + code が ENCRYPTED_PDF」',
    why:
      '鍵が導けない文書で停止する。🔴 2026-08-31: metadata が null になり、isEncrypted だけを' +
      '見ていた版はここを素通りしていた。0.15.0 では 2 つの読みが両方失敗するので、部分応答ではなく' +
      'エラーが返る —— 停止の根拠は scope ではなく本文の code である',
    server: 'pdf-reader-mcp',
    specimen: 'failOk',
    call: { tool: 'summarize', args: { response_format: 'json' } },
    expectError: true,
    expect: [
      { path: 'code', equals: 'ENCRYPTED_PDF' },
      { path: 'detail.cause', kind: 'string' },
    ],
  },
  {
    skill: 'pdf-read',
    where: 'SKILL.md Phase 1「利用者パスワードが空 → 停止しない」',
    why:
      '読める文書の前で止まらない。§7.6.4.3.2 のとおり空パスワードから鍵が導ければ reader は復号する。' +
      'isEncrypted だけで停止すると、全文が読める文書を未読のまま返すことになる',
    server: 'pdf-reader-mcp',
    specimen: 'encEmpty',
    call: { tool: 'summarize', args: { response_format: 'json' } },
    expect: [
      { path: 'metadata.isEncrypted', equals: true },
      { path: 'scope.extractabilityObservation.status', equals: 'read' },
      { path: 'textExtractability', equals: 'extracted' },
    ],
  },
  {
    skill: 'pdf-read',
    where: 'SKILL.md Phase 1「利用者パスワードが空 → 停止しない」の本文側',
    why: '復号できた文書は本文もページごとの状態も返る（停止しない判断の裏付け）',
    server: 'pdf-reader-mcp',
    specimen: 'encEmpty',
    call: { tool: 'read_text', args: { pages: '1', response_format: 'json' } },
    expect: [
      { path: 'pages.0.text', kind: 'string' },
      { path: 'pages.0.extractability.state', equals: 'extracted' },
    ],
  },
  {
    skill: 'pdf-read',
    where: 'SKILL.md Phase 0「textExtractability が null なら読めるとも読めないとも言えない」',
    why: '観測が行われなかったことを、観測して extracted でなかったことと分ける',
    server: 'pdf-reader-mcp',
    specimen: 'okFail',
    call: { tool: 'summarize', args: { response_format: 'json' } },
    /**
     * 🔴 規約は生きているが、**実ファイルでは作れない**。0.15.0 で観測側が pdf-lib から
     * `@normativepdf/recover` に替わり、抽出だけ成功して観測だけ失敗する（ok/fail）検体が
     * 作れなくなった。reader 側が候補 3 つ（ヘッダ無し・/Count 不一致・版の無いヘッダ）を
     * 実測して 3 つとも両方成功している（pdf-reader-mcp の
     * tests/e2e/15-reading-scope.test.ts 冒頭）。この分岐は同リポジトリの
     * tests/tier1/reading-scope.test.ts が stub で固定している。
     * 🔴 **検体が無いことは、規約が要らなくなったことではない。** 消すと、何を測っていないのかが
     * 分からなくなる。expect はそのまま残し、測れないことだけを申告する。
     */
    unmeasurable:
      '抽出だけ成功して観測だけ失敗する検体が 0.15.0 では作れない（pdf-reader-mcp の tests/tier1/reading-scope.test.ts が stub で固定している）',
    expect: [
      { path: 'scope.extractabilityObservation.status', equals: 'failed' },
      { path: 'textExtractability', kind: 'null' },
      { path: 'unreadablePages', kind: 'null' },
    ],
  },
  {
    skill: 'pdf-read',
    where: 'SKILL.md Phase 3「read_text に明示の pages を渡して読む」',
    why: '鍵が導けない文書では本文を返せない。0.15.0 はそれをエラーで言う（空の pages を返さない）',
    server: 'pdf-reader-mcp',
    specimen: 'failOk',
    call: { tool: 'read_text', args: { response_format: 'json' } },
    expectError: true,
    expect: [{ path: 'code', equals: 'ENCRYPTED_PDF' }],
  },
  {
    skill: 'pdf-read',
    where: 'SKILL.md Phase 3「search_text が 0 件のときは unsearchablePages / note を読む」',
    why: '探せなかったことを 0 件と混同しない。0.15.0 は 0 件ではなくエラーを返す',
    server: 'pdf-reader-mcp',
    specimen: 'failOk',
    call: { tool: 'search_text', args: { query: 'a', response_format: 'json' } },
    expectError: true,
    expect: [{ path: 'code', equals: 'ENCRYPTED_PDF' }],
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
/** 🔴 測れなかった契約。**通った件数に混ぜない。** 混ぜた瞬間に、この probe 自身が
 *  「行われなかった観測」を「行われて通った観測」として報告することになる。 */
let unmeasured = 0;
let lastSkill = '';

for (const c of CONTRACTS) {
  const server = await serverFor(c.server);
  if (c.skill !== lastSkill) {
    console.log(`\n[${c.skill}]`);
    lastSkill = c.skill;
  }
  if (c.unmeasurable) {
    unmeasured++;
    console.log(`  —   ${c.call.tool}(${c.specimen})  ${c.where}`);
    console.log(`      測れない: ${c.unmeasurable}`);
    continue;
  }

  let body;
  let blocks = [];
  let isError = false;
  try {
    const res = await server.call(c.call.tool, {
      file_path: files[c.specimen],
      ...c.call.args,
    });
    blocks = (res.content ?? []).map((b) => b.type);
    /** 🔴 **エラー応答を成功応答として読まない。** ここを見ないと、エラー本文を
     *  「フィールドが欠けた成功応答」として報告することになり、「呼べなかった」と
     *  「呼べたが分岐材料が無い」が同じ顔になる。 */
    isError = res.isError === true;
    const text = res.content?.find((b) => b.type === 'text')?.text ?? '';
    body = c.call.text ? { _text: text } : JSON.parse(text);
  } catch (error) {
    console.log(`  🔴 ${c.call.tool}(${c.specimen}) が呼べなかった: ${String(error).slice(0, 90)}`);
    console.log(`     ${c.where} — ${c.why}`);
    failures++;
    continue;
  }
  body._blocks = blocks;

  /** エラーで返るはずの契約と、成功で返るはずの契約を取り違えたら、expect を見る前に止める
   *  —— 両者は別の形の本文で、片方の path をもう片方に当てても何も分からない。 */
  const wantError = c.expectError === true;
  if (isError !== wantError) {
    failures++;
    console.log(`  🔴 ${c.call.tool}(${c.specimen})`);
    console.log(`     ${c.where}`);
    console.log(`     ${c.why}`);
    console.log(
      wantError
        ? '     - isError が立たなかった。この検体ではエラー応答になるはずで、下の expect はエラー本文への主張である'
        : `     - isError が立った。本文は成功応答ではない: ${JSON.stringify(body).slice(0, 200)}`,
    );
    continue;
  }

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

const tail = unmeasured ? `。ほかに ${unmeasured} 件は検体が作れず測れていない（上の「測れない」）` : '';
console.log(
  failures
    ? `\n🔴 ${failures} 件の分岐材料が実在しない（${checked} 件中）。上の「where」の箇所が成り立たなくなっている${tail}`
    : `\n${checked} 件とも実在した${tail}`,
);
process.exit(failures ? 1 : 0);
