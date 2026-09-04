/**
 * Reshape tools/list descriptions for the human tools reference.
 *
 * The servers write agent-facing manuals into `description` (how not to
 * overclaim). The generator still takes parameters from the schema; this
 * module strips the repeated scope preamble and Examples, hoists scope
 * once per page, and turns dense enum sentences into tables / lists.
 * Applied after translation so JA memory stays valid.
 */

function table(headers, rows) {
  const head = `| ${headers.join(' | ')} |`;
  const sep = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map((r) => `| ${r.join(' | ')} |`).join('\n');
  return `\n\n${head}\n${sep}\n${body}\n\n`;
}

function collapse(text) {
  return text.replace(/\n{3,}/g, '\n\n').trim();
}

function replace(text, pattern, repl) {
  const next = text.replace(pattern, repl);
  return next;
}

function stripExamples(text) {
  return text.replace(/\n+(?:Examples|例):\s*\n[\s\S]*$/, '').trim();
}

const SCOPE_EN =
  /Every report begins with a "scope" object[\s\S]*?same statement as "no violations" over the file's own table\./;
const SCOPE_JA =
  /どの報告も先頭に scope が付く。[\s\S]*?同じ文ではない。/;
const SCOPE_EXTRA_EN =
  /\s*For this tool it matters most:[\s\S]*?no other signatures\./;
const SCOPE_EXTRA_JA =
  /\s*このツールでは、これがいちばん問題になる:[\s\S]*?証明にならない。/;

function stripScope(returns, lang) {
  if (!returns) return { returns, extra: '' };
  let extra = '';
  const extraRe = lang === 'ja' ? SCOPE_EXTRA_JA : SCOPE_EXTRA_EN;
  const m = returns.match(extraRe);
  if (m) extra = m[0].trim();
  let next = returns.replace(extraRe, '');
  next = next.replace(lang === 'ja' ? SCOPE_JA : SCOPE_EN, '');
  return { returns: collapse(next), extra };
}

function fixLooseBullets(text) {
  return text.replace(/^[ \t]{2,}- /gm, '- ');
}

export function pageIntro(server, lang) {
  if (server !== 'pdf-verify') return '';
  if (lang === 'ja') {
    return [
      '::: info `scope` は判定ではない',
      'どの報告も先頭に `scope` が付きます。相互参照チェーンを最後まで歩けたか（`chainStop`）、相互参照表をこのツールが組み直したか（`reconstructed`）。`reconstructed: true` のとき、その表はこのツールが作ったものであって、ファイルが持っているものではありません。判定より先に読んでください。組み直した表の上での「違反なし」は、ファイル自身の表の上での「違反なし」と同じ文ではありません。',
      ':::',
      ''
    ].join('\n');
  }
  return [
    '::: info `scope` is not a verdict',
    'Every report begins with `scope`: whether the cross-reference chain could be walked to the end (`chainStop`), and whether this tool rebuilt the cross-reference table (`reconstructed`). When `reconstructed` is true, the table is this tool\'s reconstruction, not the one the file carries. Read it before the verdict — "no violations" over a rebuilt table is not the same statement as "no violations" over the file\'s own table.',
    ':::',
    ''
  ].join('\n');
}

export function humanizeParam(server, tool, name, desc, lang) {
  if (server === 'pdf-writer' && tool === 'ensure_pdfa' && name === 'flavour') {
    return lang === 'ja'
      ? '名乗らせる PDF/A。既定 `"pdfa-3b"`。上の flavour 表を参照。'
      : 'The PDF/A to claim. Default `"pdfa-3b"`. See the flavour table above.';
  }
  return desc;
}

export function humanizeTool(server, tool, lang, prose, returns) {
  let p = prose ?? '';
  let r = returns ?? '';
  if (server === 'pdf-verify') {
    const scoped = stripScope(r, lang);
    r = scoped.returns;
    r = stripExamples(r);
    p = fixLooseBullets(p);
    r = fixLooseBullets(r);
    ({ prose: p, returns: r } = reshapeVerify(tool, lang, p, r, scoped.extra));
  } else if (server === 'pdf-writer') {
    p = fixLooseBullets(p);
    ({ prose: p } = reshapeWriter(tool, lang, p));
  }
  return { prose: collapse(p), returns: collapse(r) };
}

