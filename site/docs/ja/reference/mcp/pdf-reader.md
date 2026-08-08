---
description: "pdf-reader-mcp v0.11.1 の全 18 ツールの引数・型・既定値・戻り値（tools/list から自動生成）"
---

# pdf-reader-mcp — ツールリファレンス

<!-- GENERATED FILE — do not edit. Source of truth: the server itself. -->

::: info
**v0.11.1** の `tools/list` ハンドシェイクから自動生成（18 ツール・2026-08-08）。手で編集しない — 再生成は `node scripts/generate-reference.mjs`。日本語訳は翻訳メモリ（scripts/i18n）から適用され、原文が更新された項目は同期されるまで英語で表示される。
:::

## ツール一覧

| ツール | 概要 |
|---|---|
| [`get_page_count`](#get-page-count) | PDF 文書の総ページ数を取得する。 |
| [`get_metadata`](#get-metadata) | タイトル・作成者・作成日・ページ数・PDF バージョン・構造情報など、PDF 文書のメタデータを抽出する。 |
| [`read_text`](#read-text) | Y 座標に基づく読み順を保って PDF 文書からテキストを抽出する。 |
| [`search_text`](#search-text) | PDF 文書内のテキストを検索する。一致位置を前後の文脈付きで返す。 |
| [`read_images`](#read-images) | PDF 文書から画像を base64 エンコードで抽出する。 |
| [`read_url`](#read-url) | URL から PDF を取得してテキストを抽出する。 |
| [`summarize`](#summarize) | PDF 文書の概観レポートを手早く生成する。 |
| [`inspect_structure`](#inspect-structure) | カタログのエントリ・ページツリー・オブジェクト統計など、PDF の内部オブジェクト構造を調べる。 |
| [`inspect_tags`](#inspect-tags) | アクセシビリティ評価のために、タグ付き PDF の構造ツリーを分析する。 |
| [`inspect_fonts`](#inspect-fonts) | PDF 文書で使われている全フォントをプロパティ付きで一覧する。 |
| [`inspect_annotations`](#inspect-annotations) | PDF 文書内の全注釈を抽出して種類別に分類する。 |
| [`inspect_signatures`](#inspect-signatures) | PDF 文書のデジタル署名フィールドを調べる。 |
| [`extract_tables`](#extract-tables) | タグ付き PDF の全 `<Table>` サブツリーを、構造化された行/セルのリストとして抽出する。オプションで Markdown 表としても描画できる。 |
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

ページ番号ごとに整理された抽出テキスト。`split_columns >= 2` の場合、後段の LLM が区別できるよう段組は空行で区切られる。

例:
- 全文抽出: { file_path: "/path/to/doc.pdf" }
- タグなしの新旧対照表: { file_path: "/path/to/older-shinkyu.pdf", split_columns: 2 }
- 日本語の帳票: { file_path: "/path/to/form.pdf", compact_whitespace: true }

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

ページ番号・一致テキスト・前後文脈付きの検索結果。

例:
- PDF 全体を検索: { file_path: "/path/to/doc.pdf", query: "digital signature" }
- ページを絞って検索: { file_path: "/path/to/doc.pdf", query: "error", pages: "1-10" }

## read_images

**Read PDF Images**

PDF 文書から画像を base64 エンコードで抽出する。

指定ページまたは全ページから埋め込み画像を抽出し、画像のメタ情報（寸法・色空間）と base64 の生ピクセルデータを返す。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **必須** |  | ローカル PDF ファイルへの絶対パス（例: "/path/to/document.pdf"） |
| `pages` | string | 任意 |  | 処理するページ範囲。形式: "1-5"・"3"・"1,3,5-7"。省略時は全ページ。 |

### 戻り値

抽出画像の配列: ページ番号・インデックス・幅・高さ・色空間（RGB/RGBA/Grayscale）・成分あたりビット数・base64 データ。

注意: 大きな画像は応答が非常に大きくなる。pages で範囲を絞ること。

例:
- 全画像を抽出: { file_path: "/path/to/doc.pdf" }
- 1 ページ目から抽出: { file_path: "/path/to/doc.pdf", pages: "1" }

## read_url

**Read PDF from URL**

URL から PDF を取得してテキストを抽出する。

指定 URL から PDF をダウンロードし、Y 座標に基づく読み順でテキストを抽出する。HTTP / HTTPS に対応。最大ファイルサイズ 50MB、タイムアウト 30 秒。

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

ページ番号ごとに整理された抽出テキスト（read_text と同じ形式）。

例:
- リモート PDF を読む: { url: "https://example.com/document.pdf" }
- タグなし 2 段組 PDF: { url: "https://...", split_columns: 2 }
- 日本語の帳票: { url: "https://...", compact_whitespace: true }

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

概要: ページ数・PDF バージョン・ファイルサイズ・タグ付き/暗号化/署名フラグ・テキスト有無・画像数・1 ページ目のプレビュー。

例:
- 手早く概観: { file_path: "/path/to/doc.pdf" }
- 機械可読で: { file_path: "/path/to/doc.pdf", response_format: "json" }

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

isTagged・文書の言語・論理コンテンツ順の要素のフラットなリスト。
各要素は role・depth（ネスト。トップレベルは 0）・text・pages と、必要に応じて alt / label / rows / boxes / boxNote を持つ。

リストは入れ子ではなく depth フィールド付きのフラット構造である — 深さ優先の行きがけ順 + depth で木は正確に符号化され、失われるものはない。例外は Table で、rows を持つ。表は二次元であり、depth では「2 行目の 3 列目」を表せないからである。

主な性質:
- 順序は文書の構造ツリーの深さ優先走査で、ISO 32000-2 §14.8.2.5 が定義する論理コンテンツ順そのものである。
- ページをまたぐ要素は 1 つの要素のまま（pages は配列）。改ページで分かれた段落は 2 つではなく 1 つの段落として返る。
- ActualText があればグリフを置き換える（§14.9.4:「説明ではなく置換」）。Alt は alt に分けて報告され、text には決して入らない — テキストを持たない内容の説明であり（§14.9.3）、本文に漏れてはならない。
- Lbl（リストの行頭記号や番号）は label に報告され、text には混ざらない。
- アーティファクト（ページ番号・柱）は除外される: §14.8.2.5 NOTE 3 が論理コンテンツ順の外に置いている。

include_bbox 付き（「この段落はどこにあるか」に答え、注釈を置けるようにする）:
各要素に boxes が付く — ページごとに 1 矩形。ページをまたぐ要素に単一の矩形は無いからである。各矩形は PDF 既定ユーザー空間（原点は左下・pt・正規化済み）の { page, rect: {x1,y1,x2,y2}, basis } で、pdf-writer-mcp の add_annotation がそのまま受け取る形 — 途中で座標系を解釈し直す必要はない。/Rotate やずれた /CropBox の影響も受けない。

basis は主張の強さを示し、両者は同じ種類の主張ではない:
  - layout-attribute-bbox — ファイルが要素について宣言する /BBox（ISO 32000-2 Table 379）。生成者による自己申告の幾何で、そのまま報告される。テキストを持たない内容ではこれが唯一の情報源。
  - text-extent — 要素が持つテキストから実測した値: ベースライン原点とフォントの ascent/descent。つまり行ボックスであり、グリフの輪郭ではない。画像やベクター描画は寄与しない。

宣言された /BBox が中で実測されたテキストを覆わない場合、その食い違いは均されず boxNote で報告される。

矩形を持たない要素は boxes を持たず、理由を述べる boxNote が付く — 画像 1 つを持つ Figure が典型である（§14.8.4.8.5: そのような要素は「BBox 属性を持つべき」）。「無い」は「大きさゼロ」ではなく、推測もしない。

タグなし PDF は理由付きの isTagged: false を返し、要素は返さない。座標からの推測は行わない — §14.8.2.5 NOTE 1 はページ順が論理順と一致するとは限らないと明記しており、推測は信頼できないからである。構造の足場を足すには pdf-writer-mcp の ensure_tagged を使って再試行すること。

例:
- 文書のアウトラインを抽出: { file_path: "/doc.pdf", roles: ["H1","H2","H3"] }
- リフロー/変換用に構造を保ったまま内容を取得: { file_path: "/doc.pdf" }
- 特定の節のページのテキストを読む: { file_path: "/doc.pdf", pages: "4-6" }
- 注釈を置く場所を探す:
  { file_path: "/doc.pdf", roles: ["P"], include_bbox: true } → 矩形をそのまま pdf-writer-mcp の add_annotation へ。逆方向（差分が報告したオブジェクト番号 → 矩形）は locate_objects を使う。

## locate_objects

**Locate PDF Objects (object number → page and rectangle)**

指定したオブジェクトがページ上のどこにあるかを報告する。

「どのオブジェクトか」を「どの座標か」へ橋渡しする: pdf-verify-mcp の verify_integrity は増分更新が変更したオブジェクトを名指しし、pdf-writer-mcp の add_annotation はページ番号と矩形を要求する。矩形は PDF ユーザー空間（原点は左下・pt・x1 < x2 かつ y1 < y2 — ISO 32000-1 §7.9.5 の正規化形）で返り、これはまさに add_annotation が受け取る形である。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **必須** |  | ローカル PDF ファイルへの絶対パス（例: "/path/to/document.pdf"） |
| `object_numbers` | integer (≥ 1)[] | **必須** |  | 位置を特定するオブジェクト番号。例: [25, 27]。通常は pdf-verify-mcp の verify_integrity が「変更された」と報告したオブジェクト。 |
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

検証結果: タグ付きかどうか・実施した検査数・合否件数・重要度（error/warning/info）付きの詳細・要約。

実施される検査:
- 文書がタグ付きとしてマークされているか
- 構造ツリーのルートの存在
- 文書ルートタグの有無
- 見出し階層（H1-H6）の順序
- 画像の Figure タグ
- 段落タグの有無
- 構造要素数
- 表タグの構造（TR/TH/TD）

例:
- PDF が PDF/UA のアクセシビリティ要件を満たすか確認
- 欠落・不正なタグ構造の特定
- 文書のアクセシビリティ品質の評価

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

構造比較: 項目ごとの差分（ページ数・PDF バージョン・暗号化・タグ付き状態・オブジェクト数・ページ寸法・ファイルサイズ・カタログエントリ・署名）、フォント比較（各ファイル固有のフォントと共有フォント）、要約。

例:
- 同じ文書の 2 版を比較
- PDF 出力間の構造的一貫性を確認
- PDF 生成パイプラインの違いを特定
