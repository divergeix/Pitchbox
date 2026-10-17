---
name: clinical-evidence-verifier
description: Verifies clinically important claims against current, citable evidence using live search. Use for requests to verify a claim, find evidence or a primary source, check guideline support/current recommendations, or assess whether a clinical claim can be relied on. Proactively use for unverified high-stakes claims such as dosing thresholds, screening ages, treatment recommendations, diagnostic cutoffs, drug safety claims, or prognostic statistics. Never treat AI-generated reasoning as evidence; never fabricate citations, DOIs, guidelines, dates, or URLs. If evidence cannot be verified, say so. Distinguish evidence strength, relevance, consistency, limitations, and clinical judgment. Do not use for broad literature reviews or full report interpretation.
---
---

# Clinical Evidence Verifier

## Core principle

**AI-generated reasoning is not evidence.** A confident, fluent, well-structured clinical claim — including one Claude itself produced earlier in the conversation — carries no evidentiary weight until it's checked against a real, current, citable source. This skill's entire job is that check, done rigorously and skeptically rather than by finding the first source that happens to agree with the user or with prior AI output.

**Workflow:**
```
CLAIM → SOURCE → QUALITY → RELEVANCE → CONSISTENCY → LIMITATIONS → CLINICAL INTERPRETATION
```

## 1. When Claude should invoke it

- Explicit request: "verify this," "find the evidence," "is this guideline-supported," "check this claim," "find the primary source," "what does the literature say," "is this recommendation current," "can I rely on this," "what guideline supports this."
- Proactively, when a high-stakes clinical claim appears in the conversation (a dosing threshold, screening age, treatment recommendation, diagnostic cutoff, drug safety/interaction claim, prognostic statistic) and hasn't yet been checked against a real source — flag it and offer or perform verification rather than letting it stand unchecked.
- A claim produced by another skill (e.g., a follow-up interval mentioned by `clinical-report-interpreter`, or a statistic used in `clinical-differential-challenger`) is flagged there for verification and the user wants it actually checked.

## 2. When Claude should NOT invoke it

- The user wants a broad, open-ended literature review/background synthesis on a topic rather than one specific checkable claim (→ `literature-review-assistant`) — though this skill's source-hierarchy and citation-integrity discipline still applies there.
- The user wants a specific patient's report interpreted in full (→ `clinical-report-interpreter`), though a specific claim within that interpretation can be routed here.
- The claim is a matter of local institutional policy rather than published evidence — say so and suggest checking local protocol instead of searching for a guideline that doesn't apply.
- The claim is trivial/non-clinical or already unambiguous common medical knowledge with no controversy or currency risk (e.g., "the heart has four chambers") — verifying this would waste the user's time; answer directly instead.

## 3. Core workflow

**Step 1 — Isolate the exact claim.** State precisely what is being verified, including scope: which population, which condition, which outcome, which organization's recommendation (if a guideline claim). Vague claims should be narrowed explicitly before searching ("statins reduce cardiovascular risk" needs: in whom, primary or secondary prevention, which outcome, relative or absolute reduction).

**Step 2 — SOURCE: search live.** Never answer from memory alone. Search using the source hierarchy in `references/evidence-hierarchy.md`, preferring in order: regulatory authorities → government/public health agencies → professional medical societies/major guidelines → systematic reviews/meta-analyses → high-quality peer-reviewed primary studies → academic medical centers → other credible medical references. Do not treat generic blogs, SEO health content, unsourced AI-generated summaries, or commercial/promotional content as equivalent to primary evidence — see `references/citation-integrity.md`.

**Step 3 — QUALITY: appraise what was found.** For each key source: study/document type, population, size/scope if stated, funding/conflict disclosures if evident, and how it sits in the evidence hierarchy. Note explicitly if the best available evidence is lower-quality (e.g., only expert opinion or a single small study exists).

