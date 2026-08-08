---
description: The four-layer model and each MCP's responsibility boundary — independent MCPs orchestrated by Skills, declaration ≠ conformance, assertion strength T1/T2/T3, the judge is code and the narrative is the LLM
---

# Architecture & Responsibilities

PDF Family is built as **independent MCPs × Skill orchestration**. Each MCP is self-contained with no dependency on the others; orchestrating multiple servers (procedure and knowledge) is the Skills' job.

## The four-layer model

```mermaid
graph TB
  subgraph Skills["Skill layer (orchestration)"]
    TRUST["pdf-trust<br>incoming audit (intake gate)"]
    PUBLISH["pdf-publish<br>delivery pipeline (exit gate)"]
  end
  subgraph MCPs["MCP layer (independent, self-contained)"]
    SPEC["pdf-spec-mcp<br>canon (norm)<br>what the spec requires"]
    READER["pdf-reader-mcp<br>substance (fact)<br>what is inside"]
    VERIFY["pdf-verify-mcp<br>authenticity & conformance (judgment)<br>genuine and up to standard?"]
    WRITER["pdf-writer-mcp<br>creation (production)<br>written the way the spec says"]
  end
  TRUST -.->|orchestrates| VERIFY & READER & SPEC
  PUBLISH -.->|orchestrates| WRITER & READER & VERIFY
```

| Layer | Server | Returns | Never does |
|---|---|---|---|
| Canon | pdf-spec | Clauses and requirements (shall/should/may) | Never opens a file. Never judges conformance |
| Substance | pdf-reader | Observations (text, structure, signature fields) | **Never says pass/fail**. No cryptographic verification |
| Authenticity & conformance | pdf-verify | Verdicts (signatures, tampering, PDF/A, PDF/UA, 4-value policy) | **Never proves — it can only disprove** |
| Creation | pdf-writer | New and edited PDFs | Never signs. Can write a declaration but **cannot make a file conform** |

## The boundary rule (one line)

> If it returns compliant / valid / pass-fail against an ISO standard, it belongs to **verify**; if it only returns observations, it belongs to **reader**.

## Declaration, conformance, validation

This distinction runs through the whole Family.

- **Declaration** — pdfaid / pdfuaid in XMP. The document's claim about itself; proves nothing
- **Conformance** — nobody can prove it; it can only be disproved
- **Validation** — valid only within the rules a validator actually implements

That is why the writer's `ensure_pdfa` is a tool that *writes a declaration*, and the Family's rule is: whatever you declare, you measure with verify's `validate_conformance`.

## Two gates: intake and exit

```mermaid
graph LR
  IN[Incoming PDF] --> TRUST[pdf-trust<br>incoming audit] --> USE[use / archive]
  MAKE[PDF to produce] --> PUBLISH[pdf-publish<br>write → read-back → verify] --> OUT[delivery]
  TRUST & PUBLISH -.->|axis of judgment| V[pdf-verify-mcp]
```

verify is the gatekeeper standing at both the intake (audit) and the exit (delivery). The 4-value verdict (trust_and_use / use_with_caution / human_review_required / reject) is decided by `evaluate_policy`'s deterministic rule engine; the LLM only supplies the explanation and recommended actions — **the judge is code, the narrative is the LLM**.

## Assertion strength (T1/T2/T3)

How strongly a verification result may be stated depends on whether the normative text is at hand.

| Tier | Standard | How strongly you may speak |
|---|---|---|
| T1 | ISO 32000-1/-2, ISO 14289 (PDF/UA) | Quote the clause and state it plainly |
| T2 | ISO 19005 (PDF/A) | Say only "veraPDF judged this COMPLIANT" |
| T3 | ETSI PAdES | Report a structural observation — "structure matching B-LT" — never "conforms" |

The prose on this site follows the same rule.
