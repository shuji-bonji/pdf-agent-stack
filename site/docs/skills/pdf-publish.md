---
description: The exit-gate Skill that runs the write → read-back → verify quality loop and delivers with a Publish Report
---

# pdf-publish — Delivery Pipeline

A Skill that orchestrates PDF creation and editing all the way to delivery, with quality gates. It writes with pdf-writer, reads the result back with pdf-reader, machine-scores it with pdf-verify (veraPDF) — the **write → read-back → verify loop** — and delivers with a **Publish Report**.

```mermaid
graph LR
  W[["pdf-writer<br>write"]] --> R[["pdf-reader<br>read-back"]] --> V[["pdf-verify<br>veraPDF scoring"]]
  V -->|fail| W
  V -->|pass| D(["delivery + Publish Report"])
```

## Supported scenarios

- Generating PDF/UA-conformant (tagged) PDFs — PDF/UA-1 on PDF 1.7, PDF/UA-2 on PDF 2.0
- An invoice bundled with its data: PDF/A-3b plus attachments (`attach_file`). When PDF/A-4 is requested, use **`pdfa-4f`** — plain `pdfa-4` requires every attachment to be PDF/A itself, which is incompatible with bundling CSV/XML
  - Asked for "an e-bookkeeping-law (電帳法) compliant PDF", the Skill first says that neither PDF/A nor attachments is a requirement of the Act, and asks what is wanted (PDF/A preservation, bundled data, or both) before choosing the level. For electronic transactions the Act asks for a timestamp, a system that records or prevents corrections, or internal rules against unjustified changes (Enforcement Regulation Art. 4(1)). The Publish Report never says the output complies with the Act
- Making forms PDF/UA-conformant (`tag_form_fields`)
- General quality-assured delivery

## Quality gate levels

Choose how far to check before delivering — the central setting of this Skill.

| Level | Meaning | Required MCPs |
|---|---|---|
| `none` | Write only, no gate (drafts, throwaways) | writer |
| `readback` | Read the output back with reader and observe that it matches the intent | writer + reader |
| `conformance(flavour)` | Until veraPDF scores it COMPLIANT. The flavour names the standard to measure (`pdfa-3b` / `pdfa-4` / `pdfa-4f` / `pdfua-1` / `pdfua-2`) | writer + verify (veraPDF recommended) |

## Key rules

- After writing a label (`ensure_pdfa` / `ensure_tagged`), always run `validate_conformance` with the matching flavour — **if you cannot measure it, do not write the label**
- The verdict belongs to veraPDF. Report "veraPDF judged it COMPLIANT", never "conforms to ISO 19005"
- **Decide which flavours to measure from `output.declares`** in the last writer result (writer 0.28.0+), not from what was asked for. Everything declared is measured: `pdfua: 1` → `pdfua-1`, `pdfua: 2` → `pdfua-2`, `pdfa: "3b"` / `"4"` / `"4f"` → the matching `pdfa-*`. `declares` is the file's own claim; the pass or fail comes from `validate_conformance`

## Which standards go together

PDF/UA-1 is built on PDF 1.0–1.7 (ISO 14289-1 §6.1) and PDF/UA-2 on PDF 2.0 (ISO 14289-2 §6.1). PDF/A-3 needs a PDF 1.x header and PDF/A-4 needs 2.0, so the accessibility part decides the PDF/A part:

| PDF version | Accessibility | Long-term preservation | Steps | Measured (veraPDF 1.30.0) |
|---|---|---|---|---|
| 1.7 | PDF/UA-1 (`pdfua-1`) | PDF/A-3b (`pdfa-3b`) | `create_*(tagged)` → `ensure_pdfa` | 106/106 · 146/146 |
| 2.0 | PDF/UA-2 (`pdfua-2`) | PDF/A-4 (`pdfa-4` / `pdfa-4f`) | `create_*(tagged, pdfVersion: "2.0")` → `ensure_pdfa(flavour: "pdfa-4")` | 1,728/1,728 · 109/109 |

The other pairings are refused by the writer with `INVALID_ARGUMENT`. When `ensure_pdfa` returns `next_actions[0].action: "retry_with_flavour"`, the Skill reads `example.flavour` before following it: `pdfa-3b` means the input declares PDF/UA-1, `pdfa-4` means the input is PDF 2.0. It does not switch the target standard silently — the change is the user's to agree to. When both accessibility and PDF/A-4 are asked for, a new document is created as PDF 2.0; for an existing PDF/UA-1 document the user chooses between "PDF/A-3b + PDF/UA-1" and recreating it as PDF 2.0.

