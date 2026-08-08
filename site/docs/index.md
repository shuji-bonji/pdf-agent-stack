---
layout: home

hero:
  name: PDF Agent Stack
  text: Building a PDF-expert AI agent
  tagline: Read, verify, write — grounded in the spec. Four MCP servers and two skills for AI agents.
  image:
    src: /images/logo.svg
    alt: PDF Agent Stack
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: What is PDF Agent Stack?
      link: /guide/overview

features:
  - title: pdf-spec-mcp (norm)
    details: Specification reference over ISO 32000 and 16 more documents. Answers what the spec requires. Never opens a file.
    link: /mcp/pdf-spec
  - title: pdf-reader-mcp (fact)
    details: 17 tools that observe what is inside a PDF — text, tables, structure tree, signature fields. Never passes judgment.
    link: /mcp/pdf-reader
  - title: pdf-verify-mcp (judgment)
    details: Cryptographic signature verification, tamper detection, PAdES level, PDF/A & PDF/UA validation, deterministic policy verdicts.
    link: /mcp/pdf-verify
  - title: pdf-writer-mcp (production)
    details: Creates PDFs from text / Markdown / tables and edits them with 20 tools. CJK font embedding built in.
    link: /mcp/pdf-writer
  - title: pdf-trust skill (intake gate)
    details: Orchestrates trust audits of incoming PDFs. Returns a Trust Report with a four-value verdict.
    link: /skills/pdf-trust
  - title: pdf-publish skill (delivery gate)
    details: Quality-gated delivery pipeline — write → read-back → verify, with a Publish Report.
    link: /skills/pdf-publish
---

## Quick start

```jsonc
{
  "mcpServers": {
    "pdf-reader": {
      "command": "npx",
      "args": ["-y", "@shuji-bonji/pdf-reader-mcp@latest"]
    }
  }
}
```

Start with pdf-reader alone, then grow into the family as you need it.
→ [Getting Started (env / veraPDF / fonts)](/guide/getting-started)
