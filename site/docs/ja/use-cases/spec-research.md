---
description: 仕様調査 — pdf-spec で ISO 32000 の条文・要求(shall/may)を原文から引く。増分更新 §7.5.6 = 10 要求、DocTimeStamp = §12.8.5 系の実測クエリ付き
---

# 仕様調査

## シナリオ

「増分更新って仕様上なにが要求される？」「DocTimeStamp はどこで定義されている？」——
実装や監査の判断を、記憶や検索エンジンではなく **ISO 32000 の原文**に着地させます。
pdf-spec が開くのは手元に置いた仕様コーパスだけで、**検証対象の PDF は開きません**。仕様が**何を要求するか**に答え、ファイルが**それを満たすか**は pdf-verify の仕事です。

以下は **2026-08-11 の実測クエリ**（受入監査で見つけた「署名後の増分更新」を条文に降ろした例）です。

## 登場 MCP / Skill

| 役者 | 役割 |
|---|---|
| [pdf-spec](/ja/mcp/pdf-spec) | `search_spec`（横断検索）・`get_section`（条文本文）・`get_requirements`（shall/should/may の構造化抽出）・`compare_versions` |
| [pdf-verify](/ja/mcp/pdf-verify) | ファイル側の合否（仕様調査の結果を検査に接続するとき） |

## シーケンス図

```mermaid
sequenceDiagram
  actor U as 利用者
  participant S as pdf-spec

  U->>S: search_spec("document timestamp")
  S-->>U: §12.8.4.2（DSS）・§12.8.5（DTS 辞書）ほか 4 件
  U->>S: get_requirements(section: "7.5.6")
  S-->>U: 10 要求（shall 8 / may 2）+ 条文文脈
  Note over U: 答えは条文 ID と原文で返す。<br>ファイルの合否は pdf-verify へ
```

## プロンプト例

- 「増分更新は仕様上なにが要求される？条文で」
- 「DocTimeStamp の定義はどこ？DSS との関係も」
- 「PDF 1.7 と 2.0 でこの節はどう変わった？」（→ `compare_versions`）

## 実測例

`search_spec("document timestamp")` → 4 件: **§12.8.4.2**（DSS 導入・DTS への参照）・
§12.8.4.3（DSS 辞書）・§12.8.1（署名の全体像）・§12.8.2.2.1（DocMDP と DSS/DTS 増分更新）。

`get_requirements(section: "7.5.6")` → **10 要求（shall 8 / may 2）**。例:

> **R-7.5.6-1（shall）**: "When updating a PDF file incrementally, changes shall be appended to
> the end of the file, leaving its original contents intact."

受入監査で観測した「署名後に 9,938 バイト追加」が、この条文の**合法な形**
（原本無傷・末尾追記 = タイムスタンプ付与）であることを原文で確認できます。

## 結果の読み方

- **ヒットなし = 「このコーパスは答えられない」であって「要求が存在しない」ではありません。**
  ISO 19005（PDF/A）と ETSI PAdES はコーパス外です（`list_specs` の coverage.gaps を読んでください）
- `get_requirements` の shall / should / may は要求の強さそのものです — 実装判断は shall を落とさない
  ことから始まります
- 条文を読んで分かるのは**仕様が何を要求するか**までです。目の前のファイルが満たすかは
  `validate_clauses` / `validate_conformance`（pdf-verify）で測ります
- 宣言・適合・検証は別物です — 条文の「shall」を引用しても、ファイルの適合を証明したことにはなりません
