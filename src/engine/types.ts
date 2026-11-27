// Typed shapes of the three content files (content/*.yaml) and of engine outputs.

export type Level = 'high' | 'moderate' | 'low';
export type Keying = 'forward' | 'reverse';
export type ItemStatus = 'draft' | 'pilot' | 'validated' | 'retired';
export type ItemFormat = 'likert' | 'bipolar' | 'choice';
export type EvidenceLevel = 'established' | 'emerging' | 'exploratory';

export interface Evidence {
  level: EvidenceLevel;
  refs: string[];
  basis: string;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  summary: string;
}

// ---------------------------------------------------------------- test set
export interface Dimension {
  id: string;
  name: string;
  short: string;
  construct: string;
  high_pole: string;
  low_pole: string;
  associated_with: string[];
  refs: string[];
  strengths: string[];
  challenges: string[];
}

export interface ChoiceOption {
  label: string;
  /** keyed value (on the response scale) per dimension */
  scores: Record<string, number>;
}

export interface Item {
  id: string;
  section: string;
  format?: ItemFormat; // default 'likert'
  /** likert/bipolar: the dimension scored. Omitted = descriptive only. */
  dimension?: string;
  keyed?: Keying;
  text: string;
  poles?: [string, string];
  options?: ChoiceOption[];
  topic?: string;
  icon?: string;
  facet: string;
  evidence: Evidence;
  rationale: string;
  status: ItemStatus;
  /** explicit weight overrides the evidence-level weight */
  weight?: number;
}

export interface Section {
  id: string;
  title: string;
  intro: string;
  order: 'interleaved' | 'as_listed';
  attention_checks: boolean;
}

export interface AttentionCheck {
  id: string;
  text: string;
  expected_value: number;
}

export interface GoNoGoParams {
  practice_trials: number;
  trials: number;
  nogo_ratio: number;
  stimulus_ms: number;
  response_window_ms: number;
  isi_ms: [number, number];
  anticipation_ms: number;
  seed: number;
}

export interface TaskDef {
  id: string;
  type: 'go_nogo';
  name: string;
  status: string;
  optional: boolean;
  description: string;
  refs: string[];
  params: GoNoGoParams;
  metrics: { id: string; description: string }[];
}

export interface TestSet {
  meta: {
    id: string;
    title: string;
    version: string;
    status: string;
    language: string;
    min_age: number;
    estimated_minutes: number;
    guidelines_version: string;
    changelog: ChangelogEntry[];
  };
  presentation: {
    items_per_page: number;
    shuffle_seed: number;
    allow_back: boolean;
    allow_skip_item: boolean;
  };
  sections: Section[];
  response_scale: {
    type: 'likert';
    points: number;
    values: number[];
    labels: string[];
    instruction: string;
  };
  dimensions: Dimension[];
  items: Item[];
  attention_checks: AttentionCheck[];
  tasks: TaskDef[];
}

// ---------------------------------------------------------------- type set
export interface Palette {
  primary: string;
  secondary: string;
  background: string;
  ink: string;
}

export interface TypeDef {
  id: string;
  name: string;
  mascot: string;
  palette: Palette;
  tagline: string;
  associated_with: string;
  assignment: 'prototype' | 'fallback';
  refs: string[];
  prototype?: {
    core: Record<string, Level>;
    expected: Record<string, Level>;
  };
  summary: string;
  strengths: string[];
  challenges: string[];
  support_tips: string[];
}

export interface TypeSet {
  meta: {
    version: string;
    status: string;
    test_set_version: string;
    default_level: Level;
    changelog: ChangelogEntry[];
  };
  types: TypeDef[];
}

// ---------------------------------------------------------------- scoring
export interface Band {
  id: string;
  label: string;
  min: number;
}

export interface TaskContribution {
  task: string;
  metric: string;
  dimension: string;
  weight: number;
  from: [number, number];
}

