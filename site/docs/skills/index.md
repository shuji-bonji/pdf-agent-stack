---
description: The three Skills that orchestrate PDF Agent Stack — pdf-trust at the intake gate, pdf-publish at the exit gate, and pdf-read for the most frequent job of all, reading
---

# Skills

Where the MCPs own deterministic computation and cryptography, the Skills own procedure, knowledge and orchestration. The judge is code, the narrative is the LLM — that division of labour is the design principle of PDF Agent Stack.

```mermaid
graph LR
  IN[/"Incoming PDF"/] --> TRUST{{"pdf-trust<br>intake gate"}} --> USE(["use / archive"])
  MAKE[/"PDF to produce"/] --> PUBLISH{{"pdf-publish<br>exit gate"}} --> OUT(["delivery"])
  DOC[/"PDF to read"/] --> READ{{"pdf-read<br>reading pipeline"}} --> ANS(["content + Read Report"])
```

| Skill | Role | Required MCPs |
|---|---|---|
| [pdf-trust](/skills/pdf-trust) | Orchestrates the incoming audit and returns a Trust Report | pdf-verify **required** (v0.7.0+, **v0.21.0+ recommended**) / reader, spec and houki-* optional |
| [pdf-publish](/skills/pdf-publish) | The write → read-back → verify delivery pipeline | pdf-writer / pdf-reader / pdf-verify |
| [pdf-read](/skills/pdf-read) | Pulls what you need out of large or unreadable PDFs, and reports what could not be read | pdf-reader **required** (v0.14.0+ recommended) / spec optional |
