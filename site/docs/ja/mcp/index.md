---
description: 4 つの MCP サーバーの一覧と層構成 — pdf-spec（正典）/ pdf-reader（実体）/ pdf-verify（判定）/ pdf-writer（生成）
---

# MCP サーバー一覧

| サーバー | 層 | ver | ツール数 | 一行定義 |
|---|---|---|---|---|
| [pdf-spec-mcp](/ja/mcp/pdf-spec) | 正典 | 0.6.0 | 8 | 仕様は何を要求するか |
| [pdf-reader-mcp](/ja/mcp/pdf-reader) | 実体 | 0.15.0 | 19 | 中身と、**その描画位置**を返す |
| [pdf-verify-mcp](/ja/mcp/pdf-verify) | 真正性・準拠性 | 0.26.0 | 7 | 署名が有効か、規格に適っているか |
| [pdf-writer-mcp](/ja/mcp/pdf-writer) | 生成 | 0.21.0 | 20 | 仕様通りに書けるか |

層の呼び名（正典・実体・真正性/準拠性・生成）は [4 層モデル](/ja/guide/architecture#_4-層モデル-—-誰が何を編成するか)で定義しています。

## どれを使うか（逆引き）

| やりたいこと | サーバー | ツール |
|---|---|---|
| PDF のテキスト・表を取り出す | reader | read_text / extract_tables |
| 署名が暗号学的に有効か確かめる | verify | verify_signatures |
| 改ざんの有無を調べる | verify | verify_integrity |
| PDF/A 準拠か判定する | verify | validate_conformance |
| 仕様の条文を引く | spec | search_spec / get_section |
| Markdown から PDF を作る | writer | create_markdown_pdf |
| **この段落に注釈を付けたい**（座標が必要） | reader → writer | extract_structured_text（`include_bbox`）→ add_annotation |
| **署名後に変更されたオブジェクトの位置を示したい**（座標が必要） | verify → reader → writer | verify_integrity → locate_objects → add_annotation |
| 信用してよいか総合判定 | verify + Skill | evaluate_policy + [pdf-trust](/ja/skills/pdf-trust) |

::: tip 各ページの構成は共通です
一行定義 → これ 1 台でできること → Skill 連携でできること（スタックの中の立ち位置）→ できないこと → しないこと → インストール → 共通引数 → ツール一覧 → 使い方の要点

引数・型・既定値は各サーバーの[ツールリファレンス](/ja/reference/mcp/pdf-spec)（`tools/list` から自動生成）にあります。解説ページには同じ表は置かず、引数の詳細はツールリファレンスへ誘導します。
:::
