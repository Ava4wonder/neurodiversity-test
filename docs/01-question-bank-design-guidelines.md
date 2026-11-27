# Question Bank Design Guidelines

| | |
|---|---|
| **Document** | 01: Question Bank Design Guidelines |
| **Version** | 0.1.0 (draft) |
| **Applies to** | `content/test-set.yaml` v0.1.x, `content/type-set.yaml` v0.1.x, `content/references.yaml` |
| **Enforced by** | `npm run validate` (`src/engine/validate.ts`); rule IDs `G-x.y` below match the validator's messages |

These guidelines say how items, dimensions and evidence must be written, cited, versioned and validated. Automated checks enforce every rule marked **[auto]**. Human review covers the rest (checklist in §11).

Citations use `[@key]`, keys from [`content/references.yaml`](../content/references.yaml). Full list: [generated/references.md](generated/references.md).

---

## 1. Purpose and scope

The Neurodiversity Trait Profile is a **self-report, structured ("objective") questionnaire** [@clark1995] with an optional behavioural task. It describes a person's profile on neurodivergent trait dimensions and matches it to a small set of prototype types, like the MBTI but probabilistic.

- **Population:** adults and adolescents aged 16+ (`meta.min_age`).
- **It is:** a self-reflection and psychoeducation tool, and, once validated, a candidate screening aid that suggests where a formal assessment might help.
- **It is not:** a diagnostic instrument. Results must never say a person "has" ADHD, autism, dyslexia, dyscalculia or dyspraxia. Diagnosis requires a qualified clinician using full criteria [@apa2022].
- **Out of scope for v0:** tic disorders, intellectual disability, language disorder, alexithymia/interoception, and circadian rhythm as a scored dimension. These are backlog candidates.

## 2. Guiding principles

1. **Neurodiversity-affirming.** Traits are described as differences with strengths and challenges, not deficits [@pellicano2022]. Social items are worded neutrally, because social difficulty runs both ways [@milton2012].
2. **Dimensional first, types second.** Most psychological traits are continuous [@haslam2012; @haslam2020]. Dimension scores are the primary result. Types are probabilistic summaries with a confidence label, avoiding the hard-dichotomy problems of MBTI-style typing [@pittenger2005].
3. **Evidence before inclusion.** Every scored item and every type claim cites published evidence (§7). Anything unsupported is collected but not scored.
4. **Traceability.** Every number in a report can be traced to an item, a parameter and a source, and every change to a versioned changelog entry (§8).
5. **Validity framework.** Evidence is gathered on content, response process, internal structure, relations to other variables, and consequences [@aera2014], following COSMIN terminology [@mokkink2010].
6. **Accessibility and privacy.** WCAG 2.2 AA [@wcag22]. Answers stay in the browser unless the respondent chooses to export them.

## 3. Constructs and dimensions

| Rule | Requirement |
|---|---|
| **G-3.1** [auto] | Every dimension has an `id`, `name`, a one-sentence `construct` definition, `high_pole` and `low_pole`. Items may only reference defined dimensions. |
| **G-3.2** [auto] | Every dimension cites ≥ 1 source for its construct definition (`refs`). |
| **G-3.3** [auto, warn] | Every item names the `facet` (sub-aspect) it covers. A dimension's items should span ≥ 3 distinct facets so the construct is covered, not one behaviour repeated. |
| G-3.4 | A dimension describes a **trait**, never a diagnosis. `associated_with` is informational and is shown with "often associated with" wording. |
| G-3.5 | High scores always mean *more of the trait*. Dimension names are neutral, e.g. "Attention Drift", not "Attention Deficit". |

The v0 dimensions and their primary sources:

| ID | Dimension | Construct basis |
|---|---|---|
| ATT | Attention Drift | DSM-5-TR ADHD criterion A1 [@apa2022]; adult expression [@kessler2005]; mind-wandering [@seli2015] |
| IMP | Restless Energy | DSM-5-TR ADHD A2 [@apa2022]; inhibition model [@barkley1997] |
| EXF | Executive Load | Executive-function models [@barkley1997; @barkley2011]; EF in autism [@hill2004] and DCD [@kirby2010] |
| SOC | Social Decoding | DSM-5-TR autism A [@apa2022]; AQ [@baroncohen2001]; camouflaging [@hull2019] |
| SEN | Sensory Intensity | Sensory processing model [@dunn1997]; autism [@bensasson2009]; ADHD [@bijlenga2017; @panagiotidi2018] |
| RTN | Routine & Deep Focus | DSM-5-TR autism B2/B3 [@apa2022]; AQ [@baroncohen2001] |
| LIT | Word Decoding | DSM-5-TR specific learning disorder [@apa2022]; [@vellutino2004; @peterson2012]; ARHQ [@lefly2000] |
| NUM | Number Sense | [@butterworth2005; @butterworth2011] |
| MOT | Motor Coordination | DSM-5-TR DCD [@apa2022]; [@blank2019]; ADC [@kirby2010] |

## 4. Item-writing rules