export interface ScoringConfig {
  meta: {
    version: string;
    status: string;
    test_set_version: string;
    type_set_version: string;
    changelog: ChangelogEntry[];
  };
  dimension_scoring: {
    method: 'keyed_mean';
    evidence_weights: Record<EvidenceLevel, number>;
    min_answered_ratio: number;
    decimals: number;
  };
  task_integration: {
    enabled: boolean;
    refs: string[];
    contributions: TaskContribution[];
    min_valid_go_trials: number;
  };
  bands: Band[];
  elevated_threshold: number;
  norms: {
    status: string;
    sample: unknown;
    dimensions: Record<string, { mean: number; sd: number }>;
  };
  classification: {
    method: 'weighted_prototype_distance';
    refs: string[];
    levels: Record<Level, number>;
    core_weight: number;
    peripheral_weight: number;
    temperature: number;
    min_fit: number;
    fallback: { type: string; requires_elevated: boolean };
    blend_margin: number;
    confidence: { id: string; label: string; min_probability: number }[];
  };
  validity: {
    refs: string[];
    attention_checks: { caution_if_failed: number; invalid_if_failed: number };
    consistency_pairs: {
      pairs: [string, string][];
      flag_if_keyed_gap_at_least: number;
      caution_if_flagged: number;
      invalid_if_flagged: number;
    };
    straightlining: { max_identical_run: number; min_response_sd: number };
    speed: {
      caution_median_seconds_per_item: number;
      invalid_median_seconds_per_item: number;
    };
  };
}

// ---------------------------------------------------------------- references
export interface Reference {
  key: string;
  type: 'article' | 'book' | 'web';
  authors: string;
  year: number;
  title: string;
  container?: string;
  volume?: number | string;
  issue?: number | string;
  pages?: string;
  publisher?: string;
  doi?: string;
  url?: string;
  supports: string;
}

export interface References {
  meta: { version: string; style: string };
  references: Reference[];
}

export interface Content {
  testSet: TestSet;
  typeSet: TypeSet;
  scoring: ScoringConfig;
  references: References;
}

// ---------------------------------------------------------------- session & results
/** Answers keyed by item or attention-check id. Value is on the response scale. */
export type Responses = Record<string, number>;
/** Milliseconds spent on each item or page, keyed by item id. */
export type Timings = Record<string, number>;

export interface GoNoGoMetrics {
  commission_rate: number;
  omission_rate: number;
  rt_mean_ms: number;
  rt_cv: number;
  valid_go_trials: number;
  go_trials: number;
  nogo_trials: number;
}

export type TaskResults = Record<string, GoNoGoMetrics | undefined>;

export interface Session {
  responses: Responses;
  timings?: Timings;
  /** Order in which items were presented (for straight-lining detection). */
  presentedOrder?: string[];
  tasks?: TaskResults;
}

export interface ItemTrace {
  itemId: string;
  format: ItemFormat;
  raw: number | null;
  keyed: number | null;
  keying: Keying | 'option';
  weight: number;
  evidence: EvidenceLevel;
}

export interface TaskTrace {
  task: string;
  metric: string;
  value: number;
  taskScore: number;
  weight: number;
}

export interface DimensionScore {
  dimensionId: string;
  questionnaireScore: number | null;
  score: number | null;
  band: Band | null;
  elevated: boolean;
  answered: number;
  total: number;
  sufficient: boolean;
  percentile: number | null;
  items: ItemTrace[];
  taskContributions: TaskTrace[];
}

export interface TypeMatch {
  typeId: string;
  distance: number;
  fit: number;
  probability: number;
  perDimension: { dimensionId: string; target: number; weight: number; score: number }[];
}

export interface Classification {
  primaryTypeId: string;
  secondaryTypeId: string | null;
  isBlend: boolean;
  usedFallback: boolean;
  confidence: { id: string; label: string };
  matches: TypeMatch[];
  signature: string[];
}

export type ValidityStatus = 'ok' | 'caution' | 'invalid';

export interface ValidityRuleResult {
  rule: string;
  status: ValidityStatus;
  detail: string;
}

export interface Validity {
  status: ValidityStatus;
  rules: ValidityRuleResult[];
}

export interface Report {
  generatedAt: string;
  versions: { testSet: string; typeSet: string; scoring: string };
  dimensions: DimensionScore[];
  classification: Classification;
  validity: Validity;
  tasksCompleted: string[];
}
