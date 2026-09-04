::: info Documents with XMP also sync dc:title and similar
Only the Info dictionary would otherwise diverge from XMP. At least one of `title` / `author` / `subject` / `keywords` / `creator` is required.
:::

::: warning Always pass `outputPath`
Omitting it returns the whole PDF as base64 and will overflow the chat. Pass an absolute destination path.
:::

::: warning A signed PDF errors by default
To keep signatures, pass `preserveSignatures: true` (incremental update). Set `allowBreakingSignatures: true` only if invalidating them is acceptable. They are not invalidated unless stated.
:::
