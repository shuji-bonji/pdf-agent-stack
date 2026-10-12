---
description: "PDF Association の「FAQ: AI and PDF」が AI の PDF 取り込みに求める 10 項目と、PDF Agent Stack のどのツールがそれに答えるか"
---

# AI が PDF を読むときに落とすもの

PDF Association は 2026 年、「[FAQ: AI and PDF](https://pdfa.org/faq-ai-and-pdf/)」を公開しました。AI システムが PDF を取り込むときに何を落としてはいけないかを 29 問で述べたページで、PDF Agent Stack が「PDF を Markdown に変換して LLM に渡す」のではなく「MCP で構造を読む」形を取っている理由と、ほぼ重なっています。このページでは、FAQ が AI 開発者に求めていることを 10 項目に整理し、PDF Agent Stack のどのツールがそれに答えるかを示します。

::: info 出典について
PDF Association, "FAQ: AI and PDF", <https://pdfa.org/faq-ai-and-pdf/>（2026 年 10 月 12 日閲覧）。ページに著者名と公開日の記載はありません。以下の「FAQ の主張」欄は原文の要点を整理したもので、引用ではありません。
:::

## FAQ が否定している 3 つの手順

FAQ は、現在の RAG パイプラインでよく見る次の手順を、いずれも**情報を落とす手順**として否定しています。

| よく見る手順 | FAQ の指摘 | 落ちるもの |
|---|---|---|
| PDF を Markdown / HTML / プレーンテキストに変換してから渡す | 変換は推奨しない | 結合セル・レイヤー・デジタル署名・上付き文字の意味。幻覚の原因になる |
| ページごとに切って渡す | ページ単位で処理しない。ただし出典のページ参照は保つ | ページをまたぐ段落・表・脚注 |
| とりあえず OCR する | born-digital の文書はテキスト抽出のほうが正確 | `ActualText`・合字の Unicode 対応・注釈内の文字。OCR は見えている文字しか拾わない |

PDF Agent Stack はこの 3 つをしません。pdf-reader-mcp はファイルを変換せず、`response_format: "json"` で構造（タグの役割・座標）を保ったまま返します。[pdf-read](/ja/skills/pdf-read) Skill は、ページ単位で読む経路を使うときに前後 1 ページを足して読み、Read Report に「ページ境界で切れた箇所」を申告します。OCR は持たず、テキストとして読めないページだけを `render_page` で画像にして視覚モデルに渡します。

## 10 の要求と、答えるツール

| # | FAQ の主張 | PDF Agent Stack での答え |
|---|---|---|
| 1 | ページ内容・テキスト・画像・ブックマーク・レイヤー・XMP メタデータ・注釈・添付ファイルの**全部**を取り込む | pdf-reader-mcp の `read_text` / `read_images` / `inspect_annotations` / `inspect_signatures` に加え、v0.16.0 の [`inspect_catalog`](/ja/reference/mcp/pdf-reader#inspect-catalog) がブックマーク（`/Outlines`）・レイヤー（`/OCProperties`）・添付（`/EmbeddedFiles`）・XMP 本体を列挙します |
| 2 | Tagged PDF の構造ツリー（読み順・表・代替テキスト・言語）を先に使い、推論は後回しにする | `extract_structured_text` / `extract_tables` / `inspect_tags`。pdf-read Skill はタグ付き文書で必ず構造経路を先に取ります |
| 3 | XMP の PDF/UA 宣言を「タグ構造を信頼してよい合図」として使う | `summarize` が `declaredConformance.pdfuaid` を読み、宣言があれば構造経路を先に勧めます。宣言と実態の照合は pdf-verify-mcp の `validate_conformance` です |
| 4 | W3C TDMRep など権利表明メタデータを読み、著者の意思を尊重する | `inspect_catalog` と `summarize` が `tdm:reservation` / `tdm:policy` を書いてあるとおりに返します。従うかどうかの判断は呼び出し側に残します |
| 5 | born-digital の文書はテキスト抽出、OCR は最後の手段 | `read_text` がページごとに `extracted` / `no_text_layer` / `not_extractable` / `not_observed` を申告します。空の結果を「文字が無い」とは読みません |
| 6 | Markdown / HTML への事前変換をしない | 変換の経路がありません。各ツールが構造を保った JSON を返します |
| 7 | ページ単位で切らない。出典のページ参照は保つ | `extract_tables` はページをまたぐ表を 1 つとして返します。pdf-read Skill の絞り込み経路は前後 1 ページを足して読みます |
| 8 | 注釈を種類ごとの意味で扱う。黒塗り（Redact）注釈が残っていれば黒塗りは未完了 | `inspect_annotations` が Subtype ごとに数えます。pdf-verify-mcp v0.30.0 の `evaluate_policy` は Redact 注釈の残存で `POL-CAUTION-REDACT-PENDING` を発火し、[pdf-trust](/ja/skills/pdf-trust) が推奨アクションを書きます |
| 9 | 破損した PDF から回復できるものは回復する。処理系ごとに回復結果が違うことに注意 | `@normativepdf/recover` が相互参照表を組み直して読みます。組み直したときは、すべての判定の先頭に `scope.reconstructed: true` が付きます |
| 10 | 悪意ある PDF（マルウェア・フィッシング・AI への poisoning）に備える。署名検証が助けになる | pdf-verify-mcp の `verify_signatures` / `verify_integrity` に加え、v0.30.0 の `evaluate_policy` が ISO 32000-2 §12.8.7 の数え方で JavaScript・Launch・リモート Go-To・SubmitForm の件数を `facts.content` に出し、`POL-CAUTION-ACTIVE-CONTENT` を発火します |

## 観測と判定を分けていること

FAQ の要求に答えるとき、PDF Agent Stack は「何があるか」と「それでよいか」を別のサーバーに置いています。

- pdf-reader-mcp は、XMP に `pdfuaid:part = 1` と書いてあることを**宣言として**返します。PDF/UA に適合しているとは言いません。
- pdf-verify-mcp は、Redact 注釈が残っていることから「黒塗りの対象だった内容がファイルに残っている」と**判定**し、`use_with_caution` を返します。残っている内容そのものは取り出しません。
- どちらも、読めなかったものを「無かった」とは書きません。`inspect_catalog` の各項目は `absent`（キーが無い）と `unreadable`（キーはあるが値に届かない）を分け、`evaluate_policy` の `facts.content` が取れなかったときは「数えていない」と書いて 0 とは書きません。

この分け方の背景は [全体構成と責務](/ja/guide/architecture) にあります。

## まだ答えていないこと

- FAQ が挙げる「処理系ごとに回復結果が違う」ことの計測（他の実装との差分比較）は行っていません。
- ISO 32000-2 §12.8.7 Table 264 のうち、AlternateImages・ExternalStreams・TrueTypeFonts・ExternalRefXobjects・ExternalOPIdicts・NonEmbeddedFonts・DevDepGS_* は数えていません。
- スクリプトの中身は読みません。言えるのは「ある」「何バイトある」までです。

## 関連ページ

- [全体構成と責務](/ja/guide/architecture) — 観測・判定・生成・規範を分ける理由
- [pdf-read](/ja/skills/pdf-read) — 読み取り経路の選び方と Read Report
- [pdf-trust](/ja/skills/pdf-trust) — 受入監査と Trust Report
- [ISO 仕様書の読み方](/ja/reference/iso-reading-primer)
