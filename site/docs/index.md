---
layout: home
description: PDF tooling for AI agents — four MCP servers and three skills to read, verify, and write PDFs, grounded in the ISO 32000 spec.

hero:
  name: PDF Agent Stack
  text: Building a PDF-expert AI agent
  tagline: Read, verify, write — grounded in the spec. Four MCP servers and three skills for AI agents.
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
  - title: pdf-spec-mcp — quotes the specification
    details: Returns clauses, definitions and requirements (shall / should / may) from ISO 32000 and 16 more documents. Never opens the PDF under examination.
    link: /mcp/pdf-spec
  - title: pdf-reader-mcp — returns what is in the file
    details: 20 tools that return text, tables, the structure tree, signature fields and XMP declarations, with their position on the page. Never decides whether the file conforms.
    link: /mcp/pdf-reader
  - title: pdf-verify-mcp — decides whether it is genuine and conformant
    details: Cryptographic signature verification, tamper detection, PAdES level observation, PDF/A & PDF/UA validation (veraPDF). evaluate_policy returns one of four verdicts (trust_and_use / use_with_caution / human_review_required / reject).
    link: /mcp/pdf-verify
  - title: pdf-writer-mcp — creates and edits PDFs
    details: Creates PDFs from text / Markdown / tables and edits them with 20 tools (merge, split, annotations, metadata, …). CJK font embedding built in.
    link: /mcp/pdf-writer
  - title: pdf-trust skill — audits an incoming PDF
    details: Calls pdf-verify, pdf-reader and pdf-spec in order, checks signatures, tampering and conformance, and returns a Trust Report with a four-value verdict.
    link: /skills/pdf-trust
  - title: pdf-publish skill — verifies before delivering
    details: Writes with pdf-writer, reads back with pdf-reader, scores with pdf-verify (veraPDF). Nothing that fails the quality gate is delivered; the result goes into a Publish Report.
    link: /skills/pdf-publish
  - title: pdf-read skill — reads what you need from a large PDF
    details: Measures the document first, then picks how to read it (structure tree / search then read / render as image), and writes what could not be read into a Read Report.
    link: /skills/pdf-read
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

Start with pdf-reader alone, then add the other servers as you need them.
→ [Getting Started (env / veraPDF / fonts)](/guide/getting-started)
