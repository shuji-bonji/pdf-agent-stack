---
description: Glossary — declaration vs conformance vs validation, assertion strength T1/T2/T3, basis (grounds for a rectangle), PAdES, LTV, DocMDP, veraPDF, the 4-value verdict
---

# Glossary

Terms that appear in the family's documentation and tool output. Definitions follow the ISO usage wherever the standards define the term.

## Terms about the strength of a claim

Keeping these three apart is the design philosophy of the whole family → [Architecture & Responsibilities](/guide/architecture).

| Term | Definition |
|---|---|
| Declaration | pdfaid / pdfuaid in XMP. The document's claim about itself. Proves nothing. This is what the writer's `ensure_pdfa` / `ensure_tagged` write |
| Conformance | Cannot be proved — only disproved. Nobody is in a position to state "this conforms" |
| Validation | Valid only within the rules a validator actually implements. "No violations" means "nothing could be disproved by that rule set" |
| Observation | A fact about what the file contains. Carries no pass/fail (everything the reader returns) |
| Verdict | Pass/fail against a standard or policy (what verify returns). **It does not follow automatically from observations** |

### Assertion strength — T1 / T2 / T3

How strongly a verification result may be stated depends on **whether the normative text is at hand**. verify's output carries this tier.

| Tier | Standard | How strongly you may speak | Why |
|---|---|---|---|
| T1 | ISO 32000-1/-2, ISO 14289 (PDF/UA) | Quote the clause and state it plainly | In the corpus; the text can be cited |
| T2 | ISO 19005 (PDF/A) | Say only "veraPDF judged this COMPLIANT" | Outside the corpus; the verdict is delegated to veraPDF |
| T3 | ETSI EN 319 142 (PAdES) | Report a structural observation — "structure matching B-LT". **Never "conforms"** | Outside the corpus, and no third-party validator exists |

T3 reports carry `normativeBasis: "T3"`, making "this is an observation" machine-readable.

### basis — the grounds for a rectangle

When the reader returns a rectangle, `basis` says **where the coordinates came from** — the mechanism for never returning claims of different strength with the same face
([locate_objects](/mcp/pdf-reader#locate-objects) / [extract_structured_text](/mcp/pdf-reader#extract-structured-text) with `include_bbox`).

| basis | Meaning | Strength |
|---|---|---|
| `annotation-rect` | The annotation's own `/Rect` | Exact |
| `layout-attribute-bbox` | The `/BBox` the file **declares** (ISO 32000-2 Table 379) | Self-reported, not measured |
| `text-extent` | **Measured** from the element's text (baseline + ascent/descent = the line box) | Measured, but images and vector art contribute nothing |
| `page-box` | The object is a page; its crop / media box | Exact, but page-grained |
| `page-content-stream` | The object draws the page. The rectangle is **the whole page**, not the changed part | Coarse |
| `page-resource` | A font, image or other resource. **No rectangle exists** (`rect: null`) | Not applicable |

## Standards and technical terms

| Term | Definition |
|---|---|
| PAdES | Long-term signature profiles for PDF (ETSI EN 319 142). Four levels: B-B / B-T / B-LT / B-LTA |
| LTV | Long-Term Validation. Stores revocation data in the document so it stays verifiable after the certificates expire |
| DSS | Document Security Store. The dictionary holding LTV validation data (certificates, OCSP, CRL) |
| DocMDP | The permission level of a certification signature (ISO 32000-2 Table 257). P=1 permits nothing / P=2 form fill-in and signing / P=3 additionally annotation operations |
| Incremental update | An update appended to the end of the file (ISO 32000-2 §7.5.6). **A legitimate PDF operation** — it does not by itself mean tampering |
| Trust anchor | The certificate a signer's chain is evaluated against. **Without one, "valid" means only that the cryptography checks out** |
| Tagged PDF | A PDF with a structure tree (StructTreeRoot) that makes logical content order and roles machine-readable. The precondition of PDF/UA |
| Artifact | Page decoration outside the logical content (page numbers, running heads). ISO 32000-2 §14.8.2.5 NOTE 3 places it outside reading order. **Not the everyday "artifact/deliverable"** |
| ActualText | **Replacement** text for a run of glyphs (ISO 32000-2 §14.9.4). Makes ligatures and hyphenation-fixed words read as they look. Not a description |
| Alt | A **description** of content that has no text (§14.9.3). Unlike ActualText, it must never be mixed into the body |
| veraPDF | The open-source PDF/A and PDF/UA validator the family delegates its T2 verdicts to |

## Verdict and operational terms

| Term | Definition |
|---|---|
| 4-value verdict | The policy verdict `evaluate_policy` returns: `trust_and_use` (usable as-is) / `use_with_caution` (usable with caveats) / `human_review_required` / `reject`. **The same facts and profile always yield the same value** |
| firedRules | The IDs and reasons of the rules that fired. **Use them to explain the outcome, never to override it** |
| advisory | A recommendation that does not affect the verdict. **Their absence does not mean a pass** |
| needs_external_fact | One of `validate_clauses`' states: a fact outside the file was not supplied, so **no decision was made** (never defaulted to pass) |
| trace | A failure mark in `validate_clauses`: the clause binds the PDF **processor**, so the file shows that someone broke it — not necessarily the last writer |
| indeterminate | Neither disproved nor established. **Not the same as "fine"** (e.g. `verify_integrity`'s violationAssessment) |

## Related pages

- [Architecture & Responsibilities](/guide/architecture) — the four-layer model and assertion strength
- [How to Read ISO Specs](/reference/iso-reading-primer) — telling NOTE, shall and definitions apart
