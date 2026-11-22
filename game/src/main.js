// EMBERFALL — Main Entry, Input Handling, and AI Turn Orchestration

import { chooseNextAiAction } from './ai.js';
import { audio } from './audio.js';
import { CARD_BY_ID } from './cards.js';
import { playVisualEvents, renderApp } from './render.js';
import { createShotState, getShotParams } from './shots.js';
import {
  canPlayCard,
  consumeEvents,
  createInitialState,
  endTurn,
  getValidAttackTargets,
  getValidSpellTargets,
  performAttack,
  playCard,
} from './state.js';

const appEl = document.getElementById('app');
const fxEl = document.getElementById('fx-layer');
const srStatus = document.getElementById('sr-status');

let state = null;
let aiTimer = null;
let noticeTimer = null;

const ui = {
  muted: false,
  showHelp: false,
  notice: '',
};

function announce(msg) {
  if (srStatus && msg) srStatus.textContent = msg;
}

function setNotice(msg, ms = 2200) {
  ui.notice = msg;
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => {
    ui.notice = '';
    sync();
  }, ms);
  announce(msg);
}

function clearAiTimer() {
  if (aiTimer !== null) {
    window.clearTimeout(aiTimer);
    aiTimer = null;
  }
}

function triggerAudioForEvents(events) {
  for (const ev of events) {
    if (ev.type === 'play_creature') audio.playCard();
    else if (ev.type === 'play_spell') audio.playSpell();
    else if (ev.type === 'attack') audio.attack();
    else if (ev.type === 'float' && ev.tone === 'heal') audio.heal();
    else if (ev.type === 'turn') audio.turnChime();
    else if (ev.type === 'win') audio.victory();
    else if (ev.type === 'loss') audio.defeat();
  }
}

function sync() {
  const events = consumeEvents(state);
  renderApp(appEl, state, ui);
  if (!state.isShot) {
    playVisualEvents(fxEl, appEl, events);
    triggerAudioForEvents(events);
  }
}

function startNewDuel(seed) {
  clearAiTimer();
  ui.showHelp = false;
  ui.notice = '';
  state = createInitialState(seed);
  state.screen = 'battle';
  audio.turnChime();
  sync();
  announce('New duel started. Your turn.');
}

function goToTitle() {
  clearAiTimer();
  ui.showHelp = false;
  ui.notice = '';
  state = createInitialState();
  state.screen = 'title';
  sync();
}

function scheduleAiStep(delayMs = 620) {
  clearAiTimer();
  if (state.winner || state.activeSide !== 'ai' || state.screen !== 'battle') return;
  aiTimer = window.setTimeout(() => {
    aiTimer = null;
    if (state.winner || state.activeSide !== 'ai') return;

    const action = chooseNextAiAction(state);
    if (action.type === 'play') {
      playCard(state, 'ai', action.cardUid, action.target);
      sync();
      if (!state.winner && state.activeSide === 'ai') scheduleAiStep(680);
      return;
    }
    if (action.type === 'attack') {
      performAttack(state, 'ai', action.attackerUid, action.target);
      sync();
      if (!state.winner && state.activeSide === 'ai') scheduleAiStep(680);
      return;
    }

    endTurn(state);
    sync();
    if (!state.winner) announce(`Turn ${state.turnNumber}. Your turn.`);
  }, delayMs);
}

function handleHandCardClick(uid) {
  if (state.activeSide !== 'player' || state.winner) return;
  const card = state.sides.player.hand.find((c) => c.uid === uid);
  if (!card) return;

  // Toggle off if already targeting this spell
  if (state.targetingSpellUid === uid) {
    state.targetingSpellUid = null;
    sync();
    return;
  }

  if (!canPlayCard(state, 'player', card)) {
    const def = CARD_BY_ID[card.id];
    audio.blocked();
    if (state.sides.player.energy < card.cost) {
      setNotice(`Need ${card.cost} Energy to play ${card.name} (have ${state.sides.player.energy}).`);
    } else if (def.type === 'creature') {
      setNotice('Your battlefield is full (5 creatures max).');
    } else {
      setNotice(`No valid target for ${card.name} right now.`);
    }
    sync();
    return;
  }

  const def = CARD_BY_ID[card.id];
  if (def.type === 'spell' && def.target !== 'none') {
    state.selectedAttackerUid = null;
    state.targetingSpellUid = uid;
    sync();
    announce(`Select a target for ${card.name}.`);
    return;
  }

  const res = playCard(state, 'player', uid, null);
  if (!res.ok) {
    audio.blocked();
    setNotice(res.reason);
  }
  sync();
}