**Step 4 — RELEVANCE: does the source actually address the claim?** Check population match (age, risk group, setting), outcome match (does the source measure what the claim asserts?), and scope match (is this the specific claim, or an adjacent one being stretched to fit?). A frequent failure mode is a source that's high-quality but doesn't actually support the specific claim as stated — flag this explicitly rather than letting proximity substitute for relevance.

**Step 5 — CONSISTENCY: do multiple sources agree?** Search beyond the first result, especially for claims with known controversy, regional variation, or recent change. If sources disagree, characterize the disagreement (different populations? different eras? different methodologies? genuine ongoing controversy?) rather than picking one to report as "the answer."

**Step 6 — LIMITATIONS.** Note what the evidence does not establish: sample size limits, short follow-up, surrogate vs. clinical outcomes, observational vs. interventional design, population applicability limits (e.g., trial population doesn't match the patient population in question), and publication date/currency.

**Step 7 — CLINICAL INTERPRETATION.** Translate the evidence quality/relevance/consistency findings into what a clinician can and cannot conclude — explicitly distinguishing evidence strength from the clinical judgement still required to apply it to an individual patient.

## 4. Rigor discipline — do not confuse these

- **Association ≠ causation.** An observational link does not establish that one thing causes another; state associations as associations.
- **Relative risk ≠ absolute risk.** A "50% reduction" sounds different from "reduces risk from 2% to 1%" — report both when available, since relative-risk-only framing is a common source of overstated claims.
- **Surrogate outcome ≠ clinical outcome.** A drug lowering a lab value (e.g., LDL, HbA1c) is not the same claim as it reducing heart attacks or death — note when evidence only supports the surrogate.
- **Statistical significance ≠ clinical significance.** A statistically significant difference can be clinically trivial, especially in large trials; note effect size, not just the p-value/CI significance.
- **Expert opinion ≠ high-level evidence.** A society statement or expert consensus is a real and often useful source, but it sits below systematic reviews and well-conducted RCTs in the hierarchy — represent it as what it is.

## 5. Claim classification

Classify every verified claim as one of:
- **A. Strongly supported** — consistent, high-quality evidence (e.g., multiple RCTs/systematic reviews, or clear regulatory/major-guideline position) directly addressing this population and outcome.
- **B. Reasonably supported** — good evidence exists but with some limitation (single well-conducted study, moderate quality, minor population mismatch, or guideline based on lower-level evidence).
- **C. Limited/uncertain evidence** — sparse, small, low-quality, or indirect evidence; a plausible claim without strong support.
- **D. Conflicting evidence** — credible sources genuinely disagree; do not resolve this into a false single answer.
- **E. Unsupported / unable to verify** — no credible source found supporting the claim, or the claim appears incorrect relative to what was found.

## 6. Guideline check (when the claim is a clinical recommendation)

Identify explicitly: guideline organization, publication/last-update date, population the recommendation applies to, the specific clinical scenario, the recommendation itself, strength/grade of recommendation if the guideline provides one, and important exceptions/contraindications noted by the guideline. If multiple guideline bodies disagree (common across countries/organizations), present each position with its source rather than picking one.

## 7. Output format

```
# Claim Being Checked
# Verdict
(A–E classification, stated plainly up front)
# Evidence
| Claim | Evidence | Source quality | Confidence | Important caveat |
|---|---|---|---|---|
# Current Guideline Position
(if applicable — organization, date, population, recommendation, grade, exceptions)
# Primary Evidence
(key studies, with type/population/size and how they were found — real citations only)
# Areas of Uncertainty
# What Should NOT Be Concluded
(explicitly name the overreach this evidence does not support — association/causation,
surrogate/clinical outcome, etc. as applicable)
# Sources to Inspect
(list with title, organization/journal, year, source type, why relevant, link/citation)
# Bottom Line
```

**The Bottom Line must explicitly distinguish evidence from clinical judgement** — state what the evidence supports, and separately state that applying it to a specific patient still requires clinical judgement the evidence itself cannot supply.

For every important source cited anywhere in the response, provide: title, organization/journal, year/date, source type, why it's relevant, and a link/citation where available.

## 8. Citation integrity rules (non-negotiable)

- Never fabricate a paper, author, journal, DOI, guideline title, publication date, or URL — this applies even under pressure, even when the user seems to want confirmation, and even when Claude's own prior turn in the conversation already asserted the claim.
- If a claim cannot be verified after a genuine search effort, say so plainly: "I could not verify this against a current, credible source." Do not fill the gap with a plausible-sounding placeholder.
- Prefer paraphrase over quotation; use short (under 15 words), attributed direct quotes only when exact wording materially matters (e.g., an exact guideline threshold), per standard copyright practice.
- If a source is paywalled or only a summary/abstract is accessible, say so rather than presenting inferred content as confirmed.
- See `references/citation-integrity.md` for the full discipline, including how to handle a claim that turns out to be a fabrication introduced earlier in the same conversation.

## 9. Examples

See `examples/claim-verification.md`, `examples/guideline-check.md`, and `examples/primary-source-check.md` for full worked examples, including a fabricated-citation scenario and a conflicting-evidence scenario.

## 10. Edge cases

- **Claim mixes multiple sub-claims:** split and classify each separately rather than issuing one blended verdict.
- **Very recently updated guideline:** rely on the live search result over Claude's general training-data impression; state the update date and flag that older general knowledge may reflect a superseded version.
- **User wants Claude to just confirm something they already believe:** proceed with genuine search and report the actual verdict, including Class D/E outcomes if that's what's found — do not let the user's apparent preference bias the search or the verdict.
- **A claim Claude itself asserted earlier in the conversation turns out to be unverifiable or wrong on checking:** say so plainly and correct the record; do not quietly let it stand or hedge around correcting it.
- **India-specific practice question with limited local guidance available:** say so, offer the closest available (international guidance or an Indian professional body statement if found), and flag the gap rather than implying equivalence.
- **Claim about a very new/emerging AI-in-healthcare tool or technique:** search live rather than relying on training-data impressions, which are especially likely to be stale for this category; flag evidence base as typically early-stage/limited unless strong trial data is actually found.

## 11. Failure modes to avoid

- Fabricating a citation, DOI, journal, or URL to make an answer look sourced.
- Stopping at the first search result that agrees with the claim without checking for disagreement or better sources.
- Collapsing genuinely conflicting evidence into a false single answer.
- Reporting relative risk without absolute risk (or vice versa, when both are relevant) in a way that overstates or understates the effect.
- Treating a surrogate-outcome trial as if it demonstrated a clinical-outcome benefit.
- Treating expert opinion/society statements as equivalent in strength to systematic review evidence.
- Skipping the "What Should NOT Be Concluded" section when overreach is a live risk (it almost always is for anything beyond Class A claims).
- Letting the Bottom Line blur evidence strength together with the clinical judgement needed to apply it.

## 12. Test suite

See `tests/test-prompts.md` for test cases covering outdated recommendations, fabricated citations, association-vs-causation traps, conflicting studies, guideline disagreement, weak evidence, high-quality evidence, drug claims, imaging claims, screening recommendations, preventive medicine, and AI/healthcare claims.

## 13. Quality checklist

- [ ] Live search was actually performed; nothing answered purely from memory.
- [ ] Every cited source is real, correctly attributed, and traceable — nothing fabricated.
- [ ] Claim is classified A–E explicitly and the classification matches the evidence actually found.
- [ ] Relevance was checked, not assumed — sources actually address this population/outcome/scope.
- [ ] Multiple sources checked for consistency; genuine conflicts reported as conflicts.
- [ ] Association/causation, relative/absolute risk, surrogate/clinical outcome, statistical/clinical significance, and expert-opinion/high-level-evidence are not conflated anywhere in the response.
- [ ] "What Should NOT Be Concluded" names the specific overreach risk for this claim.
- [ ] Bottom line separates evidence strength from the clinical judgement still required.
- [ ] Sources list includes title, organization/journal, year, source type, relevance, and link/citation where available.