function reshapeVerify(tool, lang, prose, returns, scopeExtra) {
  switch (tool) {
    case 'verify_signatures':
      return reshapeVerifySignatures(lang, prose, returns, scopeExtra);
    case 'verify_integrity':
      return reshapeVerifyIntegrity(lang, prose, returns);
    case 'detect_pades_level':
      return reshapeDetectPades(lang, prose, returns);
    case 'validate_conformance':
      return reshapeValidateConformance(lang, prose, returns);
    case 'validate_clauses':
      return reshapeValidateClauses(lang, prose, returns);
    case 'evaluate_policy':
      return reshapeEvaluatePolicy(lang, prose, returns);
    case 'identify_conformance':
      return { prose, returns };
    default:
      return { prose, returns };
  }
}

function reshapeVerifySignatures(lang, prose, returns, scopeExtra) {
  let p = prose;
  let r = returns;
  p = replace(
    p,
    /For each signature this tool: recomputes the ByteRange digest and compares it with the CMS messageDigest attribute, verifies the CMS\/PKCS#7 signature value against the signer certificate, verifies any RFC 3161 signature timestamp, evaluates the certificate chain against trust anchors, and checks revocation status\./,
    `For each signature this tool:

- recomputes the ByteRange digest and compares it with the CMS messageDigest attribute
- verifies the CMS/PKCS#7 signature value against the signer certificate
- verifies any RFC 3161 signature timestamp
- evaluates the certificate chain against trust anchors
- checks revocation status`
  );

  const fieldsEn = table(
    ['Field', 'Values', 'Meaning'],
    [
      ['`verdict`', '`valid` / `invalid` / `indeterminate`', 'Cryptographic match'],
      ['`trust.status`', '`trusted` / `untrusted` / `not_evaluated`', 'Certificate chain (path included). Without anchors: `not_evaluated`'],
      ['`revocation.status`', '`good` / `revoked` / `unknown` / `not_checked`', 'OCSP / CRL'],
      ['timestamp', '(verification result)', 'RFC 3161 signature timestamp']
    ]
  );
  const fieldsJa = table(
    ['フィールド', '値', '意味'],
    [
      ['`verdict`', '`valid` / `invalid` / `indeterminate`', '暗号計算の一致'],
      ['`trust.status`', '`trusted` / `untrusted` / `not_evaluated`', '証明書チェーン（パス付き）。アンカー無しは `not_evaluated`'],
      ['`revocation.status`', '`good` / `revoked` / `unknown` / `not_checked`', '失効確認（OCSP / CRL）'],
      ['署名タイムスタンプ', '（検証結果）', 'RFC 3161']
    ]
  );

  r = replace(
    r,
    /Per-signature verdict \('valid' \/ 'invalid' \/ 'indeterminate'\), trust status \('trusted' \/ 'untrusted' \/ 'not_evaluated' with certificate path\), revocation status \('good' \/ 'revoked' \/ 'unknown' \/ 'not_checked'\), and signature timestamp verification\./,
    `The three statuses are independent.\n\n${fieldsEn}`
  );
  r = replace(
    r,
    /署名ごとの判定（'valid' \/ 'invalid' \/ 'indeterminate'）、信頼状態（'trusted' \/ 'untrusted' \/ 'not_evaluated'・証明書パス付き）、失効状態（'good' \/ 'revoked' \/ 'unknown' \/ 'not_checked'）、署名タイムスタンプの検証結果。/,
    `3 つの状態は独立である。\n\n${fieldsJa}`
  );

  if (scopeExtra) {
    const note =
      lang === 'ja'
        ? '`scope.reconstructed` が true のとき、組み直しが届かなかった署名は一覧に出ない。短い一覧や空の一覧は「ファイルにほかの署名が無い」ことの証明にならない。'
        : 'When `scope.reconstructed` is true, a signature the rebuild did not reach is absent from the list. A short or empty list is not proof that the file carries no other signatures.';
    r = `${note}\n\n${r}`;
  }
  return { prose: p, returns: r };
}

