---
description: "Tools reference for pdf-verify-mcp v0.21.0 — parameters, types, defaults and returns of all 7 tools, generated from the server's tools/list."
---

# pdf-verify-mcp — Tools Reference

<!-- GENERATED FILE — do not edit. Source of truth: the server itself. -->

::: info
Auto-generated from the `tools/list` handshake of **v0.21.0** (7 tools, 2026-08-29). Do not edit by hand — regenerate with `node scripts/generate-reference.mjs`.
:::

**This page is the generated reference** — every tool's parameters, types, defaults and returns, transcribed from the server's `tools/list` (the source of truth is the server itself). For the server's responsibilities, boundaries and how to use it, see the [guide page](/mcp/pdf-verify).

## Tools

| Tool | Summary |
|---|---|
| [`verify_signatures`](#verify-signatures) | Cryptographically verify the digital signatures in a PDF document. |
| [`verify_integrity`](#verify-integrity) | Analyze a PDF for modifications after signing. |
| [`detect_pades_level`](#detect-pades-level) | Observe which PAdES baseline level (ETSI EN 319 142) the structure of each signature matches. |
| [`identify_conformance`](#identify-conformance) | Identify declared PDF/A (pdfaid) and PDF/UA (pdfuaid) conformance in a PDF's XMP metadata. |
| [`validate_conformance`](#validate-conformance) | Validate a PDF against a PDF/A flavour (ISO 19005, archiving) or a PDF/UA flavour (ISO 14289, accessibility). |
| [`validate_clauses`](#validate-clauses) | Check a PDF against constraints mapped from ISO 32000-1/-2 clauses — the body of the PDF specification itself, not PDF/A or PDF/UA. |
| [`evaluate_policy`](#evaluate-policy) | Produce a deterministic 4-value trust verdict (trust_and_use / use_with_caution / human_review_required / reject) for a PDF. |

## verify_signatures

**Verify PDF Digital Signatures (cryptographic)**

Cryptographically verify the digital signatures in a PDF document.

For each signature this tool: recomputes the ByteRange digest and compares it with the CMS messageDigest attribute, verifies the CMS/PKCS#7 signature value against the signer certificate, verifies any RFC 3161 signature timestamp, evaluates the certificate chain against trust anchors, and checks revocation status.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **yes** |  | Absolute path to a local PDF file (e.g., "/path/to/document.pdf") |
| `response_format` | `"markdown"` \| `"json"` | no | `"markdown"` | Output format: "markdown" for human-readable, "json" for structured data |
| `trust_anchors` | string[] | no |  | Absolute paths to trust anchor certificates (PEM or DER). Merged with the PDF_VERIFY_TRUST_ANCHORS environment variable (a directory of *.pem/*.crt/*.cer/*.der files). When omitted and the env var is unset, trust is reported as not_evaluated. |
| `check_revocation` | `"none"` \| `"embedded"` \| `"online"` | no | `"embedded"` | Revocation checking: "none", "embedded" (OCSP/CRL data inside the PDF/CMS, default), or "online" (additionally query OCSP responders and CRL distribution points over HTTP). |
| `password` | string | no |  | Password for an encrypted PDF. Omit for permission-encrypted PDFs (an empty user password is tried automatically). |

### Returns

Per-signature verdict ('valid' / 'invalid' / 'indeterminate'), trust status ('trusted' / 'untrusted' / 'not_evaluated' with certificate path), revocation status ('good' / 'revoked' / 'unknown' / 'not_checked'), and signature timestamp verification.

Note: without trust_anchors (or the env var), trust is reported as not_evaluated — a 'valid' verdict then means cryptographic integrity, not signer identity assurance.

Complements pdf-reader-mcp's inspect_signatures, which inspects structure only.

Examples:
- Verify a signed contract has not been altered since signing
- Validate a signature against your organization's CA (trust_anchors)
- Check whether the signer certificate has been revoked (check_revocation: "online")

## verify_integrity

**Verify PDF Integrity (tamper detection)**

Analyze a PDF for modifications after signing.

Reports: number of revisions (incremental updates), whether bytes were added after each signature's signed range, whether the last signature covers the entire file, DocMDP certification permissions and violations, and DSS presence.

DocMDP is assessed against what the P value actually permits (ISO 32000-2 Table 257): P=1 permits nothing, P=2 form fill-in and signing, P=3 additionally annotation creation/deletion/modification. The later changes are classified from the object-level diff (changeClass), so adding an annotation to a P=2 document is reported as a violation while the same change to a P=3 document is not. Objects a permitted change necessarily drags along — the page whose /Annots grew, the catalog, /Info, the XMP stream — are classified as housekeeping and do not by themselves constitute a violation. Per ISO 32000-2 §12.8.2.2, DSS/document-timestamp incremental updates after a P=1 certification are NOT violations (flagged as laterChangesAppearLtvOnly).

violationAssessment is three-valued: "permitted" / "violated" / "indeterminate". **"indeterminate" is not a pass** — it means the chain could not be walked or a changed object's kind could not be read, so nothing could be disproved. The boolean violatedByLaterChanges collapses indeterminate to false for backward compatibility; read violationAssessment when "could not tell" must not be mistaken for "fine".

Also reports an object-level diff of the incremental-update chain: for each revision, which objects were added, rewritten or freed, with the object's /Type and a plain-language role (annotation, form field widget, page object, content stream, …), plus the shortlist of objects written after the last signed range (objectChangesAfterLastSignature). Cross-reference and object streams are flagged as bookkeeping. Where the objects sit on the page is pdf-reader-mcp's answer, not this server's.

Limits of the diff — it is an observation, never a verdict:
  - Incremental updates are legal in PDF (ISO 32000-2 §7.5.6). A rewritten object says what to review, not that the file was tampered with. No verdict moves because of it.
  - revisions: null means the cross-reference chain could not be walked (revisionChain.status: 'unwalkable') — "not determined", NOT "nothing changed".
  - A non-null revisions list is not necessarily the whole history. revisionChain.status says which it is: 'complete' (walked from the newest cross-reference section back to the original revision), 'partial' (a list came back but revisionChain.missing names the end that is absent), or 'unwalkable' (the case above). revisionChain.missing holds 'oldest' when the chain ended before the original revision, and 'newest' when the last startxref did not point at a parseable section so an older entry point was used and the last append is not listed; both can be absent at once.
  - **Only 'complete' makes "no such change appears in the list" mean "that change was not made."** With a cut chain the surviving revision is reported as the original one — changeCount: 0, changes: null, objectChangesAfterLastSignature empty — so every other field reads as "nothing was appended". revisions are listed oldest first. Why the chain was cut (a damaged or cyclic /Prev, the revision cap, an unparseable section) stays in notes.
  - Objects stored inside an object stream are listed with inObjectStream: true and no type.
  - revisionCount counts "startxref" keywords; revisions lists the cross-reference sections the chain reached. The two differ lawfully, so revisionCountAgreement says whether the difference is explained: 'agree', 'accounted' (causes names 'linearised' and/or 'chain-incomplete'), or 'unaccounted' — the file holds a startxref the walked chain does not reach, which is the case worth looking at.
  - Linearised files (ISO 32000-2 Annex F) carry two cross-reference sections for one save; they are merged back into one revision rather than reported as an update, so revisionCount is one higher than the number of saves.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **yes** |  | Absolute path to a local PDF file (e.g., "/path/to/document.pdf") |
| `response_format` | `"markdown"` \| `"json"` | no | `"markdown"` | Output format: "markdown" for human-readable, "json" for structured data |

### Returns

Integrity report, including revisionChain: { status, missing } — read it before treating the revision list as the file's whole history — and revisionCountAgreement: { status, causes } — read it before quoting revisionCount as the number of times the file was saved. Note that incremental updates after signing are legal in PDF (adding signatures, DSS/LTV data) — findings indicate what to review, not automatically tampering.

Examples:
- Check whether a signed document was modified after signing
- Verify a certified (DocMDP) document respects its declared permissions
- Find out which objects an incremental update touched after a signature was made

## detect_pades_level

**Detect PAdES Baseline Level**

Observe which PAdES baseline level (ETSI EN 319 142) the structure of each signature matches.

**This is an observation, not a conformance verdict.** ETSI EN 319 142 is not in this family's spec corpus, and unlike PDF/A there is no third-party validator to delegate to — so the result says "the structure matches B-LT", never "conforms to PAdES B-LT". Every report carries normativeBasis: "T3" to make that explicit.

Detection is structural: B-B (CAdES signature), B-T (+ RFC 3161 signature timestamp), B-LT (+ DSS with validation data), B-LTA (+ document timestamp). Legacy adbe.pkcs7.detached signatures are reported as non-PAdES.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **yes** |  | Absolute path to a local PDF file (e.g., "/path/to/document.pdf") |
| `response_format` | `"markdown"` \| `"json"` | no | `"markdown"` | Output format: "markdown" for human-readable, "json" for structured data |

### Returns

Per-signature level with evidence (signature timestamp, DSS, VRI, document timestamp presence).

Note: B-LT / B-LTA additionally require that the DSS revocation data actually covers the signer certificate (content-level LTV validation); otherwise the level is capped at B-T.

Examples:
- Check if a signature is long-term validation (LTV) enabled
- Audit whether archived contracts meet B-LTA requirements

## identify_conformance

**Identify PDF/A / PDF/UA Declarations**

Identify declared PDF/A (pdfaid) and PDF/UA (pdfuaid) conformance in a PDF's XMP metadata.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **yes** |  | Absolute path to a local PDF file (e.g., "/path/to/document.pdf") |
| `response_format` | `"markdown"` \| `"json"` | no | `"markdown"` | Output format: "markdown" for human-readable, "json" for structured data |

### Returns

Declared PDF/A part/conformance level and PDF/UA part, plus the PDF version.

IMPORTANT: This tool only IDENTIFIES the declared conformance — a declaration does not guarantee actual conformance. For real PDF/A rule checking use the validate_conformance tool (native rule subset, or veraPDF when installed).

Examples:
- Check whether a document claims PDF/A-2b before archiving
- Detect PDF/UA declarations for accessibility workflows

## validate_conformance

**Validate PDF/A and PDF/UA Conformance**

Validate a PDF against a PDF/A flavour (ISO 19005, archiving) or a PDF/UA flavour (ISO 14289, accessibility).

Hybrid engine: when veraPDF is installed (PDF_VERIFY_VERAPDF env var or on PATH) validation is delegated to it for an authoritative result. Otherwise a built-in rule subset is checked natively:
  - PDF/A (15 rules): encryption, file ID, LZW, font embedding, JavaScript/prohibited actions, OutputIntent, transparency for A-1, XFA, and more
  - PDF/UA (12 rules): MarkInfo/Marked, StructTreeRoot, pdfuaid declaration, /Lang, DisplayDocTitle, document title, Figure /Alt, image tagging, heading hierarchy, table TH/TR, Link /Contents

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **yes** |  | Absolute path to a local PDF file (e.g., "/path/to/document.pdf") |
| `response_format` | `"markdown"` \| `"json"` | no | `"markdown"` | Output format: "markdown" for human-readable, "json" for structured data |
| `flavour` | string | no |  | Flavour to validate against. PDF/A: "pdfa-1b", "pdfa-1a", "pdfa-2b", "pdfa-2u", "pdfa-3b", etc. PDF/A-4 takes no conformance level — use "pdfa-4", or "pdfa-4e" / "pdfa-4f" for the variants ("pdfa-4b" does not exist). PDF/UA: "pdfua-1", "pdfua-2". Omit to use the document's XMP declaration (PDF/A takes precedence when both are declared; falls back to pdfa-2b). |
| `engine` | `"auto"` \| `"native"` \| `"verapdf"` | no | `"auto"` | Validation engine: "auto" (veraPDF when installed, else native subset), "verapdf" (require veraPDF), "native" (built-in rule subset). |
| `password` | string | no |  | Password for an encrypted PDF (PDF/UA validation only — the document is decrypted before checking structure-dependent rules). Omit for permission-encrypted PDFs (an empty user password is tried automatically). |

### Returns

Per-rule results with ISO clause references. compliant is true/false for veraPDF; for the native engine, false means definitive violations were found and null means "no violations in the checked subset" (NOT certification). PDF/UA native violations carry a severity: only 'error' rules can prove non-conformance, 'warning' rules need human review. For an encrypted PDF that cannot be decrypted, structure-dependent PDF/UA rules are reported in skippedRules (not checked) rather than as violations.

Note: PDF/UA cannot be fully decided by machine — whether alt text is *present* is checkable, whether it is *meaningful* is not. Use pdf-reader-mcp's inspect_tags to examine the structure tree itself.

Examples:
- Check whether a scanned archive PDF actually meets its declared PDF/A-2b
- Verify a generated document is tagged and accessible before publishing (pdfua-1)
- Find why a document fails PDF/A before submitting it to an archive system

## validate_clauses

**Check ISO 32000 Clause Constraints**

Check a PDF against constraints mapped from ISO 32000-1/-2 clauses — the body of the PDF specification itself, not PDF/A or PDF/UA.

This covers what veraPDF does not look at. veraPDF judges PDF/A and PDF/UA profiles; a document can pass those and still violate ISO 32000 (for example embedding a CFF font program under /FontFile2, which Table 124 forbids).

The mapping and its evaluation live in @shuji-bonji/pdf-constraints; this tool reports which version decided the result. Same file plus same given facts always produce the same result.

Bundled domains: font-embedding, document-metadata, annotation

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **yes** |  | Absolute path to a local PDF file (e.g., "/path/to/document.pdf") |
| `response_format` | `"markdown"` \| `"json"` | no | `"markdown"` | Output format: "markdown" for human-readable, "json" for structured data |
| `domains` | string[] | no |  | Constraint domains to apply. Omit to apply all bundled domains (font-embedding, document-metadata, annotation). |
| `given` | object | no |  | Facts that are NOT in the file but are needed to decide some clauses, e.g. { "isSubset": true }. A clause whose applicability depends on a missing fact is reported as needs_external_fact — it is never defaulted into a pass. |

### Returns

Per-constraint results with the clause IDs they come from. Four states:
- pass — nothing in this constraint could be disproved
- fail — disproved, with the fact and its measured value as evidence
- not_applicable — the clause does not apply to this document
- needs_external_fact — a fact outside the file was not supplied, so the constraint was not decided (never defaulted into a pass)

Because these are T1 clauses, a failure can be stated plainly and the clause ID quoted — retrieve the wording with pdf-spec-mcp's get_requirements. Failures marked as traces are different: the clause addresses the PDF *processor*, so the file only shows that someone broke it, not that the last writer did.

Some failures carry a Context note. Those clauses are real and the failure is real, but the industry deviates from them deliberately — text markup QuadPoints are written in Z order by nearly every writer because following the clause literally breaks rendering in major viewers. Pass the context on; a failure reported without it reads as a defect.

Every result also carries `observation` — how far the reading got: whether the revision chain could be walked to the end, how many objects the cross-reference tables list, and whether the page tree was reached. **This is the scope of the verdict, not a verdict.** A subject count of zero means "not looked at" when the page tree was not reached; a chain that stopped early means the constraints were applied to part of the file. Read it before the numbers.

**A result with no failures is not proof of conformance** — only that nothing in the bundled constraints could be disproved.

Examples:
- Find out why a viewer warns about a font that veraPDF considers fine
- Check whether Info and XMP agree on the document dates (§14.3.4)
- Verify a generated PDF before shipping it, beyond the PDF/A profile

## evaluate_policy

**Evaluate Trust Policy (deterministic verdict)**

Produce a deterministic 4-value trust verdict (trust_and_use / use_with_caution / human_review_required / reject) for a PDF.

Runs verify_signatures, verify_integrity and detect_pades_level internally (plus validate_conformance for long-term-preservation profiles) and folds the facts through a fixed rule table — the same facts and profile always yield the same verdict. The verdict is decided entirely by code; use the returned firedRules/advisories to explain the outcome, never to override it. It judges authenticity and integrity only, never the truth of the document's content.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **yes** |  | Absolute path to a local PDF file (e.g., "/path/to/document.pdf") |
| `response_format` | `"markdown"` \| `"json"` | no | `"markdown"` | Output format: "markdown" for human-readable, "json" for structured data |
| `profile` | `"general"` \| `"contract"` \| `"financial"` \| `"legal"` \| `"medical"` \| `"government"` | no | `"general"` | Judgment profile: "general" (default thresholds), "contract" (signature required, identity-focused), "financial" (long-term preservation checks), "legal", "medical" (most conservative; caution escalates to review), "government" (long-term checks, unsigned tolerated). |
| `trust_anchors` | string[] | no |  | Absolute paths to trust anchor certificates (PEM or DER). Merged with the PDF_VERIFY_TRUST_ANCHORS environment variable. Without anchors, valid signatures are capped at use_with_caution (identity not evaluated). |
| `check_revocation` | `"none"` \| `"embedded"` \| `"online"` | no | `"embedded"` | Revocation checking: "none", "embedded" (default), or "online" (queries OCSP/CRL endpoints over HTTP). |
| `password` | string | no |  | Password for an encrypted PDF. Omit for permission-encrypted PDFs (an empty user password is tried automatically). |

### Returns

verdict, firedRules (rule IDs with per-rule verdict and reason), advisories (recommendations that do not affect the verdict), and the underlying facts summary.

Examples:
- Gate incoming invoices before filing them (profile: financial)
- Decide whether a countersigned contract can be relied on (profile: contract, with the counterparty CA as trust anchor)
- Batch-audit a folder of received PDFs with a reproducible, model-independent verdict
