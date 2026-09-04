::: warning Document-level information is not carried over
Pages are copied into a new document, so tagged structure, XMP, AcroForm, bookmarks and similar are not carried over. What was lost is reported in warnings — follow up on the output with `attach_file` / `ensure_tagged` / `add_bookmarks` / `set_metadata` as needed.
:::

::: warning Always pass `outputPath`
Omitting it returns the whole PDF as base64 and will overflow the chat. Pass an absolute destination path.
:::

::: warning A signed PDF errors by default
This is not a signature-preserving operation. Set `allowBreakingSignatures: true` only if invalidating signatures is acceptable. They are not invalidated unless stated.
:::

::: details Worked example — "Merge these two PDFs into one"
- Measured: v0.21.0
- Specimens: `docs/specimens/publish-demo.pdf` and `docs/specimens/selfmade-base.pdf` (pass absolute paths)

**Parameters**

```jsonc
{
  "inputPaths": [
    "/absolute/path/to/docs/specimens/publish-demo.pdf",
    "/absolute/path/to/docs/specimens/selfmade-base.pdf"
  ],
  "outputPath": "/absolute/path/to/output.pdf"
}
```

**Returned JSON** (warnings abbreviated)

```jsonc
{
  "pageCount": 2,
  "bytes": 35552,
  "path": "/absolute/path/to/output.pdf",
  "warnings": [
    "The input XMP declares conformance (pdfuaid/pdfaid) that this output can no longer meet — the structure tree is not carried over yet — so it was dropped rather than copied. …",
    "merge_pdfs did not carry over the tagged structure (/StructTreeRoot, /MarkInfo) that the input had …",
    "merge_pdfs did not carry over the XMP metadata (/Metadata) that the input had …"
  ]
}
```

pdfaid / pdfuaid in XMP is dropped rather than copied. A file that still claims conformance without a structure tree is worse than one that claims nothing.
:::
