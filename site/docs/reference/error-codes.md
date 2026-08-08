---
description: pdf-writer's structured error codes (code / next_actions / retryable)
---

# Error Codes

## pdf-writer (structured errors: code / next_actions / retryable)

| Code | Meaning / what to do |
|---|---|
| `INVALID_ARGUMENT` | Invalid argument |
| `DOC_NOT_FOUND` | Input PDF not found |
| `FONT_NOT_FOUND` | Bad font path |
| `INVALID_PDF` | Broken PDF |
| `ENCRYPTED_PDF` | Encrypted PDFs cannot be edited |
| `UNSUPPORTED_PDF_FEATURE` | Unsupported feature such as XFA |
| `FILE_TOO_LARGE` | Size limit exceeded |
| `SIGNED_PDF` | Signature guard → `preserveSignatures` / `allowBreakingSignatures` |
| `TAGGED_PDF` | Tag guard → `allowBreakingTags` |
| `FONT_REQUIRED` | CJK output needs a font → `fontPath` / `PDF_WRITER_FONT` |
| `MISSING_GLYPH` | Missing glyph → `onMissingGlyph` |
| `INTERNAL_ERROR` | Internal error |

<!-- TODO: consolidate reader / verify / spec error codes in Phase 2 -->
