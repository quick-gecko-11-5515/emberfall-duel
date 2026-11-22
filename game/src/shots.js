// EMBERFALL — Deterministic Screenshot States
// Reads ?shot=title|table|win|loss (and optional &seed=N) to stage fixed, authentic gameplay scenes.

import { createCardInstance, createInitialState, pushLog } from './state.js';

export function getShotParams() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const seedRaw = Number(params.get('seed'));
  const seed = Number.isInteger(seedRaw) && seedRaw > 0 ? seedRaw : 42;
  if (shot === 'title' || shot === 'table' || shot === 'win' || shot === 'loss') {
    return { shot, seed };
  }
  return { shot: null, seed };
}

function makeBoardCreature(state, cardId, opts = {}) {
  const c = createCardInstance(state, cardId);
  c.summoningSick = opts.summoningSick ?? false;
  c.canAttack = opts.canAttack ?? true;
  c.attacked = opts.attacked ?? false;
  c.bonusAtk = opts.bonusAtk ?? 0;
  if (opts.maxHp !== undefined) c.maxHp = opts.maxHp;
  if (opts.hp !== undefined) c.hp = opts.hp;
  if (opts.guard !== undefined) c.guard = opts.guard;
  return c;
}

export function createShotState(shot, seed = 42) {
  const state = createInitialState(seed);
  state.isShot = true;

  if (shot === 'title') {
    state.screen = 'title';
    return state;
  }

  if (shot === 'table') {
    // Rich mid-game Turn 6 battle: 14 Life vs 11 Life, all 4 sigils in play, Guard & Flame Bond active
    state.screen = 'battle';
    state.turnNumber = 6;
    state.activeSide = 'player';
    state.log = [];

    const p = state.sides.player;
    const e = state.sides.ai;

    p.life = 14;
    p.energy = 6;
    p.maxEnergy = 6;
    p.turnsTaken = 6;
    p.deck = p.deck.slice(0, 19);

    e.life = 11;
    e.energy = 5;
    e.maxEnergy = 5;
    e.turnsTaken = 5;
    e.deck = e.deck.slice(0, 18);
    e.hand = ['ember_bolt', 'briar_stag', 'quarry_sentry', 'tidal_lash'].map((id) =>
      createCardInstance(state, id),
    );

    p.board = [
      makeBoardCreature(state, 'monolith_knight', { hp: 5, canAttack: true }),
      makeBoardCreature(state, 'pyre_hound', { hp: 2, canAttack: true }),
      makeBoardCreature(state, 'ash_pyromancer', { hp: 2, canAttack: true }),
    ];

    e.board = [
      makeBoardCreature(state, 'bastion_golem', { hp: 3, canAttack: false }),
      makeBoardCreature(state, 'frost_channeler', { bonusAtk: 1, maxHp: 5, hp: 5, canAttack: false }),
      makeBoardCreature(state, 'briar_stag', { hp: 5, canAttack: false }),
    ];

    p.hand = [
      'ember_bolt',
      'current_surge',
      'verdant_bloom',
      'obsidian_colossus',
      'volcanic_drake',
    ].map((id) => createCardInstance(state, id));

    state.stats = {
      turns: 6,
      playerCardsPlayed: 8,
      aiCardsPlayed: 7,
      playerDamageDealt: 11,
      aiDamageDealt: 8,
      creaturesSlain: 4,
      finalBlow: '',
    };

    const entries = [
      ['system', 'Turn 4 — Monolith Knight held the vanguard with Stone Guard.', 'stone'],
      ['player', 'Ash Pyromancer seared Archmage Vaelor for 2 damage.', 'flame'],
      ['ai', 'Archmage Vaelor summoned Bastion Golem (2/5 Guard).', 'stone'],
      ['ai', 'Archmage Vaelor cast Tidal Lash on Ash Pyromancer (2 dmg).', 'tide'],
      ['ai', 'Frost Channeler surged with Tide magic (+1/+1).', 'tide'],
      ['player', 'Turn 6 — You gain 6 Energy and draw Volcanic Drake.', 'flame'],
    ];
    for (const [actor, text, sigil] of entries) {
      pushLog(state, actor, text, sigil);
    }
    return state;
  }

  if (shot === 'win') {
    state.screen = 'win';
    state.winner = 'player';
    state.turnNumber = 8;
    state.activeSide = 'player';
    state.log = [];

    const p = state.sides.player;
    const e = state.sides.ai;

    p.life = 9;
    p.energy = 2;
    p.maxEnergy = 8;
    p.turnsTaken = 8;
    p.deck = p.deck.slice(0, 15);

    e.life = 0;
    e.energy = 0;
    e.maxEnergy = 7;
    e.turnsTaken = 7;
    e.deck = e.deck.slice(0, 14);
    e.hand = ['quarry_sentry', 'current_surge'].map((id) => createCardInstance(state, id));

    p.board = [
      makeBoardCreature(state, 'monolith_knight', { hp: 3, canAttack: false, attacked: true }),
      makeBoardCreature(state, 'pyre_hound', { bonusAtk: 2, hp: 2, canAttack: false, attacked: true }),
      makeBoardCreature(state, 'volcanic_drake', { hp: 4, canAttack: false, attacked: true }),
    ];
    e.board = [
      makeBoardCreature(state, 'frost_channeler', { hp: 2, canAttack: false }),
    ];
    p.hand = ['ember_bolt', 'verdant_bloom', 'tide_sprite'].map((id) =>
      createCardInstance(state, id),
    );

    state.stats = {
      turns: 8,
      playerCardsPlayed: 12,
      aiCardsPlayed: 10,
      playerDamageDealt: 24,
      aiDamageDealt: 13,
      creaturesSlain: 8,
      finalBlow: 'Volcanic Drake struck Archmage Vaelor for 6!',
    };

    const entries = [
      ['player', 'Lyra, Sigilbound summoned Volcanic Drake (6/4).', 'flame'],
      ['player', 'Volcanic Drake ignited Pyre Hound (+2 ATK).', 'flame'],
      ['player', 'Monolith Knight broke through Bastion Golem.', 'stone'],
      ['player', 'Pyre Hound struck Archmage Vaelor for 6 damage!', 'flame'],
      ['player', 'Volcanic Drake struck Archmage Vaelor for 6 damage!', 'flame'],
      ['player', 'VICTORY! Volcanic Drake struck Archmage Vaelor for 6!', 'flame'],
    ];
    for (const [actor, text, sigil] of entries) {
      pushLog(state, actor, text, sigil);
    }
    return state;
  }

  // shot === 'loss'
  state.screen = 'loss';
  state.winner = 'ai';
  state.turnNumber = 7;
  state.activeSide = 'ai';
  state.log = [];

  const p = state.sides.player;
  const e = state.sides.ai;

  p.life = 0;
  p.energy = 0;
  p.maxEnergy = 7;
  p.turnsTaken = 7;
  p.deck = p.deck.slice(0, 16);

  e.life = 7;
  e.energy = 1;
  e.maxEnergy = 7;
  e.turnsTaken = 7;
  e.deck = e.deck.slice(0, 15);
  e.hand = ['ember_bolt', 'amber_ward', 'moss_sprout'].map((id) =>
    createCardInstance(state, id),
  );

  p.board = [
    makeBoardCreature(state, 'briar_stag', { hp: 2, canAttack: false }),
  ];
  e.board = [
    makeBoardCreature(state, 'obsidian_colossus', { hp: 6, canAttack: false, attacked: true }),
    makeBoardCreature(state, 'abyssal_serpent', { hp: 4, canAttack: false, attacked: true }),
    makeBoardCreature(state, 'ash_pyromancer', { hp: 3, canAttack: false }),
  ];
  p.hand = ['current_surge', 'elder_treant', 'pyre_hound', 'amber_ward'].map((id) =>
    createCardInstance(state, id),
  );

  state.stats = {
    turns: 7,
    playerCardsPlayed: 10,
    aiCardsPlayed: 11,
    playerDamageDealt: 15,
    aiDamageDealt: 22,
    creaturesSlain: 7,
    finalBlow: 'Obsidian Colossus crushed Lyra, Sigilbound for 5!',
  };

  const entries = [
    ['ai', 'Archmage Vaelor summoned Obsidian Colossus (5/8 Guard).', 'stone'],
    ['ai', 'Obsidian Colossus shook the lane, dealing 2 to all enemy creatures.', 'stone'],
    ['ai', 'Abyssal Serpent struck Lyra, Sigilbound for 4 damage!', 'tide'],
    ['ai', 'Obsidian Colossus struck Lyra, Sigilbound for 5 damage!', 'stone'],
    ['ai', 'DEFEAT! Obsidian Colossus crushed Lyra, Sigilbound for 5!', 'stone'],
  ];
  for (const [actor, text, sigil] of entries) {
    pushLog(state, actor, text, sigil);
  }
  return state;
}
