::: details Worked example — "Title, and is it tagged?"
- Measured: v0.15.0
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
  "title": "請求書（サンプル）— pdf-publish デモ",
  "author": "PDF Agent Stack",
  "pageCount": 1,
  "pdfVersion": "1.7",
  "isEncrypted": false,
  "isTagged": true,
  "hasSignatures": false,
  "fileSize": 88943
}
```

`isTagged` is an observation. It is not a PDF/UA verdict.
:::
