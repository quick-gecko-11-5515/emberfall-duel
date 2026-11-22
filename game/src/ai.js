// EMBERFALL — AI Opponent (Archmage Vaelor)
// Evaluates lethal lines, card value with sigil synergies, smart spell targeting, and favorable combat trades.

import { CARD_BY_ID } from './cards.js';
import {
  canPlayCard,
  getEffectiveStats,
  getGuardCreatures,
  getValidAttackTargets,
  getValidSpellTargets,
  MAX_HAND,
  MAX_LIFE,
} from './state.js';

/**
 * Returns the next single action for the AI to execute:
 * - { type: 'play', cardUid, target }
 * - { type: 'attack', attackerUid, target }
 * - { type: 'end' }
 */
export function chooseNextAiAction(state) {
  if (state.winner || state.activeSide !== 'ai') return { type: 'end' };

  const ai = state.sides.ai;
  const player = state.sides.player;

  // 1. Check immediate lethal via ready attackers (when no player Guard blocks)
  const playerGuards = getGuardCreatures(state, 'player');
  const readyAttackers = ai.board.filter((c) => c.canAttack && !c.attacked);
  const totalBoardDmg = readyAttackers.reduce(
    (sum, c) => sum + getEffectiveStats(state, 'ai', c).atk,
    0,
  );

  if (playerGuards.length === 0 && totalBoardDmg >= player.life && readyAttackers.length > 0) {
    // Strike face with strongest ready creature first
    const strongest = [...readyAttackers].sort(
      (a, b) => getEffectiveStats(state, 'ai', b).atk - getEffectiveStats(state, 'ai', a).atk,
    )[0];
    return { type: 'attack', attackerUid: strongest.uid, target: { kind: 'hero', side: 'player' } };
  }

  // Check lethal via direct burn spells/creatures in hand
  for (const card of ai.hand) {
    if (!canPlayCard(state, 'ai', card)) continue;
    if (card.id === 'ember_bolt' && player.life <= 3) {
      return { type: 'play', cardUid: card.uid, target: { kind: 'hero', side: 'player' } };
    }
    if (card.id === 'ash_pyromancer' && player.life <= 2) {
      return { type: 'play', cardUid: card.uid, target: null };
    }
  }

  // 2. Evaluate playable cards in hand
  let bestPlay = null;
  let bestPlayScore = 0;

  for (const card of ai.hand) {
    if (!canPlayCard(state, 'ai', card)) continue;
    const evaluation = scoreCardPlay(state, card);
    if (evaluation && evaluation.score > bestPlayScore) {
      bestPlayScore = evaluation.score;
      bestPlay = { type: 'play', cardUid: card.uid, target: evaluation.target };
    }
  }

  // Prefer playing high-impact cards before attacking (buffs, draw, board clears, aura units)
  if (bestPlay && bestPlayScore >= 12) {
    return bestPlay;
  }

  // 3. Evaluate attacks with ready creatures
  const bestAttack = chooseBestAttack(state, readyAttackers);
  if (bestAttack) return bestAttack;

  // 4. Play any remaining reasonable cards after combat
  if (bestPlay && bestPlayScore > 0) {
    return bestPlay;
  }

  return { type: 'end' };
}

