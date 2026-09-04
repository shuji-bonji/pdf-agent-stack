::: tip タグ付き PDF では Artifact
ページ番号は Artifact として囲むため、PDF/UA 準拠が保たれます。日本語を含む `format` にはフォントが必須です。
:::

::: warning `outputPath` は必ず渡す
省略すると PDF 全体が base64 で返り、会話が破綻しやすいです。保存先は絶対パスで渡してください。
:::

::: warning 署名済み PDF は既定でエラー
署名を保つなら `preserveSignatures: true`（増分更新）。無効になってもよい場合のみ `allowBreakingSignatures: true`。明示が無ければ無効にしません。
:::