function reshapeVerifyIntegrity(lang, prose, returns) {
  let p = prose;
  p = replace(
    p,
    /Reports: number of revisions \(incremental updates\), whether bytes were added after each signature's signed range, whether the last signature covers the entire file, DocMDP certification permissions and violations, and DSS presence\./,
    `Reports:

- number of revisions (incremental updates)
- whether bytes were added after each signature's signed range
- whether the last signature covers the entire file
- DocMDP certification permissions and violations
- DSS presence`
  );

  p = replace(
    p,
    /DocMDP is assessed against what the P value actually permits \(ISO 32000-2 Table 257\): P=1 permits nothing, P=2 form fill-in and signing, P=3 additionally annotation creation\/deletion\/modification\.\s*/,
    `DocMDP is assessed against what the P value actually permits (ISO 32000-2 Table 257).

${table(
  ['P', 'Permits'],
  [
    ['`1`', 'nothing'],
    ['`2`', 'form fill-in and signing'],
    ['`3`', 'additionally annotation creation / deletion / modification']
  ]
)}`
  );
  p = replace(
    p,
    /DocMDP は、P 値が実際に許可する範囲（ISO 32000-2 Table 257）に照らして評価する。P=1 は何も許可しない。P=2 はフォーム記入と署名まで。P=3 はさらに注釈の作成・削除・変更まで。\s*/,
    `DocMDP は、P 値が実際に許可する範囲（ISO 32000-2 Table 257）に照らして評価する。

${table(
  ['P', '許可する範囲'],
  [
    ['`1`', '何も許可しない'],
    ['`2`', 'フォーム記入と署名'],
    ['`3`', 'さらに注釈の作成・削除・変更']
  ]
)}`
  );

  p = replace(
    p,
    /violationAssessment is three-valued: "permitted" \/ "violated" \/ "indeterminate"\. \*\*"indeterminate" is not a pass\*\* — it means the chain could not be walked or a changed object's kind could not be read, so nothing could be disproved\.\s*/,
    `${table(
      ['`violationAssessment`', 'Meaning'],
      [
        ['`permitted`', 'later changes stay within what P allows'],
        ['`violated`', 'a later change exceeds what P allows'],
        ['`indeterminate`', 'not a pass — the chain could not be walked, or a changed object\'s kind could not be read, so nothing could be disproved']
      ]
    )}`
  );
  p = replace(
    p,
    /violationAssessment は "permitted" \/ "violated" \/ "indeterminate" の 3 値である。\*\*"indeterminate" は合格ではない\*\*。チェーンを歩けなかった、または変更されたオブジェクトの種類を読めなかった、つまり規格破りを見つけられていない（＝問題なし、ではない）ことを意味する。\s*/,
    `${table(
      ['`violationAssessment`', '意味'],
      [
        ['`permitted`', '後続の変更は P が許可する範囲内'],
        ['`violated`', '後続の変更が P の許可を超えた'],
        ['`indeterminate`', '合格ではない。チェーンを歩けなかった、または変更されたオブジェクトの種類を読めず、規格破りを見つけられていない（＝問題なし、ではない）']
      ]
    )}`
  );

  const chainEn = table(
    ['`revisionChain.status`', 'Meaning'],
    [
      ['`complete`', 'walked from the newest cross-reference section back to the original revision — only then does "not in the list" mean "that change was not made"'],
      ['`partial`', 'a list came back; `revisionChain.missing` names the absent end (`oldest` / `newest` / both)'],
      ['`unwalkable`', '`revisions` is `null` — "not determined", not "nothing changed"']
    ]
  );
  const chainJa = table(
    ['`revisionChain.status`', '意味'],
    [
      ['`complete`', '最新の相互参照節から元のリビジョンまで歩き切った。「一覧に無い = その変更は行われていない」と読めるのはこのときだけ'],
      ['`partial`', 'リストは返った。欠けている端は `revisionChain.missing`（`oldest` / `newest` / 両方）'],
      ['`unwalkable`', '`revisions` は `null`。「判定不能」であって「変更なし」ではない']
    ]
  );
  p = replace(
    p,
    /- A non-null revisions list is not necessarily the whole history\. revisionChain\.status says which it is: 'complete' \(walked from the newest cross-reference section back to the original revision\), 'partial' \(a list came back but revisionChain\.missing names the end that is absent\), or 'unwalkable' \(the case above\)\. revisionChain\.missing holds 'oldest' when the chain ended before the original revision, and 'newest' when the last startxref did not point at a parseable section so an older entry point was used and the last append is not listed; both can be absent at once\.\n/,
    `${chainEn}\n\n`
  );
  p = replace(
    p,
    /- revisions のリストが返ってきても、それが全履歴とは限らない。どちらなのかは revisionChain\.status が言う: 'complete'（最新の相互参照節から元のリビジョンまで歩き切った）\/ 'partial'（リストは返ったが、欠けている端を revisionChain\.missing が名指す）\/ 'unwalkable'（上記のケース）。revisionChain\.missing には、チェーンが元のリビジョンに届く前に終わったとき 'oldest' が入り、最後の startxref が解析できる相互参照節を指しておらず古い入口から入った（= 最後に追記されたものはリストに載っていない）とき 'newest' が入る。両端が同時に欠けることもある\n/,
    `${chainJa}\n\n`
  );

  const agrEn = table(
    ['`revisionCountAgreement.status`', 'Meaning'],
    [
      ['`agree`', '`revisionCount` matches the walked revisions'],
      ['`accounted`', 'the difference is explained (`linearised` and/or `chain-incomplete`)'],
      ['`unaccounted`', 'the file holds a startxref the walked chain does not reach — look at the file']
    ]
  );
  const agrJa = table(
    ['`revisionCountAgreement.status`', '意味'],
    [
      ['`agree`', '`revisionCount` と歩いたリビジョンが一致'],
      ['`accounted`', '食い違いは説明付き（`linearised` と `chain-incomplete` のいずれか、または両方）'],
      ['`unaccounted`', '歩いたチェーンが到達しない startxref がファイルにある — 実際に開いて見るべきケース']
    ]
  );
  p = replace(
    p,
    /- revisionCount counts "startxref" keywords; revisions lists the cross-reference sections the chain reached\. The two differ lawfully, so revisionCountAgreement says whether the difference is explained: 'agree', 'accounted' \(causes names 'linearised' and\/or 'chain-incomplete'\), or 'unaccounted' — the file holds a startxref the walked chain does not reach, which is the case worth looking at\./,
    `\`revisionCount\` counts "startxref" keywords; \`revisions\` lists the cross-reference sections the chain reached. The two differ lawfully.

${agrEn}`
  );
  p = replace(
    p,
    /- revisionCount は "startxref" キーワードの個数を数え、revisions はチェーンが到達した相互参照節を列挙する。2 つは合法に食い違うため、食い違いに説明が付いているかを revisionCountAgreement が言う: 'agree' \/ 'accounted'（causes が 'linearised' と 'chain-incomplete' のどちらか、または両方を名指す）\/ 'unaccounted' —— 歩いたチェーンが到達しない startxref がファイルにある、つまり実際に開いて見るべきケース/,
    `\`revisionCount\` は "startxref" キーワードの個数を数え、\`revisions\` はチェーンが到達した相互参照節を列挙する。2 つは合法に食い違う。

${agrJa}`
  );

  return { prose: p, returns };
}