function scoreCardPlay(state, card) {
  const def = CARD_BY_ID[card.id];
  const ai = state.sides.ai;
  const player = state.sides.player;

  if (def.type === 'creature') {
    let score = card.cost * 4 + card.baseAtk * 2.2 + card.baseHp * 1.4;

    // Prioritize Guard when low on life or player has threatening creatures
    if (card.guard) {
      if (ai.life <= 12) score += 8;
      if (player.board.length >= 2) score += 5;
    }

    // Flame synergy bonuses
    const hasFlame = ai.board.some((c) => c.sigil === 'flame');
    if (card.id === 'cinder_imp' && hasFlame) score += 6;
    if (card.id === 'pyre_hound' && hasFlame) score += 7;
    if (card.id === 'volcanic_drake') {
      const flameCount = ai.board.filter((c) => c.sigil === 'flame').length;
      score += flameCount * 7;
    }

    // Tide draw & AoE
    if (card.id === 'tide_sprite') score += ai.hand.length <= 4 ? 6 : 3;
    if (card.id === 'frost_channeler') {
      const spellsInHand = ai.hand.filter((c) => CARD_BY_ID[c.id].type === 'spell').length;
      score += spellsInHand * 4;
    }
    if (card.id === 'abyssal_serpent') {
      score += player.board.length * 4;
      score += player.board.filter((c) => c.hp === 1).length * 6;
    }

    // Thorn heal value
    if (card.id === 'briar_stag' || card.id === 'elder_treant') {
      if (ai.life < MAX_LIFE - 2) score += 5;
    }
    if (card.id === 'elder_treant') score += ai.board.length * 4;
    if (card.id === 'bastion_golem') score += ai.board.length * 2.5;
    if (card.id === 'monolith_knight') {
      score += ai.board.filter((c) => c.guard).length * 5;
    }

    // Obsidian Colossus AoE value
    if (card.id === 'obsidian_colossus') {
      score += player.board.length * 5;
      score += player.board.filter((c) => c.hp <= 2).length * 7;
    }

    // Slight curve preference for spending energy cleanly
    if (card.cost === ai.energy) score += 3;

    return { score, target: null };
  }

  // Spell evaluations
  const valid = getValidSpellTargets(state, 'ai', card);
  const frostBonus = ai.board.filter((c) => c.keywords.includes('spell_grow')).length * 6;

  if (card.id === 'current_surge') {
    if (ai.hand.length >= MAX_HAND - 1) return { score: 2, target: null };
    return { score: (ai.hand.length <= 4 ? 19 : 11) + frostBonus, target: null };
  }

  if (card.id === 'ember_bolt') {
    let bestScore = 0;
    let bestTarget = null;
    for (const uid of valid.creatureUids) {
      const foe = player.board.find((c) => c.uid === uid);
      if (!foe) continue;
      const stats = getEffectiveStats(state, 'player', foe);
      let s = 10 + stats.atk * 2.5 + (foe.guard ? 6 : 0);
      if (foe.hp <= 3) s += 12; // Kills the creature cleanly
      if (foe.hp === 3) s += 4; // Exact damage efficiency
      if (s > bestScore) {
        bestScore = s;
        bestTarget = { kind: 'creature', uid };
      }
    }
    // Consider burning player face when player is low or board is empty
    const faceScore = player.life <= 7 ? 24 : player.board.length === 0 ? 13 : 8;
    if (faceScore > bestScore) {
      bestScore = faceScore;
      bestTarget = { kind: 'hero', side: 'player' };
    }
    return bestTarget ? { score: bestScore + frostBonus, target: bestTarget } : null;
  }

  if (card.id === 'tidal_lash') {
    let bestScore = 0;
    let bestTarget = null;
    for (const uid of valid.creatureUids) {
      const foe = player.board.find((c) => c.uid === uid);
      if (!foe) continue;
      const stats = getEffectiveStats(state, 'player', foe);
      let s = 12 + stats.atk * 2 + (foe.guard ? 4 : 0);
      if (foe.hp <= 2) s += 12;
      if (s > bestScore) {
        bestScore = s;
        bestTarget = { kind: 'creature', uid };
      }
    }
    return bestTarget ? { score: bestScore + frostBonus, target: bestTarget } : null;
  }

  if (card.id === 'verdant_bloom' || card.id === 'amber_ward') {
    let bestScore = 0;
    let bestTarget = null;
    for (const uid of valid.creatureUids) {
      const ally = ai.board.find((c) => c.uid === uid);
      if (!ally) continue;
      const stats = getEffectiveStats(state, 'ai', ally);
      let s = 11 + stats.atk * 2 + (ally.canAttack ? 4 : 0);
      if (card.id === 'amber_ward' && !ally.guard && ai.life <= 14) s += 6;
      if (card.id === 'verdant_bloom' && ai.life < MAX_LIFE - 1) s += 4;
      if (s > bestScore) {
        bestScore = s;
        bestTarget = { kind: 'creature', uid };
      }
    }
    return bestTarget ? { score: bestScore + frostBonus, target: bestTarget } : null;
  }

  return null;
}

function chooseBestAttack(state, readyAttackers) {
  if (readyAttackers.length === 0) return null;
  const valid = getValidAttackTargets(state, 'ai');
  const player = state.sides.player;

  let best = null;
  let bestScore = -999;

  for (const attacker of readyAttackers) {
    const aStats = getEffectiveStats(state, 'ai', attacker);
    if (aStats.atk <= 0) continue;

    // Score attacking each valid enemy creature
    for (const uid of valid.creatureUids) {
      const foe = player.board.find((c) => c.uid === uid);
      if (!foe) continue;
      const dStats = getEffectiveStats(state, 'player', foe);

      const killsFoe = aStats.atk >= foe.hp;
      const attackerDies = dStats.atk >= attacker.hp;
      const foeValue = dStats.atk * 2.5 + foe.hp + (foe.guard ? 5 : 0) + (foe.keywords.length * 2);
      const selfValue = aStats.atk * 2.2 + attacker.hp + (attacker.guard ? 3 : 0);

      let score = 0;
      if (killsFoe && !attackerDies) {
        // Free value trade!
        score = 30 + foeValue - dStats.atk;
      } else if (killsFoe && attackerDies) {
        // Trade up or clear Guard
        score = 12 + (foeValue - selfValue) + (foe.guard ? 8 : 0);
      } else if (!killsFoe && !attackerDies) {
        // Chip a Guard or high-threat creature safely
        score = foe.guard ? 10 + aStats.atk : 2 + (aStats.atk - dStats.atk);
      } else {
        // Suicide chip — only worth it if clearing a Guard blocking lethal or huge threat
        score = foe.guard ? 4 : -8;
      }

      if (score > bestScore) {
        bestScore = score;
        best = { type: 'attack', attackerUid: attacker.uid, target: { kind: 'creature', uid } };
      }
    }

    // Score attacking player face directly when unblocked
    if (valid.hero) {
      let faceScore = 15 + aStats.atk * 2.4;
      if (player.life <= 10) faceScore += 8;
      if (faceScore > bestScore) {
        bestScore = faceScore;
        best = { type: 'attack', attackerUid: attacker.uid, target: { kind: 'hero', side: 'player' } };
      }
    }
  }

  // Only attack if score is positive (avoid suicidal non-guard attacks unless forced)
  return bestScore > 0 ? best : null;
}
