// EMBERFALL — Duel of the Four Sigils
// Entry hand-in script: copies game/ and screenshots/ into MAKEFUN_OUTPUT_DIR (or /output)
// and generates dossier.json via the vendored makefun-game library.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

const gameSrc = join(rootDir, 'game');
const shotsSrc = join(rootDir, 'screenshots');
const gameDst = join(outputDir, 'game');
const shotsDst = join(outputDir, 'screenshots');

mkdirSync(outputDir, { recursive: true });
cpSync(gameSrc, gameDst, { recursive: true });

mkdirSync(shotsDst, { recursive: true });
if (existsSync(shotsSrc)) {
  cpSync(shotsSrc, shotsDst, { recursive: true });
}

const dossierBytes = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});

writeFileSync(join(outputDir, 'dossier.json'), dossierBytes);
console.log(`Packaged EMBERFALL into ${outputDir} (dossier.json: ${dossierBytes.byteLength} bytes)`);
