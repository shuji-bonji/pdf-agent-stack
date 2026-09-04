::: warning タグ付き PDF では既定で拒否
Widget 注釈が消えて Form 構造要素が宙に浮くためです。`allowBreakingTags: true` で強行できますが、PDF/UA 準拠でなくなります。
:::

::: warning `outputPath` は必ず渡す
省略すると PDF 全体が base64 で返り、会話が破綻しやすいです。保存先は絶対パスで渡してください。
:::

::: warning 署名済み PDF は既定でエラー
署名を保つ操作ではありません。無効になってもよい場合のみ `allowBreakingSignatures: true` を明示してください。明示が無ければ無効にしません。
:::
