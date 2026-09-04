::: details Worked example — "Headings and paragraphs in logical order, with positions"
- Measured: v0.15.0
- Specimen: `docs/specimens/publish-demo.pdf` (pass an absolute path)
- `pages`: `"1"`
- `include_bbox`: `true`
- `response_format`: `"json"`

`elements` trimmed to the first two items.

**Parameters**

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "pages": "1",
  "include_bbox": true,
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
  "isTagged": true,
  "lang": "ja",
  "elements": [
    {
      "role": "H1",
      "depth": 1,
      "text": "請求書（サンプル）— pdf-publish デモ",
      "pages": [1],
      "boxes": [
        {
          "page": 1,
          "rect": { "x1": 56, "y1": 766.306, "x2": 375.194, "y2": 792.37 },
          "basis": "text-extent"
        }
      ]
    },
    {
      "role": "P",
      "depth": 1,
      "text": "株式会社サンプル商事 御中",
      "pages": [1],
      "boxes": [
        {
          "page": 1,
          "rect": { "x1": 56, "y1": 699.322, "x2": 190.464, "y2": 715.25 },
          "basis": "text-extent"
        }
      ]
    }
    // … H2 "請求明細", Table, remarks follow
  ]
}
```

`rect` is PDF user space (origin bottom-left, pt). pdf-writer-mcp's `add_annotation` takes it as-is. `basis` is `text-extent`, so it is measured from the text.
:::
