---
description: A primer on reading ISO specifications — NOTEs are not normative, only shall is a condition of conformance, definitions override everyday language
---

# How to Read ISO Specs (Primer)

To interpret the clauses, requirements and definitions that pdf-spec-mcp returns, you need a little of the drafting convention shared by all ISO standards. This page is the minimum needed to use the PDF Family well.

## 1. The standard skeleton

Every ISO standard has roughly the same bones.

| Section | Content | Normative? |
|---|---|---|
| 1 Scope | What the standard applies to | Normative |
| 2 Normative references | Other standards it cites (cited parts rank with the body text) | Normative |
| 3 Terms and definitions | Definitions. **Fixes what a term means inside this standard** | Normative |
| 4… Body (Clauses) | The requirements themselves | Normative |
| Annex A, B, … | Annexes. **Normativity depends on the (normative) / (informative) label** | Depends on label |
| Bibliography | Further reading | Informative |

Numbering deepens as `14` (clause) → `14.9` (subclause) → `14.9.4`. `get_section`'s `section` parameter takes these numbers; passing a parent number returns its whole subtree.

## 2. Normative vs informative

**Not every sentence in a standard is a requirement.** Confusing the two leads to the classic accident of calling something a "spec violation" on the strength of informative text.

- **NOTE**s and **EXAMPLE**s are **informative** — they contain no requirements (and per the ISO/IEC Directives they must not)
- Footnotes are informative too
- Annexes are judged by the `(normative)` / `(informative)` label in their title

pdf-spec-mcp preserves this distinction structurally: in `get_section` output, NOTE / EXAMPLE come back as `note` elements separated from `paragraph` (body text), and `get_requirements` extracts normative sentences only. **Never cite a `note` element as grounds.**

## 3. Requirement levels — shall / should / may / can

The ISO/IEC Directives Part 2 defines the auxiliaries strictly.

| Auxiliary | Meaning | Relation to conformance |
|---|---|---|
| **shall** / shall not | Requirement / prohibition | **Condition of conformance. Violation = non-conformance** |
| **should** / should not | Recommendation / discouragement | Not following it is not non-conformance |
| **may** | Permission | Implementer's freedom |
| **can** / cannot | Possibility / capability | Not a requirement (and not a permission either) |

- Everyday-English "must" is not used in ISO normative text (it is reserved for external constraints). Requirements are always shall
- `get_requirements`' `level` maps to these five levels (shall / shall not / should / should not / may), and `statistics` returns counts per level
- **Only shall counts in a conformance argument.** Never write up a should violation as a "spec violation"

## 4. Definitions (Clause 3) override everyday language

Terms and definitions is a normative section that fixes what a term means *inside that standard*. The terms that drift furthest from everyday usage deserve the most care. Important PDF examples:

- **conforming reader / conforming writer / conforming product** — a conforming *processor*. Whether a shall binds the file or the processor depends on the subject of the sentence
- **artifact** — page decoration outside the logical content (page numbers, running heads). Not the everyday "artifact/deliverable"
- **annotation** — in PDF, an annotation object on the page (including links and form Widgets); much broader than "comment"

Settling the term with `get_definitions` before arguing is the safe move. The `notes` attached to a definition (Note to entry) are supplements, kept separate from the definition text.

## 5. Watch the subject — a requirement on the file, or on the processor?

ISO 32000's shalls point in two directions.

- "The value **shall** be …" → a requirement on the **PDF file** (a validator can check the file)
- "A conforming reader **shall** …" → a requirement on the **processor** (looking at the file cannot decide conformance)

pdf-verify can check only the former. The latter is never grounds for "this PDF violates the spec". When quoting a clause, quote it with its subject (`get_requirements`' `text` is verbatim, so it can be quoted as-is).

## 6. Read table-derived requirements with their context

ISO 32000 keeps many of its requirements in **tables** (e.g. Table 182 — Entries in an annotation dictionary). A cell saying "The type of annotation … shall be …" is meaningless without knowing which table and which entry it binds. That is why `get_requirements` attaches `table` / `key` to requirements with `source: "table"` — **quote that context along with the text**. The tables themselves come back structured from `get_tables`.

## 7. Map of PDF-related standards

| Standard | Content | In corpus? |
|---|---|---|
| ISO 32000-1 (2008) | PDF 1.7 | ✅ `pdf17` |
| ISO 32000-2 (2020) | PDF 2.0 (the default reference) | ✅ `iso32000-2` |
| ISO/TS 32001–32005 | Extension TSs (SHA-3, ECC signatures, AES-GCM, …) | ✅ |
| ISO 14289-1/-2 | PDF/UA (accessibility) | ✅ |
| ISO 19005 | PDF/A (long-term preservation) | ❌ **Outside the corpus** — verdicts belong to veraPDF |
| ETSI EN 319 142 | PAdES (long-term signatures) | ❌ **Outside the corpus** — structural observation only (T3) |

::: warning What zero search hits mean (again)
Zero hits from `search_spec` mean "this corpus cannot answer", NOT "no such requirement exists". PDF/A and PAdES requirements in particular will **never** appear here. Check `coverage.gaps` in `list_specs`.
:::

## Related pages

- [pdf-spec-mcp](/mcp/pdf-spec) — each tool's parameters and output
- [Architecture & Responsibilities](/guide/architecture) — assertion strength (T1/T2/T3), declaration / conformance / validation
- [Glossary](/reference/glossary)
