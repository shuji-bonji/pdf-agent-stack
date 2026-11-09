---
description: "pdf-writer-mcp v0.28.1 の全 20 ツールの引数・型・既定値・戻り値（tools/list から自動生成）"
---

# pdf-writer-mcp — ツールリファレンス

<!-- GENERATED FILE — do not edit. Parameters and returns: the server. Worked examples: scripts/reference-examples/. -->

::: info
**v0.28.1** の `tools/list` ハンドシェイクから自動生成（20 ツール）。手で編集しない — 再生成は `node scripts/generate-reference.mjs`。日本語訳は翻訳メモリ（scripts/i18n）から適用され、原文が更新された項目は同期されるまで英語で表示される。
:::

**このページは自動生成リファレンス** — 全ツールの引数・型・既定値・戻り値を `tools/list`（正典 = サーバー実装）から写したもの。責務・設計思想・使いどころの解説は[解説ページ](/ja/mcp/pdf-writer)へ。

## ツール一覧

| ツール | 概要 |
|---|---|
| [`create_text_pdf`](#create-text-pdf) | プレーンテキストから PDF を生成する。 |
| [`create_markdown_pdf`](#create-markdown-pdf) | Create a PDF from Markdown. |
| [`create_table_pdf`](#create-table-pdf) | ヘッダと行データから罫線付きの表 PDF を生成する。 |
| [`set_metadata`](#set-metadata) | Update an existing PDF's metadata (the Info dictionary). |
| [`merge_pdfs`](#merge-pdfs) | Merge multiple PDFs into one, in the given order. |
| [`split_pdf`](#split-pdf) | PDF をページ範囲ごとに複数ファイルへ分割する。 |
| [`extract_pages`](#extract-pages) | 指定ページだけを含む新しい PDF を作る。 |
| [`delete_pages`](#delete-pages) | 指定ページを削除した新しい PDF を作る。 |
| [`reorder_pages`](#reorder-pages) | ページを並べ替える。 |
| [`add_bookmarks`](#add-bookmarks) | Set the bookmarks (outline) of a PDF. |
| [`add_annotation`](#add-annotation) | ページに注釈を 1 つ追加する。 |
| [`stamp_page_numbers`](#stamp-page-numbers) | 各ページにページ番号を刻む。 |
| [`add_watermark`](#add-watermark) | 各ページの中央に斜めの透かし文字を重ねる("社外秘" / "DRAFT" / "COPY" 等)。 |
| [`fill_form`](#fill-form) | 既存 PDF の対話フォーム（AcroForm）にフィールド値を流し込む。 |
| [`flatten_form`](#flatten-form) | 既存 PDF の対話フォーム（AcroForm）をフラット化し、記入済みの見た目を保ったまま非対話にする。 |
| [`tag_form_fields`](#tag-form-fields) | Repair a tagged PDF's form to PDF/UA-1: enclose Widget annotations in Form structure elements (7.18.4-1), set /Tabs S on the affected pages (7.18.3-1), and give fields alternate names /TU (7.18.1-3). |
| [`ensure_tagged`](#ensure-tagged) | Put an existing PDF onto the PDF/UA "vessel". |
| [`ensure_pdfa`](#ensure-pdfa) | Put an existing PDF onto the PDF/A "vessel" (the PDF/A counterpart of ensure_tagged). |
| [`attach_file`](#attach-file) | PDF にファイルを埋め込む(添付する)。 |
| [`rotate_pages`](#rotate-pages) | ページを時計回りに回転する(90/180/270 度)。 |

## create_text_pdf

**Create PDF from Plain Text**

プレーンテキストから PDF を生成する。改行(\n)を尊重し、空行を段落区切りとして扱う。長い行は自動で折り返す。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `text` | string | **必須** |  | 本文テキスト。\n で改行、空行で段落区切り。 |
| `outputPath` | string (minLength 1) | 任意 |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | 任意 |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `fontPath` | string (minLength 1) | 任意 |  | Absolute path of the font file to embed (.ttf / .otf). Required for characters outside WinAnsiEncoding (Japanese, for example). .ttc (TrueType Collection) is not supported. Can also be set via the PDF_WRITER_FONT environment variable. |
| `fontSize` | number (4–96) | 任意 |  | 本文フォントサイズ(pt)。既定 11。範囲 4〜96。 |
| `pageSize` | `"A4"` \| `"A3"` \| `"A5"` \| `"LETTER"` \| `"LEGAL"` | 任意 |  | ページサイズ。既定 A4。 |
| `margin` | number (0–300) | 任意 |  | 上下左右マージン(pt)。既定 56(≒20mm)。範囲 0〜300。 |
| `title` | string | 任意 |  | PDF のタイトル。常にメタデータに書き、drawTitle が false でなければ本文の冒頭にも見出しとして描く。 |
| `drawTitle` | boolean | 任意 |  | Whether to draw title as a heading at the top of the body. Default true. Pass false when the body already starts with its own heading (e.g. a Markdown "# ..." line): the title then goes into the metadata only (Info /Title, and XMP dc:title when tagged), so tagged output keeps the dc:title PDF/UA requires (ISO 14289-1 7.1 / ISO 14289-2 8.11.1) without a duplicated heading. |
| `author` | string | 任意 |  | PDF 作成者(メタデータ)。 |
| `onMissingGlyph` | `"error"` \| `"replace"` \| `"ignore"` | 任意 |  | What to do with characters the font lacks (e.g. ✔ U+2714, missing from Noto Sans JP). error (default) = fail, listing the missing characters / replace = substitute 〓 with a warning (? when the font lacks 〓, so always ? with the standard font) / ignore = render as blanks with a warning. |
| `tagged` | boolean | 任意 |  | Generate as a tagged PDF (PDF/UA, ISO 14289). Default false. When true, a structure tree, the PDF/UA declaration, /Lang and DisplayDocTitle are added, making the document readable by screen readers. PDF/UA requires a title, so title becomes required. Which part is declared follows pdfVersion: PDF/UA-1 (ISO 14289-1) on the default 1.7, PDF/UA-2 (ISO 14289-2, pdfuaid:part 2 and rev 2024) with pdfVersion "2.0". Under PDF/UA-2 the drawn title is a Title element (not H1), Markdown headings keep their own level, and structure elements are placed in the PDF 2.0 namespace (BlockQuote and Code, which it lacks, stay in the PDF 1.7 one). |
| `lang` | string | 任意 |  | 文書の自然言語(BCP 47。例 "ja" / "en-US")。tagged 時に省略すると本文から推定し、推定結果を warnings で報告する。誤った言語宣言はスクリーンリーダの誤読を招くため、確実な場合は明示すること。 |
| `pdfVersion` | `"1.7"` \| `"2.0"` | 任意 |  | PDF version to output. Default "1.7". "2.0" (ISO 32000-2) satisfies not just the version claim but the duties bound to it: a trailer /ID is added (Required per Table 15), and the Info dictionary is trimmed to CreationDate / ModDate with title, author and Producer moved to XMP (§14.3.3). With tagged: true, "2.0" declares PDF/UA-2 instead of PDF/UA-1 (PDF/UA-1 allows only PDF 1.0 to 1.7, ISO 14289-1 §6.1). |

::: warning `outputPath` は必ず渡す
省略すると PDF 全体が base64 で返り、会話が破綻しやすいです。保存先は絶対パスで渡してください。
:::

::: warning `tagged: true` と `pdfVersion: "2.0"` は併用できません
このサーバーが書ける適合宣言は PDF/UA-1（PDF 1.7 基盤）だけです。PDF 2.0 の文書に載せると、誰にも測れない宣言になります。
:::

::: tip タグ付きにするなら最初から
後から `ensure_tagged` を掛けるより、`tagged: true` で作るほうが良い文書になります。PDF/UA はタイトル必須のため `title` も必須です。`lang` は確実なら明示してください。
:::

::: details 呼び出し例 — 「タグ付きの短い PDF を作って」
- 実測: v0.21.0
- `tagged`: `true`
- `lang`: `"en"`
- `title`: `"Tagged sample"`
- フォント: 標準 Helvetica（`fontPath` なし）

**パラメータ**

```jsonc
{
  "text": "This is a tagged sample.\n\nSecond paragraph.",
  "title": "Tagged sample",
  "tagged": true,
  "lang": "en",
  "outputPath": "/absolute/path/to/output.pdf"
}
```

**返る JSON**

```jsonc
{
  "pageCount": 1,
  "bytes": 4122,
  "font": "Helvetica",
  "path": "/absolute/path/to/output.pdf",
  "warnings": [
    "The standard font (Helvetica) is not embedded, but PDF/UA-1 (7.21.4.1) requires all fonts to be embedded — this tagged PDF will NOT pass conformance validation. Pass \"fontPath\" (or set PDF_WRITER_FONT) to embed a font."
  ]
}
```

標準フォントは埋め込まれないため、PDF/UA-1 7.21.4.1 では veraPDF は通りません。日本語やタグ付き納品では `fontPath`（または `PDF_WRITER_FONT`）を渡してください。
:::

## create_markdown_pdf

**Create PDF from Markdown**

Create a PDF from Markdown. Supports headings, paragraphs, bullet/numbered lists, code blocks, quotes, horizontal rules and tables. Inline decoration markers are stripped and the text rendered plain (single font). Nested lists keep their nesting, and wrapped list text lines up after the bullet or number. With tagged: true each item is LI > Lbl (bullet/number) + LBody and each L states ListNumbering (Decimal or Disc) (v0.25.0). A nested list sits inside its parent LBody under PDF/UA-1, and directly in the parent L right after the item under PDF/UA-2 (pdfVersion "2.0"; ISO 32000-2 §14.8.4.8.2) (v0.27.0).

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `markdown` | string | **必須** |  | Markdown 文字列。 |
| `outputPath` | string (minLength 1) | 任意 |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | 任意 |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `fontPath` | string (minLength 1) | 任意 |  | Absolute path of the font file to embed (.ttf / .otf). Required for characters outside WinAnsiEncoding (Japanese, for example). .ttc (TrueType Collection) is not supported. Can also be set via the PDF_WRITER_FONT environment variable. |
| `fontSize` | number (4–96) | 任意 |  | 本文フォントサイズ(pt)。既定 11。範囲 4〜96。 |
| `pageSize` | `"A4"` \| `"A3"` \| `"A5"` \| `"LETTER"` \| `"LEGAL"` | 任意 |  | ページサイズ。既定 A4。 |
| `margin` | number (0–300) | 任意 |  | 上下左右マージン(pt)。既定 56(≒20mm)。範囲 0〜300。 |
| `title` | string | 任意 |  | PDF のタイトル。常にメタデータに書き、drawTitle が false でなければ本文の冒頭にも見出しとして描く。 |
| `drawTitle` | boolean | 任意 |  | Whether to draw title as a heading at the top of the body. Default true. Pass false when the body already starts with its own heading (e.g. a Markdown "# ..." line): the title then goes into the metadata only (Info /Title, and XMP dc:title when tagged), so tagged output keeps the dc:title PDF/UA requires (ISO 14289-1 7.1 / ISO 14289-2 8.11.1) without a duplicated heading. |
| `author` | string | 任意 |  | PDF 作成者(メタデータ)。 |
| `onMissingGlyph` | `"error"` \| `"replace"` \| `"ignore"` | 任意 |  | What to do with characters the font lacks (e.g. ✔ U+2714, missing from Noto Sans JP). error (default) = fail, listing the missing characters / replace = substitute 〓 with a warning (? when the font lacks 〓, so always ? with the standard font) / ignore = render as blanks with a warning. |
| `tagged` | boolean | 任意 |  | Generate as a tagged PDF (PDF/UA, ISO 14289). Default false. When true, a structure tree, the PDF/UA declaration, /Lang and DisplayDocTitle are added, making the document readable by screen readers. PDF/UA requires a title, so title becomes required. Which part is declared follows pdfVersion: PDF/UA-1 (ISO 14289-1) on the default 1.7, PDF/UA-2 (ISO 14289-2, pdfuaid:part 2 and rev 2024) with pdfVersion "2.0". Under PDF/UA-2 the drawn title is a Title element (not H1), Markdown headings keep their own level, and structure elements are placed in the PDF 2.0 namespace (BlockQuote and Code, which it lacks, stay in the PDF 1.7 one). |
| `lang` | string | 任意 |  | 文書の自然言語(BCP 47。例 "ja" / "en-US")。tagged 時に省略すると本文から推定し、推定結果を warnings で報告する。誤った言語宣言はスクリーンリーダの誤読を招くため、確実な場合は明示すること。 |
| `pdfVersion` | `"1.7"` \| `"2.0"` | 任意 |  | PDF version to output. Default "1.7". "2.0" (ISO 32000-2) satisfies not just the version claim but the duties bound to it: a trailer /ID is added (Required per Table 15), and the Info dictionary is trimmed to CreationDate / ModDate with title, author and Producer moved to XMP (§14.3.3). With tagged: true, "2.0" declares PDF/UA-2 instead of PDF/UA-1 (PDF/UA-1 allows only PDF 1.0 to 1.7, ISO 14289-1 §6.1). |

::: warning `outputPath` は必ず渡す
省略すると PDF 全体が base64 で返り、会話が破綻しやすいです。保存先は絶対パスで渡してください。
:::

::: warning `tagged: true` と `pdfVersion: "2.0"` は併用できません
このサーバーが書ける適合宣言は PDF/UA-1（PDF 1.7 基盤）だけです。PDF 2.0 の文書に載せると、誰にも測れない宣言になります。
:::

::: tip タグ付きにするなら最初から
後から `ensure_tagged` を掛けるより、`tagged: true` で作るほうが良い文書になります。PDF/UA はタイトル必須のため `title` も必須です。`lang` は確実なら明示してください。
:::

呼び出し例の形は [`create_text_pdf`](#create-text-pdf) と同じです（`text` の代わりに `markdown`）。

## create_table_pdf

**Create Table PDF**

ヘッダと行データから罫線付きの表 PDF を生成する。列幅は内容から自動算出し、セル内は折り返す。改ページ時はヘッダを再描画する。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `headers` | string[] | **必須** |  | ヘッダ行(列見出し)の配列。 |
| `rows` | string[][] | **必須** |  | データ行の配列。各行は文字列の配列で、headers と同じ列数を推奨。 |
| `outputPath` | string (minLength 1) | 任意 |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | 任意 |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `fontPath` | string (minLength 1) | 任意 |  | Absolute path of the font file to embed (.ttf / .otf). Required for characters outside WinAnsiEncoding (Japanese, for example). .ttc (TrueType Collection) is not supported. Can also be set via the PDF_WRITER_FONT environment variable. |
| `fontSize` | number (4–96) | 任意 |  | 本文フォントサイズ(pt)。既定 11。範囲 4〜96。 |
| `pageSize` | `"A4"` \| `"A3"` \| `"A5"` \| `"LETTER"` \| `"LEGAL"` | 任意 |  | ページサイズ。既定 A4。 |
| `margin` | number (0–300) | 任意 |  | 上下左右マージン(pt)。既定 56(≒20mm)。範囲 0〜300。 |
| `title` | string | 任意 |  | PDF のタイトル。常にメタデータに書き、drawTitle が false でなければ本文の冒頭にも見出しとして描く。 |
| `drawTitle` | boolean | 任意 |  | Whether to draw title as a heading at the top of the body. Default true. Pass false when the body already starts with its own heading (e.g. a Markdown "# ..." line): the title then goes into the metadata only (Info /Title, and XMP dc:title when tagged), so tagged output keeps the dc:title PDF/UA requires (ISO 14289-1 7.1 / ISO 14289-2 8.11.1) without a duplicated heading. |
| `author` | string | 任意 |  | PDF 作成者(メタデータ)。 |
| `onMissingGlyph` | `"error"` \| `"replace"` \| `"ignore"` | 任意 |  | What to do with characters the font lacks (e.g. ✔ U+2714, missing from Noto Sans JP). error (default) = fail, listing the missing characters / replace = substitute 〓 with a warning (? when the font lacks 〓, so always ? with the standard font) / ignore = render as blanks with a warning. |
| `tagged` | boolean | 任意 |  | Generate as a tagged PDF (PDF/UA, ISO 14289). Default false. When true, a structure tree, the PDF/UA declaration, /Lang and DisplayDocTitle are added, making the document readable by screen readers. PDF/UA requires a title, so title becomes required. Which part is declared follows pdfVersion: PDF/UA-1 (ISO 14289-1) on the default 1.7, PDF/UA-2 (ISO 14289-2, pdfuaid:part 2 and rev 2024) with pdfVersion "2.0". Under PDF/UA-2 the drawn title is a Title element (not H1), Markdown headings keep their own level, and structure elements are placed in the PDF 2.0 namespace (BlockQuote and Code, which it lacks, stay in the PDF 1.7 one). |
| `lang` | string | 任意 |  | 文書の自然言語(BCP 47。例 "ja" / "en-US")。tagged 時に省略すると本文から推定し、推定結果を warnings で報告する。誤った言語宣言はスクリーンリーダの誤読を招くため、確実な場合は明示すること。 |
| `pdfVersion` | `"1.7"` \| `"2.0"` | 任意 |  | PDF version to output. Default "1.7". "2.0" (ISO 32000-2) satisfies not just the version claim but the duties bound to it: a trailer /ID is added (Required per Table 15), and the Info dictionary is trimmed to CreationDate / ModDate with title, author and Producer moved to XMP (§14.3.3). With tagged: true, "2.0" declares PDF/UA-2 instead of PDF/UA-1 (PDF/UA-1 allows only PDF 1.0 to 1.7, ISO 14289-1 §6.1). |

::: warning `outputPath` は必ず渡す
省略すると PDF 全体が base64 で返り、会話が破綻しやすいです。保存先は絶対パスで渡してください。
:::

::: warning `tagged: true` と `pdfVersion: "2.0"` は併用できません
このサーバーが書ける適合宣言は PDF/UA-1（PDF 1.7 基盤）だけです。PDF 2.0 の文書に載せると、誰にも測れない宣言になります。
:::

::: tip タグ付きにするなら最初から
後から `ensure_tagged` を掛けるより、`tagged: true` で作るほうが良い文書になります。PDF/UA はタイトル必須のため `title` も必須です。`lang` は確実なら明示してください。
:::

呼び出し例の形は [`create_text_pdf`](#create-text-pdf) と同じです（`text` の代わりに `headers` と `rows`）。

## set_metadata

**Set PDF Metadata**

::: warning 非推奨
:::

Update an existing PDF's metadata (the Info dictionary). Only the given fields change; the rest are preserved. At least one of title / author / subject / keywords / creator / tdmReservation is required. In documents with XMP (/Metadata), dc:title etc. are synchronized to prevent divergence; XMP values you did not pass are carried over as written (other languages of dc:title, every dc:creator, unknown namespaces). On a PDF 2.0 input the values go to XMP and no new Info entries are added (ISO 32000-2 14.3.3 deprecates Info metadata); on a PDF/UA-2 input the existing Info entries are moved to XMP and removed. The output keeps the version of its input. tdmReservation (0 | 1) and tdmPolicy (URL) write the W3C TDM Reservation Protocol statement to XMP (tdm:reservation / tdm:policy, namespace http://www.w3.org/ns/tdmrep/); a document without XMP gets one. When the document declares PDF/A, the tdmrep schema is also described in pdfaExtension:schemas, so veraPDF does not fail ISO 19005-2 6.6.2.3 on it. For signed PDFs, preserveSignatures: true updates while keeping the signatures intact.

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **必須** |  | 編集対象 PDF の絶対パス。 |
| `title` | string | 任意 |  | タイトル。 |
| `author` | string | 任意 |  | 作成者。 |
| `subject` | string | 任意 |  | サブタイトル・件名。 |
| `keywords` | string[] | 任意 |  | キーワードの配列。 |
| `creator` | string | 任意 |  | 作成アプリケーション名。 |
| `tdmReservation` | `0` \| `1` | 任意 |  | W3C TDM Reservation Protocol（TDMRep）の権利表示。XMP に tdm:reservation として書く。1 = テキスト・データマイニングの権利を留保する、0 = 留保しない。指定しなければ書かない。PDF/A 文書では tdmrep スキーマを pdfaExtension:schemas にも記述する（定義済みでない名前空間に対して ISO 19005 が要求する）。 |
| `tdmPolicy` | string | 任意 |  | TDM ポリシーの URL（tdm:policy）。tdmReservation が必要。 |
| `preserveSignatures` | boolean | 任意 |  | 署名済み PDF に対し、既存署名を無効化せず増分更新（末尾追記）で編集する。既定 false。元のバイト列には一切触れないため /ByteRange が保たれる。認証署名（DocMDP）の許可レベルに反する変更は拒否される。 |
| `outputPath` | string (minLength 1) | 任意 |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | 任意 |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `allowBreakingSignatures` | boolean | 任意 |  | 編集対象が電子署名済み(/ByteRange 検知)の場合、既定ではエラーにする。true を指定すると署名が無効化されることを承知の上で編集を続行する。 |

::: info XMP がある文書では dc:title 等も同期します
Info 辞書だけを変えて XMP と食い違わないようにします。`title` / `author` / `subject` / `keywords` / `creator` の少なくとも 1 つが必須です。
:::

::: warning `outputPath` は必ず渡す
省略すると PDF 全体が base64 で返り、会話が破綻しやすいです。保存先は絶対パスで渡してください。
:::

::: warning 署名済み PDF は既定でエラー
署名を保つなら `preserveSignatures: true`（増分更新）。無効になってもよい場合のみ `allowBreakingSignatures: true`。明示が無ければ無効にしません。
:::

## merge_pdfs

**Merge PDFs**

Merge multiple PDFs into one, in the given order. Document metadata is carried over from the first file. The output keeps the version of the inputs; when they mix PDF 2.0 and PDF 1.x the call is refused unless pdfVersion is given — "2.0" is an explicit conversion, and versions are never lowered. Pages are copied into a new document, so document-level information (tagged structure, XMP, attachments, AcroForm, bookmarks, etc.) is not carried over. Anything lost is reported in warnings; follow up on the output with attach_file / ensure_tagged / add_bookmarks / set_metadata as needed.

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `inputPaths` | string (minLength 1)[] | **必須** |  | 結合する PDF の絶対パスの配列(結合順・2 件以上)。 |
| `pdfVersion` | `"1.7"` \| `"2.0"` | 任意 |  | Version of the merged file. Omit it to keep the version of the inputs (the first input decides among PDF 1.x versions). Required when the inputs mix PDF 2.0 and PDF 1.x: "2.0" converts the merged file to PDF 2.0 (trailer /ID, Info metadata moved to XMP). "1.7" is refused when any input is PDF 2.0 — versions are never lowered. |
| `outputPath` | string (minLength 1) | 任意 |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | 任意 |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `allowBreakingSignatures` | boolean | 任意 |  | 編集対象が電子署名済み(/ByteRange 検知)の場合、既定ではエラーにする。true を指定すると署名が無効化されることを承知の上で編集を続行する。 |

::: warning 文書レベル情報は引き継がれない
ページを新しい文書へ複製するため、タグ付き構造・XMP・AcroForm・しおり等は引き継がれません。失われたものは warnings で報告されます。必要なら出力に `attach_file` / `ensure_tagged` / `add_bookmarks` / `set_metadata` を後がけしてください。
:::

::: warning `outputPath` は必ず渡す
省略すると PDF 全体が base64 で返り、会話が破綻しやすいです。保存先は絶対パスで渡してください。
:::

::: warning 署名済み PDF は既定でエラー
署名を保つ操作ではありません。無効になってもよい場合のみ `allowBreakingSignatures: true` を明示してください。明示が無ければ無効にしません。
:::

::: details 呼び出し例 — 「この 2 つの PDF を 1 つにまとめて」
- 実測: v0.21.0
- 標本: `docs/specimens/publish-demo.pdf` と `docs/specimens/selfmade-base.pdf`（呼び出すときは絶対パス）

**パラメータ**

```jsonc
{
  "inputPaths": [
    "/absolute/path/to/docs/specimens/publish-demo.pdf",
    "/absolute/path/to/docs/specimens/selfmade-base.pdf"
  ],
  "outputPath": "/absolute/path/to/output.pdf"
}
```

**返る JSON**（warnings は要約）

```jsonc
{
  "pageCount": 2,
  "bytes": 35552,
  "path": "/absolute/path/to/output.pdf",
  "warnings": [
    "The input XMP declares conformance (pdfuaid/pdfaid) that this output can no longer meet — the structure tree is not carried over yet — so it was dropped rather than copied. …",
    "merge_pdfs did not carry over the tagged structure (/StructTreeRoot, /MarkInfo) that the input had …",
    "merge_pdfs did not carry over the XMP metadata (/Metadata) that the input had …"
  ]
}
```

XMP の pdfaid / pdfuaid はコピーせず落とします。名乗ったまま構造木が無いファイルは、名乗らないファイルより悪いためです。
:::

## split_pdf

**Split PDF**

PDF をページ範囲ごとに複数ファイルへ分割する。ranges の各要素が 1 ファイルになり、出力は "`<prefix>`1.pdf", "`<prefix>`2.pdf", ... の連番になる。

ページを新しい文書へ複製するため、文書レベルの情報（タグ付き構造・XMP・添付・AcroForm・しおり等）は引き継がれない。失われたものは warnings で報告されるので、必要なら出力に attach_file / ensure_tagged / add_bookmarks / set_metadata を後がけする。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **必須** |  | 分割対象 PDF の絶対パス。 |
| `ranges` | string (minLength 1)[] | **必須** |  | ページ範囲指定の配列。各要素は "1-3" / "5" / "7-" / "-2" 形式(1 始まり)。例: ["1-3", "4-"]。 |
| `outputDir` | string (minLength 1) | **必須** |  | 出力先ディレクトリ（絶対パス）。 |
| `prefix` | string (minLength 1) | 任意 |  | 出力ファイル名の接頭辞。既定は "<入力ファイル名>-part"。 |
| `allowBreakingSignatures` | boolean | 任意 |  | 編集対象が電子署名済み(/ByteRange 検知)の場合、既定ではエラーにする。true を指定すると署名が無効化されることを承知の上で編集を続行する。 |

::: warning 文書レベル情報は引き継がれない
ページを新しい文書へ複製するため、タグ付き構造・XMP・AcroForm・しおり等は引き継がれません。失われたものは warnings で報告されます。必要なら各出力に `attach_file` / `ensure_tagged` / `add_bookmarks` / `set_metadata` を後がけしてください。
:::

::: warning 署名済み PDF は既定でエラー
署名を保つ操作ではありません。無効になってもよい場合のみ `allowBreakingSignatures: true` を明示してください。明示が無ければ無効にしません。
:::

## extract_pages

**Extract Pages**

指定ページだけを含む新しい PDF を作る。指定順がそのまま出力順になるため、ページの並べ替えを兼ねた抽出もできる。

ページを新しい文書へ複製するため、文書レベルの情報（タグ付き構造・XMP・添付・AcroForm・しおり等）は引き継がれない。失われたものは warnings で報告されるので、必要なら出力に attach_file / ensure_tagged / add_bookmarks / set_metadata を後がけする。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **必須** |  | 対象 PDF の絶対パス。 |
| `pages` | string (minLength 1) | **必須** |  | ページ指定。"1,3-5,8-" 形式(1 始まり)。指定順が出力順になる。 |
| `outputPath` | string (minLength 1) | 任意 |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | 任意 |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `allowBreakingSignatures` | boolean | 任意 |  | 編集対象が電子署名済み(/ByteRange 検知)の場合、既定ではエラーにする。true を指定すると署名が無効化されることを承知の上で編集を続行する。 |

::: warning 文書レベル情報は引き継がれない
ページを新しい文書へ複製するため、タグ付き構造・XMP・AcroForm・しおり等は引き継がれません。失われたものは warnings で報告されます。必要なら出力に `attach_file` / `ensure_tagged` / `add_bookmarks` / `set_metadata` を後がけしてください。
:::

::: warning `outputPath` は必ず渡す
省略すると PDF 全体が base64 で返り、会話が破綻しやすいです。保存先は絶対パスで渡してください。
:::

::: info `pages` は文字列
`"1"` / `"1,3-5,8-"` です。配列ではありません。指定順が出力順になります。
:::

::: details 呼び出し例 — 「1 ページ目だけ抜き出して」
- 実測: v0.21.0
- 標本: `docs/specimens/publish-demo.pdf`（呼び出すときは絶対パス）
- `pages`: `"1"`

**パラメータ**

```jsonc
{
  "inputPath": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "pages": "1",
  "outputPath": "/absolute/path/to/output.pdf"
}
```

**返る JSON**（warnings は要約）

```jsonc
{
  "pageCount": 1,
  "bytes": 26881,
  "path": "/absolute/path/to/output.pdf",
  "warnings": [
    "The input XMP declares conformance (pdfuaid/pdfaid) that this output can no longer meet — the structure tree is not carried over yet — so it was dropped rather than copied. …",
    "extract_pages did not carry over the tagged structure (/StructTreeRoot, /MarkInfo) that the input had …",
    "extract_pages did not carry over the XMP metadata (/Metadata) that the input had …"
  ]
}
```
:::

## delete_pages

**Delete Pages**

指定ページを削除した新しい PDF を作る。全ページを削除する指定はエラーになる。

ページを新しい文書へ複製するため、文書レベルの情報（タグ付き構造・XMP・添付・AcroForm・しおり等）は引き継がれない。失われたものは warnings で報告されるので、必要なら出力に attach_file / ensure_tagged / add_bookmarks / set_metadata を後がけする。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **必須** |  | 対象 PDF の絶対パス。 |
| `pages` | string (minLength 1) | **必須** |  | 削除するページ指定。"1,3-5,8-" 形式(1 始まり)。 |
| `outputPath` | string (minLength 1) | 任意 |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | 任意 |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `allowBreakingSignatures` | boolean | 任意 |  | 編集対象が電子署名済み(/ByteRange 検知)の場合、既定ではエラーにする。true を指定すると署名が無効化されることを承知の上で編集を続行する。 |

::: warning 文書レベル情報は引き継がれない
ページを新しい文書へ複製するため、タグ付き構造・XMP・AcroForm・しおり等は引き継がれません。失われたものは warnings で報告されます。必要なら出力に `attach_file` / `ensure_tagged` / `add_bookmarks` / `set_metadata` を後がけしてください。
:::

::: warning `outputPath` は必ず渡す
省略すると PDF 全体が base64 で返り、会話が破綻しやすいです。保存先は絶対パスで渡してください。
:::

::: warning 署名済み PDF は既定でエラー
署名を保つ操作ではありません。無効になってもよい場合のみ `allowBreakingSignatures: true` を明示してください。明示が無ければ無効にしません。
:::

## reorder_pages

**Reorder Pages**

ページを並べ替える。order には全ページを新しい順序で 1 回ずつ列挙する。

ページを新しい文書へ複製するため、文書レベルの情報（タグ付き構造・XMP・添付・AcroForm・しおり等）は引き継がれない。失われたものは warnings で報告されるので、必要なら出力に attach_file / ensure_tagged / add_bookmarks / set_metadata を後がけする。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **必須** |  | 対象 PDF の絶対パス。 |
| `order` | integer (-9007199254740991–9007199254740991)[] | **必須** |  | 新しいページ順(1 始まり)。例: 5 ページの逆順は [5,4,3,2,1]。 |
| `outputPath` | string (minLength 1) | 任意 |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | 任意 |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `allowBreakingSignatures` | boolean | 任意 |  | 編集対象が電子署名済み(/ByteRange 検知)の場合、既定ではエラーにする。true を指定すると署名が無効化されることを承知の上で編集を続行する。 |

::: warning 文書レベル情報は引き継がれない
ページを新しい文書へ複製するため、タグ付き構造・XMP・AcroForm・しおり等は引き継がれません。失われたものは warnings で報告されます。必要なら出力に `attach_file` / `ensure_tagged` / `add_bookmarks` / `set_metadata` を後がけしてください。
:::

::: warning `outputPath` は必ず渡す
省略すると PDF 全体が base64 で返り、会話が破綻しやすいです。保存先は絶対パスで渡してください。
:::

::: warning 署名済み PDF は既定でエラー
署名を保つ操作ではありません。無効になってもよい場合のみ `allowBreakingSignatures: true` を明示してください。明示が無ければ無効にしません。
:::

## add_bookmarks

**Add Bookmarks (Outline)**

Set the bookmarks (outline) of a PDF. Existing bookmarks are replaced. Nest with children. For signed PDFs, preserveSignatures: true sets them while keeping the signatures intact. When the input declares PDF/UA-2, each bookmark goes to a structure destination as ISO 14289-2 §8.8 requires: a GoTo action whose SD names the structure element that starts on the target page, with D kept as the page destination for viewers that do not read SD. A page with no structure content gets a page destination and is named in warnings (v0.27.0).

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **必須** |  | 対象 PDF の絶対パス。 |
| `bookmarks` | any[] | **必須** |  | しおりの配列。各要素は { title, page, open?, children? }。page は 1 始まり。children で階層化でき、最大 8 階層・合計 2000 件まで。 |
| `preserveSignatures` | boolean | 任意 |  | 署名済み PDF に対し、既存署名を無効化せず増分更新（末尾追記）で編集する。既定 false。元のバイト列には一切触れないため /ByteRange が保たれる。認証署名（DocMDP）の許可レベルに反する変更は拒否される。 |
| `outputPath` | string (minLength 1) | 任意 |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | 任意 |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `allowBreakingSignatures` | boolean | 任意 |  | 編集対象が電子署名済み(/ByteRange 検知)の場合、既定ではエラーにする。true を指定すると署名が無効化されることを承知の上で編集を続行する。 |

::: warning 既存のしおりを置換します
追加ではなく置き換えです。
:::

::: warning `outputPath` は必ず渡す
省略すると PDF 全体が base64 で返り、会話が破綻しやすいです。保存先は絶対パスで渡してください。
:::

::: warning 署名済み PDF は既定でエラー
署名を保つなら `preserveSignatures: true`（増分更新）。無効になってもよい場合のみ `allowBreakingSignatures: true`。明示が無ければ無効にしません。
:::

## add_annotation

**Add Annotation**

ページに注釈を 1 つ追加する。付箋（text）・ハイライト（highlight）・矩形（square）に対応し、座標は PDF 座標系（左下原点・pt）で指定する。

署名済み PDF には preserveSignatures: true を使うと、既存署名を無効化せず増分更新で追加できる。タグ付き文書では Annot 構造要素への内包も増分に含まれ、PDF/UA 準拠が保たれる。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **必須** |  | 対象 PDF の絶対パス。 |
| `page` | integer (1–9007199254740991) | **必須** |  | 対象ページ(1 始まり)。 |
| `type` | `"text"` \| `"highlight"` \| `"square"` | **必須** |  | text=付箋アイコン / highlight=ハイライト / square=矩形。 |
| `rect` | object | **必須** |  | 注釈の矩形。PDF 座標系(左下原点・pt)。x1<x2 かつ y1<y2 であること。 |
| `rect.x1` | number | **必須** |  |  |
| `rect.y1` | number | **必須** |  |  |
| `rect.x2` | number | **必須** |  |  |
| `rect.y2` | number | **必須** |  |  |
| `contents` | string | 任意 |  | 注釈の本文(日本語可)。 |
| `author` | string | 任意 |  | 作成者名。 |
| `alt` | string | 任意 |  | Alt text for assistive technology. In tagged PDFs the annotation is enclosed in an Annot structure element (PDF/UA 7.18.1-1) and this becomes that element's /Alt. Ignored in untagged documents. On a PDF/UA-2 document the annotation's Contents must equal the Alt (ISO 14289-2 §8.9.4.2): alt alone is also written as Contents, and a different contents is refused. |
| `color` | string | 任意 |  | #rrggbb 形式。既定は type ごと(text=#ffd400 / highlight=#ffff00 / square=#ff0000)。 |
| `interiorColor` | string | 任意 |  | square の塗り色(#rrggbb)。 |
| `icon` | `"Note"` \| `"Comment"` \| `"Key"` \| `"Help"` \| `"NewParagraph"` \| `"Paragraph"` \| `"Insert"` | 任意 |  | text のアイコン。既定 Note。 |
| `open` | boolean | 任意 |  | text を開いた状態にするか。既定 false。 |
| `preserveSignatures` | boolean | 任意 |  | 署名済み PDF に対し、既存署名を無効化せず増分更新（末尾追記）で注釈を追加する。既定 false。元のバイト列には一切触れないため /ByteRange が保たれる。タグ付き PDF では Annot 構造要素への内包も増分に含めて PDF/UA 準拠を維持する。認証署名（DocMDP）では P=3 のときのみ許可。 |
| `outputPath` | string (minLength 1) | 任意 |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | 任意 |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `allowBreakingSignatures` | boolean | 任意 |  | 編集対象が電子署名済み(/ByteRange 検知)の場合、既定ではエラーにする。true を指定すると署名が無効化されることを承知の上で編集を続行する。 |

::: info 座標は PDF 座標系
左下原点・pt です。pdf-reader-mcp の `locate_objects` / `extract_structured_text`（`include_bbox`）が返す矩形をそのまま渡せます。タグ付き文書では Annot 構造要素への内包（PDF/UA 7.18.1-1）も行い、支援技術向けの代替テキストは `alt` で渡します。
:::

::: warning `outputPath` は必ず渡す
省略すると PDF 全体が base64 で返り、会話が破綻しやすいです。保存先は絶対パスで渡してください。
:::

::: warning 署名済み PDF は既定でエラー
署名を保つなら `preserveSignatures: true`（増分更新。DocMDP では P=3 のときのみ許可）。無効になってもよい場合のみ `allowBreakingSignatures: true`。明示が無ければ無効にしません。
:::

::: details 呼び出し例 — 「H1 の矩形に四角注釈を付けて」
- 実測: v0.21.0
- 標本: `docs/specimens/publish-demo.pdf`（呼び出すときは絶対パス）
- `type`: `"square"`
- `rect`: pdf-reader-mcp が返した H1 の bbox（56, 766.306）–（375.194, 792.37）

**パラメータ**

```jsonc
{
  "inputPath": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "page": 1,
  "type": "square",
  "rect": { "x1": 56, "y1": 766.306, "x2": 375.194, "y2": 792.37 },
  "contents": "H1",
  "alt": "Heading highlight",
  "outputPath": "/absolute/path/to/output.pdf"
}
```

**返る JSON**

```jsonc
{
  "pageCount": 1,
  "bytes": 93486,
  "path": "/absolute/path/to/output.pdf"
}
```
:::

## stamp_page_numbers

**Stamp Page Numbers**

各ページにページ番号を刻む。タグ付き PDF では Artifact として囲むため PDF/UA 準拠を維持する。日本語を含む書式を使う場合は fontPath か環境変数 PDF_WRITER_FONT が必要。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **必須** |  | 対象 PDF の絶対パス。 |
| `format` | string (minLength 1) | 任意 |  | 書式。{n}=現在ページ、{total}=総ページ数。既定 "{n}"。例: "- {n} -" / "{n} / {total}" / "{n} ページ"。{n} を必ず含めること。 |
| `position` | `"bottom-left"` \| `"bottom-center"` \| `"bottom-right"` \| `"top-left"` \| `"top-center"` \| `"top-right"` | 任意 |  | 配置。既定 bottom-center。ページの回転(/Rotate)を考慮した見た目の位置。 |
| `margin` | number (0–300) | 任意 |  | 端からの余白(pt)。既定 24。範囲 0〜300。 |
| `fontSize` | number (4–96) | 任意 |  | フォントサイズ(pt)。既定 9。範囲 4〜96。 |
| `color` | string (minLength 1) | 任意 |  | #rrggbb。既定 #666666。 |
| `fontPath` | string (minLength 1) | 任意 |  | Font to embed (.ttf/.otf). Falls back to the PDF_WRITER_FONT environment variable, then the standard font. Required for formats containing characters outside WinAnsiEncoding (CJK, for example). |
| `pages` | string (minLength 1) | 任意 |  | 番号を刻むページ指定。"1,3-5,8-" 形式(1 始まり)。省略時は全ページ。表紙を除くなら "2-" のように指定する。 |
| `startAt` | integer (-9007199254740991–9007199254740991) | 任意 |  | 最初に刻む番号。既定 1。表紙を除いて 1 から始めたい場合などに使う。 |
| `preserveSignatures` | boolean | 任意 |  | 署名済み PDF に対し、既存署名を無効化せず増分更新（末尾追記）で編集する。既定 false。元のバイト列には一切触れないため /ByteRange が保たれる。認証署名（DocMDP）の許可レベルに反する変更は拒否される。 |
| `outputPath` | string (minLength 1) | 任意 |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | 任意 |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `allowBreakingSignatures` | boolean | 任意 |  | 編集対象が電子署名済み(/ByteRange 検知)の場合、既定ではエラーにする。true を指定すると署名が無効化されることを承知の上で編集を続行する。 |

::: tip タグ付き PDF では Artifact
ページ番号は Artifact として囲むため、PDF/UA 準拠が保たれます。日本語を含む `format` にはフォントが必須です。
:::

::: warning `outputPath` は必ず渡す
省略すると PDF 全体が base64 で返り、会話が破綻しやすいです。保存先は絶対パスで渡してください。
:::

::: warning 署名済み PDF は既定でエラー
署名を保つなら `preserveSignatures: true`（増分更新）。無効になってもよい場合のみ `allowBreakingSignatures: true`。明示が無ければ無効にしません。
:::

## add_watermark

**Add Watermark**

各ページの中央に斜めの透かし文字を重ねる("社外秘" / "DRAFT" / "COPY" 等)。既定では本文の背面に薄く敷く。タグ付き PDF では Artifact として囲むため PDF/UA 準拠を維持する。日本語の透かしには fontPath か環境変数 PDF_WRITER_FONT が必要。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **必須** |  | 対象 PDF の絶対パス。 |
| `text` | string (minLength 1) | **必須** |  | 透かし文字。例: "社外秘" / "DRAFT" / "COPY"。 |
| `fontSize` | number (4–96) | 任意 |  | フォントサイズ(pt)。既定 60。範囲 4〜96。 |
| `color` | string (minLength 1) | 任意 |  | #rrggbb。既定 #808080(灰)。 |
| `opacity` | number (0–1) | 任意 |  | 不透明度 0(透明)〜1(不透明)。既定 0.15。本文を読める程度に薄くする。 |
| `angle` | number | 任意 |  | 反時計回りの角度(度)。既定 45。0 で水平。 |
| `behind` | boolean | 任意 |  | 本文の背面に敷くか。既定 true。false にすると本文の上に重なる(改ざん防止の主張を強めたい場合)。 |
| `fontPath` | string (minLength 1) | 任意 |  | Font to embed (.ttf/.otf). Falls back to the PDF_WRITER_FONT environment variable, then the standard font. Required for watermarks containing characters outside WinAnsiEncoding (CJK, for example). |
| `pages` | string (minLength 1) | 任意 |  | 対象ページ指定。"1,3-5,8-" 形式(1 始まり)。省略時は全ページ。 |
| `preserveSignatures` | boolean | 任意 |  | 署名済み PDF に対し、既存署名を無効化せず増分更新（末尾追記）で編集する。既定 false。元のバイト列には一切触れないため /ByteRange が保たれる。認証署名（DocMDP）の許可レベルに反する変更は拒否される。 |
| `outputPath` | string (minLength 1) | 任意 |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | 任意 |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `allowBreakingSignatures` | boolean | 任意 |  | 編集対象が電子署名済み(/ByteRange 検知)の場合、既定ではエラーにする。true を指定すると署名が無効化されることを承知の上で編集を続行する。 |

::: tip タグ付き PDF では Artifact
透かしは Artifact として囲むため、PDF/UA 準拠が保たれます。日本語の文字列にはフォントが必須です。
:::

::: warning `outputPath` は必ず渡す
省略すると PDF 全体が base64 で返り、会話が破綻しやすいです。保存先は絶対パスで渡してください。
:::

::: warning 署名済み PDF は既定でエラー
署名を保つなら `preserveSignatures: true`（増分更新）。無効になってもよい場合のみ `allowBreakingSignatures: true`。明示が無ければ無効にしません。
:::

::: details 呼び出し例 — 「全ページに DRAFT の透かしを入れて」
- 実測: v0.21.0
- 標本: `docs/specimens/publish-demo.pdf`（呼び出すときは絶対パス）
- `text`: `"DRAFT"`

**パラメータ**

```jsonc
{
  "inputPath": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "text": "DRAFT",
  "outputPath": "/absolute/path/to/output.pdf"
}
```

**返る JSON**

```jsonc
{
  "pageCount": 1,
  "bytes": 93321,
  "path": "/absolute/path/to/output.pdf",
  "watermarked": 1,
  "artifact": true
}
```

`artifact: true` は、タグ付き入力では透かしが Artifact として囲まれたことを示します。
:::

## fill_form

**Fill Form (AcroForm)**

既存 PDF の対話フォーム（AcroForm）にフィールド値を流し込む。XFA フォームは非対応。

- フィールド名が分からないときは、存在しない名前を指定するとエラーに全フィールド名と型が列挙される
- 日本語の値には fontPath か環境変数 PDF_WRITER_FONT が必要
- flatten: true で記入後に非対話化できる。ただしタグ付き PDF では PDF/UA 準拠が壊れるため allowBreakingTags: true も必要

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **必須** |  | 対象 PDF の絶対パス。 |
| `fields` | object | **必須** |  | フィールド名 → 値のオブジェクト。値の型はフィールド種別に対応する: text=文字列か数値 / checkbox=真偽値 / dropdown・optionlist=文字列か文字列配列 / radio=文字列。例: {"user.name": "山田 太郎", "agree": true, "plan": "A"} |
| `fontPath` | string (minLength 1) | 任意 |  | Font used to render values (.ttf/.otf). Falls back to the PDF_WRITER_FONT environment variable, then the standard font. Required for values containing characters outside WinAnsiEncoding (CJK, for example). |
| `flatten` | boolean | 任意 |  | 記入後にフラット化して非対話にするか。既定 false。true にすると値は編集できなくなる。 |
| `allowBreakingTags` | boolean | 任意 |  | タグ付き PDF でもフラット化を許すか。既定 false。true にすると PDF/UA-1 準拠が壊れる。 |
| `outputPath` | string (minLength 1) | 任意 |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | 任意 |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `allowBreakingSignatures` | boolean | 任意 |  | 編集対象が電子署名済み(/ByteRange 検知)の場合、既定ではエラーにする。true を指定すると署名が無効化されることを承知の上で編集を続行する。 |

::: tip フィールド名が分からないとき
存在しない名前を 1 つ渡すと、エラーに全フィールド名と型が列挙されます。メッセージ文字列ではなく `code` で分岐してください。
:::

::: warning XFA には対応していません
AcroForm だけです。`flatten: true` をタグ付き PDF に使うと PDF/UA 準拠でなくなり、さらに `allowBreakingTags: true` が必要です。
:::

::: warning `outputPath` は必ず渡す
省略すると PDF 全体が base64 で返り、会話が破綻しやすいです。保存先は絶対パスで渡してください。
:::

::: details 呼び出し例 — 「フォームに値を流し込む」（AcroForm が無い標本）
- 実測: v0.21.0
- 標本: `docs/specimens/publish-demo.pdf`（呼び出すときは絶対パス。AcroForm 無し）
- `fields`: `{ "dummy": "x" }`

**パラメータ**

```jsonc
{
  "inputPath": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "fields": { "dummy": "x" },
  "outputPath": "/absolute/path/to/output.pdf"
}
```

**返る JSON**（エラー）

```jsonc
{
  "error": "\"/absolute/path/to/docs/specimens/publish-demo.pdf\" has no AcroForm fields to fill.",
  "code": "INVALID_ARGUMENT"
}
```

フィールドが無いときはこの `code` です。フィールドはあるが名前を間違えたときは、エラー本文に名前と型が列挙されます。
:::

## flatten_form

**Flatten Form**

既存 PDF の対話フォーム（AcroForm）をフラット化し、記入済みの見た目を保ったまま非対話にする。配布前に値を固定したい場合に使う。

既存の値に日本語が含まれるなら、外観の再生成に備えて fontPath か環境変数 PDF_WRITER_FONT を指定しておくこと。タグ付き PDF では Widget 注釈が消えて Form 構造要素が宙に浮くため、既定では拒否する（allowBreakingTags: true で強行できる）。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **必須** |  | 対象 PDF の絶対パス。 |
| `fontPath` | string (minLength 1) | 任意 |  | Font for appearance regeneration. Falls back to the PDF_WRITER_FONT environment variable, then the standard font. Not needed when existing appearances can be reused, but required when appearances must be regenerated for values containing characters outside WinAnsiEncoding (CJK, for example). |
| `allowBreakingTags` | boolean | 任意 |  | タグ付き PDF でもフラット化を許すか。既定 false。 |
| `outputPath` | string (minLength 1) | 任意 |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | 任意 |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `allowBreakingSignatures` | boolean | 任意 |  | 編集対象が電子署名済み(/ByteRange 検知)の場合、既定ではエラーにする。true を指定すると署名が無効化されることを承知の上で編集を続行する。 |

::: warning タグ付き PDF では既定で拒否
Widget 注釈が消えて Form 構造要素が宙に浮くためです。`allowBreakingTags: true` で強行できますが、PDF/UA 準拠でなくなります。
:::

::: warning `outputPath` は必ず渡す
省略すると PDF 全体が base64 で返り、会話が破綻しやすいです。保存先は絶対パスで渡してください。
:::

::: warning 署名済み PDF は既定でエラー
署名を保つ操作ではありません。無効になってもよい場合のみ `allowBreakingSignatures: true` を明示してください。明示が無ければ無効にしません。
:::

## tag_form_fields

**Tag Form Fields (PDF/UA repair)**

Repair a tagged PDF's form to PDF/UA-1: enclose Widget annotations in Form structure elements (7.18.4-1), set /Tabs S on the affected pages (7.18.3-1), and give fields alternate names /TU (7.18.1-3). Pass human-readable names for screen readers via labels. On a PDF/UA-2 document each newly bound widget without /Contents also gets one (ISO 14289-2 §8.10.2.3; no Lbl is created): the label, else the existing /TU, else the field name. Widgets already bound to the structure tree are skipped, so it is safe to run repeatedly. Untagged documents are out of scope (rebuild with the create tools' tagged: true, or run ensure_tagged first). For signed PDFs, preserveSignatures: true repairs while keeping the signatures intact (approval signatures only; certification signatures are refused).

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **必須** |  | 対象 PDF の絶対パス。 |
| `labels` | object | 任意 |  | フィールド名 → 人間可読な代替名(/TU)。スクリーンリーダが読み上げる名前で、例: {"user.name": "氏名", "agree": "利用規約に同意する"}。省略したフィールドはフィールド名を /TU に代用し、warnings で報告する。存在しないフィールド名を指定するとエラーに全フィールド名が列挙される。 |
| `preserveSignatures` | boolean | 任意 |  | 署名済み PDF に対し、既存署名を無効化せず増分更新（末尾追記）で編集する。既定 false。元のバイト列には一切触れないため /ByteRange が保たれる。認証署名（DocMDP）の許可レベルに反する変更は拒否される。 |
| `outputPath` | string (minLength 1) | 任意 |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | 任意 |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `allowBreakingSignatures` | boolean | 任意 |  | 編集対象が電子署名済み(/ByteRange 検知)の場合、既定ではエラーにする。true を指定すると署名が無効化されることを承知の上で編集を続行する。 |

::: info タグ無し文書は対象外
タグ付き PDF のフォームを PDF/UA-1 へ修復します（Widget を Form へ内包、`/Tabs S`、`/TU`）。何度実行しても結果は同じです。タグ無しなら先に `ensure_tagged` か、作成時の `tagged: true` です。
:::

::: warning `outputPath` は必ず渡す
省略すると PDF 全体が base64 で返り、会話が破綻しやすいです。保存先は絶対パスで渡してください。
:::

::: warning 署名済み PDF は既定でエラー
署名を保つなら `preserveSignatures: true`（承認署名のみ。認証署名は拒否）。無効になってもよい場合のみ `allowBreakingSignatures: true`。明示が無ければ無効にしません。
:::

## ensure_tagged

**Ensure Tagged (PDF/UA scaffold & repair)**

Put an existing PDF onto the PDF/UA "vessel". If it is already tagged, the structure tree is untouched and only missing document-level requirements are supplied (MarkInfo / Lang / DisplayDocTitle / XMP pdfuaid and dc:title). For untagged documents, a minimal structure tree (each page = one P element) is created so the content becomes reachable by assistive technology. **IMPORTANT**: machines cannot infer meaning — headings, tables, lists, reading order and figure alt text are NOT created. The new tree is a scaffold, not an accessible document; it needs human review. If you can build the structure right from the start, use the create tools' tagged: true. For signed PDFs, preserveSignatures: true (approval signatures only; certification signatures are refused). The result separates addedRequirements (absent from the input) from replacedRequirements (present with a different value, rewritten); a requirement already present with the same value is neither rewritten nor listed. requirementsChanged is false when nothing was added, replaced or created — the output file is still written (v0.24.0). The declared part follows the input version (header or catalog /Version), which is never changed: PDF/UA-1 (pdfuaid:part 1) for PDF 1.0 to 1.7 (ISO 14289-1 §6.1), PDF/UA-2 (pdfuaid:part 2, rev 2024) for PDF 2.0 (ISO 14289-2 §6.1). For PDF 2.0, a new tree puts Document and P in the PDF 2.0 namespace; an existing tree whose root is not a single Document in that namespace (ISO 14289-2 §8.2.5.2) is left as it is and named in warnings (v0.27.0).

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **必須** |  | 対象 PDF の絶対パス。 |
| `title` | string (minLength 1) | 任意 |  | Document title (required by PDF/UA-1 7.1 / PDF/UA-2 8.11.1). Falls back to the existing Info Title, then the XMP dc:title. |
| `lang` | string | 任意 |  | Natural language of the document (BCP 47, e.g. "ja"). Required by PDF/UA-1 7.2 / PDF/UA-2 8.4.4. |
| `preserveSignatures` | boolean | 任意 |  | 署名済み PDF に対し、既存署名を無効化せず増分更新（末尾追記）で編集する。既定 false。元のバイト列には一切触れないため /ByteRange が保たれる。認証署名（DocMDP）の許可レベルに反する変更は拒否される。 |
| `outputPath` | string (minLength 1) | 任意 |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | 任意 |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `allowBreakingSignatures` | boolean | 任意 |  | 編集対象が電子署名済み(/ByteRange 検知)の場合、既定ではエラーにする。true を指定すると署名が無効化されることを承知の上で編集を続行する。 |

::: danger 書いたのは宣言。適合の証明ではない
XMP に pdfuaid を書きます。適合していない文書に適用すると、適合していないのに適合を名乗った PDF になります。書いたら必ず pdf-verify-mcp の `validate_conformance`（`flavour: "pdfua-1"`）で測ってください。測れないなら宣言を書かないでください。
:::

::: warning 機械は意味を推定できません
新設するのは最小限の構造木（各ページ = 1 つの P 要素）です。見出し・表・リスト・読み順・図の代替テキストは作られません。最初から `tagged: true` で作れるなら、そちらを使ってください。
:::

::: warning `outputPath` は必ず渡す
省略すると PDF 全体が base64 で返り、会話が破綻しやすいです。保存先は絶対パスで渡してください。
:::

::: details 呼び出し例 — 「既存 PDF を PDF/UA-1 の器に載せて」
- 実測: v0.21.2
- 標本: `docs/specimens/selfmade-base.pdf`（呼び出すときは絶対パス。既にタグ付き）
- `title`: `"Selfmade base"`
- `lang`: `"en"`

**パラメータ**

```jsonc
{
  "inputPath": "/absolute/path/to/docs/specimens/selfmade-base.pdf",
  "title": "Selfmade base",
  "lang": "en",
  "outputPath": "/absolute/path/to/output.pdf"
}
```

**返る JSON**

```jsonc
{
  "pageCount": 1,
  "bytes": 18406,
  "path": "/absolute/path/to/output.pdf",
  "wasTagged": true,
  "createdStructure": false,
  "wrappedPages": 0,
  "addedRequirements": [
    "Lang",
    "ViewerPreferences/DisplayDocTitle",
    "XMP(pdfuaid:part, dc:title)"
  ],
  "warnings": [
    "This file now CLAIMS PDF/UA-1 (pdfuaid:part=1), but conformance was NOT checked here. … Verify before relying on it: pdf-verify-mcp validate_conformance(flavour: \"pdfua-1\")."
  ]
}
```

既にタグ付きなので構造木には触らず、欠けていた文書レベル要件だけを補いました。宣言を書いたあとは `validate_conformance`（`flavour: "pdfua-1"`）で測ります。
:::

## ensure_pdfa

**Ensure PDF/A (archival conformance scaffold)**

Put an existing PDF onto the PDF/A "vessel" (the PDF/A counterpart of ensure_tagged). Choose the flavour: "pdfa-3b" (default) / "pdfa-4" / "pdfa-4f". Supplies only the missing document-level requirements: the trailer /ID (ISO 32000-1 14.4), an sRGB OutputIntent (GTS_PDFA1; an ICC profile is generated and embedded), and XMP pdfaid. **The -4 flavours additionally set the header to PDF 2.0 and delete the Info dictionary** — this is the explicit conversion to PDF 2.0. "pdfa-3b" is refused on a PDF 2.0 input (PDF/A-3 needs a %PDF-1.n header and versions are never lowered). (-4 forbids Info unless the catalog has /PieceInfo — stricter than ISO 32000-2 14.3.3). **Content, structure tree and fonts are never touched.** **Documents with attachments must use "pdfa-4f"** — plain "pdfa-4" requires every attachment to be PDF/A itself, so bundling CSV or JSON (e.g. an invoice PDF that carries its data) would not conform. **IMPORTANT**: this is preparation for claiming PDF/A, not a guarantee of conformance. Violations such as unembedded fonts, encryption, JavaScript or LZW are not repaired. **Writing pdfaid into XMP is the document claiming "I am PDF/A"** — applied to a non-conforming document it produces **a PDF that lies about itself** (which is why a warning is always returned). Always confirm with pdf-verify-mcp's validate_conformance (flavour: the same value) — the verdict is veraPDF's, and since ISO 19005 clauses cannot be quoted, the strongest statement is "veraPDF judged it so". When the document carries machine-readable attachments, apply it **after** attach_file. For signed PDFs, preserveSignatures: true (approval signatures only; certification signatures are refused). However, **the -4 flavours combined with preserveSignatures are refused unless the input is already PDF 2.0** (an incremental update cannot rewrite the file header, and rewriting it would break the signatures). **The -4 flavours are refused (INVALID_ARGUMENT, next_actions: flavour "pdfa-3b") when the input declares PDF/UA-1**: PDF/A-4 needs a PDF 2.0 header and PDF/UA-1 allows only 1.0 to 1.7 (ISO 14289-1 §6.1). Conversely, **"pdfa-3b" is refused (next_actions: flavour "pdfa-4") when the input declares PDF/UA-2**, which requires PDF 2.0 (ISO 14289-2 §6.1) while PDF/A-3 requires a PDF 1.x header. PDF/A-4 and PDF/UA-2 can both hold (v0.27.0). The result reports previousDeclaration — the PDF/A the input already claimed, { part, conformance } or null (it replaced wasDeclared in v0.24.0).

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **必須** |  | 対象 PDF の絶対パス。 |
| `flavour` | `"pdfa-3b"` \| `"pdfa-4"` \| `"pdfa-4f"` | 任意 |  | 名乗らせる PDF/A。既定 `"pdfa-3b"`。上の flavour 表を参照。 |
| `preserveSignatures` | boolean | 任意 |  | 署名済み PDF に対し、既存署名を無効化せず増分更新（末尾追記）で編集する。既定 false。元のバイト列には一切触れないため /ByteRange が保たれる。認証署名（DocMDP）の許可レベルに反する変更は拒否される。 |
| `outputPath` | string (minLength 1) | 任意 |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | 任意 |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `allowBreakingSignatures` | boolean | 任意 |  | 編集対象が電子署名済み(/ByteRange 検知)の場合、既定ではエラーにする。true を指定すると署名が無効化されることを承知の上で編集を続行する。 |

::: danger 書いたのは宣言。適合の証明ではない
XMP に pdfaid を書きます。フォント未埋め込み・暗号化・JavaScript などは直りません。適合していない文書に適用すると、適合していないのに適合を名乗った PDF になります。書いたら必ず pdf-verify-mcp の `validate_conformance` で測ってください。flavour にはここに渡したものと同じ文字列を指定します。測れないなら宣言を書かないでください。PDF/A の結果は「veraPDF が COMPLIANT と判定した」までです。
:::

::: warning 添付があるなら `"pdfa-4f"`
素の `"pdfa-4"` は添付ファイル自身が PDF/A であることを要求します（`6.9-3`）。CSV や JSON を同梱するなら `"pdfa-4f"` です。PDF/A-4 系はヘッダを PDF 2.0 にし Info 辞書を削除します。`preserveSignatures` との併用は、入力が既に PDF 2.0 でない限り拒否されます。
:::

::: warning `outputPath` は必ず渡す
省略すると PDF 全体が base64 で返り、会話が破綻しやすいです。保存先は絶対パスで渡してください。
:::

::: details 呼び出し例 — 「PDF/A-3b の器に載せて」
- 実測: v0.21.0
- 標本: `docs/specimens/publish-demo.pdf`（呼び出すときは絶対パス。既に PDF/A-3b を宣言）
- `flavour`: `"pdfa-3b"`

**パラメータ**

```jsonc
{
  "inputPath": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "flavour": "pdfa-3b",
  "outputPath": "/absolute/path/to/output.pdf"
}
```

**返る JSON**（warnings は要約）

```jsonc
{
  "pageCount": 1,
  "bytes": 92945,
  "path": "/absolute/path/to/output.pdf",
  "flavour": "3b",
  "addedRequirements": ["XMP pdfaid (part 3, conformance B)"],
  "wasDeclared": true,
  "warnings": [
    "The document already has a trailer /ID; it was left unchanged.",
    "The document already declares a GTS_PDFA1 output intent; it was left unchanged.",
    "This file now CLAIMS PDF/A-3b (pdfaid:part=3, conformance=B), but conformance was NOT checked here. … Verify before relying on it: pdf-verify-mcp validate_conformance(flavour: \"pdfa-3b\") …"
  ]
}
```

この warnings は異常ではなく設計です。捨てないでください。合否は veraPDF の `validate_conformance` です。
:::

## attach_file

**Attach File (Embedded File)**

PDF にファイルを埋め込む(添付する)。/Names /EmbeddedFiles と catalog /AF に登録し、AFRelationship を付与する。「人が読む請求書 PDF + 機械可読データ(CSV/XML)」を 1 ファイルに束ねる用途に使う。PDF/A-3(ISO 19005-3)と PDF/A-4f は、この形の添付を認めている。PDF/A も添付も、電子帳簿保存法の要件ではない。電子取引のデータの保存について同法が求めるのは(施行規則 4 条 1 項)、タイムスタンプ、訂正・削除を記録するか防ぐシステム、正当な理由のない訂正・削除を防ぐ事務処理規程のいずれかである。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **必須** |  | 対象 PDF の絶対パス。 |
| `attachmentPath` | string (minLength 1) | **必須** |  | 埋め込むファイルの絶対パス。 |
| `name` | string (minLength 1) | 任意 |  | PDF 内での表示名。省略時は元のファイル名。既存の添付と同名にはできない。 |
| `description` | string (minLength 1) | 任意 |  | 添付の説明(/Desc・日本語可)。 |
| `mimeType` | string (minLength 1) | 任意 |  | MIME 型。省略時は拡張子から推定(例 .csv → text/csv)。 |
| `relationship` | `"Source"` \| `"Data"` \| `"Alternative"` \| `"Supplement"` \| `"Unspecified"` | 任意 |  | 本文との関係(PDF/A-3 §6.8)。Data=本文と同じ内容の機械可読データ(請求書の XML/CSV 等) / Source=本文の元データ / Alternative=代替表現 / Supplement=補足資料 / Unspecified=不明(既定)。PDF/A-3 では意味のある値が必須のため、省略すると警告する。 |
| `preserveSignatures` | boolean | 任意 |  | 署名済み PDF に対し、既存署名を無効化せず増分更新（末尾追記）で編集する。既定 false。元のバイト列には一切触れないため /ByteRange が保たれる。認証署名（DocMDP）の許可レベルに反する変更は拒否される。 |
| `outputPath` | string (minLength 1) | 任意 |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | 任意 |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `allowBreakingSignatures` | boolean | 任意 |  | 編集対象が電子署名済み(/ByteRange 検知)の場合、既定ではエラーにする。true を指定すると署名が無効化されることを承知の上で編集を続行する。 |

::: warning PDF/A-3 では `relationship` に意味のある値が必須
`Source` / `Data` / `Alternative` / `Supplement` を渡してください。省略すると警告が返り、値は `Unspecified` です（ISO 19005-3 §6.8）。
:::

::: warning 添付があるなら PDF/A-4 は `"pdfa-4f"`
素の `"pdfa-4"` は添付ファイル自身が PDF/A であることを要求します。CSV や JSON を同梱するなら `ensure_pdfa` の flavour は `"pdfa-4f"` です。`ensure_pdfa` は添付の**後**に掛けます。
:::

::: warning `outputPath` は必ず渡す
省略すると PDF 全体が base64 で返り、会話が破綻しやすいです。保存先は絶対パスで渡してください。
:::

::: details 呼び出し例 — 「CSV を Data として埋め込んで」
- 実測: v0.21.0
- 標本: `docs/specimens/selfmade-base.pdf`（呼び出すときは絶対パス）
- 添付: `docs/specimens/publish-demo-data.csv`
- `name`: `"invoice-data.csv"`（既存名と重複すると `INVALID_ARGUMENT`）
- `relationship`: `"Data"`

**パラメータ**

```jsonc
{
  "inputPath": "/absolute/path/to/docs/specimens/selfmade-base.pdf",
  "attachmentPath": "/absolute/path/to/docs/specimens/publish-demo-data.csv",
  "name": "invoice-data.csv",
  "description": "Machine-readable invoice data",
  "relationship": "Data",
  "outputPath": "/absolute/path/to/output.pdf"
}
```

**返る JSON**

```jsonc
{
  "pageCount": 1,
  "bytes": 19070,
  "path": "/absolute/path/to/output.pdf",
  "attachment": {
    "name": "invoice-data.csv",
    "bytes": 114,
    "mimeType": "text/csv",
    "relationship": "Data"
  },
  "attachments": ["invoice-data.csv"]
}
```

同じ名前の添付が既にあるファイル（例: `publish-demo.pdf` の `publish-demo-data.csv`）では `INVALID_ARGUMENT` になります。
:::

## rotate_pages

**Rotate Pages**

ページを時計回りに回転する(90/180/270 度)。pages 省略時は全ページ。

### 引数

| 引数 | 型 | 必須 | 既定値 | 説明 |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **必須** |  | 対象 PDF の絶対パス。 |
| `rotation` | `90` \| `180` \| `270` | **必須** |  | 時計回りの回転角(度)。90 / 180 / 270。 |
| `pages` | string (minLength 1) | 任意 |  | 対象ページ指定。"1,3-5" 形式(1 始まり)。省略時は全ページ。 |
| `outputPath` | string (minLength 1) | 任意 |  | 保存先ファイルパス（絶対パス）。省略した場合は base64 文字列を返す。 |
| `returnBase64` | boolean | 任意 |  | true の場合、保存に加えて base64 文字列も結果に含める。 |
| `allowBreakingSignatures` | boolean | 任意 |  | 編集対象が電子署名済み(/ByteRange 検知)の場合、既定ではエラーにする。true を指定すると署名が無効化されることを承知の上で編集を続行する。 |

::: warning `outputPath` は必ず渡す
省略すると PDF 全体が base64 で返り、会話が破綻しやすいです。保存先は絶対パスで渡してください。
:::

::: warning 署名済み PDF は既定でエラー
署名を保つ操作ではありません。無効になってもよい場合のみ `allowBreakingSignatures: true` を明示してください。明示が無ければ無効にしません。
:::
