::: details 呼び出し例 — 「この PDF の概要を見せて」
- 実測: v0.15.0
- 標本: `docs/specimens/publish-demo.pdf`（呼び出すときは絶対パス）
- `response_format`: `"json"`

**パラメータ**

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "response_format": "json"
}
```

**返る JSON**（`textPreview` は省略）

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

`isTagged: true` と `textExtractability: "extracted"` なので、次は [`extract_structured_text`](#extract-structured-text) です。`next` は提案であり、強制ではありません。
:::