`merge_pdfs` refuses a mix of PDF 2.0 and PDF 1.x inputs unless `pdfVersion` is given. `pdfVersion: "2.0"` is an explicit conversion, so the Skill asks before using it on a job that targets PDF/A-3b.

## Measured example — Publish Report summary (2026-08-11)

A demo invoice (Japanese, tagged, CSV attachment) delivered at
gate level `conformance(pdfa-3b + pdfua-1)`:

| Phase | What ran | Result |
|---|---|---|
| 1 Write | `create_markdown_pdf` (tagged, lang: ja) → `attach_file` (CSV, **Data**) → `ensure_pdfa` (**always last**) | First call failed with `FONT_REQUIRED` → recovered by following the structured error's `next_actions` (fontPath) |
| 2 Read-back | read_text / extract_structured_text / inspect_fonts / inspect_tags / inspect_structure | Every identifier and figure preserved; exactly one H1; font embedded + subset; **Names / AF / OutputIntents** present in the catalog |
| 3 Gate | identify_conformance + validate_conformance ×2 | **veraPDF judged PDF/A-3b COMPLIANT (146/146) and PDF/UA-1 COMPLIANT (106/106)** |
| 4 Fix loop | — | **0 iterations** (passed first time) |

`ensure_pdfa` always returns a warning, even on success:

> This file now **CLAIMS** PDF/A-3b …, but conformance was **NOT checked** here. … Verify before
> relying on it: pdf-verify-mcp validate_conformance(flavour: "pdfa-3b")

This is design, not a defect. The moment a label is written, verification stops being
optional — the warning is transcribed into the Report, and the matching flavour is measured
before delivery.

### Second measured example — PDF/UA-2 + PDF/A-4 (2026-11-10)

pdf-publish 0.8.0 with writer 0.28.1: `create_markdown_pdf(tagged, pdfVersion: "2.0", lang: "ja", drawTitle: false)` → `add_bookmarks` → `ensure_pdfa(flavour: "pdfa-4")`. `output.declares` went `{pdfua: 2}` → `{pdfua: 2}` → `{pdfua: 2, pdfa: "4"}`, so the Skill measured `pdfua-2` and `pdfa-4`, which also matched `identify_conformance`. **veraPDF 1.30.0 judged PDF/UA-2 COMPLIANT (1,728/1,728) and PDF/A-4 COMPLIANT (109/109)**, with 0 fix iterations.

## Loop cutoff conditions

- The fix loop has a **hard cap of 3 iterations**. Beyond that, stop and hand over to human review with the remaining violations plus clause grounds (via pdf-spec when connected)
- **The same violation twice in a row → hand over immediately** — that fix is not working
- When an earlier step fails, later steps are recorded as "**skipped**", not "failed" (prevents misreading the cause)
- `compliant: null` from the native engine means "no violations in the checked subset", not conformance — the gate verdict is withheld and installing veraPDF is recommended

## Installation

```sh
/plugin marketplace add shuji-bonji/claude-plugins
/plugin install pdf-writer-mcp@shuji-bonji   # required foundation
/plugin install pdf-verify-mcp@shuji-bonji   # required at the conformance gate level
/plugin install pdf-publish@shuji-bonji
# recommended: pdf-reader-mcp (read-back)
```

Repository: [shuji-bonji/pdf-publish-skill](https://github.com/shuji-bonji/pdf-publish-skill) (SKILL.md itself and the error-code mapping)

## Degraded operation

- pdf-writer not connected → cannot proceed; the Skill says so and stops
- pdf-verify not connected → `conformance`-level jobs are **aborted** (continuing requires agreeing to downgrade to `readback`). Any job that uses `ensure_pdfa` / `ensure_tagged` requires verify regardless of level — if it cannot be measured, the label is not written
- pdf-reader not connected → read-back recorded as "not performed (tool not connected)"
- Text with characters the standard font cannot encode (Japanese, for example; WinAnsiEncoding covers `“` `—` `€` since writer 0.26.0) and no embeddable font → `FONT_REQUIRED` (structured error; `detail.characters` names the characters); resolved via `fontPath` or the `PDF_WRITER_FONT` environment variable
