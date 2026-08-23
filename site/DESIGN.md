# pdf-agent-stack 設計書

| 項目 | 内容 |
|---|---|
| 作成日 | 2026-07-26 |
| 対象 | PDF Family 紹介サイト（4 MCP + 2 Skill） |
| 技術 | VitePress + vitepress-plugin-mermaid / GitHub Pages / GitHub Actions |
| リポジトリ | `shuji-bonji/pdf-agent-stack`（新規・独立） |
| ステータス | Draft |

---

## 1. 目的と対象読者

**目的**: PDF Family（pdf-spec / pdf-reader / pdf-verify / pdf-writer + pdf-trust / pdf-publish Skill）を、初見の開発者が「何ができるか → どう入れるか → どう使うか → どう組み込むか」の順で理解できる単一の入口にする。

| 読者 | 求めるもの | 主導線 |
|---|---|---|
| MCP 利用者（Claude Desktop / Code / Cowork） | 導入手順・ツールの使い方 | Getting Started → MCP Reference |
| PDF ワークフロー構築者 | ユースケース・Skill の使い分け | Use Cases → Skills |
| エージェント開発者 | 専門エージェントの組み方 | Agents ガイド |
| コントリビュータ / 将来の自分 | 責務境界・設計思想 | Architecture |

## 2. 技術選定

- **VitePress**: TS/Vite 系で統一。ローカル検索・i18n 組み込み。Markdown 内 Vue で役割分担のインタラクティブ図も将来可能
- **vitepress-plugin-mermaid**: 既存仕様書の Mermaid 図をそのまま掲載
- **GitHub Pages + Actions**: push → build → deploy。`https://shuji-bonji.github.io/pdf-agent-stack/`（将来カスタムドメイン可）

## 3. i18n 方針

- ルート = **英語**（npm / GitHub README と整合、海外利用者向け）
- `/ja/` = **日本語**（一次執筆言語。先に ja を書き en へ翻訳する運用。xcomet-mcp / deepl で品質担保可能）
- ディレクトリ構造は ja / en 完全ミラー。未翻訳ページは placeholder + 言語切替リンク

## 4. サイトマップ

```
/                           Home（Hero + 4 MCP / 2 Skill カード + クイックスタート）
/guide/
  overview                  PDF Family とは（1 ページ概観）
  architecture              全体構成・責務と役割（正典/実体/真正性/生成の 4 層）
  getting-started           導入手順（インストール / env / veraPDF / フォント）
  agents                    専門エージェントの構築方法
/mcp/
  index                     MCP 一覧（役割対比表 + バージョン）
  pdf-spec                  8 tools
  pdf-reader                17 tools（Tier 1/2/3）
  pdf-verify                6 tools
  pdf-writer                20 tools
/skills/
  index                     Skill 一覧と「MCP × Skill 連携」の考え方
  pdf-trust                 受入監査（入口ゲート）
  pdf-publish               納品パイプライン（出口ゲート）
/use-cases/
  index                     ユースケース一覧（マトリクス）
  incoming-audit            受け取った PDF の信頼性監査
  publish-pipeline          品質ゲート付き PDF 納品（write → read-back → verify）
  pdfa-archive              長期保存・電帳法（PDF/A-3b + 添付）
  accessibility             PDF/UA / タグ付き PDF
  spec-research             ISO 32000 仕様調査・実装判断
  batch-audit               複数 PDF の一括監査
/reference/
  env-vars                  環境変数一覧（family 横断）
  error-codes               エラーコード一覧（writer 構造化エラー等）
  glossary                  用語集（宣言/準拠/検証、PAdES、LTV、CES…）
/ja/…                       上記の完全ミラー
```

### ナビゲーション

- **Nav（上部）**: Guide / MCP / Skills / Use Cases / Reference / 言語切替 / GitHub
- **Sidebar**: セクション別。MCP Reference は各サーバごとにツールをグルーピング（reader は Tier 単位）

## 5. 各セクション設計

### 5.1 Home

Hero: 「PDF を 読む・検証する・書く・仕様で裏付ける — AI エージェントのための PDF ツール群」。
下段に 4+2 カード（各 1 行責務 + npm バッジ）とクイックスタート（`npx -y @shuji-bonji/pdf-reader-mcp@latest` の 3 行設定例）。

### 5.2 /guide/architecture（本サイトの核）

`pdf-family-role-architecture.md` と `specs/00-overview.md` を一般読者向けに再構成する。

1. **4 層モデル**（Mermaid 図）

