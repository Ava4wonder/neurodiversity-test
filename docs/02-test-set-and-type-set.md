# Test Set + Type Set

| | |
|---|---|
| **Document** | 02: Test Set + Type Set specification |
| **Source of truth** | [`content/test-set.yaml`](../content/test-set.yaml) (v0.1.0), [`content/type-set.yaml`](../content/type-set.yaml) (v0.1.0) |
| **Generated views** | [Evidence matrix](generated/evidence-matrix.md) (every item with its evidence and sources) · [References](generated/references.md) |
| **Rules** | [Guidelines](01-question-bank-design-guidelines.md) `G-*`, plus type-set rules `T-*` below |

The YAML files are the specification. The frontend reads them at build time and the scripts validate, simulate and analyse them. This document explains their structure and records the current design decisions.

---

## 1. Test set (`content/test-set.yaml`)

### 1.1 Structure

| Block | Purpose |
|---|---|
| `meta` | id, title, version, status (`draft → pilot → validated`), minimum age, changelog |
| `presentation` | items per page, fixed shuffle seed, back navigation |
| `sections` | ordered parts of the questionnaire (`traits`, then `preferences`), each with `order: interleaved | as_listed` and whether attention checks are inserted |
| `response_scale` | 5-point labelled agreement scale, values 0-4 |
| `dimensions` | the traits measured (see 1.2) |
| `items` | the statements (see 1.3) |
| `attention_checks` | instructed-response items (not scored) |
| `tasks` | optional behavioural tasks (v0: Go/No-Go) |

### 1.2 Dimension fields

`id`, `name`, `short` (one line shown in the report), `construct` (definition), `high_pole` / `low_pole`, `associated_with` (informational), `refs` (construct sources), `strengths` / `challenges` (shown in the report for elevated dimensions).

### 1.3 Item fields

| Field | Required | Notes |
|---|---|---|
| `id` | ✓ | `DIM-NN` for trait items, `PRF-NN` for preferences. Never reused (G-8.1). |
| `section` | ✓ | `traits` or `preferences` |
| `format` | | `likert` (default), `bipolar` (needs `poles`), `choice` (needs `options[].scores`) |
| `dimension` + `keyed` | for scored likert/bipolar | omit `dimension` for a descriptive-only item |
| `options[].scores` | for choice | keyed value 0-4 per dimension the item feeds |
| `text` | ✓ | ≤ 120 chars, original wording (G-4.2, G-4.6) |
| `topic`, `icon` | preferences | drive the "comfort zone" panel |
| `facet` | ✓ | sub-aspect covered |
| `evidence` | ✓ | `level` (established / emerging / exploratory), `basis`, `refs` (G-7.3) |
| `rationale` | ✓ | why the item measures the construct |
| `status` | ✓ | draft / pilot / validated / retired |
| `weight` | | overrides the evidence-level weight. Use only with a documented reason. |

### 1.4 Current inventory (v0.1.0)

**Part 1: traits.** 9 dimensions × 6 items = 54 items, 2 reverse-keyed per dimension (33 %).

| Dim | Items | established | emerging | exploratory | Facets covered |
|---|---:|---:|---:|---:|---|
| ATT | 6 | 6 | 0 | 0 | sustained (auditory, passive, effortful), detail, distractibility |
| IMP | 6 | 5 | 1 | 0 | inner/motor restlessness, verbal and decisional impulsivity, waiting, reflection |
| EXF | 6 | 6 | 0 | 0 | time, initiation, belongings, planning, prospective memory |
| SOC | 6 | 4 | 2 | 0 | non-literal language, conversation, style, scripting, emotion reading, implicit rules |
| SEN | 6 | 5 | 1 | 0 | auditory, tactile, visual, multisensory, olfactory |
| RTN | 6 | 5 | 1 | 0 | sameness, interests, detail perception, routines, novelty |
| LIT | 6 | 4 | 2 | 0 | fluency, spelling, letter confusion, oral reading, decoding, skimming |
| NUM | 6 | 3 | 2 | 1 | arithmetic, subitising, digit sequencing*, applied numeracy, magnitude, facts |
| MOT | 6 | 6 | 0 | 0 | clumsiness, handwriting, motor learning, fine motor, global, eye-hand |

