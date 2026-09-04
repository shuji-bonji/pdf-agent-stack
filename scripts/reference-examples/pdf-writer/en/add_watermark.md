::: tip Artifact in tagged PDFs
The watermark is wrapped as an Artifact, preserving PDF/UA conformance. CJK strings need a font.
:::

::: warning Always pass `outputPath`
Omitting it returns the whole PDF as base64 and will overflow the chat. Pass an absolute destination path.
:::

::: warning A signed PDF errors by default
To keep signatures, pass `preserveSignatures: true` (incremental update). Set `allowBreakingSignatures: true` only if invalidating them is acceptable. They are not invalidated unless stated.
:::

::: details Worked example — "Put a DRAFT watermark on every page"
- Measured: v0.21.0
- Specimen: `docs/specimens/publish-demo.pdf` (pass an absolute path)
- `text`: `"DRAFT"`

**Parameters**

```jsonc
{
  "inputPath": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "text": "DRAFT",
  "outputPath": "/absolute/path/to/output.pdf"
}
```

**Returned JSON**

```jsonc
{
  "pageCount": 1,
  "bytes": 93321,
  "path": "/absolute/path/to/output.pdf",
  "watermarked": 1,
  "artifact": true
}
```

`artifact: true` means the watermark was wrapped as an Artifact on a tagged input.
:::
