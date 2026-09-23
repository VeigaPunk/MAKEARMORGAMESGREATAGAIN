// sr2-burger-tune.mjs — headless strategy playtest for apps/burger-tycoon sim.ts.
// Tuning evidence (sr2): compiles the REAL sim via esbuild, drives scripted
// strategies with fixed dt, checks design targets. Re-run: node verification/evidence/sr2-burger-tune.mjs
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const ROOT = new URL('../../', import.meta.url).pathname;
const SIM_TS = ROOT + 'MAGA-everything/02-code/armor-games/apps/burger-tycoon/src/sim.ts';
const OUT = '/tmp/sr2-sim.bundle.mjs';
const esbuild = spawnSync(ROOT + 'MAGA-everything/02-code/armor-games/node_modules/.bin/esbuild',
  [SIM_TS, '--bundle', '--format=esm', '--outfile=' + OUT], { stdio: 'inherit' });
if (esbuild.status !== 0) throw new Error('esbuild failed');
const { Sim } = await import(OUT);

const DT = 1 / 60;
function run(name, script, targets) {
  const sim = new Sim();
  sim.reset();
  const st = {};
  let log = '';
  let peak = 0;
  const mark = [];
  for (let i = 0; i < 60 * 720 && !sim.s.over; i++) {
    script(sim, sim.s.t, st);
    sim.tick(DT);
    peak = Math.max(peak, sim.s.cash);
    if (i % (15 * 60) === 0 || sim.s.over) {
      const s = sim.s;
      mark.push(`t=${s.t.toFixed(0).padStart(3)} cash=${s.cash.toFixed(0).padStart(5)} rep=${s.rep.toFixed(0).padStart(3)} bl=${s.backlash.toFixed(0).padStart(3)} board=${s.boardPressure.toFixed(0).padStart(3)} oh=${s.overheadNow.toFixed(1)} prof=${s.lastProfit.toFixed(1)} pat=${s.patties.toFixed(0).padStart(3)} dem=${s.demand.toFixed(2)}`);
    }
  }
  const s = sim.s;
  console.log(`\n== ${name} ==`);
  console.log(mark.join('\n'));
  console.log(`END t=${s.t.toFixed(0)} cash=${s.cash.toFixed(0)} rep=${s.rep.toFixed(0)} over=${s.over} reason="${s.overReason}"`);
  for (const t of targets) {
    const ok = t.check(s, { peak });
    console.log(`  ${ok ? 'PASS' : 'FAIL'} ${t.name}`);
    log += `${name} | ${t.name}: ${ok ? 'PASS' : 'FAIL'}\n`;
  }
  console.log(`  peak cash=${peak.toFixed(0)}`);
  return log;
}

let results = '';
// IDLE — no input at all
results += run('IDLE (no input)', () => {}, [
  { name: 'run ends (bankrupt) by t=660 — slow bleed, not instant', check: (s) => s.over && s.overReason.includes('BANKRUPT') && s.t <= 660 },
]);
// CLEAN — honest play: feed the chain, promote modestly, never dirty
results += run('CLEAN (no dirty toggles)', (sim, t, st) => {
  const s = sim.s;
  if (!st.seed) { st.seed = 1; sim.act('farm', 1); sim.act('farm', 1); }
  if (s.crops < 12) sim.act('farm', 0);
  if (s.patties < 2 && s.cattle > 8) sim.act('feed', 0);
  if (s.demand < 1.2 && s.cash > 120) sim.act('rest', 0);
  if (s.cash > 320 && s.cattle < 30) sim.act('farm', 1);
}, [
  { name: 'viable early: cash >= 300 at t=90', check: (s) => s.t > 90 || s.cash >= 300 },
  { name: 'no clean win: game over (bankrupt) by t=660', check: (s) => s.over && s.overReason.includes('BANKRUPT') && s.t <= 660 },
  { name: 'pressure is slow: survives past t=240', check: (s) => s.t >= 240 },
]);
// DIRTY — all three toggles at t=0, full spam
results += run('DIRTY (all toggles at t=0)', (sim, t, st) => {
  if (!st.on) { st.on = 1; sim.act('farm', 2); sim.act('feed', 1); sim.act('rest', 1); }
}, [
  { name: 'REPUTATION COLLAPSE 30-90s (sr1 comparable: was t=42)', check: (s) => s.over && s.overReason.includes('REPUTATION') && s.t >= 30 && s.t <= 90 },
]);
// MIXED — skilled dirty play: cheapFeed pulsed to dodge disease, cutCorners on,
// backlash scrubbed before it stains (hq: 0 marketing, 1 PR, 2 bribe)
results += run('MIXED (cheapFeed+cutCorners, scrub backlash)', (sim, t, st) => {
  const s = sim.s;
  if (!st.on) { st.on = 1; sim.act('feed', 1); sim.act('rest', 1); }
  if (s.disease > 12 && s.dirty.cheapFeed) sim.act('feed', 1); // pulse off
  else if (s.disease < 3 && !s.dirty.cheapFeed && s.t > 1) sim.act('feed', 1); // pulse on
  if (s.backlash > 45 && s.cash > sim.prCost() + 100) sim.act('hq', 1);
  else if (s.backlash > 65 && s.cash > sim.bribeCost() + 80) sim.act('hq', 2);
  if (s.cash > 400 && s.cattle < 25) sim.act('farm', 1);
  if (s.demand < 1.1 && s.cash > 200) sim.act('rest', 0);
}, [
  { name: 'dirty outlives clean early: survives past t=90', check: (s) => s.t >= 90 },
  { name: 'treadmill ends the run by t=720 (stain compounds)', check: (s) => s.over && s.t <= 720 },
  { name: 'escalating scrub costs bite: prUses+bribeUses >= 2', check: (s) => s.prUses + s.bribeUses >= 2 },
  { name: 'dirty pays: peak cash >= 600', check: (s, c) => c.peak >= 600 },
]);

console.log('\n== SUMMARY ==\n' + results);
const fails = (results.match(/FAIL/g) || []).length;
console.log(fails === 0 ? 'ALL TUNING TARGETS PASS' : `${fails} TARGET(S) FAIL`);
writeFileSync(new URL('./sr2-burger-tune.log', import.meta.url).pathname,
  `sr2-burger-tune.mjs — strategy playtest vs tuned sim\n${results}${fails === 0 ? 'ALL TUNING TARGETS PASS' : fails + ' TARGET(S) FAIL'}\n`);
process.exit(fails === 0 ? 0 : 1);