function reshapeDetectPades(lang, prose, returns) {
  const levelsEn = table(
    ['Level', 'Structure (each row adds to the one above)'],
    [
      ['`B-B`', 'CAdES signature'],
      ['`B-T`', '+ RFC 3161 signature timestamp'],
      ['`B-LT`', '+ DSS with validation data'],
      ['`B-LTA`', '+ document timestamp']
    ]
  );
  const levelsJa = table(
    ['レベル', '構造（上の行に追加）'],
    [
      ['`B-B`', 'CAdES 署名'],
      ['`B-T`', '+ RFC 3161 署名タイムスタンプ'],
      ['`B-LT`', '+ 検証データ入り DSS'],
      ['`B-LTA`', '+ 文書タイムスタンプ']
    ]
  );
  let p = replace(
    prose,
    /Detection is structural: B-B \(CAdES signature\), B-T \(\+ RFC 3161 signature timestamp\), B-LT \(\+ DSS with validation data\), B-LTA \(\+ document timestamp\)\. Legacy adbe\.pkcs7\.detached signatures are reported as non-PAdES\./,
    `${levelsEn}\n\nLegacy \`adbe.pkcs7.detached\` signatures are reported as non-PAdES.`
  );
  p = replace(
    p,
    /構造から検出するレベル: B-B（CAdES 署名）→ B-T（\+ RFC 3161 署名タイムスタンプ）→ B-LT（\+ 検証データ入り DSS）→ B-LTA（\+ 文書タイムスタンプ）。旧式の adbe\.pkcs7\.detached 署名は非 PAdES として報告する。/,
    `${levelsJa}\n\n旧式の \`adbe.pkcs7.detached\` 署名は非 PAdES として報告する。`
  );
  return { prose: p, returns };
}

