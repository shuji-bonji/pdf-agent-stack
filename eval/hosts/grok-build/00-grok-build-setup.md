# 00 — Grok Build 環境構築

Grok Build が PDF Agent Stack を呼び出せる状態にする手順です。このファイルを最初のセッションで実行してください。

## セッション開始プロンプト（このブロックを貼る）

```text
この作業場は PDF Agent Stack の実機評価用です。AGENTS.md と 00-grok-build-setup.md を読んで環境を整えてください。

やること:
1. Node.js と npx の有無を確認する
2. fixtures / out / reports ディレクトリを作る
3. MCP 4 本が npx で起動できるか、各 1 ツールで確認する
4. veraPDF・日本語フォント・PDF_SPEC_DIR の有無を記録する（無くても止めない。足りない機能は未実施にする）
5. reports/SETUP.md に環境インベントリを書く

製品コードは変更しないでください。
```

## 作業場の形

```text
pdf-agent-stack-eval/
  AGENTS.md
  00-grok-build-setup.md
  00-evaluation-criteria.md
  00-report-template.md
  instructions/
  fixtures/
    incoming/          # 受領想定
    generated/         # writer が作った途中成果
  out/                 # 納品想定
  reports/
  fonts/               # 利用者が置いた .otf / .ttf（任意）
  specs/               # PDF_SPEC_DIR（任意。再配布しない）
  trust-anchors/       # PEM（任意）
```

## MCP 登録

Grok Build の MCP 設定に、次を登録します。パスとコマンドはホストの流儀に合わせてください。フィールド名はホストの設定ファイルに従います。

### pdf-reader（必須・最初に入れる）

```jsonc
{
  "pdf-reader": {
    "command": "npx",
    "args": ["-y", "@shuji-bonji/pdf-reader-mcp@latest"]
  }
}
```

環境変数は不要です。

### pdf-verify（受入・納品・PDF/A・PDF/UA で必須）

```jsonc
{
  "pdf-verify": {
    "command": "npx",
    "args": ["-y", "@shuji-bonji/pdf-verify-mcp@latest"],
    "env": {
      "PDF_VERIFY_VERAPDF": "/usr/local/bin/verapdf",
      "PDF_VERIFY_TRUST_ANCHORS": "/absolute/path/to/trust-anchors"
    }
  }
}
```

`PDF_VERIFY_VERAPDF` が無い場合、`validate_conformance` は内蔵ルールに落ちます。そのときは `engine` が `verapdf` にならないことを報告書に書いてください。内蔵の `compliant: null` は適合ではありません。

推奨版は v0.21.0 以上です。v0.21.0 で `verify_signatures` / `detect_pades_level` の JSON 最上位が配列から辞書に変わっています。

### pdf-writer（納品系で必須）

```jsonc
{
  "pdf-writer": {
    "command": "npx",
    "args": ["-y", "@shuji-bonji/pdf-writer-mcp@latest"],
    "env": {
      "PDF_WRITER_FONT": "/absolute/path/to/NotoSansJP-Regular.otf"
    }
  }
}
```

`.ttc` は使えません。日本語を書くのにフォントが無いと `FONT_REQUIRED` が返ります。UC02 では、このエラーから `fontPath` を付けて復帰できるかも測ります。

### pdf-spec（UC05 で必須）

```jsonc
{
  "pdf-spec": {
    "command": "npx",
    "args": ["-y", "@shuji-bonji/pdf-spec-mcp@latest"],
    "env": {
      "PDF_SPEC_DIR": "/absolute/path/to/specs"
    }
  }
}
```

規格 PDF は正規ルートで利用者が入手します。キット同梱しません。コーパスが空なら UC05 は「未実施」とし、`list_specs` のエラー文だけ残してください。

入手先の案内はサイトの導入手順にあります。https://shuji-bonji.github.io/pdf-agent-stack/ja/guide/getting-started

