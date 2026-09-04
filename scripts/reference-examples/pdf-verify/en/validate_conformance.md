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
