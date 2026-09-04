::: details Worked example — "Show me the signature-field structure"
- Measured: v0.15.0
- Specimen: `docs/specimens/selfmade-pades-lta.pdf` (pass an absolute path)
- `response_format`: `"json"`

No cryptographic verification is performed.

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
  "totalFields": 2,
  "signedCount": 2,
  "unsignedCount": 0,
  "fields": [
    {
      "fieldName": "Sig1",
      "isSigned": true,
      "reason": "known-good specimen",
      "signingTime": "D:20260811163237+09'00'",
      "filter": "Adobe.PPKLite",
      "subFilter": "ETSI.CAdES.detached"
    },
    {
      "fieldName": "Timestamp-938ea022-8782-4761-b0a2-a5ba44d069e4",
      "isSigned": true,
      "filter": "Adobe.PPKLite",
      "subFilter": "ETSI.RFC3161"
    }
  ],
  "note": "Cryptographic signature verification is not performed. Only field structure is inspected."
}
```

Whether a signature is mathematically valid is pdf-verify-mcp's `verify_signatures` / `verify_integrity`.
:::
