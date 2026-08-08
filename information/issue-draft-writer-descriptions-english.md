# Issue 下書き: pdf-writer の tool description を英語化し、ja は翻訳メモリで持つ

> **✅ 実装済み（2026-08-08・案 a どおり）**。pdf-writer-mcp v0.18.0（未リリース）として
> definitions.ts / validation.ts の description を英語化。ja 訳 190 件は翻訳メモリへ
> 全件載せ替え済み（欠落 0）。残る手順は下記「リリース前チェック」のみ。
> Issue 登録は不要になったが、経緯の記録として残す。

## リリース前チェック（ホスト作業）

1. `cd mcp/pdf-writer-mcp && npm test && npm run check`（テストが description 文字列を
   assert していれば追従修正）
2. リリース（**署名は push 前**・タグ v0.18.0）→ `npm publish` → **npx で公開版検証**
3. リリース後にサイトを再デプロイ（生成ページは既に v0.18.0 を名乗っているため、
   **writer のリリースより先にサイトを deploy しない**こと）
4. `scripts/generate-stack.mjs` で stack.json を再生成

## 背景

サイトのツールリファレンスは `scripts/generate-reference.mjs` が各サーバーの
`tools/list` 実応答から自動生成する（正典 = サーバー実装）。
en ページはサーバーの description をそのまま写し、ja ページは翻訳メモリ
（`scripts/i18n/<server>.ja.json`・英語原文の md5 で同期検知）を通す。

4 台のうち pdf-writer だけ、**description がサーバー実装自体で日本語**になっている
（電帳法・帳票など日本文脈が厚いため）。このため:

- **en リファレンスページに日本語がそのまま出る**（`site/docs/reference/mcp/pdf-writer.md`）
- ja 側は翻訳メモリに同一文を登録して充足済み（暫定対応・機能上の問題なし）
- 実行時にツールを読む LLM への説明も日本語のみ（英語圏の利用者に不利）

## 提案（案 a・採用予定）

pdf-writer-mcp の tool description / パラメータ description を英語化し、
日本語は pdf-agent-stack 側の翻訳メモリ `scripts/i18n/pdf-writer.ja.json` で持つ。

- 他 3 台（spec / reader / verify）と同じ向きになる
- 公開リポジトリは README.md=英語が基準、という規約とも整合
- 現在の日本語 description は**そのまま ja 訳の初稿になる**
  （英語化 → 生成器を回す → pending に旧 ja が対で出る → メモリへ移すだけ。訳文の書き直し不要）

## 作業手順（目安）

1. pdf-writer-mcp: src の description を英語化（20 ツール・約 100 文字列。
   現行日本語文は ja 訳として退避しておく）
2. test / npx 検証 → リリース
3. pdf-agent-stack: `node scripts/generate-reference.mjs pdf-writer` を実行
   → `pending-pdf-writer.ja.json` の各エントリに退避した日本語文を対応付けて
   `pdf-writer.ja.json` を再構築 → 再生成
4. en ページが英語・ja ページが従来どおり日本語であることを確認

## 却下した代替案（案 b）

生成器に en 方向の翻訳メモリを追加する。
→ 翻訳メモリが双方向になり構造が複雑化する。正典（サーバー）が
リポジトリ規約（英語基準）とずれたままになるため見送り。

## 受入条件

- [ ] `tools/list` の全 description が英語
- [ ] `site/docs/reference/mcp/pdf-writer.md`（en）に日本語が残らない
- [ ] `site/docs/ja/reference/mcp/pdf-writer.md` の内容が現行と同等（訳の劣化なし）
- [ ] 生成器の pending が 0（翻訳メモリ充足）

## 関連

- `scripts/generate-reference.mjs`（生成器・翻訳メモリ層）
- `scripts/i18n/pdf-writer.ja.json`（現在は同一文の identity 登録 190 エントリ）
- 将来: en の guide/reference 整備（Translation pending 解消）が進むと本件の優先度が上がる
