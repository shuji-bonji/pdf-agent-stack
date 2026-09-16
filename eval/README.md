# eval — 公開版の PDF Agent Stack を外から測る

このディレクトリには、npm に公開した MCP 4 本と Skill を、利用者と同じ経路で動かして測る道具を置いています。設計文書や学習実験は別のリポジトリ（非公開）にあり、ここには**装置と手順**だけを置きます。

| パス | 内容 | 状態 |
| --- | --- | --- |
| [`hosts/grok-build/`](hosts/grok-build/) | Grok Build を別ホストとして、10 ユースケースを再走した評価キット。指示書・検体の作り方・報告書 | 2026-09-15〜16 に実施済み。結果は [reports/SUMMARY.md](hosts/grok-build/reports/SUMMARY.md) |
| [`boundary/`](boundary/) | 境界遵守 eval。検証器の判定が報告文に生き残っているかを、決定論的な規則で採点する測定装置 | 装置と README のみ。ケース定義と検体は非公開 |

`hosts/` はホストごとに 1 ディレクトリです。別のホスト（Codex、Gemini CLI など）で同じ型の評価をするときは、`hosts/<host>/` を足します。

サイトのユースケース（https://shuji-bonji.github.io/pdf-agent-stack/ja/use-cases/ ）の各ページ末尾から、`hosts/grok-build/reports/` の報告書へリンクしています。
