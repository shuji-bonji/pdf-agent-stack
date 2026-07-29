# 専門エージェントの構築方法

PDF Family を「PDF 専門エージェント」に組み上げる 3 つのレベル。

## Lv1 — MCP を繋ぐだけ

4 サーバを登録するだけで、各サーバが自己申告する **MCP instructions**（責務境界の宣言）が効きます。reader は「観測であり判定ではない」、verify は「反証はできるが証明はしない」、writer は「宣言は書けるが準拠は作れない」— これらの境界をエージェントが自然に守るよう設計されています。

## Lv2 — Skill で編成

[pdf-trust](/ja/skills/pdf-trust) / [pdf-publish](/ja/skills/pdf-publish) を導入すると、「この PDF は信用できる？」「PDF/UA で納品して」といった依頼に対し、複数 MCP の呼び出し順序・判定の読み方・レポート形式が定型化されます。

## Lv3 — 専門サブエージェント

用途を絞ったサブエージェントを定義します。例: 受入監査専用の `pdf-auditor`。

```markdown
---
name: pdf-auditor
description: 受け取った PDF の信頼性監査を行う。監査以外の編集はしない。
tools: mcp__pdf-verify__*, mcp__pdf-reader__*
---

あなたは PDF 受入監査の専門家である。

## 責務境界
- 判定は pdf-verify の evaluate_policy に委ね、上書きしない
- reader の観測結果から真正性を推測しない
- 内容の真偽は判定しない — 判定するのは原本性・完全性のみ

## 言い切り強度
- T1 (ISO 32000 / PDF/UA): 条文を引用して言い切る
- T2 (PDF/A): 「veraPDF が COMPLIANT と判定」とだけ言う
- T3 (PAdES): 構造の観測として述べる。「準拠」とは書かない
```

ポイント:

- **tools を絞る** — 監査エージェントに writer を持たせない。能力の制限が信頼性になる
- **判定ロジックをプロンプトに書かない** — ジャッジはコード（evaluate_policy）、ナラティブは LLM
- **言い切り強度をプロンプトに埋め込む** — 出力の校正基準になる

## 運用の知見

- **宣言 ≠ 準拠**: `ensure_pdfa` で宣言を書いたら、必ず `validate_conformance` で測る
- **緑のテストは空振りしうる**: 検証が通った「範囲」を常に確認する（フィクスチャ不在・ガード節で判定がスキップされていないか）
- **署名は編集前に確認**: 署名付き PDF の編集は署名を壊す。writer は `preserveSignatures` / `allowBreakingSignatures` を明示しない限り進まない

## プラグイン配布

MCP + Skill + サブエージェント定義を 1 つのプラグインにまとめると、marketplace 経由でチーム配布できます。実例として pdf-trust / pdf-publish プラグインの構成を参照してください。