function reshapeValidateConformance(lang, prose, returns) {
  let p = prose;
  p = replace(
    p,
    /Hybrid engine: when veraPDF is installed \(PDF_VERIFY_VERAPDF env var or on PATH\) validation is delegated to it for an authoritative result\. Otherwise a built-in rule subset is checked natively:\n[ \t]*- PDF\/A \((\d+) rules\): ([^\n]+)\n[ \t]*- PDF\/UA \((\d+) rules\): ([^\n]+)/,
    (_m, aCount, aRules, uCount, uRules) =>
      `Hybrid engine: veraPDF when installed (\`PDF_VERIFY_VERAPDF\` or PATH) for an authoritative result; otherwise a built-in subset.

${table(
  ['Flavour', 'Native rules'],
  [
    [`PDF/A (${aCount})`, aRules],
    [`PDF/UA (${uCount})`, uRules]
  ]
)}`
  );
  p = replace(
    p,
    /ハイブリッドエンジン: veraPDF がインストールされていれば（PDF_VERIFY_VERAPDF 環境変数または PATH）検証を委譲し、権威ある結果を得る。無ければ内蔵ルールのサブセットをネイティブ検査する:\n[ \t]*- PDF\/A（(\d+) ルール）: ([^\n]+)\n[ \t]*- PDF\/UA（(\d+) ルール）: ([^\n]+)/,
    (_m, aCount, aRules, uCount, uRules) =>
      `ハイブリッドエンジン: veraPDF があれば（\`PDF_VERIFY_VERAPDF\` または PATH）委譲して権威ある結果を得る。無ければ内蔵ルールのサブセット。

${table(
  ['フレーバー', 'ネイティブルール'],
  [
    [`PDF/A（${aCount}）`, aRules],
    [`PDF/UA（${uCount}）`, uRules]
  ]
)}`
  );

  let r = returns;
  const compliantEn = table(
    ['Engine', '`compliant`'],
    [
      ['veraPDF', '`true` / `false`'],
      ['native', '`false` = a decisive violation; `null` = no violation in the checked subset (not certification)']
    ]
  );
  const compliantJa = table(
    ['エンジン', '`compliant`'],
    [
      ['veraPDF', '`true` / `false`'],
      ['native', '`false` = 決定的な違反あり。`null` = 検査したサブセット内で違反なし（認証ではない）']
    ]
  );
  const sevEn = table(
    ['PDF/UA native `severity`', 'Meaning'],
    [
      ['`error`', 'proves non-conformance'],
      ['`warning`', 'needs human review']
    ]
  );
  const sevJa = table(
    ['PDF/UA ネイティブ `severity`', '意味'],
    [
      ['`error`', '非準拠を証明できる'],
      ['`warning`', '人のレビューが要る']
    ]
  );

  r = replace(
    r,
    /Per-rule results with ISO clause references\. compliant is true\/false for veraPDF; for the native engine, false means definitive violations were found and null means "no violations in the checked subset" \(NOT certification\)\. PDF\/UA native violations carry a severity: only 'error' rules can prove non-conformance, 'warning' rules need human review\.\s*/,
    `Per-rule results with ISO clause references.

${compliantEn}

${sevEn}`
  );
  r = replace(
    r,
    /ISO 条文参照付きのルール別結果。compliant は veraPDF なら true\/false。ネイティブエンジンでは false = 決定的な違反あり、null = 「検査したサブセット内で違反なし」（認証では\*\*ない\*\*）。PDF\/UA のネイティブ違反は severity 付きで、'error' ルールだけが非準拠を証明でき、'warning' ルールは人のレビューが要る。\s*/,
    `ISO 条文参照付きのルール別結果。

${compliantJa}

${sevJa}`
  );
  return { prose: p, returns: r };
}

