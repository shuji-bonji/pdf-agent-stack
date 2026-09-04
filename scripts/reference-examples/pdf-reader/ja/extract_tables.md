::: details 呼び出し例 — 「この表を構造化して」
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
  "isTagged": true,
  "tables": [
    {
      "pages": [1],
      "index": 1,
      "headerRows": [],
      "bodyRows": [
        {
          "cells": [
            { "text": "品目", "isHeader": true },
            { "text": "数量", "isHeader": true },
            { "text": "単価", "isHeader": true },
            { "text": "金額", "isHeader": true }
          ]
        },
        {
          "cells": [
            { "text": "PDF監査サービス", "isHeader": false },
            { "text": "1", "isHeader": false },
            { "text": "50,000", "isHeader": false },
            { "text": "50,000", "isHeader": false }
          ]
        }
        // … 「タグ付きPDF生成」「合計」の行が続く
      ],
      "footerRows": []
    }
  ],
  "totalTables": 1,
  "pagesScanned": 1
}
```

タグ無し PDF では表は空で、`note` が付きます。
:::
