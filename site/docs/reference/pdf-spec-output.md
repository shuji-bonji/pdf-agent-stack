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
// get_section({ section: "14.9.4" }) — measured, pdf-spec-mcp v0.8.0
{
  "sectionNumber": "14.9.4",
  "title": "Replacement text",
  "pageRange": { "start": 815, "end": 816 },
  "boundary": { "start": "heading", "end": "heading" },   // how each end was cut — see below
  "content": [
    { "type": "heading",   "level": 3, "text": "14.9.4 Replacement text" },
    { "type": "paragraph", "text": "Replacement text may be specified for the following items:" },
    { "type": "list",      "items": ["• A structure element …", "• (PDF 1.5) A marked-content sequence …"] },
    { "type": "note",      "label": "NOTE 1",  "text": "Just as alternate descriptions can be provided …" },
    { "type": "paragraph", "text": "The ActualText value shall be used as a replacement, not a description, …" },
    { "type": "note",      "label": "NOTE 2",  "text": "The treatment of ActualText as a character replacement …" },
    { "type": "note",      "label": "EXAMPLE", "text": "This example shows the use of replacement text …" }
    // `table` and `code` elements appear in sections that have them
  ]
}
```

`heading.level` is the depth in the standard's own numbering (`14.9.4` = 3), not a Markdown heading level.

How to read it: `content` is in document order. **NOTE / EXAMPLE come back as `note` elements, separate from `paragraph` (body text).** In ISO drafting a NOTE is informative, not a normative requirement, so this distinction is required whenever you cite something as grounds. Tables come back structured as `table` elements, which keeps an LLM from misreading the correspondence of key, type and meaning.

`boundary` says where the content was cut (v0.8.0). The server cuts at headings when it finds them; when a heading is not found, the cut falls on a page edge, and the content may then carry a neighbour's text or miss its own tail — nothing in `content` or `pageRange` shows which.

| `boundary.start` | Meaning |
|---|---|
| `heading` | The section's own heading was found; text before it on the first page was dropped |
| `page` | The heading was not found; content starts at the top of the first page and may include the tail of the previous section |

| `boundary.end` | Meaning |
|---|---|
| `heading` | Cut at the next section's heading |
| `page` | Content ends with its last page; the next section starts on a later page |
| `page_shared` | The next section starts on the last page but its heading was not found — content may include the next section's text |
| `next_page_unclaimed` | The next section starts on the following page and its heading was not found there — any tail of this section on that page is not included |
| `document` | Last section of the document |

`heading` / `heading`, `heading` / `page` and `heading` / `document` are exact cuts. Anything else fell on a page edge: read the neighbouring section too before citing. In the corpus this happens only in front and back matter (cover, contents, errata, bibliography entries) — every body clause of ISO 32000-1 and ISO 32000-2 is cut at headings. For a parent section, `start` is the parent's own and `end` is its last descendant's. `get_tables` carries the same `boundary` plus `pageRange`: `totalTables: 0` means no Table element was seen in those pages, which under a page-cut boundary is not the same as "the section has no table".

### Tables (`get_tables` output)

`get_tables` returns the `table` elements of a section (and of its subtree) as `headers` / `rows`, each with the `caption` the standard prints above it — the "Table N — title" line. That line is what you cite, so a table without one is harder to point at.

```jsonc
// get_tables({ section: "Annex F", spec: "pdf17" }) — measured, pdf-spec-mcp v0.9.0
{
  "section": "Annex F",
  "sectionTitle": "Linearized PDF",
  "pageRange": { "start": 683, "end": 702 },
  "boundary": { "start": "heading", "end": "page" },
  "totalTables": 12,
  "tables": [
    {
      "index": 0,
      "caption": "Table F.1 – Entries in the linearization parameter dictionary",
      "headers": ["Parameter", "Type", "Value"],
      "rows": [
        ["Linearized", "number", "(Required) A version identification for the linearized format."],
        // …
      ]
    },
    // … Table F.2 to Table F.12
  ]
}
```

Tables in an annex are numbered by the annex letter (`Table F.5`; ISO 32000-2 writes `Table Annex O.3` in Annexes L and O). Up to v0.8.0 the server recognised only `Table 182`-style numbers, so every annex table came back `caption: null`, and consecutive annex tables sharing a header row were merged into one — Annex F of ISO 32000-1 returned 7 tables for its 12. From v0.9.0 they carry their caption and stay apart. A `caption: null` that remains is a table the standard itself prints without one — the operator lists in Annex B, the errata pages, the mesh and patch figures of 8.7.4.5.

## Requirements (`get_requirements` output)

Extracts only the normative sentences containing **shall / shall not / should / should not / may**, one sentence = one requirement.

```jsonc
// get_requirements({ section: "12.5.6.10" }) — measured, pdf-spec-mcp v0.8.0
{
  "filter": { "section": "12.5.6.10", "level": "all" },
  "totalRequirements": 6,
  "statistics": { "shall": 6 },            // counts per level; a level with no hits is absent
  "sectionsCutByPage": [],                 // sections in scope cut at a page edge (see `boundary` above); empty = all cut at headings
  "requirements": [
    {
      "id": "R-12.5.6.10-1",                // R-<section>-<n>: stable for citation and tracking
      "level": "shall",                     // one of the 5 levels of ISO/IEC Directives Part 2
      "text": "Text markup annotations shall appear as highlights, underlines, …",  // verbatim — quotable as-is
      "section": "12.5.6.10",
      "sectionTitle": "Text markup annotations"
    },
    {
      "id": "R-12.5.6.10-3",
      "level": "shall",
      "text": "(Required) The type of annotation that this dictionary describes;\nshall be Highlight, Underline, Squiggly, or StrikeOut …",
      "section": "12.5.6.10",
      "sectionTitle": "Text markup annotations",
      "source": "table",                    // present only for table-derived requirements
      "table": "Table 182 — Additional entries specific to text markup annotations",
      "key": "Subtype"                      // which entry of that table the sentence binds
    }
  ]
}
```

How to read it: the 5 levels are requirement (shall), prohibition (shall not), recommendation (should), discouragement (should not) and permission (may) — **only shall is a condition of conformance**. `text` is verbatim and can be quoted as-is (line breaks come from the standard's own layout). A requirement with `source: "table"` was lifted from a table cell and is meaningless on its own, so `table` / `key` (which table, which entry it binds) come attached — quote that context along with it. `statistics` counts only the levels that occurred, so a missing key means zero, not an error. `sectionsCutByPage` lists the sections in scope whose content was cut at a page edge, each with its `boundary`; their requirements may include a neighbour's sentences or miss the tail, so check those sections by `get_section` before citing.

::: warning Requirement ≠ verdict
A requirement is what the standard demands; whether a particular PDF satisfies it is a different question. File inspection belongs to [pdf-verify](/mcp/pdf-verify). Extraction is also limited to the corpus (ISO 32000-2 etc.) — PDF/A requirements not appearing here does not mean they do not exist.
:::

## Definitions (`get_definitions` output)

Returns term definitions from Section 3 (Terms and definitions).

```jsonc
// get_definitions({ term: "glyph" }) — measured, pdf-spec-mcp v0.6.0
{
  "totalDefinitions": 1,
  "searchTerm": "glyph",
  "definitions": [
    {
      "term": "glyph",
      "definition": "recognizable abstract graphic symbol that is independent of any specific design …",
      "section": "3.29",                      // section number, for citation
      "source": "ISO/IEC 9541-1:2012, 3.12"   // the standard's own SOURCE citation, when the entry carries one
      // "notes": ["Note 1: to entry: …"]     // Note to entry, when the entry carries any
    }
  ]
}
```

Omit `term` and the whole of Clause 3 comes back — **71 entries (3.1–3.71) in ISO 32000-2.**

How to read it: an ISO definition is **a normative sentence that fixes what the term means inside that standard**. For terms whose meaning in the standard differs from everyday usage (PDF processor 3.49, running text 3.59, object 3.44, deprecated 3.15), settle the definition here before arguing. `source` is the standard's own SOURCE citation for a definition borrowed from elsewhere — **not** the corpus document the answer came from. `notes` are supplements (Note to entry), kept separate from the definition text.

::: warning An empty result means "not in Clause 3"
Plenty of PDF vocabulary is defined in the body rather than in Clause 3 — *artifact* (§14.8.2.2) and *annotation* (§12.5) among them — so `get_definitions` returns nothing for them. Reach for `search_spec` / `get_section` instead, and never read zero definitions as "the standard does not define this".
:::

## Related

- [pdf-spec-mcp](/mcp/pdf-spec) — responsibilities and boundaries
- [Tools reference](/reference/mcp/pdf-spec) — parameters, types and defaults for all 8 tools
- [How to Read ISO Specs](/reference/iso-reading-primer)
