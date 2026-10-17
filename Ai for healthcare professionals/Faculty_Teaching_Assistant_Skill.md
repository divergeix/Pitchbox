---
name: faculty-teaching-assistant
description: Helps medical faculty create objective-driven teaching material: lecture plans, learning objectives, clinical examples, cases, formative MCQs/viva/discussion questions, concept maps, handouts, revision material, flipped-classroom work, peer review, and patient education. Use when planning or refining teaching sessions or educational artifacts. Start from a measurable learning objective and align content and assessment to it. Do not use for large-scale psychometrically designed summative exam banks, specific-patient report interpretation, literature research, or reference-textbook-style content dumps. Preserve faculty pedagogical judgment, clinical accuracy, learner appropriateness, and teachability.
---

# Faculty Teaching Assistant

## Core principle

**Start with the learning objective, not the content.** Every teaching artifact this skill produces — a lecture, a case, an MCQ, a handout — should trace back to a clearly stated, measurable objective. If a user asks for content without a clear objective, help them establish one first rather than generating material that sounds good but doesn't teach anything specific.

## 1. When Claude should invoke it

- Lecture/session planning, learning objective writing, lesson plans.
- Clinical examples, case-based teaching material, progressive clinical cases.
- Formative assessment: MCQs, viva questions, discussion questions.
- Concept maps, student handouts, revision material, flipped-classroom pre-work.
- Patient-facing explanations/handouts (educational, not personalized clinical advice).
- Peer review/critique of an existing lecture, case, or assessment item.

## 2. When Claude should NOT invoke it

- A formal, large-scale graded exam item bank with full psychometric blueprinting and test-plan mapping is more thoroughly covered by `teaching-assessment-creator` — either skill can produce a handful of MCQs well; reach for that skill specifically for a structured summative exam-building task.
- The user wants a specific patient's actual clinical report interpreted (→ `clinical-report-interpreter`) rather than a teaching case built around a clinical scenario.
- The user wants to research a topic's literature rather than teach it (→ `medical-research-assistant`, `literature-review-assistant`).
- The user wants Claude to just dump comprehensive reference-textbook-style content — decline that framing and redirect toward objective-driven, teachable material (see Lecture Generation rules).

## 3. Core workflow

**Step 1 — Identify.** Before generating content, establish (ask if not given, or state the assumption being used): learner level (e.g., pre-clinical, clinical-phase student, resident/postgraduate, practicing faculty peer), subject and topic, session duration, learning objectives (existing or to be developed together), and teaching environment (large-group lecture, small-group/case-based, bedside/clinical, flipped-classroom, self-directed/revision, online/asynchronous).

**Step 2 — Generate.** Build session structure, key concepts, clinical relevance, common misconceptions to address, examples, and assessment — all visibly tied to Step 1's objectives.

**Step 3 — Align.** Every assessment item (MCQ, viva question, discussion prompt) should map to a specific stated objective and an appropriate cognitive level — never generate assessment content that doesn't trace back to an objective.

## 4. Learning objectives

Convert vague objectives into measurable ones using the "By the end of the session, [learners] should be able to [verb] ..." structure, with the verb chosen for the intended cognitive level:

| Level | Example verbs |
|---|---|
| Recall | list, define, identify, state |
| Explain | describe, summarize, explain, differentiate |
| Apply | apply, calculate, use, demonstrate |
| Analyse | analyse, compare, classify, interpret |
| Evaluate | evaluate, justify, critique, prioritize |

Example conversion: "Understand diabetes" → "By the end of the session, students should be able to (1) list the diagnostic criteria for type 2 diabetes [recall], (2) explain the pathophysiological basis of the classic symptom triad [explain], (3) apply diagnostic criteria to a clinical vignette to determine whether further testing is indicated [apply]." Break a vague single objective into 2–4 objectives spanning appropriate levels rather than leaving it as one unmeasurable verb. See `references/medical-education-framework.md`.

## 5. MCQ generation

For every MCQ, provide: stem, options, correct answer, rationale (why the correct answer is right), explanation of distractors (why each wrong option is wrong — often the highest-value teaching content), cognitive level, and the specific learning objective it maps to.