function reshapeValidateClauses(lang, prose, returns) {
  const statesEn = table(
    ['Status', 'Meaning'],
    [
      ['`pass`', 'nothing in this constraint could be disproved'],
      ['`fail`', 'disproved, with the fact and its measured value'],
      ['`not_applicable`', 'the clause does not apply to this document'],
      ['`needs_external_fact`', 'a fact outside the file was not supplied, so it was not decided (never defaulted to pass)']
    ]
  );
  const statesJa = table(
    ['状態', '意味'],
    [
      ['`pass`', 'この制約では規格破りは見つからなかった'],
      ['`fail`', '規格破りが見つかった。根拠として事実と実測値が付く'],
      ['`not_applicable`', '条文がこの文書に適用されない'],
      ['`needs_external_fact`', 'ファイル外の事実が与えられず決定しなかった（合格に既定しない）']
    ]
  );
  let r = replace(
    returns,
    /Per-constraint results with the clause IDs they come from\. Four states:\n- pass — nothing in this constraint could be disproved\n- fail — disproved, with the fact and its measured value as evidence\n- not_applicable — the clause does not apply to this document\n- needs_external_fact — a fact outside the file was not supplied, so the constraint was not decided \(never defaulted into a pass\)/,
    `Per-constraint results with the clause IDs they come from.

${statesEn}`
  );
  r = replace(
    r,
    /制約ごとの結果と、その出どころの条文 ID。4 状態:\n- pass —— この制約について、規格破りは見つからなかった\n- fail —— 規格破りが見つかった。根拠として事実と実測値が付く\n- not_applicable —— 条文がこの文書に適用されない\n- needs_external_fact —— ファイル外の事実が与えられず、制約を決定しなかった（合格に既定されることは決してない）/,
    `制約ごとの結果と、その出どころの条文 ID。

${statesJa}`
  );
  return { prose, returns: r };
}

