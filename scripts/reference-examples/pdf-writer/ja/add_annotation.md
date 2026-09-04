::: info 座標は PDF 座標系
左下原点・pt です。pdf-reader-mcp の `locate_objects` / `extract_structured_text`（`include_bbox`）が返す矩形をそのまま渡せます。タグ付き文書では Annot 構造要素への内包（PDF/UA 7.18.1-1）も行い、支援技術向けの代替テキストは `alt` で渡します。
:::

::: warning `outputPath` は必ず渡す
省略すると PDF 全体が base64 で返り、会話が破綻しやすいです。保存先は絶対パスで渡してください。
:::

::: warning 署名済み PDF は既定でエラー
署名を保つなら `preserveSignatures: true`（増分更新。DocMDP では P=3 のときのみ許可）。無効になってもよい場合のみ `allowBreakingSignatures: true`。明示が無ければ無効にしません。
:::

::: details 呼び出し例 — 「H1 の矩形に四角注釈を付けて」
- 実測: v0.21.0
- 標本: `docs/specimens/publish-demo.pdf`（呼び出すときは絶対パス）
- `type`: `"square"`
- `rect`: pdf-reader-mcp が返した H1 の bbox（56, 766.306）–（375.194, 792.37）

**パラメータ**

```jsonc
{
  "inputPath": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "page": 1,
  "type": "square",
  "rect": { "x1": 56, "y1": 766.306, "x2": 375.194, "y2": 792.37 },
  "contents": "H1",
  "alt": "Heading highlight",
  "outputPath": "/absolute/path/to/output.pdf"
}
```

**返る JSON**

```jsonc
{
  "pageCount": 1,
  "bytes": 93486,
  "path": "/absolute/path/to/output.pdf"
}
```
:::
