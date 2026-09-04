---
description: "Tools reference for pdf-verify-mcp v0.26.0 — parameters, types, defaults and returns of all 7 tools, generated from the server's tools/list."
---

# pdf-verify-mcp — Tools Reference

<!-- GENERATED FILE — do not edit. Parameters and returns: the server. Worked examples: scripts/reference-examples/. -->

::: info
Auto-generated from the `tools/list` handshake of **v0.26.0** (7 tools, 2026-09-04). Do not edit by hand — regenerate with `node scripts/generate-reference.mjs`.
:::

**This page is the generated reference** — every tool's parameters, types, defaults and returns, transcribed from the server's `tools/list` (the source of truth is the server itself). For the server's responsibilities, boundaries and how to use it, see the [guide page](/mcp/pdf-verify).

::: info `scope` is not a verdict
Every report begins with `scope`: whether the cross-reference chain could be walked to the end (`chainStop`), and whether this tool rebuilt the cross-reference table (`reconstructed`). When `reconstructed` is true, the table is this tool's reconstruction, not the one the file carries. Read it before the verdict — "no violations" over a rebuilt table is not the same statement as "no violations" over the file's own table.
:::

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

For each signature this tool:

- recomputes the ByteRange digest and compares it with the CMS messageDigest attribute
- verifies the CMS/PKCS#7 signature value against the signer certificate
- verifies any RFC 3161 signature timestamp
- evaluates the certificate chain against trust anchors
- checks revocation status

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **yes** |  | Absolute path to a local PDF file (e.g., "/path/to/document.pdf") |
| `response_format` | `"markdown"` \| `"json"` | no | `"markdown"` | Output format: "markdown" for human-readable, "json" for structured data |
| `trust_anchors` | string[] | no |  | Absolute paths to trust anchor certificates (PEM or DER). Merged with the PDF_VERIFY_TRUST_ANCHORS environment variable (a directory of *.pem/*.crt/*.cer/*.der files). When omitted and the env var is unset, trust is reported as not_evaluated. |
| `check_revocation` | `"none"` \| `"embedded"` \| `"online"` | no | `"embedded"` | Revocation checking: "none", "embedded" (OCSP/CRL data inside the PDF/CMS, default), or "online" (additionally query OCSP responders and CRL distribution points over HTTP). |
| `password` | string | no |  | Password for an encrypted PDF. Omit for permission-encrypted PDFs (an empty user password is tried automatically). |

### Returns

When `scope.reconstructed` is true, a signature the rebuild did not reach is absent from the list. A short or empty list is not proof that the file carries no other signatures.

An object of the form { scope, signatures: [...] }. The top level changed from an array to an object in v0.21.0 - read .signatures for the list.

The three statuses are independent.

| Field | Values | Meaning |
| --- | --- | --- |
| `verdict` | `valid` / `invalid` / `indeterminate` | Cryptographic match |
| `trust.status` | `trusted` / `untrusted` / `not_evaluated` | Certificate chain (path included). Without anchors: `not_evaluated` |
| `revocation.status` | `good` / `revoked` / `unknown` / `not_checked` | OCSP / CRL |
| timestamp | (verification result) | RFC 3161 signature timestamp |

Note: without trust_anchors (or the env var), trust is reported as not_evaluated — a 'valid' verdict then means cryptographic integrity, not signer identity assurance.

Complements pdf-reader-mcp's inspect_signatures, which inspects structure only.

::: warning `valid` is not identity
`verdict` (cryptographic match), `trust` (certificate chain) and revocation are independent. Without `trust_anchors` (or `PDF_VERIFY_TRUST_ANCHORS`), `trust` stays `not_evaluated`. That `valid` means the digest matched; it does not prove the signer is who they claim to be.
:::

::: details Worked example — "Is this signature cryptographically valid? Pass a trust anchor."
- Measured: v0.26.0
- Specimen: `docs/specimens/selfmade-pades-lta.pdf` (pass an absolute path)
- Trust anchor: `docs/specimens/selfmade-ca.pem`
- `response_format`: `"json"`
- `check_revocation`: `"embedded"`

**Parameters**

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/selfmade-pades-lta.pdf",
  "trust_anchors": ["/absolute/path/to/docs/specimens/selfmade-ca.pem"],
  "check_revocation": "embedded",
  "response_format": "json"
}
```

**Returned JSON** (`cms` detail and the document-timestamp signature omitted)

```jsonc
{
  "scope": { "chainStop": { "kind": "complete" }, "reconstructed": false, "objects": 38 },
  "signatures": [
    {
      "fieldName": "Sig1",
      "subFilter": "ETSI.CAdES.detached",
      "verdict": "valid",
      "trust": {
        "status": "trusted",
        "certificatePath": [
          "C=JP, O=PDF Agent Stack Test, CN=Test TSA",
          "C=JP, O=PDF Agent Stack Test, CN=Test Root CA"
        ]
      },
      "revocation": {
        "status": "unknown",
        "detail": "No embedded revocation information found …"
      },
      "coversEntireFile": false,
      "bytesAfterSignedRange": 17188
    }
  ]
}
```

If `revocation.status` is `unknown`, you cannot say the certificate is not revoked.
:::

## verify_integrity

**Verify PDF Integrity (tamper detection)**

Analyze a PDF for modifications after signing.

Reports:

- number of revisions (incremental updates)
- whether bytes were added after each signature's signed range
- whether the last signature covers the entire file
- DocMDP certification permissions and violations
- DSS presence

DocMDP is assessed against what the P value actually permits (ISO 32000-2 Table 257).

| P | Permits |
| --- | --- |
| `1` | nothing |
| `2` | form fill-in and signing |
| `3` | additionally annotation creation / deletion / modification |

The later changes are classified from the object-level diff (changeClass), so adding an annotation to a P=2 document is reported as a violation while the same change to a P=3 document is not. Objects a permitted change necessarily drags along — the page whose /Annots grew, the catalog, /Info, the XMP stream — are classified as housekeeping and do not by themselves constitute a violation. Per ISO 32000-2 §12.8.2.2, DSS/document-timestamp incremental updates after a P=1 certification are NOT violations (flagged as laterChangesAppearLtvOnly).

| `violationAssessment` | Meaning |
| --- | --- |
| `permitted` | later changes stay within what P allows |
| `violated` | a later change exceeds what P allows |
| `indeterminate` | not a pass — the chain could not be walked, or a changed object's kind could not be read, so nothing could be disproved |

The boolean violatedByLaterChanges collapses indeterminate to false for backward compatibility; read violationAssessment when "could not tell" must not be mistaken for "fine".

Also reports an object-level diff of the incremental-update chain: for each revision, which objects were added, rewritten or freed, with the object's /Type and a plain-language role (annotation, form field widget, page object, content stream, …), plus the shortlist of objects written after the last signed range (objectChangesAfterLastSignature). Cross-reference and object streams are flagged as bookkeeping. Where the objects sit on the page is pdf-reader-mcp's answer, not this server's.

Limits of the diff — it is an observation, never a verdict:
- Incremental updates are legal in PDF (ISO 32000-2 §7.5.6). A rewritten object says what to review, not that the file was tampered with. No verdict moves because of it.
- revisions: null means the cross-reference chain could not be walked (revisionChain.status: 'unwalkable') — "not determined", NOT "nothing changed".

| `revisionChain.status` | Meaning |
| --- | --- |
| `complete` | walked from the newest cross-reference section back to the original revision — only then does "not in the list" mean "that change was not made" |
| `partial` | a list came back; `revisionChain.missing` names the absent end (`oldest` / `newest` / both) |
| `unwalkable` | `revisions` is `null` — "not determined", not "nothing changed" |

- **Only 'complete' makes "no such change appears in the list" mean "that change was not made."** With a cut chain the surviving revision is reported as the original one — changeCount: 0, changes: null, objectChangesAfterLastSignature empty — so every other field reads as "nothing was appended". revisions are listed oldest first. Why the chain was cut (a damaged or cyclic /Prev, the revision cap, an unparseable section) stays in notes.
- Objects stored inside an object stream are listed with inObjectStream: true and no type.
`revisionCount` counts "startxref" keywords; `revisions` lists the cross-reference sections the chain reached. The two differ lawfully.

| `revisionCountAgreement.status` | Meaning |
| --- | --- |
| `agree` | `revisionCount` matches the walked revisions |
| `accounted` | the difference is explained (`linearised` and/or `chain-incomplete`) |
| `unaccounted` | the file holds a startxref the walked chain does not reach — look at the file |

- Linearised files (ISO 32000-2 Annex F) carry two cross-reference sections for one save; they are merged back into one revision rather than reported as an update, so revisionCount is one higher than the number of saves.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **yes** |  | Absolute path to a local PDF file (e.g., "/path/to/document.pdf") |
| `response_format` | `"markdown"` \| `"json"` | no | `"markdown"` | Output format: "markdown" for human-readable, "json" for structured data |

### Returns

Integrity report, including revisionChain: { status, missing } — read it before treating the revision list as the file's whole history — and revisionCountAgreement: { status, causes } — read it before quoting revisionCount as the number of times the file was saved. Note that incremental updates after signing are legal in PDF (adding signatures, DSS/LTV data) — findings indicate what to review, not automatically tampering.

::: warning An incremental update is not tampering
Adding a signature, DSS or a document timestamp is legal in PDF. What comes back is what to review, not an automatic finding of tampering.
:::

::: warning Not walking the xref chain is not the same as nothing having changed
When the chain cannot be walked the result is `null`, not an empty array. Reading "could not walk" as "unchanged" states as settled a fact that was never established.
:::

::: details Worked example — "What was written after signing?"
- Measured: v0.26.0
- Specimen: `docs/specimens/selfmade-pades-lta.pdf` (pass an absolute path)
- `response_format`: `"json"`

**Parameters**

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/selfmade-pades-lta.pdf",
  "response_format": "json"
}
```

**Returned JSON** (`revisions` omitted)

```jsonc
{
  "scope": { "chainStop": { "kind": "complete" }, "reconstructed": false },
  "revisionCount": 4,
  "incrementalUpdateCount": 3,
  "signatureCount": 2,
  "lastSignatureCoversFile": false,
  "hasDss": true,
  "objectChangesAfterLastSignature": [
    { "objectNumber": 2, "change": "modified", "type": "Catalog", "changeClass": "housekeeping" },
    { "objectNumber": 34, "change": "modified", "role": "DSS / validation-related data", "changeClass": "signature" }
  ],
  "notes": [
    "Bytes exist after the last signed range. Incremental updates after signing are legal in PDF …"
  ]
}
```

Changed object numbers can be passed to pdf-reader-mcp's `locate_objects`.
:::

## detect_pades_level

**Detect PAdES Baseline Level**

Observe which PAdES baseline level (ETSI EN 319 142) the structure of each signature matches.

**This is an observation, not a conformance verdict.** ETSI EN 319 142 is not in this family's spec corpus, and unlike PDF/A there is no third-party validator to delegate to — so the result says "the structure matches B-LT", never "conforms to PAdES B-LT". Every report carries normativeBasis: "T3" to make that explicit.

| Level | Structure (each row adds to the one above) |
| --- | --- |
| `B-B` | CAdES signature |
| `B-T` | + RFC 3161 signature timestamp |
| `B-LT` | + DSS with validation data |
| `B-LTA` | + document timestamp |

Legacy `adbe.pkcs7.detached` signatures are reported as non-PAdES.

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **yes** |  | Absolute path to a local PDF file (e.g., "/path/to/document.pdf") |
| `response_format` | `"markdown"` \| `"json"` | no | `"markdown"` | Output format: "markdown" for human-readable, "json" for structured data |

### Returns

An object of the form { scope, levels: [...] }. The top level changed from an array to an object in v0.21.0 - read .levels for the list.

Per-signature level with evidence (signature timestamp, DSS, VRI, document timestamp presence).

Note: B-LT / B-LTA additionally require that the DSS revocation data actually covers the signer certificate (content-level LTV validation); otherwise the level is capped at B-T.

::: warning T3 — do not write "conforms"
ETSI EN 319 142 is not in the corpus, and there is no third-party validator. The result is "the structure matches B-T", never "conforms to PAdES B-T". Every report carries `normativeBasis: "T3"`.
:::

::: details Worked example — "Which PAdES level does the structure match?"
- Measured: v0.26.0
- Specimen: `docs/specimens/selfmade-pades-lta.pdf` (pass an absolute path)
- `response_format`: `"json"`

**Parameters**

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/selfmade-pades-lta.pdf",
  "response_format": "json"
}
```

**Returned JSON**

```jsonc
{
  "levels": [
    {
      "fieldName": "Sig1",
      "subFilter": "ETSI.CAdES.detached",
      "isPades": true,
      "level": "B-T",
      "normativeBasis": "T3",
      "evidence": {
        "hasSignatureTimestamp": true,
        "hasDss": true,
        "hasVri": true,
        "hasDocumentTimestamp": true
      },
      "ltv": { "revocationDataCoversSigner": false },
      "notes": [
        "DSS is present but its revocation data does not cover the signer certificate — level capped at B-T."
      ]
    }
  ]
}
```

DSS without revocation data that covers the signer certificate does not raise the level to B-LT.
:::

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

::: warning A declaration is not evidence
This tool **reads** pdfaid / pdfuaid in XMP. "I am PDF/A" written in the file is not the same as meeting the standard. Rule checking is [`validate_conformance`](#validate-conformance).
:::

::: details Worked example — "Does it claim PDF/A or PDF/UA?"
- Measured: v0.26.0
- Specimen: `docs/specimens/publish-demo.pdf` (pass an absolute path)
- `response_format`: `"json"`

**Parameters**

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "response_format": "json"
}
```

**Returned JSON**

```jsonc
{
  "hasXmp": true,
  "pdfA": { "part": "3", "conformance": "B" },
  "pdfUa": { "part": "1" },
  "pdfVersion": "1.7",
  "notes": [
    "This tool identifies declared conformance only; it does not validate actual conformance.",
    "Document declares PDF/A-3b.",
    "Document declares PDF/UA-1."
  ]
}
```
:::

## validate_conformance

**Validate PDF/A and PDF/UA Conformance**

Validate a PDF against a PDF/A flavour (ISO 19005, archiving) or a PDF/UA flavour (ISO 14289, accessibility).

Hybrid engine: veraPDF when installed (`PDF_VERIFY_VERAPDF` or PATH) for an authoritative result; otherwise a built-in subset.

| Flavour | Native rules |
| --- | --- |
| PDF/A (15) | encryption, file ID, LZW, font embedding, JavaScript/prohibited actions, OutputIntent, transparency for A-1, XFA, and more |
| PDF/UA (12) | MarkInfo/Marked, StructTreeRoot, pdfuaid declaration, /Lang, DisplayDocTitle, document title, Figure /Alt, image tagging, heading hierarchy, table TH/TR, Link /Contents |

### Parameters

| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `file_path` | string (minLength 1) | **yes** |  | Absolute path to a local PDF file (e.g., "/path/to/document.pdf") |
| `response_format` | `"markdown"` \| `"json"` | no | `"markdown"` | Output format: "markdown" for human-readable, "json" for structured data |
| `flavour` | string | no |  | Flavour to validate against. PDF/A: "pdfa-1b", "pdfa-1a", "pdfa-2b", "pdfa-2u", "pdfa-3b", etc. PDF/A-4 takes no conformance level — use "pdfa-4", or "pdfa-4e" / "pdfa-4f" for the variants ("pdfa-4b" does not exist). PDF/UA: "pdfua-1", "pdfua-2". Omit to use the document's XMP declaration (PDF/A takes precedence when both are declared; falls back to pdfa-2b). |
| `engine` | `"auto"` \| `"native"` \| `"verapdf"` | no | `"auto"` | Validation engine: "auto" (veraPDF when installed, else native subset), "verapdf" (require veraPDF), "native" (built-in rule subset). |
| `password` | string | no |  | Password for an encrypted PDF (PDF/UA validation only — the document is decrypted before checking structure-dependent rules). Omit for permission-encrypted PDFs (an empty user password is tried automatically). |

### Returns

Per-rule results with ISO clause references.

| Engine | `compliant` |
| --- | --- |
| veraPDF | `true` / `false` |
| native | `false` = a decisive violation; `null` = no violation in the checked subset (not certification) |

| PDF/UA native `severity` | Meaning |
| --- | --- |
| `error` | proves non-conformance |
| `warning` | needs human review |

For an encrypted PDF that cannot be decrypted, structure-dependent PDF/UA rules are reported in skippedRules (not checked) rather than as violations. The PDF/A font-embedding rule looks at fonts that are actually rendered (text rendering mode 3 is invisible and needs no embedded program, ISO 32000-2 9.3.6); when the content streams cannot be read far enough to tell, that rule is reported in skippedRules instead of guessing.

Note: PDF/UA cannot be fully decided by machine — whether alt text is *present* is checkable, whether it is *meaningful* is not. Use pdf-reader-mcp's inspect_tags to examine the structure tree itself.

::: warning T2 (PDF/A) — stop at "veraPDF judged it COMPLIANT"
ISO 19005 is not in the corpus. A PDF/A result is veraPDF's judgment. Do not write "conforms to ISO 19005".
:::

::: warning Machines cannot judge whether PDF/UA alt text means anything
Whether alt text **exists** can be checked. Whether it **means** something needs a human.
:::

::: details Worked example — "How did veraPDF judge PDF/UA-1?"
- Measured: v0.26.0
- Specimen: `docs/specimens/publish-demo.pdf` (pass an absolute path)
- `flavour`: `"pdfua-1"`
- `response_format`: `"json"`

**Parameters**

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "flavour": "pdfua-1",
  "response_format": "json"
}
```

**Returned JSON**

```jsonc
{
  "engine": "verapdf",
  "authoritativeValidation": { "performed": true, "validator": "verapdf", "version": "1.30.0" },
  "flavour": "PDF/UA-1",
  "compliant": true,
  "checkedRules": 106,
  "passedRules": 106,
  "failedRules": 0,
  "violations": [],
  "notes": [
    "Validated by veraPDF … — authoritative result.",
    "Machine validation cannot judge whether alt text and reading order are semantically appropriate; human review remains necessary."
  ]
}
```

The same specimen with `flavour: "pdfa-3b"` was 146/146, `compliant: true`, veraPDF 1.30.0. For PDF/A write "veraPDF judged it COMPLIANT".
:::

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

Per-constraint results with the clause IDs they come from.

| Status | Meaning |
| --- | --- |
| `pass` | nothing in this constraint could be disproved |
| `fail` | disproved, with the fact and its measured value |
| `not_applicable` | the clause does not apply to this document |
| `needs_external_fact` | a fact outside the file was not supplied, so it was not decided (never defaulted to pass) |

Because these are T1 clauses, a failure can be stated plainly and the clause ID quoted — retrieve the wording with pdf-spec-mcp's get_requirements. Failures marked as traces are different: the clause addresses the PDF *processor*, so the file only shows that someone broke it, not that the last writer did.

Some failures carry a Context note. Those clauses are real and the failure is real, but the industry deviates from them deliberately — text markup QuadPoints are written in Z order by nearly every writer because following the clause literally breaks rendering in major viewers. Pass the context on; a failure reported without it reads as a defect.

Every result also carries `observation` — how far the reading got: whether the revision chain could be walked to the end, how many objects the cross-reference tables list, and whether the page tree was reached. **This is the scope of the verdict, not a verdict.** A subject count of zero means "not looked at" when the page tree was not reached; a chain that stopped early means the constraints were applied to part of the file. Read it before the numbers.

**A result with no failures is not proof of conformance** — only that nothing in the bundled constraints could be disproved.

::: warning No failures ≠ conformance
Only the bundled constraints are looked at. Absence of failures is not proof of conformance.
:::

::: details Worked example — "Can ISO 32000 metadata clauses be disproved?"
- Measured: v0.26.0
- Specimen: `docs/specimens/publish-demo.pdf` (pass an absolute path)
- `domains`: `["document-metadata"]`
- `response_format`: `"json"`

**Parameters**

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "domains": ["document-metadata"],
  "response_format": "json"
}
```

**Returned JSON**

```jsonc
{
  "constraintsVersion": "0.6.1",
  "tables": [{ "name": "document-metadata", "version": "1" }],
  "results": [
    { "constraintId": "CT-META-1", "target": "(document)", "status": "pass" },
    { "constraintId": "CT-META-6", "target": "(document)", "status": "not_applicable" }
  ],
  "violations": 0,
  "notDecided": 0,
  "notes": [
    "Checked against the constraints bundled in @shuji-bonji/pdf-constraints — nothing else. The absence of failures is not proof of conformance."
  ]
}
```
:::

## evaluate_policy

**Evaluate Trust Policy (deterministic verdict)**

Produce a deterministic 4-value trust verdict for a PDF.

- `trust_and_use`
- `use_with_caution`
- `human_review_required`
- `reject`

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

| Field | Content |
| --- | --- |
| `verdict` | one of the four values above |
| `firedRules` | rule IDs with per-rule verdict and reason |
| `advisories` | recommendations that do not affect the verdict |
| facts | underlying facts summary |

::: warning The verdict is what `evaluate_policy` returns. The LLM writes the explanation only
Use `firedRules` / `advisories` to explain the outcome, never to override it. Do not read an advisory as a failure. Do not read the absence of advisories as a pass.
:::

::: warning Without trust anchors the verdict stops at `use_with_caution`
Without `trust_anchors`, signer identity stays `not_evaluated`. The verdict cannot be `trust_and_use`.
:::

::: details Worked example — "May it be used in the business process? (general, no anchors)"
- Measured: v0.26.0
- Specimen: `docs/specimens/selfmade-pades-lta.pdf` (pass an absolute path)
- `profile`: `"general"`
- `response_format`: `"json"`

**Parameters**

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/selfmade-pades-lta.pdf",
  "profile": "general",
  "response_format": "json"
}
```

**Returned JSON** (`facts` omitted)

```jsonc
{
  "profile": "general",
  "verdict": "use_with_caution",
  "firedRules": [
    {
      "ruleId": "POL-CAUTION-TRUST-NOT-EVALUATED",
      "verdict": "use_with_caution",
      "reason": "Cryptographic integrity confirmed but signer identity NOT evaluated (no trust anchors): Sig1"
    },
    {
      "ruleId": "POL-CAUTION-REVOCATION-UNKNOWN",
      "verdict": "use_with_caution",
      "reason": "Revocation status could not be confirmed …"
    }
  ],
  "advisories": [
    "Content was added after signing (incremental update): … — incremental updates are permitted in PDF …"
  ]
}
```

The same facts and the same `profile` always yield the same verdict.
:::
