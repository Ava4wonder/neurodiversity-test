/**
 * Validate content/*.yaml against the Question Bank Design Guidelines.
 *   npm run validate
 * Exits 1 on errors (this blocks `npm run build`). Warnings are printed
 * but don't fail.
 */
import { validateContent } from '../src/engine/validate';
import { MASCOT_IDS } from '../src/app/components/mascot-ids';
import { citedKeysInDocs, loadContentFromDisk } from './lib/load-node';

const content = loadContentFromDisk();
const result = validateContent(content, { extraCitedKeys: citedKeysInDocs(), knownMascots: MASCOT_IDS });

console.log(
  `Content: test set v${content.testSet.meta.version} | type set v${content.typeSet.meta.version} | scoring v${content.scoring.meta.version} | references v${content.references.meta.version}`,
);
console.log('Stats:', Object.entries(result.stats).map(([k, v]) => `${k}=${v}`).join('  '));
if (result.warnings.length) console.log(`\n${result.warnings.length} warning(s):\n  ` + result.warnings.join('\n  '));
if (result.errors.length) {
  console.error(`\n${result.errors.length} error(s):\n  ` + result.errors.join('\n  '));
  process.exit(1);
}
console.log('\n✓ Content is valid.');
