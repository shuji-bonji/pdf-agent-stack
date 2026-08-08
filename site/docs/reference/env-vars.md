---
description: Environment variables of each MCP server — PDF_SPEC_DIR / PDF_VERIFY_VERAPDF / PDF_VERIFY_TRUST_ANCHORS / PDF_WRITER_FONT
---

# Environment Variables

| Variable | Server | Required | Purpose |
|---|---|---|---|
| `PDF_SPEC_DIR` | pdf-spec | **Required** | Directory of the specification PDF corpus |
| `PDF_VERIFY_VERAPDF` | pdf-verify | Optional | veraPDF executable path (falls back to PATH lookup → built-in rules) |
| `PDF_VERIFY_TRUST_ANCHORS` | pdf-verify | Optional | Directory of trust anchor certificates (PEM/DER) |
| `PDF_WRITER_FONT` | pdf-writer | Effectively required for CJK output | Default font (single-face .ttf/.otf) |

Development only: `TEST_FONT_PATH` (enables pdf-writer's font-dependent tests)
