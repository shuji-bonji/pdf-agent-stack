# Issue 下書き: Skills ページに Trust Report / Publish Report の実出力例を追加

**優先度: 3**

## 現象

- `ja/skills/pdf-trust.md` = 34 行 / `ja/skills/pdf-publish.md` = 28 行。原則と 4 値判定の説明はあるが:
  - Report の**実物の出力例**（Markdown）がない
  - インストール方法（plugin marketplace / Claude Code への導入手順）がない
  - 縮退動作（veraPDF 未導入時・署名なし PDF 等）の記述が薄い

## 対応

1. **実測主義で作る**: 手元の検体 PDF に対して pdf-trust / pdf-publish を実際に走らせ、得られた Report をそのまま（パス等をマスクして）掲載する。例文の捏造はしない
2. pdf-trust ページ: 4 値判定それぞれの発火例が最低 1 つずつ見える Report 抜粋
3. pdf-publish ページ: write → read-back → verify の 1 周分のログと Publish Report
4. 両ページ共通: インストール手順（marketplace 経由）と、前提 MCP が欠けたときの縮退の説明
5. en 側も同内容で同期（Report 例は同一検体の英語実行で取得）

## 検体計画（2026-08-11 決定・3 系統）

外部検体は「正しく署名されている保証がない」（期待値は仮説）ため、3 系統を併用する。
すべて `docs/specimens/`（gitignore 済み）に取得・生成済み:

| 検体 | 位置づけ | 実測済みの事実 |
| --- | --- | --- |
| `selfmade-pades-lta.pdf` | **known-good**（全工程管理下: writer 生成 → pyHanko 署名 + TS + DocTS） | 署名 VALID / trusted（自作 CA）・署名 TS 検証成功 |
| `kanpo-20260810-h01765-p1.pdf` | 実運用・日本文脈（内閣府署名 + AMANO DocTS + 権限暗号化） | 署名 VALID・PDF 1.4 |
| `dss-pades-lta.pdf` ほか | EU 公式テストコーパス（PAdES レベル比較） | 署名 VALID・DSS に署名者カバーの OCSP/CRL |

## 依存・注意

- **Issue 06（verify の DocTimeStamp 分岐バグ）を先に修正すること。** 現状のまま実測すると
  3 検体すべての Trust Report に既知バグ由来の INDETERMINATE が載る
- Report 例の取得はユースケース詳細（優先度 5）の素材集めを兼ねるので、得られたログは捨てずに保管する

## 受入基準

- 両ページに実測由来の Report 例が載っている
- 例が「実行して得たもの」であることが記載から分かる（実行日・検体の性質）
