import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const monorepo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(monorepo, '..', '..', '..');

const APPS = [
  { ws: '@maga/boxhead', slug: 'boxhead' },
  { ws: '@maga/impossible', slug: 'impossible-game' },
  { ws: '@maga/burger-tycoon', slug: 'burger-tycoon' },
  { ws: '@maga/chicken-invaders', slug: 'chicken-invaders' },
  { ws: '@maga/chicken-invaders-original', slug: 'cluck-horizon' },
  { ws: '@maga/swords-and-sandals', slug: 'swords-and-sandals' },
];

for (const { ws, slug } of APPS) {
  console.log(`== build ${ws}`);
  const r = spawnSync('npm', ['run', 'build', '-w', ws], { cwd: monorepo, stdio: 'inherit', shell: false });
  if (r.error) throw r.error;
  if (r.status !== 0) {
    console.error(`build failed for ${ws} (exit ${r.status})`);
    process.exit(1);
  }
  const src = path.join(monorepo, 'apps', ws.replace('@maga/', ''), 'dist');
  if (!existsSync(src)) {
    console.error(`missing dist/ for ${ws}`);
    process.exit(1);
  }
  const dst = path.join(repoRoot, 'games', slug);
  rmSync(dst, { recursive: true, force: true });
  cpSync(src, dst, { recursive: true });
  console.log(`== staged games/${slug}`);
}
console.log('fleet build complete ->', path.join(repoRoot, 'games'));
