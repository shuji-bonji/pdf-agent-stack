::: warning Document-level information is not carried over
Pages are copied into a new document, so tagged structure, XMP, AcroForm, bookmarks and similar are not carried over. What was lost is reported in warnings — follow up on the output with `attach_file` / `ensure_tagged` / `add_bookmarks` / `set_metadata` as needed.
:::

::: warning Always pass `outputPath`
Omitting it returns the whole PDF as base64 and will overflow the chat. Pass an absolute destination path.
:::

::: warning A signed PDF errors by default
This is not a signature-preserving operation. Set `allowBreakingSignatures: true` only if invalidating signatures is acceptable. They are not invalidated unless stated.
:::
