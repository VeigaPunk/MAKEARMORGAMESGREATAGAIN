/* Combo B: guard-no-contest + pierce-bypass + trickster-rebuild + bulwark-trim */
const CB = globalThis.CB;
CB.engine.GUARD_NO_CONTEST = true;
CB.engine.PIERCE_BYPASS = true;
require("./trickster-rebuild.js");
require("./bulwark-trim.js");
