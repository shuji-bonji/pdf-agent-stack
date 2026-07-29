# PDF Family とは

PDF Family は、AI エージェントに PDF の「読む・検証する・書く・仕様で裏付ける」能力を与える、4 つの独立した MCP サーバと 2 つの Skill の総称です。

## 構成要素

| 種別 | 名前 | 一行定義 | npm / 配布 |
|---|---|---|---|
| MCP | [pdf-spec-mcp](/ja/mcp/pdf-spec) | 仕様は何を要求するか（ISO 32000 ほか 17 文書） | `@shuji-bonji/pdf-spec-mcp` |
| MCP | [pdf-reader-mcp](/ja/mcp/pdf-reader) | 中身に何があるか・それはどこか（観測 18 ツール） | `@shuji-bonji/pdf-reader-mcp` |
| MCP | [pdf-verify-mcp](/ja/mcp/pdf-verify) | 本物で規格に適っているか（判定 7 ツール） | `@shuji-bonji/pdf-verify-mcp` |
| MCP | [pdf-writer-mcp](/ja/mcp/pdf-writer) | 仕様通りに書けるか（生成・編集 20 ツール） | `@shuji-bonji/pdf-writer-mcp` |
| Skill | [pdf-trust](/ja/skills/pdf-trust) | 受入監査の編成（Trust Report） | GitHub |
| Skill | [pdf-publish](/ja/skills/pdf-publish) | 品質ゲート付き納品の編成（Publish Report） | GitHub |

## なぜ分かれているのか

「観測」と「判定」と「生成」と「規範」は、混ぜると嘘をつきやすくなるからです。reader が合否を言い始めると、暗号検証なしの「たぶん本物」が生まれます。writer が「準拠 PDF を作れます」と言うと、宣言と準拠の混同が起きます。Family は責務を分けることで、**それぞれの答えの信頼できる範囲**を明確にしています。

詳しくは [全体構成と責務](/ja/guide/architecture) へ。

## 5 分で試す

1. [導入手順](/ja/guide/getting-started) で pdf-reader を設定
2. 手元の PDF に「この PDF のメタデータと構造を見せて」
3. 署名付き PDF なら pdf-verify を足して「この PDF は改ざんされてない？」
4. [ユースケース](/ja/use-cases/) で本格的なワークフローへ