| 層 | サーバ | 一行定義 | 返すもの |
|---|---|---|---|
| 正典 (norm) | pdf-spec | 仕様は何を要求するか | 規格条文・要求事項。**ファイルを開かない** |
| 実体 (fact) | pdf-reader | 中身に何があるか | 観測結果。**合否を言わない** |
| 真正性・準拠性 (judgment) | pdf-verify | 本物で、規格に適っているか | 判定。**規格破りは見つけられるが、規格どおりであることは証明しない** |
| 生成 (production) | pdf-writer | 仕様通りに書けるか | PDF。**ラベルは書けるが、規格どおりにはできない** |

2. **境界ルール**: 「ISO 規格に照らした pass/fail を返すなら verify、観測を返すだけなら reader」
3. **独立 MCP × Skill 連携**: 各 MCP は相互非依存・単独完結。編成（手順・知識）は Skill が担う。判断基準 = 決定論・暗号→MCP / 手順・編成→Skill
4. **宣言・準拠・検証の三区別**（declaration / conformance / validation）— family 全体の思想として明記
5. **入口・出口の 2 ゲート**: pdf-trust（受入）と pdf-publish（納品）が verify を軸に対をなす図

### 5.3 /mcp/*（ツールリファレンス）

**共通ページテンプレート**（4 ページとも同型にする）:

```
1. 責務（一行定義 + 「しないこと」ボックス）
2. インストール（npx / Claude 設定 JSON）
3. 環境変数
4. ツール一覧表（名前 / 一行説明 / 主な引数 / 出力）
5. ツール別マニュアル（h3 × ツール数: 引数表・出力例・注意・関連ツールへの相互参照）
6. エラーコードと対処
7. 制約・既知の限界
```

各ページの掲載ツール（2026-07-26 時点の実装から採取）:

| サーバ | ver | ツール |
|---|---|---|
| **pdf-spec** (8) | 0.4.5 | list_specs / search_spec / get_section / get_structure / get_requirements / get_definitions / get_tables / compare_versions |
| **pdf-reader** (17) | 0.9.2 | **Tier1**: read_text / read_url / read_images / search_text / get_metadata / get_page_count / summarize<br>**Tier2**: extract_structured_text / extract_tables / inspect_structure / inspect_tags / inspect_fonts / inspect_annotations / inspect_signatures<br>**Tier3**: compare_structure / ~~validate_metadata~~ / ~~validate_tagged~~（deprecated → verify へ誘導） |
| **pdf-verify** (6) | 0.8.0 | verify_signatures / verify_integrity / detect_pades_level / identify_conformance / validate_conformance / evaluate_policy |
| **pdf-writer** (20) | 0.15.1 | **作成**: create_text_pdf / create_markdown_pdf / create_table_pdf<br>**ページ操作**: merge_pdfs / split_pdf / extract_pages / delete_pages / reorder_pages / rotate_pages<br>**装飾・注釈**: add_bookmarks / add_annotation / add_watermark / stamp_page_numbers<br>**メタ・添付**: set_metadata / attach_file<br>**フォーム**: fill_form / flatten_form / tag_form_fields<br>**宣言**: ensure_tagged / ensure_pdfa |

**マニュアルの書き方（方針）**: 各ツールに必ず「できること」「できないこと（限界）」「典型的な次の一手（他ツール/他サーバ）」を書く。例: `inspect_signatures` →「構造の観測のみ。暗号検証は verify_signatures へ」。deprecated ツールは理由と移行先を明記。

**バージョン・ツール表の同期**: 手書きにせず、各リポジトリの `definitions.ts` / `src/tools/` から表を生成するスクリプト（`scripts/sync-tools.mts`）を用意し、CI で乖離検知（Phase 2）。

### 5.4 /skills/*

| ページ | 内容 |
|---|---|
| index | Skill とは何か（MCP との分業）。trust=入口 / publish=出口 の対構造図 |
| pdf-trust | 発火条件・前提 MCP（verify 必須 v0.7.0+ / reader・spec・houki 任意）・4 値判定（trust_and_use / use_with_caution / human_review_required / reject）・Trust Report の読み方・「ジャッジはコード、ナラティブは LLM」原則 |
| pdf-publish | write → read-back → verify ループ・veraPDF 採点・Publish Report・PDF/UA / PDF/A-3 パイプライン |

### 5.5 /use-cases/*

各ユースケースは同型: **シナリオ → 登場 MCP/Skill → シーケンス図（Mermaid）→ 実際のプロンプト例 → 結果の読み方**。
index にマトリクス（ユースケース × 使用ツール）を置き、逆引きできるようにする。

