---
description: The structured error response shared by the four PDF family servers, the common codes, and each server's own codes
---

# Error Codes

All four servers return a failure the same way (pdf-agent-stack `docs/specs/06` §2.3): the tool
result has `isError: true`, and its text is one flat JSON object. Branch on `code`, decide whether
to retry from `retryable`, and follow `next_actions` — do not parse the English sentences.

```jsonc
{
  "error": "File not found.",          // required. One English sentence
  "code": "DOC_NOT_FOUND",             // required. A common code or the server's own code
  "retryable": false,                  // required. Can changing arguments, flags or the environment make it succeed?
  "hint": "...",                       // optional. English
  "next_actions": [                    // optional. What can be done next
    { "action": "verify_file_path", "reason": "...", "example": { "file_path": "/abs/path.pdf" } }
  ],
  "detail": { "cause": "ENOENT: ..." } // optional. Server-specific details
}
```

- `code`, `next_actions[].action` and the keys of `example` are what a Skill branches and retries
  on. Changing them is a breaking change.
- `retryable` is fixed per `code` in reader, writer and verify, so the same code always carries the
  same value there. In spec it depends on where the error is raised (see below).
- A request rejected by the MCP SDK before the handler runs — a missing required argument, a key the
  tool does not declare — comes back as the SDK's own `Input validation error: …` text, not in this
  shape.

## Common codes

The same situation gets the same code on every server. `—` means the server does not return it.

| `code` | When | reader | writer | verify | spec |
|---|---|---|---|---|---|
| `INVALID_ARGUMENT` | An argument is wrong: a relative path, a page out of range, an unknown flavour, a bad URL. The detailed reason is in `detail` | `true` | `true` | `true` | `true` |
| `DOC_NOT_FOUND` | No file at the path | `false` | `false` | `false` | — |
| `INVALID_PDF` | The file breaks a structural rule of ISO 32000 — empty, not a PDF, cut short — so it cannot be read as written. **A finding about the file, not a failure of the server**: record it as a structural violation, not as a check that could not be performed | `false` | `false` | `false` | — |
| `ENCRYPTED_PDF` | The tool will not do its job on an encrypted file. **What it will not do differs**: reader cannot read it (no password argument), writer will not edit it, verify will not hand it to veraPDF (pass `password`) | `false` | `false` | `true` | — |
| `UNSUPPORTED_PDF_FEATURE` | The file is valid but uses a feature the server does not handle (XFA forms, for example) | `false` | `false` | — | — |
| `FILE_TOO_LARGE` | Over the server's size limit | `false` | `false` | `false` | — |
| `SOURCE_API_ERROR` | `read_url`: the server answered with a non-success HTTP status, or the TLS connection failed (expired certificate, name mismatch, missing intermediate, untrusted or self-signed CA, no TLS version or cipher in common, or a wrong clock on the fetching machine). Trying the same URL again will not help | `false` | — | — | — |
| `SOURCE_TIMEOUT` | `read_url`: the request timed out | `true` | — | — | — |
| `SOURCE_UNAVAILABLE` | `read_url`: the host refused or closed the connection, or its name could not be resolved | `true` | — | — | — |
| `INTERNAL_ERROR` | **A failure inside the server only.** Report it with the arguments; it may be a bug | `false` | `false` | `false` | `false` |

A URL on a port the Fetch Standard blocks (such as 9) is `INVALID_ARGUMENT`, not a `SOURCE_*` code.

## Server-specific codes

Used only where no common code fits.

### pdf-reader-mcp

| `code` | When / what to do | `retryable` |
|---|---|---|
| `RENDERER_NOT_AVAILABLE` | `render_page`: the optional `@hyzyla/pdfium` could not be loaded. Install it and call again — no restart is needed | `true` |

### pdf-writer-mcp

| `code` | When / what to do | `retryable` |
|---|---|---|
| `SIGNED_PDF` | Signature guard. For annotations, try `preserveSignatures: true` first (incremental update, untagged files only). Otherwise ask the user, then `allowBreakingSignatures: true` | `true` |
| `TAGGED_PDF` | Tag guard (flatten and the like would break the structure tree). Offer an alternative first; with the user's consent, `allowBreakingTags: true` | `true` |
| `FONT_REQUIRED` | Non-Latin text with no font → `fontPath` or `PDF_WRITER_FONT` | `true` |
| `FONT_NOT_FOUND` | The font path is wrong → pass an existing font | `true` |
| `MISSING_GLYPH` | The font lacks a character → another font, or `onMissingGlyph: "replace"` / `"ignore"` | `true` |

### pdf-verify-mcp

| `code` | When / what to do | `retryable` |
|---|---|---|
| `INVALID_BYTE_RANGE` | A signature's `/ByteRange` is not 4 numbers or points outside the file | `false` |
| `WRONG_PASSWORD` | The password is wrong, or the security handler is not the Standard one | `true` |
| `VERAPDF_NOT_FOUND` / `VERAPDF_NOT_AVAILABLE` | veraPDF is not installed or cannot run → set `PDF_VERIFY_VERAPDF`, or use `engine: "native"` (a subset that cannot certify conformance) | `true` |
| `VERAPDF_NO_RESULT` | veraPDF ran but returned no validation result. Neither a pass nor `INTERNAL_ERROR` | `false` |

### pdf-spec-mcp

| `code` | When / what to do | `retryable` |
|---|---|---|
| `REGISTRY_ERROR` | The specification folder is not set or unreadable, or a `spec` id is unknown. Follow `next_actions` (set `PDF_SPEC_DIR`, or call `list_specs`) | depends on the cause: `false` for the folder, `true` for an unknown id |
| `CONTENT_ERROR` | A section, table or page could not be found or read | depends on the cause (`true` when another argument can succeed) |
| `PREREQUISITE_ERROR` | A tool needs a specification or dependency that is not available. `next_actions` names what to install | `false` |

## Old names during the migration

verify 0.33.x and spec 0.12.x return the new codes, and keep the old name in `detail.legacyCode`
for one minor version. A Skill should branch on `code`; the old names will be removed.

| Server | Old name (`detail.legacyCode`) | Now |
|---|---|---|
| verify | `FILE_NOT_FOUND` | `DOC_NOT_FOUND` |
| verify | `PARSE_FAILED` | `INVALID_PDF` |
| verify | `MISSING_PATH` / `RELATIVE_PATH` / `NOT_A_FILE` / `INVALID_FLAVOUR` | `INVALID_ARGUMENT` (the old name is also in `detail.reason`) |
| spec | `VALIDATION_ERROR` | `INVALID_ARGUMENT` |

verify 0.33.x also still sends `message` (same as `error`) and `suggestion` (same as `hint`). Read
`error` and `hint`.
