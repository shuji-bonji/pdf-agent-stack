# E4：Mac・Grok Build

Grok Build に plugin で入れた MCP 4 本・Skill 3 本・pdf-specialist subagent で、UC01〜UC10 を回します。指示書と採点の物差しは、2026-09 の評価（[`hosts/grok-build/`](../../hosts/grok-build/)）と同じものを使います。回すのは shuji-bonji です。

## 回す前に手元で変えること

| # | 変えること | 理由 |
| --- | --- | --- |
| 1 | `~/.grok/config.toml` の `[mcp_servers.pdf-writer-dev]` を `enabled = false` にする | plugin の `pdf-writer` と同じ 20 ツールが 2 組になり、どちらの writer の結果か分からなくなるため |
| 2 | Grok Build を `eval/hosts/grok-build` で起動し、`grok inspect` の `Project Instructions` に `AGENTS.md` が出ることを確かめる | 2026-11-04 の `grok inspect` では CWD が `claude-plugins` で、`Project Instructions (None)` だった |

## 起動時に起きたこと（2026-11-04）

開始プロンプトを入れると、Grok Build が次のエラーを返しました。

```text
Request denied (403): Grok Build is not supported in Legacy (no storage).
Switch to Privacy Mode to use Grok Build. [WKE=privacy-mode:legacy]
```

Cursor の設定で、プライバシーの設定を「Privacy Mode (no training)」に切り替えると動きました（02:01 JST）。2026-09 の評価のときは、この切り替えなしで動いていました。

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

## 結果（2026-11-04 02:01〜17:30 JST）

報告書は [`reports/`](reports/) にあります（`SETUP.md`・`UC01.md`〜`UC10.md`・`SUPPLEMENT.md`・`SUBAGENT.md`・`SUMMARY.md`）。Grok が作業場 `/Users/bonji/pdf-agent-stack-eval/reports/2026-11/` に書いたものを、2026-11-04 17:37 JST に複製しました。作業場は `pdf-agent-stack` の外に置き、`AGENTS.md` だけを複製しました。指示書・`00-*.md`・`fixtures/incoming/` はキット側を読み取り専用で読んでいます。

### 環境

| 点 | 結果 |
| --- | --- |
| 起動した版 | reader 0.18.1・writer 0.23.1・verify 0.32.2・spec 0.11.0。npx のキャッシュと `npm view` も同じ |
| 登録 | reader・writer・verify は plugin、spec は `config.toml`。`pdf-writer-dev` は起動していない |
| Skill と subagent | pdf-read 0.2.3・pdf-trust 0.8.3・pdf-publish 0.7.1・pdf-specialist 0.7.0。`user/0de2cfe1/pdf-read` はインストールが無く、効いていない |
| veraPDF | PATH の `/opt/homebrew/bin/verapdf` を見つけて実行した（`performed: true`）。版の表示は 1.30.0（Homebrew の Cellar は 1.30.3） |
| trust anchor | 無し |
| フォント | plugin の writer には届かない（F-22）。`FONT_REQUIRED` を受けてから `fontPath` で回避した |

### UC ごとの結果

判定（`verdict`・`compliant`）は、2026-09 と重なる呼び出しのすべてで同じでした。4 段階の評価が変わった UC は 3 本ありますが、どれも判定は同じで、評価の付け方の違いです。

