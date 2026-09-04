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
