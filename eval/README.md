# eval — 公開版の PDF Agent Stack を外から測る

このディレクトリには、npm に公開した MCP 4 本と Skill を、利用者と同じ経路で動かして測る道具を置いています。設計文書や学習実験は別のリポジトリ（非公開）にあり、ここには**装置と手順**だけを置きます。

| パス | 内容 | 状態 |
| --- | --- | --- |
| [`hosts/grok-build/`](hosts/grok-build/) | Grok Build を別ホストとして、10 ユースケースを再走した評価キット。指示書・検体の作り方・報告書 | 2026-09-15〜16 に実施済み。結果は [reports/SUMMARY.md](hosts/grok-build/reports/SUMMARY.md) |
| [`boundary/`](boundary/) | 境界遵守 eval。検証器の判定が報告文に生き残っているかを、決定論的な規則で採点する測定装置 | 装置と README のみ。ケース定義と検体は非公開 |
| [`e2e/`](e2e/) | 4 サーバーを stdio で起動し、同じプロセスのままファイルや環境を変えてもう一度呼ぶ E2E。書いてから読む流れと、起動中に部品・veraPDF・仕様書を変えたときの振る舞い | 2026-11-01 に追加（#44）。CI は手動と毎週月曜 |
| [`TRIAL-PLAYBOOK.md`](TRIAL-PLAYBOOK.md) | 版が大きく上がったときに通しで使う試用の進め方。計画から公開後の確認・Issue を閉じるまでの手順と、2026-11 に分かったこと | 2026-11-05 に作成。次の試用はこれに沿って計画する |
| [`trial-2026-11/`](trial-2026-11/) | 配布の形・OS・ホストを変えて、MCP・Skill・plugin を通しで使う試用の計画と結果。E1〜E6 の環境ごとに結果を置き、見つけた問題は `FINDINGS.md` に書く | 2026-11-03〜05 に実施し、#47・#48 を閉じた。E6（Windows のホスト）は保留 |

`hosts/` はホストごとに 1 ディレクトリです。別のホスト（Codex、Gemini CLI など）で同じ型の評価をするときは、`hosts/<host>/` を足します。

サイトのユースケース（https://shuji-bonji.github.io/pdf-agent-stack/ja/use-cases/ ）の各ページ末尾から、`hosts/grok-build/reports/` の報告書へリンクしています。
