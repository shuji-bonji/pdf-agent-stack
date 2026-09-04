::: warning `outputPath` は必ず渡す
省略すると PDF 全体が base64 で返り、会話が破綻しやすいです。保存先は絶対パスで渡してください。
:::

::: warning `tagged: true` と `pdfVersion: "2.0"` は併用できません
このサーバーが書ける適合宣言は PDF/UA-1（PDF 1.7 基盤）だけです。PDF 2.0 の文書に載せると、誰にも測れない宣言になります。
:::

::: tip タグ付きにするなら最初から
後から `ensure_tagged` を掛けるより、`tagged: true` で作るほうが良い文書になります。PDF/UA はタイトル必須のため `title` も必須です。`lang` は確実なら明示してください。
:::

呼び出し例の形は [`create_text_pdf`](#create-text-pdf) と同じです（`text` の代わりに `markdown`）。
