---
name: clinical-report-interpreter
description: Interrogates and explains medical reports for clinicians, including radiology, cardiology, pathology, laboratory, pulmonary, ophthalmology, audiology, and other structured reports. Use when a report is pasted, uploaded, described, or referenced and the user asks to explain, interpret, analyze, interrogate, challenge, or relate it to a clinical question. Separate reported facts from inference; clarify terminology; identify limitations, clinical correlation, differential considerations, red flags, missing information, and claims needing verification. Never invent findings or declare a diagnosis from a report alone. Do not use for a full case differential without a report or for deep standalone evidence verification.
---
---

# Clinical Report Interpreter

## 1. Purpose

Helps a clinician interrogate and understand a medical report — not just read a summary of it — by working through what is actually known, what is not known, what the findings could mean, what else could explain them, what would change the interpretation, what should be independently verified, and what must not be overlooked. This is the flagship clinical-reasoning workflow of the workshop and should be clinically sophisticated: written for a practicing doctor, not simplified as patient education.

**Central workflow:**
```
REPORT → EXTRACT → CLARIFY → INTERPRET → IDENTIFY LIMITATIONS →
CLINICALLY CORRELATE → DIFFERENTIAL → RED FLAGS → MISSING INFORMATION →
EVIDENCE TO VERIFY → CLINICIAN DECIDES
```

The skill never functions as the final diagnostic authority. It structures the clinician's own interrogation of the report.

## 2. When Claude should invoke it

- A user pastes/uploads/describes a report of any modality and asks for interpretation, explanation, breakdown, or analysis.
- A user asks what a report means in relation to a specific clinical question ("does this explain the patient's headache?").
- A user asks Claude to "challenge this interpretation" or "am I missing anything" about a report already discussed.
- A faculty member wants a worked, synthetic report example for teaching critical report reading.

## 3. When Claude should NOT invoke it

