---
description: "The ten things the PDF Association's \"FAQ: AI and PDF\" asks of an AI that ingests PDFs, and which PDF Agent Stack tool answers each"
---

# What an AI drops when it reads a PDF

In 2026 the PDF Association published "[FAQ: AI and PDF](https://pdfa.org/faq-ai-and-pdf/)" — 29 questions on what an AI system must not lose when it ingests a PDF. It overlaps almost entirely with the reason PDF Agent Stack reads structure through MCP instead of converting a PDF to Markdown and handing that to an LLM. This page condenses what the FAQ asks of AI developers into ten items and names the tool that answers each.

::: info Source
PDF Association, "FAQ: AI and PDF", <https://pdfa.org/faq-ai-and-pdf/> (retrieved 2026-10-12). The page carries no author or publication date. The "What the FAQ says" column below paraphrases the original; it is not a quotation.
:::

## Three common steps the FAQ argues against

| Common step | What the FAQ says | What is lost |
|---|---|---|
| Convert the PDF to Markdown / HTML / plain text first | Conversion is not recommended | Merged table cells, layers, digital signatures, the meaning of superscripts; a source of hallucinations |
| Process page by page | Do not isolate pages — but keep page references for attribution | Paragraphs, tables and footnotes that cross a page break |
| OCR everything | For born-digital files, extracted text is more accurate | `ActualText`, Unicode for ligatures, text inside annotations; OCR sees only what is drawn |

PDF Agent Stack does none of the three. pdf-reader-mcp never converts the file; with `response_format: "json"` it returns structure (tag roles, coordinates) intact. The [pdf-read](/skills/pdf-read) Skill, when it does read a page range, widens it by one page on each side and declares in its Read Report where the range was cut at a page boundary. There is no OCR; pages that cannot be read as text go through `render_page` to a vision model, and the report says so.

## Ten requirements, and the tool that answers each

| # | What the FAQ says | How PDF Agent Stack answers |
|---|---|---|
| 1 | Ingest **everything**: page content, text, images, bookmarks, layer names, XMP metadata, annotations, embedded files | pdf-reader-mcp `read_text` / `read_images` / `inspect_annotations` / `inspect_signatures`, and from v0.16.0 [`inspect_catalog`](/reference/mcp/pdf-reader#inspect-catalog), which lists bookmarks (`/Outlines`), layers (`/OCProperties`), attachments (`/EmbeddedFiles`) and the XMP packet itself |
| 2 | Use the Tagged PDF structure (reading order, tables, alt text, language) before falling back to inference | `extract_structured_text` / `extract_tables` / `inspect_tags`; the pdf-read Skill always takes the structure route first on a tagged document |
| 3 | Treat a PDF/UA declaration in XMP as the cue to trust the structure tree | `summarize` reads `declaredConformance.pdfuaid` and, when declared, suggests the structure route first. Whether the claim holds is pdf-verify-mcp `validate_conformance` |
| 4 | Read rights-expression metadata such as W3C TDMRep and respect the author's statement | `inspect_catalog` and `summarize` return `tdm:reservation` / `tdm:policy` as written; the decision to honour it stays with the caller |
| 5 | Extract text from born-digital files; OCR is the last resort | `read_text` reports each page as `extracted` / `no_text_layer` / `not_extractable` / `not_observed`; an empty result is never read as "no text" |
| 6 | Do not convert to Markdown or HTML first | There is no conversion path; every tool returns structure-preserving JSON |
| 7 | Do not process page by page; keep page references for attribution | `extract_tables` returns a page-spanning table as one table; the pdf-read Skill's narrowing route reads one page on each side of a hit |
| 8 | Treat annotations by their semantics; a leftover redaction annotation means the redaction was never applied | `inspect_annotations` counts by subtype; pdf-verify-mcp v0.30.0 `evaluate_policy` fires `POL-CAUTION-REDACT-PENDING` on a leftover `/Redact` annotation, and [pdf-trust](/skills/pdf-trust) writes the recommended action |
| 9 | Recover what can be recovered from a damaged PDF; different systems recover differently | `@normativepdf/recover` rebuilds the cross-reference table when it must, and every verdict then starts with `scope.reconstructed: true` |
| 10 | Guard against malicious PDFs (malware, phishing, AI poisoning); signature validation helps | pdf-verify-mcp `verify_signatures` / `verify_integrity`, and from v0.30.0 `evaluate_policy` counts JavaScript, Launch, remote go-to and SubmitForm actions the way ISO 32000-2 §12.8.7 does, in `facts.content`, firing `POL-CAUTION-ACTIVE-CONTENT` |

## Observation and judgment are kept apart

Answering the FAQ, PDF Agent Stack keeps "what is there" and "is that acceptable" on different servers.

- pdf-reader-mcp reports that the XMP packet says `pdfuaid:part = 1` **as a declaration**. It does not say the file conforms to PDF/UA.
- pdf-verify-mcp **judges** that a leftover redaction annotation means the marked content is still in the file, and returns `use_with_caution`. It does not extract that content.
- Neither writes "absent" for something it could not read. Each `inspect_catalog` entry distinguishes `absent` (no such key) from `unreadable` (the key is there, its value out of reach); when `evaluate_policy` cannot take its content inventory it says "not counted", never 0.

The reasoning behind this split is in [Architecture & Responsibilities](/guide/architecture).

## Not yet answered

- The FAQ's point that different processors recover a damaged file differently is not measured (no differential comparison against other implementations).
- Of ISO 32000-2 §12.8.7 Table 264, AlternateImages, ExternalStreams, TrueTypeFonts, ExternalRefXobjects, ExternalOPIdicts, NonEmbeddedFonts and DevDepGS_* are not counted.
- Scripts are not read. The tools can say that a script is present and how many bytes it is, not what it does.

## Related pages

- [Architecture & Responsibilities](/guide/architecture) — why observation, judgment, creation and norms are kept apart
- [pdf-read](/skills/pdf-read) — choosing a reading route and the Read Report
- [pdf-trust](/skills/pdf-trust) — incoming audit and the Trust Report
- [How to Read ISO Specs](/reference/iso-reading-primer)
