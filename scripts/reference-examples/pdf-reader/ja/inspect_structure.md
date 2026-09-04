::: details 呼び出し例 — 「カタログに何があるか」
- 実測: v0.15.0
- 標本: `docs/specimens/publish-demo.pdf`（呼び出すときは絶対パス）
- `response_format`: `"json"`

`catalog` は一部だけ残しています。

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
  "catalog": [
    { "key": "Type", "type": "name", "value": "Catalog" },
    { "key": "Pages", "type": "ref", "value": "ref(1)" },
    { "key": "StructTreeRoot", "type": "ref", "value": "ref(5)" },
    { "key": "Lang", "type": "string", "value": "ja" }
  ],
  "pageTree": {
    "totalPages": 1,
    "mediaBoxSamples": [{ "page": 1, "width": 595.28, "height": 841.89 }]
  },
  "objectStats": {
    "totalObjects": 52,
    "unreadable": 0
  },
  "isEncrypted": false,
  "pdfVersion": "1.7"
}
```

`unreadable: 0` は「全オブジェクトを読んだ」です。「何も調べていない」ではありません。
:::
