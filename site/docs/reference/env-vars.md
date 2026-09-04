---
description: Environment variables of each MCP server — PDF_SPEC_DIR / PDF_SPEC_CACHE / PDF_READER_CONCURRENCY / PDF_VERIFY_VERAPDF / PDF_VERIFY_TRUST_ANCHORS / PDF_WRITER_FONT
---

# Environment Variables

Only one variable is required (`PDF_SPEC_DIR`); every other server starts with none.

| Variable | Server | Required | Purpose |
|---|---|---|---|
| `PDF_SPEC_DIR` | pdf-spec | **Required** | Directory of the specification PDF corpus |
| `PDF_SPEC_CACHE_DIR` | pdf-spec | Optional | Where the on-disk index cache lives (v0.5.0+). Default `${XDG_CACHE_HOME:-~/.cache}/pdf-spec-mcp`, about 18 MB for the whole corpus |
| `PDF_SPEC_CACHE` | pdf-spec | Optional | `off` (also `0` / `false`) disables cache reads and writes |
| `PDF_READER_CONCURRENCY` | pdf-reader | Optional | Cap on concurrent remote fetches in `read_url`. Default `4` |
| `PDF_READER_RENDER_TIMEOUT_MS` | pdf-reader | Optional | Per-page budget for `render_page`. Default 20,000 ms; a page that overruns is named in the omissions instead of taking the server down |
| `PDF_VERIFY_VERAPDF` | pdf-verify | Optional | veraPDF executable path (falls back to PATH lookup → built-in rules) |
| `PDF_VERIFY_TRUST_ANCHORS` | pdf-verify | Optional | Directory of trust anchor certificates (PEM/DER) |
| `PDF_WRITER_FONT` | pdf-writer | Effectively required for CJK output | Default font (single-face .ttf/.otf) |

Development only: `TEST_FONT_PATH` (enables pdf-writer's font-dependent tests)

::: tip Where these go
Each variable belongs in the `env` block of its own server's entry in the MCP configuration — see [Getting Started](/guide/getting-started) for a worked configuration per server.
:::