### 4.1 Coverage
- **G-4.1** [auto] Each dimension has **≥ 4 scored items** (weight > 0). Target **6**, so items can be dropped after piloting without falling below 4 [@clark1995; @boateng2018].
- Write an over-inclusive pool. It is easier to drop weak items than to add them after a pilot [@clark2019].

### 4.2 Wording
- **G-4.2** [auto] Item text is non-empty and **≤ 120 characters** (warning above).
- One idea per item. No double-barrelled items ("I am X *and* Y"). Lists of **examples of one behaviour** are allowed ("keys, phone or wallet"), but the `rationale` must say so.
- First person, present tense, everyday concrete behaviour ("I misplace my keys"), not abstractions ("I am disorganised").
- Plain language, around a 12-year-old reading level. No clinical jargon and no diagnostic labels in item text.
- Avoid absolutes (*always*, *never*), which push answers to the extremes. Use frequency or comparison anchors instead ("more often than other people").
- Avoid stigmatising or value-laden words ("bad", "weird", "normal").
- Gender-neutral, culturally neutral examples (§10).

### 4.3 Response formats
- **G-4.3** [auto] Allowed formats:
  - `likert`: 5-point labelled agreement scale, *Strongly disagree → Strongly agree* (0-4). Five labelled points balance reliability and respondent burden [@preston2000]. A 7-point variant is a candidate experiment for v0.2.
  - `bipolar`: two labelled poles (`poles`), 0-4. Used for preferences ("dimmer ↔ brighter").
  - `choice`: 2+ options. Every option gives a keyed value (0-4) for **every** dimension the item feeds. Used when options map to qualitatively different patterns (e.g. needing silence vs seeking background noise).

### 4.4 Keying
- **G-4.4** [auto] Every scored likert/bipolar item has `keyed: forward | reverse`. Each dimension has **25-50 % reverse-keyed** items, to control acquiescence [@devellis2021].
- **G-4.4** [auto, warn] Reverse-keyed items must be phrased **positively**, with no *not / never / no / -n't*. Negated reversals cause misresponses [@weijters2012].
- Consistency pairs (§6) are built from opposite-keyed items about the same behaviour.

### 4.5 Neutrality and bias
- Items should not be answerable from social desirability alone. Pair difficulties with neutral context ("even with friendly people").
- Avoid confounds with other dimensions. For example, ATT items avoid reading tasks (which overlap LIT), and SEN items describe discomfort, not distraction (which overlaps ATT). The pilot checks cross-loadings (§9).

### 4.6 Originality and copyright
- All item wording is **original**. Do not copy or lightly paraphrase items from copyrighted instruments (AQ, ASRS, RAADS-R, CAT-Q, AASP, ADC, ARHQ, BDEFS…). Cite them as **construct** sources only.

### 4.7 Rationale
- **G-4.7** [auto] Every item has a `rationale` explaining why it measures the construct. This is the first line of content-validity evidence.

## 5. Presentation

- **G-5.1** [auto] Every item belongs to a defined `section`.
- Trait items are **interleaved** across dimensions with a fixed seed, so neighbouring items never share a dimension (tested) and everyone sees the same order.
- At most 6 items per page. Back navigation allowed. No time limit except inside the optional task.
- Preference items come in their own section after the trait items, so the change of format is clear.

## 6. Response-quality design

