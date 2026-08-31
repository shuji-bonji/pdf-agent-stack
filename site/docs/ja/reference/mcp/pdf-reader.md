---
description: "pdf-reader-mcp v0.14.0 の全 19 ツールの引数・型・既定値・戻り値（tools/list から自動生成）"
---

# pdf-reader-mcp — ツールリファレンス

<!-- GENERATED FILE — do not edit. Source of truth: the server itself. -->

::: info
**v0.14.0** の `tools/list` ハンドシェイクから自動生成（19 ツール・2026-08-31）。手で編集しない — 再生成は `node scripts/generate-reference.mjs`。日本語訳は翻訳メモリ（scripts/i18n）から適用され、原文が更新された項目は同期されるまで英語で表示される。
:::

**このページは自動生成リファレンス** — 全ツールの引数・型・既定値・戻り値を `tools/list`（正典 = サーバー実装）から写したもの。責務・設計思想・使いどころの解説は[解説ページ](/ja/mcp/pdf-reader)へ。

## ツール一覧

| ツール | 概要 |
|---|---|
| [`get_page_count`](#get-page-count) | PDF 文書の総ページ数を取得する。 |
| [`get_metadata`](#get-metadata) | タイトル・作成者・作成日・ページ数・PDF バージョン・構造情報など、PDF 文書のメタデータを抽出する。 |
| [`read_text`](#read-text) | Y 座標に基づく読み順を保って PDF 文書からテキストを抽出する。 |
| [`search_text`](#search-text) | PDF 文書内のテキストを検索する。 |
| [`read_images`](#read-images) | PDF 文書から埋め込み画像を PNG または JPEG ファイルとして抽出する。 |
| [`read_url`](#read-url) | URL から PDF を取得してテキストを抽出する。 |
| [`render_page`](#render-page) | PDF のページを PNG または JPEG 画像にラスタライズし、MCP の image コンテンツブロックで返す。 |
| [`summarize`](#summarize) | PDF 文書の概観レポートを手早く生成する。 |
| [`inspect_structure`](#inspect-structure) | カタログのエントリ・ページツリー・オブジェクト統計など、PDF の内部オブジェクト構造を調べる。 |
| [`inspect_tags`](#inspect-tags) | アクセシビリティ評価のために、タグ付き PDF の構造ツリーを分析する。 |
| [`inspect_fonts`](#inspect-fonts) | PDF 文書で使われている全フォントをプロパティ付きで一覧する。 |
| [`inspect_annotations`](#inspect-annotations) | PDF 文書内の全注釈を抽出して種類別に分類する。 |
| [`inspect_signatures`](#inspect-signatures) | PDF 文書のデジタル署名フィールドを調べる。 |
| [`extract_tables`](#extract-tables) | タグ付き PDF の全 `<Table>` サブツリーを、構造化された行/セルのリストとして抽出する。 |
| [`extract_structured_text`](#extract-structured-text) | タグ付き PDF のテキストを論理コンテンツ順で抽出し、各断片に構造タイプのラベルを付ける。 |
| [`locate_objects`](#locate-objects) | 指定したオブジェクトがページ上のどこにあるかを報告する。 |
| [`validate_tagged`](#validate-tagged) | [非推奨 — 次のメジャーバージョンで削除予定] |
| [`validate_metadata`](#validate-metadata) | [非推奨 — 次のメジャーバージョンで削除予定] |
| [`compare_structure`](#compare-structure) | 2 つの PDF 文書の内部構造を比較し、差分を特定する。 |

## get_page_count

**Get PDF Page Count**

PDF 文書の総ページ数を取得する。

PDF ヘッダのみを読む軽量な操作で、本文全体は読まない。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **必須** |  | ローカル PDF ファイルへの絶対パス（例: "/path/to/document.pdf"） |

### 戻り値

ページ数（数値）。

例:
- どのページを抽出するか決める前の簡易チェック
- PDF ファイルが読めるかの確認

## get_metadata

**Get PDF Metadata**

タイトル・作成者・作成日・ページ数・PDF バージョン・構造情報など、PDF 文書のメタデータを抽出する。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **必須** |  | ローカル PDF ファイルへの絶対パス（例: "/path/to/document.pdf"） |
| `response_format` | `"markdown"` \| `"json"` | 任意 | `"markdown"` | 出力形式: "markdown" は人が読む用、"json" は構造化データ |

### 戻り値

メタデータ一式: タイトル・作成者・件名・キーワード・作成アプリ・生成アプリ・作成/更新日時・ページ数・PDF バージョン・linearized/暗号化/タグ付き/署名フラグ・ファイルサイズ。

例:
- 台帳管理用に文書プロパティを取得
- タグ付き PDF か確認（アクセシビリティ）
- PDF バージョン互換性の確認

## read_text

**Read PDF Text**

Y 座標に基づく読み順を保って PDF 文書からテキストを抽出する。

テキストはページごとに抽出され、垂直位置（上→下）、次いで水平位置（左→右）で並べ替えられ、自然な読み順になる。

`/ActualText` 置換（ISO 32000-2 §14.9.4）は、同条項が定義する 2 つの経路 — 構造要素の `/ActualText` と、`Span` マーク付きコンテンツのプロパティリスト内のもの — の両方で解決される。後者はタグなし文書にも現れる。そのため ActualText として運ばれる語（合字の置換・ハイフネーション処理）は、グリフの形ではなく、ページを見る人が目にする綴りで読める。

**タグ付き** PDF で順序が重要な場合は、依然として `extract_structured_text` の方が適している。あちらは論理コンテンツ順（ISO 32000-2 §14.8.2.5）で返すのに対し、read_text は座標で並べ替えるだけだからである。タグ付き PDF の表は `extract_tables` で読むのが最善。

**タグなし**の多段組 PDF（構造ツリーを持たない旧式の新旧対照表 PDF など）では、`split_columns: 2` または `3` を渡すと X 座標で左から右へ項目を振り分ける。

U+3000 全角空白を視覚的な字下げに使う日本語の帳票・様式 PDF では、`compact_whitespace: true` を渡すと連続する空白が 1 つの ASCII 空白に畳まれる。内容を失わずにトークン消費を 20〜40% 削減できる。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **必須** |  | ローカル PDF ファイルへの絶対パス（例: "/path/to/document.pdf"） |
| `pages` | string | 任意 |  | 処理するページ範囲。形式: "1-5"・"3"・"1,3,5-7"。省略時は全ページ。 |
| `response_format` | `"markdown"` \| `"json"` | 任意 | `"markdown"` | 出力形式: "markdown" は人が読む用、"json" は構造化データ |
| `split_columns` | integer (1–3) | 任意 |  | テキスト並べ替えに使う段数。1（既定）= 従来の Y ソート。2 または 3 = X 座標で左から右へ振り分け。Y ソートでは段が交錯するタグなしの新旧対照表 / 2 段組 PDF に使う。適切な `<Table>` マークアップを持つタグ付き PDF は extract_tables を使うこと。 |
| `compact_whitespace` | boolean | 任意 |  | true にすると連続空白（全角空白 U+3000 含む）を 1 つの ASCII 空白に畳み、各行をトリムする。日本語の帳票様式 PDF でトークン消費を削減する。既定: false（空白の正規化なし）。 |

### 戻り値

`{ scope, pages }`. `pages` is the extracted text organized by page number, preceded by the extractability tally. With `split_columns >= 2`, columns are separated by a blank line so a downstream LLM can tell them apart.

Examples:
- Extract all text: { file_path: "/path/to/doc.pdf" }
- Untagged 新旧対照表: { file_path: "/path/to/older-shinkyu.pdf", split_columns: 2 }
- Japanese form template: { file_path: "/path/to/form.pdf", compact_whitespace: true }

## search_text

**Search PDF Text**

PDF 文書内のテキストを検索する。一致位置を前後の文脈付きで返す。

全ページまたは指定ページを対象に、大文字小文字を区別せず検索する。各一致にはページ番号・一致テキスト・設定可能な前後文脈が含まれる。

検索は `read_text` が返すのと同じテキストに対して走るため、`/ActualText` 置換（ISO 32000-2 §14.9.4）後の綴りでヒットする。ActualText として運ばれる語（合字の置換・ハイフネーション処理）は、グリフの形ではなくビューアが表示する綴りで見つかる。まれにページのマーク付きコンテンツを抽出テキストと突き合わせられず、置換が未解決のまま残ることがある。ヒット 0 件の検索でそれが起きた場合、結果に該当ページを名指しする `note` が付く。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **必須** |  | ローカル PDF ファイルへの絶対パス（例: "/path/to/document.pdf"） |
| `query` | string (minLength 1) | **必須** |  | 検索するテキスト（大文字小文字を区別しない） |
| `pages` | string | 任意 |  | 処理するページ範囲。形式: "1-5"・"3"・"1,3,5-7"。省略時は全ページ。 |
| `context_chars` | integer (0–500) | 任意 | `80` | 各一致の前後に表示する文字数 |
| `max_results` | integer (1–100) | 任意 | `20` | 返す一致の最大数 |
| `response_format` | `"markdown"` \| `"json"` | 任意 | `"markdown"` | 出力形式: "markdown" は人が読む用、"json" は構造化データ |

### 戻り値

Search matches with page number, matched text, and surrounding context, plus `scope` — which of the two readings behind the answer were done: searching the characters on the page, and observing whether those characters have a route to Unicode (ISO 32000-2 §9.10.1). When the search itself could not run, `totalMatches` and `matches` are `null` rather than `0` and `[]`: "could not search" and "searched and found nothing" are different answers.

Examples:
- Search entire PDF: { file_path: "/path/to/doc.pdf", query: "digital signature" }
- Search specific pages: { file_path: "/path/to/doc.pdf", query: "error", pages: "1-10" }

## read_images

**Read PDF Images**

PDF 文書から埋め込み画像を PNG または JPEG ファイルとして抽出する。

各画像は MCP の image コンテンツブロックで返るため、視覚対応モデルがそのまま見られる。text ブロックには全画像のメタ情報（ページ・インデックス・ファイル内の寸法・返した寸法・色空間・エンコード後バイト数）を一覧する。

返すのはページが描く画像 XObject であって、ページの絵ではない。内容がベクタ描画のページや、見たいものがテキストであるページは、このツールの対象外。

応答サイズには上限がある: 1 回の呼び出しにつきエンコード済み画像データで最大 4 MB。予算を超えた画像は text ブロックに理由付きで名指しされ、返されない — 黙って落とされることはない。200 dpi の A4 スキャンはそれだけで約 11.6 MB のピクセルになるため、スキャンを扱うときは `pages`・`max_width`・`max_height` を渡すこと。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **必須** |  | ローカル PDF ファイルへの絶対パス（例: "/path/to/document.pdf"） |
| `pages` | string | 任意 |  | 処理するページ範囲。形式: "1-5"・"3"・"1,3,5-7"。省略時は全ページ。 |
| `format` | `"png"` \| `"jpeg"` | 任意 |  | 返す画像のエンコード形式。png（既定）は可逆。jpeg は小さく、アルファは白に合成して落とす。 |
| `quality` | integer (1–100) | 任意 |  | JPEG 品質 1-100（既定 80）。format が png のときは無視される。 |
| `max_width` | integer (1–10000) | 任意 |  | この幅を超える画像を縮小する（元ピクセルの面積平均）。拡大は決してしない。省略時は各画像を元の寸法のまま返す。 |
| `max_height` | integer (1–10000) | 任意 |  | この高さを超える画像を縮小する。拡大は決してしない。 |

### 戻り値

メタ情報の表と省略の一覧を載せた text ブロック、続いて返す画像 1 つにつき 1 つの image コンテンツブロック。

例:
- 全画像抽出: { file_path: "/path/to/doc.pdf" }
- スキャンページを見られる大きさで: { file_path: "/path/to/scan.pdf", pages: "1", max_width: 1200, format: "jpeg" }

## read_url

**Read PDF from URL**

URL から PDF を取得してテキストを抽出する。このツールが返すのは**テキストだけ**である — 下記の射程の注記を参照。

指定 URL から PDF をダウンロードし、Y 座標に基づく読み順でテキストを抽出する。HTTP / HTTPS に対応。最大ファイルサイズ 50MB、タイムアウト 30 秒。

**射程 (#25):** 取得したバイト列は抽出後に破棄される — このツールは意図的に保存しない。本サーバの他のツールはすべて `file_path` を取るため、URL 上の PDF に search_text・inspect_structure・extract_tables・render_page などを使うには、**先に**ファイルをローカルディスクへダウンロードし（呼び出し側環境が持つ取得手段で）、そのパスを渡すこと。これにより本サーバの全ツールはファイルシステムに対して read-only のままでいられる — ファイルを書くのは reader の仕事ではない。read_url は 1 回きりの問い「この URL の文書には何が書いてあるか」のためにある。

`read_text` と同様に、**タグなし**の多段組 PDF 向けの `split_columns: 2 | 3` と、U+3000 / ASCII の連続空白を畳む `compact_whitespace: true` を受け付ける。タグ付き PDF は代わりに `extract_tables` を使うこと。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `url` | string | **必須** |  | PDF ファイルを指す URL（HTTP または HTTPS） |
| `pages` | string | 任意 |  | 処理するページ範囲。形式: "1-5"・"3"・"1,3,5-7"。省略時は全ページ。 |
| `response_format` | `"markdown"` \| `"json"` | 任意 | `"markdown"` | 出力形式: "markdown" は人が読む用、"json" は構造化データ |
| `split_columns` | integer (1–3) | 任意 |  | テキスト並べ替えに使う段数。1（既定）= 従来の Y ソート。2 または 3 = X 座標で左から右へ振り分け。Y ソートでは段が交錯するタグなしの新旧対照表 / 2 段組 PDF に使う。適切な `<Table>` マークアップを持つタグ付き PDF は extract_tables を使うこと。 |
| `compact_whitespace` | boolean | 任意 |  | true にすると連続空白（全角空白 U+3000 含む）を 1 つの ASCII 空白に畳み、各行をトリムする。日本語の帳票様式 PDF でトークン消費を削減する。既定: false（空白の正規化なし）。 |

### 戻り値

`{ scope, pages }`, the same shape as read_text: `pages` is the extracted text by page number, and `scope` says which of the two readings behind it were done — taking the characters off the page, and observing whether those characters have a route to Unicode (ISO 32000-2 §9.10.1). Either can fail on its own; only when neither could be done is this an error, and it then names both reasons.

Examples:
- Read remote PDF: { url: "https://example.com/document.pdf" }
- Untagged 2-column PDF: { url: "https://...", split_columns: 2 }
- Japanese form: { url: "https://...", compact_whitespace: true }

## render_page

**Render PDF Page**

PDF のページを PNG または JPEG 画像にラスタライズし、MCP の image コンテンツブロックで返す。

テキストとして読めない文書のためのツールである: `read_text` が `no_text_layer` や `not_extractable` と報告するページ、ベクタ図形、フォーム、手書き、印影。`read_images` がページの埋め込む画像 XObject を取り出すだけなのに対し、こちらは**ページそのもの** — その上のすべて — を描く。

描画には WebAssembly にコンパイルされた PDFium（optionalDependencies の `@hyzyla/pdfium`）を使う。これは本サーバがテキストを読むのに使う pdf.js とは**別のエンジン**である点に注意 — 壊れたファイルに対する両者の挙動が異なる場合、一方の出力はもう一方の証拠にならない。依存が未インストールなら、このツールはその旨を返し、他のツールはすべて通常どおり動く。

`pages` は必須 — 描画はこのサーバで最も高価な操作であり、大きなスキャンの「全ページ」は既定値ではなく判断であるべきだから。応答が運ぶエンコード済み画像は最大 4 MB。予算を超えたページは理由付きで名指しされ、黙って落とされることはない。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **必須** |  | ローカル PDF ファイルへの絶対パス（例: "/path/to/document.pdf"） |
| `pages` | string (minLength 1) | **必須** |  | 描画するページ範囲。必須: 全ページの描画が暗黙に起きることはない。 |
| `dpi` | integer (36–600) | 任意 |  | ラスタライズ密度（既定 150）。PDF のポイントは 1/72 インチ。 |
| `max_width` | integer (1–10000) | 任意 |  | 描画幅のピクセル上限。dpi より小さくなる場合はこちらが優先。 |
| `format` | `"png"` \| `"jpeg"` | 任意 |  | png（既定・可逆）または jpeg（小さい — スキャンには通常こちら）。 |
| `quality` | integer (1–100) | 任意 |  | JPEG 品質 1-100（既定 80）。png では無視される。 |

### 戻り値

A text block with per-page metadata (point size, pixel size, effective dpi, bytes) and any omissions, then one image content block per rendered page.

Rasterising a page can take unbounded time — a tiling pattern (ISO 32000-2 §8.7.3.1) whose `/XStep` or `/YStep` is a near-zero magnitude asks for an astronomical number of tiles, and the clause forbids only zero. Each page therefore gets 20 seconds (`PDF_READER_RENDER_TIMEOUT_MS` overrides it); the rendering runs off the main thread, so a page that does not finish is stopped and named in the omissions rather than taking the server down with it. The pages rendered before it are still returned, and the pages after it are reported separately as not attempted — "could not be rendered" and "never started" are different answers.

Examples:
- A scanned page: { file_path: "/path/to/scan.pdf", pages: "1", format: "jpeg" }
- A diagram at high detail: { file_path: "/path/to/doc.pdf", pages: "3", dpi: 300 }

## summarize

**Summarize PDF**

PDF 文書の概観レポートを手早く生成する。

メタデータ・テキスト有無の確認・画像数・1 ページ目のテキストプレビューを 1 つの要約にまとめる。どの詳細ツールを使うか決める前の最初の一手に向く。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **必須** |  | ローカル PDF ファイルへの絶対パス（例: "/path/to/document.pdf"） |
| `response_format` | `"markdown"` \| `"json"` | 任意 | `"markdown"` | 出力形式: "markdown" は人が読む用、"json" は構造化データ |

### 戻り値

Summary including: page count, PDF version, file size, tagged/encrypted/signature flags, text presence, per-document text extractability, the pages that are not fully extractable, image count, a text preview from page 1, and the `next` suggestions.

Four separate readings produce that summary — the document information, the text of page 1, the image count, and the extractability observation — and any of them can fail on its own. `scope` says which were done. A field whose reading did not happen is `null`, never `0`, `false` or `""`: "not read" and "read and found nothing" are different answers, and `next` stays silent about any premise that was not observed.

Examples:
- Quick overview: { file_path: "/path/to/doc.pdf" }
- Machine-readable: { file_path: "/path/to/doc.pdf", response_format: "json" }

## inspect_structure

**Inspect PDF Structure**

カタログのエントリ・ページツリー・オブジェクト統計など、PDF の内部オブジェクト構造を調べる。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **必須** |  | ローカル PDF ファイルへの絶対パス（例: "/path/to/document.pdf"） |
| `response_format` | `"markdown"` \| `"json"` | 任意 | `"markdown"` | 出力形式: "markdown" は人が読む用、"json" は構造化データ |

### 戻り値

カタログのエントリ（キーと型）・ページツリー情報（ページ数・MediaBox のサンプル）・オブジェクト統計（総数・ストリーム数・型分布）・暗号化状態。

例:
- 構造的特徴を見るためにカタログを調べる
- PDF のオブジェクトとストリームを数える
- 文書全体のページ寸法を確認する

## inspect_tags

**Inspect Tagged PDF Structure**

アクセシビリティ評価のために、タグ付き PDF の構造ツリーを分析する。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **必須** |  | ローカル PDF ファイルへの絶対パス（例: "/path/to/document.pdf"） |
| `response_format` | `"markdown"` \| `"json"` | 任意 | `"markdown"` | 出力形式: "markdown" は人が読む用、"json" は構造化データ |

### 戻り値

タグ付きかどうか・role 付き構造ツリー階層・最大ネスト深さ・要素総数・role 分布（例: Document, P, H1, Table, Figure）。

例:
- アクセシビリティ（PDF/UA）向けにタグ付きか確認
- タグ階層と role 分布を調べる
- 文書構造の品質を評価する

## inspect_fonts

**Inspect PDF Fonts**

PDF 文書で使われている全フォントをプロパティ付きで一覧する。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **必須** |  | ローカル PDF ファイルへの絶対パス（例: "/path/to/document.pdf"） |
| `response_format` | `"markdown"` \| `"json"` | 任意 | `"markdown"` | 出力形式: "markdown" は人が読む用、"json" は構造化データ |

### 戻り値

フォント名・型（TrueType, Type1, CIDFont 等）・エンコーディング・埋め込み/サブセット状況・使用ページ。

例:
- 全フォント埋め込みか確認（PDF/A・PDF/X の前提）
- フォントの型とエンコーディングを特定
- 特定フォントを使うページを探す

## inspect_annotations

**Inspect PDF Annotations**

PDF 文書内の全注釈を抽出して種類別に分類する。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **必須** |  | ローカル PDF ファイルへの絶対パス（例: "/path/to/document.pdf"） |
| `pages` | string | 任意 |  | 処理するページ範囲。形式: "1-5"・"3"・"1,3,5-7"。省略時は全ページ。 |
| `response_format` | `"markdown"` \| `"json"` | 任意 | `"markdown"` | 出力形式: "markdown" は人が読む用、"json" は構造化データ |

### 戻り値

注釈総数・種類別（Link, Widget, Highlight, Text 等）とページ別の内訳・リンク/フォーム/マークアップ有無のフラグ・個別詳細。

例:
- フォームフィールド（Widget 注釈）の有無を確認
- 文書内の全リンクを探す
- マークアップ注釈（ハイライト・コメント）の棚卸し

## inspect_signatures

**Inspect PDF Digital Signatures**

PDF 文書のデジタル署名フィールドを調べる。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **必須** |  | ローカル PDF ファイルへの絶対パス（例: "/path/to/document.pdf"） |
| `response_format` | `"markdown"` \| `"json"` | 任意 | `"markdown"` | 出力形式: "markdown" は人が読む用、"json" は構造化データ |

### 戻り値

署名フィールド総数・署名済み/未署名の内訳・各フィールドの詳細（署名者名・理由・場所・署名日時・filter/subFilter）。

注意: 本ツールは署名フィールドの構造を調べるだけで、暗号学的な署名検証は行わない。

例:
- PDF が電子署名されているか確認
- 署名者情報と署名日時を調べる
- 署名フィールドの構造を確認

## extract_tables

**Extract Tables (Tagged PDF)**

タグ付き PDF の全 `<Table>` サブツリーを、構造化された行/セルのリストとして抽出する。オプションで Markdown 表としても描画できる。

仕組み: 文書の StructTreeRoot を深さ優先で走査し（`extract_structured_text` / `inspect_tags` と同じウォーカー）、各 `<TR>` → `<TH>`/`<TD>` のセルテキストを取り出し、カーニング空白を畳む（例: "消 費 税 法" → "消費税法"）。これにより多段組の表（新旧対照表 PDF に典型）で読み順抽出が陥る失敗モードを回避する。

改ページをまたいで続く表は 1 つの表である（ISO 32000-2 §14.8.2.5 NOTE 2）— `pages` は配列であり、指定ページ範囲に触れる表は丸ごと返る。セルテキストは `/ActualText` 置換（§14.9.4）を反映する。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **必須** |  | ローカル PDF ファイルへの絶対パス（例: "/path/to/document.pdf"） |
| `pages` | string | 任意 |  | 処理するページ範囲。形式: "1-5"・"3"・"1,3,5-7"。省略時は全ページ。 |
| `response_format` | `"markdown"` \| `"json"` | 任意 | `"markdown"` | 出力形式: "markdown" は人が読む用、"json" は構造化データ |

### 戻り値

Markdown — `# Extracted Tables` の要約ブロックに続き、表ごとに GFM 表付きの `## Table N — Page(s) …` 節。

JSON — `{ isTagged, tables: [{ pages, index, headerRows, bodyRows, footerRows }], totalTables, pagesScanned, note? }`。`index` は文書全体の論理コンテンツ順での 1 始まりの位置。

制限:
- タグなし PDF は空の結果と `note` を返す。
- colspan/rowspan は反映されない（セルはソース順に列挙）。
- 入れ子の表は個別に出力されない（テキストは外側のセルに現れる）。

例:
- 改正通達 PDF から新旧対照表を取り出して差分を取る
- 帳票（様式）の表を構造化データに変換する

## extract_structured_text

**Extract Structured Text**

タグ付き PDF のテキストを論理コンテンツ順で抽出し、各断片に構造タイプのラベルを付ける。

「H1 のテキストは何か」に答えるツールである — read_text（フラット・座標順）、inspect_tags（構造のみ・テキストなし）、extract_tables（テキストは表のみ）のいずれにもできない。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **必須** |  | ローカル PDF ファイルへの絶対パス（例: "/path/to/document.pdf"） |
| `pages` | string | 任意 |  | 処理するページ範囲。形式: "1-5"・"3"・"1,3,5-7"。省略時は全ページ。範囲に触れる要素は、範囲外に続いていても丸ごと返る。 |
| `roles` | string[] | 任意 |  | 含める構造タイプ。例: アウトライン抽出なら ["H1","H2"]。省略時は全 role。 |
| `include_bbox` | boolean | 任意 | `false` | 各要素の描画位置も boxes として報告する: PDF 既定ユーザー空間（原点は左下・pt・正規化済み）でページごとに 1 矩形 — pdf-writer-mcp の add_annotation が受け取る形。各矩形には basis が付く: "layout-attribute-bbox"（ファイルが宣言する /BBox）または "text-extent"（要素のテキストから実測。画像・ベクター描画は寄与しない）。矩形の無い要素には理由を述べる boxNote が付く。既定は off: 全ページをもう一巡するコストがかかる。 |
| `response_format` | `"markdown"` \| `"json"` | 任意 | `"markdown"` | 出力形式: "markdown" は人が読む用、"json" は構造化データ |

### 戻り値

isTagged, the document language, and a flat list of elements in logical content order.
Each element has: role, depth (nesting; top level is 0), text, pages, and optionally
alt / label / rows / boxes / boxNote.

`scope` says which of the two readings behind that answer were done — reading the structure tree, and observing whether the characters under it have a route to Unicode (ISO 32000-2 §9.10.1). When the structure tree could not be read, `isTagged` and `elements` are `null` rather than `false` and `[]`: "not read" and "read and found no tags" are different answers.

The list is flat with a depth field rather than nested — a depth-first pre-order plus
depth encodes the tree exactly, so nothing is lost. Table is the exception and carries
rows, because a table is two-dimensional and depth cannot express "row 2, column 3".

Key properties:
- Order is a depth-first traversal of the document's structure tree, which is how
  ISO 32000-2 §14.8.2.5 defines logical content order.
- An element that spans pages stays ONE element (pages is an array). A paragraph
  split across a page break is returned as one paragraph, not two.
- ActualText replaces the glyphs when present (§14.9.4: "a replacement, not a
  description"). Alt is reported separately in alt and never as text — it describes
  content that has no text (§14.9.3), so it must not leak into the body.
- Lbl (a list bullet or number) is reported in label, not mixed into text.
- Artifacts (page numbers, running heads) are excluded: §14.8.2.5 NOTE 3 puts them
  outside the logical content order.

With include_bbox (answers "where is this paragraph?", so an annotation can be placed on it):
Each element gains boxes — ONE RECTANGLE PER PAGE, because an element that spans pages
has no single rectangle. Each is { page, rect: {x1,y1,x2,y2}, basis } in PDF default user
space (origin bottom-left, pt, already normalised), which is exactly what pdf-writer-mcp
add_annotation takes: no coordinate system has to be reinterpreted in between. /Rotate and
a shifted /CropBox do not affect it.

basis says how strong the claim is, and the two are not the same kind of claim:
  - layout-attribute-bbox — the /BBox the file DECLARES for the element (ISO 32000-2
    Table 379). A statement by the producer about its own geometry, reported as-is.
    This is the only source for content that has no text.
  - text-extent — MEASURED from the text the element owns: baseline origin plus the
    font's ascent/descent. That is the line box, not the glyph outlines. Images and
    vector drawings contribute nothing to it.

When a declared /BBox does not cover the text measured inside it, that disagreement is
reported in boxNote rather than smoothed over.

An element with no rectangle has no boxes and carries boxNote saying why — a Figure
holding one image is the usual case (§14.8.4.8.5: such an element "should have a BBox
attribute"). Absent is not zero-sized, and neither is guessed at.

Untagged PDFs return isTagged: false with a reason and no elements. Nothing is guessed
from coordinates — §14.8.2.5 NOTE 1 is explicit that page order need not match logical
order, so a guess could not be trusted. To add a structure scaffold, use pdf-writer-mcp
ensure_tagged and retry.

Examples:
- Extract a document outline: { file_path: "/doc.pdf", roles: ["H1","H2","H3"] }
- Get content for reflow / conversion, structure preserved: { file_path: "/doc.pdf" }
- Read the text of a specific section's pages: { file_path: "/doc.pdf", pages: "4-6" }
- Find where to put an annotation:
  { file_path: "/doc.pdf", roles: ["P"], include_bbox: true } → hand a box straight to
  pdf-writer-mcp add_annotation. To go the other way, from an object number a diff
  reported to a rectangle, use locate_objects.

## locate_objects

**Locate PDF Objects (object number → page and rectangle)**

指定したオブジェクトがページ上のどこにあるかを報告する。

「どのオブジェクトか」を「どの座標か」へ橋渡しする: pdf-verify-mcp の verify_integrity は増分更新が変更したオブジェクトを名指しし、pdf-writer-mcp の add_annotation はページ番号と矩形を要求する。矩形は PDF ユーザー空間（原点は左下・pt・x1 < x2 かつ y1 < y2 — ISO 32000-1 §7.9.5 の正規化形）で返り、これはまさに add_annotation が受け取る形である。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **必須** |  | ローカル PDF ファイルへの絶対パス（例: "/path/to/document.pdf"） |
| `object_numbers` | integer (1–9007199254740991)[] | **必須** |  | 位置を特定するオブジェクト番号。例: [25, 27]。通常は pdf-verify-mcp の verify_integrity が「変更された」と報告したオブジェクト。 |
| `response_format` | `"markdown"` \| `"json"` | 任意 | `"markdown"` | 出力形式: "markdown" は人が読む用、"json" は構造化データ |

### 戻り値

オブジェクトごとに: 存在の有無・/Type と /Subtype・占める場所。各場所には座標の根拠（basis）が付く:
- annotation-rect — オブジェクト自身の /Rect。正確。
- page-box — オブジェクトはページで、矩形はその crop/media box。
- page-content-stream — オブジェクトはページを描く。矩形はページ全体であり、変わった部分ではない。
- page-resource — ページが使うフォント・画像・色空間。矩形は存在しない。

限界（観測であり判定ではない）:
- コンテンツストリームを移動した段落まで絞り込むにはグラフィックス状態付きのストリーム走査が要る。本ツールはそれを行わず、矩形を発明する代わりにそう言う。
- 存在しないオブジェクト（後のリビジョンで解放）は found: false で返る —「座標なし」としてではなく。
- 暗号化文書でも座標と型は信頼できる（数値と名前は暗号化されない。ISO 32000-1 §7.6.2）が、フィールド名は文字化けの代わりに null で報告される。

例:
- verify_integrity の「obj 27 が署名後に追加された」をページと矩形に変換する
- 変更されたフォームフィールドの Widget がどのページにあるか、注釈を付ける前に特定する

## validate_tagged

**Validate Tagged PDF (deprecated)**

::: warning 非推奨
:::

[非推奨 — 次のメジャーバージョンで削除予定]

pdf-verify-mcp の `validate_conformance`（`flavour: "pdfua-1"` または `"pdfua-2"`）を推奨する。
単なる置き換えではなく上位互換である: Figure タグの `/Alt`・`/ActualText` の実値を検証し（本ツールは Figure を数えるだけ）、Link の `/Contents` を確認し、カタログから StructTreeRoot を直接検査し（本ツールはページごとに合成する）、ISO 14289 の条文を引用し、利用可能なら veraPDF に委譲する。

理由: family の境界は「ISO 規格に対する合否は pdf-verify-mcp、観測の報告は pdf-reader-mcp」である。本ツールは pdf-verify-mcp より前からあり、例外だった。構造ツリーの事実が要るなら `inspect_tags` を使うこと — そちらは非推奨ではない。

本ツールは手早い事前チェックとしては今も機能する。実行されるのは以下の検査のみで、ここで合格しても PDF/UA 準拠を意味しない。

PDF/UA のタグ付き構造要件を検証する。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **必須** |  | ローカル PDF ファイルへの絶対パス（例: "/path/to/document.pdf"） |
| `response_format` | `"markdown"` \| `"json"` | 任意 | `"markdown"` | 出力形式: "markdown" は人が読む用、"json" は構造化データ |

### 戻り値

Validation results including: whether the PDF is tagged, total checks performed, pass/fail counts, detailed issues with severity levels (error/warning/info), and a summary.

`totalChecks` counts the checks that were actually decided. A check whose premise could not be observed is not counted there and appears in `notChecked` with the reason — TAG-005 judges Figure tags against the number of images the page draws, so without that number it would have to assume zero images and would report a pass for something nobody looked at.

Checks performed:
- Document marked as tagged
- Structure tree root existence
- Document root tag presence
- Heading hierarchy (H1-H6) sequential order
- Figure tags for images
- Paragraph tag presence
- Structure element count
- Table tag structure (TR/TH/TD)

Examples:
- Check if a PDF meets PDF/UA accessibility requirements
- Identify missing or incorrect tag structure
- Assess document accessibility quality

## validate_metadata

**Validate PDF Metadata (deprecated)**

::: warning 非推奨
:::

[非推奨 — 次のメジャーバージョンで削除予定]

規格準拠の判定には pdf-verify-mcp の `validate_conformance`（`flavour: "pdfua-1"` / `"pdfa-*"`）を推奨する。ISO の本文に照らして判定し、利用可能なら veraPDF に委譲する。メタデータのフィールドを読むだけなら `get_metadata` を使うこと。

理由: family の境界は「ISO 規格に対する合否は pdf-verify-mcp、観測の報告は pdf-reader-mcp」である。本ツールは pdf-verify-mcp より前からある。

既知の制限（修正予定なし — 上位互換に置き換え）: 検査対象は文書情報辞書（Info）のみである。PDF/UA-1 §7.1 は XMP メタデータストリームの `dc:title` を要求し、適合リーダーは Info 辞書を「無視しなければならない」と定める。さらに `ViewerPreferences/DisplayDocTitle = true` と `Suspects = false` も要求されるが、ここではいずれも検査しない。ISO 32000-2 §14.3.3 は CreationDate/ModDate を除き Info 辞書を非推奨としている。以下の結果は一般的なベストプラクティスの示唆として扱い、PDF/UA・PDF/A の根拠にしないこと。

メタデータをベストプラクティスと仕様要件に照らして検証する。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **必須** |  | ローカル PDF ファイルへの絶対パス（例: "/path/to/document.pdf"） |
| `response_format` | `"markdown"` \| `"json"` | 任意 | `"markdown"` | 出力形式: "markdown" は人が読む用、"json" は構造化データ |

### 戻り値

検証結果: 検査総数・合否件数・重要度付きの詳細・メタデータフィールド有無の要約・全体要約。

実施される検査（すべて Info 辞書に対して — 上記の制限を参照）:
- タイトルの有無（ベストプラクティス。PDF/UA の根拠は XMP の dc:title であり、これではない）
- 作成者の有無
- 作成日の形式検証
- 更新日の有無
- 生成アプリの特定
- PDF バージョンの検出
- タグ付きフラグの状態
- 件名・キーワードの有無
- 暗号化とアクセシビリティへの影響

例:
- 公開基準に向けたメタデータ充足の簡易チェック
- （PDF/A 長期保存・PDF/UA 準拠の判定は pdf-verify-mcp の validate_conformance を使うこと）

## compare_structure

**Compare PDF Structures**

2 つの PDF 文書の内部構造を比較し、差分を特定する。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `file_path_1` | string (minLength 1) | **必須** |  | 比較する 1 つ目の PDF ファイルへの絶対パス |
| `file_path_2` | string (minLength 1) | **必須** |  | 比較する 2 つ目の PDF ファイルへの絶対パス |
| `response_format` | `"markdown"` \| `"json"` | 任意 | `"markdown"` | 出力形式: "markdown" は人が読む用、"json" は構造化データ |

### 戻り値

Structural comparison including: property-by-property diff (page count, PDF version, encryption, tagged status, object counts, page dimensions, file size, catalog entries, signatures), font comparison (fonts unique to each file and shared fonts), and a summary.

The comparison needs both files, so an unreadable file is an error — but the error names which of the two could not be read, and says that the other one was fine.

Examples:
- Compare two versions of the same document
- Verify structural consistency across PDF exports
- Identify differences in PDF generation pipelines
