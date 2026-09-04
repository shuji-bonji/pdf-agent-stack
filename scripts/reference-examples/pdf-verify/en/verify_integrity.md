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
