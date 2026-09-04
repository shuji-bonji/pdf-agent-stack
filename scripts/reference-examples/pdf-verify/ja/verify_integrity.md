::: warning 増分更新は改ざんではない
署名の追加や DSS / 文書タイムスタンプの付与は PDF として正当です。返るのは「レビューすべき点」であって、自動的に改ざんを意味しません。
:::

::: warning xref チェーンを辿れないことと、変更が無いことは同じではありません
辿れなかったときは空配列ではなく `null` です。辿れないことを「変更なし」と読むと、確認できていない事実を確定してしまいます。
:::

::: details 呼び出し例 — 「署名のあとに何が書かれたか」
- 実測: v0.26.0
- 標本: `docs/specimens/selfmade-pades-lta.pdf`（呼び出すときは絶対パス）
- `response_format`: `"json"`

**パラメータ**

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/selfmade-pades-lta.pdf",
  "response_format": "json"
}
```

**返る JSON**（`revisions` の中身は省略）

```jsonc
{
  "scope": { "chainStop": { "kind": "complete" }, "reconstructed": false },
  "revisionCount": 4,
  "incrementalUpdateCount": 3,
  "signatureCount": 2,
  "lastSignatureCoversFile": false,
  "hasDss": true,
  "objectChangesAfterLastSignature": [
    { "objectNumber": 2, "change": "modified", "type": "Catalog", "changeClass": "housekeeping" },
    { "objectNumber": 34, "change": "modified", "role": "DSS / validation-related data", "changeClass": "signature" }
  ],
  "notes": [
    "Bytes exist after the last signed range. Incremental updates after signing are legal in PDF …"
  ]
}
```

変更されたオブジェクト番号は pdf-reader-mcp の `locate_objects` に渡せます。
:::
