::: details Worked example — "Give me this table as structured data"
- Measured: v0.15.0
- Specimen: `docs/specimens/publish-demo.pdf` (pass an absolute path)
- `response_format`: `"json"`

**Parameters**

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "response_format": "json"
}
```

**Returned JSON**

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
        // … rows for タグ付きPDF生成 and 合計 follow
      ],
      "footerRows": []
    }
  ],
  "totalTables": 1,
  "pagesScanned": 1
}
```

On an untagged PDF the tables array is empty and a `note` is attached.
:::
