::: details Worked example — "Where are objects 7, 9 and 4?"
- Measured: v0.15.0
- Specimen: `docs/specimens/publish-demo.pdf` (pass an absolute path)
- `object_numbers`: `[7, 9, 4]`
- `response_format`: `"json"`

Typical input is the object numbers pdf-verify-mcp's `verify_integrity` returned.

**Parameters**

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "object_numbers": [7, 9, 4],
  "response_format": "json"
}
```

**Returned JSON**

```jsonc
{
  "objects": [
    {
      "objectNumber": 7,
      "found": true,
      "type": "Page",
      "locations": [
        {
          "page": 1,
          "rect": { "x1": 0, "y1": 0, "x2": 595.28, "y2": 841.89 },
          "basis": "page-box"
        }
      ]
    },
    {
      "objectNumber": 9,
      "found": true,
      "type": null,
      "locations": [
        {
          "page": 1,
          "rect": { "x1": 0, "y1": 0, "x2": 595.28, "y2": 841.89 },
          "basis": "page-content-stream"
        }
      ],
      "reason": "This is the page's content stream, so the rectangle is the whole page. …"
    },
    {
      "objectNumber": 4,
      "found": true,
      "type": "Font",
      "subtype": "Type0",
      "locations": [{ "page": 1, "rect": null, "basis": "page-resource" }],
      "reason": "A resource is used by the page but has no rectangle of its own; …"
    }
  ],
  "isEncrypted": false
}
```

A `page-content-stream` rectangle is the whole page. To point at a paragraph, use [`extract_structured_text`](#extract-structured-text) with `include_bbox`.
:::
