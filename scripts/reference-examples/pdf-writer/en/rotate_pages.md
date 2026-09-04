::: warning Always pass `outputPath`
Omitting it returns the whole PDF as base64 and will overflow the chat. Pass an absolute destination path.
:::

::: warning A signed PDF errors by default
This is not a signature-preserving operation. Set `allowBreakingSignatures: true` only if invalidating signatures is acceptable. They are not invalidated unless stated.
:::
