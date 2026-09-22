/* Clashbound — DOM UI. Human = P1 (bruiser/Vex), AI = P2 (bulwark/Thorn).
   Clash flow: engine calls CB.hooks.clashWindow; for the human defender we stash
   the decision and return PENDING — the engine keeps st.pendingAttack and the AI
   loop exits. resolveClash() applies the choice, resolves the attack, resumes AI. */
(function () {
  const CB = window.CB, E = CB.engine;
  let st, attacking = null, logLen = 0, aiBusy = false;
  let pendingClash = null; // {attacker, defender, cards:[{handIdx, card}]}

  const $ = (id) => document.getElementById(id);

  CB.hooks.humanSeat = 0;
  CB.hooks.humanClash = function (game, defPi, attacker, defender) {
    const p = game.players[defPi];
    const cards = [];
    p.hand.forEach((c, i) => { if (c.clashOnly && E.totalMana(p) >= c.cost) cards.push({ handIdx: i, card: c }); });
    if (!cards.length) return null;
    pendingClash = { attacker, defender, cards };
    render();
    return CB.hooks.PENDING;
  };

  function resolveClash(handIdx) {
    if (!pendingClash) return;
    const p = st.players[0];
    let ctx = null;
    if (handIdx !== null) {
      const c = p.hand[handIdx];
      if (c && c.clashOnly && E.totalMana(p) >= c.cost) {
        p.hand.splice(handIdx, 1);
        E.pay(p, c.cost);
        ctx = { attacker: pendingClash.attacker, defender: pendingClash.defender, negate: false };
        E.say(st, `CLASH: P1 plays ${c.name}`);
        c.effect(st, 0, ctx);
        p.discard.push(c);
      }
    }
    pendingClash = null;
    E.resolveAttack(st, ctx);
    resumeAI();
  }

  function resumeAI() {
    // continue the AI turn that paused on our clash decision
    if (st.winner !== null) { aiBusy = false; render(); return; }
    CB.ai.takeTurn(st, 1);
    if (st.pendingAttack) { render(); return; } // paused again on another clash
    E.endTurn(st);
    aiBusy = false;
    if (st.winner === null) E.startTurn(st);
    render();
  }

  function newGame() {
    st = E.newGame(CB.cards.DECKS.bruiser, CB.cards.DECKS.bulwark,
      CB.heroes.byId.vex, CB.heroes.byId.thorn, (Math.random() * 1e9) | 0);
    attacking = null; logLen = 0; aiBusy = false; pendingClash = null;
    $("log").innerHTML = "";
    E.startTurn(st); // auto-resolves mulligan for now (UI mulligan: R2)
    render();
  }

  function kw(m) {
    const k = m.card.keywords.join(" ");
    return k + (m.sick ? " · zzz" : "") + (m.card.keywords.includes("Ward") ? (m.wardUsed ? " ·ward×" : " ·ward") : "");
  }

  function minionEl(m, mine) {
    const el = document.createElement("div");
    el.className = "minion" +
      (m.card.keywords.includes("Guard") ? " guard" : "") +
      (m.sick ? " sick" : "");
    el.innerHTML = `<div class="name">${m.card.name}</div><div class="kw">${kw(m)}</div><div class="stats">${m.atk}/${m.hp}</div>`;
    if (mine && !m.sick && !m.attacked && st.winner === null && !aiBusy && !pendingClash) {
      el.classList.add("canatk");
      el.onclick = () => { attacking = attacking === m ? null : m; render(); };
    }
    if (attacking && !mine) {
      const legal = E.legalTargets(st, 0);
      if (legal.includes(m)) { el.classList.add("targetable"); el.onclick = () => { E.attack(st, 0, attacking.uid, m); attacking = null; render(); }; }
    }
    if (attacking === m) el.classList.add("selected");
    return el;
  }

  function pips(cp, mine) {
    let s = "";
    for (let i = 0; i < E.CONTEST_TARGET; i++) s += `<span class="pip${i < cp ? " on" : ""}${mine ? " mine" : ""}"></span>`;
    return s;
  }

  function render() {
    const me = st.players[0], opp = st.players[1];
    const myAtk = me.board.reduce((s, m) => s + m.atk, 0);
    const opAtk = opp.board.reduce((s, m) => s + m.atk, 0);
    $("oppbar").innerHTML = `<b>${opp.hero.name}</b> HP ${opp.hp} · hand ${opp.hand.length} · deck ${opp.deck.length} · board ATK ${opAtk}`;
    $("mybar").innerHTML = `<b>${me.hero.name}</b> HP ${me.hp} · deck ${me.deck.length} · mana <b>${me.mana + me.tempMana}</b>${me.tempMana ? " (+" + me.tempMana + " surge)" : ""} · board ATK ${myAtk}`;
    $("cp").innerHTML = `<span class="cplabel">YOU</span> ${pips(me.cp, true)} <b>${me.cp}</b> — <b>${opp.cp}</b> ${pips(opp.cp, false)} <span class="cplabel">AI</span>`;
    $("turn").textContent = st.winner !== null
      ? `GAME OVER — ${st.winner === 0 ? "YOU WIN" : "AI WINS"} (${st.winReason})`
      : pendingClash ? "CLASH — defend!" : aiBusy ? "AI thinking…" : `YOUR TURN ${st.turn}`;

    const ob = $("oppboard"); ob.innerHTML = "";
    for (let i = 0; i < E.BOARD_CAP; i++) {
      const s = document.createElement("div"); s.className = "slot";
      if (opp.board[i]) s.appendChild(minionEl(opp.board[i], false));
      ob.appendChild(s);
    }
    if (attacking && E.legalTargets(st, 0).includes("hero")) {
      $("oppbar").style.outline = "3px solid #d9534f";
      $("oppbar").onclick = () => { E.attack(st, 0, attacking.uid, "hero"); attacking = null; render(); };
    } else { $("oppbar").style.outline = ""; $("oppbar").onclick = null; }

    const mb = $("myboard"); mb.innerHTML = "";
    for (let i = 0; i < E.BOARD_CAP; i++) {
      const s = document.createElement("div"); s.className = "slot";
      if (me.board[i]) s.appendChild(minionEl(me.board[i], true));
      mb.appendChild(s);
    }

    const h = $("hand"); h.innerHTML = "";
    me.hand.forEach((c, i) => {
      const el = document.createElement("div");
      const afford = E.canPlay(st, 0, c) && !c.clashOnly;
      el.className = "card" + (afford ? "" : " unaffordable");
      const stat = c.type === "minion" ? ` ${c.atk}/${c.hp}` : "";
      const kws = (c.keywords || []).join(" ") + (c.clashOnly ? " Clash" : "");
      el.innerHTML = `<span class="cost">${c.cost}</span><span class="name">${c.name}</span><div class="txt">${kws}${stat}</div><div class="txt">${c.text || ""}</div>`;
      if (afford && st.winner === null && !aiBusy && !pendingClash) el.onclick = () => {
        const target = c.needsTarget ? st.players[1].board.reduce((a, b) => (b.atk > a.atk ? b : a), null) : null;
        E.playCard(st, 0, i, target); render();
      };
      h.appendChild(el);
    });

    // clash prompt
    const cp = $("clashprompt");
    if (pendingClash) {
      cp.style.display = "flex";
      const at = pendingClash.attacker;
      const df = pendingClash.defender;
      $("clashinfo").textContent = `${at.card.name} (${at.atk}/${at.hp}) attacks ${df === "hero" ? "YOUR HERO" : df.card.name} — play a Clash spell?`;
      const btns = $("clashcards"); btns.innerHTML = "";
      for (const { handIdx, card } of pendingClash.cards) {
        const b = document.createElement("button");
        b.textContent = `${card.name} (${card.cost})`;
        b.title = card.text || "";
        b.onclick = () => resolveClash(handIdx);
        btns.appendChild(b);
      }
    } else cp.style.display = "none";

    $("power").disabled = me.powerUsed || E.totalMana(me) < 2 || st.winner !== null || aiBusy || !!pendingClash;
    $("power").textContent = `${me.hero.powerName.split("(")[0].trim()} (2)`;
    $("endturn").disabled = st.winner !== null || aiBusy || !!pendingClash;

    const lg = $("log");
    const fresh = st.log.slice(logLen);
    if (fresh.length) {
      lg.innerHTML += fresh.map((l) => `<div class="new">${l}</div>`).join("");
      logLen = st.log.length;
      lg.scrollTop = lg.scrollHeight;
    }
  }

  $("endturn").onclick = () => {
    if (aiBusy || pendingClash) return;
    attacking = null;
    E.endTurn(st);
    if (st.winner !== null) { render(); return; }
    aiBusy = true;
    render();
    setTimeout(() => {
      E.startTurn(st);
      CB.ai.takeTurn(st, 1);
      if (st.pendingAttack) { render(); return; } // clash prompt — resolveClash resumes
      E.endTurn(st);
      aiBusy = false;
      if (st.winner === null) E.startTurn(st);
      render();
    }, 350);
  };
  $("power").onclick = () => {
    const me = st.players[0];
    const t = me.hero.id === "thorn" ? me.board[0] : (st.players[1].board[0] || me.board[0]);
    if (t) { E.heroPower(st, 0, t); render(); }
  };
  $("decline").onclick = () => resolveClash(null);
  $("newgame").onclick = newGame;

  newGame();
})();
