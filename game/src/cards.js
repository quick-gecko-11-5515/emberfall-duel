// EMBERFALL — Duel of the Four Sigils
// Card pool (20 distinct cards across 4 sigils), sigil metadata, and inline SVG artwork.

export const SIGILS = {
  flame: {
    id: 'flame',
    name: 'Flame',
    accent: '#ef4c3b',
    glow: '#ff8a4c',
    dark: '#3c1311',
    mid: '#7a2018',
    summary: 'Fierce attackers that rally fellow Flame allies and scorch foes.',
  },
  tide: {
    id: 'tide',
    name: 'Tide',
    accent: '#2c93e8',
    glow: '#6ae0ff',
    dark: '#0f233b',
    mid: '#1b4973',
    summary: 'Swift currents that draw cards, sweep lanes, and empower spellcasters.',
  },
  thorn: {
    id: 'thorn',
    name: 'Thorn',
    accent: '#30ad5e',
    glow: '#7de898',
    dark: '#102b1b',
    mid: '#1d5634',
    summary: 'Resilient wardens with stout health, healing blooms, and fierce growth.',
  },
  stone: {
    id: 'stone',
    name: 'Stone',
    accent: '#d99826',
    glow: '#f7d26a',
    dark: '#30230e',
    mid: '#634617',
    summary: 'Stalwart Guard defenders that must be attacked first and fortify allies.',
  },
};

/**
 * Returns crisp inline SVG markup for each sigil's distinct geometric shape:
 * - Flame: flame/teardrop tongue
 * - Tide: water droplet with crescent glint
 * - Thorn: pointed leaf with central vein
 * - Stone: faceted diamond
 */
export function sigilIconSvg(sigilId, size = 20) {
  const s = SIGILS[sigilId] || SIGILS.flame;
  switch (sigilId) {
    case 'flame':
      return `<svg class="sigil-svg sigil-flame" width="${size}" height="${size}" viewBox="0 0 24 24" aria-label="Flame sigil">
        <path d="M12.3 2C14.8 5.4 18.8 8.3 18.8 13.4C18.8 17.5 15.8 21 12 21C8.2 21 5.2 17.6 5.2 13.7C5.2 10.6 6.8 8.3 8.4 6.7C8.2 8.7 9.1 9.9 10.1 10.4C9.5 7.4 10.7 4.4 12.3 2Z" fill="${s.accent}" stroke="#ffd7b8" stroke-width="1.3" stroke-linejoin="round"/>
        <path d="M12 11.4C13.4 13.1 14.5 14.6 14.5 16.5C14.5 18 13.4 19.2 12 19.2C10.6 19.2 9.5 18 9.5 16.5C9.5 14.9 10.7 13.4 12 11.4Z" fill="${s.glow}"/>
      </svg>`;
    case 'tide':
      return `<svg class="sigil-svg sigil-tide" width="${size}" height="${size}" viewBox="0 0 24 24" aria-label="Tide sigil">
        <path d="M12 2.4C12 2.4 5.6 10 5.6 14.6C5.6 18.2 8.5 21.1 12 21.1C15.5 21.1 18.4 18.2 18.4 14.6C18.4 10 12 2.4 12 2.4Z" fill="${s.accent}" stroke="#ccf2ff" stroke-width="1.3" stroke-linejoin="round"/>
        <path d="M9.4 14.4C9.4 16.2 10.7 17.6 12.6 17.8C10.9 18.3 8.4 16.9 8.4 14.3C8.4 12.9 9.2 11.3 10.2 9.9C9.7 11.5 9.4 13.1 9.4 14.4Z" fill="${s.glow}"/>
      </svg>`;
    case 'thorn':
      return `<svg class="sigil-svg sigil-thorn" width="${size}" height="${size}" viewBox="0 0 24 24" aria-label="Thorn sigil">
        <path d="M19.5 4.2C12.5 4.2 6.8 7.5 5.4 14.5C5.1 16.2 5.4 17.9 6.2 19.1C7.6 19.8 9.4 20 11.2 19.5C17.6 17.8 19.8 11.4 19.5 4.2Z" fill="${s.accent}" stroke="#d2ffd9" stroke-width="1.3" stroke-linejoin="round"/>
        <path d="M6.4 18.9L15.6 9.2M10.4 14.7L9.8 11.2M13.1 11.8L16.3 12.2" stroke="${s.glow}" stroke-width="1.5" stroke-linecap="round"/>
      </svg>`;
    case 'stone':
    default:
      return `<svg class="sigil-svg sigil-stone" width="${size}" height="${size}" viewBox="0 0 24 24" aria-label="Stone sigil">
        <polygon points="12,2.2 20.4,12 12,21.8 3.6,12" fill="${s.accent}" stroke="#fff0bf" stroke-width="1.3" stroke-linejoin="round"/>
        <polygon points="12,6.2 16.6,12 12,17.8 7.4,12" fill="${s.glow}" opacity="0.82"/>
      </svg>`;
  }
}

