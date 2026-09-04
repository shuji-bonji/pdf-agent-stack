::: info Coordinates are PDF space
Origin bottom-left, pt. Pass the rectangles pdf-reader-mcp's `locate_objects` / `extract_structured_text` (`include_bbox`) return as-is. In tagged documents the annotation is enclosed in an Annot structure element (PDF/UA 7.18.1-1); alt text for assistive technology goes in `alt`.
:::

::: warning Always pass `outputPath`
Omitting it returns the whole PDF as base64 and will overflow the chat. Pass an absolute destination path.
:::

::: warning A signed PDF errors by default
To keep signatures, pass `preserveSignatures: true` (incremental update; under DocMDP, allowed only at P=3). Set `allowBreakingSignatures: true` only if invalidating them is acceptable. They are not invalidated unless stated.
:::

::: details Worked example — "Put a square annotation on the H1 rectangle"
- Measured: v0.21.0
- Specimen: `docs/specimens/publish-demo.pdf` (pass an absolute path)
- `type`: `"square"`
- `rect`: the H1 bbox pdf-reader-mcp returned — (56, 766.306)–(375.194, 792.37)

**Parameters**

```jsonc
{
  "inputPath": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "page": 1,
  "type": "square",
  "rect": { "x1": 56, "y1": 766.306, "x2": 375.194, "y2": 792.37 },
  "contents": "H1",
  "alt": "Heading highlight",
  "outputPath": "/absolute/path/to/output.pdf"
}
```

**Returned JSON**

```jsonc
{
  "pageCount": 1,
  "bytes": 93486,
  "path": "/absolute/path/to/output.pdf"
}
```
:::
