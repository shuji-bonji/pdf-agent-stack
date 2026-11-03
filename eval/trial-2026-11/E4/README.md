# E4：Mac・Grok Build

Grok Build に plugin で入れた MCP 4 本・Skill 3 本・pdf-specialist subagent で、UC01〜UC10 を回します。指示書と採点の物差しは、2026-09 の評価（[`hosts/grok-build/`](../../hosts/grok-build/)）と同じものを使います。回すのは shuji-bonji です。

## 回す前に手元で変えること

| # | 変えること | 理由 |
| --- | --- | --- |
| 1 | `~/.grok/config.toml` の `[mcp_servers.pdf-writer-dev]` を `enabled = false` にする | plugin の `pdf-writer` と同じ 20 ツールが 2 組になり、どちらの writer の結果か分からなくなるため |
| 2 | Grok Build を `eval/hosts/grok-build` で起動し、`grok inspect` の `Project Instructions` に `AGENTS.md` が出ることを確かめる | 2026-11-04 の `grok inspect` では CWD が `claude-plugins` で、`Project Instructions (None)` だった |

## 変えないこと（決めた扱い）

| 点 | 扱い |
| --- | --- |
| `pdf-spec` | `config.toml` の登録（`PDF_SPEC_DIR` を渡す）をそのまま使う。plugin 側と名前が同じで、`grok inspect` には config 側だけが出る。plugin の `env` の `${PDF_SPEC_DIR}` が展開されないこと（F-22）は、E3 と 2026-09 の評価で確かめ済み |
| plugin の `pdf-writer` のフォント | 渡さない。`FONT_REQUIRED` が返ったらそれを記録し、`fontPath` に `/Users/bonji/workspace/shuji-bonji/pdf-agent-stack/mcp/pdf-writer-mcp/NotoSansJP-Regular.otf` を渡して続ける（`fonts/` は空） |
| 出力先 | `reports/2026-11/`・`out/2026-11/`・`fixtures/generated/2026-11/`。2026-09 の結果は上書きしない |

## 開始プロンプト（最初のセッションに貼る）

```text
この作業場は PDF Agent Stack の実機評価用です。2026-11 の試用（shuji-bonji/pdf-agent-stack#47 の E4）として、2026-09 の評価と同じ指示書を、今の版で回し直します。AGENTS.md と 00-grok-build-setup.md を読み、次の手順で環境を確かめてください。製品コードは変更しないでください。

■ 出力先の読み替え（すべての指示書に適用）
- reports/ → reports/2026-11/
- out/ → out/2026-11/
- fixtures/generated/ → fixtures/generated/2026-11/
2026-09 の reports/・out/・fixtures/generated/ にあるファイルは、読むのはよいが、上書きも入力への流用もしないでください。指示書の「データ準備」で作るものは、2026-11 のフォルダーに作り直してください。fixtures/incoming/ は読み取り専用です。

■ 手順 1：起動した版
4 サーバーの serverInfo（名前と版）を表にしてください。期待値は次のとおりです。違っていたら止めずに、違ったことを記録してください。
- pdf-reader-mcp 0.18.1 / pdf-writer-mcp 0.23.1 / pdf-verify-mcp 0.32.2 / pdf-spec-mcp 0.11.0
あわせて、各サーバーがどの登録から起動したか（plugin か config か）と、npm view @shuji-bonji/pdf-*-mcp version の結果も書いてください。plugin は npx -y …@latest で起動するので、npx のキャッシュの版と npm の最新版が違うことがあります。

■ 手順 2：Skill と subagent
発見された Skill と Agent を表にしてください。期待値は pdf-read 0.2.3・pdf-trust 0.8.3・pdf-publish 0.7.1・pdf-specialist 0.7.0 です。pdf-read が 2 つ（pdf-read と user/0de2cfe1/pdf-read）有効になっています。どちらが使われるかと、それぞれの版を書いてください。

■ 手順 3：外部の道具と設定
- veraPDF：plugin の pdf-verify には PDF_VERIFY_VERAPDF を渡していません。validate_conformance を engine: "auto" で 1 回呼び、authoritativeValidation（engine と reason）をそのまま書いてください
- trust anchor：PDF_VERIFY_TRUST_ANCHORS は未設定で、trust-anchors/ は空です。そのまま進め、「anchor 無し」の前提であることを報告書に書いてください
- フォント：plugin の pdf-writer には PDF_WRITER_FONT を渡していません。日本語で FONT_REQUIRED が返ったら、そのエラー文を記録してから fontPath に /Users/bonji/workspace/shuji-bonji/pdf-agent-stack/mcp/pdf-writer-mcp/NotoSansJP-Regular.otf を渡して続けてください
- PDF_SPEC_DIR：list_specs が返した件数と id の一覧を、そのまま書いてください（件数を推測で書かない）
- 検体：fixtures/incoming/ の 11 本の名前・バイト数・md5 を表にしてください。gazette-or-gov.pdf の md5 は 3fa16c47132a88dbdea774b445c881d7 が期待値です

■ 手順 4：スモークテスト
00-grok-build-setup.md の 4 件を、出力先を読み替えて回してください。

■ 手順 5：報告
reports/2026-11/SETUP.md に、手順 1〜4 の結果と、00-grok-build-setup.md の「SETUP 報告書に書く項目」を書いてください。ここで止まり、UC01 には進まないでください。
```

## UC ごとのプロンプト（UC01 から README の実行順で 1 本ずつ）

```text
instructions/UCnn-….md を実行してください。出力先は開始時の読み替え（reports/2026-11/ など）に従ってください。
報告書 reports/2026-11/UCnn.md には、00-report-template.md の項目に加えて次を書いてください。
1. 発火した Skill（pdf-read・pdf-trust・pdf-publish、同梱の pdf・docx など、名前で）。Skill を使わずに MCP を直接呼んだ場合はそう書く
2. pdf-specialist subagent に委譲したか。したなら、委譲した範囲と返ってきた内容の要点
3. 呼んだツールの順番と、各呼び出しの入力・出力の要点（verdict・firedRules・compliant・エラーコード）
4. 00-evaluation-criteria.md の 4 段階の評価と、境界違反の 6 項目それぞれの有無
推測で埋めず、呼べなかったものは「未実施」と理由を書いてください。
```

## 最後のセッションに貼るプロンプト

```text
reports/2026-11/UC01〜UC10.md を読み、reports/2026-11/SUMMARY.md を書いてください。
1. UC ごとの 4 段階の評価と境界違反の件数の表。2026-09 の reports/SUMMARY.md の同じ表と並べ、変わった UC にだけ理由を書く
2. 発火した Skill と subagent の委譲の一覧（UC × Skill）
3. 新しく見つけた問題。それぞれ「入力」「想定」「実際」を書く
文章で評価を上書きせず、報告書に書いてあることだけを使ってください。
```

## E4 で見ること

- E1〜E3 の所見のうち、ホストに左右されるもの（F-16 subagent・F-19〜F-22）が、Grok でも同じに出るか
- E3 の Claude では使えなかった pdf-specialist subagent（F-16）に、Grok では委譲できるか
- 2026-09 の評価から版が上がった後、UC ごとの評価がどう変わったか

## 結果

まだ回していません。