export const CARD_POOL = [
  // ==================== FLAME (5 cards) ====================
  {
    id: 'cinder_imp',
    name: 'Cinder Imp',
    sigil: 'flame',
    type: 'creature',
    cost: 1,
    atk: 2,
    hp: 1,
    rules: 'On Play: Give another Flame ally +1 ATK.',
    keywords: [],
    onPlay: { kind: 'buff_other_sigil', sigil: 'flame', atk: 1, hp: 0 },
  },
  {
    id: 'pyre_hound',
    name: 'Pyre Hound',
    sigil: 'flame',
    type: 'creature',
    cost: 2,
    atk: 3,
    hp: 2,
    rules: 'Flame Bond: +1 ATK with another Flame ally.',
    keywords: ['flame_bond'],
  },
  {
    id: 'ember_bolt',
    name: 'Ember Bolt',
    sigil: 'flame',
    type: 'spell',
    cost: 2,
    target: 'enemy_any',
    rules: 'Deal 3 damage to an enemy creature or duelist.',
    effect: { kind: 'damage', amount: 3 },
  },
  {
    id: 'ash_pyromancer',
    name: 'Ash Pyromancer',
    sigil: 'flame',
    type: 'creature',
    cost: 4,
    atk: 4,
    hp: 3,
    rules: 'On Play: Deal 2 damage to the enemy duelist.',
    keywords: [],
    onPlay: { kind: 'damage_enemy_hero', amount: 2 },
  },
  {
    id: 'volcanic_drake',
    name: 'Volcanic Drake',
    sigil: 'flame',
    type: 'creature',
    cost: 6,
    atk: 6,
    hp: 4,
    rules: 'On Play: Give all other Flame allies +2 ATK.',
    keywords: [],
    onPlay: { kind: 'buff_all_other_sigil', sigil: 'flame', atk: 2, hp: 0 },
  },

  // ==================== TIDE (5 cards) ====================
  {
    id: 'tide_sprite',
    name: 'Tide Sprite',
    sigil: 'tide',
    type: 'creature',
    cost: 1,
    atk: 1,
    hp: 2,
    rules: 'On Play: Draw 1 card.',
    keywords: [],
    onPlay: { kind: 'draw', amount: 1 },
  },
  {
    id: 'current_surge',
    name: 'Current Surge',
    sigil: 'tide',
    type: 'spell',
    cost: 2,
    target: 'none',
    rules: 'Draw 2 cards.',
    effect: { kind: 'draw', amount: 2 },
  },
  {
    id: 'tidal_lash',
    name: 'Tidal Lash',
    sigil: 'tide',
    type: 'spell',
    cost: 3,
    target: 'enemy_creature',
    rules: 'Deal 2 damage to an enemy creature. Draw 1 card.',
    effect: { kind: 'damage_and_draw', amount: 2, draw: 1 },
  },
  {
    id: 'frost_channeler',
    name: 'Frost Channeler',
    sigil: 'tide',
    type: 'creature',
    cost: 3,
    atk: 2,
    hp: 4,
    rules: 'Whenever you cast a spell, gain +1/+1.',
    keywords: ['spell_grow'],
  },
  {
    id: 'abyssal_serpent',
    name: 'Abyssal Serpent',
    sigil: 'tide',
    type: 'creature',
    cost: 5,
    atk: 4,
    hp: 5,
    rules: 'On Play: Deal 1 damage to all enemy creatures. Draw 1.',
    keywords: [],
    onPlay: { kind: 'aoe_enemy_and_draw', amount: 1, draw: 1 },
  },

  // ==================== THORN (5 cards) ====================
  {
    id: 'moss_sprout',
    name: 'Moss Sprout',
    sigil: 'thorn',
    type: 'creature',
    cost: 1,
    atk: 1,
    hp: 4,
    rules: 'End of Turn: Restore 1 Life to your duelist.',
    keywords: ['regen_hero'],
  },
  {
    id: 'verdant_bloom',
    name: 'Verdant Bloom',
    sigil: 'thorn',
    type: 'spell',
    cost: 2,
    target: 'ally_creature',
    rules: 'Give an ally +1/+3 and restore 2 Life.',
    effect: { kind: 'buff_and_heal', atk: 1, hp: 3, heal: 2 },
  },
  {
    id: 'briar_stag',
    name: 'Briar Stag',
    sigil: 'thorn',
    type: 'creature',
    cost: 3,
    atk: 3,
    hp: 5,
    rules: 'On Play: Restore 2 Life to your duelist.',
    keywords: [],
    onPlay: { kind: 'heal_hero', amount: 2 },
  },
  {
    id: 'elder_treant',
    name: 'Elder Treant',
    sigil: 'thorn',
    type: 'creature',
    cost: 5,
    atk: 4,
    hp: 7,
    rules: 'On Play: Give other allies +0/+2 and restore 2 Life.',
    keywords: [],
    onPlay: { kind: 'buff_all_other_and_heal', atk: 0, hp: 2, heal: 2 },
  },
  {
    id: 'thornback_hydra',
    name: 'Thornback Hydra',
    sigil: 'thorn',
    type: 'creature',
    cost: 6,
    atk: 5,
    hp: 8,
    rules: 'Whenever it survives damage, gain +2 ATK.',
    keywords: ['enrage'],
  },

  // ==================== STONE (5 cards) ====================
  {
    id: 'quarry_sentry',
    name: 'Quarry Sentry',
    sigil: 'stone',
    type: 'creature',
    cost: 2,
    atk: 1,
    hp: 4,
    rules: 'Guard. Enemies must attack Guard first.',
    keywords: ['guard'],
  },
  {
    id: 'amber_ward',
    name: 'Amber Ward',
    sigil: 'stone',
    type: 'spell',
    cost: 2,
    target: 'ally_creature',
    rules: 'Give an ally +1/+2 and Guard.',
    effect: { kind: 'buff_and_guard', atk: 1, hp: 2 },
  },
  {
    id: 'bastion_golem',
    name: 'Bastion Golem',
    sigil: 'stone',
    type: 'creature',
    cost: 3,
    atk: 2,
    hp: 5,
    rules: 'Guard. On Play: Give other allies +0/+1.',
    keywords: ['guard'],
    onPlay: { kind: 'buff_all_other', atk: 0, hp: 1 },
  },
  {
    id: 'monolith_knight',
    name: 'Monolith Knight',
    sigil: 'stone',
    type: 'creature',
    cost: 4,
    atk: 3,
    hp: 5,
    rules: 'Guard. Other Guard allies have +1 ATK.',
    keywords: ['guard', 'guard_aura'],
  },
  {
    id: 'obsidian_colossus',
    name: 'Obsidian Colossus',
    sigil: 'stone',
    type: 'creature',
    cost: 6,
    atk: 5,
    hp: 8,
    rules: 'Guard. On Play: Deal 2 damage to all enemy creatures.',
    keywords: ['guard'],
    onPlay: { kind: 'aoe_enemy', amount: 2 },
  },
];

