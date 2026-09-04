---
description: PDF 専門エージェント構築の 3 レベル — MCP 接続・Skill 編成・専門サブエージェント定義、ローカル LLM 適用時の注意
---

# 専門エージェントの構築方法

PDF Agent Stack を「PDF 専門エージェント」として組むには、次の 3 つのレベルがあります。

## Lv1 — MCP を繋ぐだけ

4 サーバーを登録すると、各サーバーの **MCP instructions**（責務境界の宣言）がホストに渡ります。pdf-reader-mcp は「観測であり判定ではない」、pdf-verify-mcp は「規格破りは見つけられるが、規格どおりであることは証明しない」、pdf-writer-mcp は「ラベルは書けるが、規格どおりにはできない」と宣言します。大型モデルは、この MCP instructions を読んで境界の内側に留まりやすいです。登録しただけで呼び出し順まで固定されるわけではありません。

## Lv2 — Skill で編成

[pdf-trust](/ja/skills/pdf-trust) / [pdf-publish](/ja/skills/pdf-publish) を入れると、「この PDF は信用できる？」「PDF/UA で納品して」といった依頼に対し、複数 MCP の呼び出し順序・判定の読み方・レポートの形が固定されます。

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

ポイントは次のとおりです。

- **渡すツールを絞る** — 監査エージェントに `pdf-writer` を渡しません。編集できなければ監査中にファイルを変えられません
- **判定ロジックをプロンプトに書かない** — 判定は `evaluate_policy` が返します。LLM は説明文だけを書きます
- **言い切り強度をプロンプトに書く** — 出力を T1 / T2 / T3 で校正する基準になります

## ローカル LLM での適用

判定を `evaluate_policy` の戻り値に置くこと、監査に `pdf-writer` を渡さないこと、言い切りを T1 / T2 / T3 にすることは、クラウドの大型モデルでも、ローカルの小型モデルでも同じです。Lv1 だけは前提が違います。大型モデルが MCP instructions を守る、という前提は、ローカルの小型モデルでは成り立ちません。

- 判定を `evaluate_policy` に置くこと、渡すツールを絞ること、T1 / T2 / T3 を守ること — モデルが小さいほど、判定を `evaluate_policy` の戻り値として転記する意味は大きくなります
- Lv1 の「MCP instructions を読んで境界の内側に留まる」は、Claude Code と大型モデルの組み合わせを前提にしています。ローカルの小型モデルでは、ツール呼び出しの JSON が崩れます。instructions だけでは pdf-reader-mcp / pdf-writer-mcp の越境を止められません
- Skill ファイルとサブエージェント定義は、Claude Code が読む形式です。ローカル LLM のランタイムは、同じファイルを Skill としては読みません。ローカルでは system prompt と、呼び出し順を固定したコード（同じ入力なら同じ結果。例: [`pdf-agent-pipeline`](https://github.com/shuji-bonji/pdf-agent-pipeline)）に書きます

ローカルでは、Lv3 のサブエージェント定義がやっていることと同じ（ツールを絞る、呼び出し順を固定する、判定をコードに置く）を、system prompt とパイプラインのコードに書きます。固定する場所が違うだけです。

## 運用の知見

- **`ensure_pdfa` が書くのは XMP のラベルです。** 規格どおりかどうかは `validate_conformance` で測ります
- **テストは通っても、判定が実行されていないことがあります。** 通った範囲を確認します（フィクスチャが無い、ガード節で判定が飛ばされている）
- **署名は編集前に確認します。** 署名付き PDF の編集は署名を無効にします。pdf-writer-mcp は `preserveSignatures` / `allowBreakingSignatures` を明示しない限り進みません

## プラグイン配布

MCP + Skill + サブエージェント定義を 1 つのプラグインにまとめると、marketplace 経由でチーム配布できます。実例として pdf-trust / pdf-publish プラグインの構成を参照してください。
