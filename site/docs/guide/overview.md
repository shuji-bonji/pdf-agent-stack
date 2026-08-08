---
description: The big picture of PDF Agent Stack (PDF Family) — four MCP servers, two Skills, and why observation, judgment, creation and norms are kept apart
---

# What is PDF Agent Stack?

PDF Family is the collective name for four independent MCP servers and two Skills that give AI agents the ability to **read, verify, and write PDFs — grounded in the spec**.

## Components

| Kind | Name | One-line definition | npm / distribution |
|---|---|---|---|
| MCP | [pdf-spec-mcp](/mcp/pdf-spec) | What the specification requires (ISO 32000 + 17 more documents) | `@shuji-bonji/pdf-spec-mcp` |
| MCP | [pdf-reader-mcp](/mcp/pdf-reader) | What is inside, and where it is (18 observation tools) | `@shuji-bonji/pdf-reader-mcp` |
| MCP | [pdf-verify-mcp](/mcp/pdf-verify) | Is it genuine, and does it meet the standard (7 judgment tools) | `@shuji-bonji/pdf-verify-mcp` |
| MCP | [pdf-writer-mcp](/mcp/pdf-writer) | Can we write it the way the spec says (20 creation/editing tools) | `@shuji-bonji/pdf-writer-mcp` |
| Skill | [pdf-trust](/skills/pdf-trust) | Orchestrates incoming audits (Trust Report) | GitHub |
| Skill | [pdf-publish](/skills/pdf-publish) | Orchestrates quality-gated delivery (Publish Report) | GitHub |

## Why are they separate?

Because mixing **observation**, **judgment**, **creation** and **norms** makes it easy to lie. The moment a reader starts declaring pass/fail, you get "probably genuine" without any cryptographic verification. The moment a writer claims it "can produce a conformant PDF", declaration gets confused with conformance. By separating responsibilities, the Family keeps **the trustworthy range of each answer** explicit.

See [Architecture & Responsibilities](/guide/architecture) for the details.

## Try it in 5 minutes

1. Set up pdf-reader following [Getting Started](/guide/getting-started)
2. Point it at a local PDF: "Show me this PDF's metadata and structure"
3. For a signed PDF, add pdf-verify: "Has this PDF been tampered with?"
4. Move on to real workflows in [Use Cases](/use-cases/)
