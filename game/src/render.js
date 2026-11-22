// EMBERFALL — DOM Renderer & Visual FX
// Renders Title, Battle Table, Victory, and Defeat screens plus floating damage/buff numbers.

import {
  CARD_BY_ID,
  cardArtSvg,
  duelistPortraitSvg,
  SIGILS,
  sigilIconSvg,
} from './cards.js';
import {
  canPlayCard,
  getEffectiveStats,
  getValidAttackTargets,
  getValidSpellTargets,
  MAX_BOARD,
  MAX_ENERGY,
} from './state.js';

function esc(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function formatRules(text) {
  return esc(text).replace(
    /\b(Guard|On Play:|End of Turn:|Flame Bond:)/g,
    '<strong>$1</strong>',
  );
}

function shieldIconSvg() {
  return `<svg class="guard-shield-svg" width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2L20 5.5V11.8C20 16.9 16.6 20.9 12 22.3C7.4 20.9 4 16.9 4 11.8V5.5L12 2Z" fill="#f7d26a" stroke="#472d08" stroke-width="1.6"/>
  </svg>`;
}

function heartIconSvg() {
  return `<svg class="life-heart-svg" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 21.2C12 21.2 3.5 15.6 3.5 9.2C3.5 6.2 5.9 3.8 8.7 3.8C10.5 3.8 11.6 4.7 12 5.7C12.4 4.7 13.5 3.8 15.3 3.8C18.1 3.8 20.5 6.2 20.5 9.2C20.5 15.6 12 21.2 12 21.2Z" fill="currentColor"/>
  </svg>`;
}

function soundIconSvg(muted) {
  if (muted) {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" opacity="0.75"/>
      <line x1="22" y1="9" x2="16" y2="15"/>
      <line x1="16" y1="9" x2="22" y2="15"/>
    </svg>`;
  }
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" opacity="0.85"/>
    <path d="M15.5 8.5a5 5 0 0 1 0 7"/>
    <path d="M19 5a9.5 9.5 0 0 1 0 14"/>
  </svg>`;
}

function homeIconSvg() {
  return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d="M3 10.5L12 3l9 7.5"/>
    <path d="M5.5 9.5V20h13V9.5"/>
  </svg>`;
}

function renderCardHtml(card, state, opts = {}) {
  const {
    location = 'hand', // 'hand' | 'board'
    side = 'player',
    playable = false,
    selected = false,
    canAttack = false,
    validTarget = false,
    blockedByGuard = false,
  } = opts;

  const def = CARD_BY_ID[card.id];
  const isCreature = def.type === 'creature';
  const stats = location === 'board' && isCreature
    ? getEffectiveStats(state, side, card)
    : { atk: card.baseAtk, hp: card.baseHp, maxHp: card.baseHp, atkBuffed: false, hpBuffed: false, damaged: false };

  const classes = [
    'card',
    `card-${location}`,
    `sigil-${card.sigil}`,
    isCreature ? 'card-creature' : 'card-spell',
  ];
  if (playable) classes.push('is-playable');
  if (selected) classes.push('is-selected');
  if (canAttack) classes.push('can-attack');
  if (location === 'board' && side === 'player' && !canAttack && card.summoningSick) classes.push('is-resting');
  if (location === 'board' && card.attacked) classes.push('has-attacked');
  if (validTarget) classes.push('is-valid-target');
  if (blockedByGuard) classes.push('is-blocked');
  if (card.guard && location === 'board') classes.push('has-guard');
  if (card.justDrawn && location === 'hand' && !state.isShot) classes.push('anim-deal');
  if (card.justPlayed && location === 'board' && !state.isShot) classes.push('anim-enter');

  const action =
    location === 'hand'
      ? 'play-hand'
      : validTarget
        ? 'target-creature'
        : side === 'player'
          ? 'select-attacker'
          : 'click-enemy-creature';

  const guardTag =
    card.guard && location === 'board'
      ? `<div class="card-guard-badge" title="Guard — Must be attacked first">${shieldIconSvg()}<span>GUARD</span></div>`
      : '';

  const restingTag =
    location === 'board' && side === 'player' && card.summoningSick && !canAttack
      ? `<div class="card-status-pill">Resting</div>`
      : '';

  const footer = isCreature
    ? `<div class="card-stats">
        <div class="stat-badge stat-atk ${stats.atkBuffed ? 'is-buffed' : ''}" title="Attack">
          <span class="stat-num">${stats.atk}</span>
        </div>
        <div class="card-type-label">${card.guard ? 'GUARD' : SIGILS[card.sigil].name.toUpperCase()}</div>
        <div class="stat-badge stat-hp ${stats.damaged ? 'is-damaged' : stats.hpBuffed ? 'is-buffed' : ''}" title="Health (${stats.hp}/${stats.maxHp})">
          <span class="stat-num">${stats.hp}</span>
        </div>
      </div>`
    : `<div class="card-stats card-stats-spell">
        <div class="spell-pill">${sigilIconSvg(card.sigil, 14)}<span>SPELL</span></div>
      </div>`;

  return `<button type="button"
    class="${classes.join(' ')}"
    data-action="${action}"
    data-uid="${card.uid}"
    data-side="${side}"
    data-card-id="${card.id}">
    <div class="card-cost" title="Energy Cost: ${card.cost}">
      <span>${card.cost}</span>
    </div>
    <div class="card-sigil-badge" title="${SIGILS[card.sigil].name} Sigil">
      ${sigilIconSvg(card.sigil, 18)}
    </div>
    ${restingTag}
    <div class="card-name">${esc(card.name)}</div>
    <div class="card-art">
      ${cardArtSvg(card.id, card.sigil)}
      ${guardTag}
    </div>
    <div class="card-rules"><span class="card-rules-text">${formatRules(def.rules)}</span></div>
    ${footer}
  </button>`;
}

function renderTitleScreen() {
  const sigilCards = ['flame', 'tide', 'thorn', 'stone']
    .map((id) => {
      const s = SIGILS[id];
      return `<div class="title-sigil-card sigil-${id}">
        <div class="title-sigil-icon">${sigilIconSvg(id, 30)}</div>
        <div class="title-sigil-body">
          <div class="title-sigil-name">${s.name}</div>
          <div class="title-sigil-desc">${s.summary}</div>
        </div>
      </div>`;
    })
    .join('');

  return `<div class="title-screen">
    <div class="title-backdrop-glow"></div>
    <div class="title-content">
      <div class="title-hero">
        <div class="title-crest" aria-hidden="true">
          <svg viewBox="0 0 220 220" width="168" height="168">
            <defs>
              <radialGradient id="crest_core" cx="50%" cy="50%" r="55%">
                <stop offset="0%" stop-color="#ffbb5c" stop-opacity="0.38"/>
                <stop offset="65%" stop-color="#7a2018" stop-opacity="0.16"/>
                <stop offset="100%" stop-color="#0d1118" stop-opacity="0"/>
              </radialGradient>
            </defs>
            <circle cx="110" cy="110" r="102" fill="url(#crest_core)"/>
            <circle cx="110" cy="110" r="84" fill="none" stroke="#c89b4b" stroke-width="1.6" stroke-dasharray="6 5" opacity="0.7"/>
            <circle cx="110" cy="110" r="64" fill="#121621" stroke="#e4b761" stroke-width="2.2"/>
            <polygon points="110,18 128,92 202,110 128,128 110,202 92,128 18,110 92,92" fill="none" stroke="#c89b4b" stroke-width="1.4" opacity="0.75"/>
            <circle cx="110" cy="110" r="24" fill="#231817" stroke="#f7d26a" stroke-width="2"/>
            <!-- Four Sigils inlaid on the compass points -->
            <g transform="translate(96,24) scale(1.15)">
              <path d="M12.3 2C14.8 5.4 18.8 8.3 18.8 13.4C18.8 17.5 15.8 21 12 21C8.2 21 5.2 17.6 5.2 13.7C5.2 10.6 6.8 8.3 8.4 6.7C8.2 8.7 9.1 9.9 10.1 10.4C9.5 7.4 10.7 4.4 12.3 2Z" fill="#ef4c3b" stroke="#ffd7b8" stroke-width="1.2"/>
            </g>
            <g transform="translate(168,96) scale(1.15)">
              <path d="M12 2.4C12 2.4 5.6 10 5.6 14.6C5.6 18.2 8.5 21.1 12 21.1C15.5 21.1 18.4 18.2 18.4 14.6C18.4 10 12 2.4 12 2.4Z" fill="#2c93e8" stroke="#ccf2ff" stroke-width="1.2"/>
            </g>
            <g transform="translate(96,168) scale(1.15)">
              <path d="M19.5 4.2C12.5 4.2 6.8 7.5 5.4 14.5C5.1 16.2 5.4 17.9 6.2 19.1C7.6 19.8 9.4 20 11.2 19.5C17.6 17.8 19.8 11.4 19.5 4.2Z" fill="#30ad5e" stroke="#d2ffd9" stroke-width="1.2"/>
            </g>
            <g transform="translate(24,96) scale(1.15)">
              <polygon points="12,2.2 20.4,12 12,21.8 3.6,12" fill="#d99826" stroke="#fff0bf" stroke-width="1.2"/>
            </g>
            <!-- Central glowing ember -->
            <polygon points="110,94 122,110 110,126 98,110" fill="#ff9447"/>
            <polygon points="110,100 116,110 110,120 104,110" fill="#fff0b3"/>
          </svg>
        </div>
        <div class="title-eyebrow">1v1 TACTICAL CARD DUEL</div>
        <h1 class="title-logo">EMBERFALL</h1>
        <p class="title-subtitle">Duel of the Four Sigils</p>
        <div class="title-actions">
          <button type="button" class="btn-primary btn-play-big" data-action="start-game">
            <span>Play Duel</span>
          </button>
        </div>
      </div>

      <div class="title-guide">
        <div class="guide-section">
          <h2 class="guide-heading">The Four Sigils</h2>
          <div class="title-sigil-grid">${sigilCards}</div>
        </div>
        <div class="guide-section guide-rules">
          <h2 class="guide-heading">How to Play</h2>
          <ul class="guide-list">
            <li><strong>20 Life Each:</strong> Reduce Archmage Vaelor from 20 Life to 0 before he defeats you.</li>
            <li><strong>Rising Energy:</strong> Start with 5 cards. Each turn you gain +1 max Energy (up to 10) and draw a card.</li>
            <li><strong>Summon &amp; Cast:</strong> Click glowing cards in your hand to summon creatures or cast instant spells.</li>
            <li><strong>Tactical Combat:</strong> Click a ready creature, then click an enemy creature or Vaelor to strike. <strong>Stone Guard</strong> creatures must be attacked first!</li>
          </ul>
          <div class="guide-shortcuts">Shortcuts: <kbd>E</kbd> / <kbd>Space</kbd> End Turn &middot; <kbd>Esc</kbd> Cancel Target &middot; <kbd>M</kbd> Mute</div>
        </div>
      </div>
    </div>
  </div>`;
}

function renderEnergyBar(energy, maxEnergy) {
  let pips = '';
  for (let i = 0; i < MAX_ENERGY; i++) {
    const cls = i < energy ? 'pip-filled' : i < maxEnergy ? 'pip-spent' : 'pip-locked';
    pips += `<span class="energy-pip ${cls}"></span>`;
  }
  return `<div class="energy-widget" title="Energy: ${energy} / ${maxEnergy}">
    <div class="energy-label">ENERGY</div>
    <div class="energy-pips">${pips}</div>
    <div class="energy-readout"><strong>${energy}</strong><span>/${maxEnergy}</span></div>
  </div>`;
}

function renderBattleTable(state, ui) {
  const player = state.sides.player;
  const ai = state.sides.ai;
  const isPlayerTurn = state.activeSide === 'player' && !state.winner;

  // Determine valid targets for highlighting
  let validCreatureTargets = new Set();
  let validEnemyHeroTarget = false;
  let guardBlocking = false;
  let bannerText = isPlayerTurn
    ? `TURN ${state.turnNumber} · YOUR TURN`
    : `TURN ${state.turnNumber} · ARCHMAGE VAELOR'S TURN`;
  let bannerMode = isPlayerTurn ? 'player' : 'ai';

  if (isPlayerTurn && state.targetingSpellUid) {
    const spell = player.hand.find((c) => c.uid === state.targetingSpellUid);
    if (spell) {
      const vt = getValidSpellTargets(state, 'player', spell);
      validCreatureTargets = new Set(vt.creatureUids);
      validEnemyHeroTarget = vt.heroEnemy;
      bannerText = `CASTING ${spell.name.toUpperCase()} — Choose a highlighted target (Esc to cancel)`;
      bannerMode = 'targeting';
    }
  } else if (isPlayerTurn && state.selectedAttackerUid) {
    const attacker = player.board.find((c) => c.uid === state.selectedAttackerUid);
    if (attacker) {
      const vt = getValidAttackTargets(state, 'player');
      validCreatureTargets = new Set(vt.creatureUids);
      validEnemyHeroTarget = vt.hero;
      guardBlocking = !vt.hero;
      bannerText = guardBlocking
        ? `${attacker.name.toUpperCase()} ATTACKING — Must target a Stone Guard creature first!`
        : `${attacker.name.toUpperCase()} ATTACKING — Click an enemy creature or Archmage Vaelor`;
      bannerMode = 'targeting';
    }
  } else if (ui.notice) {
    bannerText = ui.notice;
    bannerMode = 'notice';
  }

  // Enemy card backs
  const enemyHandBacks = ai.hand
    .map(() => `<div class="enemy-card-back" aria-hidden="true"></div>`)
    .join('');

  // Enemy board cards
  const enemyBoardHtml =
    ai.board.length > 0
      ? ai.board
          .map((c) =>
            renderCardHtml(c, state, {
              location: 'board',
              side: 'ai',
              validTarget: validCreatureTargets.has(c.uid),
              blockedByGuard: guardBlocking && !c.guard,
            }),
          )
          .join('')
      : `<div class="lane-empty">No enemy creatures on the battlefield</div>`;

  // Player board cards
  const playerBoardHtml =
    player.board.length > 0
      ? player.board
          .map((c) =>
            renderCardHtml(c, state, {
              location: 'board',
              side: 'player',
              canAttack: isPlayerTurn && c.canAttack && !c.attacked,
              selected: state.selectedAttackerUid === c.uid,
              validTarget: validCreatureTargets.has(c.uid),
            }),
          )
          .join('')
      : `<div class="lane-empty">Summon creatures from your hand to command this lane (max ${MAX_BOARD})</div>`;

  // Player hand cards
  const handHtml =
    player.hand.length > 0
      ? player.hand
          .map((c) =>
            renderCardHtml(c, state, {
              location: 'hand',
              side: 'player',
              playable: isPlayerTurn && canPlayCard(state, 'player', c),
              selected: state.targetingSpellUid === c.uid,
            }),
          )
          .join('')
      : `<div class="hand-empty">Your hand is empty</div>`;

  // Battle Log entries
  const logHtml = state.log
    .slice(0, 14)
    .map((entry) => {
      const icon = entry.sigil ? sigilIconSvg(entry.sigil, 14) : `<span class="log-dot"></span>`;
      return `<div class="log-item log-${entry.actor}">
        <span class="log-icon">${icon}</span>
        <span class="log-text">${esc(entry.text)}</span>
      </div>`;
    })
    .join('');

  return `<div class="battle-layout">
    <main class="arena">
      <!-- Opponent Header Bar -->
      <header class="duelist-bar duelist-enemy">
        <button type="button"
          class="hero-plate ${validEnemyHeroTarget ? 'is-valid-target' : ''} ${guardBlocking ? 'is-blocked' : ''}"
          data-action="target-hero"
          data-side="ai"
          data-fx-anchor="hero:ai"
          title="${validEnemyHeroTarget ? 'Click to strike Archmage Vaelor' : 'Archmage Vaelor'}">
          <div class="portrait-frame">${duelistPortraitSvg('ai')}</div>
          <div class="hero-identity">
            <div class="hero-name">${esc(ai.name)}</div>
            <div class="hero-role">${esc(ai.title)}</div>
          </div>
          <div class="life-medallion ${ai.life <= 6 ? 'is-low' : ''}" aria-label="Opponent Life: ${ai.life}">
            ${heartIconSvg()}
            <span class="life-value">${ai.life}</span>
          </div>
          ${validEnemyHeroTarget ? `<span class="target-reticle">STRIKE</span>` : ''}
        </button>

        <div class="enemy-meta">
          <div class="enemy-hand-fan" title="Opponent hand: ${ai.hand.length} cards">
            ${enemyHandBacks}
            <span class="meta-pill">Hand ${ai.hand.length}</span>
          </div>
          <div class="meta-pill meta-energy">Energy <strong>${ai.energy}/${ai.maxEnergy}</strong></div>
          <div class="meta-pill">Deck <strong>${ai.deck.length}</strong></div>
        </div>
      </header>

      <!-- Enemy Board Lane -->
      <section class="board-lane lane-enemy" aria-label="Enemy Battlefield">
        ${enemyBoardHtml}
      </section>

      <!-- Center Phase / Prompt Ribbon -->
      <div class="arena-divider mode-${bannerMode}">
        <div class="divider-line"></div>
        <div class="phase-pill">${esc(bannerText)}</div>
        <div class="divider-line"></div>
      </div>

      <!-- Player Board Lane -->
      <section class="board-lane lane-player" aria-label="Your Battlefield">
        ${playerBoardHtml}
      </section>

      <!-- Player Dock: Status Strip + Hand -->
      <section class="player-dock">
        <div class="duelist-bar duelist-player">
          <div class="hero-plate hero-plate-self" data-fx-anchor="hero:player">
            <div class="portrait-frame">${duelistPortraitSvg('player')}</div>
            <div class="hero-identity">
              <div class="hero-name">${esc(player.name)}</div>
              <div class="hero-role">${esc(player.title)}</div>
            </div>
            <div class="life-medallion ${player.life <= 6 ? 'is-low' : ''}" aria-label="Your Life: ${player.life}">
              ${heartIconSvg()}
              <span class="life-value">${player.life}</span>
            </div>
          </div>

          <div class="player-resources">
            ${renderEnergyBar(player.energy, player.maxEnergy)}
            <div class="meta-pill">Deck <strong>${player.deck.length}</strong></div>
          </div>
        </div>

        <div class="player-hand ${player.hand.length >= 6 ? 'hand-compact' : ''}" aria-label="Your Hand">
          ${handHtml}
        </div>
      </section>
    </main>

    <!-- Right Chronicle & Controls Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-mini">
          <span class="brand-title">EMBERFALL</span>
          <span class="brand-turn">Turn ${state.turnNumber}</span>
        </div>
        <div class="sidebar-tools">
          <button type="button" class="btn-icon ${ui.muted ? 'is-muted' : ''}" data-action="toggle-mute" title="${ui.muted ? 'Unmute Sound (M)' : 'Mute Sound (M)'}">
            ${soundIconSvg(ui.muted)}
          </button>
          <button type="button" class="btn-icon" data-action="toggle-help" title="How to Play">?</button>
          <button type="button" class="btn-icon" data-action="to-title" title="Title Screen">${homeIconSvg()}</button>
        </div>
      </div>

      <div class="sigil-legend-strip">
        <span class="legend-chip sigil-flame" title="Flame: Buffs & Burn">${sigilIconSvg('flame', 13)}Flame</span>
        <span class="legend-chip sigil-tide" title="Tide: Draw & Spells">${sigilIconSvg('tide', 13)}Tide</span>
        <span class="legend-chip sigil-thorn" title="Thorn: High HP & Heal">${sigilIconSvg('thorn', 13)}Thorn</span>
        <span class="legend-chip sigil-stone" title="Stone: Guard Defenders">${sigilIconSvg('stone', 13)}Stone</span>
      </div>

      <div class="chronicle-panel">
        <div class="chronicle-header">Battle Log</div>
        <div class="chronicle-list" role="log" aria-live="polite">${logHtml}</div>
      </div>

      <div class="sidebar-footer">
        <button type="button"
          class="btn-end-turn ${isPlayerTurn ? 'is-ready' : 'is-waiting'}"
          data-action="end-turn"
          ${isPlayerTurn ? '' : 'disabled'}>
          <span class="end-turn-label">${isPlayerTurn ? 'End Turn' : 'Opponent Turn…'}</span>
          ${isPlayerTurn ? '<kbd class="end-turn-key">E</kbd>' : ''}
        </button>
      </div>
    </aside>
  </div>`;
}

function renderBurstParticles(isShot, isWin = true) {
  const colors = isWin
    ? ['#f7d26a', '#ef4c3b', '#6ae0ff', '#7de898', '#ff9447', '#fff4c2']
    : ['#d94f48', '#8a3238', '#c97852', '#64323b'];
  const count = isWin ? 40 : 18;
  const items = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (i % 3) * 0.08;
    const rx = isWin ? 275 + ((i * 59) % 210) : 260 + ((i * 47) % 180);
    const ry = isWin ? 195 + ((i * 43) % 155) : 185 + ((i * 37) % 130);
    const tx = Math.round(Math.cos(angle) * rx);
    const ty = Math.round(Math.sin(angle) * ry);
    const color = colors[i % colors.length];
    const size = isWin ? 7 + ((i * 5) % 9) : 5 + ((i * 3) % 5);
    const rot = (i * 47) % 360;
    const delay = isShot ? 0 : ((i % 8) * 0.035).toFixed(2);
    const shapeCls = i % 3 === 0 ? 'spark-diamond' : i % 3 === 1 ? 'spark-orb' : '';
    items.push(
      `<span class="burst-spark ${shapeCls} ${isShot ? 'is-frozen' : ''}" style="--tx:${tx}px;--ty:${ty}px;--c:${color};--s:${size}px;--r:${rot}deg;--d:${delay}s;"></span>`,
    );
  }
  return `<div class="celebration-burst" aria-hidden="true">${items.join('')}</div>`;
}

function renderEndOverlay(state) {
  const isWin = state.screen === 'win';
  const crestSvg = isWin
    ? `<svg class="end-crest-svg" viewBox="0 0 120 120" width="96" height="96" aria-hidden="true">
        <circle cx="60" cy="60" r="52" fill="#2c1f0a" stroke="#f7d26a" stroke-width="3"/>
        <polygon points="60,14 72,44 104,48 79,68 87,100 60,83 33,100 41,68 16,48 48,44" fill="#f7d26a" stroke="#fff4cc" stroke-width="2" stroke-linejoin="round"/>
        <polygon points="60,34 69,56 60,76 51,56" fill="#ef4c3b"/>
      </svg>`
    : `<svg class="end-crest-svg" viewBox="0 0 120 120" width="96" height="96" aria-hidden="true">
        <circle cx="60" cy="60" r="52" fill="#211015" stroke="#b84a48" stroke-width="3"/>
        <path d="M34 32 L54 58 L38 88 L56 64 L66 90 L64 58 L88 32 L62 50 Z" fill="#d94f48" stroke="#ffb3a7" stroke-width="1.6" stroke-linejoin="round"/>
      </svg>`;

  return `<div class="end-overlay ${isWin ? 'end-win' : 'end-loss'}">
    ${isWin ? '<div class="victory-rays" aria-hidden="true"></div>' : ''}
    ${renderBurstParticles(state.isShot, isWin)}
    <div class="end-card">
      ${crestSvg}
      <div class="end-kicker">${isWin ? 'THE FOUR SIGILS SALUTE YOU' : 'THE EMBERS FADE'}</div>
      <h1 class="end-title">${isWin ? 'VICTORY' : 'DEFEAT'}</h1>
      <p class="end-blow">${esc(state.stats.finalBlow)}</p>

      <div class="end-stats">
        <div class="end-stat">
          <span class="end-stat-val">${state.stats.turns}</span>
          <span class="end-stat-lbl">Turns</span>
        </div>
        <div class="end-stat">
          <span class="end-stat-val">${isWin ? state.sides.player.life : state.sides.ai.life}</span>
          <span class="end-stat-lbl">${isWin ? 'Life Left' : 'Foe Life Left'}</span>
        </div>
        <div class="end-stat">
          <span class="end-stat-val">${state.stats.playerDamageDealt}</span>
          <span class="end-stat-lbl">Damage Dealt</span>
        </div>
        <div class="end-stat">
          <span class="end-stat-val">${state.stats.playerCardsPlayed}</span>
          <span class="end-stat-lbl">Cards Played</span>
        </div>
      </div>

      <div class="end-actions">
        <button type="button" class="btn-primary" data-action="play-again">Play Again</button>
        <button type="button" class="btn-secondary" data-action="to-title">Title Screen</button>
      </div>
    </div>
  </div>`;
}

function renderHelpModal() {
  return `<div class="help-overlay" data-action="close-help">
    <div class="help-modal" data-stop-prop="1">
      <div class="help-header">
        <h2>Duelist's Field Guide</h2>
        <button type="button" class="btn-icon" data-action="close-help" aria-label="Close">✕</button>
      </div>
      <ul class="guide-list">
        <li><strong>Energy &amp; Draw:</strong> Gain +1 max Energy each turn (up to 10) and draw 1 card.</li>
        <li><strong>Playing Cards:</strong> Click any highlighted card in hand. Newly summoned creatures rest until your next turn.</li>
        <li><strong>Attacking:</strong> Click one of your glowing creatures, then click an enemy creature or Archmage Vaelor. Creatures deal Attack to each other simultaneously.</li>
        <li><strong>Stone Guard:</strong> Creatures with a golden <strong>GUARD</strong> shield must be attacked before other enemy creatures or the enemy duelist.</li>
        <li><strong>Sigil Synergies:</strong> Flame buffs Flame allies; Tide draws and grows Frost Channeler; Thorn heals and scales when damaged; Stone guards and fortifies.</li>
      </ul>
      <div class="help-footer">
        <button type="button" class="btn-primary" data-action="close-help">Back to Duel</button>
      </div>
    </div>
  </div>`;
}

export function renderApp(root, state, ui) {
  root.dataset.screen = state.screen;
  if (state.screen === 'title') {
    root.innerHTML = renderTitleScreen();
    return;
  }

  let html = renderBattleTable(state, ui);
  if (state.screen === 'win' || state.screen === 'loss') {
    html += renderEndOverlay(state);
  } else if (ui.showHelp) {
    html += renderHelpModal();
  }
  root.innerHTML = html;
}

/**
 * Spawns floating damage / heal / buff popups and subtle shake/impact FX from state events.
 */
export function playVisualEvents(fxLayer, root, events) {
  if (!fxLayer || !events.length) return;
  for (const ev of events) {
    if (ev.type === 'float') {
      const anchor = findAnchorEl(root, ev.target);
      if (!anchor) continue;
      const rect = anchor.getBoundingClientRect();
      const el = document.createElement('div');
      el.className = `float-pop float-${ev.tone || 'damage'}`;
      el.textContent = ev.text;
      el.style.left = `${rect.left + rect.width / 2}px`;
      el.style.top = `${rect.top + rect.height * 0.35}px`;
      fxLayer.appendChild(el);
      window.setTimeout(() => el.remove(), 920);
    } else if (ev.type === 'shake') {
      const anchor = findAnchorEl(root, ev.target);
      if (!anchor) continue;
      anchor.classList.remove('fx-shake');
      void anchor.offsetWidth;
      anchor.classList.add('fx-shake');
      window.setTimeout(() => anchor.classList.remove('fx-shake'), 380);
    }
  }
}

function findAnchorEl(root, targetKey) {
  if (!targetKey) return null;
  if (targetKey.startsWith('hero:')) {
    return root.querySelector(`[data-fx-anchor="${targetKey}"]`);
  }
  if (targetKey.startsWith('card:')) {
    const uid = targetKey.slice(5);
    return root.querySelector(`.card-board[data-uid="${uid}"]`);
  }
  return null;
}
