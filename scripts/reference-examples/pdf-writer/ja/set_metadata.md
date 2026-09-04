::: info XMP がある文書では dc:title 等も同期します
Info 辞書だけを変えて XMP と食い違わないようにします。`title` / `author` / `subject` / `keywords` / `creator` の少なくとも 1 つが必須です。
:::

::: warning `outputPath` は必ず渡す
省略すると PDF 全体が base64 で返り、会話が破綻しやすいです。保存先は絶対パスで渡してください。
:::

::: warning 署名済み PDF は既定でエラー
署名を保つなら `preserveSignatures: true`（増分更新）。無効になってもよい場合のみ `allowBreakingSignatures: true`。明示が無ければ無効にしません。
:::
