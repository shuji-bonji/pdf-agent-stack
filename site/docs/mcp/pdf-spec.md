---
description: The structured reference MCP for the ISO 32000 family — clauses, requirements (shall/should/may), definitions, tables, version comparison. Never opens a file, never judges
---

# pdf-spec-mcp

> **The canon layer (norm)** — a reference server that looks up the *text* of the specification. Not a rule engine. **It never opens a PDF file and never judges conformance** (verdicts belong to pdf-verify).

- npm: `@shuji-bonji/pdf-spec-mcp` / current v0.4.5
- This page is the **guide** — responsibilities and boundaries. For every tool's parameters and returns, see the [tools reference](/reference/mcp/pdf-spec) (generated from `tools/list`)
- Cross-searches and structurally retrieves **17 documents**: ISO 32000-1/-2, ISO TS 32001–32005, PDF/UA-1/-2, the Tagged PDF guide, and more

## What it does not do

- File inspection, conformance verdicts, business-rule definitions
- ISO 19005 (PDF/A) and ETSI PAdES are outside the corpus (see `list_specs` → `coverage.gaps`). **Zero search hits ≠ no such requirement exists**

## Installation

```jsonc
{
  "mcpServers": {
    "pdf-spec": {
      "command": "npx",
      "args": ["-y", "@shuji-bonji/pdf-spec-mcp@latest"],
      "env": { "PDF_SPEC_DIR": "/path/to/pdf-specs" }
    }
  }
}
```

Place the PDF Association's sponsored-edition specification PDFs in `PDF_SPEC_DIR` (required). Files are recognized by name pattern.

## Common parameter

Most tools take `spec` (a Spec ID, e.g. `"iso32000-2"` / `"pdf17"`; defaults to ISO 32000-2). Get the list of IDs from `list_specs`.

## Reading the output — three kinds of "returns"

The server's output falls into three kinds: **clauses**, **requirements**, and **definitions**. All of them are structured renderings of *what the standard says* — none of them say anything about your file.

::: tip Background: ISO drafting conventions
NOTEs are not normative, only shall is a condition of conformance, definitions override everyday language — without these conventions the output is easy to misread. Read [How to Read ISO Specs](/reference/iso-reading-primer) first.
:::

### Clauses (`get_section` output)

Returns the body of a section as a **sequence of elements**, not as the original layout.

```jsonc
{
  "sectionNumber": "14.9.4",
  "title": "Replacement text",
  "pageRange": { "start": 812, "end": 814 },
  "content": [
    { "type": "heading",   "level": 4, "text": "…" },
    { "type": "paragraph", "text": "…" },
    { "type": "list",      "items": ["…"] },
    { "type": "table",     "headers": ["Key", "Type", "Value"], "rows": [["…"]] },
    { "type": "note",      "label": "NOTE 2", "text": "…" },   // NOTE/EXAMPLE are kept apart from body text
    { "type": "code",      "text": "…" }
  ]
}
```

How to read it: `content` is in document order. **NOTE / EXAMPLE come back as `note` elements, separate from `paragraph` (body text)** — in ISO drafting a NOTE is informative, not a normative requirement, so this distinction matters whenever you cite something as grounds. Tables come back structured as `table` elements, which keeps an LLM from misreading the correspondence of key, type and meaning.

### Requirements (`get_requirements` output)

Extracts only the normative sentences containing **shall / shall not / should / should not / may**, one sentence = one requirement.

```jsonc
{
  "filter": { "section": "14.9.4", "level": "shall" },
  "totalRequirements": 12,
  "statistics": { "shall": 8, "should": 3, "may": 1 },   // counts per level
  "requirements": [
    {
      "id": "iso32000-2-14.9.4-003",       // stable ID for citation and tracking
      "level": "shall",                     // the 5 levels per ISO/IEC Directives Part 2
      "text": "…shall be used only for…",  // verbatim (never altered — quotable)
      "section": "14.9.4",
      "sectionTitle": "Replacement text",
      "source": "table",                    // present only for table-derived requirements
      "table": "Table 182 — Entries in …", // the context for table-derived ones
      "key": "Subtype"
    }
  ]
}
```

How to read it: the 5 levels are requirement (shall), prohibition (shall not), recommendation (should), discouragement (should not) and permission (may) — **only shall is a condition of conformance**. `text` is verbatim and can be quoted as-is. A requirement with `source: "table"` was lifted from a table cell and is meaningless on its own, so `table` / `key` (which table, which entry it binds) come attached — quote that context along with it.

::: warning Requirement ≠ verdict
A requirement is what the standard demands; whether a particular PDF satisfies it is a different question. File inspection belongs to pdf-verify. Extraction is also limited to the corpus (ISO 32000-2 etc.) — PDF/A requirements not appearing here does not mean they do not exist.
:::

