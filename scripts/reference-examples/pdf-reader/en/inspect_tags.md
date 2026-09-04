::: details Worked example — "Observe the tag structure"
- Measured: v0.15.0
- Specimen: `docs/specimens/publish-demo.pdf` (pass an absolute path)
- `response_format`: `"json"`

The full tree is omitted; counts only.

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
  "isTagged": true,
  "maxDepth": 5,
  "totalElements": 29,
  "roleCounts": {
    "Document": 1,
    "H1": 2,
    "P": 3,
    "H2": 2,
    "Table": 1,
    "TR": 4,
    "TH": 4,
    "TD": 12
  }
}
```

No pass/fail. PDF/UA judgment is pdf-verify-mcp's `validate_conformance`.
:::