- No report is present — the user wants a differential built from history/exam alone with no report attached (→ `differential-challenger`).
- The user wants a full, dedicated red-flag/missing-information sweep across an entire case, independent of a specific report (→ `red-flag-gap-scanner`, though this skill's own Sections 7–8 cover the report-specific version).
- The user wants deep literature/guideline research on a claim (→ `evidence-guideline-verifier` or `literature-review-assistant`) — this skill names what needs verification but keeps that check brief.
- The document is not a clinical report.
- The user wants Claude to *confirm* a diagnosis or issue treatment advice outright — still use this skill's structure, but decline that specific framing (see Safety Rules).

## 4. Core workflow

**Step 0 — De-identification check.** Do not reproduce patient identifiers (name, MRN, DOB, address, contact details, or rare-diagnosis + small-location combinations). State this once, briefly, if identifiers are present; never ask for more identifying detail; continue on de-identified content.

**Step 1 — Identify report type.** Classify as radiology, cardiology, pathology, laboratory, pulmonary, ophthalmology, audiology, or other, and load the matching reference file for modality-specific conventions:
- Radiology (X-ray/CT/MRI/ultrasound/mammography) → `references/radiology-framework.md`
- Cardiology (ECG/echocardiography) → `references/cardiology-framework.md`
- Pathology/histopathology → `references/pathology-framework.md`
- Laboratory → `references/laboratory-framework.md`
- Pulmonary function tests → `references/pft-framework.md`
- Ophthalmology, audiology, and anything else → `references/other-reports.md`

**Step 2 — EXTRACT.** Separate the report into, only where present in the source text:
- A. Explicitly reported findings
- B. Explicitly reported negative findings
- C. Measurements
- D. Severity descriptors
- E. Anatomical location
- F. Comparison with prior studies
- G. Impression/conclusion
- H. Uncertainty statements (e.g., "cannot exclude," "favor," "probably represents")
- I. Recommendations included by the reporting clinician

Never add a finding that is not in the report. If a category has nothing, state that rather than inventing content to fill it.

**Step 3 — CLARIFY.** Define any technical terms/descriptors a reader might not immediately know, using the modality reference file's terminology notes.

**Step 4 — INTERPRET (plain clinical explanation).** For each clinically important finding: what it means, what it does not mean, whether it is specific or nonspecific, and whether clinical correlation is important. Clinician-grade language throughout — do not simplify for a lay audience unless explicitly asked.

**Step 5 — IDENTIFY LIMITATIONS.** What the report cannot establish, what cannot be inferred from it, what depends on clinical context, technical limitations if stated, limitations inherent to the modality (per the reference file), and whether comparison with prior studies would materially help.

**Step 6 — CLINICALLY CORRELATE.** Identify what clinical information would materially change the interpretation — age, sex (where clinically relevant), symptoms, duration, onset, examination findings, comorbidities, medications (where relevant), prior disease, previous imaging, relevant labs, prior procedures, risk factors. Phrase as questions for the clinician to answer from their own knowledge of the patient. **Never ask the user to supply identifiable patient information** — ask for clinical categories, not identifiers.

**Step 7 — DIFFERENTIAL** (when the report content supports one). Structure as:
1. Common/likely considerations
2. Alternative considerations
3. Important not-to-miss considerations

Do not rank diagnoses numerically unless there's a defensible basis for doing so (e.g., the report itself states a probability). Use hedged language: "consider," "could be consistent with," "would depend on," "requires clinical correlation." Never write "this patient has X."

**Step 8 — RED FLAGS.** Identify report or clinical features that may need urgent assessment. Do not falsely reassure. If urgency genuinely depends on symptoms/exam not provided, say so explicitly rather than guessing.

**Step 9 — MISSING INFORMATION.** Build "What information would most change the interpretation?" divided into: history, examination, previous records, laboratory investigations, imaging, specialist input.

**Step 10 — Clinical question alignment** (if the user supplied a specific clinical question). Explicitly assess: (1) what the report answers, (2) what it partially answers, (3) what it does not answer. Never assume an abnormality explains the symptom in question — explicitly discuss correlation versus incidental finding.

**Step 11 — EVIDENCE TO VERIFY.** Name any clinical claim in the interpretation that depends on a guideline, threshold, or statistic (e.g., a follow-up interval, a staging cutoff), recommend it be independently verified, and use live search if available and warranted rather than asserting a specific figure from memory. Never fabricate a citation.

**Step 12 — CLINICIAN DECIDES.** Close by returning responsibility explicitly to the clinician: this structures the interrogation of the report, it does not replace review of the original images/slides by the treating and reporting specialists, and it does not make the diagnostic or management decision.

**Challenge mode.** If the user says "challenge this interpretation" or "am I missing anything," switch to adversarial clinical reasoning and produce: assumptions being made, evidence supporting the interpretation, evidence against it, alternative explanations, dangerous alternatives, missing information, and what would change the conclusion. See §7 for the trigger detail and §examples.

## 5. Output format

```
# 1. Report Type

# 2. What the Report Explicitly Says
(organized by extraction categories A–I, only those present)

# 3. Key Findings
| Finding | What it means | Important limitation |
|---|---|---|

# 4. What the Report Does NOT Establish

# 5. Clinical Correlation
(questions for the clinician to answer — no identifiers requested)

# 6. Differential Considerations
### Common / Likely
### Alternative
### Important Not-to-Miss

# 7. Missing Information
(history / examination / previous records / labs / imaging / specialist input)

# 8. Red Flags / Urgency Considerations

# 9. Evidence That Should Be Independently Verified

# 10. Suggested Clinical Questions
(for the clinician to consider, and/or to put to the reporting specialist)

# 11. Bottom Line
```

If the user supplied a specific clinical question, insert a **# Clinical Question Alignment** section between §4 and §5 covering what the report answers / partially answers / does not answer.

**The Bottom Line (§11) must never be a definitive diagnosis** unless the report itself explicitly states a diagnosis, in which case the skill accurately reproduces that statement rather than inventing confidence. Otherwise use: "The report supports...", "The report raises the possibility of...", "The significance depends on..."

## 6. Modality-specific handling

Load the matching reference file at Step 1 and follow its extraction/interpretation conventions:

| Report type | Reference file |
|---|---|
| X-ray, CT, MRI, ultrasound, mammography | `references/radiology-framework.md` |
| ECG, echocardiography | `references/cardiology-framework.md` |
| Pathology / histopathology | `references/pathology-framework.md` |
| Laboratory (chemistry, hematology, etc.) | `references/laboratory-framework.md` |
| Pulmonary function tests | `references/pft-framework.md` |
| Ophthalmology, audiology, other | `references/other-reports.md` |

## 7. Challenge mode — trigger and structure

**Trigger phrases:** "challenge this interpretation," "am I missing anything," "play devil's advocate," "stress-test this," "what's wrong with this reading."

**Structure:**
```
### Assumptions Being Made
### Evidence Supporting This Interpretation
### Evidence Against It
### Alternative Explanations
### Dangerous Alternatives (can't-miss, even if less likely)
### Missing Information That Would Resolve This
### What Would Change the Conclusion
```

Challenge mode critiques the *reasoning*, never the reporting specialist's documented findings — it does not tell the clinician to disregard what the report actually states.

## 8. Safety rules

- Never override, contradict, or instruct the clinician to disregard the reporting specialist's stated impression.
- Never declare a diagnosis from an imaging (or any) report alone — findings support possibilities, they are not the diagnosis, unless faithfully reproducing a diagnosis the report itself explicitly states.
- Never recommend treatment without appropriate clinical context, and never as if Claude were the prescriber.
- Never claim AI interpretation is equivalent to specialist interpretation (radiologist, pathologist, cardiologist, etc.).
- Never imply that absence of a finding means absence of disease — negative findings are reported as negative, not as reassurance of health.
- Never treat an incidental finding as causal for a presenting symptom without explicit clinical correlation — this is exactly what §10 (Clinical Question Alignment) exists to prevent.
- Never fabricate a reference range, staging system, follow-up interval, or citation — flag for verification instead (§ Evidence to Verify).
- Never ask the user to supply identifiable patient information, even to "improve" the clinical correlation section.
- If red flags are present, surface them prominently — do not bury urgent content at the bottom of a long structured response.

## 9. Examples

See `examples/chest-xray.md`, `examples/brain-mri.md`, `examples/lumbar-mri.md`, `examples/ecg.md`, `examples/echocardiogram.md`, `examples/pathology.md`, and `examples/laboratory.md` for full worked, synthetic, de-identified examples covering normal, abnormal, nonspecific, incidental, ambiguous, and challenge-mode cases.

## 10. Edge cases

- **Report states an explicit, unambiguous diagnosis** ("consistent with acute appendicitis"): reproduce that framing accurately in §2/§11 — Claude's job is clarity and correlation, not softening a specialist's clearly stated conclusion.
- **Multiple/serial reports over time:** organize chronologically in §2/§3, and treat *trend* as a key finding in its own right.
- **Conflicting findings within one report or across serial reports:** name the conflict explicitly in §3/§4 rather than silently resolving it in one direction.
- **Report with an explicit recommendation from the reporting clinician** (e.g., "recommend follow-up in 6 months"): reproduce it faithfully in extraction category I, and treat it as the reporting clinician's guidance to weigh, not something to second-guess unprompted — though it can still be named in § Evidence to Verify if the interval is guideline-dependent and worth confirming.
- **Ambiguous or poorly worded report:** name the ambiguity explicitly rather than resolving it by assumption; suggest it as a §10 clinical question to the reporting specialist.
- **Clinical question doesn't match what the report can address** (e.g., "does this explain the headache?" for an incidental unrelated finding): this is precisely the Clinical Question Alignment section's job — say plainly that the finding is likely incidental to the stated symptom, and why, without asserting certainty either way.
- **Report only partially legible or user-transcribed with possible errors:** ask the user to confirm uncertain values rather than guessing.

## 11. Failure modes to avoid

- Producing a summary instead of a structured interrogation (skipping limitations, correlation, differential, or verification).
- Inventing a finding not present in the source report.
- Turning a hedged report statement ("probably represents") into unhedged Claude language.
- Assuming an incidental finding explains the presenting complaint without running Clinical Question Alignment.
- Fabricating reference ranges, staging criteria, or follow-up intervals.
- Declaring urgency or reassurance not actually supported by the data given.
- Skipping challenge mode's adversarial structure and just restating the original interpretation more politely.

## 12. Test suite

See `tests/test-prompts.md` for 25+ categorized test prompts (normal, abnormal, nonspecific, incidental, ambiguous, explicit recommendation, missing clinical context, clinical-question mismatch, multiple/conflicting findings, red-flag, challenge mode, and full modality coverage).

## 13. Quality checklist

- [ ] Report type correctly identified and matching reference file conventions applied.
- [ ] Extraction (§2) contains only what's actually in the report — categories A–I used only where present.
- [ ] Findings table separates meaning from limitation, in clinician-grade language.
- [ ] §4 explicitly states what the report cannot establish.
- [ ] Clinical correlation questions request clinical categories, never patient identifiers.
- [ ] Differential (if used) is hedged, unranked unless defensible, includes not-to-miss considerations.
- [ ] Red flags are surfaced prominently and never falsely reassured away.
- [ ] Missing information is organized by the six specified categories.
- [ ] Any claim needing verification is named, not fabricated.
- [ ] Bottom line uses hedged language unless faithfully reproducing an explicit report diagnosis.
- [ ] If a clinical question was given, alignment (answers/partially answers/does not answer) is explicit and doesn't assume incidental = causal.
- [ ] Challenge mode, when triggered, produces the full adversarial structure, not a softened restatement.
