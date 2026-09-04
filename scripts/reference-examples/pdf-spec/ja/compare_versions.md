::: details 呼び出し例 — 「増分更新の節は PDF 1.7 と 2.0 でどう変わった？」
- 実測: v0.6.0
- `section`: `"7.5.6"`
- 前提: PDF 1.7 と 2.0 の両ファイルが `PDF_SPEC_DIR` にある

**パラメータ**

```jsonc
{
  "section": "7.5.6"
}
```

**返る JSON**

```jsonc
{
  "totalMatched": 1,
  "totalAdded": 0,
  "totalRemoved": 0,
  "matched": [
    {
      "section17": "7.5.6",
      "section20": "7.5.6",
      "title": "Incremental updates",
      "status": "same"
    }
  ],
  "added": [],
  "removed": []
}
```

節番号とタイトルは 1.7 と 2.0 で同じです。本文の差分までは返しません。要求の中身を見るなら、その節の [`get_requirements`](#get-requirements) を両仕様（`spec: "pdf17"` と省略時の `iso32000-2`）で取ります。
:::
