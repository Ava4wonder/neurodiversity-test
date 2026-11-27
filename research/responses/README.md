# Pilot response exports

Put research exports (`nd-test-export-*.json`, downloaded from the results page) here, then run:

```bash
npm run analyze -- research/responses
```

**Do not commit response files.** They can contain self-reported diagnoses, so this folder is git-ignored. Store pilot data according to your ethics approval and data-protection plan (see docs/01 §9).
