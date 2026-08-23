---
description: Glossary — declaration vs conformance vs validation, assertion strength T1/T2/T3, basis (grounds for a rectangle), PAdES, LTV, DocMDP, veraPDF, the 4-value verdict
---

# Glossary

Terms that appear in PDF Agent Stack's documentation and tool output. Definitions follow the ISO usage wherever the standards define the term.

## Terms about the strength of a claim

Keeping these three apart is the design philosophy of the whole of PDF Agent Stack → [Architecture & Responsibilities](/guide/architecture).

| Term | Definition |
|---|---|
| Declaration | A label the file wrote about itself (pdfaid / pdfuaid in XMP: "I am PDF/A"). Writing it is not evidence. This is what the writer's `ensure_pdfa` / `ensure_tagged` write |
| Conformance | Whether the file actually meets the standard. There is no way to prove it in full; you can only find where it breaks the rules. Nobody is in a position to state "this conforms" |
| Validation | What a validator (veraPDF and the like) reports against the checks it implements. A pass means "this inspection did not fail", not "the file conforms to the standard" |
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
| veraPDF | The open-source PDF/A and PDF/UA validator PDF Agent Stack delegates its T2 verdicts to |

## Verdict and operational terms

| Term | Definition |
|---|---|
| 4-value verdict | The policy verdict `evaluate_policy` returns: `trust_and_use` (usable as-is) / `use_with_caution` (usable with caveats) / `human_review_required` / `reject`. **The same facts and profile always yield the same value** |
| firedRules | The IDs and reasons of the rules that fired. **Use them to explain the outcome, never to override it** |
| advisory | A recommendation that does not affect the verdict. **Their absence does not mean a pass** |
| needs_external_fact | One of `validate_clauses`' states: a fact outside the file was not supplied, so **no decision was made** (never defaulted to pass) |
| trace | A failure mark in `validate_clauses`: the clause binds the PDF **processor**, so the file shows that someone broke it — not necessarily the last writer |
| indeterminate | Neither disproved nor established. **Not the same as "fine"** (e.g. `verify_integrity`'s violationAssessment) |

## Base vocabulary of this site (AI / engineering)

Not PDF-standard terms, but words this site uses without in-line explanation.

| Term | Definition |
|---|---|
| MCP (Model Context Protocol) | A standard for connecting external tools to AI applications. An **MCP server** is a program providing capabilities through it |
| Skill | A procedure document an AI agent reads — standardizes tool order, result reading and reporting (also the name of the Claude feature) |
| Deterministic | Same input, same result — always. The counterpart of LLM generation, which is probabilistic and can vary |
| Rule engine | A mechanism that feeds facts through a fixed rule table to produce a verdict automatically. What `evaluate_policy` is |
| Refutation | Showing one error rather than proving correctness. You cannot prove the file meets the standard; you can only find where it breaks the rules |
| Corpus | The collection of specification originals kept at hand; the ground pdf-spec searches and quotes from |
| Narrative | The explanatory prose. "The judge is code, the narrative is the LLM" = code decides, the LLM only explains |
| Fallback | Switching to an alternative when the primary means is unavailable (e.g. built-in rules when veraPDF is absent) |
| Degraded operation | Continuing with reduced scope when some tools are missing — always labelling the missing items "not performed" |
| Token | The unit in which an LLM processes text (roughly a few characters); the unit of volume and cost |
| Context | The working memory an LLM can read at once. "Wasting context" on this site means this |
| Structured error | A machine-readable error carrying `code` (kind), `next_actions` (what to do next) and `retryable`. Lets an AI recover without guessing at message text |

## How to read the diagrams (shape legend)

The structural diagrams (Mermaid) on this site distinguish element kinds by shape.

| Shape | Meaning |
|---|---|
| Rounded | Actor (the AI agent) or end state (delivery, use, …) |
| Hexagon | Skill (procedure & orchestration) |
| Double-framed | MCP server |
| Parallelogram | Input (the PDF under examination, …) |
| Cylinder | External resource (spec corpus, veraPDF) |
| Diamond | Decision / branch |

## Related pages

- [Architecture & Responsibilities](/guide/architecture) — the four-layer model and assertion strength
- [How to Read ISO Specs](/reference/iso-reading-primer) — telling NOTE, shall and definitions apart