export const CARD_BY_ID = Object.fromEntries(CARD_POOL.map((c) => [c.id, c]));

/**
 * Balanced 30-card deck recipe: 2 copies of the 10 early/core cards, 1 copy of the 10 mid/high cards.
 * Every sigil has 7–8 cards so synergies trigger reliably every duel.
 */
export const DECK_RECIPE = [
  'cinder_imp', 'cinder_imp',
  'pyre_hound', 'pyre_hound',
  'ember_bolt', 'ember_bolt',
  'ash_pyromancer',
  'volcanic_drake',

  'tide_sprite', 'tide_sprite',
  'current_surge', 'current_surge',
  'tidal_lash',
  'frost_channeler', 'frost_channeler',
  'abyssal_serpent',

  'moss_sprout', 'moss_sprout',
  'verdant_bloom', 'verdant_bloom',
  'briar_stag', 'briar_stag',
  'elder_treant',
  'thornback_hydra',

  'quarry_sentry', 'quarry_sentry',
  'amber_ward',
  'bastion_golem', 'bastion_golem',
  'monolith_knight',
  'obsidian_colossus',
];

/**
 * Hand-crafted inline SVG illustration for every single card in the 20-card pool.
 * Uses only local SVG paths/gradients — zero external assets or network requests.
 */
