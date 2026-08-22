---
description: "Tools reference for pdf-spec-mcp v0.4.6 — parameters, types, defaults and returns of all 8 tools, generated from the server's tools/list."
---

# pdf-spec-mcp — Tools Reference

<!-- GENERATED FILE — do not edit. Source of truth: the server itself. -->

::: info
Auto-generated from the `tools/list` handshake of **v0.4.6** (8 tools, 2026-08-22). Do not edit by hand — regenerate with `node scripts/generate-reference.mjs`.
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

## search_spec

**Search the specification**

Search the PDF specification (ISO 32000-2) for a keyword or phrase. Returns matching sections with context snippets. The first call may take a few seconds to build the search index. No hits means "this corpus cannot answer", NOT "no such requirement exists" — ISO 19005 (PDF/A) and ETSI PAdES are outside it (see list_specs -> coverage.gaps).

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `spec` | string (minLength 1) | no |  | Spec ID (e.g. "iso32000-2", "pdf17"). Omit for the default spec. |
| `query` | string (minLength 1) | **yes** |  | Search terms. Matched as an exact phrase first, then as AND over the words. |
| `max_results` | integer (1–50) | no |  | Maximum hits to return (1-50). |

## get_requirements

**Extract normative requirements**

Reads the STANDARD, not your file. Extract normative requirements (shall/must/may) from the PDF specification (ISO 32000-2). Returns structured requirements with the sentence context, section, and requirement level. It tells you what the specification requires, never whether a given PDF satisfies it — to check a file, use pdf-verify-mcp (validate_conformance / evaluate_policy).

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `spec` | string (minLength 1) | no |  | Spec ID (e.g. "iso32000-2", "pdf17"). Omit for the default spec. |
| `section` | string (minLength 1) | no |  | Limit to this section and its subsections. |
| `level` | string | no |  | Filter by requirement level (shall, shall not, should, should not, may). |

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