### Definitions (`get_definitions` output)

Returns term definitions from Section 3 (Terms and definitions).

```jsonc
{
  "totalDefinitions": 1,
  "searchTerm": "tagged PDF",
  "definitions": [
    {
      "term": "tagged PDF",
      "definition": "…",              // definition text (verbatim)
      "section": "3.66",              // section number, for citation
      "notes": ["Note 1 to entry: …"], // notes attached to the definition (if any)
      "source": "ISO 32000-2"          // source document
    }
  ]
}
```

How to read it: an ISO definition is **a normative sentence that fixes what the term means inside that standard**. The further a term drifts from everyday usage (conforming reader / interactive form / artifact), the more it pays to settle it here before arguing. `notes` are supplements (Note to entry), kept separate from the definition text.

## Tools

| Tool | One-liner |
|---|---|
| [`list_specs`](#list-specs) | List of discovered specs and coverage (including gaps) |
| [`get_structure`](#get-structure) | Table of contents |
| [`get_section`](#get-section) | Section body by clause number |
| [`search_spec`](#search-spec) | Keyword search across a spec |
| [`get_requirements`](#get-requirements) | Extraction of shall / should / may requirements |
| [`get_definitions`](#get-definitions) | Term definitions |
| [`get_tables`](#get-tables) | Structured tables from the standard |
| [`compare_versions`](#compare-versions) | PDF 1.7 ↔ 2.0 clause comparison |

## Per-tool manual

### list_specs

Lists the available specification documents: document IDs, titles, page counts and categories, plus **`coverage.gaps` — the normative areas this corpus does NOT contain (PDF/A, PAdES)**. Read the gaps before concluding that a requirement does not exist. Use the returned IDs as the `spec` parameter of the other tools.

| Parameter | Type | Description |
|---|---|---|
| `category` | string | Filter by category (standard / ts / pdfua / guide / appnote) |

### get_structure

Returns the spec's table of contents (section numbers, titles, page numbers) as a hierarchy.

| Parameter | Type | Description |
|---|---|---|
| `spec` | string | Spec ID. Defaults when omitted |
| `max_depth` | integer | Maximum heading depth to return (1–10) |

### get_section

Returns a section's body structured (headings, paragraphs, lists, tables, notes). **A parent section returns its whole subtree** (all subsections in document order), so top-level clauses can return very large responses — use the most specific section number you know.

| Parameter | Type | Description |
|---|---|---|
| `spec` | string | Spec ID. Defaults when omitted |
| `section` **required** | string | Section number, e.g. `"12.5.6.10"` / `"Annex A"` |

### search_spec

Searches the spec for a keyword or phrase and returns matching sections with snippets. The first call may take a few seconds to build the index. Matches as an exact phrase first, then as AND over the words.

::: warning What zero hits mean
"This corpus cannot answer" — **not** "no such requirement exists". PDF/A and PAdES are outside the corpus.
:::

| Parameter | Type | Description |
|---|---|---|
| `spec` | string | Spec ID. Defaults when omitted |
| `query` **required** | string | Search terms |
| `max_results` | integer | Maximum hits (1–50) |

### get_requirements

**Reads the standard, not your file.** Extracts normative requirements (shall / must / may) with sentence context, section and requirement level. It tells you what the specification requires, never whether a given PDF satisfies it — to check a file, use pdf-verify's `validate_conformance` / `evaluate_policy`.

| Parameter | Type | Description |
|---|---|---|
| `spec` | string | Spec ID. Defaults when omitted |
| `section` | string | Limit to this section and its subsections |
| `level` | string | Filter by level (shall / shall not / should / should not / may) |

### get_definitions

Returns term definitions (term, definition text, notes, source) from Section 3.

| Parameter | Type | Description |
|---|---|---|
| `spec` | string | Spec ID. Defaults when omitted |
| `term` | string | Filter to definitions matching this term |

### get_tables

Returns the tables of a section, structured with headers, rows and optional captions. A parent section returns the tables of its whole subtree.

| Parameter | Type | Description |
|---|---|---|
| `spec` | string | Spec ID. Defaults when omitted |
| `section` **required** | string | Section number containing the table(s) |
| `table_index` | integer | Return only this table (0-based). All tables when omitted |

### compare_versions

Compares sections between PDF 1.7 (ISO 32000-1) and PDF 2.0 (ISO 32000-2): matched (same or moved), added (new in 2.0), removed (absent in 2.0). Title-based automatic matching.

::: warning
`PDF_SPEC_DIR` must contain both PDF 1.7 (`PDF32000_2008.pdf`) and PDF 2.0.
:::

| Parameter | Type | Description |
|---|---|---|
| `section` | string | Limit the comparison to this section subtree |
