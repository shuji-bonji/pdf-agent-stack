::: tip フィールド名が分からないとき
存在しない名前を 1 つ渡すと、エラーに全フィールド名と型が列挙されます。メッセージ文字列ではなく `code` で分岐してください。
:::

::: warning XFA には対応していません
AcroForm だけです。`flatten: true` をタグ付き PDF に使うと PDF/UA 準拠でなくなり、さらに `allowBreakingTags: true` が必要です。
:::

::: warning `outputPath` は必ず渡す
省略すると PDF 全体が base64 で返り、会話が破綻しやすいです。保存先は絶対パスで渡してください。
:::

::: details 呼び出し例 — 「フォームに値を流し込む」（AcroForm が無い標本）
- 実測: v0.21.0
- 標本: `docs/specimens/publish-demo.pdf`（呼び出すときは絶対パス。AcroForm 無し）
- `fields`: `{ "dummy": "x" }`

**パラメータ**

```jsonc
{
  "inputPath": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "fields": { "dummy": "x" },
  "outputPath": "/absolute/path/to/output.pdf"
}
```

**返る JSON**（エラー）

```jsonc
{
  "error": "\"/absolute/path/to/docs/specimens/publish-demo.pdf\" has no AcroForm fields to fill.",
  "code": "INVALID_ARGUMENT"
}
```

フィールドが無いときはこの `code` です。フィールドはあるが名前を間違えたときは、エラー本文に名前と型が列挙されます。
:::
