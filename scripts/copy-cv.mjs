// The CV in the repo root is the one to edit. Copy it to public/cv.pdf
// (served at /cv.pdf) before every dev run and build, so the two never drift.
import { copyFile, access } from 'node:fs/promises';

const source = 'Abdullah Erzin – CV.pdf';
const target = 'public/cv.pdf';

try {
  await access(source);
  await copyFile(source, target);
  console.log(`Copied "${source}" to ${target}`);
} catch {
  console.warn(`"${source}" not found; keeping the existing ${target}`);
}
