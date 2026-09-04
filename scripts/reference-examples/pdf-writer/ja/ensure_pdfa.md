::: danger 書いたのは宣言。適合の証明ではない
XMP に pdfaid を書きます。フォント未埋め込み・暗号化・JavaScript などは直りません。適合していない文書に適用すると、適合していないのに適合を名乗った PDF になります。書いたら必ず pdf-verify-mcp の `validate_conformance` で測ってください。flavour にはここに渡したものと同じ文字列を指定します。測れないなら宣言を書かないでください。PDF/A の結果は「veraPDF が COMPLIANT と判定した」までです。
:::

::: warning 添付があるなら `"pdfa-4f"`
素の `"pdfa-4"` は添付ファイル自身が PDF/A であることを要求します（`6.9-3`）。CSV や JSON を同梱するなら `"pdfa-4f"` です。PDF/A-4 系はヘッダを PDF 2.0 にし Info 辞書を削除します。`preserveSignatures` との併用は、入力が既に PDF 2.0 でない限り拒否されます。
:::

::: warning `outputPath` は必ず渡す
省略すると PDF 全体が base64 で返り、会話が破綻しやすいです。保存先は絶対パスで渡してください。
:::

::: details 呼び出し例 — 「PDF/A-3b の器に載せて」
- 実測: v0.21.0
- 標本: `docs/specimens/publish-demo.pdf`（呼び出すときは絶対パス。既に PDF/A-3b を宣言）
- `flavour`: `"pdfa-3b"`

**パラメータ**

```jsonc
{
  "inputPath": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "flavour": "pdfa-3b",
  "outputPath": "/absolute/path/to/output.pdf"
}
```

**返る JSON**（warnings は要約）

```jsonc
{
  "pageCount": 1,
  "bytes": 92945,
  "path": "/absolute/path/to/output.pdf",
  "flavour": "3b",
  "addedRequirements": ["XMP pdfaid (part 3, conformance B)"],
  "wasDeclared": true,
  "warnings": [
    "The document already has a trailer /ID; it was left unchanged.",
    "The document already declares a GTS_PDFA1 output intent; it was left unchanged.",
    "This file now CLAIMS PDF/A-3b (pdfaid:part=3, conformance=B), but conformance was NOT checked here. … Verify before relying on it: pdf-verify-mcp validate_conformance(flavour: \"pdfa-3b\") …"
  ]
}
```

この warnings は異常ではなく設計です。捨てないでください。合否は veraPDF の `validate_conformance` です。
:::
