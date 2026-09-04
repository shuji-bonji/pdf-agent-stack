::: warning Always pass `outputPath`
Omitting it returns the whole PDF as base64 and will overflow the chat. Pass an absolute destination path.
:::

::: warning `tagged: true` cannot be combined with `pdfVersion: "2.0"`
The only conformance declaration this server can write is PDF/UA-1 (built on PDF 1.7). Putting it on a PDF 2.0 document would make a declaration nobody can measure.
:::

::: tip If it should be tagged, tag it from the start
Building with `tagged: true` beats applying `ensure_tagged` afterwards. PDF/UA requires a title, so `title` becomes required. Set `lang` explicitly when you know it.
:::

::: details Worked example — "Make a short tagged PDF"
- Measured: v0.21.0
- `tagged`: `true`
- `lang`: `"en"`
- `title`: `"Tagged sample"`
- Font: standard Helvetica (no `fontPath`)

**Parameters**

```jsonc
{
  "text": "This is a tagged sample.\n\nSecond paragraph.",
  "title": "Tagged sample",
  "tagged": true,
  "lang": "en",
  "outputPath": "/absolute/path/to/output.pdf"
}
```

**Returned JSON**

```jsonc
{
  "pageCount": 1,
  "bytes": 4122,
  "font": "Helvetica",
  "path": "/absolute/path/to/output.pdf",
  "warnings": [
    "The standard font (Helvetica) is not embedded, but PDF/UA-1 (7.21.4.1) requires all fonts to be embedded — this tagged PDF will NOT pass conformance validation. Pass \"fontPath\" (or set PDF_WRITER_FONT) to embed a font."
  ]
}
```

The standard font is not embedded, so veraPDF will not pass PDF/UA-1 7.21.4.1. For Japanese or tagged delivery, pass `fontPath` (or `PDF_WRITER_FONT`).
:::
