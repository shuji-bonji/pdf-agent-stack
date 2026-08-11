---
description: The MCP that judges authenticity and conformance (7 tools) — signature verification, tamper detection, PAdES observation, PDF/A / PDF/UA validation, clause checks, deterministic 4-value verdicts. It can disprove but never prove
---

# pdf-verify-mcp

> **The authenticity & conformance layer (judgment)** — this server **disproves**. It can never **prove** that a document conforms or that a signature is trustworthy. Read every result as "what could be shown to be wrong, was looked for".

- npm: `@shuji-bonji/pdf-verify-mcp` / current v0.14.2
- Cryptographic signature verification, tamper detection, PAdES level observation, PDF/A / PDF/UA validation, deterministic policy verdicts

## What it does not do

- Judge the truth of the content (a correctly signed document can still lie)
- Observation (→ pdf-reader), quoting the spec (→ pdf-spec), creation (→ pdf-writer)

## Installation

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

Both environment variables are optional. Works without veraPDF using the built-in rules (→ [validate_conformance](#validate-conformance)).

## Common parameters

All tools accept these (omitted from the per-tool tables).

| Parameter | Type | Description |
|---|---|---|
| `file_path` **required** | string | Absolute path to a local PDF |
| `response_format` | `markdown` / `json` | Output format. Default markdown |
| `password` | string | Password for an encrypted PDF. Permission-only encryption (empty user password) is tried automatically (where supported) |

## Tools

| Tool | One-liner |
|---|---|
| [`verify_signatures`](#verify-signatures) | Cryptographic signature verification (chain, revocation, timestamps) |
| [`verify_integrity`](#verify-integrity) | Analysis of changes after signing (incremental updates, coverage, DocMDP) |
| [`detect_pades_level`](#detect-pades-level) | **Observation** of PAdES B-B / B-T / B-LT / B-LTA-matching structure |
| [`identify_conformance`](#identify-conformance) | Reading XMP declarations (pdfaid / pdfuaid) — the entry point of judgment |
| [`validate_conformance`](#validate-conformance) | PDF/A / PDF/UA validation. Delegates to veraPDF, or built-in rules |
| [`validate_clauses`](#validate-clauses) | Constraint checks against the **ISO 32000 body** (where veraPDF does not look) |
| [`evaluate_policy`](#evaluate-policy) | Deterministic 4-value verdict from the facts |

## Per-tool manual

### verify_signatures

For each signature: recomputes the ByteRange digest and compares it with the CMS messageDigest, verifies the CMS/PKCS#7 signature value against the signer certificate, verifies any RFC 3161 signature timestamp, evaluates the certificate chain against trust anchors, and checks revocation.

Returns: per-signature verdict (`valid` / `invalid` / `indeterminate`), trust (`trusted` / `untrusted` / `not_evaluated` + certificate path), revocation status (`good` / `revoked` / `unknown` / `not_checked`), and timestamp verification.

| Parameter | Type | Description |
|---|---|---|
| `trust_anchors` | array\<string\> | Paths to trust anchor certificates (PEM/DER). Merged with env `PDF_VERIFY_TRUST_ANCHORS` (a directory) |
| `check_revocation` | `none` / `embedded` / `online` | Revocation checking. Default embedded (data inside the PDF/CMS). online queries OCSP/CRL over HTTP |

::: warning valid ≠ signer identity
Without trust_anchors (or the env var), "valid" means only that **the cryptography checks out** — not that the signer is who they claim (`trust: not_evaluated`). Likewise for revocation: if it could not be checked, you may not say "not revoked".
:::

Related: for structure only, use pdf-reader's `inspect_signatures`.

### verify_integrity

Analyzes changes after signing: revision count (incremental updates), whether bytes were added after each signature's signed range, whether the last signature covers the whole file, DocMDP (certification) permissions and violations, and DSS presence. Per ISO 32000-2 §12.8.2.2, DSS/document-timestamp increments after a P=1 certification are **not** reported as violations (flagged `laterChangesAppearLtvOnly`).

::: tip Incremental updates after signing are legal
Adding signatures or DSS/LTV data is a legitimate PDF operation. Findings say what to review — they do not automatically mean tampering.
:::

**Since v0.10.0, beyond per-revision reporting, it also returns *which objects* were written after signing**
(`revisions` / `objectChangesAfterLastSignature`), walking the xref chain over raw bytes
(table / xref stream / hybrid). **The verdict does not move** (incremental updates are legal).

Hand those object numbers to [pdf-reader](/mcp/pdf-reader)'s `locate_objects` to get **a page and a rectangle**, which
[pdf-writer](/mcp/pdf-writer)'s `add_annotation` takes as-is — "point at the changed spot with an annotation"
becomes one continuous path across servers.

::: warning Could-not-walk ≠ nothing changed
When the xref chain cannot be walked, the result is `null`, not an empty array. A naive implementation lies in
three places (a linearized file has two xref sections for one save and must be merged, or every object looks "added";
a full save measures 224,065 changes; unwalkable must not read as "unchanged") — all three were fixed against
real measurements.
:::

### validate_clauses

Checks constraints mapped from the **body clauses of ISO 32000-1/-2** — the area veraPDF does not look at.
A document can pass PDF/A or PDF/UA and still violate ISO 32000 (example: embedding a CFF font program under
`/FontFile2`, which Table 124 forbids).

The mapping and its evaluation live in [pdf-constraints](/reference/pdf-constraints), and the output names the
version that decided. **Same file plus same given facts always produce the same result.** The bundled domains
and their constraint counts are listed there.

| Parameter | Type | Description |
|---|---|---|
| `domains` | array\<string\> | Restrict the constraint domains |
| `given` | object | Facts outside the file, e.g. `{ "isSubset": true }` |

Each constraint returns one of four states.

| State | Meaning |
|---|---|
| `pass` | **Nothing could be disproved** by this constraint |
| `fail` | Disproved — with the fact and measured value as evidence |
| `not_applicable` | The clause does not apply to this document |
| `needs_external_fact` | An outside fact was not supplied, so **no decision was made** (never defaulted to pass) |

::: warning Zero failures is not proof of conformance
It means "nothing in the bundled constraints could be disproved". Failures marked `trace` mean the clause binds the
PDF **processor** — evidence that someone broke it, not necessarily the last writer.
:::

### detect_pades_level

**Observes** which PAdES baseline level (ETSI EN 319 142) each signature's structure matches. Structural detection: B-B (CAdES signature) → B-T (+ RFC 3161 signature timestamp) → B-LT (+ DSS with validation data) → B-LTA (+ document timestamp). Legacy adbe.pkcs7.detached is reported as non-PAdES.

::: warning An observation, not a conformance verdict
ETSI EN 319 142 is not in the family's corpus and there is no third-party validator to delegate to. The result is "the structure matches B-LT", never "conforms to PAdES B-LT" — every report carries `normativeBasis: "T3"`.
:::

B-LT / B-LTA additionally require that the DSS revocation data actually covers the signer certificate (otherwise the level caps at B-T).

### identify_conformance

Reads the PDF/A (pdfaid) and PDF/UA (pdfuaid) **declarations** in the XMP metadata. Returns the declared part / conformance level and the PDF version.

::: warning A declaration guarantees nothing
This tool only **identifies** the declaration. For the actual rule checking, use `validate_conformance`.
:::

### validate_conformance

Validates against PDF/A (ISO 19005, archiving) or PDF/UA (ISO 14289, accessibility). **Hybrid engine**: delegates to veraPDF when available (authoritative), otherwise runs the built-in rules natively —

- PDF/A (15 rules): encryption, file ID, LZW, font embedding, JavaScript/prohibited actions, OutputIntent, A-1 transparency, XFA, …
- PDF/UA (12 rules): MarkInfo/Marked, StructTreeRoot, pdfuaid declaration, /Lang, DisplayDocTitle, title, Figure /Alt, image tagging, heading hierarchy, table TH/TR, Link /Contents

| Parameter | Type | Description |
|---|---|---|
| `flavour` | string | `"pdfa-1b"`–`"pdfa-3b"` / **`"pdfa-4"` / `"pdfa-4e"` / `"pdfa-4f"`** (v0.11.0+) / `"pdfua-1"` / `"pdfua-2"` etc. Follows the XMP declaration when omitted (PDF/A wins when both are declared; falls back to pdfa-2b). **PDF/A-4 has no conformance level, so `"pdfa-4b"` does not exist** — `e` / `f` are variants, not levels |
| `engine` | `auto` / `verapdf` / `native` | Default auto (delegates when veraPDF is present) |

Reading the result: `compliant` is true/false under veraPDF. **Under the native engine, false = definitive violations found, null = "no violations in the checked subset" (not certification)**. Native PDF/UA violations carry a severity: only `error` can prove non-conformance; `warning` needs human review.

::: tip PDF/UA cannot be fully decided by machine
Whether alt text *exists* is machine-checkable; whether it is *meaningful* is not. For observing the structure tree itself, use pdf-reader's `inspect_tags`.
:::

### evaluate_policy

Returns a deterministic 4-value verdict (`trust_and_use` / `use_with_caution` / `human_review_required` / `reject`). Internally runs `verify_signatures`, `verify_integrity` and `detect_pades_level` (plus `validate_conformance` for long-term-preservation profiles) and folds the facts through a fixed rule table — **same facts and same profile always yield the same verdict**.

| Parameter | Type | Description |
|---|---|---|
| `profile` | `general` / `contract` / `financial` / `legal` / `medical` / `government` | Judgment profile. contract = signature required, identity-focused / financial, government = long-term-preservation checks / medical = most conservative (caution escalates to review) |
| `trust_anchors` | array\<string\> | Trust anchors. **Without them, even valid signatures cap at use_with_caution** (identity not evaluated) |
| `check_revocation` | `none` / `embedded` / `online` | Revocation checking. Default embedded |

Returns: `verdict`, `firedRules` (rule IDs with reasons), `advisories` (recommendations that do not affect the verdict), and a facts summary.

::: warning The judge is code, the narrative is the LLM
The verdict is decided by code. Use the returned firedRules / advisories **to explain the outcome, never to override it**. Do not read an advisory as a failure, or the absence of advisories as a pass. It judges authenticity and integrity only, never the truth of the content.
:::

Related: the Skill that builds a whole audit around this verdict is [pdf-trust](/skills/pdf-trust).

## Assertion strength

How strongly a verdict may be stated depends on whether the normative text is at hand → the [T1/T2/T3 rule](/guide/architecture#assertion-strength-t1-t2-t3). ETSI PAdES (T3) stays a structural observation, PDF/A (T2) goes as far as "veraPDF judged it", ISO 32000 / PDF/UA (T1) can quote the clause and state it plainly.
