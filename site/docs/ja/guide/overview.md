---
description: PDF Agent Stack（PDF Family）の全体像 — 4 つの MCP サーバーと 2 つの Skill の構成要素、観測・判定・生成・規範を分離する理由
---

# PDF Family とは

PDF Family は、AI エージェントに PDF の「読む・検証する・書く・仕様で裏付ける」能力を与える、4 つの独立した [MCP](/ja/reference/glossary#本サイトの基本用語-ai-開発) サーバーと 2 つの [Skill](/ja/reference/glossary#本サイトの基本用語-ai-開発) の総称である。**PDF Agent Stack はこの体系全体（サイト・リポジトリ群）の名前で、PDF Family と同じもの**を指す。

## 構成要素

| 種別  | 名前                                  | 役割                                                                   | 配布                                                                                                                       |
| ----- | ------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| MCP   | [pdf-spec-mcp](/ja/mcp/pdf-spec)      | PDF 仕様を参照する（ISO 32000 ほか 17 文書）                            | [npm](https://www.npmjs.com/package/@shuji-bonji/pdf-spec-mcp) · [GitHub](https://github.com/shuji-bonji/pdf-spec-mcp)     |
| MCP   | [pdf-reader-mcp](/ja/mcp/pdf-reader)  | PDF の内部状態を観測する（観測 18 ツール）                              | [npm](https://www.npmjs.com/package/@shuji-bonji/pdf-reader-mcp) · [GitHub](https://github.com/shuji-bonji/pdf-reader-mcp) |
| MCP   | [pdf-verify-mcp](/ja/mcp/pdf-verify)  | 真正性・準拠性を検証する（判定 7 ツール）                              | [npm](https://www.npmjs.com/package/@shuji-bonji/pdf-verify-mcp) · [GitHub](https://github.com/shuji-bonji/pdf-verify-mcp) |
| MCP   | [pdf-writer-mcp](/ja/mcp/pdf-writer)  | 仕様に沿って PDF を生成する（生成・編集 20 ツール）                    | [npm](https://www.npmjs.com/package/@shuji-bonji/pdf-writer-mcp) · [GitHub](https://github.com/shuji-bonji/pdf-writer-mcp) |
| Skill | [pdf-trust](/ja/skills/pdf-trust)     | 受領した PDF を精査し、信頼性を確認する（Trust Report）                  | [GitHub](https://github.com/shuji-bonji/pdf-trust-skill)                                                                   |
| Skill | [pdf-publish](/ja/skills/pdf-publish) | 品質管理（ゲート）を組み込んだパイプラインで生成する（Publish Report） | [GitHub](https://github.com/shuji-bonji/pdf-publish-skill)                                                                 |

pdf-verify の条文検査は、別パッケージの [pdf-constraints](/ja/reference/pdf-constraints) を使う。ISO 32000 の条文を機械検査できる制約テーブルの形に書き起こしたデータライブラリで、単体でも利用できる。

::: info 構成と責務について
これらがどう繋がって動くか。詳しくは [全体構成と責務](/ja/guide/architecture) を参照してください。
:::

エージェントは MCP を直接呼んでもよいし、Skill に編成を任せてもよい。Skill を入れると、複数 MCP の**呼び出し順序・判定の読み方・レポート形式**が定型化される。

## 5 分で試す

1. [導入手順](/ja/guide/getting-started) で pdf-reader を設定
2. 手元の PDF に「この PDF のメタデータと構造を見せて」
3. 署名付き PDF なら pdf-verify を足して「この PDF は改ざんされてない？」
4. [ユースケース](/ja/use-cases/) で本格的なワークフローへ
