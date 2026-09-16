---
description: Eight use cases — incoming audit, delivery pipeline, long-term preservation (PDF/A), accessibility (PDF/UA), spec research, batch audit, large or unreadable PDFs, e-bookkeeping invoice
---

# Use Cases

Every use case follows the same shape: **scenario → MCPs/Skills involved → sequence diagram → prompt examples → how to read the results**.

| Use case | Lead role | Representative tools |
|---|---|---|
| [Incoming PDF Audit](/use-cases/incoming-audit) | pdf-trust + verify | evaluate_policy / verify_signatures / verify_integrity |
| [Publish Pipeline](/use-cases/publish-pipeline) | pdf-publish + writer | create_markdown_pdf → extract_structured_text → validate_conformance |
| [PDF/A Archiving](/use-cases/pdfa-archive) | writer + verify | ensure_pdfa / attach_file / validate_conformance (pdfa-3b) |
| [Accessibility (PDF/UA)](/use-cases/accessibility) | writer + verify | ensure_tagged / tag_form_fields / validate_conformance (pdfua-1) |
| [Spec Research](/use-cases/spec-research) | spec | search_spec / get_requirements / compare_versions |
| [Batch Audit](/use-cases/batch-audit) | pdf-trust | evaluate_policy across many PDFs |
| [Large or Unreadable PDFs](/use-cases/pdf-read) | pdf-read + reader | summarize → search_text → read_text (pages) / render_page |
| [e-Bookkeeping Invoice (Denchōhō)](/use-cases/denchoho-invoice) | pdf-publish + writer | attach_file (Data) → ensure_pdfa (pdfa-3b) → validate_conformance |

## Re-run on a second host (2026-09-15 to 16)

All eight use cases were also run, with the same steps, on a host other than Claude Code (Grok Build 1.0.30), and the verdicts matched.
Each page links to the report from that run at the bottom. The evaluation kit (instructions, how the specimens are made, the report template) lives in
[eval/hosts/grok-build](https://github.com/shuji-bonji/pdf-agent-stack/tree/main/eval/hosts/grok-build), with the cross-cutting summary in
[reports/SUMMARY.md](https://github.com/shuji-bonji/pdf-agent-stack/blob/main/eval/hosts/grok-build/reports/SUMMARY.md) (Japanese).
