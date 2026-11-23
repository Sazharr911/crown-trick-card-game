// CROWN TRICK — hand-in program for the make.fun "Make the best card game"
// bounty (Node 22, standard library only, no build step).
//
// The game itself is the static site in game/ beside this file: plain HTML,
// CSS and ES modules that a desktop browser runs fully offline. This program
// is the courier, not the game. It carries game/ and screenshots/ into the
// output directory and writes dossier.json there with the vendored make.fun
// library, so the judge receives exactly the bytes that were reviewed here.
//
// Run it the way the grader does:
//   node main.ts                      (writes to /output)
// Outside the grader's container, point MAKEFUN_OUTPUT_DIR at a scratch dir:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Play the game locally instead with:  node serve.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Pre-flight: fail loudly here rather than hand the scorer a broken entry.
// The game must have its page, and the dossier builder insists on at least
// one screenshot (the first by name is the cover).
if (!existsSync(join(repoDir, 'game', 'index.html'))) {
  throw new Error('crown-trick: game/index.html is missing — nothing to hand in');
}
const shotsDir = join(repoDir, 'screenshots');
const shotFiles = existsSync(shotsDir)
  ? readdirSync(shotsDir).filter((name) => /\.(png|jpe?g)$/i.test(name))
  : [];
if (shotFiles.length === 0) {
  throw new Error('crown-trick: screenshots/ holds no PNG or JPEG — capture the game first');
}

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoDir, 'game'), join(outputDir, 'game'), { recursive: true });
cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });

// The caps mirror the scorer's gate for this bounty: past them the scorer
// refuses the entry, so this program refuses first, with a clearer message.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

console.log(`crown-trick: handed in game/ and screenshots/ to ${outputDir}`);
