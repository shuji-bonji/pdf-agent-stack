---
description: Quality-gated delivery pipeline — the write → read-back → verify loop, traced through a real run that passed veraPDF for both PDF/A-3b and PDF/UA-1
---

# Delivery Pipeline

## Scenario

"Make a PDF and deliver it" — without leaving it unchecked. pdf-writer writes it, pdf-reader
reads it back to observe whether it matches the intent, and pdf-verify (veraPDF) scores it
before delivery. Only verify decides pass/fail; the writer's exit code is never taken as proof
that the output matches the request.

Below is a **real run from 2026-08-11**: a Japanese, tagged demo invoice with a CSV attachment,
delivered at gate level `conformance(pdfa-3b + pdfua-1)`.

## Cast

| Actor | Role |
|---|---|
| [pdf-publish Skill](/skills/pdf-publish) | Orchestration, transcribing warnings, the Publish Report |
| [pdf-writer](/mcp/pdf-writer) (required) | Writing, attaching, PDF/A vessel (`ensure_pdfa`) |
| [pdf-reader](/mcp/pdf-reader) (recommended) | Read-back observation (never pass/fail) |
| [pdf-verify](/mcp/pdf-verify) (required at conformance level) | `validate_conformance` (delegates to veraPDF) |

## Sequence

```mermaid
sequenceDiagram
  actor U as User
  participant S as pdf-publish Skill
  participant W as pdf-writer
  participant R as pdf-reader
  participant V as pdf-verify (veraPDF)

  U->>S: Deliver an e-bookkeeping-law invoice PDF
  S->>W: create_markdown_pdf(tagged, lang: ja)
  W-->>S: FONT_REQUIRED (structured error)
  S->>W: retry with fontPath (following next_actions)
  S->>W: attach_file(CSV, relationship: Data)
  S->>W: ensure_pdfa(pdfa-3b) — always last
  W-->>S: success + warning "CLAIMS PDF/A-3b, NOT checked"
  S->>R: read_text / extract_structured_text / inspect_fonts / inspect_structure
  R-->>S: observations (input comparison, AF/Names presence)
  S->>V: validate_conformance(pdfa-3b) / (pdfua-1)
  V-->>S: veraPDF COMPLIANT 146/146 / 106/106
  S-->>U: delivery + Publish Report (fix loop ≤ 3 on failure)
```

## Prompt examples

- "Turn this invoice data into an e-bookkeeping-law PDF. Bundle the CSV, verify, then deliver"
- "Make this report an accessible PDF (PDF/UA), quality-assured"
- "Just a draft PDF is fine" (→ gate level `none`, and the report says so)

## Measured example — the demo invoice's Publish Report

| Phase | Result |
|---|---|
| Write | `FONT_REQUIRED` → recovered via the structured error's `next_actions` (fontPath). attach (Data) → ensure_pdfa (last) |
| Read-back | Invoice number and every figure preserved / exactly one H1 / font embedded + subset / Names, AF, OutputIntents present in the catalog |
| Gate | **veraPDF judged PDF/A-3b COMPLIANT (146/146) and PDF/UA-1 COMPLIANT (106/106)** |
| Fix loop | 0 iterations |

`ensure_pdfa` always returns a warning even on success ("CLAIMS … NOT checked"). That is design:
the machine keeps saying that **writing a label makes verification non-optional**.

## How to read the results

- The wording depends on the normative layer: PDF/A is "**veraPDF judged it COMPLIANT**"
  (T2 — never "conforms to ISO 19005"); PDF/UA-1 clauses can be quoted (T1, ISO 14289-1)
- `compliant: null` from the native engine means "no violations in the checked subset" — not
  conformance. The gate verdict is withheld and veraPDF is recommended
- Machine validation cannot judge whether alt text or reading order are semantically right;
  the report names what remains for human review
- The fix loop caps at 3; the same violation twice in a row goes straight to human review
  ([cutoff conditions](/skills/pdf-publish#loop-cutoff-conditions))
