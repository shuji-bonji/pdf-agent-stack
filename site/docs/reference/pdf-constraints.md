---
description: pdf-constraints — the shared library that maps ISO 32000 clauses to machine-checkable constraint tables. Four states, given facts, traces of violations, and the ground veraPDF does not cover
---

# Constraint Tables (pdf-constraints)

- npm: `@shuji-bonji/pdf-constraints` / current v0.3.0
- GitHub: [shuji-bonji/pdf-constraints](https://github.com/shuji-bonji/pdf-constraints)
- Form: **library** (not an MCP server)

Constraint tables that map ISO 32000 clauses to **what a file has to look like structurally**, together with a deterministic evaluator.
It is exposed over MCP through pdf-verify's [`validate_clauses`](/reference/mcp/pdf-verify#validate-clauses).
Using it from an agent needs no awareness of the library itself — read this page when you want to know **what is actually checked, and how far**.

## The gap it fills

veraPDF decides PDF/A and PDF/UA, but it does not look at the **body of ISO 32000**. That gap is why a `shall` violation can survive as nothing more than a viewer warning filed under "harmless":

> A CFF font program embedded under `/FontFile2`
>
> ISO 32000-2 Table 124 defines `FontFile2` as a "TrueType font program", and says its value
> shall conform to the TrueType Reference Manual and shall include the `glyf`, `head`, `hhea`,
> `hmtx`, `loca` and `maxp` tables. CFF satisfies none of that. The file passes PDF/A and
> PDF/UA all the same — and still violates the specification body.

Lining up the question each server answers puts the library in place:

| Who | Question it answers |
|---|---|
| [pdf-spec](/mcp/pdf-spec) | What does the clause **require**? |
| [pdf-reader](/mcp/pdf-reader) | What **is** in the file? |
| **pdf-constraints** | **What state does satisfying the clause mean?** |
| [pdf-verify](/mcp/pdf-verify) | **What has been broken?** |
| [pdf-writer](/mcp/pdf-writer) | How do you **write** it? |

## Bundled tables

<!-- constraints:tables -->
| Domain | Clauses | Constraints | What it looks at |
|---|---|---|---|
| `font-embedding` | §9.9.1 / §9.9.2 / §9.7.4.2 (including Tables 124 and 125) | 5 | The embedding key matching the font format inside it, six-letter subset name tags, `Length1` |
| `document-metadata` | §14.3.2 / §14.3.3 / §14.3.4 / §7.9.4 | 6 | Metadata stream type, date syntax, Info ↔ XMP equivalence, `Trapped` |
| `annotation` | §12.5.2 / §12.5.3 / §12.5.5 / §12.5.6.2 / §12.5.6.10 (including Tables 166, 167, 172 and 182) | 15 | The appearance dictionary `/AP` a writer owes, paragraph breaks in `/Contents`, colour and flag syntax, `/QuadPoints` winding, `Popup` / `IRT` relationships |
<!-- /constraints:tables -->

The tables are plain JSON, so they can be read without going through the evaluator:

```ts
import table from '@shuji-bonji/pdf-constraints/tables/font-embedding.json' with { type: 'json' };
```

## Four states

Every constraint resolves to one of these. **No verdict is issued** — that is the job of pdf-verify's
[`evaluate_policy`](/reference/mcp/pdf-verify#evaluate-policy).

| State | Meaning |
|---|---|
| `pass` | Nothing in this constraint **could be disproved** |
| `fail` | Disproved (the fact and its measured value come back as evidence) |
| `not_applicable` | The clause does not apply to this document |
| `needs_external_fact` | A fact outside the file was not supplied, so the constraint **was not decided** |

::: warning No failures is not proof of conformance
It means only that none of the shipped constraints found a broken rule. That is not proof the file meets the
standard — you can only find where it breaks the rules. This is where
[declaration, conformance, validation](/guide/architecture#declaration-conformance-validation)
lands for the whole of PDF Agent Stack.
:::

### `given.*` — facts that live outside the file

Some clauses rest on a premise the file cannot settle. R-9.9.2-2 says the name of **a subset font**
shall begin with a six-letter tag — but whether a font is a subset is written nowhere in the PDF.
Only whoever made it knows.

Supply such facts through `given`. Without them the constraint degrades to `needs_external_fact`,
rather than being **defaulted into a silent pass or a false accusation**.

### "Violation" versus "trace of a violation"

When a clause addresses the PDF processor — the act of writing — all a file can show is that
**someone** broke it, not that the last writer did (§14.3.4 explicitly permits leaving an existing
inconsistency alone). Those constraints carry a `subjectNote`, and the report words their failures as traces.

## Using it on its own

It runs as a CLI without starting an MCP server, which is the lighter option inside CI.

```sh
npx @shuji-bonji/pdf-constraints check document.pdf
npx @shuji-bonji/pdf-constraints check document.pdf --domain font-embedding --given isSubset=true
```

Three exit codes, because **"could not decide" must not be confused with pass or fail**:

| Code | Meaning |
|---|---|
| 0 | No violation found in the constraints checked (not proof of conformance) |
| 1 | Violations found |
| 2 | Could not decide (file unreadable, bad arguments, and so on) |

As a library:

```ts
import { checkFile } from '@shuji-bonji/pdf-constraints';

const report = await checkFile('/abs/path/document.pdf', { given: { isSubset: true } });
report.violations;     // number of failures
report.packageVersion; // which version decided this — the provenance of the determinism
```

`packageVersion` is reported so that **the same file plus the same given facts always producing the
same result** can be checked after the fact. Tables and evaluation semantics ship bound to one version.

## What it does not do

- **Quote the specification** — that is [pdf-spec](/mcp/pdf-spec). Tables reference clause IDs and never copy the text
- **Prove conformance** — it cannot prove the file meets the standard; it can only find where it breaks the rules
- **Issue verdicts** — that is [`evaluate_policy`](/reference/mcp/pdf-verify#evaluate-policy)
- **Replace veraPDF** — PDF/A verdicts are veraPDF's; only ISO 32000-1/-2 body clauses ship here
- **Judge whether the content is true** — a file that satisfies every clause can still lie