export function cardArtSvg(cardId, sigilId) {
  const s = SIGILS[sigilId] || SIGILS.flame;
  const gId = `g_${cardId}`;
  const scenes = {
    cinder_imp: `
      <circle cx="80" cy="48" r="30" fill="${s.glow}" opacity="0.22"/>
      <path d="M52 72 Q62 46 80 34 Q98 46 108 72 Z" fill="#2c0d0c"/>
      <path d="M62 28 L72 44 L80 22 L88 44 L98 28 L94 56 Q80 68 66 56 Z" fill="${s.accent}"/>
      <path d="M69 36 L75 46 L80 31 L85 46 L91 36 L88 55 Q80 62 72 55 Z" fill="${s.glow}"/>
      <circle cx="74" cy="47" r="2.7" fill="#fff7cc"/>
      <circle cx="86" cy="47" r="2.7" fill="#fff7cc"/>
      <circle cx="48" cy="28" r="2.5" fill="#ffb86c"/>
      <circle cx="114" cy="22" r="2" fill="#ffd98a"/>
      <circle cx="118" cy="44" r="1.8" fill="#ff8a4c"/>
    `,
    pyre_hound: `
      <path d="M26 70 Q58 58 134 70 L134 80 L26 80 Z" fill="#2b0c09"/>
      <path d="M40 62 Q48 34 74 36 L98 26 L108 38 L122 36 L112 50 L102 64 L88 64 L84 52 L64 56 L58 68 L44 68 Z" fill="#3a120d" stroke="${s.accent}" stroke-width="2"/>
      <path d="M44 42 Q54 16 74 32 Q68 18 86 24 Q80 12 96 24" fill="none" stroke="${s.glow}" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M50 48 Q64 30 82 38" fill="none" stroke="${s.accent}" stroke-width="2.5"/>
      <polygon points="103,38 110,36 107,42" fill="#fff3b0"/>
      <circle cx="34" cy="24" r="2.4" fill="${s.glow}"/>
      <circle cx="126" cy="20" r="2" fill="#ffd599"/>
    `,
    ember_bolt: `
      <circle cx="80" cy="40" r="34" fill="${s.accent}" opacity="0.24"/>
      <path d="M22 68 L68 42 L58 32 L134 14 L92 46 L104 56 L22 68 Z" fill="${s.accent}"/>
      <path d="M44 58 L76 40 L70 33 L124 19 L89 44 L96 50 Z" fill="#ffe18c"/>
      <circle cx="122" cy="18" r="8" fill="#fff7d6" opacity="0.85"/>
      <circle cx="48" cy="26" r="2.6" fill="${s.glow}"/>
      <circle cx="116" cy="56" r="2.2" fill="${s.glow}"/>
    `,
    ash_pyromancer: `
      <circle cx="80" cy="44" r="34" fill="${s.accent}" opacity="0.2"/>
      <path d="M20 78 Q80 54 140 78" fill="none" stroke="${s.glow}" stroke-width="1.4" opacity="0.45"/>
      <path d="M48 80 L64 34 L80 20 L96 34 L112 80 Z" fill="#290e0e" stroke="${s.accent}" stroke-width="2"/>
      <path d="M64 34 L80 48 L96 34" fill="none" stroke="#ff9a52" stroke-width="1.4" opacity="0.7"/>
      <circle cx="80" cy="28" r="10" fill="#180708" stroke="${s.glow}" stroke-width="1.6"/>
      <circle cx="76.8" cy="28" r="2" fill="#ffe17d"/>
      <circle cx="83.2" cy="28" r="2" fill="#ffe17d"/>
      <path d="M50 48 C40 36 42 20 50 13 C59 22 59 36 50 48 Z" fill="${s.accent}"/>
      <path d="M110 48 C101 36 101 22 110 13 C118 20 120 36 110 48 Z" fill="${s.accent}"/>
      <path d="M50 43 C46 35 46 27 50 21 C54 27 54 35 50 43 Z" fill="#ffe794"/>
      <path d="M110 43 C106 35 106 27 110 21 C114 27 114 35 110 43 Z" fill="#ffe794"/>
      <circle cx="34" cy="22" r="2.2" fill="#ffd98a"/>
      <circle cx="128" cy="26" r="2.2" fill="#ffb86c"/>
    `,
    volcanic_drake: `
      <circle cx="80" cy="40" r="36" fill="${s.accent}" opacity="0.26"/>
      <path d="M12 22 Q44 4 68 38 L80 26 L92 38 Q116 4 148 22 Q126 45 104 55 L94 75 L66 75 L56 55 Q34 45 12 22 Z" fill="#3a100c" stroke="${s.accent}" stroke-width="2.2"/>
      <path d="M24 24 Q48 18 64 42 M136 24 Q112 18 96 42" fill="none" stroke="${s.glow}" stroke-width="1.6" opacity="0.7"/>
      <path d="M68 40 L80 12 L92 40 L86 58 L74 58 Z" fill="${s.accent}"/>
      <path d="M74 34 L80 19 L86 34 L80 54 Z" fill="${s.glow}"/>
      <polygon points="75,38 78,41 74,42" fill="#fff8c4"/>
      <polygon points="85,38 82,41 86,42" fill="#fff8c4"/>
      <path d="M60 66 Q80 55 100 66" fill="none" stroke="#ffd275" stroke-width="2.6" stroke-linecap="round"/>
      <circle cx="40" cy="60" r="2.2" fill="#ffd98a"/>
      <circle cx="122" cy="58" r="2.2" fill="#ff9447"/>
    `,
    tide_sprite: `
      <circle cx="80" cy="38" r="26" fill="${s.glow}" opacity="0.22"/>
      <path d="M80 12 C80 12 58 36 58 50 C58 62 68 70 80 70 C92 70 102 62 102 50 C102 36 80 12 80 12 Z" fill="${s.accent}" stroke="#c2f2ff" stroke-width="1.8"/>
      <path d="M40 44 Q54 32 62 46 Q52 54 40 44 Z" fill="${s.glow}" opacity="0.65"/>
      <path d="M120 44 Q106 32 98 46 Q108 54 120 44 Z" fill="${s.glow}" opacity="0.65"/>
      <circle cx="74" cy="46" r="2.5" fill="#ffffff"/>
      <circle cx="86" cy="46" r="2.5" fill="#ffffff"/>
      <circle cx="48" cy="24" r="2.5" fill="#9aeaff"/>
      <circle cx="114" cy="26" r="2" fill="#9aeaff"/>
    `,
    current_surge: `
      <path d="M14 58 Q44 26 78 44 T146 30" fill="none" stroke="${s.accent}" stroke-width="7" stroke-linecap="round"/>
      <path d="M16 44 Q52 14 86 34 T144 18" fill="none" stroke="${s.glow}" stroke-width="4" stroke-linecap="round"/>
      <path d="M22 68 Q62 46 98 60 T146 48" fill="none" stroke="#a6edff" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="52" cy="24" r="4" fill="#d6f8ff"/>
      <circle cx="106" cy="20" r="3" fill="#d6f8ff"/>
      <circle cx="128" cy="36" r="3.5" fill="${s.glow}"/>
    `,
    tidal_lash: `
      <path d="M18 68 C42 20 88 12 126 30 C108 36 92 42 86 58 C78 40 58 44 40 72 Z" fill="${s.accent}" stroke="#bdf1ff" stroke-width="1.8"/>
      <path d="M46 56 C62 28 96 22 122 30" fill="none" stroke="#d9f8ff" stroke-width="3" stroke-linecap="round"/>
      <path d="M116 32 L138 22 M122 40 L142 36 M112 46 L132 52" stroke="${s.glow}" stroke-width="2.6" stroke-linecap="round"/>
      <circle cx="134" cy="18" r="2.5" fill="#ffffff"/>
    `,
    frost_channeler: `
      <circle cx="80" cy="40" r="32" fill="${s.glow}" opacity="0.16"/>
      <circle cx="80" cy="40" r="24" fill="none" stroke="${s.glow}" stroke-width="1" stroke-dasharray="4 4" opacity="0.65"/>
      <polygon points="80,8 102,40 80,72 58,40" fill="#173e66" stroke="${s.glow}" stroke-width="2.2"/>
      <polygon points="80,19 93,40 80,61 67,40" fill="${s.accent}"/>
      <polygon points="80,27 87,40 80,53 73,40" fill="#e6fbff"/>
      <path d="M32 40 L52 31 L52 49 Z" fill="${s.glow}" opacity="0.82"/>
      <path d="M128 40 L108 31 L108 49 Z" fill="${s.glow}" opacity="0.82"/>
      <circle cx="44" cy="18" r="2.2" fill="#dff9ff"/>
      <circle cx="116" cy="62" r="2.2" fill="#dff9ff"/>
    `,
    abyssal_serpent: `
      <path d="M20 68 Q40 36 62 56 T104 42 Q118 22 134 26 Q124 38 118 44 Q130 48 122 58 Q102 68 80 56 Q56 76 20 68 Z" fill="#123a5e" stroke="${s.glow}" stroke-width="2"/>
      <path d="M30 62 Q48 44 66 56 T108 38" fill="none" stroke="${s.accent}" stroke-width="4" stroke-linecap="round"/>
      <circle cx="122" cy="31" r="2.6" fill="#fff799"/>
      <path d="M98 28 L108 18 L112 29" fill="${s.glow}"/>
      <path d="M62 44 L68 32 L76 46" fill="${s.glow}"/>
    `,
    moss_sprout: `
      <ellipse cx="80" cy="68" rx="44" ry="8" fill="#102e1a"/>
      <path d="M80 66 Q78 46 80 34" stroke="#69db89" stroke-width="4" stroke-linecap="round"/>
      <path d="M80 42 C60 36 52 20 66 16 C78 14 82 28 80 42 Z" fill="${s.accent}" stroke="#c9ffd6" stroke-width="1.5"/>
      <path d="M80 40 C100 34 108 18 94 14 C82 12 78 26 80 40 Z" fill="${s.glow}" stroke="#e3ffea" stroke-width="1.5"/>
      <circle cx="80" cy="54" r="12" fill="#1b512e" stroke="${s.glow}" stroke-width="1.6"/>
      <circle cx="76" cy="53" r="2" fill="#eaffd0"/>
      <circle cx="84" cy="53" r="2" fill="#eaffd0"/>
    `,
    verdant_bloom: `
      <circle cx="80" cy="40" r="28" fill="${s.glow}" opacity="0.22"/>
      <path d="M80 12 C90 26 90 36 80 44 C70 36 70 26 80 12 Z" fill="${s.glow}"/>
      <path d="M80 68 C90 54 90 44 80 36 C70 44 70 54 80 68 Z" fill="${s.accent}"/>
      <path d="M52 40 C66 30 76 30 84 40 C76 50 66 50 52 40 Z" fill="${s.accent}"/>
      <path d="M108 40 C94 30 84 30 76 40 C84 50 94 50 108 40 Z" fill="${s.glow}"/>
      <circle cx="80" cy="40" r="8" fill="#fff2a8"/>
      <circle cx="44" cy="22" r="2.2" fill="#b4ffbe"/>
      <circle cx="116" cy="58" r="2.5" fill="#b4ffbe"/>
    `,
    briar_stag: `
      <path d="M56 72 L62 46 L84 44 L100 50 L106 72 L94 72 L90 58 L70 58 L66 72 Z" fill="#184729" stroke="${s.glow}" stroke-width="1.8"/>
      <path d="M84 44 L94 28 L108 32 L100 44 Z" fill="${s.accent}" stroke="#c4ffd0" stroke-width="1.5"/>
      <path d="M90 28 L80 10 M85 19 L74 16 M94 28 L104 10 M99 19 L112 16" stroke="${s.glow}" stroke-width="2.6" stroke-linecap="round"/>
      <circle cx="99" cy="34" r="2" fill="#fff7b8"/>
    `,
    elder_treant: `
      <path d="M52 74 L60 40 L54 22 L72 28 L80 14 L88 28 L106 22 L100 40 L108 74 L88 74 L80 58 L72 74 Z" fill="#2c3a24" stroke="${s.accent}" stroke-width="2"/>
      <path d="M34 38 L58 46 M126 38 L102 46" stroke="#3f5933" stroke-width="5" stroke-linecap="round"/>
      <circle cx="44" cy="28" r="11" fill="${s.accent}" opacity="0.85"/>
      <circle cx="116" cy="28" r="11" fill="${s.accent}" opacity="0.85"/>
      <circle cx="80" cy="18" r="12" fill="${s.glow}" opacity="0.8"/>
      <circle cx="74" cy="42" r="2.5" fill="#b8ff9e"/>
      <circle cx="86" cy="42" r="2.5" fill="#b8ff9e"/>
    `,
    thornback_hydra: `
      <path d="M40 72 Q60 48 80 54 Q100 48 120 72 Z" fill="#153d22"/>
      <path d="M62 60 Q42 36 44 18 L56 26 L48 34" fill="none" stroke="${s.accent}" stroke-width="6" stroke-linecap="round"/>
      <path d="M80 58 Q80 30 80 14" fill="none" stroke="${s.glow}" stroke-width="6.5" stroke-linecap="round"/>
      <path d="M98 60 Q118 36 116 18 L104 26 L112 34" fill="none" stroke="${s.accent}" stroke-width="6" stroke-linecap="round"/>
      <circle cx="46" cy="20" r="5" fill="${s.glow}"/>
      <circle cx="80" cy="15" r="6" fill="#c7ffd2"/>
      <circle cx="114" cy="20" r="5" fill="${s.glow}"/>
      <circle cx="80" cy="15" r="2" fill="#204026"/>
    `,
    quarry_sentry: `
      <polygon points="80,12 114,26 108,58 80,74 52,58 46,26" fill="#4f3917" stroke="${s.glow}" stroke-width="2.2"/>
      <polygon points="80,22 102,32 98,54 80,64 62,54 58,32" fill="${s.accent}"/>
      <polygon points="80,30 92,42 80,54 68,42" fill="#fff0b5"/>
    `,
    amber_ward: `
      <polygon points="80,10 120,40 80,72 40,40" fill="${s.accent}" opacity="0.32" stroke="${s.glow}" stroke-width="2.4"/>
      <polygon points="80,20 106,40 80,62 54,40" fill="${s.accent}" stroke="#fff4cc" stroke-width="1.8"/>
      <polygon points="80,30 92,40 80,50 68,40" fill="#fff8d6"/>
      <path d="M24 40 L36 40 M124 40 L136 40" stroke="${s.glow}" stroke-width="2.4" stroke-linecap="round"/>
    `,
    bastion_golem: `
      <circle cx="80" cy="44" r="34" fill="${s.accent}" opacity="0.18"/>
      <path d="M22 72 L138 72" stroke="${s.glow}" stroke-width="1.2" opacity="0.35"/>
      <rect x="52" y="28" width="56" height="44" rx="6" fill="#4a371a" stroke="${s.glow}" stroke-width="2.1"/>
      <polygon points="62,28 80,11 98,28" fill="${s.accent}" stroke="#ffe9a6" stroke-width="1.6"/>
      <rect x="33" y="34" width="15" height="33" rx="4" fill="#63481f" stroke="${s.accent}" stroke-width="1.6"/>
      <rect x="112" y="34" width="15" height="33" rx="4" fill="#63481f" stroke="${s.accent}" stroke-width="1.6"/>
      <polygon points="80,39 91,50 80,61 69,50" fill="${s.glow}"/>
      <polygon points="80,44 86,50 80,56 74,50" fill="#fff9db"/>
      <rect x="68" y="20" width="24" height="4" rx="2" fill="#fff3b8"/>
    `,
    monolith_knight: `
      <circle cx="80" cy="40" r="34" fill="${s.accent}" opacity="0.18"/>
      <polygon points="80,9 101,26 95,72 65,72 59,26" fill="#463315" stroke="${s.glow}" stroke-width="2"/>
      <polygon points="80,16 92,26 80,36 68,26" fill="${s.accent}"/>
      <rect x="71" y="25" width="18" height="3" fill="#fff7cc"/>
      <polygon points="44,30 63,37 59,64 44,71 33,58" fill="${s.accent}" stroke="#ffe9a8" stroke-width="1.8"/>
      <polygon points="46,42 54,48 46,56 39,48" fill="#fff2be"/>
      <path d="M114 12 L114 68 M104 54 L124 54" stroke="${s.glow}" stroke-width="3.6" stroke-linecap="round"/>
      <circle cx="114" cy="14" r="3" fill="#fff8d6"/>
    `,
    obsidian_colossus: `
      <circle cx="80" cy="42" r="36" fill="${s.accent}" opacity="0.24"/>
      <polygon points="80,7 126,28 117,74 43,74 34,28" fill="#2b2114" stroke="${s.glow}" stroke-width="2.4"/>
      <polygon points="80,15 109,32 101,68 59,68 51,32" fill="#4d3716" stroke="${s.accent}" stroke-width="1.8"/>
      <polygon points="80,27 97,44 80,61 63,44" fill="${s.accent}"/>
      <polygon points="80,34 90,44 80,54 70,44" fill="#fff5be"/>
      <circle cx="66" cy="26" r="3.2" fill="#ffe680"/>
      <circle cx="94" cy="26" r="3.2" fill="#ffe680"/>
      <path d="M22 68 L36 58 M138 68 L124 58" stroke="${s.glow}" stroke-width="2" stroke-linecap="round" opacity="0.65"/>
    `,
  };

  const inner = scenes[cardId] || '';
  return `<svg class="card-art-svg" viewBox="0 0 160 80" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <radialGradient id="${gId}" cx="50%" cy="38%" r="72%">
        <stop offset="0%" stop-color="${s.mid}" stop-opacity="0.95"/>
        <stop offset="100%" stop-color="${s.dark}" stop-opacity="1"/>
      </radialGradient>
    </defs>
    <rect width="160" height="80" fill="url(#${gId})"/>
    ${inner}
  </svg>`;
}