function handleSelectAttacker(uid) {
  if (state.activeSide !== 'player' || state.winner) return;
  const creature = state.sides.player.board.find((c) => c.uid === uid);
  if (!creature) return;

  // If currently targeting an ally buff spell, cast it on this creature!
  if (state.targetingSpellUid) {
    const spell = state.sides.player.hand.find((c) => c.uid === state.targetingSpellUid);
    if (spell) {
      const vt = getValidSpellTargets(state, 'player', spell);
      if (vt.creatureUids.includes(uid)) {
        playCard(state, 'player', spell.uid, { kind: 'creature', uid });
        sync();
        return;
      }
    }
    state.targetingSpellUid = null;
  }

  if (state.selectedAttackerUid === uid) {
    state.selectedAttackerUid = null;
    sync();
    return;
  }

  if (!creature.canAttack || creature.attacked) {
    audio.blocked();
    setNotice(
      creature.summoningSick
        ? `${creature.name} is resting and can attack next turn.`
        : `${creature.name} already attacked this turn.`,
    );
    sync();
    return;
  }

  state.selectedAttackerUid = uid;
  sync();
  announce(`${creature.name} selected to attack.`);
}

function handleTargetCreature(uid, side) {
  if (state.activeSide !== 'player' || state.winner) return;

  if (state.targetingSpellUid) {
    const res = playCard(state, 'player', state.targetingSpellUid, { kind: 'creature', uid });
    if (!res.ok) {
      audio.blocked();
      setNotice(res.reason);
    }
    sync();
    return;
  }

  if (state.selectedAttackerUid && side === 'ai') {
    const res = performAttack(state, 'player', state.selectedAttackerUid, { kind: 'creature', uid });
    if (!res.ok) {
      audio.blocked();
      setNotice(res.reason);
    }
    sync();
  }
}

function handleTargetHero(side) {
  if (state.activeSide !== 'player' || state.winner || side !== 'ai') return;

  if (state.targetingSpellUid) {
    const spell = state.sides.player.hand.find((c) => c.uid === state.targetingSpellUid);
    if (spell) {
      const vt = getValidSpellTargets(state, 'player', spell);
      if (vt.heroEnemy) {
        playCard(state, 'player', spell.uid, { kind: 'hero', side: 'ai' });
        sync();
        return;
      }
    }
    audio.blocked();
    setNotice('That spell must target a creature.');
    sync();
    return;
  }

  if (state.selectedAttackerUid) {
    const vt = getValidAttackTargets(state, 'player');
    if (!vt.hero) {
      audio.blocked();
      setNotice('A Stone Guard creature blocks your strike! Attack Guard first.');
      sync();
      return;
    }
    performAttack(state, 'player', state.selectedAttackerUid, { kind: 'hero', side: 'ai' });
    sync();
  }
}

function handleEndTurn() {
  if (state.screen !== 'battle' || state.activeSide !== 'player' || state.winner) return;
  endTurn(state);
  sync();
  if (!state.winner && state.activeSide === 'ai') {
    scheduleAiStep(620);
  }
}

// Delegated mouse clicks
appEl.addEventListener('click', (ev) => {
  const btn = ev.target.closest('[data-action]');
  if (!btn) {
    // Clicking blank table cancels current selection
    if (state.screen === 'battle' && (state.selectedAttackerUid || state.targetingSpellUid)) {
      state.selectedAttackerUid = null;
      state.targetingSpellUid = null;
      sync();
    }
    return;
  }

  const action = btn.dataset.action;
  if (action === 'close-help' && ev.target.closest('[data-stop-prop]') && btn !== ev.target.closest('button')) {
    return;
  }

  switch (action) {
    case 'start-game':
    case 'play-again':
      startNewDuel();
      break;
    case 'to-title':
      goToTitle();
      break;
    case 'toggle-mute':
      ui.muted = audio.toggleMute();
      sync();
      break;
    case 'toggle-help':
      ui.showHelp = !ui.showHelp;
      sync();
      break;
    case 'close-help':
      ui.showHelp = false;
      sync();
      break;
    case 'end-turn':
      handleEndTurn();
      break;
    case 'play-hand':
      handleHandCardClick(btn.dataset.uid);
      break;
    case 'select-attacker':
      handleSelectAttacker(btn.dataset.uid);
      break;
    case 'target-creature':
      handleTargetCreature(btn.dataset.uid, btn.dataset.side);
      break;
    case 'click-enemy-creature':
      if (state.selectedAttackerUid) {
        audio.blocked();
        setNotice('A Stone Guard creature must be attacked first!');
        sync();
      }
      break;
    case 'target-hero':
      handleTargetHero(btn.dataset.side);
      break;
  }
});

// Keyboard shortcuts: Esc cancel, E/Space end turn, M mute
window.addEventListener('keydown', (ev) => {
  if (ev.repeat) return;
  if (ev.key === 'Escape') {
    if (ui.showHelp) {
      ui.showHelp = false;
      sync();
    } else if (state.selectedAttackerUid || state.targetingSpellUid) {
      state.selectedAttackerUid = null;
      state.targetingSpellUid = null;
      sync();
    }
  } else if ((ev.key === 'e' || ev.key === 'E' || ev.key === ' ') && state.screen === 'battle' && !ui.showHelp) {
    if (document.activeElement?.tagName === 'BUTTON' && ev.key === ' ') return;
    ev.preventDefault();
    handleEndTurn();
  } else if (ev.key === 'm' || ev.key === 'M') {
    ui.muted = audio.toggleMute();
    sync();
  }
});

// Boot
const { shot, seed } = getShotParams();
if (shot) {
  state = createShotState(shot, seed);
} else {
  state = createInitialState();
  state.screen = 'title';
}
sync();
