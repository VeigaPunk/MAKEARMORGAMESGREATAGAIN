import { Sfx, fitIntegerScale, letterboxOffset, load, save, viewport } from '@maga/arcade-core';
import { playCue, startArenaMusic } from './audio';
import { initArena, paintArena, spawnFloat, spawnHit, spawnLunge, type FighterView, type WeaponKind } from './arena';

/**
 * Arena of Bonks (evocation of Swords & Sandals 2) — Canvas2D arena RPG with
 * DOM chrome. Create a gladiator, climb the turn-based ladder, kit up at the
 * smithy. Title → create → hub ⇄ arena/shop → defeat/complete; every state
 * has an exit (Esc backs out or opens settings).
 */

type Stat = 'strength'|'agility'|'vitality'|'defense';
type Mode = 'title'|'create'|'hub'|'arena'|'shop'|'defeat'|'complete';
interface Gladiator { name:string; look:string; stats:Record<Stat,number>; hp:number; maxHp:number; gold:number; xp:number; level:number; weapon:number; armor:number; potions:number }
interface Opponent { name:string; hp:number; maxHp:number; strength:number; defense:number; weapon:WeaponKind; skin:string; champion?:boolean }
interface SaveData { gladiator:Gladiator; defeated:number; owned?:string[] }
const STATS:Stat[]=['strength','agility','vitality','defense'];
const SKINS:Record<string,string>={Scarlet:'#e43a3a',Azure:'#3f8ce0',Gold:'#e6b83c'};
// sr1-tuned ladder baseline (ship-records/swords-and-sandals.md D-54): proven
// winnable end-to-end with real input — do not retune. Pommel added sr2 as the
// proto-parity mid-ladder bout (slot 4 of 5, before the Champion).
const opponents=[{name:'Tin Can Tim',hp:34,strength:6,defense:2,weapon:'club' as WeaponKind,skin:'#e8b88a'},
  {name:'Baron Bonk',hp:48,strength:8,defense:4,weapon:'sword' as WeaponKind,skin:'#c98a5a'},
  {name:'The Sand Snorter',hp:56,strength:9,defense:4,weapon:'axe' as WeaponKind,skin:'#8a5a3a'},
  {name:'Praetor Pommel',hp:60,strength:9,defense:5,weapon:'shield' as WeaponKind,skin:'#a8875a'},
  {name:'Emperor’s Champion',hp:66,strength:10,defense:6,weapon:'axe' as WeaponKind,skin:'#7a4a3a',champion:true}];
