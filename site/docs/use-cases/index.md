---
description: Six use cases — incoming audit, delivery pipeline, long-term preservation (PDF/A), accessibility (PDF/UA), spec research, batch audit
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
