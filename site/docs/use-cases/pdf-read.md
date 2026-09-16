---
description: Large or unreadable PDFs — measure with summarize, narrow with search_text, and read pages without a text layer as images via render_page. Measured on a 21-page specimen and a scan-like specimen
---

# Large or Unreadable PDFs

## Scenario

Pull only the passages about payment terms and acceptance out of a report that runs to dozens of pages.
Nothing is dumped into the context: `summarize` measures the document first, `search_text` finds the hit pages,
and `read_text` reads only those. A scan-like page with no text layer is not reported as "no text" —
it is read from the `render_page` image instead. No OCR is performed. What was read and what could not be read
is declared in a **Read Report**.

Below is a **real measurement from 2026-09-16** (pdf-reader-mcp v0.15.1 / pdf-read Skill v0.2.2; host Grok Build 1.0.30;
specimens: a self-made 21-page report and a scan-like PDF containing only an image XObject).

## Cast

| Actor | Role |
|---|---|
| [pdf-read Skill](/skills/pdf-read) | measure → branch → choose the route → Read Report. Enters `search_text` for passage extraction even when `next` is empty |
| [pdf-reader](/mcp/pdf-reader) | `summarize`, `search_text`, `read_text` (explicit pages), `render_page` |

## Sequence

```mermaid
sequenceDiagram
  actor U as User
  participant S as pdf-read Skill
  participant R as pdf-reader

  U->>S: Extract only the payment-terms and acceptance passages
  S->>R: summarize(json)
  R-->>S: pageCount 21 / textExtractability extracted / next []
  S->>R: search_text(payment terms) / search_text(acceptance)
  R-->>S: hits on page 21 only
  S->>R: read_text(pages: "21")
  R-->>S: one page of text
  S-->>U: excerpt + Read Report (read: 21 / 1–20 not read)

  Note over S,R: page with no text layer
  S->>R: summarize(json)
  R-->>S: textExtractability no_text_layer / next: render_page
  S->>R: render_page(pages: "1", jpeg, 150 dpi)
  R-->>S: page image
  S-->>U: reading from the image + Read Report (route: image; no OCR)
```

## Prompt examples

- "From this report, extract only the passages about payment terms and acceptance. If a page can't be read, say why"
- "It's 500 pages — read only what's needed, don't dump the whole thing"
- "Read this scanned contract. Don't OCR it"

## Measured example — a 21-page report (narrowing route)

`summarize` returned `pageCount: 21`, `isTagged: false`, `isEncrypted: false`, `textExtractability: "extracted"`, `unreadablePages: []`.
`next` was empty (the reader suggests `search_text` only above 50 pages). Skill v0.2.2 enters `search_text` anyway when the request is passage extraction.

| `search_text` query | totalMatches | pages hit |
|---|---|---|
| 支払条件 (payment terms) | 2 | 21 |
| 検収 (acceptance) | 3 | 21 |
| 再委託の禁止 (no subcontracting) | 2 | 21 |

`read_text` was called once, with `pages: "21"`. Pages 1–20 were **not read** — not unreadable, simply not read.

::: details Calls — summarize / search_text / read_text
```jsonc
{ "file_path": "/absolute/path/to/long-report.pdf", "response_format": "json" }
```

```jsonc
{ "pageCount": 21, "isTagged": false, "isEncrypted": false,
  "textExtractability": "extracted", "unreadablePages": [], "next": [] }
```

```jsonc
{ "file_path": "/absolute/path/to/long-report.pdf", "query": "検収", "response_format": "json" }
```

```jsonc
{ "totalMatches": 3, "pages": [21], "truncated": false }
```

```jsonc
{ "file_path": "/absolute/path/to/long-report.pdf", "pages": "21", "compact_whitespace": true }
```
:::

**Read Report** (as declared by the Skill):

- Target: long-report.pdf (21 pages)
- Range read: 21 (search_text hits; 1–20 are filler and were not read) / route: narrowing
- Text extractability: extracted (unreadablePages empty)
- Could not read: none
- Truncation: none (search_text truncated=false)

## Measured example — a page with no text layer (image route)

`summarize` returned `textExtractability: "no_text_layer"`, `hasText: false`, `imageCount: 1`, `textShowingOperators: 0`, `imageOperators: 1`, and listed `render_page` under `next`.
`read_text` returned an empty `text` with `extractability.state: "no_text_layer"`. The empty string is not an extraction failure; it is the declaration that there is no text layer.

`render_page` (pages "1", jpeg, 150 dpi) returned a 136,247-byte image, and the clauses were readable from the pixels. No OCR was run.

::: details Call — render_page
```jsonc
{ "file_path": "/absolute/path/to/scan-no-text-layer.pdf", "pages": "1", "format": "jpeg", "dpi": 150 }
```
`pages` is required. Images come back per page.
:::

**Read Report**:

- Target: scan-no-text-layer.pdf (1 page)
- Range read: 1 / route: image (visual reading of the render_page output)
- Text extractability: **no_text_layer** (read_text's text is empty; this is not reported as "no text")
- Note: no OCR was performed. The reading comes from the page image

## How to read the results

- **Call `summarize` first.** Page count, tagging, encryption and per-page extractability decide the route
- **An empty extraction is not evidence of "no text".** `extractability.state` `no_text_layer` means the text exists only as pixels;
  `not_extractable` means it displays but has a font with no route to Unicode (ISO 32000-2 §9.10.1)
- **"Not read" and "unreadable" are declared separately.** In the 21-page specimen, pages 1–20 were simply not read
- Reading from `render_page` is not OCR. The Read Report says "image route" and never claims OCR
- The reader's `next` suggests `search_text` only above 50 pages. Below that, the Skill enters `search_text` on its own when the request is passage extraction

Evaluation kit and full report: [eval/hosts/grok-build/reports/UC07.md](https://github.com/shuji-bonji/pdf-agent-stack/blob/main/eval/hosts/grok-build/reports/UC07.md) (Japanese)
