::: info タグ無し文書は対象外
タグ付き PDF のフォームを PDF/UA-1 へ修復します（Widget を Form へ内包、`/Tabs S`、`/TU`）。何度実行しても結果は同じです。タグ無しなら先に `ensure_tagged` か、作成時の `tagged: true` です。
:::

::: warning `outputPath` は必ず渡す
省略すると PDF 全体が base64 で返り、会話が破綻しやすいです。保存先は絶対パスで渡してください。
:::

::: warning 署名済み PDF は既定でエラー
署名を保つなら `preserveSignatures: true`（承認署名のみ。認証署名は拒否）。無効になってもよい場合のみ `allowBreakingSignatures: true`。明示が無ければ無効にしません。
:::
