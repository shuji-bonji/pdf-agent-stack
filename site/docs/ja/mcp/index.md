---
description: 4 つの MCP サーバーの一覧と層構成 — pdf-spec（正典）/ pdf-reader（実体）/ pdf-verify（判定）/ pdf-writer（生成）
---

# MCP サーバー一覧

| サーバー | 層 | ver | ツール数 | 一行定義 |
|---|---|---|---|---|
| [pdf-spec-mcp](/ja/mcp/pdf-spec) | 正典 | 0.4.5 | 8 | 仕様は何を要求するか |
| [pdf-reader-mcp](/ja/mcp/pdf-reader) | 実体 | 0.11.1 | 18 | 中身に何があるか・**それはどこか** |
| [pdf-verify-mcp](/ja/mcp/pdf-verify) | 真正性・準拠性 | 0.14.2 | 7 | 本物で規格に適っているか |
| [pdf-writer-mcp](/ja/mcp/pdf-writer) | 生成 | 0.18.0 | 20 | 仕様通りに書けるか |

## どれを使うか（逆引き）

| やりたいこと | サーバー | ツール |
|---|---|---|
| PDF のテキスト・表を取り出す | reader | read_text / extract_tables |
| 署名が本物か確かめる | verify | verify_signatures |
| 改ざんの有無を調べる | verify | verify_integrity |
| PDF/A 準拠か判定する | verify | validate_conformance |
| 仕様の条文を引く | spec | search_spec / get_section |
| Markdown から PDF を作る | writer | create_markdown_pdf |
| **この段落に注釈を付けたい**（座標が要る） | reader → writer | extract_structured_text（`include_bbox`）→ add_annotation |
| **変わったオブジェクトを指したい**（座標が要る） | verify → reader → writer | verify_integrity → locate_objects → add_annotation |
| 信用してよいか総合判定 | verify + Skill | evaluate_policy + [pdf-trust](/ja/skills/pdf-trust) |

::: tip 各ページの構成は共通である
責務 → インストール → 環境変数 → ツール一覧表 → ツール別マニュアル → エラーコード → 制約
:::
