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

<!-- TODO: profile list, Trust Report sample, trigger prompt examples (Phase 3) -->
