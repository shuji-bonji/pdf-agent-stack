::: warning `outputPath` は必ず渡す
省略すると PDF 全体が base64 で返り、会話が破綻しやすいです。保存先は絶対パスで渡してください。
:::

::: warning `tagged: true` と `pdfVersion: "2.0"` は併用できません
このサーバーが書ける適合宣言は PDF/UA-1（PDF 1.7 基盤）だけです。PDF 2.0 の文書に載せると、誰にも測れない宣言になります。
:::

::: tip タグ付きにするなら最初から
後から `ensure_tagged` を掛けるより、`tagged: true` で作るほうが良い文書になります。PDF/UA はタイトル必須のため `title` も必須です。`lang` は確実なら明示してください。
:::

::: details 呼び出し例 — 「タグ付きの短い PDF を作って」
- 実測: v0.21.0
- `tagged`: `true`
- `lang`: `"en"`
- `title`: `"Tagged sample"`
- フォント: 標準 Helvetica（`fontPath` なし）

**パラメータ**

```jsonc
{
  "text": "This is a tagged sample.\n\nSecond paragraph.",
  "title": "Tagged sample",
  "tagged": true,
  "lang": "en",
  "outputPath": "/absolute/path/to/output.pdf"
}
```

**返る JSON**

```jsonc
{
  "pageCount": 1,
  "bytes": 4122,
  "font": "Helvetica",
  "path": "/absolute/path/to/output.pdf",
  "warnings": [
    "The standard font (Helvetica) is not embedded, but PDF/UA-1 (7.21.4.1) requires all fonts to be embedded — this tagged PDF will NOT pass conformance validation. Pass \"fontPath\" (or set PDF_WRITER_FONT) to embed a font."
  ]
}
```

標準フォントは埋め込まれないため、PDF/UA-1 7.21.4.1 では veraPDF は通りません。日本語やタグ付き納品では `fontPath`（または `PDF_WRITER_FONT`）を渡してください。
:::
