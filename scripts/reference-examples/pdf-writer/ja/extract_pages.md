::: warning 文書レベル情報は引き継がれない
ページを新しい文書へ複製するため、タグ付き構造・XMP・AcroForm・しおり等は引き継がれません。失われたものは warnings で報告されます。必要なら出力に `attach_file` / `ensure_tagged` / `add_bookmarks` / `set_metadata` を後がけしてください。
:::

::: warning `outputPath` は必ず渡す
省略すると PDF 全体が base64 で返り、会話が破綻しやすいです。保存先は絶対パスで渡してください。
:::

::: info `pages` は文字列
`"1"` / `"1,3-5,8-"` です。配列ではありません。指定順が出力順になります。
:::

::: details 呼び出し例 — 「1 ページ目だけ抜き出して」
- 実測: v0.21.0
- 標本: `docs/specimens/publish-demo.pdf`（呼び出すときは絶対パス）
- `pages`: `"1"`

**パラメータ**

```jsonc
{
  "inputPath": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "pages": "1",
  "outputPath": "/absolute/path/to/output.pdf"
}
```

**返る JSON**（warnings は要約）

```jsonc
{
  "pageCount": 1,
  "bytes": 26881,
  "path": "/absolute/path/to/output.pdf",
  "warnings": [
    "The input XMP declares conformance (pdfuaid/pdfaid) that this output can no longer meet — the structure tree is not carried over yet — so it was dropped rather than copied. …",
    "extract_pages did not carry over the tagged structure (/StructTreeRoot, /MarkInfo) that the input had …",
    "extract_pages did not carry over the XMP metadata (/Metadata) that the input had …"
  ]
}
```
:::
