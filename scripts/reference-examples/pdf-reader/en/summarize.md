::: details Worked example — "Give me an overview of this PDF"
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

**Returned JSON** (`textPreview` omitted)

```jsonc
{
  "scope": {
    "metadata": { "status": "read" },
    "textPreview": { "status": "read" },
    "imageCount": { "status": "read" },
    "extractabilityObservation": { "status": "read" }
  },
  "metadata": {
    "title": "請求書（サンプル）— pdf-publish デモ",
    "pageCount": 1,
    "pdfVersion": "1.7",
    "isEncrypted": false,
    "isTagged": true,
    "hasSignatures": false,
    "fileSize": 88943
  },
  "imageCount": 0,
  "hasText": true,
  "textExtractability": "extracted",
  "unreadablePages": [],
  "next": [
    "isTagged is true: extract_structured_text returns the body in logical content order …"
  ]
}
```

`isTagged: true` and `textExtractability: "extracted"`, so the next call is [`extract_structured_text`](#extract-structured-text). `next` is a suggestion, not an order.
:::