- **G-6.1** [auto] At least 1 instructed-response attention check, with an expected value on the scale [@meade2012]. v0 has 2, at about 40 % and 80 % of the trait section.
- Consistency: ≥ 3 opposite-keyed pairs on the same behaviour [@meade2012].
- Long-string (straight-lining) and response-time screening [@curran2016]. The time threshold follows the ~2 s/item insufficient-effort convention [@huang2012].
- Thresholds live in `content/scoring.yaml → validity` ([doc 03](03-scoring-mechanism.md#8-validity-rules)).

## 7. Evidence standard

### 7.1 Evidence levels

| Level | Definition | Default weight | Citation requirement |
|---|---|---:|---|
| **established** | The facet appears in a diagnostic criterion (DSM-5-TR) **and/or** is measured by a validated instrument **and/or** has meta-analytic support. | 1.0 | ≥ 1 source |
| **emerging** | Supported by peer-reviewed empirical studies, but not a diagnostic criterion, with mixed findings, or only shown in a related population (e.g. children). | 0.5 | ≥ 1 source |
| **exploratory** | Plausible or community-reported, with no direct peer-reviewed evidence found. Collected for analysis and shown to the respondent, **never scored**. | 0.0 | `basis` must say evidence is lacking |

Weights live in `scoring.yaml → dimension_scoring.evidence_weights`. Pilot data replaces them with empirical item weights (§9).

### 7.2 Rules
- **G-7.1** [auto] Every cited key exists in `references.yaml`. Keys are unique. Every reference is cited at least once by content or docs (warning).
- **G-7.2** [auto] Every reference says what it `supports`. Articles need a DOI (preferred) or URL.
- **G-7.3** [auto] Every item has `evidence.level`, `evidence.basis` (one sentence naming the criterion or finding) and `evidence.refs` (≥ 1 unless exploratory).
- **G-7.4** [auto] Exploratory items have weight 0.
- **G-7.5** [auto] Every type cites the evidence behind its "associated with" statement and its strengths text.
- **G-7.6** Every DOI is checked against Crossref before release: `npm run verify-refs` → `reports/reference-verification.md` must show 0 issues.
- **G-7.7** A source supports a *construct or facet*. Do not cite a paper for a claim it does not make. Strengths come mostly from qualitative studies [@sedgwick2019; @russell2019] and must be framed as "commonly reported". Speculative strengths (e.g. dyslexia and exploration [@taylor2022]) are labelled as hypotheses in the docs.

### 7.3 Changing an evidence level
- *exploratory → emerging*: a peer-reviewed study supports the link, **or** pilot data shows corrected item-total r ≥ .30 and the item loads on its intended factor.
- *emerging → established*: replicated evidence or meta-analysis, **or** pilot plus confirmatory sample support with no differential item functioning (DIF) by gender or age.
- Every change gets a changelog entry citing the source or report.

## 8. Versioning and traceability

- **G-8.1** [auto] IDs (`ATT-01`, `SPARK`, `kessler2005`) are unique and **never reused**. Retire an item with `status: retired` instead of deleting it.
- **G-8.2** [auto] Cross-file versions must agree: `type-set.meta.test_set_version`, `scoring.meta.test_set_version` and `scoring.meta.type_set_version`.
- **G-8.3** [auto] A test set with `status: validated` may not contain `draft` items. Item lifecycle: `draft → pilot → validated → retired`.
- Semantic versioning of content:
  - **MAJOR**: scores are not comparable with the previous version (dimension redefined, item keying changed, scoring formula changed).
  - **MINOR**: items or types added, or parameters re-calibrated.
  - **PATCH**: typos and wording fixes that do not change meaning (confirm with a cognitive interview).
- Every report and research export is stamped with the three content versions. The analysis script ignores exports from other test-set versions.

## 9. Validation roadmap

| Phase | Activity | Acceptance criteria | Status |
|---|---|---|---|
| 0 | Evidence-cited item pool, automated rule checks, Monte-Carlo separability ([reports/simulation-report.md](../reports/simulation-report.md)) | 0 validator errors; DOIs verified; ≥ 85 % prototype recovery in simulation | **done (v0.1.0)** |
| 1 | Expert content review: 5-10 experts (clinicians, researchers, neurodivergent self-advocates) rate each item's relevance on a 4-point scale | I-CVI ≥ .78; S-CVI/Ave ≥ .90 [@lynn1986; @polit2006] | to do |
| 2 | Cognitive interviews (think-aloud and probing) with 10-15 people, including neurodivergent adults [@willis2005] | No item misunderstood by ≥ 2 people; revise and re-test | to do |
| 3 | Pilot, n ≥ 300 (≥ 5-10 per item) [@boateng2018], collected through research exports | Per item: corrected r_it ≥ .30, no floor/ceiling > 60 %. Per scale: α and ω ≥ .70 [@cronbach1951; @mcneish2018]. EFA/CFA supports the 9-factor structure | to do |
| 4 | Convergent validity against ASRS [@kessler2005], AQ-10 [@allison2012], ARHQ [@lefly2000], ADC [@kirby2010], SPQ [@tavassoli2014] | r ≥ .50 with the matching scale, lower with non-matching scales | to do |
| 5 | Known-groups and criterion validity (participants with confirmed diagnoses vs comparison); test-retest at 2-4 weeks [@mokkink2010] | AUC ≥ .75 per relevant dimension; ICC ≥ .70 | to do |
| 6 | Data-driven types: latent profile analysis [@spurk2020]; norms by age band | Prototypes revised to match empirical profiles; percentiles shown in report | to do |

Ethics approval and informed consent are required before collecting data from participants in phases 2-6. Research exports contain no names or contact details. Optional diagnosis and age-band fields are self-reported and only in files the respondent chooses to share.

## 10. Ethics, safety and accessibility

- Result wording: "your profile most resembles…", "traits often associated with…". Never "you have…".
- Every report shows: not a diagnosis; how to seek assessment; a crisis-services note.
- Strengths are shown alongside challenges for every type and dimension.
- Accessibility: Atkinson Hyperlegible typeface, adjustable text size and spacing, light/dark themes, keyboard answering (1-5), visible focus, reduced motion. Colour never carries meaning alone (the task uses circle vs square). No time pressure outside the optional task, which can always be skipped [@wcag22].
- Cultural review is required before translation. Examples (supermarkets, times tables, analogue clocks) must be localised, not just translated.

## 11. Review checklist (for every change to the item pool)

- [ ] `npm run validate` passes with 0 errors; new warnings explained in the PR.
- [ ] New or changed items have `facet`, `rationale`, `evidence.level/basis/refs`.
- [ ] New references added to `references.yaml` and `npm run verify-refs` is clean.
- [ ] Wording rules (§4.2) checked by a second reviewer; ideally one reviewer is neurodivergent.
- [ ] `npm run simulate`: recovery has not dropped by more than 5 points; explain if it did.
- [ ] Versions bumped per §8 and changelog entries added in each touched YAML file.
- [ ] `npm run docs` re-run so `docs/generated/` matches the content.
