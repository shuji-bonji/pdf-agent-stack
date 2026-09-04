---
description: The whole picture of PDF Agent Stack and each MCP's responsibility boundary — independent MCPs orchestrated by Skills, the four-layer model, a label ≠ meeting the standard, assertion strength T1/T2/T3, the judge is code and the narrative is the LLM
---

# Architecture & Responsibilities

PDF Agent Stack is built as **independent MCPs × Skill orchestration**. Each MCP is self-contained with no dependency on the others; orchestrating multiple servers (procedure and knowledge) is the Skills' job.

## The whole picture

```mermaid
graph LR
  AGENT(["AI agent<br>(Claude Code / Desktop, …)"])

  subgraph FAMILY["PDF Agent Stack"]
    direction TB
    subgraph SKILL["Skills — procedure & orchestration"]
      TRUST{{"pdf-trust<br>incoming audit"}}
      PUBLISH{{"pdf-publish<br>delivery pipeline"}}
      READ{{"pdf-read<br>reading pipeline"}}
    end
    subgraph MCP["MCPs — computation & cryptography (each server independent)"]
      SPEC[["pdf-spec<br>canon (norm)"]]
      READER[["pdf-reader<br>substance (fact)"]]
      VERIFY[["pdf-verify<br>judgment"]]
      WRITER[["pdf-writer<br>creation"]]
    end
    SKILL --> MCP
  end

  IN[/"Incoming PDF"/] --> AGENT
  NEED[/"PDF to produce"/] --> AGENT
  DOC[/"PDF to read"/] --> AGENT
  AGENT <--> FAMILY
  FAMILY --> OUT(["Trust / Publish / Read Report<br>verified, deliverable PDFs and content"])

  SPECDOC[("ISO 32000<br>and 16 more documents")] -.-> SPEC
  VERA[("veraPDF")] -.-> VERIFY
```

Shapes indicate the kind of each element (→ [shape legend](/reference/glossary#how-to-read-the-diagrams-shape-legend)).

An agent may call the MCPs directly, or leave the orchestration to a Skill. With the Skills installed, the **call order, how to read the verdicts, and the report format** are all fixed for you.

There are only two external dependencies: pdf-spec needs the corpus of specification PDFs (not bundled, as they may not be redistributed), and pdf-verify delegates PDF/A and PDF/UA verdicts to veraPDF. The reader and the writer depend on nothing outside themselves.

## The four-layer model — who orchestrates what

```mermaid
graph TB
  subgraph Skills["Skill layer (orchestration)"]
    TRUST{{"pdf-trust<br>incoming audit (intake gate)"}}
    PUBLISH{{"pdf-publish<br>delivery pipeline (exit gate)"}}
    READ{{"pdf-read<br>reading pipeline"}}
  end
  subgraph MCPs["MCP layer (independent, self-contained)"]
    SPEC[["pdf-spec-mcp<br>canon (norm)<br>what the spec requires"]]
    READER[["pdf-reader-mcp<br>substance (fact)<br>what is inside"]]
    VERIFY[["pdf-verify-mcp<br>authenticity & conformance (judgment)<br>genuine and up to standard?"]]
    WRITER[["pdf-writer-mcp<br>creation (production)<br>written the way the spec says"]]
  end
  TRUST -.->|orchestrates| VERIFY & READER & SPEC
  PUBLISH -.->|orchestrates| WRITER & READER & VERIFY
  READ -.->|orchestrates| READER
```

| Layer | Server | Returns | Never does |
|---|---|---|---|
| Canon | pdf-spec | Clauses and requirements (shall/should/may) | Never opens the PDF under examination (it reads only its own spec corpus). Never judges conformance |
| Substance | pdf-reader | Observations (text, structure, signature fields) | **Never says pass/fail**. No cryptographic verification |
| Authenticity & conformance | pdf-verify | Verdicts (signatures, tampering, PDF/A, PDF/UA, 4-value policy) | **Never proves the file meets the standard — it can only find where it breaks the rules** |
| Creation | pdf-writer | New and edited PDFs | Never signs. Can write a label but **cannot make the file meet the standard** |

## The boundary rule (one line)

> If it returns compliant / valid / pass-fail against an ISO standard, it belongs to **verify**; if it only returns observations, it belongs to **reader**.

## Declaration, conformance, validation

This distinction runs through the whole of PDF Agent Stack.

- **Declaration** — A label the file wrote about itself. "I am PDF/A" in the metadata. Writing it is not evidence
- **Conformance** — Whether the file actually meets the standard. There is no way to prove it in full; you can only find where it breaks the rules
- **Validation** — What a validator (veraPDF and the like) reports against the checks it implements. A pass means "this inspection did not fail", not "the file conforms to the standard"

That is why the writer's `ensure_pdfa` is a tool that *writes a label*, and the rule across PDF Agent Stack is: whatever you label, you measure with verify's `validate_conformance`.

## Two gates: intake and exit

Two of the three inputs in the diagram above (an incoming PDF, a PDF to produce) each pass through their own gate.

| Gate | Skill | Flow |
|---|---|---|
| Intake (audit) | [pdf-trust](/skills/pdf-trust) | incoming PDF → audit → use / archive |
| Exit (delivery) | [pdf-publish](/skills/pdf-publish) | PDF to produce → write → read-back → verify → delivery |

The third input — a PDF you only want to read — passes through no gate: [pdf-read](/skills/pdf-read) orchestrates the reading and closes with a Read Report saying what was read and what could not be. There is nothing to admit or ship, so there is nothing for verify to decide.

verify is the gatekeeper standing at both the intake (audit) and the exit (delivery). The 4-value verdict (trust_and_use / use_with_caution / human_review_required / reject) is decided by `evaluate_policy`'s deterministic rule engine; the LLM only supplies the explanation and recommended actions — **the judge is code, the narrative is the LLM**.

## Assertion strength (T1/T2/T3)

How strongly a verification result may be stated depends on whether the normative text is at hand.

| Tier | Standard | How strongly you may speak |
|---|---|---|
| T1 | ISO 32000-1/-2, ISO 14289 (PDF/UA) | Quote the clause and state it plainly |
| T2 | ISO 19005 (PDF/A) | Say only "veraPDF judged this COMPLIANT" |
| T3 | ETSI PAdES | Report a structural observation — "structure matching B-LT" — never "conforms" |

The prose on this site follows the same rule.
