::: warning 文書レベル情報は引き継がれない
ページを新しい文書へ複製するため、タグ付き構造・XMP・AcroForm・しおり等は引き継がれません。失われたものは warnings で報告されます。必要なら出力に `attach_file` / `ensure_tagged` / `add_bookmarks` / `set_metadata` を後がけしてください。
:::

::: warning `outputPath` は必ず渡す
省略すると PDF 全体が base64 で返り、会話が破綻しやすいです。保存先は絶対パスで渡してください。
:::

::: warning 署名済み PDF は既定でエラー
署名を保つ操作ではありません。無効になってもよい場合のみ `allowBreakingSignatures: true` を明示してください。明示が無ければ無効にしません。
:::

::: details 呼び出し例 — 「この 2 つの PDF を 1 つにまとめて」
- 実測: v0.21.0
- 標本: `docs/specimens/publish-demo.pdf` と `docs/specimens/selfmade-base.pdf`（呼び出すときは絶対パス）

**パラメータ**

```jsonc
{
  "inputPaths": [
    "/absolute/path/to/docs/specimens/publish-demo.pdf",
    "/absolute/path/to/docs/specimens/selfmade-base.pdf"
  ],
  "outputPath": "/absolute/path/to/output.pdf"
}
```

**返る JSON**（warnings は要約）

```jsonc
{
  "pageCount": 2,
  "bytes": 35552,
  "path": "/absolute/path/to/output.pdf",
  "warnings": [
    "The input XMP declares conformance (pdfuaid/pdfaid) that this output can no longer meet — the structure tree is not carried over yet — so it was dropped rather than copied. …",
    "merge_pdfs did not carry over the tagged structure (/StructTreeRoot, /MarkInfo) that the input had …",
    "merge_pdfs did not carry over the XMP metadata (/Metadata) that the input had …"
  ]
}
```

XMP の pdfaid / pdfuaid はコピーせず落とします。名乗ったまま構造木が無いファイルは、名乗らないファイルより悪いためです。
:::
