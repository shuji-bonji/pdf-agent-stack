# reader v0.12.0 / pdf-read-skill 公開に伴う追随（2026-08-23）

4 リポジトリぶんの修正をブランチで搬入済み。中身と残作業。

## 1. pdf-read-skill — `feat/claude-plugin`

`.claude-plugin/plugin.json` を追加（v0.1.0・dependencies: pdf-reader-mcp）。
pdf-trust-skill / pdf-publish-skill と同じ形。

```bash
cd pdf-agent-stack/skill/pdf-read-skill
git merge --ff-only feat/claude-plugin && git push origin main
```

## 2. pdf-specialist-plugin — `feat/pdf-read-route`（2 コミット）

第 4 経路（読み取り・抽出 = pdf-read への委譲）+ v0.7.0
（dependencies に pdf-read 追加・依存 6 → 7・README 英日更新）。

```bash
cd pdf-agent-stack/agent/pdf-specialist-plugin
git merge --ff-only feat/pdf-read-route && git push origin main
# タグ運用があれば v0.7.0
```

## 3. claude-plugins — `feat/pdf-read-and-reader-0.12.0`

marketplace.json 0.2.2 → **0.3.0**:
- **pdf-read 新規**（pdf カテゴリ・v0.1.0・deps: pdf-reader-mcp）
- pdf-reader-mcp 0.11.2 → **0.12.0**（説明に抽出可能性 4 状態・
  image content block・render_page・next を反映）
- pdf-specialist 0.6.1 → **0.7.0**（deps + 説明）
- README 英日: 一覧表の pdf 行を実測に更新（trust 0.7.0 /
  verify 0.17.0 を含む — **表が公開版から遅れていた**）・
  mermaid に pdf-read・install 例に読み取りパイプライン追加

```bash
cd workspace/shuji-bonji/claude-plugins
git merge --ff-only feat/pdf-read-and-reader-0.12.0 && git push origin main
```

⚠️ 順序: **1（pdf-read-skill の plugin.json）を push してから 3 を push** —
marketplace が参照する repo に .claude-plugin が無いと install が落ちる。
2 → 3 も同順（marketplace の specialist 0.7.0 は repo の 0.7.0 を指す）。

## 4. pdf-agent-stack — `feat/pdf-read-skill`

- REGISTRY に pdf-read-skill（stack.json / README 表は**未再生成** —
  ローカルの clone と npm が要るため）
- site: skills/pdf-read 新設（英日）・index / overview / config の
  「2 Skill」→「3 Skill」・sidebar 追加。vitepress build 通過確認済み
- reference/mcp/* は触っていない（手元の 0.12.0 再生成分と衝突しない）

```bash
cd workspace/shuji-bonji/pdf-agent-stack
git merge feat/pdf-read-skill        # 手元の再生成分と合流
node scripts/generate-stack.mjs      # stack.json + README 表を再生成
cd site && npm run build             # reference 再生成込み
git add -A && git commit && git push
```

## 検証のポイント

- marketplace push 後: `/plugin marketplace update shuji-bonji` →
  `/plugin install pdf-read@shuji-bonji` で reader 0.12.0 が
  連れて入るか
- stack.json 再生成後: pdf-read-skill の行に local.version 0.1.0 が
  出るか（plugin.json から拾う実装は generate-stack.mjs にあり）
