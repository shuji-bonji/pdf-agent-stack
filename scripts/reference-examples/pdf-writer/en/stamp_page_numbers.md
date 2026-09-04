::: tip Artifact in tagged PDFs
The stamp is wrapped as an Artifact, preserving PDF/UA conformance. Formats containing CJK text need a font.
:::

::: warning Always pass `outputPath`
Omitting it returns the whole PDF as base64 and will overflow the chat. Pass an absolute destination path.
:::

::: warning A signed PDF errors by default
To keep signatures, pass `preserveSignatures: true` (incremental update). Set `allowBreakingSignatures: true` only if invalidating them is acceptable. They are not invalidated unless stated.
:::
