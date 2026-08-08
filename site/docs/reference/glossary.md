---
description: Glossary — declaration vs conformance vs validation, PAdES, LTV, trust anchors, veraPDF, the 4-value verdict
---

# Glossary

| Term | Definition |
|---|---|
| Declaration | pdfaid / pdfuaid in XMP. The document's claim about itself. Proves nothing |
| Conformance | Cannot be proved — only disproved |
| Validation | Valid only within the rules a validator actually implements |
| PAdES | Long-term signature profiles for PDF (ETSI EN 319 142). B-B / B-T / B-LT / B-LTA |
| LTV | Long-Term Validation. Stores revocation data etc. inside the document so it can be verified long after signing |
| Trust anchor | The certificate a signer's chain is evaluated against |
| veraPDF | The open-source PDF/A / PDF/UA validator the family delegates verdicts to |
| 4-value verdict | evaluate_policy's verdict: trust_and_use / use_with_caution / human_review_required / reject |
