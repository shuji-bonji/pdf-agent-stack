::: info Untagged documents are out of scope
This repairs a tagged PDF's form to PDF/UA-1 (Widgets enclosed in Form, `/Tabs S`, `/TU`). It is idempotent. For an untagged file, run `ensure_tagged` first or build with `tagged: true`.
:::

::: warning Always pass `outputPath`
Omitting it returns the whole PDF as base64 and will overflow the chat. Pass an absolute destination path.
:::

::: warning A signed PDF errors by default
To keep signatures, pass `preserveSignatures: true` (approval signatures only; certification signatures are refused). Set `allowBreakingSignatures: true` only if invalidating them is acceptable. They are not invalidated unless stated.
:::
