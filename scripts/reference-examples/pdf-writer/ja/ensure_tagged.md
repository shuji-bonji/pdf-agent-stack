::: danger 書いたのは宣言。適合の証明ではない
XMP に pdfuaid を書きます。適合していない文書に適用すると、適合していないのに適合を名乗った PDF になります。書いたら必ず pdf-verify-mcp の `validate_conformance`（`flavour: "pdfua-1"`）で測ってください。測れないなら宣言を書かないでください。
:::

::: warning 機械は意味を推定できません
新設するのは最小限の構造木（各ページ = 1 つの P 要素）です。見出し・表・リスト・読み順・図の代替テキストは作られません。最初から `tagged: true` で作れるなら、そちらを使ってください。
:::

::: warning `outputPath` は必ず渡す
省略すると PDF 全体が base64 で返り、会話が破綻しやすいです。保存先は絶対パスで渡してください。
:::

::: details 呼び出し例 — 「既存 PDF を PDF/UA-1 の器に載せて」
- 実測: v0.21.0
- 標本: `docs/specimens/selfmade-base.pdf`（呼び出すときは絶対パス。既にタグ付き）
- `title`: `"Selfmade base"`
- `lang`: `"en"`

**パラメータ**

```jsonc
{
  "inputPath": "/absolute/path/to/docs/specimens/selfmade-base.pdf",
  "title": "Selfmade base",
  "lang": "en",
  "outputPath": "/absolute/path/to/output.pdf"
}
```

**返る JSON**

```jsonc
{
  "pageCount": 1,
  "bytes": 18406,
  "path": "/absolute/path/to/output.pdf",
  "wasTagged": true,
  "createdStructure": false,
  "wrappedPages": 0,
  "addedRequirements": [
    "Lang",
    "ViewerPreferences/DisplayDocTitle",
    "XMP(pdfuaid:part, dc:title)"
  ]
}
```

既にタグ付きなので構造木には触らず、欠けていた文書レベル要件だけを補いました。宣言を書いたあとは `validate_conformance`（`flavour: "pdfua-1"`）で測ります。
:::