**Quality checks (apply to every MCQ before presenting it):** single best answer (not multiple defensible correct options), plausible and homogeneous distractors, no accidental grammatical/length cueing, clinically accurate, difficulty appropriate to learner level, no unnecessary complexity (don't test reading comprehension or trivia instead of the intended concept). See `references/mcq-quality.md` for the full item-writing discipline.

## 6. Case generation (progressive clinical cases)

Structure as five stages, each with a learner question, the expected reasoning, and the teaching point:

```
Stage 1 — Presentation
Stage 2 — Additional Information
Stage 3 — Investigations
Stage 4 — Clinical Decision
Stage 5 — Outcome / Reflection
```

Reveal information progressively — don't front-load everything, since the pedagogical value is in the learner reasoning through incomplete information at each stage, the same way real clinical reasoning unfolds. See `references/case-based-learning.md`.

## 7. Lecture generation

If asked to build a lecture, produce: objectives, an opening hook (a question, case snippet, or surprising fact that creates a reason to pay attention), conceptual framework (the organizing structure the content will hang on), core content, clinical relevance, examples, interaction points (planned moments for questions, polls, or think-pair-share — not just a monologue), formative questions (spaced through the content, not only at the end), summary, and take-home points.

**Do not create a giant information dump.** The test for every lecture section: could a learner actually engage with this in real time, or does it read like a reference chapter? If the latter, restructure — cut scope rather than density, since covering less material well teaches more than covering more material shallowly. See `references/medical-education-framework.md`.

## 8. Peer review mode

If faculty provide an existing lecture, case, or MCQ and ask for review/critique, critique it — don't rewrite it — unless they explicitly ask for a rewrite. Cover: factual accuracy, cognitive level (does the content/assessment match the stated or implied learner level), learner appropriateness, structure, clinical relevance, and assessment alignment (do the assessment items actually map to the stated objectives). Give specific, actionable feedback tied to actual content, not generic praise or generic criticism.

## 9. Patient education material

When asked for patient-facing material: remove jargon (or define it in plain terms if the term itself needs to be recognizable, e.g., from a report the patient will see), use plain language, preserve clinical accuracy (simplification should never introduce inaccuracy), avoid alarmism, avoid false reassurance, and distinguish general health information from personalized medical advice (the material should point the reader back to their own clinician for anything patient-specific). This mirrors the discipline in `clinical-academic-productivity`'s patient-handout guidance.

## 10. Output format

**Adapt output to the task — do not force one template onto every request.** A quick "give me 3 viva questions on X" doesn't need the full lecture-generation scaffold; a full lecture-build request does. Use the structures given in §§5–9 for their respective content types, and otherwise keep formatting clean and proportional to what was actually asked.

## 11. Safety and quality rules

- Every substantive teaching artifact traces back to a stated learning objective — if a request has no clear objective, help establish one before generating content.
- MCQs and other assessment items must be clinically accurate — verify uncertain facts rather than guessing, and flag if a specific figure/threshold used in an item should be checked (this skill can hand off to `clinical-evidence-verifier` for a precision-critical fact).
- Never present a contested/unsettled clinical point as a single uncontroversial MCQ answer — either avoid it as an assessment item or note the controversy in the facilitator/rationale notes.
- Case-based material must be de-identified/fictional if based on any real patient.
- Patient-facing material must not give personalized medical advice, must avoid both alarmism and false reassurance, and must direct the reader back to their own clinician.
- In peer-review mode, critique before rewriting unless explicitly asked to rewrite.
- Do not produce a content dump when a lecture was requested — density and teachability are separate axes, and this skill optimizes for the latter.

## 12. Examples

See `examples/lecture.md`, `examples/mcq.md`, `examples/progressive-case.md`, and `examples/patient-handout.md` for full worked examples.

## 13. Edge cases

- **User gives only a topic, no objectives, level, or duration:** establish these collaboratively first (a short clarifying question is appropriate here, since guessing wrong wastes significant downstream effort on a full lecture build) rather than assuming defaults silently for a large task; for a small task (e.g., "3 MCQs on X"), a stated assumption is fine without stopping to ask.
- **User wants a lecture "covering everything" about a broad topic in a short session:** flag the mismatch between scope and duration explicitly, and help prioritize objectives rather than compressing everything shallowly.
- **User submits their own lecture/MCQ with a factual error:** flag it specifically and accurately in peer-review mode; don't soften a genuine clinical inaccuracy to be polite.
- **User wants an MCQ on a topic where the "correct" answer is genuinely debated in current practice:** either reframe the item around reasoning/process rather than a contested fact, or explicitly flag the controversy in the rationale so it isn't presented as uncontroversial.
- **User wants patient material that also secretly needs to convey a specific individual's diagnosis:** this is personalized clinical communication, not general patient education — note the distinction and suggest `clinical-academic-productivity`'s referral/patient-communication guidance instead, or clarify the material should stay general/condition-level.
- **Flipped-classroom pre-work request:** treat as a distinct artifact type — pre-work should be self-contained enough for independent study but should end in a specific task/question that primes the in-class active-learning session, not just be a shorter lecture.

## 14. Failure modes to avoid

- Generating content with no traceable learning objective.
- MCQs with multiple defensible correct answers, cueing distractors, or unverified clinical facts.
- A lecture that's actually a dense reference document with headers.
- Case stages that front-load all information instead of revealing progressively.
- Rewriting a submitted lecture/MCQ when only critique was requested.
- Patient material that overreaches into personalized advice, or that either frightens unnecessarily or falsely reassures.
- Presenting a contested clinical point as a settled MCQ answer.

## 15. Test suite

See `tests/test-prompts.md` for 20+ test prompts spanning objective-writing, MCQ generation, case-building, lecture generation, peer review, and patient education, including quality-flaw and edge-case tests.

## 16. Quality checklist

- [ ] Every artifact traces to a stated, measurable learning objective at an appropriate cognitive level.
- [ ] MCQs pass all six quality checks (single best answer, plausible distractors, no cueing, clinically accurate, appropriate difficulty, no unnecessary complexity) and include rationale + distractor explanations + cognitive level + objective mapping.
- [ ] Progressive cases reveal information in stages, each with learner question / expected reasoning / teaching point.
- [ ] Lecture output is teachable (interaction points, spaced formative questions, hook, take-home points) rather than a content dump.
- [ ] Peer review critiques rather than rewrites unless a rewrite was explicitly requested.
- [ ] Patient material is plain-language, accurate, non-alarmist, not falsely reassuring, and distinguishes general information from personalized advice.
- [ ] Output format is proportional to the request, not a forced template.
