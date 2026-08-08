---
description: The MCP that observes what is inside a PDF and where it is (18 tools) — text, tables, tags, fonts, signature fields, bboxes. Observation, never judgment
---

# pdf-reader-mcp

> **The substance layer (fact)** — this server **observes** what is inside a PDF. It never judges whether it is correct. Its output is always *evidence*, never a *verdict*.

- npm: `@shuji-bonji/pdf-reader-mcp` / current v0.11.1
- Works with no environment variables

## What it does not do

- Cryptographic verification (`inspect_signatures` reads signature-field structure only → verdicts belong to pdf-verify)
- Conformance judgment (the `validate_*` tools are deprecated → pdf-verify's `validate_conformance`)
- Incremental-update history (→ pdf-verify's `verify_integrity`), OCR

## What it does — including *where*

Beyond "what is inside", it also reports **where it is drawn on the page**. Rectangles come back in
exactly the form [pdf-writer-mcp](/mcp/pdf-writer)'s `add_annotation` takes (PDF default user space,
origin bottom-left, pt, normalised), so no coordinate system has to be reinterpreted in between.

| Question | Tool |
|---|---|
| "Where is **object 27**?" | [`locate_objects`](#locate-objects) |
| "Where is **this paragraph / this heading**?" | [`extract_structured_text`](#extract-structured-text) with `include_bbox` |

Both attach a **`basis`** to every rectangle: was it measured, is it the file's own claim, or does it
merely point at the whole page — a mechanism for **never returning claims of different strength with the same face**.

## Installation

```jsonc
{
  "mcpServers": {
    "pdf-reader": {
      "command": "npx",
      "args": ["-y", "@shuji-bonji/pdf-reader-mcp@latest"]
    }
  }
}
```

## Common parameters

Almost every tool accepts these (omitted from the per-tool tables).

| Parameter | Type | Description |
|---|---|---|
| `file_path` **required** | string | Absolute path to a local PDF |
| `response_format` | `markdown` / `json` | Output format. Default markdown |
| `pages` | string | Page range `"1-5"` / `"3"` / `"1,3,5-7"`. All pages when omitted (where supported) |

## Tools

| Tier | Tool | One-liner |
|---|---|---|
| 1 | [`read_text`](#read-text) | Reading-order text extraction (resolves /ActualText) |
| 1 | [`read_url`](#read-url) | Read a PDF straight from a URL |
| 1 | [`read_images`](#read-images) | Image extraction (base64) |
| 1 | [`search_text`](#search-text) | Case-insensitive search |
| 1 | [`get_metadata`](#get-metadata) | Metadata |
| 1 | [`get_page_count`](#get-page-count) | Page count (lightweight) |
| 1 | [`summarize`](#summarize) | Overview report |
| 2 | [`extract_structured_text`](#extract-structured-text) | Text in logical content order (tagged PDFs) |
| 2 | [`extract_tables`](#extract-tables) | Structured extraction of `<Table>` subtrees |
| 2 | [`inspect_structure`](#inspect-structure) | Internal object structure |
| 2 | [`inspect_tags`](#inspect-tags) | Observation of the structure tree |
| 2 | [`inspect_fonts`](#inspect-fonts) | Fonts and embedding status |
| 2 | [`inspect_annotations`](#inspect-annotations) | Annotation classification and inventory |
| 2 | [`inspect_signatures`](#inspect-signatures) | **Structural** observation of signature fields |
| 2 | [`locate_objects`](#locate-objects) | Object number → page + rectangle |
| 3 | [`compare_structure`](#compare-structure) | Structural comparison of two PDFs |
| 3 | [`validate_metadata`](#validate-metadata) | **deprecated** |
| 3 | [`validate_tagged`](#validate-tagged) | **deprecated** |

## Per-tool manual — Tier 1

### read_text

Extracts text in Y-coordinate reading order (top→bottom, left→right). `/ActualText` replacements (ISO 32000-2 §14.9.4) are resolved on both paths the clause defines — structure elements and `Span` marked content — so ligature-substituted and hyphenation-fixed words come back spelled the way a viewer shows them.

Choosing a tool:

- **Tagged PDF** where order matters → `extract_structured_text` (logical content order; read_text sorts by coordinates)
- Tables in a tagged PDF → `extract_tables`
- **Untagged multi-column** documents (old-style 新旧対照表 etc.) → `split_columns: 2` / `3` to split columns by X coordinate
- Japanese forms indented with fullwidth spaces → `compact_whitespace: true` (cuts tokens 20–40%)

| Parameter | Type | Description |
|---|---|---|
| `split_columns` | integer | Column count. 1 (default) = Y sort. 2 / 3 = split left→right by X coordinate |
| `compact_whitespace` | boolean | Collapse whitespace runs (incl. U+3000) to one ASCII space. Default false |

### read_url

Fetches a PDF from a URL (HTTP/HTTPS) and extracts its text. Max 50MB, timeout 30 s. `split_columns` / `compact_whitespace` work as in read_text.

| Parameter | Type | Description |
|---|---|---|
| `url` **required** | string | URL of the PDF (in place of `file_path`) |

### read_images

Returns embedded images as base64 with metadata (dimensions, colour space, bit depth). Large images produce huge responses — narrow the range with `pages`.

### search_text

Case-insensitive search returning page number, matched text and surrounding context. Runs over the same text `read_text` returns, so hits use the post-`/ActualText` spelling.

| Parameter | Type | Description |
|---|---|---|
| `query` **required** | string | Search terms (1–500 chars) |
| `context_chars` | integer | Context characters around each hit. Default 80 |
| `max_results` | integer | Maximum hits. Default 20, max 100 |

### get_metadata

Returns title, author, dates, page count, PDF version, flags (linearized / encrypted / tagged / signatures) and file size.

### get_page_count

Returns only the page count — lightweight. Good for scouting before extraction, or checking that a PDF is readable at all.

### summarize

An overview combining metadata, text presence, image count and a page-1 preview. **The right first move before deciding which detailed tool to use.**

## Per-tool manual — Tier 2

### extract_structured_text

Returns a tagged PDF's text in **logical content order** (the depth-first traversal of ISO 32000-2 §14.8.2.5), labelled with structure types (roles). The only tool that can answer "what is the text of the H1?".

- Elements form a flat list with `role` / `depth` / `text` / `pages` (pre-order + depth encodes the tree exactly). Only Table carries `rows`, being two-dimensional
- An element spanning pages stays **one element** (paragraphs are not split)
- `alt` is kept out of `text` (§14.9.3); `Lbl` (list bullets) goes to `label`; Artifacts (page numbers, running heads) are excluded
- **An untagged PDF returns just `isTagged: false` — nothing is guessed from coordinates.** If you need a scaffold, run pdf-writer's `ensure_tagged` first

| Parameter | Type | Description |
|---|---|---|
| `roles` | array\<string\> | Structure types to include, e.g. `["H1","H2"]` for an outline |
| `include_bbox` | boolean | Also return where each element is drawn. Default `false` (it costs a second pass over every page) |

#### include_bbox — answering "where is this paragraph?"

```
extract_structured_text({ file_path: "/doc.pdf", roles: ["P"], include_bbox: true })
→ - **P** (page 1) — Measured paragraph
    - *bbox* p1 `(50.0, 297.5, 161.4, 308.6)` — text-extent
  - **Figure** (page 1)
    - *bbox* p1 `(50.0, 150.0, 110.0, 190.0)` — layout-attribute-bbox
```

- **An element spanning pages gets one rectangle per page.** Collapsing them would put a rectangle on a page where the element does not exist
- `basis` names the kind of claim

| `basis` | What it is |
|---|---|
| `layout-attribute-bbox` | The `/BBox` the file **declares** (ISO 32000-2 Table 379). The producer's self-description, not a measurement. **The only possible basis for content with no text (an image-only Figure, say)** |
| `text-extent` | **Measured** from the element's own text: baseline origin plus the font's ascent/descent — the line box, not glyph outlines. Images and vector art contribute nothing |

- **Declared values are returned as-is, then cross-checked** against the page box (§7.7.3.3) and the element's own text; disagreements are reported in `boxNote`. Files lie without blushing —
  the cover Figure of *Well-Tagged PDF 1.0* declares `/BBox [-32768 -32768 32767 32767]`
  (an int16 sentinel where a rectangle should be)
- **An element with no derivable rectangle never gets a zero-size box** — it carries a `boxNote` explaining why

::: tip Checked against an independent ground truth
The 166 measured rectangles of *Well-Tagged PDF 1.0*'s `Link` structure elements were compared with the
173 `/Rect` values the producer put on the same links as `Link` **annotations**: median IoU **0.972**, zero complete misses.
:::

### extract_tables

Extracts every `<Table>` subtree of a tagged PDF as `<TR>` → `<TH>`/`<TD>` structure and removes kerning whitespace (「消 費 税 法」→「消費税法」). Sidesteps the reading-order failure mode on multi-column tables (typical of 新旧対照表). A table continuing across a page break comes back as one table.

Limits: untagged PDFs return an empty result + note. colspan/rowspan are not expanded. Nested tables appear inside the outer cell's text.

### inspect_structure

Returns catalog entries, the page tree (page count, MediaBox), object statistics (totals, stream count, type distribution) and encryption status.

### inspect_tags

Returns whether the PDF is tagged, the structure-tree hierarchy with roles, maximum nesting depth, element totals and role distribution. For **structural facts** rather than conformance (PDF/UA verdicts belong to pdf-verify).

### inspect_fonts

Returns font names, types (TrueType / Type1 / CIDFont …), encodings, embedded/subset status and the pages each font is used on. The observation behind "are all fonts embedded?" — the precondition of PDF/A and PDF/X.

### inspect_annotations

Classifies annotations by subtype (Link / Widget / Highlight / Text …) and page, with presence flags for links/forms/markup and per-annotation detail.

### inspect_signatures

Returns the signature-field count, signed/unsigned breakdown and each field's details (signer name, reason, location, signing time, filter/subFilter).

::: warning Structural observation only
**No cryptographic verification is performed.** Whether a signature is mathematically valid is pdf-verify's answer (`verify_signatures` / `verify_integrity`).
:::

### locate_objects

Converts object numbers into **pages and rectangles**. [pdf-verify](/mcp/pdf-verify)'s `verify_integrity`
reports *which objects changed after signing*; hand those numbers here and you get rectangles that
[pdf-writer](/mcp/pdf-writer)'s `add_annotation` takes as-is
(PDF coordinate space, origin bottom-left, pt, ISO 32000-1 §7.9.5 normalised).

| Parameter | Type | Description |
|---|---|---|
| `object_numbers` **required** | array\<number\> | Object numbers to locate |

**Every location carries a `basis`. The strengths differ, so they are never collapsed into one rectangle.**

| `basis` | Meaning |
|---|---|
| `annotation-rect` | The object's own `/Rect`. **Exact** |
| `page-box` | The object is a page; its crop / media box |
| `page-content-stream` | The object draws the page. The rectangle is **the whole page**, not the changed part |
| `page-resource` | A font, image or other resource. **No rectangle exists** (`rect: null`) |

- A nonexistent number returns `found: false` (not "coordinates unknown"). Freed numbers arrive here
  from diffs, and mixing the two would read as "exists but position unknown"
- In an encrypted document, coordinates and types are returned but `/T` is `null` (numbers and names
  are unencrypted per §7.6.2; strings stay ciphertext)

::: tip "Where is this paragraph?" takes a different path
For content streams, `locate_objects` can only say "the whole page".
To point at a paragraph or heading, use
[`extract_structured_text`](#extract-structured-text) with `include_bbox`.
:::

## Per-tool manual — Tier 3

### compare_structure

Compares the structure of two PDFs (property-by-property diff of page count, version, encryption, tags, object counts, dimensions, size, catalog and signatures, plus font comparison). For pipeline-consistency checks and version comparison.

| Parameter | Type | Description |
|---|---|---|
| `file_path_1` **required** | string | First PDF |
| `file_path_2` **required** | string | Second PDF |

### validate_metadata <Badge type="danger" text="deprecated" />

To be removed in the next major version. It inspects only the Info dictionary and never sees the XMP `dc:title` etc. that PDF/UA-1 §7.1 requires. For standards verdicts use pdf-verify's `validate_conformance`; to just read metadata, use `get_metadata`.

### validate_tagged <Badge type="danger" text="deprecated" />

To be removed in the next major version. pdf-verify's `validate_conformance` (flavour: `pdfua-1` / `pdfua-2`) supersedes it (verifies actual Figure `/Alt` values, Link `/Contents`, cites ISO 14289 clauses, delegates to veraPDF). For structure-tree **facts**, use `inspect_tags` (which is NOT deprecated).
