---
description: "Tools reference for pdf-spec-mcp v0.6.0 — parameters, types, defaults and returns of all 8 tools, generated from the server's tools/list."
---

# pdf-spec-mcp — Tools Reference

<!-- GENERATED FILE — do not edit. Parameters and returns: the server. Worked examples: scripts/reference-examples/. -->

::: info
Auto-generated from the `tools/list` handshake of **v0.6.0** (8 tools, 2026-09-04). Do not edit by hand — regenerate with `node scripts/generate-reference.mjs`.
:::

**This page is the generated reference** — every tool's parameters, types, defaults and returns, transcribed from the server's `tools/list` (the source of truth is the server itself). For the server's responsibilities, boundaries and how to use it, see the [guide page](/mcp/pdf-spec).

## Tools

| Tool | Summary |
|---|---|
| [`list_specs`](#list-specs) | List all available PDF specification documents. |
| [`get_structure`](#get-structure) | Get the section hierarchy of the PDF specification (ISO 32000-2). |
| [`get_section`](#get-section) | Get the content of a specific section from the PDF specification (ISO 32000-2). |
| [`search_spec`](#search-spec) | Search the PDF specification (ISO 32000-2) for a keyword or phrase. |
| [`get_requirements`](#get-requirements) | Reads the STANDARD, not your file. |
| [`get_definitions`](#get-definitions) | Get term definitions from Section 3 of the PDF specification (ISO 32000-2). |
| [`get_tables`](#get-tables) | Extract table structures from a specified section of the PDF specification (ISO 32000-2). |
| [`compare_versions`](#compare-versions) | Compare sections between PDF 1.7 (ISO 32000-1) and PDF 2.0 (ISO 32000-2). |

## list_specs

**List available specifications**

List all available PDF specification documents. Returns document IDs, titles, page counts, and categories, plus `coverage.gaps` — the normative areas this corpus does NOT contain (PDF/A, PAdES). Read the gaps before concluding that a requirement does not exist. Use the returned IDs as the `spec` parameter in other tools.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `category` | string | no |  | Filter by category (standard, ts, pdfua, guide, appnote). |

::: details Worked example — "Quote the PDF/A conformance requirements from the clauses"
- Measured: v0.6.0
- Default spec: `iso32000-2`
- `spec`: omitted
- Arrays: trimmed to the first items

ISO 19005 is not in the corpus, so read `coverage.gaps` before searching clauses. An empty object is enough.

**Parameters**

```jsonc
{}
```

**Returned JSON** (`specs` — 17 entries — omitted; `coverage.gaps` is the point):

```jsonc
{
  "totalSpecs": 17,
  "coverage": {
    "note": "These normative areas are outside this corpus. A search returning no hits for them means \"cannot answer\", not \"no such requirement\".",
    "gaps": [
      {
        "area": "PDF/A — archival conformance",
        "standards": ["ISO 19005-1", "ISO 19005-2", "ISO 19005-3", "ISO 19005-4"],
        "consequence": "Requirements specific to PDF/A cannot be quoted or verified here. … A search returning nothing is not evidence that no requirement exists."
      },
      {
        "area": "PAdES — signature profiles",
        "standards": ["ETSI EN 319 142-1", "ETSI EN 319 142-2"],
        "consequence": "Baseline signature levels (B-B / B-T / B-LT / B-LTA) are defined by ETSI, not by ISO 32000-2. … ISO 32000-2 §12.8 covers signatures in general and is available."
      }
    ]
  }
}
```

From here the job belongs to pdf-verify-mcp's `validate_conformance` (`flavour` `"pdfa-*"`). Calling `search_spec` with `"PDF/A"` on this server and getting zero hits does not mean "no such requirement".
:::

## get_structure

**Get section hierarchy**

Get the section hierarchy of the PDF specification (ISO 32000-2). Returns the table of contents with section numbers, titles, and page numbers.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `spec` | string (minLength 1) | no |  | Spec ID (e.g. "iso32000-2", "pdf17"). Omit for the default spec. |
| `max_depth` | integer (1–10) | no |  | Maximum heading depth to return (1-10). |

## get_section

**Get section content**

Get the content of a specific section from the PDF specification (ISO 32000-2). Returns structured content including headings, paragraphs, lists, tables, and notes. A parent section returns its entire subtree (all subsections, in document order); top-level clauses can therefore return very large responses — prefer the most specific section number you know.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `spec` | string (minLength 1) | no |  | Spec ID (e.g. "iso32000-2", "pdf17"). Omit for the default spec. |
| `section` | string (minLength 1) | **yes** |  | Section number, e.g. "12.5.6.10" or "Annex A". |

::: details Worked example — "Which clause defines reading order in tagged PDF?" (§14.8.2.5.1)
- Measured: v0.6.0
- Default spec: `iso32000-2`
- `spec`: omitted
- `section`: `"14.8.2.5.1"`
- Hard wraps: folded to spaces

The section number is the top hit from [`search_spec`](#search-spec) for `content order`. Pass the most specific number you have, `14.8.2.5.1`, not the parent `14.8.2.5`.

**Parameters**

```jsonc
{
  "section": "14.8.2.5.1"
}
```

**Returned JSON**

```jsonc
{
  "sectionNumber": "14.8.2.5.1",
  "title": "General",
  "pageRange": { "start": 764, "end": 764 },
  "content": [
    { "type": "heading", "level": 5, "text": "14.8.2.5.1 General" },
    {
      "type": "paragraph",
      "text": "Page content order shall be defined by the sequencing of graphics objects within a page’s content stream."
    },
    {
      "type": "paragraph",
      "text": "Logical content order – the ordering for semantic purposes – shall be defined by a depth-first traversal of the document’s logical structure hierarchy."
    },
    {
      "type": "paragraph",
      "text": "The page content order in a tagged PDF should coincide with the logical content order."
    },
    {
      "type": "note",
      "label": "NOTE 1",
      "text": "Page content order is constrained by the need to render objects in an order that produces the desired visual appearance. …"
    }
  ]
}
```

shall in a `paragraph` is a requirement, should is a recommendation, and `note` is informative. Do not use a `note` element as grounds for a shall violation.
:::

## search_spec

**Search the specification**

Search the PDF specification (ISO 32000-2) for a keyword or phrase. Returns matching sections with context snippets. The first call may take a few seconds to build the search index; it is then cached on disk, so later processes start warm. No hits means "this corpus cannot answer", NOT "no such requirement exists" — ISO 19005 (PDF/A) and ETSI PAdES are outside it (see list_specs -> coverage.gaps).

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `spec` | string (minLength 1) | no |  | Spec ID (e.g. "iso32000-2", "pdf17"). Omit for the default spec. |
| `query` | string (minLength 1) | **yes** |  | Search terms. Matched as an exact phrase first, then as AND over the words. |
| `max_results` | integer (1–50) | no |  | Maximum hits to return (1-50). |

::: details Worked example — "What does PDF 2.0 require of incremental updates?"
- Measured: v0.6.0
- Default spec: `iso32000-2`
- `spec`: omitted
- `query`: `"incremental update"`
- `max_results`: `5`
- Arrays: trimmed; PDF hard wraps folded to spaces

Search with an English phrase. Pass the hitting section to [`get_requirements`](#get-requirements).

**Parameters**

```jsonc
{
  "query": "incremental update",
  "max_results": 5
}
```

**Returned JSON**

```jsonc
{
  "query": "incremental update",
  "totalResults": 5,
  "results": [
    {
      "section": "7.5.6",
      "title": "Incremental updates",
      "page": 75,
      "score": 12,
      "snippet": "7.5.6 Incremental updates The contents of a PDF file can be updated incrementally without rewriting…"
    },
    {
      "section": "12.7.8.3.1",
      "title": "General",
      "page": 576,
      "score": 12,
      "snippet": "…A stream containing all the bytes in all incremental updates made to the underlying PDF document…"
    }
    // … 3 more (7.5.4 / 12.8.1 / 7.5.1)
  ]
}
```

The top hit is §7.5.6. When you want requirements only, pass that section to [`get_requirements`](#get-requirements).
:::

::: details Worked example — "Which clause defines reading order in tagged PDF?"
- Measured: v0.6.0
- Default spec: `iso32000-2`
- `spec`: omitted
- `query`: `"content order"`
- `max_results`: `5`

Everyday English `reading order` surfaces other clauses first (how streams are read, vertex order in shadings, and so on). The specification's terms are **logical content order** / **page content order**.

**Parameters**

```jsonc
{
  "query": "content order",
  "max_results": 5
}
```

**Returned JSON**

```jsonc
{
  "query": "content order",
  "totalResults": 5,
  "results": [
    {
      "section": "14.8.2.5.1",
      "title": "General",
      "page": 764,
      "score": 39,
      "snippet": "14.8.2.5.1 General Page content order shall be defined by the sequencing of graphics objects within …"
    }
    // … 4 more
  ]
}
```

When you want the body, call [`get_section`](#get-section) with the most specific section number you now have. That is `14.8.2.5.1`, not the parent `14.8.2.5`.
:::

## get_requirements

**Extract normative requirements**

Reads the STANDARD, not your file. Extract normative requirements (shall/must/may) from the PDF specification (ISO 32000-2). Returns structured requirements with the sentence context, section, and requirement level. It tells you what the specification requires, never whether a given PDF satisfies it — to check a file, use pdf-verify-mcp (validate_conformance / evaluate_policy).

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `spec` | string (minLength 1) | no |  | Spec ID (e.g. "iso32000-2", "pdf17"). Omit for the default spec. |
| `section` | string (minLength 1) | no |  | Limit to this section and its subsections. |
| `level` | string | no |  | Filter by requirement level (shall, shall not, should, should not, may). |

::: details Worked example — "What does PDF 2.0 require of incremental updates?" (§7.5.6)
- Measured: v0.6.0
- Default spec: `iso32000-2`
- `spec`: omitted
- `section`: `"7.5.6"`
- Arrays: trimmed; PDF hard wraps folded to spaces

The section number is the top hit from [`search_spec`](#search-spec) (§7.5.6). Omitting `level` returns shall / may mixed together.

**Parameters**

```jsonc
{
  "section": "7.5.6"
}
```

**Returned JSON**

```jsonc
{
  "filter": { "section": "7.5.6", "level": "all" },
  "totalRequirements": 10,
  "statistics": { "shall": 8, "may": 2 },
  "requirements": [
    {
      "id": "R-7.5.6-1",
      "level": "shall",
      "section": "7.5.6",
      "sectionTitle": "Incremental updates",
      "text": "When updating a PDF file incrementally, changes shall be appended to the end of the file, leaving its original contents intact."
    },
    {
      "id": "R-7.5.6-2",
      "level": "shall",
      "section": "7.5.6",
      "sectionTitle": "Incremental updates",
      "text": "A cross-reference section for an incremental update shall contain entries only for objects that have been changed, replaced, or deleted."
    }
    // … 8 more. Only shall is a condition of conformance
  ]
}
```

`text` is verbatim, so it can be quoted. This is a requirement of the standard. Whether the PDF under examination satisfies it is pdf-verify-mcp's `validate_conformance` / `evaluate_policy`.
:::

## get_definitions

**Get term definitions**

Get term definitions from Section 3 of the PDF specification (ISO 32000-2). Returns structured definitions with term, definition text, notes, and sources.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `spec` | string (minLength 1) | no |  | Spec ID (e.g. "iso32000-2", "pdf17"). Omit for the default spec. |
| `term` | string (minLength 1) | no |  | Filter to definitions matching this term. |

## get_tables

**Extract tables**

Extract table structures from a specified section of the PDF specification (ISO 32000-2). Returns tables with headers, rows, and optional captions. A parent section returns the tables of its entire subtree (all subsections).

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `spec` | string (minLength 1) | no |  | Spec ID (e.g. "iso32000-2", "pdf17"). Omit for the default spec. |
| `section` | string (minLength 1) | **yes** |  | Section number containing the table(s). |
| `table_index` | integer (0–9007199254740991) | no |  | Return only this table (0-based). Omit for all tables in the section. |

## compare_versions

**Compare PDF 1.7 and PDF 2.0**

Compare sections between PDF 1.7 (ISO 32000-1) and PDF 2.0 (ISO 32000-2). Returns matched sections (same or moved), added sections (new in 2.0), and removed sections (absent in 2.0). Uses title-based automatic matching.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `section` | string (minLength 1) | no |  | Limit the comparison to this section subtree. |

::: details Worked example — "How did the incremental-update clause change between PDF 1.7 and 2.0?"
- Measured: v0.6.0
- `section`: `"7.5.6"`
- Requires: both PDF 1.7 and PDF 2.0 in `PDF_SPEC_DIR`

**Parameters**

```jsonc
{
  "section": "7.5.6"
}
```

**Returned JSON**

```jsonc
{
  "totalMatched": 1,
  "totalAdded": 0,
  "totalRemoved": 0,
  "matched": [
    {
      "section17": "7.5.6",
      "section20": "7.5.6",
      "title": "Incremental updates",
      "status": "same"
    }
  ],
  "added": [],
  "removed": []
}
```

Section number and title are the same in 1.7 and 2.0. The tool does not return a body diff. To see the requirements themselves, call [`get_requirements`](#get-requirements) on that section for both specs (`spec: "pdf17"` and the default `iso32000-2`).
:::
