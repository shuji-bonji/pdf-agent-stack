::: warning Always pass `outputPath`
Omitting it returns the whole PDF as base64 and will overflow the chat. Pass an absolute destination path.
:::

::: warning `tagged: true` cannot be combined with `pdfVersion: "2.0"`
The only conformance declaration this server can write is PDF/UA-1 (built on PDF 1.7). Putting it on a PDF 2.0 document would make a declaration nobody can measure.
:::

::: tip If it should be tagged, tag it from the start
Building with `tagged: true` beats applying `ensure_tagged` afterwards. PDF/UA requires a title, so `title` becomes required. Set `lang` explicitly when you know it.
:::

The call shape matches [`create_text_pdf`](#create-text-pdf) (`headers` and `rows` instead of `text`).
