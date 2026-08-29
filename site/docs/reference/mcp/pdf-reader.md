---
description: "Tools reference for pdf-reader-mcp v0.13.0 — parameters, types, defaults and returns of all 19 tools, generated from the server's tools/list."
---

# pdf-reader-mcp — Tools Reference

<!-- GENERATED FILE — do not edit. Source of truth: the server itself. -->

::: info
Auto-generated from the `tools/list` handshake of **v0.13.0** (19 tools, 2026-08-29). Do not edit by hand — regenerate with `node scripts/generate-reference.mjs`.
:::

**This page is the generated reference** — every tool's parameters, types, defaults and returns, transcribed from the server's `tools/list` (the source of truth is the server itself). For the server's responsibilities, boundaries and how to use it, see the [guide page](/mcp/pdf-reader).

## Tools

| Tool | Summary |
|---|---|
| [`get_page_count`](#get-page-count) | Get the total number of pages in a PDF document. |
| [`get_metadata`](#get-metadata) | Extract metadata from a PDF document including title, author, creation date, page count, PDF version, and structural information. |
| [`read_text`](#read-text) | Extract text content from a PDF document with Y-coordinate-based reading order preservation. |
| [`search_text`](#search-text) | Search for text within a PDF document. |
| [`read_images`](#read-images) | Extract embedded images from a PDF document as PNG or JPEG files. |
| [`read_url`](#read-url) | Fetch a PDF from a URL and extract its text content. |
| [`render_page`](#render-page) | Rasterise pages of a PDF to PNG or JPEG images, returned as MCP image content blocks. |
| [`summarize`](#summarize) | Generate a quick overview report of a PDF document. |
| [`inspect_structure`](#inspect-structure) | Examine PDF internal object structure including catalog entries, page tree, and object statistics. |
| [`inspect_tags`](#inspect-tags) | Analyze the Tagged PDF structure tree for accessibility assessment. |
| [`inspect_fonts`](#inspect-fonts) | List all fonts used in a PDF document with their properties. |
| [`inspect_annotations`](#inspect-annotations) | Extract and categorize all annotations in a PDF document. |
| [`inspect_signatures`](#inspect-signatures) | Examine digital signature fields in a PDF document. |
| [`extract_tables`](#extract-tables) | Extract every `<Table>` subtree from a Tagged PDF as a structured row/cell list, optionally rendered as Markdown tables. |
| [`extract_structured_text`](#extract-structured-text) | Extract a tagged PDF's text in logical content order, with each piece labelled by its structure type. |
| [`locate_objects`](#locate-objects) | Report where the given objects sit on the page. |
| [`validate_tagged`](#validate-tagged) | [DEPRECATED — will be removed in the next major version] |
| [`validate_metadata`](#validate-metadata) | [DEPRECATED — will be removed in the next major version] |
| [`compare_structure`](#compare-structure) | Compare the internal structures of two PDF documents and identify differences. |

## get_page_count

**Get PDF Page Count**

Get the total number of pages in a PDF document.

This is a lightweight operation that only reads the PDF header, not the full content.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **yes** |  | Absolute path to a local PDF file (e.g., "/path/to/document.pdf") |

### Returns

Page count as a number.

Examples:
- Quick check before deciding which pages to extract
- Validate a PDF file is readable

## get_metadata

**Get PDF Metadata**

Extract metadata from a PDF document including title, author, creation date, page count, PDF version, and structural information.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **yes** |  | Absolute path to a local PDF file (e.g., "/path/to/document.pdf") |
| `response_format` | `"markdown"` \| `"json"` | no | `"markdown"` | Output format: "markdown" for human-readable, "json" for structured data |

### Returns

Metadata including: title, author, subject, keywords, creator, producer, creation/modification dates, page count, PDF version, linearized/encrypted/tagged/signature flags, file size.

Examples:
- Get document properties for cataloging
- Check if a PDF is tagged (accessibility)
- Verify PDF version compatibility

## read_text

**Read PDF Text**

Extract text content from a PDF document with Y-coordinate-based reading order preservation.

Text is extracted page by page, sorted by vertical position (top to bottom) then horizontal position (left to right), providing natural reading order.

`/ActualText` replacements (ISO 32000-2 §14.9.4) are resolved, on both of the paths that clause defines: the `/ActualText` of a structure element, and the one in a `Span` marked-content property list — the latter occurs in untagged documents too. So a word carried as ActualText (ligature substitutes, hyphenation fixes) reads here the way a person viewing the page sees it, not in its glyph form.

For **tagged** PDFs, `extract_structured_text` is still the better tool when order matters: it returns text in logical content order (ISO 32000-2 §14.8.2.5), which this tool does not — read_text sorts by coordinate. Tables in tagged PDFs are best read with `extract_tables`.

For **untagged** multi-column PDFs (e.g. older 新旧対照表 PDFs that lack a structure tree), pass `split_columns: 2` or `3` to bucket items by X-coordinate left-to-right.

For Japanese form-style PDFs (帳票・様式) where U+3000 fullwidth spaces are used as visual indentation, pass `compact_whitespace: true` to collapse runs of whitespace to a single ASCII space. Cuts 20–40% of token consumption without losing content.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **yes** |  | Absolute path to a local PDF file (e.g., "/path/to/document.pdf") |
| `pages` | string | no |  | Page range to process. Format: "1-5", "3", or "1,3,5-7". Omit for all pages. |
| `response_format` | `"markdown"` \| `"json"` | no | `"markdown"` | Output format: "markdown" for human-readable, "json" for structured data |
| `split_columns` | integer (1–3) | no |  | Number of columns to use when reordering text. 1 (default) = existing Y-sort. 2 or 3 = bucket by X-coordinate left-to-right. Use for untagged 新旧対照表 / two-column PDFs where Y-sort would interleave columns. Tagged PDFs with proper `<Table>` markup should use extract_tables instead. |
| `compact_whitespace` | boolean | no |  | When true, collapse runs of whitespace (incl. fullwidth space U+3000) to a single ASCII space and trim each line. Reduces token consumption on Japanese form-style PDFs. Default: false (no whitespace normalization). |

### Returns

Extracted text organized by page number, preceded by the extractability tally. With `split_columns >= 2`, columns are separated by a blank line so a downstream LLM can tell them apart.

Examples:
- Extract all text: { file_path: "/path/to/doc.pdf" }
- Untagged 新旧対照表: { file_path: "/path/to/older-shinkyu.pdf", split_columns: 2 }
- Japanese form template: { file_path: "/path/to/form.pdf", compact_whitespace: true }

## search_text

**Search PDF Text**

Search for text within a PDF document. Returns matching locations with surrounding context.

Case-insensitive search across all or specified pages. Each match includes the page number, the matched text, and configurable surrounding context.

The search runs over the same text `read_text` returns, so `/ActualText` replacements (ISO 32000-2 §14.9.4) match: a word carried as ActualText (ligature substitutes, hyphenation fixes) is found under the spelling a viewer shows, not under its glyph form. Rarely, a page's marked content cannot be aligned with the extracted text and the replacement is left unresolved; when that happens on a search with no hits, the result carries a `note` naming those pages.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **yes** |  | Absolute path to a local PDF file (e.g., "/path/to/document.pdf") |
| `query` | string (minLength 1) | **yes** |  | Text to search for (case-insensitive) |
| `pages` | string | no |  | Page range to process. Format: "1-5", "3", or "1,3,5-7". Omit for all pages. |
| `context_chars` | integer (0–500) | no | `80` | Number of characters to show before and after each match |
| `max_results` | integer (1–100) | no | `20` | Maximum number of matches to return |
| `response_format` | `"markdown"` \| `"json"` | no | `"markdown"` | Output format: "markdown" for human-readable, "json" for structured data |

### Returns

Search matches with page number, matched text, and surrounding context.

Examples:
- Search entire PDF: { file_path: "/path/to/doc.pdf", query: "digital signature" }
- Search specific pages: { file_path: "/path/to/doc.pdf", query: "error", pages: "1-10" }

## read_images

**Read PDF Images**

Extract embedded images from a PDF document as PNG or JPEG files.

Each image is returned as an MCP image content block, so a vision-capable model can look at it directly. A text block lists the metadata for all of them (page, index, size in the file, size returned, colour space, encoded bytes).

These are the image XObjects the page draws, not a picture of the page. A page whose content is vector drawing, or whose text is what you want to see, is not covered by this tool.

Response size is bounded: at most 4 MB of encoded image data per call. Images beyond the budget are named in the text block with the reason and are not returned — nothing is dropped silently. A 200 dpi A4 scan is ~11.6 MB of pixels on its own, so pass `pages`, `max_width` or `max_height` when working with scans.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **yes** |  | Absolute path to a local PDF file (e.g., "/path/to/document.pdf") |
| `pages` | string | no |  | Page range to process. Format: "1-5", "3", or "1,3,5-7". Omit for all pages. |
| `format` | `"png"` \| `"jpeg"` | no |  | Encoding of the returned images. png (default) is lossless; jpeg is smaller and drops alpha (composited over white). |
| `quality` | integer (1–100) | no |  | JPEG quality 1-100 (default 80). Ignored when format is png. |
| `max_width` | integer (1–10000) | no |  | Downscale images wider than this, averaging over the source pixels. Images are never enlarged. Omit to return each image at its own size. |
| `max_height` | integer (1–10000) | no |  | Downscale images taller than this. Never enlarges. |

### Returns

A text block with the metadata table and any omissions, then one image content block per returned image.

Examples:
- Extract all images: { file_path: "/path/to/doc.pdf" }
- A scanned page, small enough to look at: { file_path: "/path/to/scan.pdf", pages: "1", max_width: 1200, format: "jpeg" }

## read_url

**Read PDF from URL**

Fetch a PDF from a URL and extract its text content. Text is ALL this tool returns — see the scope note below.

Downloads the PDF from the specified URL, then extracts text with Y-coordinate-based reading order. Supports HTTP and HTTPS. Maximum file size: 50MB. Timeout: 30 seconds.

**Scope (#25):** the fetched bytes are discarded after extraction; this tool deliberately does not save them. Every other tool of this server takes a `file_path`, so to use search_text, inspect_structure, extract_tables, render_page or anything else on a URL's PDF, download the file to local disk FIRST (with whatever fetch capability the calling environment has) and pass its path. This keeps every tool of this server read-only with respect to the file system — writing files is not a reader's job. read_url exists for the one-shot case: "what does the document at this URL say?"

Like `read_text`, accepts `split_columns: 2 | 3` for **untagged** multi-column PDFs and `compact_whitespace: true` to collapse U+3000 / ASCII whitespace runs. Tagged PDFs should use `extract_tables` instead.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `url` | string | **yes** |  | URL pointing to a PDF file (HTTP or HTTPS) |
| `pages` | string | no |  | Page range to process. Format: "1-5", "3", or "1,3,5-7". Omit for all pages. |
| `response_format` | `"markdown"` \| `"json"` | no | `"markdown"` | Output format: "markdown" for human-readable, "json" for structured data |
| `split_columns` | integer (1–3) | no |  | Number of columns to use when reordering text. 1 (default) = existing Y-sort. 2 or 3 = bucket by X-coordinate left-to-right. Use for untagged 新旧対照表 / two-column PDFs where Y-sort would interleave columns. Tagged PDFs with proper `<Table>` markup should use extract_tables instead. |
| `compact_whitespace` | boolean | no |  | When true, collapse runs of whitespace (incl. fullwidth space U+3000) to a single ASCII space and trim each line. Reduces token consumption on Japanese form-style PDFs. Default: false (no whitespace normalization). |

### Returns

Extracted text organized by page number, same format as read_text.

Examples:
- Read remote PDF: { url: "https://example.com/document.pdf" }
- Untagged 2-column PDF: { url: "https://...", split_columns: 2 }
- Japanese form: { url: "https://...", compact_whitespace: true }

## render_page

**Render PDF Page**

Rasterise pages of a PDF to PNG or JPEG images, returned as MCP image content blocks.

This is the tool for documents whose text cannot be read as text: pages `read_text` reports as `no_text_layer` or `not_extractable`, vector drawings, forms, handwriting, stamps. It draws the PAGE — everything on it — where `read_images` only extracts the image XObjects a page happens to embed.

Rendering uses PDFium compiled to WebAssembly (optional dependency `@hyzyla/pdfium`). Note this is a different engine from the pdf.js this server reads text with; where their behaviour on a damaged file differs, neither output is evidence about the other. If the dependency is not installed, this tool says so and every other tool works normally.

`pages` is required — rendering is the most expensive operation here, and "all pages" of a large scan should be a decision, not a default. The response carries at most 4 MB of encoded images; pages past the budget are named with the reason, not dropped.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **yes** |  | Absolute path to a local PDF file (e.g., "/path/to/document.pdf") |
| `pages` | string (minLength 1) | **yes** |  | Page range to render. Required: rendering all pages is never implicit. |
| `dpi` | integer (36–600) | no |  | Rasterisation density (default 150). PDF points are 1/72 inch. |
| `max_width` | integer (1–10000) | no |  | Cap on the rendered width in pixels; wins over dpi when smaller. |
| `format` | `"png"` \| `"jpeg"` | no |  | png (default, lossless) or jpeg (smaller — usually right for scans). |
| `quality` | integer (1–100) | no |  | JPEG quality 1-100 (default 80). Ignored for png. |

### Returns

A text block with per-page metadata (point size, pixel size, effective dpi, bytes) and any omissions, then one image content block per rendered page.

Examples:
- A scanned page: { file_path: "/path/to/scan.pdf", pages: "1", format: "jpeg" }
- A diagram at high detail: { file_path: "/path/to/doc.pdf", pages: "3", dpi: 300 }

## summarize

**Summarize PDF**

Generate a quick overview report of a PDF document.

Combines metadata, text presence check, image count, and a text preview from the first page into a single summary. Useful as a first step before deciding which detailed tools to use.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **yes** |  | Absolute path to a local PDF file (e.g., "/path/to/document.pdf") |
| `response_format` | `"markdown"` \| `"json"` | no | `"markdown"` | Output format: "markdown" for human-readable, "json" for structured data |

### Returns

Summary including: page count, PDF version, file size, tagged/encrypted/signature flags, text presence, per-document text extractability, the pages that are not fully extractable, image count, a text preview from page 1, and the `next` suggestions.

Examples:
- Quick overview: { file_path: "/path/to/doc.pdf" }
- Machine-readable: { file_path: "/path/to/doc.pdf", response_format: "json" }

## inspect_structure

**Inspect PDF Structure**

Examine PDF internal object structure including catalog entries, page tree, and object statistics.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **yes** |  | Absolute path to a local PDF file (e.g., "/path/to/document.pdf") |
| `response_format` | `"markdown"` \| `"json"` | no | `"markdown"` | Output format: "markdown" for human-readable, "json" for structured data |

### Returns

Catalog entries (keys and types), page tree info (page count, MediaBox samples), object statistics (total count, stream count, type distribution), and encryption status.

Examples:
- Examine document catalog for structural features
- Count PDF objects and streams
- Check page dimensions across the document

## inspect_tags

**Inspect Tagged PDF Structure**

Analyze the Tagged PDF structure tree for accessibility assessment.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **yes** |  | Absolute path to a local PDF file (e.g., "/path/to/document.pdf") |
| `response_format` | `"markdown"` \| `"json"` | no | `"markdown"` | Output format: "markdown" for human-readable, "json" for structured data |

### Returns

Whether the PDF is tagged, the structure tree hierarchy with roles, max nesting depth, total element count, and role distribution (e.g., Document, P, H1, Table, Figure).

Examples:
- Check if a PDF is tagged for accessibility (PDF/UA)
- Inspect the tag hierarchy and role distribution
- Assess document structure quality

## inspect_fonts

**Inspect PDF Fonts**

List all fonts used in a PDF document with their properties.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **yes** |  | Absolute path to a local PDF file (e.g., "/path/to/document.pdf") |
| `response_format` | `"markdown"` \| `"json"` | no | `"markdown"` | Output format: "markdown" for human-readable, "json" for structured data |

### Returns

Font name, type (TrueType, Type1, CIDFont, etc.), encoding, embedded/subset status, and pages where each font is used.

Examples:
- Check if all fonts are embedded (required for PDF/A, PDF/X)
- Identify font types and encodings
- Find which pages use specific fonts

## inspect_annotations

**Inspect PDF Annotations**

Extract and categorize all annotations in a PDF document.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **yes** |  | Absolute path to a local PDF file (e.g., "/path/to/document.pdf") |
| `pages` | string | no |  | Page range to process. Format: "1-5", "3", or "1,3,5-7". Omit for all pages. |
| `response_format` | `"markdown"` \| `"json"` | no | `"markdown"` | Output format: "markdown" for human-readable, "json" for structured data |

### Returns

Total annotation count, breakdown by subtype (Link, Widget, Highlight, Text, etc.) and by page, flags for links/forms/markup presence, and individual annotation details.

Examples:
- Check for form fields (Widget annotations)
- Find all links in a document
- Inventory markup annotations (highlights, comments)

## inspect_signatures

**Inspect PDF Digital Signatures**

Examine digital signature fields in a PDF document.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **yes** |  | Absolute path to a local PDF file (e.g., "/path/to/document.pdf") |
| `response_format` | `"markdown"` \| `"json"` | no | `"markdown"` | Output format: "markdown" for human-readable, "json" for structured data |

### Returns

Total signature field count, signed/unsigned breakdown, and details for each field (signer name, reason, location, signing time, filter/subFilter).

Note: This tool inspects signature field structure only. Cryptographic signature verification is not performed.

Examples:
- Check if a PDF has been digitally signed
- Inspect signer information and signing dates
- Verify signature field structure

## extract_tables

**Extract Tables (Tagged PDF)**

Extract every `<Table>` subtree from a Tagged PDF as a structured row/cell list,
optionally rendered as Markdown tables.

How it works: walks the document's StructTreeRoot depth-first (the same walker
as `extract_structured_text` / `inspect_tags`) and pulls cell text for each
`<TR>` → `<TH>/<TD>`, then collapses kerning whitespace (e.g. "消 費 税 法" →
"消費税法"). This sidesteps reading-order extraction's failure mode on
multi-column tables (typical of 新旧対照表 PDFs).

A Table that continues across a page break is ONE table (ISO 32000-2 §14.8.2.5
NOTE 2) — `pages` is an array, and a table touching the requested page range is
returned whole. Cell text honours `/ActualText` replacements (§14.9.4).

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **yes** |  | Absolute path to a local PDF file (e.g., "/path/to/document.pdf") |
| `pages` | string | no |  | Page range to process. Format: "1-5", "3", or "1,3,5-7". Omit for all pages. |
| `response_format` | `"markdown"` \| `"json"` | no | `"markdown"` | Output format: "markdown" for human-readable, "json" for structured data |

### Returns

Markdown — `# Extracted Tables` summary block followed by one
`## Table N — Page(s) …` section per table with a GFM table.

JSON — `{ isTagged, tables: [{ pages, index, headerRows, bodyRows, footerRows }],
totalTables, pagesScanned, note? }`. `index` is the table's 1-based position
in logical content order, document-wide.

Limitations:
- Untagged PDFs return an empty result and a `note`.
- colspan/rowspan are not honoured (cells are listed in source order).
- Nested tables are not emitted separately (their text appears in the outer cell).

Examples:
- Pull 新旧対照表 from a kaisei tsutatsu PDF for diffing
- Convert 帳票 (form template) tables into structured data

## extract_structured_text

**Extract Structured Text**

Extract a tagged PDF's text in logical content order, with each piece labelled by its structure type.

This answers "what is the text of the H1?" — which read_text (flat, coordinate order),
inspect_tags (structure, no text) and extract_tables (text, tables only) each cannot.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **yes** |  | Absolute path to a local PDF file (e.g., "/path/to/document.pdf") |
| `pages` | string | no |  | Page range to process. Format: "1-5", "3", or "1,3,5-7". Omit for all pages. An element that touches the range is returned whole, even if it continues outside it. |
| `roles` | string[] | no |  | Structure types to include, e.g. ["H1","H2"] to extract an outline. Omit for all roles. |
| `include_bbox` | boolean | no | `false` | Also report where each element is drawn, as boxes: one rectangle per page in PDF default user space (origin bottom-left, pt, normalised) — the form pdf-writer-mcp add_annotation takes. Each carries a basis: "layout-attribute-bbox" (the /BBox the file declares) or "text-extent" (measured from the element's text; images and vector art contribute nothing). Elements with no rectangle carry boxNote saying why. Off by default: it costs a second pass over every page. |
| `response_format` | `"markdown"` \| `"json"` | no | `"markdown"` | Output format: "markdown" for human-readable, "json" for structured data |

### Returns

isTagged, the document language, and a flat list of elements in logical content order.
Each element has: role, depth (nesting; top level is 0), text, pages, and optionally
alt / label / rows / boxes / boxNote.

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

Report where the given objects sit on the page.

Bridges "which object" to "which coordinates": pdf-verify-mcp's verify_integrity names the objects an incremental update changed, and pdf-writer-mcp's add_annotation wants a page number and a rectangle. The rectangle is returned in PDF user space (origin bottom-left, pt, x1 < x2 and y1 < y2 — ISO 32000-1 §7.9.5 normalised form), which is exactly what add_annotation takes.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **yes** |  | Absolute path to a local PDF file (e.g., "/path/to/document.pdf") |
| `object_numbers` | integer (1–9007199254740991)[] | **yes** |  | Object numbers to locate, e.g. [25, 27]. Typically the objects pdf-verify-mcp's verify_integrity reported as changed. |
| `response_format` | `"markdown"` \| `"json"` | no | `"markdown"` | Output format: "markdown" for human-readable, "json" for structured data |

### Returns

Per object: whether it exists, its /Type and /Subtype, and the places it occupies, each with the basis the coordinates rest on:
- annotation-rect — the object's own /Rect. Exact.
- page-box — the object is a page; the rectangle is its crop/media box.
- page-content-stream — the object draws the page; the rectangle is the WHOLE page, not the part that changed.
- page-resource — a font, image or colour space used by the page. No rectangle exists for it.

Limits (observations, not judgements):
- Narrowing a content stream to the paragraph that moved needs a content-stream walk with graphics state; this tool does not do it and says so rather than inventing a rectangle.
- An object that does not exist (freed by a later revision) is returned with found: false — not as "no coordinates".
- In an encrypted document, coordinates and types are still reliable (numbers and names are not encrypted, ISO 32000-1 §7.6.2) but field names are reported as null instead of mojibake.

Examples:
- Turn verify_integrity's "obj 27 was added after signing" into a page and rectangle
- Find which page a changed form field widget is on before annotating it

## validate_tagged

**Validate Tagged PDF (deprecated)**

::: warning Deprecated
:::

[DEPRECATED — will be removed in the next major version]

Prefer pdf-verify-mcp's `validate_conformance` with `flavour: "pdfua-1"` (or `"pdfua-2"`).
It supersedes this tool rather than merely replacing it: it verifies the actual `/Alt` and
`/ActualText` values of Figure tags (this tool only counts Figures), checks Link `/Contents`,
inspects StructTreeRoot from the catalog directly (this tool synthesises it per page), cites
ISO 14289 clauses, and delegates to veraPDF when available.

Reason: the family boundary is "pass/fail against an ISO standard belongs to pdf-verify-mcp;
reporting observations belongs to pdf-reader-mcp". This tool predates pdf-verify-mcp and was
the exception. Use `inspect_tags` here for structure-tree facts — that tool is NOT deprecated.

This tool remains a quick preflight and still works. Only the checks below are performed;
a pass here does not imply PDF/UA conformance.

Validate PDF/UA tagged structure requirements.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **yes** |  | Absolute path to a local PDF file (e.g., "/path/to/document.pdf") |
| `response_format` | `"markdown"` \| `"json"` | no | `"markdown"` | Output format: "markdown" for human-readable, "json" for structured data |

### Returns

Validation results including: whether the PDF is tagged, total checks performed, pass/fail counts, detailed issues with severity levels (error/warning/info), and a summary.

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

::: warning Deprecated
:::

[DEPRECATED — will be removed in the next major version]

For standards conformance, prefer pdf-verify-mcp's `validate_conformance`
(`flavour: "pdfua-1"` / `"pdfa-*"`), which judges against the ISO text and delegates to
veraPDF when available. Use `get_metadata` here if you just want to read metadata fields.

Reason: the family boundary is "pass/fail against an ISO standard belongs to pdf-verify-mcp;
reporting observations belongs to pdf-reader-mcp". This tool predates pdf-verify-mcp.

Known limitation (not being fixed — superseded): the checks read the document information
dictionary only. PDF/UA-1 §7.1 requires `dc:title` in the XMP metadata stream and states a
conforming reader "shall ignore" the Info dictionary; it also requires
`ViewerPreferences/DisplayDocTitle = true` and `Suspects = false`, none of which are checked
here. ISO 32000-2 §14.3.3 deprecates the Info dictionary except CreationDate/ModDate.
Treat the results below as general best-practice hints, not PDF/UA or PDF/A grounds.

Validate PDF metadata conformance against best practices and specification requirements.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **yes** |  | Absolute path to a local PDF file (e.g., "/path/to/document.pdf") |
| `response_format` | `"markdown"` \| `"json"` | no | `"markdown"` | Output format: "markdown" for human-readable, "json" for structured data |

### Returns

Validation results including: total checks, pass/fail counts, detailed issues with severity, metadata field presence summary, and an overall summary.

Checks performed (all against the Info dictionary — see the limitation above):
- Title presence (best practice; NOT the PDF/UA basis, which is XMP dc:title)
- Author presence
- Creation date format validation
- Modification date presence
- Producer identification
- PDF version detection
- Tagged flag status
- Subject and Keywords presence
- Encryption and accessibility impact

Examples:
- Quick check of document metadata completeness for publishing standards
- (For PDF/A archival or PDF/UA compliance, use pdf-verify-mcp validate_conformance instead)

## compare_structure

**Compare PDF Structures**

Compare the internal structures of two PDF documents and identify differences.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `file_path_1` | string (minLength 1) | **yes** |  | Absolute path to the first PDF file for comparison |
| `file_path_2` | string (minLength 1) | **yes** |  | Absolute path to the second PDF file for comparison |
| `response_format` | `"markdown"` \| `"json"` | no | `"markdown"` | Output format: "markdown" for human-readable, "json" for structured data |

### Returns

Structural comparison including: property-by-property diff (page count, PDF version, encryption, tagged status, object counts, page dimensions, file size, catalog entries, signatures), font comparison (fonts unique to each file and shared fonts), and a summary.

Examples:
- Compare two versions of the same document
- Verify structural consistency across PDF exports
- Identify differences in PDF generation pipelines
