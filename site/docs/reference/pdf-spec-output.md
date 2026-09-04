---
description: The three kinds of pdf-spec-mcp output (clauses, requirements, definitions) — their JSON shape and where they are easy to misread
---

# Reading pdf-spec Output

The output of [pdf-spec-mcp](/mcp/pdf-spec) falls into three kinds: **clauses**, **requirements** and **definitions**. This page shows the JSON shape of each and where each is easy to misread. For parameters and types, see the [tools reference](/reference/mcp/pdf-spec) (generated).

All of them are structured renderings of *what the standard says* — none of them say anything about your file.

::: tip Background: ISO drafting conventions
NOTEs are not normative, only shall is a condition of conformance, definitions override everyday language — without these conventions the output is easy to misread. Read [How to Read ISO Specs](/reference/iso-reading-primer) first.
:::

## Clauses (`get_section` output)

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

How to read it: `content` is in document order. **NOTE / EXAMPLE come back as `note` elements, separate from `paragraph` (body text).** In ISO drafting a NOTE is informative, not a normative requirement, so this distinction is required whenever you cite something as grounds. Tables come back structured as `table` elements, which keeps an LLM from misreading the correspondence of key, type and meaning.

## Requirements (`get_requirements` output)

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
A requirement is what the standard demands; whether a particular PDF satisfies it is a different question. File inspection belongs to [pdf-verify](/mcp/pdf-verify). Extraction is also limited to the corpus (ISO 32000-2 etc.) — PDF/A requirements not appearing here does not mean they do not exist.
:::

## Definitions (`get_definitions` output)

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

How to read it: an ISO definition is **a normative sentence that fixes what the term means inside that standard**. For terms whose meaning in the standard differs from everyday usage (conforming reader / interactive form / artifact), check the definition here before arguing. `notes` are supplements (Note to entry), kept separate from the definition text.

## Related

- [pdf-spec-mcp](/mcp/pdf-spec) — responsibilities and boundaries
- [Tools reference](/reference/mcp/pdf-spec) — parameters, types and defaults for all 8 tools
- [How to Read ISO Specs](/reference/iso-reading-primer)
