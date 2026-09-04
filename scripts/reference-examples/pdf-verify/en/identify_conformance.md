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
