::: details 呼び出し例 — 「注釈はあるか」
- 実測: v0.15.0
- 標本: `docs/specimens/publish-demo.pdf`（呼び出すときは絶対パス）
- `response_format`: `"json"`

0 件は「読めなかった」ではなく「読んで無い」です。

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
  "totalAnnotations": 0,
  "bySubtype": {},
  "byPage": { "1": 0 },
  "annotations": [],
  "hasLinks": false,
  "hasForms": false,
  "hasMarkup": false
}
```
:::
