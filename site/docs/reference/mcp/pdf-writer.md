---
description: "Tools reference for pdf-writer-mcp v0.17.0 — parameters, types, defaults and returns of all 20 tools, generated from the server's tools/list."
---

# pdf-writer-mcp — Tools Reference

<!-- GENERATED FILE — do not edit. Source of truth: the server itself. -->

::: info
Auto-generated from the `tools/list` handshake of **v0.17.0** (20 tools, 2026-08-08). Do not edit by hand — regenerate with `node scripts/generate-reference.mjs`.
:::

## Tools

| Tool | Summary |
|---|---|
| [`create_text_pdf`](#create-text-pdf) | プレーンテキストから PDF を生成する。 |
| [`create_markdown_pdf`](#create-markdown-pdf) | Markdown から PDF を生成する。 |
| [`create_table_pdf`](#create-table-pdf) | ヘッダと行データから罫線付きの表 PDF を生成する。 |
| [`set_metadata`](#set-metadata) | 既存 PDF のメタデータ(Info 辞書)を更新する。 |
| [`merge_pdfs`](#merge-pdfs) | 複数の PDF を指定順に 1 つへ結合する。 |
| [`split_pdf`](#split-pdf) | PDF をページ範囲ごとに複数ファイルへ分割する。 |
| [`extract_pages`](#extract-pages) | 指定ページだけを含む新しい PDF を作る。 |
| [`delete_pages`](#delete-pages) | 指定ページを削除した新しい PDF を作る。 |
| [`reorder_pages`](#reorder-pages) | ページを並べ替える。 |
| [`add_bookmarks`](#add-bookmarks) | PDF にしおり(アウトライン)を設定する。 |
| [`add_annotation`](#add-annotation) | ページに注釈を 1 つ追加する。 |
| [`stamp_page_numbers`](#stamp-page-numbers) | 各ページにページ番号を刻む。 |
| [`add_watermark`](#add-watermark) | 各ページの中央に斜めの透かし文字を重ねる("社外秘" / "DRAFT" / "COPY" 等)。 |
| [`fill_form`](#fill-form) | 既存 PDF の対話フォーム(AcroForm)にフィールド値を流し込む。 |
| [`flatten_form`](#flatten-form) | 既存 PDF の対話フォーム(AcroForm)をフラット化し、記入済みの見た目を保ったまま非対話にする。 |
| [`tag_form_fields`](#tag-form-fields) | タグ付き PDF のフォームを PDF/UA-1 準拠へ修復する。 |
| [`ensure_tagged`](#ensure-tagged) | 既存 PDF を PDF/UA-1 の「器」に載せる。 |
| [`ensure_pdfa`](#ensure-pdfa) | 既存 PDF を PDF/A の「器」に載せる(ensure_tagged の PDF/A 版)。 |
| [`attach_file`](#attach-file) | PDF にファイルを埋め込む(添付する)。 |
| [`rotate_pages`](#rotate-pages) | ページを時計回りに回転する(90/180/270 度)。 |

## create_text_pdf

**Create PDF from Plain Text**

プレーンテキストから PDF を生成する。改行(\n)を尊重し、空行を段落区切りとして扱う。長い行は自動で折り返す。

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `text` | string | **yes** |  | 本文テキスト。\n で改行、空行で段落区切り。 |
| `outputPath` | string (minLength 1) | no |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | no |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `fontPath` | string (minLength 1) | no |  | 埋め込むフォントファイル(.ttf / .otf)の絶対パス。日本語など非ラテン文字を含む場合は必須。.ttc(TrueTypeCollection)は非対応。環境変数 PDF_WRITER_FONT でも指定可。 |
| `fontSize` | number (4–96) | no |  | 本文フォントサイズ(pt)。既定 11。範囲 4〜96。 |
| `pageSize` | `"A4"` \| `"A3"` \| `"A5"` \| `"LETTER"` \| `"LEGAL"` | no |  | ページサイズ。既定 A4。 |
| `margin` | number (0–300) | no |  | 上下左右マージン(pt)。既定 56(≒20mm)。範囲 0〜300。 |
| `title` | string | no |  | PDF タイトル。メタデータに設定し、本文冒頭にも見出しとして描画する。 |
| `author` | string | no |  | PDF 作成者(メタデータ)。 |
| `onMissingGlyph` | `"error"` \| `"replace"` \| `"ignore"` | no |  | フォントに存在しない文字(例: Noto Sans JP に無い ✔ U+2714)の扱い。error(既定)=欠落文字を列挙してエラー / replace=〓 に置換して警告 / ignore=空白のまま描画して警告。 |
| `tagged` | boolean | no |  | タグ付き PDF(PDF/UA-1・ISO 14289)として生成する。既定 false。true にすると構造木・PDF/UA 宣言・/Lang・DisplayDocTitle を付与し、スクリーンリーダで読める文書になる。PDF/UA はタイトルを要求するため title が必須。 |
| `lang` | string | no |  | 文書の自然言語(BCP 47。例 "ja" / "en-US")。tagged 時に省略すると本文から推定し、推定結果を warnings で報告する。誤った言語宣言はスクリーンリーダの誤読を招くため、確実な場合は明示すること。 |
| `pdfVersion` | `"1.7"` \| `"2.0"` | no |  | 出力する PDF の版。既定 "1.7"。"2.0"(ISO 32000-2)にすると版の宣言だけでなく、版に紐づく義務も満たす: trailer /ID を付与し(Table 15 で Required)、Info 辞書を CreationDate / ModDate に絞って題名・作成者・Producer は XMP へ移す(§14.3.3)。tagged: true とは併用できない(writer が書けるのは PDF 1.7 基盤の PDF/UA-1 宣言のみ)。 |

## create_markdown_pdf

**Create PDF from Markdown**

Markdown から PDF を生成する。見出し・段落・箇条書き/番号リスト・コードブロック・引用・水平線・表に対応。インライン装飾の記号は除去し字面のみ反映する(単一フォントのため)。

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `markdown` | string | **yes** |  | Markdown 文字列。 |
| `outputPath` | string (minLength 1) | no |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | no |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `fontPath` | string (minLength 1) | no |  | 埋め込むフォントファイル(.ttf / .otf)の絶対パス。日本語など非ラテン文字を含む場合は必須。.ttc(TrueTypeCollection)は非対応。環境変数 PDF_WRITER_FONT でも指定可。 |
| `fontSize` | number (4–96) | no |  | 本文フォントサイズ(pt)。既定 11。範囲 4〜96。 |
| `pageSize` | `"A4"` \| `"A3"` \| `"A5"` \| `"LETTER"` \| `"LEGAL"` | no |  | ページサイズ。既定 A4。 |
| `margin` | number (0–300) | no |  | 上下左右マージン(pt)。既定 56(≒20mm)。範囲 0〜300。 |
| `title` | string | no |  | PDF タイトル。メタデータに設定し、本文冒頭にも見出しとして描画する。 |
| `author` | string | no |  | PDF 作成者(メタデータ)。 |
| `onMissingGlyph` | `"error"` \| `"replace"` \| `"ignore"` | no |  | フォントに存在しない文字(例: Noto Sans JP に無い ✔ U+2714)の扱い。error(既定)=欠落文字を列挙してエラー / replace=〓 に置換して警告 / ignore=空白のまま描画して警告。 |
| `tagged` | boolean | no |  | タグ付き PDF(PDF/UA-1・ISO 14289)として生成する。既定 false。true にすると構造木・PDF/UA 宣言・/Lang・DisplayDocTitle を付与し、スクリーンリーダで読める文書になる。PDF/UA はタイトルを要求するため title が必須。 |
| `lang` | string | no |  | 文書の自然言語(BCP 47。例 "ja" / "en-US")。tagged 時に省略すると本文から推定し、推定結果を warnings で報告する。誤った言語宣言はスクリーンリーダの誤読を招くため、確実な場合は明示すること。 |
| `pdfVersion` | `"1.7"` \| `"2.0"` | no |  | 出力する PDF の版。既定 "1.7"。"2.0"(ISO 32000-2)にすると版の宣言だけでなく、版に紐づく義務も満たす: trailer /ID を付与し(Table 15 で Required)、Info 辞書を CreationDate / ModDate に絞って題名・作成者・Producer は XMP へ移す(§14.3.3)。tagged: true とは併用できない(writer が書けるのは PDF 1.7 基盤の PDF/UA-1 宣言のみ)。 |

## create_table_pdf

**Create Table PDF**

ヘッダと行データから罫線付きの表 PDF を生成する。列幅は内容から自動算出し、セル内は折り返す。改ページ時はヘッダを再描画する。

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `headers` | string[] | **yes** |  | ヘッダ行(列見出し)の配列。 |
| `rows` | string[][] | **yes** |  | データ行の配列。各行は文字列の配列で、headers と同じ列数を推奨。 |
| `outputPath` | string (minLength 1) | no |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | no |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `fontPath` | string (minLength 1) | no |  | 埋め込むフォントファイル(.ttf / .otf)の絶対パス。日本語など非ラテン文字を含む場合は必須。.ttc(TrueTypeCollection)は非対応。環境変数 PDF_WRITER_FONT でも指定可。 |
| `fontSize` | number (4–96) | no |  | 本文フォントサイズ(pt)。既定 11。範囲 4〜96。 |
| `pageSize` | `"A4"` \| `"A3"` \| `"A5"` \| `"LETTER"` \| `"LEGAL"` | no |  | ページサイズ。既定 A4。 |
| `margin` | number (0–300) | no |  | 上下左右マージン(pt)。既定 56(≒20mm)。範囲 0〜300。 |
| `title` | string | no |  | PDF タイトル。メタデータに設定し、本文冒頭にも見出しとして描画する。 |
| `author` | string | no |  | PDF 作成者(メタデータ)。 |
| `onMissingGlyph` | `"error"` \| `"replace"` \| `"ignore"` | no |  | フォントに存在しない文字(例: Noto Sans JP に無い ✔ U+2714)の扱い。error(既定)=欠落文字を列挙してエラー / replace=〓 に置換して警告 / ignore=空白のまま描画して警告。 |
| `tagged` | boolean | no |  | タグ付き PDF(PDF/UA-1・ISO 14289)として生成する。既定 false。true にすると構造木・PDF/UA 宣言・/Lang・DisplayDocTitle を付与し、スクリーンリーダで読める文書になる。PDF/UA はタイトルを要求するため title が必須。 |
| `lang` | string | no |  | 文書の自然言語(BCP 47。例 "ja" / "en-US")。tagged 時に省略すると本文から推定し、推定結果を warnings で報告する。誤った言語宣言はスクリーンリーダの誤読を招くため、確実な場合は明示すること。 |
| `pdfVersion` | `"1.7"` \| `"2.0"` | no |  | 出力する PDF の版。既定 "1.7"。"2.0"(ISO 32000-2)にすると版の宣言だけでなく、版に紐づく義務も満たす: trailer /ID を付与し(Table 15 で Required)、Info 辞書を CreationDate / ModDate に絞って題名・作成者・Producer は XMP へ移す(§14.3.3)。tagged: true とは併用できない(writer が書けるのは PDF 1.7 基盤の PDF/UA-1 宣言のみ)。 |

## set_metadata

**Set PDF Metadata**

既存 PDF のメタデータ(Info 辞書)を更新する。指定したフィールドのみ変更し、他は保持する。title / author / subject / keywords / creator のうち最低 1 つが必要。XMP(/Metadata)を持つ文書では dc:title 等も同期して不整合を防ぐ。署名済み PDF には preserveSignatures: true で署名を保持したまま更新できる。

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **yes** |  | 編集対象 PDF の絶対パス。 |
| `title` | string | no |  | タイトル。 |
| `author` | string | no |  | 作成者。 |
| `subject` | string | no |  | サブタイトル・件名。 |
| `keywords` | string[] | no |  | キーワードの配列。 |
| `creator` | string | no |  | 作成アプリケーション名。 |
| `preserveSignatures` | boolean | no |  | 署名済み PDF に対し、既存署名を無効化せず増分更新（末尾追記）で編集する。既定 false。元のバイト列には一切触れないため /ByteRange が保たれる。認証署名（DocMDP）の許可レベルに反する変更は拒否される。 |
| `outputPath` | string (minLength 1) | no |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | no |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `allowBreakingSignatures` | boolean | no |  | 編集対象が電子署名済み(/ByteRange 検知)の場合、既定ではエラーにする。true を指定すると署名が無効化されることを承知の上で編集を続行する。 |

## merge_pdfs

**Merge PDFs**

複数の PDF を指定順に 1 つへ結合する。文書メタデータは先頭ファイルから引き継ぐ。ページを新しい文書へ複製するため、文書レベルの情報（タグ付き構造・XMP・添付・AcroForm・しおり等）は引き継がれない。失われたものは warnings で報告するので、必要なら出力に対して attach_file / ensure_tagged / add_bookmarks / set_metadata を後がけすること。

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inputPaths` | string (minLength 1)[] | **yes** |  | 結合する PDF の絶対パスの配列(結合順・2 件以上)。 |
| `outputPath` | string (minLength 1) | no |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | no |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `allowBreakingSignatures` | boolean | no |  | 編集対象が電子署名済み(/ByteRange 検知)の場合、既定ではエラーにする。true を指定すると署名が無効化されることを承知の上で編集を続行する。 |

## split_pdf

**Split PDF**

PDF をページ範囲ごとに複数ファイルへ分割する。ranges の各要素が 1 ファイルになる。出力は "`<prefix>`1.pdf", "`<prefix>`2.pdf", ... の連番。ページを新しい文書へ複製するため、文書レベルの情報（タグ付き構造・XMP・添付・AcroForm・しおり等）は引き継がれない。失われたものは warnings で報告するので、必要なら出力に対して attach_file / ensure_tagged / add_bookmarks / set_metadata を後がけすること。

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **yes** |  | 分割対象 PDF の絶対パス。 |
| `ranges` | string (minLength 1)[] | **yes** |  | ページ範囲指定の配列。各要素は "1-3" / "5" / "7-" / "-2" 形式(1 始まり)。例: ["1-3", "4-"]。 |
| `outputDir` | string (minLength 1) | **yes** |  | 出力先ディレクトリ（絶対パス）。 |
| `prefix` | string (minLength 1) | no |  | 出力ファイル名の接頭辞。既定は "<入力ファイル名>-part"。 |
| `allowBreakingSignatures` | boolean | no |  | 編集対象が電子署名済み(/ByteRange 検知)の場合、既定ではエラーにする。true を指定すると署名が無効化されることを承知の上で編集を続行する。 |

## extract_pages

**Extract Pages**

指定ページだけを含む新しい PDF を作る。指定順を保持するため、ページの並べ替えを兼ねた抽出も可能。ページを新しい文書へ複製するため、文書レベルの情報（タグ付き構造・XMP・添付・AcroForm・しおり等）は引き継がれない。失われたものは warnings で報告するので、必要なら出力に対して attach_file / ensure_tagged / add_bookmarks / set_metadata を後がけすること。

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **yes** |  | 対象 PDF の絶対パス。 |
| `pages` | string (minLength 1) | **yes** |  | ページ指定。"1,3-5,8-" 形式(1 始まり)。指定順が出力順になる。 |
| `outputPath` | string (minLength 1) | no |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | no |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `allowBreakingSignatures` | boolean | no |  | 編集対象が電子署名済み(/ByteRange 検知)の場合、既定ではエラーにする。true を指定すると署名が無効化されることを承知の上で編集を続行する。 |

## delete_pages

**Delete Pages**

指定ページを削除した新しい PDF を作る。全ページの削除はエラー。ページを新しい文書へ複製するため、文書レベルの情報（タグ付き構造・XMP・添付・AcroForm・しおり等）は引き継がれない。失われたものは warnings で報告するので、必要なら出力に対して attach_file / ensure_tagged / add_bookmarks / set_metadata を後がけすること。

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **yes** |  | 対象 PDF の絶対パス。 |
| `pages` | string (minLength 1) | **yes** |  | 削除するページ指定。"1,3-5,8-" 形式(1 始まり)。 |
| `outputPath` | string (minLength 1) | no |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | no |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `allowBreakingSignatures` | boolean | no |  | 編集対象が電子署名済み(/ByteRange 検知)の場合、既定ではエラーにする。true を指定すると署名が無効化されることを承知の上で編集を続行する。 |

## reorder_pages

**Reorder Pages**

ページを並べ替える。order には全ページを新しい順序で 1 回ずつ列挙する。ページを新しい文書へ複製するため、文書レベルの情報（タグ付き構造・XMP・添付・AcroForm・しおり等）は引き継がれない。失われたものは warnings で報告するので、必要なら出力に対して attach_file / ensure_tagged / add_bookmarks / set_metadata を後がけすること。

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **yes** |  | 対象 PDF の絶対パス。 |
| `order` | integer (-9007199254740991–9007199254740991)[] | **yes** |  | 新しいページ順(1 始まり)。例: 5 ページの逆順は [5,4,3,2,1]。 |
| `outputPath` | string (minLength 1) | no |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | no |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `allowBreakingSignatures` | boolean | no |  | 編集対象が電子署名済み(/ByteRange 検知)の場合、既定ではエラーにする。true を指定すると署名が無効化されることを承知の上で編集を続行する。 |

## add_bookmarks

**Add Bookmarks (Outline)**

PDF にしおり(アウトライン)を設定する。既存のしおりは置換される。children で入れ子にできる。署名済み PDF には preserveSignatures: true で署名を保持したまま設定できる。

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **yes** |  | 対象 PDF の絶対パス。 |
| `bookmarks` | any[] | **yes** |  | しおりの配列。各要素は { title, page, open?, children? }。page は 1 始まり。children で階層化でき、最大 8 階層・合計 2000 件まで。 |
| `preserveSignatures` | boolean | no |  | 署名済み PDF に対し、既存署名を無効化せず増分更新（末尾追記）で編集する。既定 false。元のバイト列には一切触れないため /ByteRange が保たれる。認証署名（DocMDP）の許可レベルに反する変更は拒否される。 |
| `outputPath` | string (minLength 1) | no |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | no |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `allowBreakingSignatures` | boolean | no |  | 編集対象が電子署名済み(/ByteRange 検知)の場合、既定ではエラーにする。true を指定すると署名が無効化されることを承知の上で編集を続行する。 |

## add_annotation

**Add Annotation**

ページに注釈を 1 つ追加する。付箋(text) / ハイライト(highlight) / 矩形(square) に対応。座標は PDF 座標系(左下原点・pt)で指定する。署名済み PDF には preserveSignatures: true で、既存署名を無効化せず増分更新で追加できる(タグ付き文書では Annot 構造要素への内包も増分に含まれ PDF/UA 準拠を維持する)。

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **yes** |  | 対象 PDF の絶対パス。 |
| `page` | integer (1–9007199254740991) | **yes** |  | 対象ページ(1 始まり)。 |
| `type` | `"text"` \| `"highlight"` \| `"square"` | **yes** |  | text=付箋アイコン / highlight=ハイライト / square=矩形。 |
| `rect` | object | **yes** |  | 注釈の矩形。PDF 座標系(左下原点・pt)。x1<x2 かつ y1<y2 であること。 |
| `rect.x1` | number | **yes** |  |  |
| `rect.y1` | number | **yes** |  |  |
| `rect.x2` | number | **yes** |  |  |
| `rect.y2` | number | **yes** |  |  |
| `contents` | string | no |  | 注釈の本文(日本語可)。 |
| `author` | string | no |  | 作成者名。 |
| `alt` | string | no |  | 支援技術向けの代替テキスト。タグ付き PDF では注釈が Annot 構造要素に内包される(PDF/UA 7.18.1-1)ため、その要素の /Alt になる。タグ無し文書では無視される。 |
| `color` | string | no |  | #rrggbb 形式。既定は type ごと(text=#ffd400 / highlight=#ffff00 / square=#ff0000)。 |
| `interiorColor` | string | no |  | square の塗り色(#rrggbb)。 |
| `icon` | `"Note"` \| `"Comment"` \| `"Key"` \| `"Help"` \| `"NewParagraph"` \| `"Paragraph"` \| `"Insert"` | no |  | text のアイコン。既定 Note。 |
| `open` | boolean | no |  | text を開いた状態にするか。既定 false。 |
| `preserveSignatures` | boolean | no |  | 署名済み PDF に対し、既存署名を無効化せず増分更新（末尾追記）で注釈を追加する。既定 false。元のバイト列には一切触れないため /ByteRange が保たれる。タグ付き PDF では Annot 構造要素への内包も増分に含めて PDF/UA 準拠を維持する。認証署名（DocMDP）では P=3 のときのみ許可。 |
| `outputPath` | string (minLength 1) | no |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | no |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `allowBreakingSignatures` | boolean | no |  | 編集対象が電子署名済み(/ByteRange 検知)の場合、既定ではエラーにする。true を指定すると署名が無効化されることを承知の上で編集を続行する。 |

## stamp_page_numbers

**Stamp Page Numbers**

各ページにページ番号を刻む。タグ付き PDF では Artifact として囲むため PDF/UA 準拠を維持する。日本語を含む書式を使う場合は fontPath か環境変数 PDF_WRITER_FONT が必要。

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **yes** |  | 対象 PDF の絶対パス。 |
| `format` | string (minLength 1) | no |  | 書式。{n}=現在ページ、{total}=総ページ数。既定 "{n}"。例: "- {n} -" / "{n} / {total}" / "{n} ページ"。{n} を必ず含めること。 |
| `position` | `"bottom-left"` \| `"bottom-center"` \| `"bottom-right"` \| `"top-left"` \| `"top-center"` \| `"top-right"` | no |  | 配置。既定 bottom-center。ページの回転(/Rotate)を考慮した見た目の位置。 |
| `margin` | number (0–300) | no |  | 端からの余白(pt)。既定 24。範囲 0〜300。 |
| `fontSize` | number (4–96) | no |  | フォントサイズ(pt)。既定 9。範囲 4〜96。 |
| `color` | string (minLength 1) | no |  | #rrggbb。既定 #666666。 |
| `fontPath` | string (minLength 1) | no |  | 埋め込むフォント(.ttf/.otf)。省略時は環境変数 PDF_WRITER_FONT → 標準フォント。日本語を含む書式には必須。 |
| `pages` | string (minLength 1) | no |  | 番号を刻むページ指定。"1,3-5,8-" 形式(1 始まり)。省略時は全ページ。表紙を除くなら "2-" のように指定する。 |
| `startAt` | integer (-9007199254740991–9007199254740991) | no |  | 最初に刻む番号。既定 1。表紙を除いて 1 から始めたい場合などに使う。 |
| `preserveSignatures` | boolean | no |  | 署名済み PDF に対し、既存署名を無効化せず増分更新（末尾追記）で編集する。既定 false。元のバイト列には一切触れないため /ByteRange が保たれる。認証署名（DocMDP）の許可レベルに反する変更は拒否される。 |
| `outputPath` | string (minLength 1) | no |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | no |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `allowBreakingSignatures` | boolean | no |  | 編集対象が電子署名済み(/ByteRange 検知)の場合、既定ではエラーにする。true を指定すると署名が無効化されることを承知の上で編集を続行する。 |

## add_watermark

**Add Watermark**

各ページの中央に斜めの透かし文字を重ねる("社外秘" / "DRAFT" / "COPY" 等)。既定では本文の背面に薄く敷く。タグ付き PDF では Artifact として囲むため PDF/UA 準拠を維持する。日本語の透かしには fontPath か環境変数 PDF_WRITER_FONT が必要。

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **yes** |  | 対象 PDF の絶対パス。 |
| `text` | string (minLength 1) | **yes** |  | 透かし文字。例: "社外秘" / "DRAFT" / "COPY"。 |
| `fontSize` | number (4–96) | no |  | フォントサイズ(pt)。既定 60。範囲 4〜96。 |
| `color` | string (minLength 1) | no |  | #rrggbb。既定 #808080(灰)。 |
| `opacity` | number (0–1) | no |  | 不透明度 0(透明)〜1(不透明)。既定 0.15。本文を読める程度に薄くする。 |
| `angle` | number | no |  | 反時計回りの角度(度)。既定 45。0 で水平。 |
| `behind` | boolean | no |  | 本文の背面に敷くか。既定 true。false にすると本文の上に重なる(改ざん防止の主張を強めたい場合)。 |
| `fontPath` | string (minLength 1) | no |  | 埋め込むフォント(.ttf/.otf)。省略時は環境変数 PDF_WRITER_FONT → 標準フォント。日本語の透かしには必須。 |
| `pages` | string (minLength 1) | no |  | 対象ページ指定。"1,3-5,8-" 形式(1 始まり)。省略時は全ページ。 |
| `preserveSignatures` | boolean | no |  | 署名済み PDF に対し、既存署名を無効化せず増分更新（末尾追記）で編集する。既定 false。元のバイト列には一切触れないため /ByteRange が保たれる。認証署名（DocMDP）の許可レベルに反する変更は拒否される。 |
| `outputPath` | string (minLength 1) | no |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | no |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `allowBreakingSignatures` | boolean | no |  | 編集対象が電子署名済み(/ByteRange 検知)の場合、既定ではエラーにする。true を指定すると署名が無効化されることを承知の上で編集を続行する。 |

## fill_form

**Fill Form (AcroForm)**

既存 PDF の対話フォーム(AcroForm)にフィールド値を流し込む。フィールド名が分からない場合は、存在しない名前を指定するとエラーに全フィールド名と型が列挙される。日本語の値には fontPath か環境変数 PDF_WRITER_FONT が必要。flatten: true で記入後に非対話化できるが、タグ付き PDF では PDF/UA 準拠が壊れるため allowBreakingTags: true も要る。XFA フォームは非対応。

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **yes** |  | 対象 PDF の絶対パス。 |
| `fields` | object | **yes** |  | フィールド名 → 値のオブジェクト。値の型はフィールド種別に対応する: text=文字列か数値 / checkbox=真偽値 / dropdown・optionlist=文字列か文字列配列 / radio=文字列。例: {"user.name": "山田 太郎", "agree": true, "plan": "A"} |
| `fontPath` | string (minLength 1) | no |  | 値の描画に使うフォント(.ttf/.otf)。省略時は環境変数 PDF_WRITER_FONT → 標準フォント。日本語の値には必須。 |
| `flatten` | boolean | no |  | 記入後にフラット化して非対話にするか。既定 false。true にすると値は編集できなくなる。 |
| `allowBreakingTags` | boolean | no |  | タグ付き PDF でもフラット化を許すか。既定 false。true にすると PDF/UA-1 準拠が壊れる。 |
| `outputPath` | string (minLength 1) | no |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | no |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `allowBreakingSignatures` | boolean | no |  | 編集対象が電子署名済み(/ByteRange 検知)の場合、既定ではエラーにする。true を指定すると署名が無効化されることを承知の上で編集を続行する。 |

## flatten_form

**Flatten Form**

既存 PDF の対話フォーム(AcroForm)をフラット化し、記入済みの見た目を保ったまま非対話にする。配布前に値を固定したい場合に使う。外観の再生成が要る場合に備え、既存の値に日本語が含まれるなら fontPath か環境変数 PDF_WRITER_FONT を指定しておくこと。タグ付き PDF では Widget 注釈が消えて Form 構造要素が宙に浮くため既定で拒否する(allowBreakingTags: true で強行可)。

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **yes** |  | 対象 PDF の絶対パス。 |
| `fontPath` | string (minLength 1) | no |  | 外観生成に使うフォント。省略時は環境変数 PDF_WRITER_FONT → 標準フォント。既存の外観をそのまま使える場合は不要だが、再生成が必要な日本語フォームでは要る。 |
| `allowBreakingTags` | boolean | no |  | タグ付き PDF でもフラット化を許すか。既定 false。 |
| `outputPath` | string (minLength 1) | no |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | no |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `allowBreakingSignatures` | boolean | no |  | 編集対象が電子署名済み(/ByteRange 検知)の場合、既定ではエラーにする。true を指定すると署名が無効化されることを承知の上で編集を続行する。 |

## tag_form_fields

**Tag Form Fields (PDF/UA repair)**

タグ付き PDF のフォームを PDF/UA-1 準拠へ修復する。Widget 注釈を Form 構造要素に内包し(7.18.4-1)、対象ページに /Tabs S を立て(7.18.3-1)、フィールドに代替名 /TU を付与する(7.18.1-3)。labels でスクリーンリーダ向けの人間可読な名前を渡すこと。既に構造木に結ばれた Widget はスキップするため何度実行しても安全。タグ無し文書は対象外(create 系の tagged: true でゼロから作るか、将来の ensure_tagged を待つ)。署名済み PDF には preserveSignatures: true で署名を保持したまま修復できる(承認署名のみ。認証署名は拒否)。

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **yes** |  | 対象 PDF の絶対パス。 |
| `labels` | object | no |  | フィールド名 → 人間可読な代替名(/TU)。スクリーンリーダが読み上げる名前で、例: {"user.name": "氏名", "agree": "利用規約に同意する"}。省略したフィールドはフィールド名を /TU に代用し、warnings で報告する。存在しないフィールド名を指定するとエラーに全フィールド名が列挙される。 |
| `preserveSignatures` | boolean | no |  | 署名済み PDF に対し、既存署名を無効化せず増分更新（末尾追記）で編集する。既定 false。元のバイト列には一切触れないため /ByteRange が保たれる。認証署名（DocMDP）の許可レベルに反する変更は拒否される。 |
| `outputPath` | string (minLength 1) | no |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | no |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `allowBreakingSignatures` | boolean | no |  | 編集対象が電子署名済み(/ByteRange 検知)の場合、既定ではエラーにする。true を指定すると署名が無効化されることを承知の上で編集を続行する。 |

## ensure_tagged

**Ensure Tagged (PDF/UA scaffold & repair)**

既存 PDF を PDF/UA-1 の「器」に載せる。既にタグ付きなら構造木には触らず、欠落した文書レベル要件(MarkInfo / Lang / DisplayDocTitle / XMP の pdfuaid:part・dc:title)のみ補う。タグ無し文書には最小限の構造木(各ページ = 1 つの P 要素)を新設して本文を支援技術から到達可能にする。**重要**: 機械は意味を推定できないため、見出し・表・リスト・読み順・図の代替テキストは作られない。新設は「足場」であって「アクセシブルな文書」ではなく、人手のレビューが要る。構造を最初から正しく作れる場合は create 系の tagged: true を使うこと。署名済み PDF には preserveSignatures: true(承認署名のみ。認証署名は拒否)。

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **yes** |  | 対象 PDF の絶対パス。 |
| `title` | string (minLength 1) | no |  | 文書タイトル(PDF/UA-1 7.1 で必須)。省略時は既存 Info の Title を使う。 |
| `lang` | string | no |  | 文書の自然言語(BCP 47。例 "ja")。PDF/UA-1 7.2 で必須。 |
| `preserveSignatures` | boolean | no |  | 署名済み PDF に対し、既存署名を無効化せず増分更新（末尾追記）で編集する。既定 false。元のバイト列には一切触れないため /ByteRange が保たれる。認証署名（DocMDP）の許可レベルに反する変更は拒否される。 |
| `outputPath` | string (minLength 1) | no |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | no |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `allowBreakingSignatures` | boolean | no |  | 編集対象が電子署名済み(/ByteRange 検知)の場合、既定ではエラーにする。true を指定すると署名が無効化されることを承知の上で編集を続行する。 |

## ensure_pdfa

**Ensure PDF/A (archival conformance scaffold)**

既存 PDF を PDF/A の「器」に載せる(ensure_tagged の PDF/A 版)。flavour で "pdfa-3b"(既定) / "pdfa-4" / "pdfa-4f" を選ぶ。文書レベルの欠落要件だけを補う: trailer の /ID(ISO 32000-1 14.4)・sRGB の OutputIntent(GTS_PDFA1。ICC プロファイルを生成して埋め込む)・XMP の pdfaid。**-4 系はさらにヘッダを PDF 2.0 にし、Info 辞書を削除する**(-4 は catalog に /PieceInfo が無い限り Info を許さない。ISO 32000-2 14.3.3 より厳しい)。**本文・構造木・フォントには触らない**。**添付がある文書は "pdfa-4f" を使うこと** — 素の "pdfa-4" は添付ファイル自身が PDF/A であることを要求するため、CSV や JSON を添える電帳法の使い方では非適合になる。**重要**: これは「PDF/A を名乗るための下準備」であって適合の保証ではない。フォント未埋め込み・暗号化・JavaScript・LZW などの違反は直らない。**XMP に pdfaid を書く = その文書が「PDF/A です」と名乗る**ため、適合していない文書に適用すると**嘘を名乗る PDF ができる**(だから適用時は常に警告を返す)。適合したかは pdf-verify-mcp の validate_conformance(flavour: 同じ値) で必ず確認すること(判定は veraPDF が下す。ISO 19005 は条文を引けないため「veraPDF はこう判定した」までしか言えない)。電帳法の文脈では attach_file で機械可読データを添付した**後**に適用する。署名済み PDF には preserveSignatures: true(承認署名のみ。認証署名は拒否)。ただし **-4 系 × preserveSignatures は、入力が既に PDF 2.0 でない限り拒否する**(増分更新では先頭のヘッダを書き換えられず、書き換えれば署名が壊れるため)。

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **yes** |  | 対象 PDF の絶対パス。 |
| `flavour` | `"pdfa-3b"` \| `"pdfa-4"` \| `"pdfa-4f"` | no |  | 名乗らせる PDF/A。既定 "pdfa-3b"。"pdfa-4"(ISO 19005-4) は PDF 2.0 基盤なので、/ID・OutputIntent・XMP pdfaid に加えて**ヘッダを 2.0 にし、Info 辞書を落とす**(-4 は PieceInfo が無い限り Info を許さない)。**-4 は conformance level を持たない**ため pdfaid:conformance を書かず pdfaid:rev を書く。**添付がある文書は "pdfa-4f" を使うこと** — 素の "pdfa-4" は添付ファイル自身が PDF/A であることを要求するので、JSON や CSV を添える電帳法の使い方では非適合になる。署名保持(preserveSignatures)との併用は、入力が既に PDF 2.0 でない限り拒否する(増分更新では先頭のヘッダを書き換えられず、書き換えれば署名が壊れるため)。 |
| `preserveSignatures` | boolean | no |  | 署名済み PDF に対し、既存署名を無効化せず増分更新（末尾追記）で編集する。既定 false。元のバイト列には一切触れないため /ByteRange が保たれる。認証署名（DocMDP）の許可レベルに反する変更は拒否される。 |
| `outputPath` | string (minLength 1) | no |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | no |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `allowBreakingSignatures` | boolean | no |  | 編集対象が電子署名済み(/ByteRange 検知)の場合、既定ではエラーにする。true を指定すると署名が無効化されることを承知の上で編集を続行する。 |

## attach_file

**Attach File (Embedded File)**

PDF にファイルを埋め込む(添付する)。/Names /EmbeddedFiles と catalog /AF に登録し、AFRelationship を付与する。PDF/A-3(ISO 19005-3)や電子帳簿保存法の文脈で、「人が読む請求書 PDF + 機械可読データ(CSV/XML)」を 1 ファイルに束ねる用途に使う。

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **yes** |  | 対象 PDF の絶対パス。 |
| `attachmentPath` | string (minLength 1) | **yes** |  | 埋め込むファイルの絶対パス。 |
| `name` | string (minLength 1) | no |  | PDF 内での表示名。省略時は元のファイル名。既存の添付と同名にはできない。 |
| `description` | string (minLength 1) | no |  | 添付の説明(/Desc・日本語可)。 |
| `mimeType` | string (minLength 1) | no |  | MIME 型。省略時は拡張子から推定(例 .csv → text/csv)。 |
| `relationship` | `"Source"` \| `"Data"` \| `"Alternative"` \| `"Supplement"` \| `"Unspecified"` | no |  | 本文との関係(PDF/A-3 §6.8)。Data=本文と同じ内容の機械可読データ(請求書の XML/CSV 等) / Source=本文の元データ / Alternative=代替表現 / Supplement=補足資料 / Unspecified=不明(既定)。PDF/A-3 では意味のある値が必須のため、省略すると警告する。 |
| `preserveSignatures` | boolean | no |  | 署名済み PDF に対し、既存署名を無効化せず増分更新（末尾追記）で編集する。既定 false。元のバイト列には一切触れないため /ByteRange が保たれる。認証署名（DocMDP）の許可レベルに反する変更は拒否される。 |
| `outputPath` | string (minLength 1) | no |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | no |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `allowBreakingSignatures` | boolean | no |  | 編集対象が電子署名済み(/ByteRange 検知)の場合、既定ではエラーにする。true を指定すると署名が無効化されることを承知の上で編集を続行する。 |

## rotate_pages

**Rotate Pages**

ページを時計回りに回転する(90/180/270 度)。pages 省略時は全ページ。

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **yes** |  | 対象 PDF の絶対パス。 |
| `rotation` | `90` \| `180` \| `270` | **yes** |  | 時計回りの回転角(度)。90 / 180 / 270。 |
| `pages` | string (minLength 1) | no |  | 対象ページ指定。"1,3-5" 形式(1 始まり)。省略時は全ページ。 |
| `outputPath` | string (minLength 1) | no |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | no |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `allowBreakingSignatures` | boolean | no |  | 編集対象が電子署名済み(/ByteRange 検知)の場合、既定ではエラーにする。true を指定すると署名が無効化されることを承知の上で編集を続行する。 |
