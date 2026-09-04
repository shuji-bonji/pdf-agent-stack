---
description: Three levels of building a PDF-specialist agent — connecting MCPs, orchestrating with Skills, defining focused subagents, and notes for local LLMs
---

# Building PDF Agents

To assemble PDF Agent Stack as a "PDF-specialist agent", there are three levels.

## Lv1 — Just connect the MCPs

Registering the four servers puts each server's **MCP instructions** (its statement of responsibility boundaries) onto the host. pdf-reader-mcp declares "observation, not judgment"; pdf-verify-mcp declares "I can find broken rules, never prove the file meets the standard"; pdf-writer-mcp declares "I can write a label, cannot make the file meet the standard". A large model tends to stay inside those boundaries after reading the MCP instructions. Registering the servers does not by itself fix the call order.

## Lv2 — Orchestrate with Skills

With [pdf-trust](/skills/pdf-trust) / [pdf-publish](/skills/pdf-publish) in place, requests like "Can I trust this PDF?" or "Deliver this as PDF/UA" get a fixed call order, a fixed way to read the verdicts, and a fixed report shape.

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

The points are as follows.

- **Restrict which tools you pass** — do not give an audit agent `pdf-writer`. If it cannot edit, it cannot change the file during the audit
- **Keep judgment logic out of the prompt** — the verdict is what `evaluate_policy` returns. The LLM writes the explanation only
- **Put assertion strength in the prompt** — it becomes the standard for checking output against T1 / T2 / T3

## Applying this with local LLMs

Placing the verdict in `evaluate_policy`'s return value, not passing `pdf-writer` to an audit, and keeping assertions at T1 / T2 / T3 is the same for a large cloud model and a small local model. Only Lv1 has a different premise. The premise that a large model honours MCP instructions does not hold for a small local model.

- Placing the verdict in `evaluate_policy`, restricting tools, keeping T1 / T2 / T3 — the smaller the model, the more it matters to copy `evaluate_policy`'s return value as the verdict
- Lv1's "stay inside the boundaries after reading MCP instructions" assumes Claude Code plus a large model. On a small local model the tool-call JSON itself breaks. Instructions alone cannot stop the model crossing into pdf-reader-mcp / pdf-writer-mcp
- Skill files and subagent definitions are the format Claude Code reads. A local LLM runtime does not read those files as Skills. Locally, write a system prompt and code that fixes the call order (same input, same result; e.g. [`pdf-agent-pipeline`](https://github.com/shuji-bonji/pdf-agent-pipeline))

Locally you write what an Lv3 subagent definition already does (restrict tools, fix call order, put the verdict in code) into a system prompt and pipeline code. Only the place you fix them differs.

## Operational lessons

- **`ensure_pdfa` writes an XMP label.** Whether the file meets the standard is measured with `validate_conformance`
- **Tests can pass without the judgment having run.** Check the range that actually ran (missing fixtures, guard clauses that skip the judgment)
- **Check signatures before editing.** Editing a signed PDF invalidates the signature. pdf-writer-mcp does not proceed unless `preserveSignatures` / `allowBreakingSignatures` is explicit

## Distributing as a plugin

Bundling MCP + Skill + subagent definitions into one plugin makes them team-distributable via a marketplace. See the pdf-trust / pdf-publish plugins for working examples.
