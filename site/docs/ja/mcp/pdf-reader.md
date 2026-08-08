---
description: PDF の中身と位置を観測する MCP（18 ツール） — テキスト・表・タグ・フォント・署名フィールド・bbox。観測であり判定ではない
---

# pdf-reader-mcp

> **実体の層 (fact)** — このサーバーは PDF の中身を**観測する**。正しいかどうかは判定しない。出力は常に「証拠」であり「判定」ではない。

- npm: `@shuji-bonji/pdf-reader-mcp` / 現行 v0.11.1
- 環境変数なしで動作

## しないこと

- 暗号検証（`inspect_signatures` は署名フィールドの構造読取のみ → 判定は pdf-verify）
- 準拠判定（`validate_*` は deprecated → pdf-verify の `validate_conformance`）
- 増分更新履歴（→ pdf-verify の `verify_integrity`）・OCR

## すること — 位置も返す

「中身に何があるか」だけでなく、**それがページのどこに描かれているか**も返す。矩形は
[pdf-writer-mcp](/ja/mcp/pdf-writer) の `add_annotation` が**そのまま取る形**（PDF default user space・
左下原点・pt・正規化済み）なので、受け渡しの途中で座標系を解釈し直す必要がない。

| 問い | ツール |
|---|---|
| 「**オブジェクト 27** はどこか」 | [`locate_objects`](#locate-objects) |
| 「**この段落 / この見出し** はどこか」 | [`extract_structured_text`](#extract-structured-text) の `include_bbox` |

どちらも各矩形に **`basis`（根拠）** を付けて返す。実測なのか、ファイルの自己申告なのか、
それともページ全体を指しているだけなのか ── **強さの違う主張を同じ顔で返さない**ための機構である。

## インストール

```jsonc
{
  "mcpServers": {
    "pdf-reader": {
      "command": "npx",
      "args": ["-y", "@shuji-bonji/pdf-reader-mcp@latest"]
    }
  }
}
```

## 共通引数

ほぼ全ツールが以下を受け取る（各表では省略）。

| 引数 | 型 | 説明 |
|---|---|---|
| `file_path` **必須** | string | ローカル PDF の絶対パス |
| `response_format` | `markdown` / `json` | 出力形式。既定 markdown |
| `pages` | string | ページ範囲 `"1-5"` / `"3"` / `"1,3,5-7"`。省略時は全ページ（対応ツールのみ） |

## ツール一覧

| Tier | ツール | 一行説明 |
|---|---|---|
| 1 | [`read_text`](#read-text) | 読み順を保ったテキスト抽出（/ActualText 解決） |
| 1 | [`read_url`](#read-url) | URL の PDF を直接読取 |
| 1 | [`read_images`](#read-images) | 画像抽出（base64） |
| 1 | [`search_text`](#search-text) | 大文字小文字を無視した検索 |
| 1 | [`get_metadata`](#get-metadata) | メタデータ取得 |
| 1 | [`get_page_count`](#get-page-count) | ページ数（軽量） |
| 1 | [`summarize`](#summarize) | 概観レポート |
| 2 | [`extract_structured_text`](#extract-structured-text) | 論理コンテンツ順のテキスト（タグ付き PDF） |
| 2 | [`extract_tables`](#extract-tables) | `<Table>` サブツリーの構造化抽出 |
| 2 | [`inspect_structure`](#inspect-structure) | 内部オブジェクト構造 |
| 2 | [`inspect_tags`](#inspect-tags) | タグ構造ツリーの観測 |
| 2 | [`inspect_fonts`](#inspect-fonts) | フォントと埋め込み状況 |
| 2 | [`inspect_annotations`](#inspect-annotations) | 注釈の分類・棚卸し |
| 2 | [`inspect_signatures`](#inspect-signatures) | 署名フィールドの**構造**観測 |
| 2 | [`locate_objects`](#locate-objects) | オブジェクト番号 → ページ + 矩形 |
| 3 | [`compare_structure`](#compare-structure) | 2 PDF の構造比較 |
| 3 | [`validate_metadata`](#validate-metadata) | **deprecated** |
| 3 | [`validate_tagged`](#validate-tagged) | **deprecated** |

## ツール別マニュアル — Tier 1

### read_text

Y 座標ベースの読み順（上→下、左→右）でテキストを抽出する。`/ActualText` 置換（ISO 32000-2 §14.9.4）を構造要素・`Span` マーク付きコンテンツの両経路で解決するため、合字・ハイフン処理された語も見た目どおりの綴りで返る。

使い分け:

- **タグ付き PDF** で順序が重要 → `extract_structured_text`（論理コンテンツ順。read_text は座標順）
- タグ付き PDF の表 → `extract_tables`
- **タグ無し多段組**（旧式の新旧対照表など） → `split_columns: 2` / `3` で X 座標により列分割
- 全角空白でインデントされた日本語帳票 → `compact_whitespace: true`（トークン 20–40% 削減）

| 引数 | 型 | 説明 |
|---|---|---|
| `split_columns` | integer | 列数。1（既定）= Y ソート。2 / 3 = X 座標で左→右に分割 |
| `compact_whitespace` | boolean | 空白列（U+3000 含む）を 1 個の ASCII 空白へ圧縮。既定 false |

### read_url

URL（HTTP/HTTPS）から PDF を取得してテキスト抽出する。最大 50MB・タイムアウト 30 秒。`split_columns` / `compact_whitespace` も read_text と同様に使える。

| 引数 | 型 | 説明 |
|---|---|---|
| `url` **必須** | string | PDF の URL（`file_path` の代わり） |

### read_images

埋め込み画像をメタ情報（寸法・色空間・ビット深度）付きの base64 で返す。大きな画像は応答が巨大になるため `pages` で範囲を絞ること。

### search_text

大文字小文字を無視して検索し、ページ番号・一致文字列・前後の文脈を返す。`read_text` と同じテキストに対して検索するため `/ActualText` 置換後の綴りでヒットする。

| 引数 | 型 | 説明 |
|---|---|---|
| `query` **必須** | string | 検索語（1–500 文字） |
| `context_chars` | integer | 前後の文脈文字数。既定 80 |
| `max_results` | integer | 最大件数。既定 20・最大 100 |

### get_metadata

タイトル・作成者・作成日時・ページ数・PDF バージョン・各種フラグ（linearized / encrypted / tagged / 署名有無）・ファイルサイズを返す。

### get_page_count

ページ数のみを返す軽量ツール。抽出範囲を決める前の下見や、PDF が読めるかの確認に。

### summarize

メタデータ・テキスト有無・画像数・1 ページ目のプレビューをまとめた概観。**どの詳細ツールを使うか決める最初の一手**に向く。

## ツール別マニュアル — Tier 2

### extract_structured_text

タグ付き PDF のテキストを**論理コンテンツ順**（ISO 32000-2 §14.8.2.5 の深さ優先走査）で、構造タイプ（role）付きで返す。「H1 のテキストは何か」に答えられる唯一のツールである。

- 要素は `role` / `depth` / `text` / `pages` を持つフラットなリスト（深さ優先 + depth で木を完全に符号化）。Table のみ 2 次元のため `rows` を持つ
- ページをまたぐ要素は**1 要素のまま**（段落は分割されない）
- `alt` は `text` に混入させず別建て（§14.9.3）。`Lbl`（箇条書き記号）は `label` に分離。Artifact（ページ番号・柱）は除外
- **タグ無し PDF は `isTagged: false` を返すだけで、座標からの推測はしない**。足場が要るなら pdf-writer の `ensure_tagged` を先に

| 引数 | 型 | 説明 |
|---|---|---|
| `roles` | array\<string\> | 含める構造タイプ。例 `["H1","H2"]` でアウトライン抽出 |
| `include_bbox` | boolean | 各要素の描画位置も返す。既定 `false`（全ページを 2 度走査するため） |

#### include_bbox — 「この段落はどこか」に答える

```
extract_structured_text({ file_path: "/doc.pdf", roles: ["P"], include_bbox: true })
→ - **P** (page 1) — Measured paragraph
    - *bbox* p1 `(50.0, 297.5, 161.4, 308.6)` — text-extent
  - **Figure** (page 1)
    - *bbox* p1 `(50.0, 150.0, 110.0, 190.0)` — layout-attribute-bbox
```

- **ページを跨ぐ要素はページごとに 1 矩形**。1 つに潰すと、その要素が無いページに矩形を置くことになる
- `basis` は主張の種類を表す

| `basis` | 中身 |
|---|---|
| `layout-attribute-bbox` | ファイルが**宣言**している `/BBox`（ISO 32000-2 Table 379）。生成者の自称であって測定値ではない。**テキストを持たない要素（画像だけの Figure 等）について言える唯一の根拠** |
| `text-extent` | 要素が持つテキストからの**実測**。ベースライン原点＋フォントの ascent/descent = 行ボックスであってグリフ輪郭ではない。画像・ベクター描画は一切寄与しない |

- **宣言はそのまま返した上で突き合わせる。** ページボックス（§7.7.3.3）と要素自身の本文の
  両方に照合し、矛盾すれば `boxNote` で報告する。ファイルは平気で嘘を書く ──
  *Well-Tagged PDF 1.0* の表紙 Figure は `/BBox [-32768 -32768 32767 32767]`
  （矩形であるべき場所に int16 のセンチネル）を宣言している
- **矩形が出せない要素は 0 幅の矩形を返さず、`boxNote` で理由を述べる**

::: tip 独立した正解との突き合わせ
*Well-Tagged PDF 1.0* の `Link` 構造要素 166 件の実測矩形を、生成者が同じリンクに置いた
`Link` **注釈**の `/Rect` 173 件と比較した結果、IoU 中央値 **0.972**・完全に外れたものは 0 件。
:::

### extract_tables

タグ付き PDF の全 `<Table>` サブツリーを `<TR>` → `<TH>/<TD>` で構造化抽出し、カーニング空白を除去する（「消 費 税 法」→「消費税法」）。多段組表での読み順抽出の失敗（新旧対照表で典型）を回避できる。改ページをまたぐ表は 1 つの表として返る。

制約: タグ無し PDF は空結果 + note。colspan/rowspan は展開しない。入れ子の表は外側セルの文字列に含まれる。

### inspect_structure

カタログのエントリ・ページツリー（ページ数・MediaBox）・オブジェクト統計（総数・ストリーム数・型分布）・暗号化状態を返す。

### inspect_tags

タグ付きかどうか・構造ツリー階層と role・最大ネスト深さ・要素総数・role 分布を返す。準拠判定ではなく**構造の事実**が必要なとき（PDF/UA 判定は pdf-verify へ）。

### inspect_fonts

フォント名・型（TrueType / Type1 / CIDFont 等）・エンコーディング・埋め込み/サブセット状況・使用ページを返す。PDF/A・PDF/X の前提となる「全フォント埋め込みか」の観測に。

### inspect_annotations

注釈を種類別（Link / Widget / Highlight / Text 等）・ページ別に分類し、リンク・フォーム・マークアップの有無フラグと個別詳細を返す。

### inspect_signatures

署名フィールド数・署名済み/未署名の内訳・各フィールドの詳細（署名者名・理由・場所・署名日時・filter/subFilter）を返す。

::: warning 構造の観測のみ
**暗号学的検証は行わない。** 署名が数学的に有効かは pdf-verify の `verify_signatures` / `verify_integrity` の答えである。
:::

### locate_objects

オブジェクト番号を**ページと矩形**に変換する。[pdf-verify](/ja/mcp/pdf-verify) の `verify_integrity` が
「署名後にどのオブジェクトが変わったか」を返すので、その番号をここへ渡すと
[pdf-writer](/ja/mcp/pdf-writer) の `add_annotation` にそのまま渡せる矩形になる
（PDF 座標系・左下原点・pt・ISO 32000-1 §7.9.5 正規化済み）。

| 引数 | 型 | 説明 |
|---|---|---|
| `object_numbers` **必須** | array\<number\> | 調べるオブジェクト番号 |

**各位置は `basis`（根拠）を持つ。強さが違うので、1 つの矩形に潰さない。**

| `basis` | 意味 |
|---|---|
| `annotation-rect` | オブジェクト自身の `/Rect`。**正確** |
| `page-box` | オブジェクトがページ。その crop / media box |
| `page-content-stream` | オブジェクトがページを描いている。矩形は**ページ全体**であって変更箇所ではない |
| `page-resource` | フォント・画像などのリソース。**矩形は存在しない**（`rect: null`） |

- 存在しない番号は `found: false`（「座標が不明」ではない）。リビジョンで解放された番号が
  差分から渡ってくるため、両者を混ぜると「あるが位置不明」と誤読される
- 暗号化文書では座標と型は返すが `/T` は `null`（数値と名前は非暗号 = §7.6.2。
  文字列は暗号文のまま）

::: tip 「この段落はどこか」は別の経路
`locate_objects` はコンテンツストリームについて「ページ全体」までしか言えない。
段落・見出し単位で指したいときは
[`extract_structured_text`](#extract-structured-text) の `include_bbox` を使う。
:::

## ツール別マニュアル — Tier 3

### compare_structure

2 つの PDF の構造を比較する（ページ数・バージョン・暗号化・タグ・オブジェクト数・寸法・サイズ・カタログ・署名のプロパティ別 diff + フォント比較）。生成パイプラインの一貫性検証や版比較に。

| 引数 | 型 | 説明 |
|---|---|---|
| `file_path_1` **必須** | string | 比較する 1 つ目の PDF |
| `file_path_2` **必須** | string | 比較する 2 つ目の PDF |

### validate_metadata <Badge type="danger" text="deprecated" />

次メジャーで削除予定。検査対象が Info 辞書のみで、PDF/UA-1 §7.1 が要求する XMP `dc:title` 等を見ない。規格判定は pdf-verify の `validate_conformance` へ。メタデータを読むだけなら `get_metadata` を。

### validate_tagged <Badge type="danger" text="deprecated" />

次メジャーで削除予定。pdf-verify の `validate_conformance`（flavour: `pdfua-1` / `pdfua-2`）が上位互換である（Figure の `/Alt` 実値検証・Link `/Contents`・ISO 14289 条文引用・veraPDF 委譲）。構造ツリーの**事実**が要るなら `inspect_tags`（こちらは deprecated ではない）。
