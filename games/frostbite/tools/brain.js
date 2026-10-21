// A greedy igloo builder used by the verification tools: headless (bot.mjs)
// and in the real page (verify.mjs), where it plays through key events.
(function (root) {
  'use strict';
  root.FrostbiteBrain = function (Core) {
    var C = Core.C;
    function hazardNear(g, row, x, frames) {
      for (var f of g.critters) {
        if (f.row !== row || f.kind === 'fish') continue;
        for (var i = 0; i < f.n; i++) {
          if (!f.alive[i]) continue;
          var mx = f.x + i * C.FLOCK_GAP + f.vx * frames;
          if (Math.abs(mx - x) < 12) return true;
        }
      }
      return false;
    }

    function safeLanding(g, row, xLand) {
      if (row < 0) return true;
      var vx = g.rows[row].dir * g.rows[row].speed;
      for (var k = 0; k <= 14; k += 2) {
        var x = Math.max(C.LEFT, Math.min(C.RIGHT - 8, xLand + vx * k));
        if (!g.supportedAt(row, x, C.JUMP_FRAMES + k)) return false;
      }
      return !hazardNear(g, row, xLand, C.JUMP_FRAMES);
    }

    var plan = 0;
    function decide(g) {
      var b = g.bailey;
      var inp = { left: false, right: false, up: false, down: false, fire: false };
      if (g.state !== 'play') return inp;
      if (b.air) {
        // keep steering the way the jump was planned
        if (plan < 0) inp.left = true;
        if (plan > 0) inp.right = true;
        return inp;
      }
      plan = 0;
      if (b.cool > 0) return inp;
      var out = choose(g, inp);
      if (out.down || out.up) plan = out.left ? -1 : out.right ? 1 : 0;
      return out;
    }

    function choose(g, inp) {
      var b = g.bailey;
      var air = Math.min(1.8, 1 + 0.1 * (Math.min(g.level, 9) - 1));
      var done = g.iglooComplete();

      if (b.row < 0) {
        if (done) {
          var target = C.DOOR_X;
          if (Math.abs(b.x - target) > 6) inp[b.x < target ? 'right' : 'left'] = true;
          else inp.up = true;
          if (g.bear.active && Math.abs(g.bear.x + 8 - (b.x + 4)) < 14) {
            // bear in the way: dodge back to the water
            inp.up = false;
          } else return inp;
        }
        for (var h of [0, -1, 1]) {
          var xl = b.x + h * air * C.JUMP_FRAMES;
          if (safeLanding(g, 0, xl)) { inp.down = true; if (h < 0) inp.left = true; if (h > 0) inp.right = true; return inp; }
        }
        if (g.bear.active) {
          // The far-left corner is out of the bear's reach.
          var bc = g.bear.x + 8;
          if (Math.abs(bc - (b.x + 4)) < 40) inp[bc > b.x + 4 ? 'left' : 'right'] = true;
        }
        return inp;
      }

      // Igloo done and on the first row: line up with the door and lose the bear first.
      if (done && b.row === 0) {
        var bear = g.bear, me = b.x + 4, dc = C.DOOR_X + 4;
        var bc = bear.active ? bear.x + 8 : -999;
        var vx0 = g.rows[0].dir * g.rows[0].speed;
        if (Math.abs(me - dc) < 10 && (!bear.active || Math.abs(bc - me) > 34)) { inp.up = true; return inp; }
        var goal = dc;
        if (bear.active && Math.abs(bc - dc) < 40) goal = 24;
        var want = goal > me ? 1 : -1;
        if (Math.sign(vx0) !== want && Math.abs(goal - me) > 6) inp.fire = true;
        var stay = (x) => { for (var k = 1; k <= 12; k++) if (!g.supportedAt(0, Math.max(C.LEFT, Math.min(C.RIGHT - 8, x + vx0 * k)), k)) return false; return true; };
        if (stay(b.x + want * 2)) inp[want > 0 ? 'right' : 'left'] = true;
        else if (!stay(b.x)) inp[want > 0 ? 'left' : 'right'] = true;
        return inp;
      }

      // Candidate jumps, best first.
      var cands = [];
      if (done) cands.push(b.row - 1);
      else {
        var up = b.row - 1, dn = b.row + 1;
        if (dn <= 3 && !g.rows[dn].blue) cands.push(dn);
        if (up >= 0 && !g.rows[up].blue) cands.push(up);
        // otherwise head toward the nearest white row
        var white = -1, best = 9;
        for (var r = 0; r < 4; r++) if (!g.rows[r].blue && Math.abs(r - b.row) < best) { best = Math.abs(r - b.row); white = r; }
        if (white >= 0 && !cands.length) cands.push(white > b.row ? dn : up);
      }
      var danger = hazardNear(g, b.row, b.x, 10);
      if (danger) { if (b.row < 3) cands.push(b.row + 1); cands.push(b.row - 1); }

      for (var t of cands) {
        if (t > 3) continue;
        for (var h of [0, -1, 1]) {
          var xl = Math.max(C.LEFT, Math.min(C.RIGHT - 8, b.x + h * air * C.JUMP_FRAMES));
          if (safeLanding(g, t, xl)) {
            if (t > b.row) inp.down = true; else inp.up = true;
            if (h < 0) inp.left = true;
            if (h > 0) inp.right = true;
            return inp;
          }
        }
      }
      // Stay on the ice: drift toward the middle of the piece we stand on and away from the edges.
      var vx = g.rows[b.row].dir * g.rows[b.row].speed;
      var okStay = (x) => { for (var k = 1; k <= 16; k++) if (!g.supportedAt(b.row, Math.max(C.LEFT, Math.min(C.RIGHT - 8, x + vx * k)), k)) return false; return true; };
      if (!okStay(b.x)) {
        if (okStay(b.x + 6)) inp.right = true; else if (okStay(b.x - 6)) inp.left = true;
        else inp[vx > 0 ? 'left' : 'right'] = true;
      }
      if (b.x < 20 && vx < 0) inp.right = true;
      if (b.x > 136 && vx > 0) inp.left = true;
      return inp;
    }

    return decide;
  };
})(typeof window !== 'undefined' ? window : globalThis);
