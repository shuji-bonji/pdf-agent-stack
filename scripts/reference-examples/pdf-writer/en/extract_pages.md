::: warning Document-level information is not carried over
Pages are copied into a new document, so tagged structure, XMP, AcroForm, bookmarks and similar are not carried over. What was lost is reported in warnings — follow up on the output with `attach_file` / `ensure_tagged` / `add_bookmarks` / `set_metadata` as needed.
:::

::: warning Always pass `outputPath`
Omitting it returns the whole PDF as base64 and will overflow the chat. Pass an absolute destination path.
:::

::: info `pages` is a string
`"1"` / `"1,3-5,8-"` — not an array. The given order becomes the output order.
:::

::: details Worked example — "Extract page 1 only"
- Measured: v0.21.0
- Specimen: `docs/specimens/publish-demo.pdf` (pass an absolute path)
- `pages`: `"1"`

**Parameters**

```jsonc
{
  "inputPath": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "pages": "1",
  "outputPath": "/absolute/path/to/output.pdf"
}
```

**Returned JSON** (warnings abbreviated)

```jsonc
{
  "pageCount": 1,
  "bytes": 26881,
  "path": "/absolute/path/to/output.pdf",
  "warnings": [
    "The input XMP declares conformance (pdfuaid/pdfaid) that this output can no longer meet — the structure tree is not carried over yet — so it was dropped rather than copied. …",
    "extract_pages did not carry over the tagged structure (/StructTreeRoot, /MarkInfo) that the input had …",
    "extract_pages did not carry over the XMP metadata (/Metadata) that the input had …"
  ]
}
```
:::