| UC | Skill | 判定（2026-09 との比較） | 4 段階の評価（2026-09 → 2026-11） | 境界違反 |
| --- | --- | --- | --- | --- |
| UC01 受入監査 | pdf-trust | 同じ（未署名の契約は `human_review_required`、署名付きの契約と官報は `use_with_caution`） | 実務で使える → 条件付きで使える | 0 |
| UC07 読み取り | pdf-read | 同じ。`summarize` の `next` が、2026-09 の空から「先に `search_text`」に変わった | 実務で使える → 同じ | 0 |
| UC02 納品 | pdf-publish | 同じ（PDF/A-3b 146/146、PDF/UA-1 106/106）。H1 は 2 つから 1 つになった（`drawTitle: false` を Grok が明示した場合） | 実務で使える → 同じ | 0 |
| UC03 PDF/A | pdf-publish・pdf-trust | PDF/A-3b・PDF/A-4f は適合。PDF/A-4 の依頼に `pdfa-4f` を選んだ。F-19 が再現した | 実務で使える → 同じ | 0 |
| UC04 PDF/UA | pdf-publish | 同じ（タグ付き 106/106、タグ無し 100/106）。F-20 が再現した | 実務で使える → 同じ | 0 |
| UC08 電帳法寄りの請求書 | pdf-publish | 同じ（PDF/A-3b 146/146）。法令の適合を述べていない | 実務で使える → 同じ | 0 |
| UC05 仕様調査 | なし（pdf-spec を直接） | 同じ。ヒット 0 件を「このコーパスは答えられない」と書いた（補足で測定） | 実務で使える → 同じ | 0 |
| UC06 一括監査 | pdf-trust | 2026-09 の 5 件と同じ判定。今回は 11 件を監査し、md5 が同じ検体は UC01 と同じ判定 | 実務で使える → 条件付きで使える | 0 |
| UC09 宣言と検証 | pdf-publish | 同じ（宣言は PDF/A-3b、veraPDF は 145/146 で非適合） | 実務で使える → 同じ | 0 |
| UC10 暗号化と未実施 | pdf-read（reader の手順） | 同じ（官報は `use_with_caution`、PDF/A は `ENCRYPTED_PDF` で未実施、writer は `SIGNED_PDF`） | 条件付きで使える → 実務で使える | 0 |

### E1〜E3 の所見の再確認

| 所見 | E4 の結果 |
| --- | --- |
| F-01〜F-04 | 4 件とも同じ（UC10 の補足で E2 の暗号化検体を使って確かめた） |
| F-16 subagent | **Grok では委譲できた。** `spawn_subagent` で pdf-specialist に委譲し、Trust Report の判定は親セッションの結果と一致した。委譲できないのは Claude 側だけ |
| F-17 署名の数 | 同じ（官報と `contract-like-signed.pdf`） |
| F-19 `ensure_pdfa`（-4f） | 同じ（UC03） |
| F-20 `ensure_tagged` | 同じ（UC04） |
| F-22 plugin の環境変数 | writer は同じ。spec は `config.toml` の登録を使ったので測っていない |

F-01〜F-04・F-17・F-19・F-20 は、Claude（E3）と Grok（E4）で同じ結果になりました。ホストに左右されないので、各リポジトリで直すものです。

### E4 で見つけた所見

FINDINGS の F-24〜F-28 です。F-24 と F-26 は、手元のビルドでも同じ応答になることを確かめました。

Grok の改善提案には、このほかに次のものがあります。振り分けのときに、FINDINGS に足すかどうかを決めます。

- verify の `evaluate_policy` の応答に、入力の `file_path` が無い（UC06。一括で並べて呼ぶと、どの応答がどのファイルのものか分からない）
- spec の `search_spec`・`get_requirements`・`get_section` で `spec` を省いたとき、どの spec を使ったかが応答に無い（UC05）
- writer の `ensure_pdfa` の `wasDeclared` が、「何かの pdfaid があった」のか「要求した flavour と同じ宣言があった」のかを分けていない（UC03）
- reader の `inspect_structure` が、添付の名前と `AFRelationship` を展開しない（UC08）
- writer の `ensure_pdfa`・`attach_file` のツールの説明文で、「電子帳簿保存法」と `pdfa-4f` が同じ話題として出てくる（UC08、文書）

### 指示の出し方で分かったこと

- 指示書の番号付きの手順に出てこず、データ準備の表にだけある検体は、Grok が扱わなかった（UC01 の `contract-like-signed.pdf`、UC07 の `scan-like.pdf`）。2026-09 との比較のため、補足の回で同じ呼び出しを足した（`SUPPLEMENT.md`）
- 起動時のプロンプトに「`authoritativeValidation` の `engine` と `reason`」と書いたが、実際の形は `engine` が最上位、`authoritativeValidation` は `performed`・`validator`・`path`・`version`。また、検体を指定しなかったため、最初の確認が暗号化された官報に当たり、veraPDF の有無を測れなかった。smoke.pdf で測り直した
- 4 段階の評価は、判定が同じでも、評価する側の付け方で変わる。版の比較には判定（`verdict`・`compliant`・`firedRules`）を使う