\* `NUM-03` (digit transposition) is exploratory: no peer-reviewed evidence found, so it is collected but not scored.

**Part 2: everyday preferences ("comfort zone").** 8 items. They describe the environments a person feels best in, and feed a dimension only where research supports the link.

| ID | Topic | Format | Feeds | Evidence | Key sources |
|---|---|---|---|---|---|
| PRF-01 | light | bipolar (dim ↔ bright) | SEN (dim = higher) | emerging | [@kooij2014; @simmons2009; @bijlenga2017] |
| PRF-02 | sound | choice (5 options) | SEN *and* ATT | emerging | [@williams2021; @soderlund2007; @sikstrom2007] |
| PRF-03 | temperature | likert | SEN | emerging | [@cascio2008; @apa2022] |
| PRF-04 | humidity | likert | descriptive only | exploratory | none found |
| PRF-05 | food texture | likert | SEN | emerging | [@cermak2010; @kinnaird2019] |
| PRF-06 | movement | likert | IMP | emerging | [@sarver2015] |
| PRF-07 | daily rhythm | bipolar (morning ↔ night) | descriptive only | emerging | [@coogan2017] |
| PRF-08 | workspace | likert | RTN | established | [@apa2022] |

Design notes:
- **Sound (PRF-02)** is a choice item because two documented patterns point in opposite directions. Many autistic people have decreased sound tolerance and need silence [@williams2021]. Background noise can improve performance in ADHD, as predicted by the moderate-brain-arousal model [@soderlund2007; @sikstrom2007]. The options map to `SEN` and `ATT` separately.
- **Humidity (PRF-04)** has no published link to a neurodivergent profile that we could find. Following G-7.4 it is shown in the comfort-zone panel but has weight 0 until pilot data shows whether it carries signal.
- **Daily rhythm (PRF-07)** has evidence (evening chronotype in ADHD [@coogan2017]) but no matching dimension in v0. It is descriptive for now and a candidate for a future "Daily Rhythm" dimension.

**Attention checks:** 2 (`CHK-01`, `CHK-02`).

**Task `GNG`** (Go/No-Go, 60 trials, 25 % no-go, optional, experimental). Commission errors index response inhibition [@wright2014]; reaction-time variability is among the most robust ADHD-related markers [@kofler2013].

## 2. Type set (`content/type-set.yaml`)

### 2.1 Structure

Each type is a **prototype**: an idealised target level on every dimension.

```yaml
prototype:
  core:     { ATT: high, IMP: high, EXF: high }   # defines the type (core_weight)
  expected: { SEN: moderate }                      # supporting levels (peripheral_weight)
  # every other dimension: meta.default_level (low), peripheral weight
```

