import { classify } from './classify';
import { scoreDimensions } from './score';
import { checkValidity } from './validity';
import type { Content, Report, Session } from './types';

export * from './types';
export { parseContent, activeItems, formatOf, itemDimensions, itemWeight } from './load';
export { buildQuestionOrder, paginateBySection } from './order';
export type { Question } from './order';
export { scoreDimensions, bandFor, keyValue, mapTo100 } from './score';
export { classify, prototypeTargets } from './classify';
export { checkValidity } from './validity';
export { buildTrials, computeGoNoGoMetrics } from './gonogo';
export type { Trial, TrialResult } from './gonogo';
export { validateContent } from './validate';

/** Full pipeline: responses (+ task metrics) -> traceable report. */
export function runScoring(content: Content, session: Session, now = new Date()): Report {
  const dimensions = scoreDimensions(content, session);
  return {
    generatedAt: now.toISOString(),
    versions: {
      testSet: content.testSet.meta.version,
      typeSet: content.typeSet.meta.version,
      scoring: content.scoring.meta.version,
    },
    dimensions,
    classification: classify(content, dimensions),
    validity: checkValidity(content, session),
    tasksCompleted: Object.entries(session.tasks ?? {})
      .filter(([, v]) => !!v)
      .map(([k]) => k),
  };
}
