# Issue 下書き: stack.json / README のバージョンドリフト解消と再発防止

**優先度: 1（最初に消化・最小コスト）**

> **✅ 実装済み（2026-08-11・未コミット）**
> 1. `generate-stack.mjs --readme` 実行 → verify 0.14.0 / writer 0.18.0 で npm・サイト・README の 3 か所一致（`--check` PASS）
> 2. 再発防止 = 案 b: `.github/workflows/stack-check.yml` を追加（週次 cron + dispatch + push 時に `--check`、ずれたら fail）
> 3. 任意項目（サイトに generatedAt 表示）は未実施 — README 表に「実測日」が既に出るため保留

## 現象

- npm published: pdf-verify-mcp **0.14.0** / pdf-writer-mcp **0.18.0**（2026-08-11 に `npm view` で実測）
- stack.json / README.md の構成表: verify **0.13.0** / writer **0.17.0** のまま（`generatedAt: 2026-07-29`）
- サイト（`/ja/mcp/`）は 0.14.0 / 0.18.0 で npm と一致 → **README だけが古い**

## 原因

`information/issue-draft-writer-descriptions-english.md` のリリース前チェック手順 4
「`scripts/generate-stack.mjs` で stack.json を再生成」が、v0.18.0 / v0.14.0 リリース後に未実行。
仕組みはあり、実行が漏れただけ。

## 対応

1. `node scripts/generate-stack.mjs` を実行して stack.json / README 構成表を再生成（実測値のみ・推測は書かない、の既存方針どおり）
2. 再発防止 — どちらか:
   - a. 各 MCP のリリースチェックリスト末尾に「stack 再生成 → commit」を明文化
   - b. GitHub Actions（週次 or 手動 dispatch）で generate-stack.mjs を回し、差分があれば PR を自動作成
3. （任意）サイト側に stack.json の `generatedAt` を「最終照合日時」として表示

## 受入基準

- stack.json / README / サイトの 3 か所が npm published と一致
- 再発防止策（a または b）がリポジトリに残っている
