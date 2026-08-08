---
description: 受け取った PDF の信頼性監査を編成する Skill — evaluate_policy の 4 値判定を軸に Trust Report を返す入口ゲート
---

# pdf-trust — 受入監査

受け取った PDF（契約書・請求書・診療文書・行政文書など）が「本物か・信用してよいか・改ざんされていないか」を監査し、推奨判定付きの **Trust Report** を返す Skill である。

## 原則

1. 内容の真偽は判定しない — 判定するのは真正性（原本性・完全性）のみ
2. 検証結果は技術的事実として返し、最終判断は利用者に委ねる
3. 判定の根拠（どのツールの何の結果か）を必ず明示する
4. **ジャッジはコード、ナラティブは LLM** — 4 値判定は pdf-verify の `evaluate_policy` が下す。Skill の仕事は firedRules の解説・推奨アクション・法令根拠の引用であり、判定の上書きではない

## 4 値判定

| 判定 | 意味 |
|---|---|
| `trust_and_use` | そのまま利用可 |
| `use_with_caution` | 留意事項付きで利用可 |
| `human_review_required` | 人間の確認が必要 |
| `reject` | 受け入れ不可 |

## 前提 MCP

| MCP | 必須/任意 | 役割 |
|---|---|---|
| pdf-verify (v0.7.0+) | **必須** | evaluate_policy・署名検証・改ざん検知・PAdES・PDF/A（**v0.11.0+ は PDF/A-4 も**。`pdfa-4` / `pdfa-4e` / `pdfa-4f`。**`pdfa-4b` は存在しない**） |
| pdf-reader | 任意 | 署名フィールド構造・タグ・メタデータの観測 |
| pdf-spec | 任意 | 逸脱時の ISO 32000 根拠引用 |
| houki-egov / houki-nta / tax-law / labor-law | 任意 | プロファイルが指定する法令根拠 |

<!-- TODO: プロファイル一覧・Trust Report サンプル・発火プロンプト例（Phase 3） -->