/**
 * Custom inline SVG portraits for the two duelists.
 */
export function duelistPortraitSvg(side) {
  if (side === 'player') {
    return `<svg class="portrait-svg" viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <radialGradient id="p_bg" cx="50%" cy="35%" r="70%">
          <stop offset="0%" stop-color="#3a5f7d"/>
          <stop offset="100%" stop-color="#141e2e"/>
        </radialGradient>
      </defs>
      <rect width="64" height="64" rx="12" fill="url(#p_bg)"/>
      <path d="M12 64 Q18 42 32 42 Q46 42 52 64 Z" fill="#1e354d" stroke="#7dd4ff" stroke-width="1.5"/>
      <circle cx="32" cy="27" r="12" fill="#f0c9a8"/>
      <path d="M19 26 Q22 10 32 11 Q43 10 45 26 Q40 18 32 18 Q24 18 19 26 Z" fill="#c94a38"/>
      <polygon points="32,8 37,15 32,19 27,15" fill="#ffd970"/>
      <circle cx="28" cy="27" r="1.6" fill="#1e2a38"/>
      <circle cx="36" cy="27" r="1.6" fill="#1e2a38"/>
      <path d="M29 33 Q32 35 35 33" fill="none" stroke="#8c5442" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`;
  }
  return `<svg class="portrait-svg" viewBox="0 0 64 64" aria-hidden="true">
    <defs>
      <radialGradient id="e_bg" cx="50%" cy="35%" r="70%">
        <stop offset="0%" stop-color="#5d2434"/>
        <stop offset="100%" stop-color="#1a0d16"/>
      </radialGradient>
    </defs>
    <rect width="64" height="64" rx="12" fill="url(#e_bg)"/>
    <path d="M10 64 L20 38 L32 44 L44 38 L54 64 Z" fill="#2a1120" stroke="#f09c48" stroke-width="1.5"/>
    <path d="M18 34 Q20 10 32 9 Q44 10 46 34 L40 40 L24 40 Z" fill="#230e1c" stroke="#c84c44" stroke-width="1.4"/>
    <polygon points="32,5 36,14 32,17 28,14" fill="#ff7a4c"/>
    <circle cx="27" cy="27" r="2.2" fill="#ffcf5c"/>
    <circle cx="37" cy="27" r="2.2" fill="#ffcf5c"/>
    <path d="M26 35 L32 33 L38 35" fill="none" stroke="#ff8b66" stroke-width="1.4" stroke-linecap="round"/>
  </svg>`;
}
