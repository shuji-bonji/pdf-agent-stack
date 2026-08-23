# Issue 下書き: [pdf-reader-mcp] read_text が「テキストが無い」と「抽出できない」を区別できない

**対象リポジトリ: pdf-reader-mcp（stack ではない）/ 対象バージョン: v0.11.2**

`read_text` は「抽出できたテキスト」を返すか「空」を返すかの **2 値**しか持たない。
ISO 32000-2 が明示的に区別している 3 つの状態が、呼び出し側から見て 1 つに潰れている。

これは pdf-verify-mcp の `/Prev 0` 問題（歩けない ≠ 変更なし → リンクを 3 値で返す）と
**同じ形のバグ**であり、同じ直し方をする。

---

## 現象（2026-08-13 実測・v0.11.2 / plugin 経由ローカル）

### 1. 空ページと「テキスト層が無いページ」が同じ出力になる

```
read_text(tests/fixtures/empty.pdf)
→ ## Page 1
   （空行）
```

スキャン PDF（ページ全面が画像・テキスト層なし）を投げても**同じ形の出力**が返る。
呼び出し側のエージェントには次の 2 つが区別できない:

- このページには本当に何も書かれていない
- このページは画像で、テキストとしては**読めない**（OCR が要る）

### 2. 抽出できなかった文字が黙って消える

```
inspect_fonts(tests/fixtures/cid-font.pdf)
| Helvetica                            | Type1 | WinAnsiEncoding | 埋込 No |
| AAAAAA+NotoSansJP-Regular-Identity-H | Type0 | Identity-H      | 埋込 Yes |
| KozMinPr6N-Regular-UniJIS-UCS2-H     | Type0 | UniJIS-UCS2-H   | 埋込 No |
| BrokenCID-Identity-H                 | Type0 | Identity-H      | 埋込 No |   ← ToUnicode なし

read_text(tests/fixtures/cid-font.pdf)
→ Type0 (CID) font fixture
   F1: embedded CIDFontType2 / F2: not embedded / F3: malformed
```

Helvetica の行だけが返り、`BrokenCID-Identity-H` が示した内容は**警告なしに落ちている**。
返ってきたテキストは一見「完全な抽出結果」に見える。**部分的な欠落が成功に化けている。**

### 3. 実装側の裏付け（grep 実測）

```
$ grep -rni "ToUnicode" src/            → 0 件
$ grep -rni "scanned|text.?layer|needs.?ocr" src/  → 0 件
  （ヒットする pagesScanned は単なるページ数カウンタで無関係）
```

抽出可能性を判断する材料が実装内に存在しない。

---

## 仕様上の根拠（ISO 32000-2 §9.10.1「Extraction of text content」）

> If a font is not defined in one of these ways, the glyphs can still be shown, but the
> characters **cannot be converted to Unicode values** without additional information
> using the following methods:
>   • ... an optional **ToUnicode** entry in the font dictionary (PDF 1.2; see 9.10.3) ...
>   • An **ActualText** entry for a structure element or marked-content sequence
>     (see 14.9.4, "Replacement text") ...

規格自身が「**表示はできるが Unicode に変換できない**」状態を定義している。
したがって `read_text` の空・欠落は「テキストが無いこと」の証拠にならない。

同じ理由で、抽出が**信頼できる**条件も規格が列挙している（§9.10.1）:

- フォントが標準の名前付きエンコーディングを使っている
- 文字が標準の文字名または既知コレクションの CID で識別されている
- `ToUnicode` CMap がある
- `ActualText` がある（`read_text` は既にこの経路を解決している）

これは実装可能な判定条件であって、推測ではない。

---

## なぜ 2 値だと壊れるのか

このサーバの契約は「**観測する。正しさは判定しない**」である。
2 値の戻り値は、その契約に反して**判定を 1 つ埋め込んでいる** —
「抽出結果が空である」を「テキストが無い」と読ませてしまう。

pdf-family の既存の教訓と同型:

- **判定不能は無罪ではない** — 測れなかったケースを「無し」に数えてはいけない
- **フォールバックした既定値は観測ではない** — 空文字は観測結果ではなく初期値
- **`/Prev 0` を飲むと「歩き切った」になる** — 同じ症状を verify 側で一度踏んでいる

---

## 提案

### A. 戻り値を 3 値にする

ページごとに、抽出結果と並べて状態を返す:

| 状態 | 条件 | 意味 |
|---|---|---|
| `extracted` | text-showing 演算子があり、全フォントが §9.10.1 の条件を満たす | そのまま信用してよい |
| `no_text_layer` | text-showing 演算子（`Tj` `TJ` `'` `"`）が無く、画像 XObject（`Do`）がある | 読めない。OCR が要る |
| `not_extractable` | text-showing 演算子はあるが、標準エンコーディング／既知 CID／`ToUnicode`／`ActualText` のいずれも持たないフォントが含まれる | 一部または全部が欠落している |

`not_extractable` は**部分的にも起きる**（cid-font.pdf がその実例）ので、
「どのフォントが原因か」をページ単位で併記する。真偽ではなく**内訳**を返す。

### B. 新ツールは作らない

`inspect_text_layer` のような独立ツールを足しても、
**エージェントは今までどおり `read_text` を呼んで空を受け取る**ので穴は残る。
（教訓: 「切ったつもりの経路を数え上げる」— 経路を 1 本残すと対策が成立しない）