### 5.6 /guide/agents（専門エージェントの構築方法）

PDF Family を「PDF 専門エージェント」に組み上げる方法。3 レベルで解説:

1. **Lv1 — MCP を繋ぐだけ**: Claude Desktop / Claude Code に 4 サーバを登録。MCP instructions（各サーバが自己申告する責務境界）が自然に効く仕組みの解説
2. **Lv2 — Skill で編成**: pdf-trust / pdf-publish の導入。Skill の発火条件の書き方、プロファイル指定
3. **Lv3 — 専門サブエージェント**: `.claude/agents/pdf-auditor.md` の実例（frontmatter: tools 制限で verify+reader のみ許可、system prompt に 4 層責務と T1/T2/T3 の言い切り強度ルールを埋め込む）。プラグイン化（marketplace 配布）の手順。「緑のテストは空振りしうる」「ラベル≠規格どおり」等の運用知見も注意事項として掲載

### 5.7 /guide/getting-started（導入手順）

順序立てた 1 本のガイド + 環境変数リファレンス:

```
Step 1  前提: Node.js 20+（全サーバ npx で起動可）
Step 2  最小構成: pdf-reader だけ入れて読んでみる
Step 3  pdf-spec: 仕様 PDF コーパスの入手（PDF Association sponsored 版）
        → PDF_SPEC_DIR にファイル配置（命名パターン自動判別の説明）
Step 4  pdf-verify: そのままでも動く（内蔵 ~15 ルール）。
        本格運用は veraPDF 導入 → PDF_VERIFY_VERAPDF or PATH。
        署名者の信頼評価は PDF_VERIFY_TRUST_ANCHORS（PEM/DER 証明書ディレクトリ）
Step 5  pdf-writer: 日本語出力に必須のフォント設定。
        Noto Sans JP（単一フェイス .otf/.ttf）→ PDF_WRITER_FONT。
        Helvetica は ASCII のみ / Variable font 不可の注意
Step 6  動作確認: 各サーバ 1 ツールずつ叩くスモークテスト手順
Step 7  Skill 導入（pdf-trust / pdf-publish）と設定例（Desktop / Code / Cowork）
```

環境変数一覧（/reference/env-vars に集約、getting-started からリンク）:

| 変数 | サーバ | 必須 | 用途 |
|---|---|---|---|
| `PDF_SPEC_DIR` | spec | **必須** | 仕様 PDF コーパスのディレクトリ |
| `PDF_VERIFY_VERAPDF` | verify | 任意 | veraPDF 実行パス（無ければ PATH 探索 → 内蔵ルール） |
| `PDF_VERIFY_TRUST_ANCHORS` | verify | 任意 | 信頼アンカー証明書ディレクトリ |
| `PDF_WRITER_FONT` | writer | 実質必須(CJK) | 既定フォント。ツール毎の fontPath 省略可に |

## 6. コンテンツ同期戦略

- **正は各リポジトリ**（README / definitions.ts / SKILL.md）。サイトは「編集された鏡」
- ツール一覧表・バージョン: `scripts/sync-tools.mts` で生成（Phase 2）。手動更新はしない
- 思想・ユースケース・エージェントガイド: サイト側が正（各リポには置かない Family 横断コンテンツ）
- CI: main push で build+deploy。週次で sync スクリプトを走らせ差分があれば PR（Phase 3）

## 7. 実装フェーズ

| Phase | 内容 | 完了条件 |
|---|---|---|
| 1 | 雛形 + ja 主要ページ（Home / overview / architecture / getting-started / MCP×4） | Pages 公開・ローカル検索動作 |
| 2 | ツール別マニュアル全掲載 + sync スクリプト + Use Cases | 51 ツール全て記載・CI 乖離検知 |
| 3 | en 翻訳（xcomet 品質ゲート）+ Agents ガイド + Skill 詳説 | ja/en ミラー完成 |

## 8. リスク・留意点

- **ツール数の陳腐化**: 手書き表は必ず古びる → Phase 2 の自動生成を最優先に
- **言い切り強度**: サイトの文言も T1/T2/T3 ルールに従う（「veraPDF が COMPLIANT と判定」と書き、「ISO 19005 に準拠」とは書かない）。マニュアル執筆時の校正基準にする
- **仕様 PDF の再配布不可**: コーパスは PDF Association の sponsored 版への誘導のみ。ファイル自体はサイトに置かない
- **メンテ時間**: 「サイトの正しさ」を CI に寄せ、人間は思想・ユースケースだけ書く分業を崩さない
