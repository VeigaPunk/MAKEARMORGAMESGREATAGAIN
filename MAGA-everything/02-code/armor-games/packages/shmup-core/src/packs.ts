/**
 * Content packs for the shared shmup skeleton (spec 06 §FORGE:
 * "shared shmup skeleton + content packs"). `replica` = CI2-era formula
 * recreate (INTERNAL-NO-PUBLIC, InterAction clearance required to ship);
 * `cluck` = Cluck Horizon original IP. Colors are Pixi hex numbers;
 * names/strings come straight from the proto packs.
 */
export interface ContentPack {
  id: 'replica' | 'cluck';
  title: string;
  sub: string;
  weapons: string[];
  gift: string;
  food: string;
  enemy: string;
  boss: string;
  ship: number;
  foe: number;
  foe2: number;
  egg: number;
  bg0: number;
  bg1: number;
  accent: number;
  jokes: string[] | null;
}

export const PACKS: Record<ContentPack['id'], ContentPack> = {
  replica: {
    id: 'replica',
    title: 'CHICKEN INVADERS',
    sub: 'The Next Wave — formula replica slice',
    weapons: ['PEA SHOOTER', 'TWIN BOLT', 'TRI-SPREAD'],
    gift: 'GIFT',
    food: 'DRUMSTICK',
    enemy: 'CHICKEN',
    boss: 'BIG HEN',
    ship: 0x4dabf7,
    foe: 0xffd43b,
    foe2: 0xff8787,
    egg: 0xfff3bf,
    bg0: 0x0b0018,
    bg1: 0x1a0b2e,
    accent: 0xff6b6b,
    jokes: null,
  },
  cluck: {
    id: 'cluck',
    title: 'CLUCK HORIZON',
    sub: 'courier vs the flock — original IP slice',
    weapons: ['SOUP LASER', 'SPATULA SPREAD', 'WHISK BARRAGE'],
    gift: 'CRATE',
    food: 'RATIONS',
    enemy: 'FLOCKBIRD',
    boss: 'MOTHER GOOSE',
    ship: 0x20c997,
    foe: 0xffa94d,
    foe2: 0xffe066,
    egg: 0xffe8cc,
    bg0: 0x001a1a,
    bg1: 0x00332b,
    accent: 0x20c997,
    jokes: [
      'Courier log: the flock took my route. Rude.',
      'Courier log: eggs again. Sending them the invoice.',
    ],
  },
};
