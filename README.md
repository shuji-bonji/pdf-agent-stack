# PDF Agent Stack

PDF を **読む / 調べる / 反証する / 書く** を、LLM から決定論的に扱うための MCP サーバ・
ライブラリ・Skill 群。それぞれ独立して使えて、組み合わせると受入監査から納品までが 1 本になる。

**設計の中心にあるのは 3 つの区別**である。

| | 意味 |
| --- | --- |
| **宣言**（declaration） | 文書が自分について書いたこと（XMP の `pdfaid` / `pdfuaid`）。**何も証明しない** |
| **適合**（conformance） | 誰にも証明できない。**反証しかできない** |
| **検証**（validation） | 検証器が実装した規則の中でのみ有効 |

この区別を守るために、判定はコードが下し、LLM は理由を説明する側に置いている。

## 構成

<!-- stack:begin — scripts/generate-stack.mjs が生成。手で編集しない -->

> 版は実測（2026-07-29 時点の `npm view`）。

| リポジトリ | 役割 | 配布形態 | 版 | npm |
| --- | --- | --- | --- | --- |
| [pdf-spec-mcp](https://github.com/shuji-bonji/pdf-spec-mcp) | canon | mcp-server | 0.4.5 | `@shuji-bonji/pdf-spec-mcp` |
| [pdf-reader-mcp](https://github.com/shuji-bonji/pdf-reader-mcp) | structure | mcp-server | 0.11.1 | `@shuji-bonji/pdf-reader-mcp` |
| [pdf-verify-mcp](https://github.com/shuji-bonji/pdf-verify-mcp) | judgment | mcp-server | 0.13.0 | `@shuji-bonji/pdf-verify-mcp` |
| [pdf-writer-mcp](https://github.com/shuji-bonji/pdf-writer-mcp) | action | mcp-server | 0.17.0 | `@shuji-bonji/pdf-writer-mcp` |
| [pdf-constraints](https://github.com/shuji-bonji/pdf-constraints) | judgment | library | 0.3.0 | `@shuji-bonji/pdf-constraints` |
| [normativepdf](https://github.com/shuji-bonji/normativepdf) | action | library | — | — |
| [pdf-trust-skill](https://github.com/shuji-bonji/pdf-trust-skill) | procedure | skill | 0.5.0 | — |
| [pdf-publish-skill](https://github.com/shuji-bonji/pdf-publish-skill) | procedure | skill | 0.5.0 | — |
| [pdf-specialist-plugin](https://github.com/shuji-bonji/pdf-specialist-plugin) | orchestration | plugin | 0.6.0 | — |
| [pdf-agent-pipeline](https://github.com/shuji-bonji/pdf-agent-pipeline) | orchestration | app | 0.1.0 | — |

<!-- stack:end -->

**版は `stack.json` が正典**で、`npm view` の実測から生成する。

```sh
node scripts/generate-stack.mjs            # 生成（手元）
node scripts/generate-stack.mjs --check    # npm と照合（CI）。ずれていれば exit 1
node scripts/generate-stack.mjs --readme   # 上の表を差し替え
```

`--check` は**ローカルの clone を見ない**。CI に clone は無いので、照合は npm だけで完結する。
`npm view` が応答しなかった場合は「ずれ」ではなく **判定不能**として exit 2 を返す
——「測れなかった」を「一致」に混ぜないため。

### 2 つの軸で見る

| 軸 | 値 |
| --- | --- |
| **役割**（layer） | canon / structure / judgment / action / procedure / orchestration / hub |
| **配布形態**（form） | mcp-server / library / skill / plugin / app / site |

配布形態を決めるのは「**誰が起動するか**」である。
`mcp-server` は LLM が呼び、`library` は開発者のコードが import し、`app` は人・シェル・CI が起動する。

同じ役割を違う配布形態で実装したものがある。`pdf-specialist-plugin`（plugin・LLM が主）と
`pdf-agent-pipeline`（app・コードが主）はどちらも編成層で、**主従が逆**の 2 実装である。

## このリポジトリの構成

```
pdf-agent-stack/
├── site/       ドキュメントサイト（VitePress）
├── scripts/    stack.json の生成・照合
├── stack.json  構成の正典（実測値）
├── mcp/ lib/ agent/ skill/   ← 各リポジトリの作業コピー（.gitignore 済み）
└── docs/       設計・評価の記録（非公開・.gitignore 済み）
```

`mcp/` などは**独立したリポジトリ**で、このリポジトリは束ねているだけである。
`.gitignore` に入れているのは秘匿のためではなく、`git add` で誤って gitlink として
登録されるのを防ぐため。clone しても中身は入らない。

## ドキュメント

サイト: <https://shuji-bonji.github.io/pdf-agent-stack/>

## ライセンス

各リポジトリの LICENSE に従う。
