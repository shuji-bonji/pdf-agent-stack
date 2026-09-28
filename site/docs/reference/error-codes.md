---
description: Structured error codes of pdf-writer and pdf-verify
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

## pdf-verify (structured errors: code / message / suggestion)

A tool result with `isError: true` whose text is `{ "error": true, "code", "message", "suggestion" }`. The codes are pdf-verify's own. `ENCRYPTED_PDF` in particular means something different here from pdf-writer's: pdf-writer refuses to **edit** the file, while pdf-verify refuses to hand the file to **veraPDF**.

| Code | Meaning / what to do |
|---|---|
| `MISSING_PATH` / `RELATIVE_PATH` / `FILE_NOT_FOUND` / `NOT_A_FILE` | Bad `file_path` → pass an absolute path to an existing regular file |
| `FILE_TOO_LARGE` | Size limit exceeded |
| `PARSE_FAILED` | The file's structure violates a clause of ISO 32000 and could not be read (from v0.20.0; earlier this came back as `INTERNAL_ERROR`). This is a finding about the document, not a server failure — do not file it under "checks not performed" |
| `INVALID_BYTE_RANGE` | A signature's `/ByteRange` is not 4 numbers or points outside the file |
| `INVALID_FLAVOUR` | Unknown `flavour` for `validate_conformance` (PDF/A-4 has no `pdfa-4b`; PDF/UA takes `pdfua-1` / `pdfua-2`) |
| `ENCRYPTED_PDF` | `validate_conformance` did not hand an encrypted file to veraPDF. For PDF/A the file is out of the standard anyway (ISO 19005-1, 6.1.3) — record the veraPDF run as not performed (from v0.26.1; earlier `INTERNAL_ERROR`). For PDF/UA of a password-protected file → pass `password` |
| `WRONG_PASSWORD` | The supplied password is wrong, or the security handler is not the Standard one |
| `VERAPDF_NOT_FOUND` / `VERAPDF_NOT_AVAILABLE` | veraPDF is not installed or cannot run → set `PDF_VERIFY_VERAPDF`, or use `engine: "native"` (a subset that cannot certify conformance) |
| `VERAPDF_NO_RESULT` | veraPDF ran but returned no validation result (from v0.26.1). Neither a pass nor `INTERNAL_ERROR` |
| `INTERNAL_ERROR` | Internal error |

<!-- TODO: consolidate reader / spec error codes in Phase 2 -->
