// EMBERFALL — Game State & Rules Engine
// Pure deterministic state transitions with seeded PRNG, synergies, Guard rules, and event emissions.

import { CARD_BY_ID, DECK_RECIPE } from './cards.js';

export const MAX_LIFE = 20;
export const MAX_ENERGY = 10;
export const MAX_BOARD = 5;
export const MAX_HAND = 8;
export const STARTING_HAND = 5;

/** Deterministic Mulberry32 PRNG */
export function createRng(seed = 1) {
  let a = (seed >>> 0) || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(list, rng) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function otherSide(side) {
  return side === 'player' ? 'ai' : 'player';
}

export function createCardInstance(state, cardId) {
  const def = CARD_BY_ID[cardId];
  if (!def) throw new Error(`Unknown card: ${cardId}`);
  const uid = `c${state.nextUid++}`;
  return {
    uid,
    id: def.id,
    name: def.name,
    sigil: def.sigil,
    type: def.type,
    cost: def.cost,
    baseAtk: def.atk ?? 0,
    baseHp: def.hp ?? 0,
    bonusAtk: 0,
    maxHp: def.hp ?? 0,
    hp: def.hp ?? 0,
    guard: def.keywords?.includes('guard') ?? false,
    keywords: [...(def.keywords ?? [])],
    canAttack: false,
    attacked: false,
    summoningSick: true,
    justPlayed: false,
  };
}

export function createInitialState(seed = Date.now() & 0xfffffff) {
  const rng = createRng(seed);
  const state = {
    seed,
    rng,
    nextUid: 1,
    screen: 'battle', // 'title' | 'battle' | 'win' | 'loss'
    turnNumber: 1,
    activeSide: 'player',
    winner: null,
    selectedAttackerUid: null,
    targetingSpellUid: null,
    log: [],
    events: [], // transient FX events consumed by renderer
    stats: {
      turns: 1,
      playerCardsPlayed: 0,
      aiCardsPlayed: 0,
      playerDamageDealt: 0,
      aiDamageDealt: 0,
      creaturesSlain: 0,
      finalBlow: '',
    },
    sides: {
      player: {
        name: 'Lyra, Sigilbound',
        title: 'Keeper of Embers',
        life: MAX_LIFE,
        energy: 1,
        maxEnergy: 1,
        turnsTaken: 1,
        deck: [],
        hand: [],
        board: [],
      },
      ai: {
        name: 'Archmage Vaelor',
        title: 'Warden of the Rift',
        life: MAX_LIFE,
        energy: 0,
        maxEnergy: 0,
        turnsTaken: 0,
        deck: [],
        hand: [],
        board: [],
      },
    },
  };

  state.sides.player.deck = shuffle(DECK_RECIPE, rng);
  state.sides.ai.deck = shuffle(DECK_RECIPE, rng);

  for (let i = 0; i < STARTING_HAND; i++) {
    drawCard(state, 'player', { silent: true });
    drawCard(state, 'ai', { silent: true });
  }

  pushLog(state, 'system', 'The Four Sigils awaken. Your duel against Archmage Vaelor begins!');
  pushLog(state, 'player', 'Turn 1 — You gain 1 Energy.');
  return state;
}

export function pushLog(state, actor, text, sigil = null) {
  state.log.unshift({
    id: `log_${state.nextUid++}`,
    turn: state.turnNumber,
    actor,
    text,
    sigil,
  });
  if (state.log.length > 40) state.log.length = 40;
}

export function emitEvent(state, ev) {
  state.events.push(ev);
}

export function consumeEvents(state) {
  const out = state.events;
  state.events = [];
  return out;
}

/** Computes effective attack & health including live sigil auras */
export function getEffectiveStats(state, side, creature) {
  const allies = state.sides[side].board;
  let atk = creature.baseAtk + creature.bonusAtk;
  const maxHp = creature.maxHp;
  const hp = creature.hp;

  // Flame Bond (Pyre Hound): +1 ATK while controlling another Flame ally
  if (creature.keywords.includes('flame_bond')) {
    const hasOtherFlame = allies.some((a) => a.uid !== creature.uid && a.sigil === 'flame');
    if (hasOtherFlame) atk += 1;
  }

  // Monolith Knight aura: other Guard allies have +1 ATK
  if (creature.guard) {
    const guardAuraCount = allies.filter(
      (a) => a.uid !== creature.uid && a.keywords.includes('guard_aura'),
    ).length;
    atk += guardAuraCount;
  }

  return {
    atk,
    hp,
    maxHp,
    atkBuffed: atk > creature.baseAtk,
    hpBuffed: maxHp > creature.baseHp && hp >= creature.baseHp,
    damaged: hp < maxHp,
  };
}

export function drawCard(state, side, { silent = false } = {}) {
  const duelist = state.sides[side];
  if (duelist.deck.length === 0) {
    applyHeroDamage(state, side, 1, 'Deck Exhaustion');
    if (!silent) {
      pushLog(state, side, `${duelist.name}'s deck is empty! Took 1 fatigue damage.`);
    }
    return null;
  }
  const cardId = duelist.deck.pop();
  const inst = createCardInstance(state, cardId);
  if (duelist.hand.length >= MAX_HAND) {
    if (!silent) {
      pushLog(state, side, `${duelist.name}'s hand is full — ${inst.name} dissolved.`);
    }
    return null;
  }
  inst.justDrawn = true;
  duelist.hand.push(inst);
  if (!silent) {
    emitEvent(state, { type: 'draw', side, uid: inst.uid });
  }
  return inst;
}

export function healHero(state, side, amount) {
  if (amount <= 0) return 0;
  const duelist = state.sides[side];
  const before = duelist.life;
  duelist.life = Math.min(MAX_LIFE, duelist.life + amount);
  const gained = duelist.life - before;
  if (gained > 0) {
    emitEvent(state, { type: 'float', target: `hero:${side}`, text: `+${gained}`, tone: 'heal' });
  }
  return gained;
}

export function applyHeroDamage(state, targetSide, amount, sourceLabel = '') {
  if (amount <= 0 || state.winner) return;
  const target = state.sides[targetSide];
  target.life = Math.max(0, target.life - amount);
  if (targetSide === 'ai') state.stats.playerDamageDealt += amount;
  else state.stats.aiDamageDealt += amount;
  emitEvent(state, { type: 'float', target: `hero:${targetSide}`, text: `-${amount}`, tone: 'damage' });
  emitEvent(state, { type: 'shake', target: `hero:${targetSide}` });
  checkWinner(state, sourceLabel);
}

export function applyCreatureDamage(state, targetSide, creature, amount) {
  if (amount <= 0 || creature.hp <= 0) return false;
  creature.hp -= amount;
  emitEvent(state, { type: 'float', target: `card:${creature.uid}`, text: `-${amount}`, tone: 'damage' });
  emitEvent(state, { type: 'shake', target: `card:${creature.uid}` });
  if (creature.hp > 0 && creature.keywords.includes('enrage')) {
    creature.bonusAtk += 2;
    pushLog(state, targetSide, `${creature.name} roared with fury (+2 ATK)!`, 'thorn');
    emitEvent(state, { type: 'float', target: `card:${creature.uid}`, text: '+2 ATK', tone: 'buff' });
  }
  return creature.hp <= 0;
}

export function cleanupDeadCreatures(state) {
  for (const side of ['player', 'ai']) {
    const board = state.sides[side].board;
    const dead = board.filter((c) => c.hp <= 0);
    if (dead.length > 0) {
      state.sides[side].board = board.filter((c) => c.hp > 0);
      for (const c of dead) {
        state.stats.creaturesSlain += 1;
        pushLog(state, side, `${c.name} was defeated.`, c.sigil);
      }
    }
  }
}

export function checkWinner(state, finalBlow = '') {
  if (state.winner) return state.winner;
  if (state.sides.ai.life <= 0) {
    state.winner = 'player';
    state.screen = 'win';
    state.selectedAttackerUid = null;
    state.targetingSpellUid = null;
    state.stats.finalBlow = finalBlow || 'Archmage Vaelor fell to 0 Life.';
    pushLog(state, 'player', `VICTORY! ${state.stats.finalBlow}`);
    emitEvent(state, { type: 'win' });
  } else if (state.sides.player.life <= 0) {
    state.winner = 'ai';
    state.screen = 'loss';
    state.selectedAttackerUid = null;
    state.targetingSpellUid = null;
    state.stats.finalBlow = finalBlow || 'Your Life reached 0.';
    pushLog(state, 'ai', `DEFEAT! ${state.stats.finalBlow}`);
    emitEvent(state, { type: 'loss' });
  }
  return state.winner;
}

export function getGuardCreatures(state, side) {
  return state.sides[side].board.filter((c) => c.guard && c.hp > 0);
}

/** Returns valid targets for a creature attack: { hero: boolean, creatureUids: string[] } */
export function getValidAttackTargets(state, attackerSide) {
  const enemy = otherSide(attackerSide);
  const guards = getGuardCreatures(state, enemy);
  if (guards.length > 0) {
    return { hero: false, creatureUids: guards.map((c) => c.uid) };
  }
  return {
    hero: true,
    creatureUids: state.sides[enemy].board.map((c) => c.uid),
  };
}

/** Returns valid targets for a spell card: { heroEnemy, creatureUids } */
export function getValidSpellTargets(state, casterSide, card) {
  const def = CARD_BY_ID[card.id];
  const enemy = otherSide(casterSide);
  if (def.type !== 'spell') return { heroEnemy: false, creatureUids: [] };
  if (def.target === 'enemy_any') {
    return { heroEnemy: true, creatureUids: state.sides[enemy].board.map((c) => c.uid) };
  }
  if (def.target === 'enemy_creature') {
    return { heroEnemy: false, creatureUids: state.sides[enemy].board.map((c) => c.uid) };
  }
  if (def.target === 'ally_creature') {
    return { heroEnemy: false, creatureUids: state.sides[casterSide].board.map((c) => c.uid) };
  }
  return { heroEnemy: false, creatureUids: [] };
}

export function canPlayCard(state, side, card) {
  if (state.winner || state.activeSide !== side) return false;
  const duelist = state.sides[side];
  if (duelist.energy < card.cost) return false;
  const def = CARD_BY_ID[card.id];
  if (def.type === 'creature') {
    return duelist.board.length < MAX_BOARD;
  }
  if (def.target === 'none') return true;
  const targets = getValidSpellTargets(state, side, card);
  return targets.heroEnemy || targets.creatureUids.length > 0;
}

function triggerSpellGrow(state, side) {
  for (const c of state.sides[side].board) {
    if (c.keywords.includes('spell_grow')) {
      c.bonusAtk += 1;
      c.maxHp += 1;
      c.hp += 1;
      emitEvent(state, { type: 'float', target: `card:${c.uid}`, text: '+1/+1', tone: 'buff' });
      pushLog(state, side, `${c.name} surged with Tide magic (+1/+1).`, 'tide');
    }
  }
}

export function playCard(state, side, cardUid, target = null) {
  const duelist = state.sides[side];
  const enemy = otherSide(side);
  const idx = duelist.hand.findIndex((c) => c.uid === cardUid);
  if (idx === -1) return { ok: false, reason: 'Card not in hand.' };
  const card = duelist.hand[idx];
  if (!canPlayCard(state, side, card)) return { ok: false, reason: 'Cannot play this card right now.' };

  const def = CARD_BY_ID[card.id];

  // Validate target for targeted spells
  if (def.type === 'spell' && def.target !== 'none') {
    const valid = getValidSpellTargets(state, side, card);
    if (!target) return { ok: false, reason: 'Select a target.' };
    if (target.kind === 'hero' && !(target.side === enemy && valid.heroEnemy)) {
      return { ok: false, reason: 'Invalid target.' };
    }
    if (target.kind === 'creature' && !valid.creatureUids.includes(target.uid)) {
      return { ok: false, reason: 'Invalid target.' };
    }
  }

  duelist.energy -= card.cost;
  duelist.hand.splice(idx, 1);
  if (side === 'player') state.stats.playerCardsPlayed += 1;
  else state.stats.aiCardsPlayed += 1;
  state.selectedAttackerUid = null;
  state.targetingSpellUid = null;

  if (def.type === 'creature') {
    card.summoningSick = true;
    card.canAttack = false;
    card.attacked = false;
    card.justPlayed = true;
    duelist.board.push(card);
    emitEvent(state, { type: 'play_creature', side, uid: card.uid, sigil: card.sigil });
    pushLog(state, side, `${duelist.name} summoned ${card.name} (${card.baseAtk}/${card.baseHp}${card.guard ? ' Guard' : ''}).`, card.sigil);
    resolveCreatureOnPlay(state, side, card, def.onPlay);
    cleanupDeadCreatures(state);
    return { ok: true };
  }

  // Spell resolution
  emitEvent(state, { type: 'play_spell', side, sigil: card.sigil, name: card.name });
  resolveSpellEffect(state, side, card, def.effect, target);
  triggerSpellGrow(state, side);
  cleanupDeadCreatures(state);
  return { ok: true };
}

function resolveCreatureOnPlay(state, side, card, onPlay) {
  if (!onPlay) return;
  const enemy = otherSide(side);
  const allies = state.sides[side].board.filter((c) => c.uid !== card.uid);

  switch (onPlay.kind) {
    case 'buff_other_sigil': {
      const candidates = allies.filter((c) => c.sigil === onPlay.sigil);
      if (candidates.length > 0) {
        // Buff the strongest allied creature of that sigil
        candidates.sort((a, b) => getEffectiveStats(state, side, b).atk - getEffectiveStats(state, side, a).atk);
        const chosen = candidates[0];
        chosen.bonusAtk += onPlay.atk;
        chosen.maxHp += onPlay.hp;
        chosen.hp += onPlay.hp;
        emitEvent(state, { type: 'float', target: `card:${chosen.uid}`, text: `+${onPlay.atk} ATK`, tone: 'buff' });
        pushLog(state, side, `${card.name} rallied ${chosen.name} (+${onPlay.atk} ATK).`, card.sigil);
      }
      break;
    }
    case 'buff_all_other_sigil': {
      const targets = allies.filter((c) => c.sigil === onPlay.sigil);
      for (const t of targets) {
        t.bonusAtk += onPlay.atk;
        emitEvent(state, { type: 'float', target: `card:${t.uid}`, text: `+${onPlay.atk} ATK`, tone: 'buff' });
      }
      if (targets.length > 0) {
        pushLog(state, side, `${card.name} ignited ${targets.length} Flame ${targets.length === 1 ? 'ally' : 'allies'} (+${onPlay.atk} ATK).`, 'flame');
      }
      break;
    }
    case 'damage_enemy_hero': {
      pushLog(state, side, `${card.name} seared ${state.sides[enemy].name} for ${onPlay.amount} damage.`, card.sigil);
      applyHeroDamage(state, enemy, onPlay.amount, `${card.name} burned ${state.sides[enemy].name} for ${onPlay.amount}.`);
      break;
    }
    case 'draw': {
      for (let i = 0; i < onPlay.amount; i++) drawCard(state, side);
      pushLog(state, side, `${card.name} drew ${onPlay.amount} card.`, card.sigil);
      break;
    }
    case 'heal_hero': {
      const healed = healHero(state, side, onPlay.amount);
      if (healed > 0) pushLog(state, side, `${card.name} restored ${healed} Life.`, card.sigil);
      break;
    }
    case 'buff_all_other': {
      for (const t of allies) {
        t.bonusAtk += onPlay.atk;
        t.maxHp += onPlay.hp;
        t.hp += onPlay.hp;
        emitEvent(state, { type: 'float', target: `card:${t.uid}`, text: `+${onPlay.hp} HP`, tone: 'buff' });
      }
      if (allies.length > 0) {
        pushLog(state, side, `${card.name} fortified ${allies.length} ${allies.length === 1 ? 'ally' : 'allies'} (+0/+${onPlay.hp}).`, card.sigil);
      }
      break;
    }
    case 'buff_all_other_and_heal': {
      for (const t of allies) {
        t.maxHp += onPlay.hp;
        t.hp += onPlay.hp;
        emitEvent(state, { type: 'float', target: `card:${t.uid}`, text: `+${onPlay.hp} HP`, tone: 'buff' });
      }
      const healed = healHero(state, side, onPlay.heal);
      pushLog(state, side, `${card.name} blessed allies (+0/+${onPlay.hp})${healed ? ` and restored ${healed} Life` : ''}.`, card.sigil);
      break;
    }
    case 'aoe_enemy': {
      const foes = state.sides[enemy].board;
      for (const f of foes) applyCreatureDamage(state, enemy, f, onPlay.amount);
      if (foes.length > 0) {
        pushLog(state, side, `${card.name} shook the lane, dealing ${onPlay.amount} to all enemy creatures.`, card.sigil);
      }
      break;
    }
    case 'aoe_enemy_and_draw': {
      const foes = state.sides[enemy].board;
      for (const f of foes) applyCreatureDamage(state, enemy, f, onPlay.amount);
      for (let i = 0; i < onPlay.draw; i++) drawCard(state, side);
      pushLog(state, side, `${card.name} swept enemy creatures for ${onPlay.amount} and drew ${onPlay.draw}.`, card.sigil);
      break;
    }
  }
}

function resolveSpellEffect(state, side, card, effect, target) {
  const enemy = otherSide(side);
  const duelist = state.sides[side];

  switch (effect.kind) {
    case 'damage': {
      if (target.kind === 'hero') {
        pushLog(state, side, `${duelist.name} cast ${card.name} on ${state.sides[enemy].name} for ${effect.amount} damage.`, card.sigil);
        applyHeroDamage(state, enemy, effect.amount, `${card.name} struck ${state.sides[enemy].name} for ${effect.amount}!`);
      } else {
        const foe = state.sides[enemy].board.find((c) => c.uid === target.uid);
        if (foe) {
          pushLog(state, side, `${duelist.name} cast ${card.name} on ${foe.name} for ${effect.amount} damage.`, card.sigil);
          applyCreatureDamage(state, enemy, foe, effect.amount);
        }
      }
      break;
    }
    case 'draw': {
      for (let i = 0; i < effect.amount; i++) drawCard(state, side);
      pushLog(state, side, `${duelist.name} cast ${card.name} and drew ${effect.amount} cards.`, card.sigil);
      break;
    }
    case 'damage_and_draw': {
      const foe = state.sides[enemy].board.find((c) => c.uid === target.uid);
      if (foe) {
        applyCreatureDamage(state, enemy, foe, effect.amount);
        pushLog(state, side, `${duelist.name} cast ${card.name} on ${foe.name} (${effect.amount} dmg) and drew ${effect.draw}.`, card.sigil);
      }
      for (let i = 0; i < effect.draw; i++) drawCard(state, side);
      break;
    }
    case 'buff_and_heal': {
      const ally = duelist.board.find((c) => c.uid === target.uid);
      if (ally) {
        ally.bonusAtk += effect.atk;
        ally.maxHp += effect.hp;
        ally.hp += effect.hp;
        emitEvent(state, { type: 'float', target: `card:${ally.uid}`, text: `+${effect.atk}/+${effect.hp}`, tone: 'buff' });
      }
      const healed = healHero(state, side, effect.heal);
      pushLog(state, side, `${duelist.name} cast ${card.name} on ${ally ? ally.name : 'an ally'} (+${effect.atk}/+${effect.hp})${healed ? ` and restored ${healed} Life` : ''}.`, card.sigil);
      break;
    }
    case 'buff_and_guard': {
      const ally = duelist.board.find((c) => c.uid === target.uid);
      if (ally) {
        ally.bonusAtk += effect.atk;
        ally.maxHp += effect.hp;
        ally.hp += effect.hp;
        ally.guard = true;
        emitEvent(state, { type: 'float', target: `card:${ally.uid}`, text: `+${effect.atk}/+${effect.hp} Guard`, tone: 'buff' });
        pushLog(state, side, `${duelist.name} cast ${card.name} on ${ally.name} (+${effect.atk}/+${effect.hp}, Guard).`, card.sigil);
      }
      break;
    }
  }
}

export function performAttack(state, attackerSide, attackerUid, target) {
  if (state.winner || state.activeSide !== attackerSide) return { ok: false, reason: 'Not your turn.' };
  const enemy = otherSide(attackerSide);
  const attacker = state.sides[attackerSide].board.find((c) => c.uid === attackerUid);
  if (!attacker || !attacker.canAttack || attacker.attacked) {
    return { ok: false, reason: 'That creature cannot attack this turn.' };
  }

  const valid = getValidAttackTargets(state, attackerSide);
  if (target.kind === 'hero') {
    if (!valid.hero) {
      return { ok: false, reason: 'A Stone Guard creature blocks the path! Attack Guard first.' };
    }
    const { atk } = getEffectiveStats(state, attackerSide, attacker);
    attacker.canAttack = false;
    attacker.attacked = true;
    state.selectedAttackerUid = null;
    emitEvent(state, { type: 'attack', attackerUid, target: `hero:${enemy}` });
    pushLog(state, attackerSide, `${attacker.name} struck ${state.sides[enemy].name} for ${atk} damage!`, attacker.sigil);
    applyHeroDamage(state, enemy, atk, `${attacker.name} struck ${state.sides[enemy].name} for ${atk}!`);
    return { ok: true };
  }

  if (target.kind === 'creature') {
    if (!valid.creatureUids.includes(target.uid)) {
      return { ok: false, reason: 'A Guard creature must be attacked first!' };
    }
    const defender = state.sides[enemy].board.find((c) => c.uid === target.uid);
    if (!defender) return { ok: false, reason: 'Target missing.' };

    const aStats = getEffectiveStats(state, attackerSide, attacker);
    const dStats = getEffectiveStats(state, enemy, defender);

    attacker.canAttack = false;
    attacker.attacked = true;
    state.selectedAttackerUid = null;

    emitEvent(state, { type: 'attack', attackerUid, target: `card:${defender.uid}` });
    pushLog(
      state,
      attackerSide,
      `${attacker.name} (${aStats.atk}) clashed with ${defender.name} (${dStats.atk}).`,
      attacker.sigil,
    );

    // Simultaneous damage exchange
    applyCreatureDamage(state, enemy, defender, aStats.atk);
    applyCreatureDamage(state, attackerSide, attacker, dStats.atk);
    cleanupDeadCreatures(state);
    return { ok: true };
  }

  return { ok: false, reason: 'Invalid attack target.' };
}

export function endTurn(state) {
  if (state.winner) return;
  const endingSide = state.activeSide;
  state.selectedAttackerUid = null;
  state.targetingSpellUid = null;

  // End-of-turn triggers for active side
  for (const c of state.sides[endingSide].board) {
    if (c.keywords.includes('regen_hero')) {
      const gained = healHero(state, endingSide, 1);
      if (gained > 0) {
        pushLog(state, endingSide, `${c.name} restored 1 Life at turn end.`, 'thorn');
      }
    }
  }

  const nextSide = otherSide(endingSide);
  state.activeSide = nextSide;
  if (nextSide === 'player') {
    state.turnNumber += 1;
    state.stats.turns = state.turnNumber;
  }

  const duelist = state.sides[nextSide];
  duelist.turnsTaken += 1;
  duelist.maxEnergy = Math.min(MAX_ENERGY, duelist.turnsTaken);
  duelist.energy = duelist.maxEnergy;

  for (const c of duelist.board) {
    c.summoningSick = false;
    c.canAttack = true;
    c.attacked = false;
    c.justPlayed = false;
  }
  for (const c of duelist.hand) {
    c.justDrawn = false;
  }

  drawCard(state, nextSide);
  if (state.winner) return;

  pushLog(
    state,
    nextSide,
    nextSide === 'player'
      ? `Turn ${state.turnNumber} — You gain ${duelist.maxEnergy} Energy and draw a card.`
      : `Turn ${state.turnNumber} — ${duelist.name} gains ${duelist.maxEnergy} Energy.`,
  );
  emitEvent(state, { type: 'turn', side: nextSide });
}
