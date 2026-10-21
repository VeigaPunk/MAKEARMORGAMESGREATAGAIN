// Headless play-through of the shared Frostbite simulation.
//   node games/frostbite/tools/bot.mjs [seeds] [mode]
// A greedy builder plays each seed until game over (or level 13) and reports
// igloos built, deaths by cause and the score, proving every level type can
// be built and entered before the temperature runs out.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const sandbox = {};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(readFileSync(new URL('../core.js', import.meta.url), 'utf8'), sandbox);
vm.runInContext(readFileSync(new URL('./brain.js', import.meta.url), 'utf8'), sandbox);
const Core = sandbox.FrostbiteCore;
const decide = sandbox.FrostbiteBrain(Core);

const seeds = Number(process.argv[2] || 12);
const mode = Number(process.argv[3] || 1);
let totalLevels = 0;
const causes = {};
for (let s = 1; s <= seeds; s++) {
  const g = new Core.Game(s * 7919);
  if (mode !== 1) g.selectMode(mode);
  g.update(1 / 60, { start: true });
  let cleared = 0, frames = 0, tempsLeft = [], maxLevel = g.level;
  while (g.state !== 'over' && frames < 60 * 60 * 25 && g.level < 13) {
    const ev = g.update(1 / 60, decide(g));
    frames++;
    for (const e of ev) {
      if (e.type === 'inside') { cleared++; tempsLeft.push(g.temp); }
      if (['drown', 'freeze', 'bear'].includes(e.type)) causes[e.type] = (causes[e.type] || 0) + 1;
    }
    maxLevel = Math.max(maxLevel, g.level);
  }
  totalLevels += cleared;
  console.log(`seed ${s}: cleared ${cleared} igloos, reached level ${maxLevel}, score ${g.players[0].score}, ` +
    `temp left ${tempsLeft.join('/')}, ${(frames / 60).toFixed(0)}s, state ${g.state}`);
}
console.log('avg igloos per game', (totalLevels / seeds).toFixed(2), 'deaths', JSON.stringify(causes));