function reshapeEvaluatePolicy(lang, prose, returns) {
  const verdictsEn = [
    '- `trust_and_use`',
    '- `use_with_caution`',
    '- `human_review_required`',
    '- `reject`'
  ].join('\n');
  const verdictsJa = verdictsEn;
  let p = replace(
    prose,
    /Produce a deterministic 4-value trust verdict \(trust_and_use \/ use_with_caution \/ human_review_required \/ reject\) for a PDF\./,
    `Produce a deterministic 4-value trust verdict for a PDF.

${verdictsEn}`
  );
  p = replace(
    p,
    /PDF に対する決定論的な 4 値信頼判定（trust_and_use \/ use_with_caution \/ human_review_required \/ reject）を下す。/,
    `PDF に対する決定論的な 4 値信頼判定を下す。

${verdictsJa}`
  );

  const fieldsEn = table(
    ['Field', 'Content'],
    [
      ['`verdict`', 'one of the four values above'],
      ['`firedRules`', 'rule IDs with per-rule verdict and reason'],
      ['`advisories`', 'recommendations that do not affect the verdict'],
      ['facts', 'underlying facts summary']
    ]
  );
  const fieldsJa = table(
    ['フィールド', '内容'],
    [
      ['`verdict`', '上の 4 値のいずれか'],
      ['`firedRules`', 'ルール ID とルール別の判定・理由'],
      ['`advisories`', '判定に影響しない推奨'],
      ['facts', '根拠となった事実の要約']
    ]
  );
  let r = replace(
    returns,
    /verdict, firedRules \(rule IDs with per-rule verdict and reason\), advisories \(recommendations that do not affect the verdict\), and the underlying facts summary\./,
    fieldsEn
  );
  r = replace(
    r,
    /verdict、firedRules（ルール ID とルール別の判定・理由）、advisories（判定に影響しない推奨）、根拠となった事実の要約。/,
    fieldsJa
  );
  return { prose: p, returns: r };
}

function reshapeWriter(tool, lang, prose) {
  if (tool === 'ensure_pdfa') return { prose: reshapeEnsurePdfa(lang, prose) };
  return { prose };
}

function reshapeEnsurePdfa(lang, prose) {
  const flavoursEn = table(
    ['`flavour`', 'What it claims'],
    [
      ['`pdfa-3b`', 'Default. PDF 1.7 basis'],
      ['`pdfa-4`', 'PDF 2.0. Every attachment must itself be PDF/A'],
      ['`pdfa-4f`', 'PDF 2.0 with non-PDF/A attachments (CSV / JSON)']
    ]
  );
  const flavoursJa = table(
    ['`flavour`', '名乗らせる内容'],
    [
      ['`pdfa-3b`', '既定。PDF 1.7 基盤'],
      ['`pdfa-4`', 'PDF 2.0。添付ファイル自身が PDF/A であること'],
      ['`pdfa-4f`', 'PDF 2.0。CSV / JSON などの非 PDF/A 添付向け']
    ]
  );

  if (lang === 'en') {
    const wall =
      /Put an existing PDF onto the PDF\/A "vessel"[\s\S]*rewriting it would break the signatures\)\./;
    if (!wall.test(prose)) {
      return replace(
        prose,
        /Choose the flavour: "pdfa-3b" \(default\) \/ "pdfa-4" \/ "pdfa-4f"\./,
        `\n\n${flavoursEn}\n`
      );
    }
    return prose.replace(
      wall,
      `Put an existing PDF onto the PDF/A "vessel" (the PDF/A counterpart of \`ensure_tagged\`). Supplies only missing document-level requirements:

- trailer \`/ID\` (ISO 32000-1 14.4)
- sRGB OutputIntent (GTS_PDFA1; an ICC profile is generated and embedded)
- XMP pdfaid
- **-4 flavours additionally** set the header to PDF 2.0 and delete the Info dictionary (−4 forbids Info unless the catalog has \`/PieceInfo\` — stricter than ISO 32000-2 §14.3.3)

Content, structure tree and fonts are never touched.

${flavoursEn}

This is preparation for claiming PDF/A, not a guarantee of conformance. Unembedded fonts, encryption, JavaScript and LZW are not repaired. Writing pdfaid is the document claiming "I am PDF/A"; applied to a non-conforming file it produces a PDF that lies about itself (a warning is always returned). Measure with pdf-verify-mcp \`validate_conformance\` (same flavour). The verdict is veraPDF's.

- Apply **after** \`attach_file\` in the e-bookkeeping-law context
- Signed PDFs: \`preserveSignatures: true\` (approval signatures only; certification refused)
- \`-4\` × \`preserveSignatures\` is refused unless the input is already PDF 2.0`
    );
  }

  return replace(
    prose,
    /flavour で "pdfa-3b"（既定）\/ "pdfa-4" \/ "pdfa-4f" を選ぶ。/,
    `\n\n${flavoursJa}`
  );
}


