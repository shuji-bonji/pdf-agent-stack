---
description: The big picture of PDF Agent Stack (PDF Family) — four MCP servers, two Skills, and why observation, judgment, creation and norms are kept apart
---

# What is PDF Agent Stack?

PDF Family is the collective name for four independent MCP servers and two Skills that give AI agents the ability to **read, verify, and write PDFs — grounded in the spec**.

## Components

| Kind | Name | Role | Distribution |
|---|---|---|---|
| MCP | [pdf-spec-mcp](/mcp/pdf-spec) | Consult the PDF specification (ISO 32000 + 17 more documents) | [npm](https://www.npmjs.com/package/@shuji-bonji/pdf-spec-mcp) · [GitHub](https://github.com/shuji-bonji/pdf-spec-mcp) |
| MCP | [pdf-reader-mcp](/mcp/pdf-reader) | Observe a PDF's internal state (18 observation tools) | [npm](https://www.npmjs.com/package/@shuji-bonji/pdf-reader-mcp) · [GitHub](https://github.com/shuji-bonji/pdf-reader-mcp) |
| MCP | [pdf-verify-mcp](/mcp/pdf-verify) | Verify authenticity and conformance (7 judgment tools) | [npm](https://www.npmjs.com/package/@shuji-bonji/pdf-verify-mcp) · [GitHub](https://github.com/shuji-bonji/pdf-verify-mcp) |
| MCP | [pdf-writer-mcp](/mcp/pdf-writer) | Generate PDFs following the spec (20 creation/editing tools) | [npm](https://www.npmjs.com/package/@shuji-bonji/pdf-writer-mcp) · [GitHub](https://github.com/shuji-bonji/pdf-writer-mcp) |
| Skill | [pdf-trust](/skills/pdf-trust) | Vet incoming PDFs and confirm trust (Trust Report) | [GitHub](https://github.com/shuji-bonji/pdf-trust-skill) |
| Skill | [pdf-publish](/skills/pdf-publish) | Generate through a quality-gated pipeline (Publish Report) | [GitHub](https://github.com/shuji-bonji/pdf-publish-skill) |

The MCPs are accompanied by [pdf-constraints](https://github.com/shuji-bonji/pdf-constraints) ([npm](https://www.npmjs.com/package/@shuji-bonji/pdf-constraints)), the data library behind verify's clause checks. It maps ISO 32000 clauses to machine-checkable constraint tables and can be used on its own.

::: info On architecture and responsibilities
How these fit together and run — see [Architecture & Responsibilities](/guide/architecture) for the details.
:::

An agent may call the MCPs directly, or leave the orchestration to a Skill. With the Skills installed, the **call order, how to read the verdicts, and the report format** are all fixed for you.

## Try it in 5 minutes

1. Set up pdf-reader following [Getting Started](/guide/getting-started)
2. Point it at a local PDF: "Show me this PDF's metadata and structure"
3. For a signed PDF, add pdf-verify: "Has this PDF been tampered with?"
4. Move on to real workflows in [Use Cases](/use-cases/)
