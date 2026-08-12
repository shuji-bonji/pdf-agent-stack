---
description: Setup with npx — configuration examples for each MCP server, required environment variables (PDF_SPEC_DIR / PDF_WRITER_FONT etc.), and smoke-test prompts
---

# Getting Started

Prerequisite: Node.js 20+. Every server starts via `npx`, so no global install is needed.

## Step 1 — Minimal setup (pdf-reader)

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

Works with no environment variables. Read one PDF first to confirm it is alive.

## Step 2 — pdf-spec

### Placing the spec corpus

**Skip this step and pdf-spec cannot answer a single question.** pdf-spec-mcp does not bundle the specification PDFs themselves (ISO documents may not be redistributed). You supply the original texts — fortunately, **every core document is available at no cost through legitimate channels**:

| Source | Documents |
|---|---|
| [PDF Association: Sponsored ISO standards](https://pdfa.org/sponsored-standards/) → the **ISO 32000-2 bundle** | ISO 32000-2:2020 (with Errata Collection 3) + ISO TS 32001 / 32002 / 32003 / 32004 |
| Same page → the **PDF/UA bundle** | ISO 14289-1:2014 (PDF/UA-1) + ISO 14289-2:2024 (PDF/UA-2) + ISO TS 32005 |
| [Adobe's public copy, PDF32000_2008.pdf](https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf) | ISO 32000-1:2008 (PDF 1.7) |

The sponsored editions are **genuine ISO documents published at no cost by the PDF Association**, funded by sponsors including Adobe, Apryse and Foxit — free, but in no way bootleg.
Put the downloaded PDFs in one directory and point `PDF_SPEC_DIR` at it in the pdf-spec-mcp configuration; files are then recognized by name pattern
(e.g. `PDF32000_2008.pdf`, `ISO_32000-2_2020...pdf`, `ISO-14289-1-2014-sponsored.pdf` — 17 documents).

### Setting `PDF_SPEC_DIR`

```jsonc
{
  "mcpServers": {
    "pdf-spec": {
      "command": "npx",
      "args": ["-y", "@shuji-bonji/pdf-spec-mcp@latest"],
      "env": { "PDF_SPEC_DIR": "/path/to/pdf-specs" }
    }
  }
}
```

::: warning
`PDF_SPEC_DIR` is required. This corpus is the very ground of PDF Agent Stack's **normative knowledge** — clauses can be quoted with full force (T1) precisely because the original text is at hand. ISO 19005 (PDF/A) and ETSI PAdES are outside the corpus — check `coverage.gaps` in `list_specs` to see what cannot be looked up.
:::

## Step 3 — pdf-verify (veraPDF and trust anchors)

Works out of the box (a built-in subset of ~15 PDF/A rules + 12 PDF/UA rules). For serious use, install veraPDF.

1. Install [veraPDF](https://verapdf.org/)
2. Put it on PATH, or point `PDF_VERIFY_VERAPDF` at the executable

```jsonc
{
  "mcpServers": {
    "pdf-verify": {
      "command": "npx",
      "args": ["-y", "@shuji-bonji/pdf-verify-mcp@latest"],
      "env": {
        "PDF_VERIFY_VERAPDF": "/usr/local/bin/verapdf",
        "PDF_VERIFY_TRUST_ANCHORS": "/path/to/trust-anchors"
      }
    }
  }
}
```

Setting `PDF_VERIFY_TRUST_ANCHORS` (a directory of PEM/DER certificates) enables evaluation of the signer's certificate chain. Without it, a "valid" signature means only that **the cryptography checks out** — not that the signer is who they claim (`trust: not_evaluated`).

## Step 4 — pdf-writer (CJK fonts)

The standard font (Helvetica) is **ASCII only**. To output Japanese or other CJK text you need an embeddable single-face font (`.ttf` / `.otf`; variable fonts are not supported). The static build of [Noto Sans JP](https://fonts.google.com/noto/specimen/Noto+Sans+JP) is recommended.

```jsonc
{
  "mcpServers": {
    "pdf-writer": {
      "command": "npx",
      "args": ["-y", "@shuji-bonji/pdf-writer-mcp@latest"],
      "env": { "PDF_WRITER_FONT": "/path/to/NotoSansJP-Regular.otf" }
    }
  }
}
```

With `PDF_WRITER_FONT` set, the per-tool `fontPath` can be omitted. Always pass `outputPath` (absolute) for output — omitting it returns the whole PDF as base64 and floods the response.

## Step 5 — Smoke test

Hit one tool per server.

| Server | Example prompt |
|---|---|
| pdf-reader | "Show me this PDF's page count and metadata" |
| pdf-spec | "What does ISO 32000-2 require for an annotation's /Contents?" |
| pdf-verify | "Verify the integrity of this PDF" |
| pdf-writer | "Create a PDF saying 'Hello 日本語' at ~/tmp/test.pdf" |

## Step 6 — Adding the Skills

Adding [pdf-trust](/skills/pdf-trust) (incoming audit) and [pdf-publish](/skills/pdf-publish) (delivery) as Skills gives you a fixed choreography for multi-MCP workflows. pdf-trust **requires pdf-verify v0.7.0+** (it uses `evaluate_policy`).

## Environment variables

| Variable | Server | Required | Purpose |
|---|---|---|---|
| `PDF_SPEC_DIR` | pdf-spec | **Required** | Directory of the specification PDF corpus |
| `PDF_VERIFY_VERAPDF` | pdf-verify | Optional | veraPDF executable path (falls back to PATH lookup → built-in rules) |
| `PDF_VERIFY_TRUST_ANCHORS` | pdf-verify | Optional | Directory of trust anchor certificates |
| `PDF_WRITER_FONT` | pdf-writer | Effectively required for CJK output | Default font (single-face .ttf/.otf) |