Levels map to numbers in `scoring.yaml → classification.levels` (high 75, moderate 50, low 20). A type with `assignment: fallback` has no prototype. The scoring engine assigns it when nothing fits (see [doc 03 §6](03-scoring-mechanism.md#6-type-classification)).

Content fields: `name`, `mascot`, `palette` (card colours), `tagline`, `associated_with`, `summary`, `strengths`, `challenges`, `support_tips`, `refs`.

### 2.2 Current types (v0.1.0)

| Type | Mascot | Core | Expected | Often associated with | Sources |
|---|---|---|---|---|---|
| The Spark | hummingbird | ATT, IMP, EXF high | SEN moderate | ADHD (combined) | [@apa2022; @kessler2005; @sedgwick2019] |
| The Daydreamer | otter | ATT, EXF high; IMP **low** | – | ADHD (predominantly inattentive) | [@apa2022; @seli2015] |
| The Deep Diver | octopus | SOC, SEN, RTN high | EXF moderate | autism | [@baroncohen2001; @bensasson2009; @hill2004; @russell2019] |
| The Kaleidoscope | raccoon | ATT, EXF, SOC, SEN, RTN high | IMP moderate | co-occurring autism + ADHD | [@rong2021; @bijlenga2017; @hull2019] |
| The Storyteller | fox | LIT high | NUM moderate | dyslexia | [@peterson2012; @landerl2010; @taylor2022] |
| The Wordsmith | parrot | NUM high | LIT moderate | dyscalculia | [@butterworth2011; @landerl2010] |
| The Improviser | penguin | MOT high | EXF moderate | dyspraxia / DCD | [@blank2019; @kirby2010] |
| The Tuner | rabbit | SEN high | RTN moderate | sensory processing sensitivity | [@aron1997; @dunn1997; @panagiotidi2018] |
| The Navigator | turtle | all dimensions low | – | no elevated pattern | [@lai2017; @haslam2020] |
| The Mosaic | chameleon | *fallback* | – | elevated traits in an unmatched combination | [@haslam2020] |

Design notes:
- The **moderate expectations** encode known co-occurrence. Reading and arithmetic difficulties often co-occur [@landerl2010], and executive difficulties accompany autism [@hill2004] and DCD [@blank2019]. A type is not penalised for these co-occurring traits.
- **The Navigator** carries an explicit caveat: camouflaging can hide traits in self-report, especially in women [@lai2017].
- **The Mosaic** stops the engine from forcing a poor match. This matters because profiles are dimensional, not discrete [@haslam2020].
- The prototypes are **expert-set placeholders**. Phase 6 of the roadmap replaces them with profiles from latent profile analysis of pilot data [@spurk2020].

### 2.3 Type-set rules

| Rule | Requirement |
|---|---|
| **T-1** [auto] | Palette colours are `#RRGGBB`. |
| **T-2** [auto] | Every `mascot` has an illustration (`src/app/components/mascot-ids.ts` + `Mascot.tsx`). |
| **T-3** [auto] | Prototype types have ≥ 1 core dimension; every dimension and level referenced exists. |
| **T-4** [auto] | No two prototypes are identical. |
| T-5 | `associated_with` starts with "Traits often associated with…" or describes a pattern. It never states a diagnosis. |
| T-6 | Strengths are "commonly reported" and tips are practical ideas, not treatments (G-7.7). |
| T-7 | A new or changed prototype must keep simulated recovery ≥ 85 % (`npm run simulate`); confusions above 10 % need a written justification. |

## 3. How to…

**Add an item.** Pick the next unused ID. Write it per guidelines §4. Fill `facet`, `rationale`, `evidence`. Add any new references. Then run `npm run validate && npm run verify-refs && npm run simulate && npm run docs`, bump the test-set MINOR version and add a changelog line.

**Retire an item.** Set `status: retired` (it disappears from the test and scoring but keeps its ID). Bump the version.

**Add a type.** Add the type (unique id, mascot, palette, prototype, texts, refs). If it needs a new mascot, draw it in `Mascot.tsx` and register it in `mascot-ids.ts`. Run `npm run simulate` and check the confusion matrix (T-7). Bump the type-set version and update `scoring.meta.type_set_version`.

**Add a dimension.** Add it to `dimensions` with ≥ 4 (target 6) items and its sources. Consider whether each type's prototype should mention it (the default is low). This is a MAJOR version change.

## 4. Known gaps (backlog for v0.2)

- No expert content review or cognitive interviews yet (roadmap phases 1-2).
- Not normed: scores are raw 0-100, not percentiles.
- Candidate new dimensions: daily rhythm/chronotype, interoception/alexithymia, tics.
- Preference items are single-item measures. Consider 2-3 items per topic if pilot data shows they carry signal.
- Cultural adaptation and translation not started (guidelines §10).
