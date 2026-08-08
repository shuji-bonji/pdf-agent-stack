# 栞 2026-08-08: サイト整備・ツールリファレンス自動生成まわり

このセッションで確定した事実・仕組み・未解決を挟んでおく。正典はコード側
（`scripts/generate-reference.mjs` / `scripts/i18n/`）。ここは道標。

## リファレンス生成の仕組み（確定）

- `node scripts/generate-reference.mjs [server...]` — 各 MCP を stdio 起動し
  `initialize` → `tools/list` の**実応答**から ja/en の Markdown を生成する。
  依存ゼロ（生 JSON-RPC）。サイトが実装について嘘をつけない構造。
- 対象 4 台 = spec 8 / reader 18 / verify 7 / writer 20 ツール（計 53）。
  出力先 `site/docs/{,ja/}reference/mcp/*.md`。サイドバー「MCP ツールリファレンス」。
- ビルド鎖: `npm run build` = 生成 → `vitepress build`（生成忘れを構造的に防止）。
- description 内の `Args:` 散文はスキーマ表と重複するため落とす。`Returns:` は残す。
  deprecated は description の文字列から自動検出して warning バッジ。

## 翻訳メモリ（確定）

- `scripts/i18n/<server>.ja.json` — キー `ツール名|フィールド`、値 `{src: 英語原文のmd5, text: 訳}`。
- **原文が変わるとハッシュ不一致で自動失効** → 英語フォールバック + `pending-*.ja.json` に列挙。
  古い訳が新しい原文に付くことは構造的にない。
- 翻訳器は差し替え可能。**DeepL は実測で不採用**: コードスパン破壊
  （`<Table>` 等をバッククォート内でも HTML と解釈）・`\n`→`n` 化け・文体混在・引用符化け。
  Markdown + コード混じりの技術文は LLM 翻訳の方が確実だった。
- **pdf-writer は description がサーバー実装自体で日本語**。ja メモリは同一文の
  identity 登録（190 エントリ）で充足済み。en ページには日本語が出る。
  → 恒久対応は `information/issue-draft-writer-descriptions-english.md`（案 a）。

## サンドボックスの制約（再現手順）

- pdf-spec は pdfjs-dist が import 時に `DOMMatrix` を要求し、@napi-rs/canvas の
  ネイティブバイナリ（mac 用）が無いサンドボックスでは起動不能。
  → `NODE_OPTIONS="--require /tmp/dom-shim.cjs"`（DOMMatrix/ImageData/Path2D の空クラス）で
  tools/list までは通る。**ホストでは不要**。
- サンドボックスの mount は unlink 不可（EPERM）。生成器の pending 削除は
  try/catch + 空配列書き込みでフォールバック済み。

## vitepress-plugin-llms（対処済み + upstream Issue 候補）

- llms.txt / llms-full.txt はビルド時に自動生成（コンテンツから派生。二重管理なし）。
- **プラグインの dev ミドルウェアは `.md` で終わる全リクエストを横取り**して dist の
  生 Markdown を text/plain で返す。VitePress dev の SPA 遷移はページを .md モジュールで
  取得するため、一度 build して dist に .md が生まれると**全ページの SPA 遷移が壊れる**。
  → `config.ts` で `llmstxt().map(p => ({...p, apply: 'build'}))` により dev では無効化。
  → upstream（okineadev/vitepress-plugin-llms）への Issue 報告候補。
- frontmatter `description` を全実体ページに設置済み（llms.txt の目次に説明が付く。
  責務境界の一文を意図的に埋め込んである）。生成リファレンスは生成器が frontmatter を書く。

## CI（GitHub Actions）とリファレンス生成の関係（確定）

- `mcp/` は **gitignore** されており、CI のチェックアウトにサーバは存在しない。
  生成器は dist 不在のサーバを**警告してスキップ**し、コミット済みページでビルドを続行する
  （exit 0）。dist が**あるのに**握手に失敗した場合は従来どおり fail（古いページを黙って
  出荷しないため）。
- つまり**正典との同期はローカルの `npm run build`（または generate 単体）で行い、
  生成結果をコミットして CI に運ぶ**。deploy.yml は site/** の変更で発火するので
  生成ページのコミットがそのままデプロイに繋がる。
- handshake timeout のエラーにはサーバ stderr の末尾が付くようにした（CI での診断用）。

## 未解決

- **Safari のみ**: preview/dev でページナビゲーション時にコンテンツが非表示になり、
  リロードで表示される（Chrome では起きない）。llms プラグインの dev 問題とは別。
  原因未特定 — 再現時は Safari の Web インスペクタでコンソールエラーを取ること。
- ~~en サイトの Translation pending~~ → **2026-08-08 解消**。手書き層 23 ページを英訳済み
  （ja が正典。ja を更新したら en も追従させること — 同期の仕組みは未整備で人力）。
  en に残る日本語は pdf-writer リファレンスの生成部のみ（→ Issue 下書き・案 a）。
- ja / en とも use-cases 6 ページは Phase 2 執筆待ち。

## このセッションで済んだこと（サイト関連）

ロゴ SVG 化（potrace・#B41535）/ 赤テーマ / ja 全面「である」調・「サーバー」統一 /
frontmatter description / リファレンス 4 台自動生成 + 翻訳メモリ / llms.txt 導入 /
プロフィール repo（shuji-bonji/shuji-bonji）の PDF family 記述を 4 層構成に更新。