したがって、テキストを返す**全経路**に同じ状態を載せる:

- `read_text`
- `search_text`（ヒット 0 件が「無い」なのか「読めない」なのか区別できない — 同じバグ）
- `extract_structured_text`
- `summarize`

ツール数は **18 のまま**とする（`extract_structured_text` に `include_bbox` を足した
ときと同じ判断）。

### C. スコープ外（この Issue に含めない）

きっかけになった [firecrawl/pdf-inspector](https://github.com/firecrawl/pdf-inspector)
の他機能は、次の理由で**採らない**:

- **Markdown 変換（フォントサイズ比で H1–H4 を推定）** — 観測ではなく推論。
  `extract_structured_text` は構造ツリー由来の**本物の**見出しを返しており、
  同一サーバに「タグ由来の H2」と「サイズから当てた H2」が混在すると受け手が区別できない。
- **ヒューリスティック表検出** — `extract_tables` が既にある。置換するなら
  旧実装との A/B が先（測る前に入れる理由がない）。
- **依存としての取り込み** — Rust + napi はプラットフォーム別バイナリを持ち込み、
  リリース後の `npx` 公開版検証を壊す。**そもそも不要**で、`pdfjs-dist`（既存依存）に
  content stream のオペレータ列挙も ToUnicode CMap の解決も揃っている。**新規依存ゼロ**。

---

## 先に埋めるべきフィクスチャの穴（実測 2026-08-13）

`tests/fixtures/` 17 件を調べた結果、**この Issue の受入を測れる検体が 1 つも無い**:

| 軸 | 現状 | 判定 |
|---|---|---|
| `ToUnicode` を持つ PDF | **0 / 17 件** | `extracted` 側が一度も測られていない |
| テキスト層が無い（画像のみ）PDF | **0 / 17 件** | `no_text_layer` を測れない |
| ToUnicode 無しの CID フォント | 1 件（`cid-font.pdf` の `BrokenCID-Identity-H`） | ただし同ページに Helvetica の本文があり、**単独では測れない** |

`image-kinds.pdf` は `/Image` を 4 つ持つが、本文テキスト
（`ImageKind fixture: RGB / RGBA / Grayscale-1bpp`）も持つため `no_text_layer` にならない。

**教訓「フィクスチャが 1 形しか作らない軸は永久に測られない」の再演になる。**
実装より先に、最低でも次の 3 件を追加する:

1. `no-text-layer.pdf` — 全ページが画像のみ（`Tj`/`TJ` 無し・`Do` あり）
2. `tounicode-cid.pdf` — Identity-H + **正しい `ToUnicode` CMap**（`extracted` の対照）
3. `broken-cid-only.pdf` — `BrokenCID-Identity-H` **だけ**で本文を描くページ
   （`not_extractable` を単独で測る。`cid-font.pdf` は混在なので代用にならない）

さらに、混在ページ（extracted + not_extractable が同一ページ）を測るために
`cid-font.pdf` を**そのまま第 4 の検体として使う**。

---

## 受入基準

- [ ] 上記 3 件のフィクスチャを追加し、既存 `cid-font.pdf` と合わせて 4 形が揃っている
- [ ] `no-text-layer.pdf` が `no_text_layer` を返す（空文字を返して終わらない）
- [ ] `tounicode-cid.pdf` が `extracted` を返し、本文が正しく読める
- [ ] `broken-cid-only.pdf` が `not_extractable` を返し、原因フォント名を併記する
- [ ] `cid-font.pdf` が**部分的な** `not_extractable` を返す
      （Helvetica 部分は読めたうえで、落ちた分を申告する）
- [ ] `empty.pdf` は `extracted`（本当に空）であり `no_text_layer` **ではない**
      — 両者が区別できていることの対照
- [ ] `read_text` / `search_text` / `extract_structured_text` / `summarize` の
      **4 経路すべて**が同じ状態を返す（1 本でも素通りしたら不合格）
- [ ] `search_text` のヒット 0 件が、`not_extractable` のページを含む場合に
      「見つからない」と報告しない
- [ ] 新規依存を追加していない（`pdfjs-dist` の範囲で実装されている）
- [ ] ツール数が 18 のまま
- [ ] 回帰: 既存テスト緑 + リリース後に `npx` で公開版検証

---

## 補足: 契約文の更新

`src/index.ts` のサーバ instructions は現在こう書いている:

> No incremental-update history (that is pdf-verify-mcp verify_integrity), and no OCR.

「OCR をしない」ことは書いてあるが、「**OCR が要る状態を検出して申告する**」とは
書いていない。この Issue が入ったら instructions にも一行足す
（観測サーバとして「読めなかったことを読めなかったと言う」のは契約の内側）。

---

## 出典

- ISO 32000-2 §9.10.1 "Extraction of text content"（pdf-spec-mcp で原文確認・2026-08-13）
- 実測環境: pdf-reader-mcp v0.11.2 / 依存 = `pdf-lib` ^1.17.1, `pdfjs-dist` ^4.9.155
- きっかけ: [firecrawl/pdf-inspector](https://github.com/firecrawl/pdf-inspector)
  （分類の考え方のみ参照。依存としては採らない）
