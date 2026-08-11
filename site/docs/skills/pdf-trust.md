---
description: The Skill that orchestrates trust audits of incoming PDFs — an intake gate returning a Trust Report built around evaluate_policy's 4-value verdict
---

# pdf-trust — Incoming Audit

A Skill that audits whether an incoming PDF (contract, invoice, medical document, government filing, …) is **genuine, trustworthy, and untampered**, and returns a **Trust Report** with an explicit recommendation.

## Principles

1. Never judge the truth of the content — only authenticity (originality and integrity)
2. Return verification results as technical facts; the final decision belongs to the user
3. Always name the grounds for the verdict (which tool, which result)
4. **The judge is code, the narrative is the LLM** — the 4-value verdict is decided by pdf-verify's `evaluate_policy`. The Skill's job is explaining firedRules, recommending actions and citing legal grounds — never overriding the verdict

## The 4-value verdict

| Verdict | Meaning |
|---|---|
| `trust_and_use` | Usable as-is |
| `use_with_caution` | Usable with noted caveats |
| `human_review_required` | Needs human review |
| `reject` | Not acceptable |

## Required MCPs

| MCP | Required / optional | Role |
|---|---|---|
| pdf-verify (v0.7.0+) | **Required** | evaluate_policy, signature verification, tamper detection, PAdES, PDF/A (**v0.11.0+ adds PDF/A-4**: `pdfa-4` / `pdfa-4e` / `pdfa-4f` — **`pdfa-4b` does not exist**) |
| pdf-reader | Optional | Observing signature-field structure, tags, metadata |
| pdf-spec | Optional | Citing ISO 32000 grounds for deviations |
| houki-egov / houki-nta / tax-law / labor-law | Optional | Statutory grounds required by the chosen profile |

## Profiles

| Profile | Intended documents | Behaviour |
|---|---|---|
| `contract` | Contracts, NDAs, purchase orders | Signature required; unsigned → human_review_required |
| `financial` | Invoices, financial statements, tax filings | Long-term-preservation checks included |
| `legal` | Litigation materials, legal documents | Requires the full post-signing change history |
| `medical` | Referral letters, test reports | Most conservative; caution escalates to review |
| `government` | Government documents, public notices | Long-term checks included; unsigned tolerated |
| `general` | Everything else | No extra checks |

## Measured examples — all 4 verdicts (2026-08-11, real specimens)

| Specimen | Profile | Verdict | Fired rules |
|---|---|---|---|
| Self-made CA signature + **CRL embedded in the DSS**, trust anchor supplied | general | `trust_and_use` | None (valid + trusted + revocation good) |
| Japanese official gazette, 2026-08-10 issue (Cabinet Office signature + AMANO timestamp) | government | `use_with_caution` | TRUST-NOT-EVALUATED / REVOCATION-UNKNOWN |
| Same self-made specimen **without the CRL** | general | `use_with_caution` | REVOCATION-UNKNOWN |
| Unsigned invoice PDF | contract | `human_review_required` | UNSIGNED-REQUIRED (an image of a signature is not an electronic signature) |
| Specimen with one byte flipped inside the signed range | general | `reject` | POL-REJECT-INVALID (digest mismatch) |

Rows 1 and 3 differ **only in the presence of a CRL**. Supplying a trust anchor is not enough —
the best verdict is reached only once revocation is confirmed good. With the CRL covering the
signer, the PAdES structural observation also rises from B-T to **B-LTA**: one pair of specimens
shows how the rule table and LTV relate.

## Trust Report excerpt (from the gazette audit)

Beyond the verdict, Phase 2.5 (verify_integrity + locate_objects) identifies what the
"+9,938 bytes after signing" actually are:

| Object | Change | Role | Page / rect |
|---|---|---|---|
| 64 | added | form field widget | p.1 / 0,0,0,0 (invisible) |
| 65 | added | **/DocTimeStamp signature dictionary** | not referenced by any page |
| 54 | modified | AcroForm dictionary | — |

→ The post-signing change is **the application of the AMANO document timestamp itself**
(incremental updates are legal — ISO 32000-2 §7.5.6). Phase 2.5's job is lowering
"N bytes were added" to "this is what was added". The same audit also recorded: veraPDF judged
PDF/UA **NOT COMPLIANT** (236 untagged content items, 10 rules), and the reference PDF/A
measurement was recorded as "**not performed**" because veraPDF returns no result for the
encrypted document — an unmeasured check is never reported as passed.

## Installation

```sh
/plugin marketplace add shuji-bonji/claude-plugins
/plugin install pdf-verify-mcp@shuji-bonji   # required foundation
/plugin install pdf-trust@shuji-bonji
# optional: pdf-reader-mcp (locations), pdf-spec-mcp (clause citations), houki family (statutory grounds)
```

## Degraded operation

- pdf-verify not connected → the audit cannot proceed; the Skill says so and stops
- Old verify (before v0.7.0, no evaluate_policy) → falls back to the manual verdict table and labels the report "manual verdict"
- Optional MCP missing → the item is recorded as "not performed (tool not connected)" — silently dropping it would read as "checked, no findings"
- A check that could not be measured (e.g. veraPDF cannot score an encrypted PDF for PDF/A) → recorded as not performed. Undecided is not innocent