## Skill の置き方

Skill 本体は次のリポジトリです。クローンして Grok Build が読む Skill ディレクトリに置きます。

| Skill | リポジトリ | 役割 |
| --- | --- | --- |
| pdf-trust | https://github.com/shuji-bonji/pdf-trust-skill | 受入監査の編成。Trust Report |
| pdf-publish | https://github.com/shuji-bonji/pdf-publish-skill | 納品の編成。Publish Report |
| pdf-read | https://github.com/shuji-bonji/pdf-read-skill | 読み取りの編成。Read Report |

Grok Build の Skill 探索パスはホストの版で変わります。`grok inspect` が使えるなら、スキルと MCP の発見結果を `reports/SETUP.md` に貼ってください。

Skill が読めない場合でも MCP は直接呼べます。そのときは「Lv1（MCP のみ）」と明記し、レポートの型が崩れたかどうかを所見にします。

## スモークテスト

各サーバー 1 ツールだけ呼びます。失敗しても次のサーバーへ進み、結果を表にします。

| サーバー | 入力 | 成功の目安 |
| --- | --- | --- |
| pdf-reader | 自分で作った 1 ページ PDF に `get_page_count` | `pageCount` が 1 |
| pdf-writer | `create_text_pdf` で `"Hello 日本語"` を `fixtures/generated/smoke.pdf` | ファイルができる。日本語はフォント次第 |
| pdf-verify | 同じファイルに `identify_conformance` | JSON が返る。宣言が無くても応答があれば成功 |
| pdf-spec | `list_specs` | コーパスがあれば一覧。無ければエラー文を記録 |

## 検体の用意

サイト e2e の標本パスは各パッケージの `docs/specimens/` です。クローンできる場合は読み取り専用で参照して構いません。クローンできない場合は、指示書の「データ準備」に従って writer で作ります。

使ってよい公開検体の例:

- 自作ダミー請求書・契約書・議事録（実在の取引先名を使わない）
- インターネット官報の公開 PDF（利用条件を守り、再配布しない。評価作業場のローカルに置く）

官報 PDF はこのキットに同梱していません。UC01 / UC06 / UC10 で使う `fixtures/incoming/gazette-or-gov.pdf` と `batch-gov.pdf` は、次の 1 件を各自で取得して置きます。サイト実測と同じ検体です。

| 項目 | 値 |
| --- | --- |
| 号 | 令和 8 年 8 月 10 日 本紙 第 1765 号 1 ページ |
| 入手先 | https://www.kanpo.go.jp/20260810/20260810h01765/20260810h017650001f.html |
| PDF | https://www.kanpo.go.jp/20260810/20260810h01765/pdf/20260810h017650001.pdf |
| md5 | `3fa16c47132a88dbdea774b445c881d7`（139,503 バイト） |

```bash
curl -o fixtures/incoming/gazette-or-gov.pdf \
  https://www.kanpo.go.jp/20260810/20260810h01765/pdf/20260810h017650001.pdf
cp fixtures/incoming/gazette-or-gov.pdf fixtures/incoming/batch-gov.pdf
```

md5 が違う場合は、公開側で差し替わった可能性があります。報告書にその md5 を書き、サイト実測との差は所見にします。

使ってはいけないもの:

- 本番の契約・請求・診療文書
- 規格原文の再配布
- 個人が特定できるスキャン

## SETUP 報告書に書く項目

1. ホスト（OS、Node 版、`npx` の有無）
2. 各 npm パッケージの実測版（`npm view @shuji-bonji/pdf-*-mcp version`）
3. veraPDF のパスと版
4. `PDF_WRITER_FONT` の有無とフォントファイル名
5. `PDF_SPEC_DIR` の有無と `list_specs` の結果要約
6. Skill 3 本の配置場所と、Grok Build が発見したか
7. スモーク 4 件の入力と出力
8. このホストでは測れない項目の一覧
