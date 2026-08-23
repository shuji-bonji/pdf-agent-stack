---
description: Three levels of building a PDF-specialist agent — connecting MCPs, orchestrating with Skills, defining focused subagents, and notes for local LLMs
---

# Building PDF Agents

Three levels of assembling PDF Agent Stack into a "PDF-specialist agent".

## Lv1 — Just connect the MCPs

Registering the four servers is enough for each server's self-declared **MCP instructions** (its statement of responsibility boundaries) to take effect. The reader says "I observe, I do not judge"; verify says "I can find broken rules, never prove the file meets the standard"; the writer says "I can write a label, cannot make the file meet the standard" — the servers are designed so that an agent naturally stays inside these boundaries.

## Lv2 — Orchestrate with Skills

With [pdf-trust](/skills/pdf-trust) / [pdf-publish](/skills/pdf-publish) installed, requests like "Can I trust this PDF?" or "Deliver this as PDF/UA" get a fixed choreography: which MCPs to call in which order, how to read the verdicts, and what the report looks like.

## Lv3 — Focused subagents

Define subagents with a narrow purpose. Example: `pdf-auditor`, dedicated to incoming audits.

```markdown
---
name: pdf-auditor
description: Audits the trustworthiness of incoming PDFs. Does no editing beyond the audit.
tools: mcp__pdf-verify__*, mcp__pdf-reader__*
---

You are a PDF intake-audit specialist.

## Responsibility boundaries
- Leave the verdict to pdf-verify's evaluate_policy; never override it
- Never infer authenticity from reader observations
- Never judge the truth of the content — only originality and integrity

## Assertion strength
- T1 (ISO 32000 / PDF/UA): quote the clause and state it plainly
- T2 (PDF/A): say only "veraPDF judged it COMPLIANT"
- T3 (PAdES): report as structural observation; never write "conforms"
```

Key points:

- **Restrict tools** — an audit agent gets no writer. Limiting capability is what buys reliability
- **Keep judgment logic out of the prompt** — the judge is code (evaluate_policy), the narrative is the LLM
- **Put assertion strength in the prompt** — it becomes the calibration standard for output

## Applying this with local LLMs

Of the three levels, **the principles are model-independent, but Lv1's premise inverts**.

- What carries over unchanged — "the judge is code, the narrative is the LLM", restricting tools, assertion strength. Delegating verdicts to `evaluate_policy` becomes *more* valuable as the model gets smaller
- What breaks down — Lv1's "the agent naturally honors MCP instructions" depends on a large model that respects instructions. Small models often garble the tool-call format itself
- What needs re-reading — Skills / subagent definitions are Claude Code vessels. Locally, substitute a system prompt plus a **deterministic pipeline that fixes the call order in code** instead of trusting the LLM with it

In practice, a local setup starts not from Lv1 but from a Lv3-like construction: restrict, fix, and judge in code.

## Operational lessons

- **A label ≠ meeting the standard**: after writing a label with `ensure_pdfa`, always measure with `validate_conformance`
- **Green tests can be vacuous**: always check *what range* a passing verification actually covered (missing fixtures, guard clauses that skip the judgment)
- **Check signatures before editing**: editing a signed PDF breaks its signature. The writer refuses unless `preserveSignatures` / `allowBreakingSignatures` is explicit

## Distributing as a plugin

Bundling MCP + Skill + subagent definitions into one plugin makes them team-distributable via a marketplace. See the pdf-trust / pdf-publish plugins for working examples.