// sr1 shop baseline (D-54): kit total 100g, purchasable from the first three
// purses (25+35+45=105g); gates unchanged from the shipped slice.
const items=[{name:'Bent Bronze Sword',kind:'weapon',price:20,gate:1,bonus:3},{name:'Lucky Sandals',kind:'armor',price:32,gate:2,bonus:3},{name:'Imperial Buckler',kind:'armor',price:48,gate:2,bonus:5}];
const stage=document.querySelector<HTMLCanvasElement>('#stage')!; const hud=document.querySelector('#hud')!; const chrome=document.querySelector('#chrome')!; const actions=document.querySelector('#actions')!; const logEl=document.querySelector('#log')!; const settingsEl=document.querySelector('#settings')!; const volMusicEl=document.querySelector<HTMLInputElement>('#vol-music')!; const volSfxEl=document.querySelector<HTMLInputElement>('#vol-sfx')!; const muteBoxEl=document.querySelector<HTMLInputElement>('#mute-box')!; const sfx=new Sfx();
initArena(stage);
const esc=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const LOOKS=['Scarlet','Azure','Gold'];
function validSave(s:SaveData|null):s is SaveData{const g=s?.gladiator;return !!g&&Number.isInteger(s.defeated)&&s.defeated>=0&&s.defeated<=opponents.length&&typeof g.name==='string'&&typeof g.look==='string'&&(['strength','agility','vitality','defense'] as Stat[]).every(k=>typeof g.stats?.[k]==='number')&&(['hp','maxHp','gold','xp','level','weapon','armor','potions'] as const).every(k=>typeof g[k]==='number')&&(s.owned===undefined||Array.isArray(s.owned)&&s.owned.every(x=>typeof x==='string'))}
let selectedLook='Scarlet', logLines=['Welcome, challenger.']; let opponent:Opponent|null=null; let opponentIdx=-1; let turn=0; let guarded=false; let rawSave=load<SaveData|null>('swords-and-sandals','slot',null); let saveData=validSave(rawSave)?rawSave:null; let defeated=saveData?.defeated ?? 0, owned=saveData?.owned ?? []; let mode:Mode='title', points=0; let g:Gladiator=saveData?.gladiator ?? {name:'',look:selectedLook,stats:{strength:2,agility:2,vitality:2,defense:2},hp:30,maxHp:30,gold:0,xp:0,level:1,weapon:0,armor:0,potions:2};
if(!LOOKS.includes(g.look))g.look='Scarlet';
function log(s:string){logLines=[s,...logLines].slice(0,8);logEl.textContent='';for(const x of logLines){const d=document.createElement('div');d.textContent=x;logEl.appendChild(d)}}
function persist(){save('swords-and-sandals','slot',{gladiator:g,defeated,owned} satisfies SaveData)}
function level(){g.level=1+Math.floor(g.xp/40);}
// audio settings — persisted under the app prefix, reachable from title/hub via
// the fixed SETTINGS button and from Esc anywhere.
interface AudioSettings{music:number;sfx:number;muted:boolean}
let audio=load<AudioSettings>('swords-and-sandals','audio',{music:0.7,sfx:0.85,muted:false});
function applyAudio(){sfx.musicVolume=audio.music;sfx.sfxVolume=audio.sfx;sfx.muted=audio.muted;volMusicEl.value=String(Math.round(audio.music*100));volSfxEl.value=String(Math.round(audio.sfx*100));muteBoxEl.checked=audio.muted;save('swords-and-sandals','audio',audio)}
function openSettings(){settingsEl.classList.remove('hidden');playCue(sfx,'click')}
function closeSettings(){settingsEl.classList.add('hidden');playCue(sfx,'click')}
volMusicEl.addEventListener('input',()=>{audio.music=Number(volMusicEl.value)/100;applyAudio()});
volSfxEl.addEventListener('input',()=>{audio.sfx=Number(volSfxEl.value)/100;applyAudio();playCue(sfx,'click')});
muteBoxEl.addEventListener('change',()=>{audio.muted=muteBoxEl.checked;applyAudio()});
document.querySelector('#settings-close')!.addEventListener('click',closeSettings);
document.querySelector('#settings-btn')!.addEventListener('click',()=>settingsEl.classList.contains('hidden')?openSettings():closeSettings());
let musicStarted=false;
function ensureMusic(){if(musicStarted)return;musicStarted=true;startArenaMusic(sfx)}
window.addEventListener('pointerdown',ensureMusic);
window.addEventListener('keydown',ensureMusic);
window.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(!settingsEl.classList.contains('hidden')){closeSettings();return}if(mode==='shop'||mode==='complete'||mode==='defeat')mode='hub';else if(mode==='create'||mode==='hub')mode='title';else if(mode==='arena'){openSettings();return}render()});
function render(){hud.innerHTML=`<span>${mode.toUpperCase()} · ${esc(g.name)||'Unnamed gladiator'}</span><span>HP ${g.hp}/${g.maxHp} · Gold ${g.gold} · XP ${g.xp} · Lv ${g.level}</span>`; chrome.innerHTML=''; actions.innerHTML=''; if(mode==='title')renderTitle(); else if(mode==='create')renderCreate(); else if(mode==='hub')renderHub(); else if(mode==='arena')renderArena(); else if(mode==='shop')renderShop(); else if(mode==='defeat')renderDefeat(); else {chrome.innerHTML='<h1>ARENA CONQUERED</h1><p>Every champion lies in the sand. The crowd chants your name; your save remains safe.</p>'; addButton('Return to Hub',()=>{mode='hub';render()})}}
function addButton(text:string,fn:()=>void,disabled=false){const b=document.createElement('button');b.textContent=text;b.disabled=disabled;b.onclick=()=>{ensureMusic();playCue(sfx,'click');fn()};actions.appendChild(b)}
function renderTitle(){chrome.innerHTML=`<h1>ARENA OF BONKS</h1><p>Forge a gladiator, kit them at the smithy, and bonk five champions of the dusk colosseum. Turn-based bouts; every blow is telegraphed.</p><p class="watermark">INTERNAL watermark: native replica slice — original evocation, no source marks.</p>`;if(saveData)addButton('Continue — '+g.name,()=>{mode=defeated>=opponents.length?'complete':'hub';render()});addButton('New Gladiator',()=>{g={name:'',look:selectedLook,stats:{strength:2,agility:2,vitality:2,defense:2},hp:30,maxHp:30,gold:0,xp:0,level:1,weapon:0,armor:0,potions:2};defeated=0;owned=[];points=6;mode='create';render()})}
function renderCreate(){chrome.innerHTML=`<h1>Create Gladiator</h1><p>Look preset: <b>${selectedLook}</b> <img class="portrait" src="portrait-${selectedLook.toLowerCase()}.svg" alt="${selectedLook} gladiator portrait"></p><div class="grid">${LOOKS.map(x=>`<button class="lookbtn" data-look="${x}"><img src="portrait-${x.toLowerCase()}.svg" alt="">${x}</button>`).join('')}</div><p>Skill points remaining: <b>${points}</b></p><div class="grid">${STATS.map(k=>`<button data-stat="${k}">${k}: ${g.stats[k]} +</button>`).join('')}</div><input id="name" placeholder="Gladiator name">`;const nameInput=chrome.querySelector<HTMLInputElement>('#name')!;nameInput.value=g.name;nameInput.oninput=()=>{g.name=nameInput.value};chrome.querySelectorAll<HTMLButtonElement>('[data-look]').forEach(b=>b.onclick=()=>{selectedLook=b.dataset.look!;g.look=selectedLook;render()});chrome.querySelectorAll<HTMLButtonElement>('[data-stat]').forEach(b=>b.onclick=()=>{const k=b.dataset.stat as Stat;if(points){g.stats[k]++;points--;g.maxHp=24+g.stats.vitality*4;g.hp=g.maxHp;render()}});addButton('Enter the Arena',()=>{g.name=nameInput.value.replace(/[^A-Za-z0-9 '&"._-]/g,'').trim().slice(0,24)||'Unnamed Gladiator';g.maxHp=24+g.stats.vitality*4;g.hp=g.maxHp;mode='hub';persist();playCue(sfx,'start');log(`${g.name} steps into the arena grounds.`);render()},points>0)}
function renderHub(){chrome.innerHTML=`<h1>Hub — ${g.look}</h1><p class="gladiator-name"></p><p><img class="portrait" src="portrait-${g.look.toLowerCase()}.svg" alt="${g.look} gladiator portrait"></p><p>Weapon +${g.weapon} · Armor +${g.armor} · Potions ${g.potions} · Bouts won ${defeated}/${opponents.length}</p>`;chrome.querySelector('.gladiator-name')!.textContent=g.name; if(defeated<opponents.length)addButton(defeated?'Next Opponent':'Start First Bout',startFight);addButton('Visit Smithy / Armory',()=>{mode='shop';render()});addButton('Save & Title',()=>{persist();mode='title';render()})}
function renderArena(){if(!opponent)return;chrome.innerHTML=`<h1>Arena: ${opponent.name}</h1><p>Opponent HP ${opponent.hp}/${opponent.maxHp} · ${guarded?'Opponent is off-balance.':''}</p>`;addButton('Attack',()=>act('attack'));addButton('Special',()=>act('special'));addButton(`Potion (${g.potions})`,()=>act('potion'),g.potions<1||g.hp===g.maxHp);addButton('Taunt',()=>{if(!opponent)return;log('You roar at the crowd. They roar back — the enemy glares.');spawnFloat('HA!',PX,286,'#ffd23a');playCue(sfx,'taunt');enemyTurn()})}
function renderDefeat(){chrome.innerHTML='<h1>DEFEAT</h1><p>The healer drags you from the sand. Your gold and standing are safe; the bout must be fought again.</p>';addButton('Rise Again',()=>{mode='hub';render()})}
function renderShop(){chrome.innerHTML='<h1>Smithy / Armory</h1><p>Buy one item, then return to the arena.</p><div class="grid">'+items.map((it,i)=>{const isOwned=owned.includes(it.name);return `<button data-item="${i}" ${isOwned||g.level<it.gate||g.gold<it.price?'disabled':''}>${it.name}<br>${isOwned?'Owned':`${it.price} gold · level ${it.gate}`}</button>`}).join('')+'</div>';chrome.querySelectorAll<HTMLButtonElement>('[data-item]').forEach(b=>b.onclick=()=>{const it=items[Number(b.dataset.item)];if(owned.includes(it.name))return;g.gold-=it.price;owned.push(it.name);if(it.kind==='weapon')g.weapon=Math.max(g.weapon,it.bonus);else g.armor=Math.max(g.armor,it.bonus);persist();log(`Bought ${it.name}. The smith nods solemnly.`);playCue(sfx,'buy');render()});addButton('Back to Hub',()=>{mode='hub';render()})}
function startFight(){opponentIdx=Math.min(defeated,opponents.length-1);const o=opponents[opponentIdx];opponent={...o,maxHp:o.hp};turn=0;guarded=false;mode='arena';log(`The crowd chants for ${o.name}.`);render()}
function act(kind:'attack'|'special'|'potion'){if(!opponent)return;if(kind==='potion'){g.potions--;g.hp=Math.min(g.maxHp,g.hp+16);log('Potion consumed. It tastes like heroic fruit.');spawnFloat('+16',PX,286,'#7dff8a');playCue(sfx,'glug');enemyTurn();return}turn++;const bonus=g.weapon;const chance=0.55+g.stats.agility*.04;const hit=Math.random()<chance; spawnLunge('p'); playCue(sfx,kind==='special'?'swingHeavy':'swing'); if(!hit){log('Miss! Your sword demonstrates interpretive dance.');spawnFloat('MISS!',EX,286,'#bbb');enemyTurn();return}const crit=Math.random()<0.08+g.stats.agility*.01;let damage=(kind==='special'?7:4)+g.stats.strength+bonus+(crit?5:0);damage=Math.max(1,damage-opponent.defense);opponent.hp=Math.max(0,opponent.hp-damage);guarded=kind==='special';spawnHit('e',String(damage),crit?'#ffd23a':'#fff');playCue(sfx,'thud');log(`${crit?'Critical bonk! ':'Hit! '}${opponent.name} takes ${damage}.`);if(opponent.hp===0){win();return}enemyTurn()}
function enemyTurn(){if(!opponent)return;spawnLunge('e');const blocked=guarded;const damage=Math.max(1,opponent.strength+Math.floor(Math.random()*3)-g.stats.defense-Math.floor(g.armor/2)-(guarded?3:0));guarded=false;g.hp=Math.max(0,g.hp-damage);spawnHit('p',String(damage),'#ff6a5a');playCue(sfx,blocked?'clink':'thud');log(blocked?`${opponent.name}'s blow clangs off your guard for ${damage}.`:`${opponent.name} replies with a theatrical thump for ${damage}.`);if(g.hp===0){g.hp=g.maxHp;persist();playCue(sfx,'sting');log('Defeat! The healer drags you back to the hub.');mode='defeat'}render()}
function win(){if(!opponent)return;const reward=25+defeated*10;g.gold+=reward;g.xp+=22;level();defeated++;log(`Victory! Earned ${reward} gold and XP.`);spawnFloat('+'+reward+'g',EX,286,'#ffd23a');g.hp=g.maxHp;persist();playCue(sfx,'crowd');if(defeated>=opponents.length){playCue(sfx,'fanfare')}opponent=null;opponentIdx=-1;mode=defeated>=opponents.length?'complete':'hub';render()}
const PX=240,EX=560;
function playerView():FighterView{const armorTier=(g.armor<=0?0:g.armor<=2?1:g.armor<=4?2:3) as 0|1|2|3;return{name:g.name,skin:g.look==='Azure'?'#c98a5a':g.look==='Gold'?'#8a5a3a':'#e8b88a',tint:SKINS[g.look]??'#d43a3a',armorTier,weapon:'sword',gold:g.weapon>=3}}
function opponentView():FighterView&{hp:number;maxHp:number}|null{if(!opponent)return null;const d=opponent.defense,armorTier=(d<=0?0:d<=2?1:d<=5?2:3) as 0|1|2|3;return{name:opponent.name,skin:opponent.skin,tint:'#3a5a8a',armorTier,weapon:opponent.weapon,gold:!!opponent.champion,hp:opponent.hp,maxHp:opponent.maxHp}}
function frame(t:number){const vp=viewport();const scale=fitIntegerScale(800,420,vp);const off=letterboxOffset(800,420,scale,vp);void scale;void off;paintArena(t,{screen:mode,player:playerView(),php:g.hp,pmax:g.maxHp,opponent:opponentView()})}
if(location.search.includes('debug')){(window as unknown as {__maga:unknown}).__maga={get mode(){return mode},get screen(){return mode},get gladiatorStats(){return {...g.stats}},get hp(){return g.hp},get gold(){return g.gold},get xp(){return g.xp},get level(){return g.level},get defeated(){return defeated},get potions(){return g.potions},get owned(){return [...owned]},get opponent(){return opponent?opponentIdx:defeated},get opponentHp(){return opponent?.hp??0},get opponentName(){return opponent?.name??''},get shop(){return items.map(x=>({...x}))},get savePresent(){return load<SaveData|null>('swords-and-sandals','slot',null)!==null},sfx}}
applyAudio();
log('Welcome, challenger.');
render();
requestAnimationFrame(function loop(t){frame(t);requestAnimationFrame(loop)});
