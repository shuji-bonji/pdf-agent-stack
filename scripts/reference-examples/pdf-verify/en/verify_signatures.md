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
