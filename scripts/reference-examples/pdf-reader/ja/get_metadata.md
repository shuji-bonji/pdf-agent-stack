::: details 呼び出し例 — 「タイトルとタグの有無を」
- 実測: v0.15.0
- 標本: `docs/specimens/publish-demo.pdf`（呼び出すときは絶対パス）
- `response_format`: `"json"`

**パラメータ**

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "response_format": "json"
}
```

**返る JSON**

```jsonc
{
  "title": "請求書（サンプル）— pdf-publish デモ",
  "author": "PDF Agent Stack",
  "pageCount": 1,
  "pdfVersion": "1.7",
  "isEncrypted": false,
  "isTagged": true,
  "hasSignatures": false,
  "fileSize": 88943
}
```

`isTagged` は観測です。PDF/UA かどうかの判定ではありません。
:::
