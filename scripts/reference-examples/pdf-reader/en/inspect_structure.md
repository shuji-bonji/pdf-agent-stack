::: details Worked example — "What is in the catalog?"
- Measured: v0.15.0
- Specimen: `docs/specimens/publish-demo.pdf` (pass an absolute path)
- `response_format`: `"json"`

`catalog` trimmed.

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
  "catalog": [
    { "key": "Type", "type": "name", "value": "Catalog" },
    { "key": "Pages", "type": "ref", "value": "ref(1)" },
    { "key": "StructTreeRoot", "type": "ref", "value": "ref(5)" },
    { "key": "Lang", "type": "string", "value": "ja" }
  ],
  "pageTree": {
    "totalPages": 1,
    "mediaBoxSamples": [{ "page": 1, "width": 595.28, "height": 841.89 }]
  },
  "objectStats": {
    "totalObjects": 52,
    "unreadable": 0
  },
  "isEncrypted": false,
  "pdfVersion": "1.7"
}
```

`unreadable: 0` means "every object was read", not "nothing was checked".
:::
