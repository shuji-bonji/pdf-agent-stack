::: tip タグ付き PDF では Artifact
透かしは Artifact として囲むため、PDF/UA 準拠が保たれます。日本語の文字列にはフォントが必須です。
:::

::: warning `outputPath` は必ず渡す
省略すると PDF 全体が base64 で返り、会話が破綻しやすいです。保存先は絶対パスで渡してください。
:::

::: warning 署名済み PDF は既定でエラー
署名を保つなら `preserveSignatures: true`（増分更新）。無効になってもよい場合のみ `allowBreakingSignatures: true`。明示が無ければ無効にしません。
:::

::: details 呼び出し例 — 「全ページに DRAFT の透かしを入れて」
- 実測: v0.21.0
- 標本: `docs/specimens/publish-demo.pdf`（呼び出すときは絶対パス）
- `text`: `"DRAFT"`

**パラメータ**

```jsonc
{
  "inputPath": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "text": "DRAFT",
  "outputPath": "/absolute/path/to/output.pdf"
}
```

**返る JSON**

```jsonc
{
  "pageCount": 1,
  "bytes": 93321,
  "path": "/absolute/path/to/output.pdf",
  "watermarked": 1,
  "artifact": true
}
```

`artifact: true` は、タグ付き入力では透かしが Artifact として囲まれたことを示します。
:::
