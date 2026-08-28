---
description: The four MCP servers and their layers — pdf-spec (canon) / pdf-reader (substance) / pdf-verify (judgment) / pdf-writer (creation)
---

# MCP Servers

| Server | Layer | ver | Tools | One-line definition |
|---|---|---|---|---|
| [pdf-spec-mcp](/mcp/pdf-spec) | Canon | 0.6.0 | 8 | What the specification requires |
| [pdf-reader-mcp](/mcp/pdf-reader) | Substance | 0.13.0 | 19 | What is inside — **and where it is** |
| [pdf-verify-mcp](/mcp/pdf-verify) | Authenticity & conformance | 0.18.0 | 7 | Is it genuine, and does it meet the standard |
| [pdf-writer-mcp](/mcp/pdf-writer) | Creation | 0.21.0 | 20 | Written the way the spec says |

## Which one do I use? (reverse lookup)

| What you want | Server | Tools |
|---|---|---|
| Extract text / tables from a PDF | reader | read_text / extract_tables |
| Check whether a signature is genuine | verify | verify_signatures |
| Look for tampering | verify | verify_integrity |
| Judge PDF/A conformance | verify | validate_conformance |
| Look up spec clauses | spec | search_spec / get_section |
| Create a PDF from Markdown | writer | create_markdown_pdf |
| **Annotate this paragraph** (coordinates needed) | reader → writer | extract_structured_text (`include_bbox`) → add_annotation |
| **Point at a changed object** (coordinates needed) | verify → reader → writer | verify_integrity → locate_objects → add_annotation |
| Overall trust verdict | verify + Skill | evaluate_policy + [pdf-trust](/skills/pdf-trust) |

::: tip All server pages share the same structure
Responsibility → Installation → Environment variables → Tool list → Per-tool manual → Error codes → Constraints
:::
