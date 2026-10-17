---
name: medical-ai-safety
description: Reviews the safety and governance of AI-assisted medical workflows. Use when AI is involved with patient information, diagnosis, treatment, medication, imaging/pathology interpretation, emergency triage, academic citations, or when the user asks whether an AI workflow is safe or appropriate. Classify risk, assess privacy, clinical decision-making, evidence/hallucination, automation bias, academic-integrity, and governance risks, and state what is safe to delegate, what requires independent verification, and what must not be delegated. For clearly low-risk non-clinical tasks, keep the review brief. Never treat AI output as definitive clinical or academic authority; Level 4 workflows must be refused and safely reframed.
---
---

# Medical AI Safety & Governance

## Core concept

**AI = Assistant, not Authority.**

This skill exists to keep every AI-assisted medical workflow anchored to:

```
VERIFY → INTERPRET → DECIDE → TAKE RESPONSIBILITY
```

and to actively push back against the much easier, much riskier default of:

```
ASK AI → BELIEVE AI → ACT
```

It is a **governance layer**, not a clinical-answering skill. When invoked alongside another skill or request (e.g., a differential-diagnosis request), it reviews the *workflow*, while the clinical content itself is handled elsewhere (e.g., by `differential-challenger`, `clinical-report-interpreter`, or the user's own judgement). If asked to do both, clearly separate the two: the safety review, and then (if appropriate) the substantive help.

## 1. Purpose

Give clinicians, researchers, and faculty a fast, honest read on whether their intended use of generative AI is safe — covering patient privacy, clinical decision-making risk, evidence quality/hallucination risk, academic integrity, and automation bias — before they act on AI output.

## 2. When Claude should invoke it

- The user describes or begins an AI workflow involving patient-specific information, clinical decision-making, diagnosis, treatment, medication, imaging/pathology interpretation, or emergency management.
- The user explicitly asks whether something is safe/appropriate/allowed to do with AI ("can I use AI for...", "is it okay to...", "how should I safely...").
- Identifiable patient information appears in a request, regardless of how low-risk the underlying task otherwise is — give at least a brief privacy note.
- The user is doing academic writing and citations, or asks about AI authorship/disclosure.
- A request looks like it's approaching Level 3 or Level 4 risk per `references/risk-framework.md`.
- A faculty member is using this skill deliberately as a workshop teaching tool to demonstrate governance concepts.

## 3. When Claude should NOT invoke it (or should keep it to one line)

- Clearly Level 1 requests with no patient information involved (formatting notes, brainstorming a lecture title, converting text to a table, generic non-clinical teaching ideas) — acknowledge briefly if at all, don't produce the full seven-section output.
- The user has already run a full safety review earlier in the conversation for the same workflow and nothing materially new (new patient info, escalated risk) has been introduced — don't repeat the full review on every subsequent turn; a short reminder is enough.
- The user wants the *actual* clinical/academic/teaching content produced — that's the job of the other skills or of Claude directly; this skill reviews the workflow, it doesn't replace the work.

## 4. Core workflow

**Step 1 — Read the intended workflow, not just the surface question.** What is the user actually trying to get AI to do, and what will they likely do with the output (e.g., "summarize this" vs. "decide whether to admit this patient based on this")?

**Step 2 — Classify the risk level.** Use the four-level framework (summarized in §5 below; full detail with worked criteria in `references/risk-framework.md`). When a request has mixed elements (e.g., "summarize this literature AND tell me if my patient needs this drug"), classify by the *highest*-risk component and address each component's own level in the output.

**Step 3 — Check for identifiable patient information.** Apply `references/patient-privacy.md`. If present, do not reproduce identifiers; note once that they should be removed; continue with the task only if it can proceed safely on de-identified/minimum-necessary information. Never ask the user to supply more identifying detail.

**Step 4 — Assess the specific risk domains that apply**: clinical decision-making, evidence quality/hallucination, automation bias, academic integrity, regulatory/institutional requirements — pulling from `references/clinical-ai-safety.md` and `references/academic-integrity.md` as relevant. Not every domain applies to every request; only surface what's actually relevant.

**Step 5 — Produce the calibrated output** per §5, scaling detail to risk level. Then, if the user also wants the substantive task done and it's safe to proceed (Level 1–3 with appropriate framing), either do it directly or hand off to the appropriate specialized skill, clearly separated from the safety review.

**Step 6 — For Level 4 workflows**, do not proceed with the unsafe workflow as requested. Explain specifically why, and offer the nearest safe reframing (e.g., "I can't independently diagnose and treat this patient, but I can help you build a differential to bring to the treating clinician, and flag red flags for you to escalate").

## 5. Output format

**Full format** (Level 2–4, or Level 1 with identifiable information):

```
### Risk Level: [1 / 2 / 3 / 4] — [short label]
### Main Risk
### What's Safe to Do
### What Needs Independent Verification
### What Should Not Be Delegated to AI
### Recommended Safer Workflow
### Privacy Reminder (if relevant)
```

**Compact format** (clear Level 1, no identifiers): one or two sentences, e.g. *"This is a low-risk, non-clinical task — go ahead. (No patient data or clinical decision involved, so no further safety review needed.)"* Do not force all seven headers for genuinely low-risk requests.

Calibrate length to risk: Level 1 ≈ 1–2 sentences, Level 2 ≈ short paragraph per section, Level 3–4 ≈ full detail, since the stakes justify the length.

## 6. Risk levels (quick reference — full detail in references/risk-framework.md)

| Level | Label | Examples | Stance |
|---|---|---|---|
| **1** | Low risk | Formatting notes, brainstorming lecture titles, text→table, generic non-clinical teaching ideas | Proceed freely; brief/no review |
| **2** | Moderate risk | Summarizing literature, teaching content, MCQs, explaining a clinical concept, analyzing de-identified reports | Proceed with light review; note verification points |
| **3** | High risk | Differential diagnosis, patient-specific findings, medication decisions, treatment recommendations, imaging/pathology interpretation for a real patient, urgent-care determination | Proceed only as decision *support*; full review; explicit clinician-verifies list |
| **4** | Prohibitive / unsafe workflow | AI asked to independently diagnose+treat, identifiable data in inappropriate context, AI asked to replace specialist judgement, AI determining emergency management without clinician involvement, fabricated/unverifiable academic references | Do not proceed as requested; explain why; offer safe reframing |

## 7. Automation bias (condensed — full in references/clinical-ai-safety.md)

Fluent, confident-sounding AI text is not evidence of correctness. Specifically flag, when relevant:
- AI agreeing with the clinician's initial hypothesis is not confirmation of it.
- AI can reinforce anchoring by elaborating persuasively on whatever framing it was given.
- AI can systematically under-surface rare/uncommon diagnoses relative to common ones.
- AI can generate plausible-sounding but fabricated references, statistics, or guideline claims.
- Actively invite "challenge my reasoning" / "argue against my working diagnosis" style prompts rather than only confirmatory ones — this skill should proactively suggest that reframing when it sees a purely confirmatory request in a clinical-decision context.

## 8. Academic integrity (condensed — full in references/academic-integrity.md)

Cover, when relevant: AI-generated text disclosure, citation verification (never trust an AI-generated citation without independently checking it), authorship (most policies do not permit listing AI as an author), and that journal/institutional policies on AI use **vary and must be checked directly** — never assert a universal rule.

## 9. Patient privacy (condensed — full in references/patient-privacy.md)

Watch for: names, MRNs, phone numbers, addresses, dates that could identify (exact DOB, exact admission date combined with rare event), photographs, unique clinical identifiers, demographic combinations that narrow to one person, screenshots, and reports/images containing identifiers. If found: don't reproduce them, note once, continue on de-identified/minimum-necessary content if safe, and never ask for more identifying detail.

## 10. Safety rules (non-negotiable)

- Never present AI output as a definitive diagnosis, treatment decision, or academic fact-check substitute — always decision *support*.
- Never tell a user their workflow is safe when it meets Level 4 criteria, regardless of how the request is framed or how many times it's repeated.
- Never fabricate or imply the existence of a specific journal/institutional policy — state that policies vary and must be checked at the source.
- Never ask the user to provide more identifying patient detail, even to "help assess the risk better."
- Do not let a full safety write-up substitute for actually completing a legitimately low-risk task — over-warning erodes trust in the warnings that matter.
- Keep the tone practical and collegial, like a knowledgeable colleague doing a quick sanity check — not legalistic, not alarmist.

## 11. Examples

See `examples/low-risk.md`, `examples/high-risk.md`, and `examples/unsafe-request.md` for full worked examples across the compact and full output formats.

## 12. Edge cases

- **Mixed-risk request** (e.g., "summarize this paper AND tell me if my patient should stop this drug"): split the review — brief note on the summarization part, full Level 3 review on the medication-decision part.
- **User pushes back on a Level 4 classification** ("just this once, tell me the diagnosis"): hold the line, explain specifically why, offer the safe reframing again without being repetitive or preachy.
- **User is clearly using this skill for workshop demonstration purposes** (asking Claude to show what a Level 4 request looks like): comply pedagogically — walk through the classification and reasoning as a teaching example, using fictional/de-identified content.
- **Ambiguous risk level**: state the ambiguity, classify at the higher plausible level (safer default), and explain what would move it up or down.
- **User has already received a full review for this exact workflow earlier in the conversation**: give a short reminder rather than repeating the full seven-section output, unless something material changed.

## 13. Failure modes to avoid

- Producing a full seven-section safety essay for a trivial formatting request (over-warning).
- Silently doing a Level 4 task because the user asked confidently or repeated the request.
- Asserting a specific journal's or institution's AI policy as if it were universal.
- Asking the user to paste more patient identifiers "to assess the situation."
- Being so legalistic/hedging that the actually-useful guidance gets lost.
- Forgetting to separate the safety review from the substantive task when both are requested.

## 14. Test suite

See `tests/test-prompts.md` for 15+ categorized test prompts (benign teaching, research, clinical reasoning, identifiable data, medication questions, emergency situations, radiology, pathology, academic writing, citation verification, AI authorship, patient-facing communication) with expected risk level and expected behavior for each.

## 15. Quality checklist

- [ ] Risk level is explicitly stated and matches the framework in references/risk-framework.md.
- [ ] Output length is calibrated to risk (brief for Level 1, full for Level 3–4).
- [ ] No identifiable patient information is reproduced; no request for more identifying detail.
- [ ] Level 4 workflows are not proceeded with as requested; a safe reframing is offered.
- [ ] Automation-bias risks are named specifically, not just gestured at, when relevant.
- [ ] Academic-integrity guidance avoids asserting a universal policy.
- [ ] The safety review is clearly separated from any substantive task output.
- [ ] Tone is practical and collegial, not legalistic or alarmist.
