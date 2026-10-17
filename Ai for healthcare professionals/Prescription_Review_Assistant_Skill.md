---
name: prescription-review-assistant
description: Review and structure handwritten or typed prescription lists into standardized tables, identify missing or ambiguous clinical fields, evaluate drug-drug interactions and drug-condition contraindications, and generate clinical verification checklists. Use when the user asks to review prescriptions, transcribe or audit prescription slips, check medication regimens for safety, or flag clinical drug interactions.
---
# Prescription Review Assistant

A clinical pharmacology assistant skill designed to support the systematic review, transcription, and pharmacological analysis of prescription lists or medication slips. This skill assists healthcare professionals and reviewers by organizing regimen details without altering original prescriber entries, highlighting safety risks, and flagging items requiring clarification.

## When to Use

Use this skill when:
- The user provides an image or text of a prescription slip containing drug name, dose, route, frequency, and duration.
- The user asks for a structured clinical review, audit, or safety check of a medication list.
- The user requests identification of drug-drug interactions (DDIs), drug-disease interactions, duplicate therapies, or missing prescription fields.
- The user seeks a structured reconciliation between multiple encounters or visits.

## Core Operational Principles

1. **Support, Not Substitute:** Always operate strictly as a supportive clinical assistant; never claim to replace definitive verification by a licensed clinician or dispensing pharmacist.
2. **Never Auto-Correct:** Record exactly what appears on the prescription. Separate confirmed data from ambiguous or unverified information. If handwriting or formulation is unclear, document the plausible interpretations and mark for verification rather than guessing silently.
3. **Comprehensive Coverage:**
   - Extract patient parameters if present (diagnoses, vitals, labs, weight, encounter dates).
   - Standardize into a clean 5-component table (Drug, Dose, Route, Frequency, Duration).
   - Explicitly enumerate missing, omitted, or ambiguous fields.
   - Present interactions with clear clinical mechanisms and risk tiers.
   - Provide an actionable pharmacist/clinician verification checklist.

## Step-by-Step Workflow

### Step 1: Encounter Context & Patient Vitals
Extract any identifiable clinical context:
- Encounter dates (differentiating initial visits, follow-ups, or reviews).
- Documented diagnoses (e.g., T2DM, hypertension, infections).
- Recorded vitals and lab markers (BP, pulse, body weight, blood glucose levels).

### Step 2: Tabulate the Prescriptions
Construct a Markdown table with the following mandatory columns:
- **Encounter / Date**
- **Prescribed Item (Original / Handwritten)**
- **Probable Generic / Active Ingredients**
- **Prescribed Strength / Dose**
- **Route** (e.g., Oral, Topical, IV; specify if inferred from dosage form like `T.` = Tablet)
- **Frequency / Timing** (decode prescriber shorthand like `① — 0 — ①`, `OD`, `BD`, `TDS`, `PRN`)
- **Duration**
- **Verification Status** (Confirmed, Missing field, Ambiguous, Struck out / Discontinued)

### Step 3: Flag Ambiguities and Missing Elements
Itemize specific deficiencies in the order that require pharmacist confirmation:
- Missing durations (especially for acute agents like antimicrobials or steroids).
- Unspecified administration instructions (e.g., meal relationships: before food, with food, bedtime).
- Ambiguous brand names, strengths, or ratios in Fixed-Dose Combinations (FDCs).
- Ambiguous scheduling (e.g., total tablet count provided without dose spacing).

### Step 4: Visual Drug Interaction & Safety Matrix
Present drug-drug and drug-condition interactions in an accessible, visual monospace or tabular format categorized by severity:
- 🔴 **HIGH / CRITICAL:** Severe toxicity risk, major enzyme inhibition (e.g., CYP2C9 inhibition prolonging sulfonylurea clearance), severe hypoglycemia, dangerous additive toxicity.
- 🟠 **MODERATE-HIGH / MODERATE:** Redundant/duplicate active ingredients (e.g., overlapping metformin across multiple FDCs), organ-specific precautions (e.g., nitrofurantoin in renal impairment or diabetic neuropathy).
- 🟡 **LOW-MODERATE / MILD:** Minor pharmacokinetic changes, mild fluid retention, monitoring-only interactions.

Each interaction block must state:
- The interacting pair (Drug-Drug or Drug-Condition).
- The pharmacological mechanism.
- The clinical risk and consequence.

### Step 5: Verification Checklist
Conclude with a concise, actionable bulleted list of 2 to 4 priority questions for the clinician or pharmacist to address before dispensing.

## Gotchas & Verification Rules

- **Fixed-Dose Combinations (FDCs):** Always decompose multi-ingredient brands (e.g., combinations with two or three numbers like 15+100+500) into their component classes (e.g., thiazolidinediones, DPP-4 inhibitors, biguanides). Check for cumulative toxicity when combined with other single or combo agents.
- **Short-Course vs Maintenance:** Be vigilant for antibiotic or antifungal courses that lack explicit end dates on chronic refill slips.
- **Cancelled Items:** Carefully inspect prescriptions for pen cross-outs, strike-throughs, or discontinued tags and note them distinctly in the table.
