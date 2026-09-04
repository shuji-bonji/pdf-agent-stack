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
