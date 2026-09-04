---
description: "Tools reference for pdf-writer-mcp v0.21.0 — parameters, types, defaults and returns of all 20 tools, generated from the server's tools/list."
---

# pdf-writer-mcp — Tools Reference

<!-- GENERATED FILE — do not edit. Parameters and returns: the server. Worked examples: scripts/reference-examples/. -->

::: info
Auto-generated from the `tools/list` handshake of **v0.21.0** (20 tools, 2026-09-04). Do not edit by hand — regenerate with `node scripts/generate-reference.mjs`.
:::

**This page is the generated reference** — every tool's parameters, types, defaults and returns, transcribed from the server's `tools/list` (the source of truth is the server itself). For the server's responsibilities, boundaries and how to use it, see the [guide page](/mcp/pdf-writer).

## Tools

| Tool | Summary |
|---|---|
| [`create_text_pdf`](#create-text-pdf) | Create a PDF from plain text. |
| [`create_markdown_pdf`](#create-markdown-pdf) | Create a PDF from Markdown. |
| [`create_table_pdf`](#create-table-pdf) | Create a ruled table PDF from headers and row data. |
| [`set_metadata`](#set-metadata) | Update an existing PDF's metadata (the Info dictionary). |
| [`merge_pdfs`](#merge-pdfs) | Merge multiple PDFs into one, in the given order. |
| [`split_pdf`](#split-pdf) | Split a PDF into multiple files by page range. |
| [`extract_pages`](#extract-pages) | Create a new PDF containing only the given pages. |
| [`delete_pages`](#delete-pages) | Create a new PDF with the given pages removed. |
| [`reorder_pages`](#reorder-pages) | Reorder pages. |
| [`add_bookmarks`](#add-bookmarks) | Set the bookmarks (outline) of a PDF. |
| [`add_annotation`](#add-annotation) | Add one annotation to a page: sticky note (text), highlight, or rectangle (square). |
| [`stamp_page_numbers`](#stamp-page-numbers) | Stamp a page number on each page. |
| [`add_watermark`](#add-watermark) | Overlay a diagonal watermark across the middle of each page ("社外秘" / "DRAFT" / "COPY", etc.). |
| [`fill_form`](#fill-form) | Fill field values into an existing PDF's interactive form (AcroForm). |
| [`flatten_form`](#flatten-form) | Flatten an existing PDF's interactive form (AcroForm), keeping the filled appearance while removing interactivity. |
| [`tag_form_fields`](#tag-form-fields) | Repair a tagged PDF's form to PDF/UA-1: enclose Widget annotations in Form structure elements (7.18.4-1), set /Tabs S on the affected pages (7.18.3-1), and give fields alternate names /TU (7.18.1-3). |
| [`ensure_tagged`](#ensure-tagged) | Put an existing PDF onto the PDF/UA-1 "vessel". |
| [`ensure_pdfa`](#ensure-pdfa) | Put an existing PDF onto the PDF/A "vessel" (the PDF/A counterpart of ensure_tagged). |
| [`attach_file`](#attach-file) | Embed (attach) a file into a PDF. |
| [`rotate_pages`](#rotate-pages) | Rotate pages clockwise (90/180/270 degrees). |

## create_text_pdf

**Create PDF from Plain Text**

Create a PDF from plain text. Honours line breaks (\n) and treats blank lines as paragraph breaks. Long lines wrap automatically.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `text` | string | **yes** |  | Body text. \n breaks lines; blank lines separate paragraphs. |
| `outputPath` | string (minLength 1) | no |  | Destination file path (absolute). When omitted, a base64 string is returned instead. |
| `returnBase64` | boolean | no |  | When true, include a base64 string in the result in addition to saving. |
| `fontPath` | string (minLength 1) | no |  | Absolute path of the font file to embed (.ttf / .otf). Required for non-Latin text such as Japanese. .ttc (TrueType Collection) is not supported. Can also be set via the PDF_WRITER_FONT environment variable. |
| `fontSize` | number (4–96) | no |  | Body font size (pt). Default 11. Range 4-96. |
| `pageSize` | `"A4"` \| `"A3"` \| `"A5"` \| `"LETTER"` \| `"LEGAL"` | no |  | Page size. Default A4. |
| `margin` | number (0–300) | no |  | Margin on all sides (pt). Default 56 (about 20 mm). Range 0-300. |
| `title` | string | no |  | PDF title. Set in the metadata and also drawn as a heading at the top of the body. |
| `author` | string | no |  | PDF author (metadata). |
| `onMissingGlyph` | `"error"` \| `"replace"` \| `"ignore"` | no |  | What to do with characters the font lacks (e.g. ✔ U+2714, missing from Noto Sans JP). error (default) = fail, listing the missing characters / replace = substitute 〓 with a warning / ignore = render as blanks with a warning. |
| `tagged` | boolean | no |  | Generate as a tagged PDF (PDF/UA-1, ISO 14289). Default false. When true, a structure tree, the PDF/UA declaration, /Lang and DisplayDocTitle are added, making the document readable by screen readers. PDF/UA requires a title, so title becomes required. |
| `lang` | string | no |  | Natural language of the document (BCP 47, e.g. "ja" / "en-US"). When omitted with tagged, it is inferred from the text and the guess is reported in warnings. A wrong language declaration makes screen readers misread — state it explicitly when you know it. |
| `pdfVersion` | `"1.7"` \| `"2.0"` | no |  | PDF version to output. Default "1.7". "2.0" (ISO 32000-2) satisfies not just the version claim but the duties bound to it: a trailer /ID is added (Required per Table 15), and the Info dictionary is trimmed to CreationDate / ModDate with title, author and Producer moved to XMP (§14.3.3). Cannot be combined with tagged: true (the only declaration the writer can produce is PDF/UA-1, built on PDF 1.7). |

::: warning Always pass `outputPath`
Omitting it returns the whole PDF as base64 and will overflow the chat. Pass an absolute destination path.
:::

::: warning `tagged: true` cannot be combined with `pdfVersion: "2.0"`
The only conformance declaration this server can write is PDF/UA-1 (built on PDF 1.7). Putting it on a PDF 2.0 document would make a declaration nobody can measure.
:::

::: tip If it should be tagged, tag it from the start
Building with `tagged: true` beats applying `ensure_tagged` afterwards. PDF/UA requires a title, so `title` becomes required. Set `lang` explicitly when you know it.
:::

::: details Worked example — "Make a short tagged PDF"
- Measured: v0.21.0
- `tagged`: `true`
- `lang`: `"en"`
- `title`: `"Tagged sample"`
- Font: standard Helvetica (no `fontPath`)

**Parameters**

```jsonc
{
  "text": "This is a tagged sample.\n\nSecond paragraph.",
  "title": "Tagged sample",
  "tagged": true,
  "lang": "en",
  "outputPath": "/absolute/path/to/output.pdf"
}
```

**Returned JSON**

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

The standard font is not embedded, so veraPDF will not pass PDF/UA-1 7.21.4.1. For Japanese or tagged delivery, pass `fontPath` (or `PDF_WRITER_FONT`).
:::

## create_markdown_pdf

**Create PDF from Markdown**

Create a PDF from Markdown. Supports headings, paragraphs, bullet/numbered lists, code blocks, quotes, horizontal rules and tables. Inline decoration markers are stripped and the text rendered plain (single font).

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `markdown` | string | **yes** |  | Markdown string. |
| `outputPath` | string (minLength 1) | no |  | Destination file path (absolute). When omitted, a base64 string is returned instead. |
| `returnBase64` | boolean | no |  | When true, include a base64 string in the result in addition to saving. |
| `fontPath` | string (minLength 1) | no |  | Absolute path of the font file to embed (.ttf / .otf). Required for non-Latin text such as Japanese. .ttc (TrueType Collection) is not supported. Can also be set via the PDF_WRITER_FONT environment variable. |
| `fontSize` | number (4–96) | no |  | Body font size (pt). Default 11. Range 4-96. |
| `pageSize` | `"A4"` \| `"A3"` \| `"A5"` \| `"LETTER"` \| `"LEGAL"` | no |  | Page size. Default A4. |
| `margin` | number (0–300) | no |  | Margin on all sides (pt). Default 56 (about 20 mm). Range 0-300. |
| `title` | string | no |  | PDF title. Set in the metadata and also drawn as a heading at the top of the body. |
| `author` | string | no |  | PDF author (metadata). |
| `onMissingGlyph` | `"error"` \| `"replace"` \| `"ignore"` | no |  | What to do with characters the font lacks (e.g. ✔ U+2714, missing from Noto Sans JP). error (default) = fail, listing the missing characters / replace = substitute 〓 with a warning / ignore = render as blanks with a warning. |
| `tagged` | boolean | no |  | Generate as a tagged PDF (PDF/UA-1, ISO 14289). Default false. When true, a structure tree, the PDF/UA declaration, /Lang and DisplayDocTitle are added, making the document readable by screen readers. PDF/UA requires a title, so title becomes required. |
| `lang` | string | no |  | Natural language of the document (BCP 47, e.g. "ja" / "en-US"). When omitted with tagged, it is inferred from the text and the guess is reported in warnings. A wrong language declaration makes screen readers misread — state it explicitly when you know it. |
| `pdfVersion` | `"1.7"` \| `"2.0"` | no |  | PDF version to output. Default "1.7". "2.0" (ISO 32000-2) satisfies not just the version claim but the duties bound to it: a trailer /ID is added (Required per Table 15), and the Info dictionary is trimmed to CreationDate / ModDate with title, author and Producer moved to XMP (§14.3.3). Cannot be combined with tagged: true (the only declaration the writer can produce is PDF/UA-1, built on PDF 1.7). |

::: warning Always pass `outputPath`
Omitting it returns the whole PDF as base64 and will overflow the chat. Pass an absolute destination path.
:::

::: warning `tagged: true` cannot be combined with `pdfVersion: "2.0"`
The only conformance declaration this server can write is PDF/UA-1 (built on PDF 1.7). Putting it on a PDF 2.0 document would make a declaration nobody can measure.
:::

::: tip If it should be tagged, tag it from the start
Building with `tagged: true` beats applying `ensure_tagged` afterwards. PDF/UA requires a title, so `title` becomes required. Set `lang` explicitly when you know it.
:::

The call shape matches [`create_text_pdf`](#create-text-pdf) (`markdown` instead of `text`).

## create_table_pdf

**Create Table PDF**

Create a ruled table PDF from headers and row data. Column widths are computed from the content, cells wrap, and the header row is redrawn after page breaks.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `headers` | string[] | **yes** |  | Header row (column titles). |
| `rows` | string[][] | **yes** |  | Data rows. Each row is an array of strings; the same column count as headers is recommended. |
| `outputPath` | string (minLength 1) | no |  | Destination file path (absolute). When omitted, a base64 string is returned instead. |
| `returnBase64` | boolean | no |  | When true, include a base64 string in the result in addition to saving. |
| `fontPath` | string (minLength 1) | no |  | Absolute path of the font file to embed (.ttf / .otf). Required for non-Latin text such as Japanese. .ttc (TrueType Collection) is not supported. Can also be set via the PDF_WRITER_FONT environment variable. |
| `fontSize` | number (4–96) | no |  | Body font size (pt). Default 11. Range 4-96. |
| `pageSize` | `"A4"` \| `"A3"` \| `"A5"` \| `"LETTER"` \| `"LEGAL"` | no |  | Page size. Default A4. |
| `margin` | number (0–300) | no |  | Margin on all sides (pt). Default 56 (about 20 mm). Range 0-300. |
| `title` | string | no |  | PDF title. Set in the metadata and also drawn as a heading at the top of the body. |
| `author` | string | no |  | PDF author (metadata). |
| `onMissingGlyph` | `"error"` \| `"replace"` \| `"ignore"` | no |  | What to do with characters the font lacks (e.g. ✔ U+2714, missing from Noto Sans JP). error (default) = fail, listing the missing characters / replace = substitute 〓 with a warning / ignore = render as blanks with a warning. |
| `tagged` | boolean | no |  | Generate as a tagged PDF (PDF/UA-1, ISO 14289). Default false. When true, a structure tree, the PDF/UA declaration, /Lang and DisplayDocTitle are added, making the document readable by screen readers. PDF/UA requires a title, so title becomes required. |
| `lang` | string | no |  | Natural language of the document (BCP 47, e.g. "ja" / "en-US"). When omitted with tagged, it is inferred from the text and the guess is reported in warnings. A wrong language declaration makes screen readers misread — state it explicitly when you know it. |
| `pdfVersion` | `"1.7"` \| `"2.0"` | no |  | PDF version to output. Default "1.7". "2.0" (ISO 32000-2) satisfies not just the version claim but the duties bound to it: a trailer /ID is added (Required per Table 15), and the Info dictionary is trimmed to CreationDate / ModDate with title, author and Producer moved to XMP (§14.3.3). Cannot be combined with tagged: true (the only declaration the writer can produce is PDF/UA-1, built on PDF 1.7). |

::: warning Always pass `outputPath`
Omitting it returns the whole PDF as base64 and will overflow the chat. Pass an absolute destination path.
:::

::: warning `tagged: true` cannot be combined with `pdfVersion: "2.0"`
The only conformance declaration this server can write is PDF/UA-1 (built on PDF 1.7). Putting it on a PDF 2.0 document would make a declaration nobody can measure.
:::

::: tip If it should be tagged, tag it from the start
Building with `tagged: true` beats applying `ensure_tagged` afterwards. PDF/UA requires a title, so `title` becomes required. Set `lang` explicitly when you know it.
:::

The call shape matches [`create_text_pdf`](#create-text-pdf) (`headers` and `rows` instead of `text`).

## set_metadata

**Set PDF Metadata**

Update an existing PDF's metadata (the Info dictionary). Only the given fields change; the rest are preserved. At least one of title / author / subject / keywords / creator is required. In documents with XMP (/Metadata), dc:title etc. are synchronized to prevent divergence. For signed PDFs, preserveSignatures: true updates while keeping the signatures intact.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **yes** |  | Absolute path of the PDF to edit. |
| `title` | string | no |  | Title. |
| `author` | string | no |  | Author. |
| `subject` | string | no |  | Subject. |
| `keywords` | string[] | no |  | Array of keywords. |
| `creator` | string | no |  | Creating application name. |
| `preserveSignatures` | boolean | no |  | Edit a signed PDF via an incremental update (appending) without invalidating existing signatures. Default false. The original bytes are untouched, so /ByteRange holds. Changes beyond the certification (DocMDP) permission level are refused. |
| `outputPath` | string (minLength 1) | no |  | Destination file path (absolute). When omitted, a base64 string is returned instead. |
| `returnBase64` | boolean | no |  | When true, include a base64 string in the result in addition to saving. |
| `allowBreakingSignatures` | boolean | no |  | When the target is digitally signed (detected via /ByteRange), the default is an error. Set true to proceed, accepting that the signatures become invalid. |

::: info Documents with XMP also sync dc:title and similar
Only the Info dictionary would otherwise diverge from XMP. At least one of `title` / `author` / `subject` / `keywords` / `creator` is required.
:::

::: warning Always pass `outputPath`
Omitting it returns the whole PDF as base64 and will overflow the chat. Pass an absolute destination path.
:::

::: warning A signed PDF errors by default
To keep signatures, pass `preserveSignatures: true` (incremental update). Set `allowBreakingSignatures: true` only if invalidating them is acceptable. They are not invalidated unless stated.
:::

## merge_pdfs

**Merge PDFs**

Merge multiple PDFs into one, in the given order. Document metadata is carried over from the first file. Pages are copied into a new document, so document-level information (tagged structure, XMP, attachments, AcroForm, bookmarks, etc.) is not carried over. Anything lost is reported in warnings; follow up on the output with attach_file / ensure_tagged / add_bookmarks / set_metadata as needed.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inputPaths` | string (minLength 1)[] | **yes** |  | Absolute paths of the PDFs to merge (in merge order, 2 or more). |
| `outputPath` | string (minLength 1) | no |  | Destination file path (absolute). When omitted, a base64 string is returned instead. |
| `returnBase64` | boolean | no |  | When true, include a base64 string in the result in addition to saving. |
| `allowBreakingSignatures` | boolean | no |  | When the target is digitally signed (detected via /ByteRange), the default is an error. Set true to proceed, accepting that the signatures become invalid. |

::: warning Document-level information is not carried over
Pages are copied into a new document, so tagged structure, XMP, AcroForm, bookmarks and similar are not carried over. What was lost is reported in warnings — follow up on the output with `attach_file` / `ensure_tagged` / `add_bookmarks` / `set_metadata` as needed.
:::

::: warning Always pass `outputPath`
Omitting it returns the whole PDF as base64 and will overflow the chat. Pass an absolute destination path.
:::

::: warning A signed PDF errors by default
This is not a signature-preserving operation. Set `allowBreakingSignatures: true` only if invalidating signatures is acceptable. They are not invalidated unless stated.
:::

::: details Worked example — "Merge these two PDFs into one"
- Measured: v0.21.0
- Specimens: `docs/specimens/publish-demo.pdf` and `docs/specimens/selfmade-base.pdf` (pass absolute paths)

**Parameters**

```jsonc
{
  "inputPaths": [
    "/absolute/path/to/docs/specimens/publish-demo.pdf",
    "/absolute/path/to/docs/specimens/selfmade-base.pdf"
  ],
  "outputPath": "/absolute/path/to/output.pdf"
}
```

**Returned JSON** (warnings abbreviated)

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

pdfaid / pdfuaid in XMP is dropped rather than copied. A file that still claims conformance without a structure tree is worse than one that claims nothing.
:::

## split_pdf

**Split PDF**

Split a PDF into multiple files by page range. Each element of ranges becomes one file, named "`<prefix>`1.pdf", "`<prefix>`2.pdf", and so on. Pages are copied into a new document, so document-level information (tagged structure, XMP, attachments, AcroForm, bookmarks, etc.) is not carried over. Anything lost is reported in warnings; follow up on the output with attach_file / ensure_tagged / add_bookmarks / set_metadata as needed.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **yes** |  | Absolute path of the PDF to split. |
| `ranges` | string (minLength 1)[] | **yes** |  | Array of page ranges. Each element is "1-3" / "5" / "7-" / "-2" (1-based). Example: ["1-3", "4-"]. |
| `outputDir` | string (minLength 1) | **yes** |  | Output directory (absolute path). |
| `prefix` | string (minLength 1) | no |  | Output filename prefix. Default "<input name>-part". |
| `allowBreakingSignatures` | boolean | no |  | When the target is digitally signed (detected via /ByteRange), the default is an error. Set true to proceed, accepting that the signatures become invalid. |

::: warning Document-level information is not carried over
Pages are copied into a new document, so tagged structure, XMP, AcroForm, bookmarks and similar are not carried over. What was lost is reported in warnings — follow up on each output with `attach_file` / `ensure_tagged` / `add_bookmarks` / `set_metadata` as needed.
:::

::: warning A signed PDF errors by default
This is not a signature-preserving operation. Set `allowBreakingSignatures: true` only if invalidating signatures is acceptable. They are not invalidated unless stated.
:::

## extract_pages

**Extract Pages**

Create a new PDF containing only the given pages. The given order is preserved, so extraction doubles as reordering. Pages are copied into a new document, so document-level information (tagged structure, XMP, attachments, AcroForm, bookmarks, etc.) is not carried over. Anything lost is reported in warnings; follow up on the output with attach_file / ensure_tagged / add_bookmarks / set_metadata as needed.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **yes** |  | Absolute path of the target PDF. |
| `pages` | string (minLength 1) | **yes** |  | Pages to extract, "1,3-5,8-" (1-based). The given order becomes the output order. |
| `outputPath` | string (minLength 1) | no |  | Destination file path (absolute). When omitted, a base64 string is returned instead. |
| `returnBase64` | boolean | no |  | When true, include a base64 string in the result in addition to saving. |
| `allowBreakingSignatures` | boolean | no |  | When the target is digitally signed (detected via /ByteRange), the default is an error. Set true to proceed, accepting that the signatures become invalid. |

::: warning Document-level information is not carried over
Pages are copied into a new document, so tagged structure, XMP, AcroForm, bookmarks and similar are not carried over. What was lost is reported in warnings — follow up on the output with `attach_file` / `ensure_tagged` / `add_bookmarks` / `set_metadata` as needed.
:::

::: warning Always pass `outputPath`
Omitting it returns the whole PDF as base64 and will overflow the chat. Pass an absolute destination path.
:::

::: info `pages` is a string
`"1"` / `"1,3-5,8-"` — not an array. The given order becomes the output order.
:::

::: details Worked example — "Extract page 1 only"
- Measured: v0.21.0
- Specimen: `docs/specimens/publish-demo.pdf` (pass an absolute path)
- `pages`: `"1"`

**Parameters**

```jsonc
{
  "inputPath": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "pages": "1",
  "outputPath": "/absolute/path/to/output.pdf"
}
```

**Returned JSON** (warnings abbreviated)

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

Create a new PDF with the given pages removed. Deleting every page is an error. Pages are copied into a new document, so document-level information (tagged structure, XMP, attachments, AcroForm, bookmarks, etc.) is not carried over. Anything lost is reported in warnings; follow up on the output with attach_file / ensure_tagged / add_bookmarks / set_metadata as needed.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **yes** |  | Absolute path of the target PDF. |
| `pages` | string (minLength 1) | **yes** |  | Pages to delete, "1,3-5,8-" (1-based). |
| `outputPath` | string (minLength 1) | no |  | Destination file path (absolute). When omitted, a base64 string is returned instead. |
| `returnBase64` | boolean | no |  | When true, include a base64 string in the result in addition to saving. |
| `allowBreakingSignatures` | boolean | no |  | When the target is digitally signed (detected via /ByteRange), the default is an error. Set true to proceed, accepting that the signatures become invalid. |

::: warning Document-level information is not carried over
Pages are copied into a new document, so tagged structure, XMP, AcroForm, bookmarks and similar are not carried over. What was lost is reported in warnings — follow up on the output with `attach_file` / `ensure_tagged` / `add_bookmarks` / `set_metadata` as needed.
:::

::: warning Always pass `outputPath`
Omitting it returns the whole PDF as base64 and will overflow the chat. Pass an absolute destination path.
:::

::: warning A signed PDF errors by default
This is not a signature-preserving operation. Set `allowBreakingSignatures: true` only if invalidating signatures is acceptable. They are not invalidated unless stated.
:::

## reorder_pages

**Reorder Pages**

Reorder pages. order must list every page exactly once, in the new order. Pages are copied into a new document, so document-level information (tagged structure, XMP, attachments, AcroForm, bookmarks, etc.) is not carried over. Anything lost is reported in warnings; follow up on the output with attach_file / ensure_tagged / add_bookmarks / set_metadata as needed.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **yes** |  | Absolute path of the target PDF. |
| `order` | integer (-9007199254740991–9007199254740991)[] | **yes** |  | New page order (1-based). Example: [5,4,3,2,1] reverses a 5-page document. |
| `outputPath` | string (minLength 1) | no |  | Destination file path (absolute). When omitted, a base64 string is returned instead. |
| `returnBase64` | boolean | no |  | When true, include a base64 string in the result in addition to saving. |
| `allowBreakingSignatures` | boolean | no |  | When the target is digitally signed (detected via /ByteRange), the default is an error. Set true to proceed, accepting that the signatures become invalid. |

::: warning Document-level information is not carried over
Pages are copied into a new document, so tagged structure, XMP, AcroForm, bookmarks and similar are not carried over. What was lost is reported in warnings — follow up on the output with `attach_file` / `ensure_tagged` / `add_bookmarks` / `set_metadata` as needed.
:::

::: warning Always pass `outputPath`
Omitting it returns the whole PDF as base64 and will overflow the chat. Pass an absolute destination path.
:::

::: warning A signed PDF errors by default
This is not a signature-preserving operation. Set `allowBreakingSignatures: true` only if invalidating signatures is acceptable. They are not invalidated unless stated.
:::

## add_bookmarks

**Add Bookmarks (Outline)**

Set the bookmarks (outline) of a PDF. Existing bookmarks are replaced. Nest with children. For signed PDFs, preserveSignatures: true sets them while keeping the signatures intact.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **yes** |  | Absolute path of the target PDF. |
| `bookmarks` | any[] | **yes** |  | Array of bookmarks, each { title, page, open?, children? }. page is 1-based. Nest via children — up to 8 levels and 2000 entries in total. |
| `preserveSignatures` | boolean | no |  | Edit a signed PDF via an incremental update (appending) without invalidating existing signatures. Default false. The original bytes are untouched, so /ByteRange holds. Changes beyond the certification (DocMDP) permission level are refused. |
| `outputPath` | string (minLength 1) | no |  | Destination file path (absolute). When omitted, a base64 string is returned instead. |
| `returnBase64` | boolean | no |  | When true, include a base64 string in the result in addition to saving. |
| `allowBreakingSignatures` | boolean | no |  | When the target is digitally signed (detected via /ByteRange), the default is an error. Set true to proceed, accepting that the signatures become invalid. |

::: warning Existing bookmarks are replaced
This is a replace, not an append.
:::

::: warning Always pass `outputPath`
Omitting it returns the whole PDF as base64 and will overflow the chat. Pass an absolute destination path.
:::

::: warning A signed PDF errors by default
To keep signatures, pass `preserveSignatures: true` (incremental update). Set `allowBreakingSignatures: true` only if invalidating them is acceptable. They are not invalidated unless stated.
:::

## add_annotation

**Add Annotation**

Add one annotation to a page: sticky note (text), highlight, or rectangle (square). Coordinates are in PDF space (origin bottom-left, pt). For signed PDFs, preserveSignatures: true appends an incremental update without invalidating existing signatures (in tagged documents the enclosure in an Annot structure element rides the same update, preserving PDF/UA conformance).

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **yes** |  | Absolute path of the target PDF. |
| `page` | integer (1–9007199254740991) | **yes** |  | Target page (1-based). |
| `type` | `"text"` \| `"highlight"` \| `"square"` | **yes** |  | text = sticky note icon / highlight = highlight / square = rectangle. |
| `rect` | object | **yes** |  | Annotation rectangle in PDF space (origin bottom-left, pt). Must satisfy x1<x2 and y1<y2. |
| `rect.x1` | number | **yes** |  |  |
| `rect.y1` | number | **yes** |  |  |
| `rect.x2` | number | **yes** |  |  |
| `rect.y2` | number | **yes** |  |  |
| `contents` | string | no |  | Annotation body text (CJK fine). |
| `author` | string | no |  | Author name. |
| `alt` | string | no |  | Alt text for assistive technology. In tagged PDFs the annotation is enclosed in an Annot structure element (PDF/UA 7.18.1-1) and this becomes that element's /Alt. Ignored in untagged documents. |
| `color` | string | no |  | #rrggbb. Defaults per type (text=#ffd400 / highlight=#ffff00 / square=#ff0000). |
| `interiorColor` | string | no |  | Fill colour for square (#rrggbb). |
| `icon` | `"Note"` \| `"Comment"` \| `"Key"` \| `"Help"` \| `"NewParagraph"` \| `"Paragraph"` \| `"Insert"` | no |  | Icon for text notes. Default Note. |
| `open` | boolean | no |  | Whether the text note starts open. Default false. |
| `preserveSignatures` | boolean | no |  | Add the annotation to a signed PDF via an incremental update (appending) without invalidating existing signatures. Default false. The original bytes are untouched, so /ByteRange holds. In tagged PDFs the enclosure in an Annot structure element rides the same update, preserving PDF/UA conformance. Under a certification signature (DocMDP), allowed only at P=3. |
| `outputPath` | string (minLength 1) | no |  | Destination file path (absolute). When omitted, a base64 string is returned instead. |
| `returnBase64` | boolean | no |  | When true, include a base64 string in the result in addition to saving. |
| `allowBreakingSignatures` | boolean | no |  | When the target is digitally signed (detected via /ByteRange), the default is an error. Set true to proceed, accepting that the signatures become invalid. |

::: info Coordinates are PDF space
Origin bottom-left, pt. Pass the rectangles pdf-reader-mcp's `locate_objects` / `extract_structured_text` (`include_bbox`) return as-is. In tagged documents the annotation is enclosed in an Annot structure element (PDF/UA 7.18.1-1); alt text for assistive technology goes in `alt`.
:::

::: warning Always pass `outputPath`
Omitting it returns the whole PDF as base64 and will overflow the chat. Pass an absolute destination path.
:::

::: warning A signed PDF errors by default
To keep signatures, pass `preserveSignatures: true` (incremental update; under DocMDP, allowed only at P=3). Set `allowBreakingSignatures: true` only if invalidating them is acceptable. They are not invalidated unless stated.
:::

::: details Worked example — "Put a square annotation on the H1 rectangle"
- Measured: v0.21.0
- Specimen: `docs/specimens/publish-demo.pdf` (pass an absolute path)
- `type`: `"square"`
- `rect`: the H1 bbox pdf-reader-mcp returned — (56, 766.306)–(375.194, 792.37)

**Parameters**

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

**Returned JSON**

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

Stamp a page number on each page. In tagged PDFs the stamp is wrapped as an Artifact, preserving PDF/UA conformance. Formats containing CJK text need fontPath or the PDF_WRITER_FONT environment variable.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **yes** |  | Absolute path of the target PDF. |
| `format` | string (minLength 1) | no |  | Format. {n} = current page, {total} = total pages. Default "{n}". Examples: "- {n} -" / "{n} / {total}" / "Page {n}". Must contain {n}. |
| `position` | `"bottom-left"` \| `"bottom-center"` \| `"bottom-right"` \| `"top-left"` \| `"top-center"` \| `"top-right"` | no |  | Placement. Default bottom-center. Visual position, taking page /Rotate into account. |
| `margin` | number (0–300) | no |  | Margin from the edge (pt). Default 24. Range 0-300. |
| `fontSize` | number (4–96) | no |  | Font size (pt). Default 9. Range 4-96. |
| `color` | string (minLength 1) | no |  | #rrggbb. Default #666666. |
| `fontPath` | string (minLength 1) | no |  | Font to embed (.ttf/.otf). Falls back to the PDF_WRITER_FONT environment variable, then the standard font. Required for formats containing CJK text. |
| `pages` | string (minLength 1) | no |  | Pages to stamp, "1,3-5,8-" (1-based). All when omitted. Use "2-" to skip a cover page. |
| `startAt` | integer (-9007199254740991–9007199254740991) | no |  | First number to stamp. Default 1. Useful to start at 1 after skipping a cover page. |
| `preserveSignatures` | boolean | no |  | Edit a signed PDF via an incremental update (appending) without invalidating existing signatures. Default false. The original bytes are untouched, so /ByteRange holds. Changes beyond the certification (DocMDP) permission level are refused. |
| `outputPath` | string (minLength 1) | no |  | Destination file path (absolute). When omitted, a base64 string is returned instead. |
| `returnBase64` | boolean | no |  | When true, include a base64 string in the result in addition to saving. |
| `allowBreakingSignatures` | boolean | no |  | When the target is digitally signed (detected via /ByteRange), the default is an error. Set true to proceed, accepting that the signatures become invalid. |

::: tip Artifact in tagged PDFs
The stamp is wrapped as an Artifact, preserving PDF/UA conformance. Formats containing CJK text need a font.
:::

::: warning Always pass `outputPath`
Omitting it returns the whole PDF as base64 and will overflow the chat. Pass an absolute destination path.
:::

::: warning A signed PDF errors by default
To keep signatures, pass `preserveSignatures: true` (incremental update). Set `allowBreakingSignatures: true` only if invalidating them is acceptable. They are not invalidated unless stated.
:::

## add_watermark

**Add Watermark**

Overlay a diagonal watermark across the middle of each page ("社外秘" / "DRAFT" / "COPY", etc.). Drawn faintly behind the content by default. In tagged PDFs it is wrapped as an Artifact, preserving PDF/UA conformance. CJK watermarks need fontPath or the PDF_WRITER_FONT environment variable.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **yes** |  | Absolute path of the target PDF. |
| `text` | string (minLength 1) | **yes** |  | Watermark text, e.g. "社外秘" / "DRAFT" / "COPY". |
| `fontSize` | number (4–96) | no |  | Font size (pt). Default 60. Range 4-96. |
| `color` | string (minLength 1) | no |  | #rrggbb. Default #808080 (grey). |
| `opacity` | number (0–1) | no |  | Opacity, 0 (transparent) to 1 (opaque). Default 0.15 — faint enough to keep the content readable. |
| `angle` | number | no |  | Counter-clockwise angle (degrees). Default 45. 0 = horizontal. |
| `behind` | boolean | no |  | Draw behind the content. Default true. false draws over it (to strengthen the tamper-deterrent claim). |
| `fontPath` | string (minLength 1) | no |  | Font to embed (.ttf/.otf). Falls back to the PDF_WRITER_FONT environment variable, then the standard font. Required for CJK watermarks. |
| `pages` | string (minLength 1) | no |  | Target pages, "1,3-5,8-" (1-based). All when omitted. |
| `preserveSignatures` | boolean | no |  | Edit a signed PDF via an incremental update (appending) without invalidating existing signatures. Default false. The original bytes are untouched, so /ByteRange holds. Changes beyond the certification (DocMDP) permission level are refused. |
| `outputPath` | string (minLength 1) | no |  | Destination file path (absolute). When omitted, a base64 string is returned instead. |
| `returnBase64` | boolean | no |  | When true, include a base64 string in the result in addition to saving. |
| `allowBreakingSignatures` | boolean | no |  | When the target is digitally signed (detected via /ByteRange), the default is an error. Set true to proceed, accepting that the signatures become invalid. |

::: tip Artifact in tagged PDFs
The watermark is wrapped as an Artifact, preserving PDF/UA conformance. CJK strings need a font.
:::

::: warning Always pass `outputPath`
Omitting it returns the whole PDF as base64 and will overflow the chat. Pass an absolute destination path.
:::

::: warning A signed PDF errors by default
To keep signatures, pass `preserveSignatures: true` (incremental update). Set `allowBreakingSignatures: true` only if invalidating them is acceptable. They are not invalidated unless stated.
:::

::: details Worked example — "Put a DRAFT watermark on every page"
- Measured: v0.21.0
- Specimen: `docs/specimens/publish-demo.pdf` (pass an absolute path)
- `text`: `"DRAFT"`

**Parameters**

```jsonc
{
  "inputPath": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "text": "DRAFT",
  "outputPath": "/absolute/path/to/output.pdf"
}
```

**Returned JSON**

```jsonc
{
  "pageCount": 1,
  "bytes": 93321,
  "path": "/absolute/path/to/output.pdf",
  "watermarked": 1,
  "artifact": true
}
```

`artifact: true` means the watermark was wrapped as an Artifact on a tagged input.
:::

## fill_form

**Fill Form (AcroForm)**

Fill field values into an existing PDF's interactive form (AcroForm). If you do not know the field names, pass a nonexistent one — the error lists every field name and type. CJK values need fontPath or the PDF_WRITER_FONT environment variable. flatten: true makes the form non-interactive after filling, but on a tagged PDF that breaks PDF/UA conformance and additionally requires allowBreakingTags: true. XFA forms are not supported.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **yes** |  | Absolute path of the target PDF. |
| `fields` | object | **yes** |  | Object of field name → value. Value type matches the field kind: text = string or number / checkbox = boolean / dropdown, optionlist = string or string array / radio = string. Example: {"user.name": "山田 太郎", "agree": true, "plan": "A"} |
| `fontPath` | string (minLength 1) | no |  | Font used to render values (.ttf/.otf). Falls back to the PDF_WRITER_FONT environment variable, then the standard font. Required for CJK values. |
| `flatten` | boolean | no |  | Flatten to non-interactive after filling. Default false. When true, values can no longer be edited. |
| `allowBreakingTags` | boolean | no |  | Allow flattening even on a tagged PDF. Default false. When true, PDF/UA-1 conformance breaks. |
| `outputPath` | string (minLength 1) | no |  | Destination file path (absolute). When omitted, a base64 string is returned instead. |
| `returnBase64` | boolean | no |  | When true, include a base64 string in the result in addition to saving. |
| `allowBreakingSignatures` | boolean | no |  | When the target is digitally signed (detected via /ByteRange), the default is an error. Set true to proceed, accepting that the signatures become invalid. |

::: tip When you do not know the field names
Pass one nonexistent name — the error lists every field name and type. Branch on `code`; do not parse the message text.
:::

::: warning XFA is unsupported
AcroForm only. `flatten: true` on a tagged PDF breaks PDF/UA conformance and additionally requires `allowBreakingTags: true`.
:::

::: warning Always pass `outputPath`
Omitting it returns the whole PDF as base64 and will overflow the chat. Pass an absolute destination path.
:::

::: details Worked example — "Fill the form" (specimen with no AcroForm)
- Measured: v0.21.0
- Specimen: `docs/specimens/publish-demo.pdf` (pass an absolute path; no AcroForm)
- `fields`: `{ "dummy": "x" }`

**Parameters**

```jsonc
{
  "inputPath": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "fields": { "dummy": "x" },
  "outputPath": "/absolute/path/to/output.pdf"
}
```

**Returned JSON** (error)

```jsonc
{
  "error": "\"/absolute/path/to/docs/specimens/publish-demo.pdf\" has no AcroForm fields to fill.",
  "code": "INVALID_ARGUMENT"
}
```

No fields yields this `code`. A wrong name on a file that does have fields lists every name and type in the error body.
:::

## flatten_form

**Flatten Form**

Flatten an existing PDF's interactive form (AcroForm), keeping the filled appearance while removing interactivity. Use it to freeze values before distribution. If existing values contain CJK text, set fontPath or PDF_WRITER_FONT in case appearances must be regenerated. On tagged PDFs, Widget annotations disappear and Form structure elements are left dangling, so it refuses by default (allowBreakingTags: true to force).

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **yes** |  | Absolute path of the target PDF. |
| `fontPath` | string (minLength 1) | no |  | Font for appearance regeneration. Falls back to the PDF_WRITER_FONT environment variable, then the standard font. Not needed when existing appearances can be reused, but required for CJK forms that need regeneration. |
| `allowBreakingTags` | boolean | no |  | Allow flattening even on a tagged PDF. Default false. |
| `outputPath` | string (minLength 1) | no |  | Destination file path (absolute). When omitted, a base64 string is returned instead. |
| `returnBase64` | boolean | no |  | When true, include a base64 string in the result in addition to saving. |
| `allowBreakingSignatures` | boolean | no |  | When the target is digitally signed (detected via /ByteRange), the default is an error. Set true to proceed, accepting that the signatures become invalid. |

::: warning Tagged PDFs are refused by default
Widget annotations disappear and Form structure elements are left dangling. `allowBreakingTags: true` forces it, and the file is no longer PDF/UA-conformant.
:::

::: warning Always pass `outputPath`
Omitting it returns the whole PDF as base64 and will overflow the chat. Pass an absolute destination path.
:::

::: warning A signed PDF errors by default
This is not a signature-preserving operation. Set `allowBreakingSignatures: true` only if invalidating signatures is acceptable. They are not invalidated unless stated.
:::

## tag_form_fields

**Tag Form Fields (PDF/UA repair)**

Repair a tagged PDF's form to PDF/UA-1: enclose Widget annotations in Form structure elements (7.18.4-1), set /Tabs S on the affected pages (7.18.3-1), and give fields alternate names /TU (7.18.1-3). Pass human-readable names for screen readers via labels. Widgets already bound to the structure tree are skipped, so it is safe to run repeatedly. Untagged documents are out of scope (rebuild with the create tools' tagged: true, or run ensure_tagged first). For signed PDFs, preserveSignatures: true repairs while keeping the signatures intact (approval signatures only; certification signatures are refused).

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **yes** |  | Absolute path of the target PDF. |
| `labels` | object | no |  | Field name → human-readable alternate name (/TU) — what a screen reader speaks. Example: {"user.name": "氏名", "agree": "利用規約に同意する"}. Omitted fields fall back to the field name as /TU, reported in warnings. A nonexistent field name errors, listing every field name. |
| `preserveSignatures` | boolean | no |  | Edit a signed PDF via an incremental update (appending) without invalidating existing signatures. Default false. The original bytes are untouched, so /ByteRange holds. Changes beyond the certification (DocMDP) permission level are refused. |
| `outputPath` | string (minLength 1) | no |  | Destination file path (absolute). When omitted, a base64 string is returned instead. |
| `returnBase64` | boolean | no |  | When true, include a base64 string in the result in addition to saving. |
| `allowBreakingSignatures` | boolean | no |  | When the target is digitally signed (detected via /ByteRange), the default is an error. Set true to proceed, accepting that the signatures become invalid. |

::: info Untagged documents are out of scope
This repairs a tagged PDF's form to PDF/UA-1 (Widgets enclosed in Form, `/Tabs S`, `/TU`). It is idempotent. For an untagged file, run `ensure_tagged` first or build with `tagged: true`.
:::

::: warning Always pass `outputPath`
Omitting it returns the whole PDF as base64 and will overflow the chat. Pass an absolute destination path.
:::

::: warning A signed PDF errors by default
To keep signatures, pass `preserveSignatures: true` (approval signatures only; certification signatures are refused). Set `allowBreakingSignatures: true` only if invalidating them is acceptable. They are not invalidated unless stated.
:::

## ensure_tagged

**Ensure Tagged (PDF/UA scaffold & repair)**

Put an existing PDF onto the PDF/UA-1 "vessel". If it is already tagged, the structure tree is untouched and only missing document-level requirements are supplied (MarkInfo / Lang / DisplayDocTitle / XMP pdfuaid:part and dc:title). For untagged documents, a minimal structure tree (each page = one P element) is created so the content becomes reachable by assistive technology. **IMPORTANT**: machines cannot infer meaning — headings, tables, lists, reading order and figure alt text are NOT created. The new tree is a scaffold, not an accessible document; it needs human review. If you can build the structure right from the start, use the create tools' tagged: true. For signed PDFs, preserveSignatures: true (approval signatures only; certification signatures are refused).

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **yes** |  | Absolute path of the target PDF. |
| `title` | string (minLength 1) | no |  | Document title (required by PDF/UA-1 7.1). Falls back to the existing Info Title. |
| `lang` | string | no |  | Natural language of the document (BCP 47, e.g. "ja"). Required by PDF/UA-1 7.2. |
| `preserveSignatures` | boolean | no |  | Edit a signed PDF via an incremental update (appending) without invalidating existing signatures. Default false. The original bytes are untouched, so /ByteRange holds. Changes beyond the certification (DocMDP) permission level are refused. |
| `outputPath` | string (minLength 1) | no |  | Destination file path (absolute). When omitted, a base64 string is returned instead. |
| `returnBase64` | boolean | no |  | When true, include a base64 string in the result in addition to saving. |
| `allowBreakingSignatures` | boolean | no |  | When the target is digitally signed (detected via /ByteRange), the default is an error. Set true to proceed, accepting that the signatures become invalid. |

::: danger This writes a declaration, not proof of conformance
It writes pdfuaid into XMP. Applied to a non-conforming document it produces a PDF claiming conformance it does not have. After writing, always measure with pdf-verify-mcp `validate_conformance` (`flavour: "pdfua-1"`). If you cannot measure it, do not write the declaration.
:::

::: warning Machines cannot infer meaning
The new tree is a scaffold (each page = one P element). Headings, tables, lists, reading order and figure alt text are not created. If you can build with `tagged: true` from the start, do that.
:::

::: warning Always pass `outputPath`
Omitting it returns the whole PDF as base64 and will overflow the chat. Pass an absolute destination path.
:::

::: details Worked example — "Put an existing PDF onto the PDF/UA-1 vessel"
- Measured: v0.21.0
- Specimen: `docs/specimens/selfmade-base.pdf` (pass an absolute path; already tagged)
- `title`: `"Selfmade base"`
- `lang`: `"en"`

**Parameters**

```jsonc
{
  "inputPath": "/absolute/path/to/docs/specimens/selfmade-base.pdf",
  "title": "Selfmade base",
  "lang": "en",
  "outputPath": "/absolute/path/to/output.pdf"
}
```

**Returned JSON**

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
  ]
}
```

Already tagged, so the structure tree was left untouched and only missing document-level requirements were supplied. After writing the declaration, measure with `validate_conformance` (`flavour: "pdfua-1"`).
:::

## ensure_pdfa

**Ensure PDF/A (archival conformance scaffold)**

Put an existing PDF onto the PDF/A "vessel" (the PDF/A counterpart of `ensure_tagged`). Supplies only missing document-level requirements:

- trailer `/ID` (ISO 32000-1 14.4)
- sRGB OutputIntent (GTS_PDFA1; an ICC profile is generated and embedded)
- XMP pdfaid
- **-4 flavours additionally** set the header to PDF 2.0 and delete the Info dictionary (−4 forbids Info unless the catalog has `/PieceInfo` — stricter than ISO 32000-2 §14.3.3)

Content, structure tree and fonts are never touched.

| `flavour` | What it claims |
| --- | --- |
| `pdfa-3b` | Default. PDF 1.7 basis |
| `pdfa-4` | PDF 2.0. Every attachment must itself be PDF/A |
| `pdfa-4f` | PDF 2.0 with non-PDF/A attachments (CSV / JSON) |

This is preparation for claiming PDF/A, not a guarantee of conformance. Unembedded fonts, encryption, JavaScript and LZW are not repaired. Writing pdfaid is the document claiming "I am PDF/A"; applied to a non-conforming file it produces a PDF that lies about itself (a warning is always returned). Measure with pdf-verify-mcp `validate_conformance` (same flavour). The verdict is veraPDF's.

- Apply **after** `attach_file` in the e-bookkeeping-law context
- Signed PDFs: `preserveSignatures: true` (approval signatures only; certification refused)
- `-4` × `preserveSignatures` is refused unless the input is already PDF 2.0

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **yes** |  | Absolute path of the target PDF. |
| `flavour` | `"pdfa-3b"` \| `"pdfa-4"` \| `"pdfa-4f"` | no |  | The PDF/A to claim. Default `"pdfa-3b"`. See the flavour table above. |
| `preserveSignatures` | boolean | no |  | Edit a signed PDF via an incremental update (appending) without invalidating existing signatures. Default false. The original bytes are untouched, so /ByteRange holds. Changes beyond the certification (DocMDP) permission level are refused. |
| `outputPath` | string (minLength 1) | no |  | Destination file path (absolute). When omitted, a base64 string is returned instead. |
| `returnBase64` | boolean | no |  | When true, include a base64 string in the result in addition to saving. |
| `allowBreakingSignatures` | boolean | no |  | When the target is digitally signed (detected via /ByteRange), the default is an error. Set true to proceed, accepting that the signatures become invalid. |

::: danger This writes a declaration, not proof of conformance
It writes pdfaid into XMP. Unembedded fonts, encryption and JavaScript are not repaired. Applied to a non-conforming document it produces a PDF claiming conformance it does not have. After writing, always measure with pdf-verify-mcp `validate_conformance`, passing the same flavour string. If you cannot measure it, do not write the declaration. A PDF/A result stops at "veraPDF judged it COMPLIANT".
:::

::: warning With attachments, use `"pdfa-4f"`
Plain `"pdfa-4"` requires every attachment to be PDF/A itself (`6.9-3`). Bundling CSV or JSON means `"pdfa-4f"`. The PDF/A-4 flavours set the header to PDF 2.0 and delete the Info dictionary. Combining with `preserveSignatures` is refused unless the input is already PDF 2.0.
:::

::: warning Always pass `outputPath`
Omitting it returns the whole PDF as base64 and will overflow the chat. Pass an absolute destination path.
:::

::: details Worked example — "Put it onto the PDF/A-3b vessel"
- Measured: v0.21.0
- Specimen: `docs/specimens/publish-demo.pdf` (pass an absolute path; already declares PDF/A-3b)
- `flavour`: `"pdfa-3b"`

**Parameters**

```jsonc
{
  "inputPath": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "flavour": "pdfa-3b",
  "outputPath": "/absolute/path/to/output.pdf"
}
```

**Returned JSON** (warnings abbreviated)

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

That warning is by design, not an anomaly — do not discard it. The verdict is veraPDF's `validate_conformance`.
:::

## attach_file

**Attach File (Embedded File)**

Embed (attach) a file into a PDF. Registers it under /Names /EmbeddedFiles and the catalog /AF, with an AFRelationship. For PDF/A-3 (ISO 19005-3) and Japanese e-bookkeeping-law (電子帳簿保存法) workflows that bundle "a human-readable invoice PDF + machine-readable data (CSV/XML)" into one file.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **yes** |  | Absolute path of the target PDF. |
| `attachmentPath` | string (minLength 1) | **yes** |  | Absolute path of the file to embed. |
| `name` | string (minLength 1) | no |  | Display name inside the PDF. Defaults to the original filename. Must not duplicate an existing attachment. |
| `description` | string (minLength 1) | no |  | Description of the attachment (/Desc; CJK fine). |
| `mimeType` | string (minLength 1) | no |  | MIME type. Inferred from the extension when omitted (e.g. .csv → text/csv). |
| `relationship` | `"Source"` \| `"Data"` \| `"Alternative"` \| `"Supplement"` \| `"Unspecified"` | no |  | Relation to the document content (PDF/A-3 §6.8). Data = machine-readable data with the same content as the document (invoice XML/CSV etc.) / Source = the source data of the document / Alternative = an alternative representation / Supplement = supplementary material / Unspecified = unknown (default). PDF/A-3 requires a meaningful value, so omission warns. |
| `preserveSignatures` | boolean | no |  | Edit a signed PDF via an incremental update (appending) without invalidating existing signatures. Default false. The original bytes are untouched, so /ByteRange holds. Changes beyond the certification (DocMDP) permission level are refused. |
| `outputPath` | string (minLength 1) | no |  | Destination file path (absolute). When omitted, a base64 string is returned instead. |
| `returnBase64` | boolean | no |  | When true, include a base64 string in the result in addition to saving. |
| `allowBreakingSignatures` | boolean | no |  | When the target is digitally signed (detected via /ByteRange), the default is an error. Set true to proceed, accepting that the signatures become invalid. |

::: warning PDF/A-3 requires a meaningful `relationship`
Pass `Source` / `Data` / `Alternative` / `Supplement`. Omitting it warns and the value is `Unspecified` (ISO 19005-3 §6.8).
:::

::: warning With attachments, PDF/A-4 must be `"pdfa-4f"`
Plain `"pdfa-4"` requires every attachment to be PDF/A itself. Bundling CSV or JSON means `ensure_pdfa` flavour `"pdfa-4f"`. In the e-bookkeeping-law pattern, apply `ensure_pdfa` **after** the attachment.
:::

::: warning Always pass `outputPath`
Omitting it returns the whole PDF as base64 and will overflow the chat. Pass an absolute destination path.
:::

::: details Worked example — "Embed a CSV as Data"
- Measured: v0.21.0
- Specimen: `docs/specimens/selfmade-base.pdf` (pass an absolute path)
- Attachment: `docs/specimens/publish-demo-data.csv`
- `name`: `"invoice-data.csv"` (a duplicate name is `INVALID_ARGUMENT`)
- `relationship`: `"Data"`

**Parameters**

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

**Returned JSON**

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

A file that already has that name (e.g. `publish-demo.pdf` with `publish-demo-data.csv`) returns `INVALID_ARGUMENT`.
:::

## rotate_pages

**Rotate Pages**

Rotate pages clockwise (90/180/270 degrees). All pages when pages is omitted.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `inputPath` | string (minLength 1) | **yes** |  | Absolute path of the target PDF. |
| `rotation` | `90` \| `180` \| `270` | **yes** |  | Clockwise rotation (degrees): 90 / 180 / 270. |
| `pages` | string (minLength 1) | no |  | Target pages, "1,3-5" (1-based). All pages when omitted. |
| `outputPath` | string (minLength 1) | no |  | Destination file path (absolute). When omitted, a base64 string is returned instead. |
| `returnBase64` | boolean | no |  | When true, include a base64 string in the result in addition to saving. |
| `allowBreakingSignatures` | boolean | no |  | When the target is digitally signed (detected via /ByteRange), the default is an error. Set true to proceed, accepting that the signatures become invalid. |

::: warning Always pass `outputPath`
Omitting it returns the whole PDF as base64 and will overflow the chat. Pass an absolute destination path.
:::

::: warning A signed PDF errors by default
This is not a signature-preserving operation. Set `allowBreakingSignatures: true` only if invalidating signatures is acceptable. They are not invalidated unless stated.
:::
