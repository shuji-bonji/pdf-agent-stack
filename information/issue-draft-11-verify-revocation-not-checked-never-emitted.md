# Issue 下書き: [pdf-verify-mcp] `revocation.status` の `not_checked` が一度も出力されない

> 登録済み（2026-09-17）: https://github.com/shuji-bonji/pdf-verify-mcp/issues/14

**対象リポジトリ: pdf-verify-mcp（サイトの表も pdf-agent-stack 側で直す）/ 確認した版: 0.26.1（commit c88e9f4）**

## 現在の動作

- `RevocationStatus.NOT_CHECKED = 'not_checked'` は定義されている（`src/constants.ts` 138 行）
- しかし、これを返すコードが無い。`check_revocation: "none"` のときは `checkRevocation` を呼ばず、`report.revocation` は `null` のまま（`verification-service.ts` 88 行・236 行）
- 参照しているのは `policy-engine.ts` 250 行の比較だけ。この比較は、実際には一度も真にならない

## 値が書かれている箇所

| 箇所 | 記述 |
| --- | --- |
| `src/tools/verify-signatures.ts` 68 行（ツールの description） | `revocation status ('good' / 'revoked' / 'unknown' / 'not_checked')` |
| `site/docs/ja/mcp/pdf-verify.md` 139 行 / `site/docs/mcp/pdf-verify.md` 130 行 | 表の「失効」の行 |
| `site/docs/ja/reference/mcp/pdf-verify.md` 65 行 / `site/docs/reference/mcp/pdf-verify.md` 67 行 | 自動生成されたリファレンス |

## 直す案（どちらかに決める）

- **案 A**：`none` のときに `{ status: 'not_checked', source: null, detail: 'check_revocation=none' }` を返す。description は今のままで正しくなる
- **案 B**：`not_checked` を削除し、「`none` のときは `revocation: null`」と description に書く

案 A のほうが、「調べなかった」と「調べる経路に入らなかった（署名者証明書が取れなかった）」を出力で区別できる。今はどちらも `null` になる。

## 受入条件

- description と出力の値の集合が一致する
- サイトの表（手書き 2 か所）とリファレンス（再生成）が一致する
- 下書き中の新しい節「失効確認のモード」の `none` の行を、決めた案に合わせる
