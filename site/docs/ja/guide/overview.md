---
description: PDF Agent Stack の全体像 — 4 つの MCP サーバーと 3 つの Skill の構成要素、観測・判定・生成・規範を分離する理由
---

# PDF Agent Stack とは

PDF Agent Stack は、AI エージェントに PDF の「読む・検証する・書く・仕様で裏付ける」能力を与える、4 つの独立した [MCP](/ja/reference/glossary#本サイトの基本用語-ai・開発) サーバーと 3 つの [Skill](/ja/reference/glossary#本サイトの基本用語-ai・開発) の総称です。

## 構成要素

| 種別  | 名前                                  | 役割                                                                   | 配布                                                                                                                       |
| ----- | ------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| MCP   | [pdf-spec-mcp](/ja/mcp/pdf-spec)      | PDF 仕様を参照する（ISO 32000 ほか 17 文書）                            | [npm](https://www.npmjs.com/package/@shuji-bonji/pdf-spec-mcp) · [GitHub](https://github.com/shuji-bonji/pdf-spec-mcp)     |
| MCP   | [pdf-reader-mcp](/ja/mcp/pdf-reader)  | PDF の内部状態を観測する（観測 20 ツール）                              | [npm](https://www.npmjs.com/package/@shuji-bonji/pdf-reader-mcp) · [GitHub](https://github.com/shuji-bonji/pdf-reader-mcp) |
| MCP   | [pdf-verify-mcp](/ja/mcp/pdf-verify)  | 真正性・準拠性を検証する（判定 7 ツール）                              | [npm](https://www.npmjs.com/package/@shuji-bonji/pdf-verify-mcp) · [GitHub](https://github.com/shuji-bonji/pdf-verify-mcp) |
| MCP   | [pdf-writer-mcp](/ja/mcp/pdf-writer)  | 仕様に沿って PDF を生成する（生成・編集 20 ツール）                    | [npm](https://www.npmjs.com/package/@shuji-bonji/pdf-writer-mcp) · [GitHub](https://github.com/shuji-bonji/pdf-writer-mcp) |
| Skill | [pdf-trust](/ja/skills/pdf-trust)     | 受け取った PDF の署名・改ざん・規格適合を調べ、4 値判定を返す（Trust Report）| [GitHub](https://github.com/shuji-bonji/pdf-trust-skill)                                                                   |
| Skill | [pdf-publish](/ja/skills/pdf-publish) | 生成した PDF を読み戻して veraPDF で採点し、通ったものだけ納品する（Publish Report） | [GitHub](https://github.com/shuji-bonji/pdf-publish-skill)                                                                 |
| Skill | [pdf-read](/ja/skills/pdf-read)       | 大きな PDF・読めない PDF から必要な箇所を取り出す（Read Report）        | [GitHub](https://github.com/shuji-bonji/pdf-read-skill)                                                                    |

サーバー群の下には、単体でも公開しているライブラリが 2 つあります。

- [pdf-constraints](/ja/reference/pdf-constraints) — pdf-verify の条文検査が使うデータライブラリ。ISO 32000 の条文を機械検査できる制約テーブルの形に書き起こしたもので、CI で CLI として単体利用もできます
- [normativepdf](https://github.com/shuji-bonji/normativepdf) — pdf-writer が PDF を書くときに通すライブラリ。振る舞いを ISO 32000 の条項に紐づけてあります

::: info 構成と責務について
これらがどう繋がって動くか。詳しくは [全体構成と責務](/ja/guide/architecture) を参照してください。PDF を Markdown に変換せず MCP で構造を読む理由は、PDF Association の FAQ に照らした [AI が PDF を読むときに落とすもの](/ja/guide/ai-and-pdf) にまとめています。
:::

エージェントは MCP を直接呼んでもよいですし、Skill を入れてもかまいません。Skill を入れると、複数の MCP を**どの順に呼び、返ってきた判定をどう読み、どの形式のレポートにまとめるか**が決まります。

## 5 分で試す

1. [導入手順](/ja/guide/getting-started) で pdf-reader を設定
2. 手元の PDF に「この PDF のメタデータと構造を見せて」
3. 署名付き PDF なら pdf-verify を足して「この PDF は改ざんされてない？」
4. [ユースケース](/ja/use-cases/) で本格的なワークフローへ
