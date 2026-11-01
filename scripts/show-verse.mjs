#!/usr/bin/env node
/**
 * Read-only helper for writers: prints a passage live from the verified providers in
 * every supported translation. Writes nothing.
 *
 * Usage: node scripts/show-verse.mjs "Psalm 56:3" ["John 1:14" ...]
 */
import { TRANSLATIONS, fetchPassage } from './lib/scripture-providers.mjs';

for (const ref of process.argv.slice(2)) {
  console.log(`\n${ref}`);
  for (const code of TRANSLATIONS) {
    try {
      const p = await fetchPassage(code, ref);
      console.log(`  ${code.padEnd(4)} ${p.text}`);
    } catch (e) {
      console.log(`  ${code.padEnd(4)} ERROR: ${e.message}`);
    }
  }
}
