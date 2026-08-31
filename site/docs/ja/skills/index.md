---
description: PDF Agent Stack を編成する 3 つの Skill — 入口の pdf-trust（受入監査）・出口の pdf-publish（品質ゲート付き納品）・最頻の仕事を担う pdf-read（読み取り）
---

# Skill 一覧

MCP が「決定論的計算（同じ入力なら常に同じ結果になる計算）・暗号」を担うのに対し、Skill は「手順・知識・編成」を担います。判定はコード、ナラティブ（説明の文章）は LLM — この分業が PDF Agent Stack の設計原則です。

```mermaid
graph LR
  IN[/"受け取った PDF"/] --> TRUST{{"pdf-trust<br>入口ゲート"}} --> USE(["利用・保存"])
  MAKE[/"作りたい PDF"/] --> PUBLISH{{"pdf-publish<br>出口ゲート"}} --> OUT(["納品"])
  DOC[/"読みたい PDF"/] --> READ{{"pdf-read<br>読み取りパイプライン"}} --> ANS(["内容 + Read Report"])
```

| Skill | 役割 | 前提 MCP |
|---|---|---|
| [pdf-trust](/ja/skills/pdf-trust) | 受入監査を編成し Trust Report を返す | pdf-verify **必須** (v0.7.0+) / reader・spec・houki 系は任意 |
| [pdf-publish](/ja/skills/pdf-publish) | write → read-back → verify の納品パイプライン | pdf-writer / pdf-reader / pdf-verify |
| [pdf-read](/ja/skills/pdf-read) | 大きな PDF・読めない PDF から必要な箇所を取り出し、読めなかった箇所を申告する | pdf-reader **必須** (v0.14.0+ 推奨) / spec は任意 |
