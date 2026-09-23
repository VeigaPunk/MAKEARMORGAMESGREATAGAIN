/**
 * Content packs for the shared shmup skeleton (spec 06 §FORGE:
 * "shared shmup skeleton + content packs"). `replica` = CI2-era formula
 * recreate under original "Chicken Storm" evocation branding
 * (INTERNAL-NO-PUBLIC, InterAction clearance required to ship);
 * `cluck` = Cluck Horizon original IP. Colors are Pixi hex numbers.
 * Palette fields beyond the base set drive the baked canvas art (neb1/neb2/
 * planet/ring = backdrop, belly/beak/comb = bird accents, shipHi/bullet/
 * giftCol = ship + shots + parcels).
 */
export interface EnemyType {
  name: string;
  color: number;
  headColor: number;
  speed: number; // formation motion multiplier (1 = baseline, >1 darting, <1 heavy)
  hp: number; // per-type durability floor
  score: number; // points per kill (D-43: per-type HP pays per-type score)
  build: 'round' | 'swept' | 'heavy'; // silhouette family for baked art
  svg?: string; // authored sprite (cluck pack) served from the app's art dir
}

export interface BossType { name: string; color: number; headColor: number; svg?: string }

export interface ContentPack {
  id: 'replica' | 'cluck';
  title: string;
  sub: string;
  weapons: string[];
  gift: string;
  food: string;
  enemyTypes: [EnemyType, EnemyType, EnemyType];
  bosses: [BossType, BossType];
  ship: number;
  foe: number;
  foe2: number;
  egg: number;
  bg0: number;
  bg1: number;
  accent: number;
  shipHi: number;
  bullet: number;
  belly: number;
  beak: number;
  comb: number;
  neb1: number;
  neb2: number;
  planet: number;
  ring: number;
  giftCol: number;
  jokes: string[] | null;
}

export const PACKS: Record<ContentPack['id'], ContentPack> = {
  replica: {
    id: 'replica',
    title: 'CHICKEN STORM',
    sub: 'a storm of feathers — formula-replica slice',
    weapons: ['PEA SHOOTER', 'TWIN BOLT', 'TRI-SPREAD'],
    gift: 'GIFT',
    food: 'DRUMSTICK',
    enemyTypes: [
      { name: 'CHICKEN', color: 0xffd43b, headColor: 0xff8787, speed: 1, hp: 2, score: 100, build: 'round' },
      { name: 'CHICKEN SCOUT', color: 0xffe066, headColor: 0xff6b6b, speed: 1.15, hp: 2, score: 125, build: 'swept' },
      { name: 'CHICKEN ACE', color: 0xf08c00, headColor: 0xe03131, speed: 0.85, hp: 4, score: 250, build: 'heavy' },
    ],
    bosses: [
      { name: 'THE HENERAL', color: 0xffd43b, headColor: 0xff8787 },
      { name: 'HER EGGSCELLENCY', color: 0xffd43b, headColor: 0xff8787 },
    ],
    ship: 0x4dabf7,
    foe: 0xffd43b,
    foe2: 0xff8787,
    egg: 0xfff3bf,
    bg0: 0x0b0018,
    bg1: 0x1a0b2e,
    accent: 0xff6b6b,
    shipHi: 0xa5d8ff,
    bullet: 0x8ce99a,
    belly: 0xffec99,
    beak: 0xfd7e14,
    comb: 0xe03131,
    neb1: 0x5f3dc4,
    neb2: 0xc2255c,
    planet: 0x2f2b5c,
    ring: 0x9775fa,
    giftCol: 0xe599f7,
    jokes: null,
  },
  cluck: {
    id: 'cluck',
    title: 'CLUCK HORIZON',
    sub: 'courier vs the flock — original IP slice',
    weapons: ['SOUP LASER', 'SPATULA SPREAD', 'WHISK BARRAGE'],
    gift: 'CRATE',
    food: 'RATIONS',
    enemyTypes: [
      {
        name: 'FLOCKBIRD', color: 0xffa94d, headColor: 0xffe066, speed: 1, hp: 2, score: 100,
        build: 'round', svg: '/art/enemy-flockbird.svg',
      },
      {
        name: 'FLOCKBIRD GLIDER', color: 0xffe066, headColor: 0xffa94d, speed: 1.15, hp: 2, score: 125,
        build: 'swept', svg: '/art/enemy-glider.svg',
      },
      {
        name: 'FLOCKBIRD BRUISER', color: 0xffe677, headColor: 0xffc92a, speed: 0.85, hp: 3, score: 200,
        build: 'heavy', svg: '/art/enemy-bruiser.svg',
      },
    ],
    bosses: [
      { name: 'MOTHER GOOSE', color: 0xffa94d, headColor: 0xffe066, svg: '/art/boss-mother-goose.svg' },
      { name: 'ROOSTER REGENT', color: 0xffe677, headColor: 0xffc92a, svg: '/art/boss-rooster-regent.svg' },
    ],
    ship: 0x20c997,
    foe: 0xffa94d,
    foe2: 0xffe066,
    egg: 0xffe8cc,
    bg0: 0x001a1a,
    bg1: 0x00332b,
    accent: 0x20c997,
    shipHi: 0x96f2d7,
    bullet: 0xffe066,
    belly: 0xffe8cc,
    beak: 0xe8590c,
    comb: 0xffd43b,
    neb1: 0x0b7285,
    neb2: 0x087f5b,
    planet: 0x3b4a48,
    ring: 0x63e6be,
    giftCol: 0x3fd9b2,
    jokes: [
      'Courier log: the flock took my route. Rude.',
      'Courier log: eggs again. Sending them the invoice.',
    ],
  },
};
