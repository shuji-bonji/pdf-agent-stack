::: details Worked example — "The text of page 1"
- Measured: v0.15.0
- Specimen: `docs/specimens/publish-demo.pdf` (pass an absolute path)
- `pages`: `"1"`
- `response_format`: `"json"`

This specimen is tagged, so when order matters call [`extract_structured_text`](#extract-structured-text) first.

**Parameters**

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "pages": "1",
  "response_format": "json"
}
```

**Returned JSON**

```jsonc
{
  "scope": {
    "textExtraction": { "status": "read" },
    "extractabilityObservation": { "status": "read" }
  },
  "pages": [
    {
      "page": 1,
      "text": "請求書（サンプル）— pdf-publish デモ\n請求書（サンプル）\n株式会社サンプル商事 御中\n…",
      "extractability": {
        "page": 1,
        "unmappableFonts": [],
        "state": "extracted"
      }
    }
  ]
}
```

If `extractability.state` is `no_text_layer` or `not_extractable`, the next call is [`render_page`](#render-page).
:::
