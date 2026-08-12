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

## 監査の流れ（Phase）

| Phase | やること |
|---|---|
| 0 | 目的の確認とプロファイルの選定 |
| 1 | `evaluate_policy` で全ファイルを一括判定（4 値） |
| 2 | 発火したルールの解釈・深掘り |
| 2.5 | 署名後の変更の特定 — 「何バイト増えた」を「何が・どのページのどこに書かれたか」まで下ろす |
| 3 | プロファイル別チェック（PDF/A・PDF/UA・長期保存など） |
| 4 | 法令根拠の取得（プロファイル指定時） |
| 5 | Trust Report の生成 |

本文やユースケースで「Phase 2.5」のように参照するのは、この表の番号である。

## プロファイル

| プロファイル | 想定文書 | 特徴 |
|---|---|---|
| `contract` | 契約書・NDA・発注書 | 署名必須。未署名は human_review_required |
| `financial` | 請求書・決算書・申告書 | 長期保存チェック込み |
| `legal` | 訴訟資料・法務文書 | 署名後変更の全履歴を要求 |
| `medical` | 診療情報提供書・検査報告書 | 最も保守的。caution を review に格上げ |
| `government` | 行政文書・公共告知 | 長期保存チェック込み。未署名を許容 |
| `general` | 上記以外 | 追加チェックなし |

## 実測例 — 4 値判定（2026-08-11・すべて実在検体）

| 検体 | プロファイル | 判定 | 発火ルール |
|---|---|---|---|
| 自作 CA 署名 + **CRL を DSS に同梱** + trust_anchors 指定 | general | `trust_and_use` | なし（valid + trusted + revocation good） |
| インターネット官報 2026-08-10 号本紙（内閣府署名 + AMANO タイムスタンプ） | government | `use_with_caution` | TRUST-NOT-EVALUATED / REVOCATION-UNKNOWN |
| 同上の自作検体で **CRL なし** | general | `use_with_caution` | REVOCATION-UNKNOWN |
| 未署名の請求書 PDF | contract | `human_review_required` | UNSIGNED-REQUIRED（署名の画像は電子署名ではない） |
| 署名対象範囲を 1 バイト改変した検体 | general | `reject` | POL-REJECT-INVALID（digest 不一致） |

1 行目と 3 行目の差分は **CRL の有無だけ**（trust_anchors はどちらも指定済み）。アンカーを渡すだけでは最良判定に届かず、失効確認が
good になって初めて `trust_and_use` に到達する。CRL が署名者をカバーしたことで PAdES の構造観測も
B-T → **B-LTA** に上がる（この検体には文書タイムスタンプが最初から入っているため、CRL で B-LT の
条件が満たされると同時に B-LTA の構造が揃う）— 4 値判定と LTV の関係が 1 対の検体で見える。

## Trust Report 抜粋（官報の個票より）

evaluate_policy の判定に加え、Phase 2.5（verify_integrity + locate_objects）が
「署名後の +9938 バイト」の正体を特定する:

| オブジェクト | 変更 | 役割 | ページ / 矩形 |
|---|---|---|---|
| 64 | added | form field widget | p.1 / 0,0,0,0（不可視） |
| 65 | added | **/DocTimeStamp 署名辞書** | ページ非参照 |
| 54 | modified | AcroForm 辞書 | — |

→ 署名後の変更は **AMANO タイムスタンプの付与そのもの**（増分更新は ISO 32000-2 §7.5.6 で合法）。
「N バイト足された」で止めず「何が足されたか」まで降ろすのが Phase 2.5 の仕事である。
このほか官報個票では、PDF/UA を veraPDF が NOT COMPLIANT と判定（タグなし実コンテンツ 236 件ほか
10 規則）、PDF/A 参考測定は veraPDF が暗号化文書に結果を返さず「**未実施**」と記録した —
測れなかった項目は passed ではなく未実施と明記する。

## インストール

```sh
/plugin marketplace add shuji-bonji/claude-plugins
/plugin install pdf-verify-mcp@shuji-bonji   # 必須基盤
/plugin install pdf-trust@shuji-bonji
# 任意: pdf-reader-mcp（位置特定）・pdf-spec-mcp（条文引用）・houki 系（法令根拠）
```

リポジトリ: [shuji-bonji/pdf-trust-skill](https://github.com/shuji-bonji/pdf-trust-skill)（SKILL.md 本体・プロファイル定義）

## ツールが足りないときの動き（縮退動作）

- pdf-verify 未接続 → 監査は成立しない。接続を案内して停止する
- 旧 verify（v0.7.0 未満・evaluate_policy なし）→ 手動判定表にフォールバックし、レポートに「手動判定」と明記
- 任意 MCP の欠落 → 該当項目を「未実施（ツール未接続）」と明記する。黙って項目を落とすと「チェック済みで問題なし」と誤読される
- 測れなかった検査（例: 暗号化 PDF の PDF/A を veraPDF が採点できない）→ 未実施として記録。判定不能は無罪ではない
