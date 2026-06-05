'use strict';
// ============================================================
// 伊布分數小數互化研究所 — app.js
// ============================================================

/* ----------------------------------------------------------
   1. 常量：8 隻伊布進化型資料
   ---------------------------------------------------------- */
const EEVEE_EVOLUTIONS = [
  { id: 'vaporeon',  name: '水伊布',  zhName: '水伊布 (Vaporeon)',  needed: 300, emoji: '💧', color: '#4070e8', badge: '300', spriteId: 134 },
  { id: 'jolteon',   name: '雷伊布',  zhName: '雷伊布 (Jolteon)',   needed: 300, emoji: '⚡', color: '#e8a800', badge: '300', spriteId: 135 },
  { id: 'flareon',   name: '火伊布',  zhName: '火伊布 (Flareon)',   needed: 300, emoji: '🔥', color: '#e84040', badge: '300', spriteId: 136 },
  { id: 'espeon',    name: '太陽伊布', zhName: '太陽伊布 (Espeon)',  needed: 400, emoji: '🌞', color: '#9060e8', badge: '400', spriteId: 196 },
  { id: 'umbreon',   name: '月亮伊布', zhName: '月亮伊布 (Umbreon)', needed: 400, emoji: '🌙', color: '#3a2010', badge: '400', spriteId: 197 },
  { id: 'leafeon',   name: '葉伊布',  zhName: '葉伊布 (Leafeon)',   needed: 500, emoji: '🍃', color: '#40b870', badge: '500', spriteId: 470 },
  { id: 'glaceon',   name: '冰伊布',  zhName: '冰伊布 (Glaceon)',   needed: 500, emoji: '❄️', color: '#60c0e8', badge: '500', spriteId: 471 },
  { id: 'sylveon',   name: '仙子伊布', zhName: '仙子伊布 (Sylveon)', needed: 600, emoji: '🎀', color: '#e860a0', badge: '600', spriteId: 700 },
];

const GAME_ID = 'eevee_math';
const EEVEE_BASE_ID = 133; // 伊布本體（登入畫面 logo 用）

// 高清官方圖（official-artwork）
function getSprite(spriteId) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${spriteId}.png`;
}
// 像素圖（選擇格子 / 遊戲中央，細小清晰）
function getSpritePixel(spriteId) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${spriteId}.png`;
}
function getEeveeById(id) {
  return EEVEE_EVOLUTIONS.find(e => e.id === id) || EEVEE_EVOLUTIONS[0];
}

/* ----------------------------------------------------------
   2. 完整題庫（19 組，含循環小數正確格式）
   ---------------------------------------------------------- */
// weight: 數字越大出現機率越高（分母 3,4,8 加大）
const RAW_QUESTIONS = [
  // 1/2
  { fraction: '1/2',  decimal: '0.5',    weight: 2 },
  // 分母 3 系列（高權重）
  { fraction: '1/3',  decimal: '0.333...', weight: 5 },
  { fraction: '2/3',  decimal: '0.666...', weight: 5 },
  // 分母 4 系列（高權重）
  { fraction: '1/4',  decimal: '0.25',   weight: 5 },
  { fraction: '3/4',  decimal: '0.75',   weight: 5 },
  // 1/5 系列
  { fraction: '1/5',  decimal: '0.2',    weight: 2 },
  { fraction: '2/5',  decimal: '0.4',    weight: 2 },
  { fraction: '3/5',  decimal: '0.6',    weight: 2 },
  { fraction: '4/5',  decimal: '0.8',    weight: 2 },
  // 1/6
  { fraction: '1/6',  decimal: '0.166...', weight: 3 },
  // 分母 8 系列（高權重）
  { fraction: '1/8',  decimal: '0.125',  weight: 5 },
  { fraction: '3/8',  decimal: '0.375',  weight: 5 },
  { fraction: '5/8',  decimal: '0.625',  weight: 5 },
  { fraction: '7/8',  decimal: '0.875',  weight: 5 },
  // 分母 10, 20, 50
  { fraction: '1/10', decimal: '0.1',    weight: 2 },
  { fraction: '1/20', decimal: '0.05',   weight: 2 },
  { fraction: '1/50', decimal: '0.02',   weight: 2 },
  // 循環小數特殊
  { fraction: '1/7',  decimal: '0.142...', weight: 3 },
  { fraction: '1/9',  decimal: '0.111...', weight: 3 },
];

// 加權 pool（展開 weight 次）
const QUESTION_POOL = [];
RAW_QUESTIONS.forEach(q => {
  for (let i = 0; i < q.weight; i++) QUESTION_POOL.push(q);
});

const BERRY_TYPES = [
  { emoji: '🍎', cls: 'berry-red',    label: '力量菓子' },
  { emoji: '🫐', cls: 'berry-blue',   label: '神秘菓子' },
  { emoji: '🍋', cls: 'berry-yellow', label: '雷電菓子' },
];

/* ----------------------------------------------------------
   3. 出題邏輯：從題庫隨機抽一題，雙向（分數→小數 或 小數→分數）
   ---------------------------------------------------------- */
function generateQuestion() {
  const base = QUESTION_POOL[Math.floor(Math.random() * QUESTION_POOL.length)];
  const askFraction = Math.random() < 0.5; // true: 問題是分數，答案是小數

  const correctAnswer = askFraction ? base.decimal : base.fraction;
  const questionText  = askFraction
    ? `${base.fraction}  =  ?`
    : `?  =  ${base.decimal}`;

  // 產生 2 個干擾選項（不重複、不等於正確答案）
  const pool = askFraction
    ? RAW_QUESTIONS.map(q => q.decimal)
    : RAW_QUESTIONS.map(q => q.fraction);

  const distractors = [];
  const usedSet = new Set([correctAnswer]);
  const shuffledPool = [...new Set(pool)].sort(() => Math.random() - 0.5);
  for (const d of shuffledPool) {
    if (!usedSet.has(d)) { distractors.push(d); usedSet.add(d); }
    if (distractors.length === 2) break;
  }

  const options = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);
  const berries = BERRY_TYPES.sort(() => Math.random() - 0.5);

  return {
    questionText,
    correctAnswer,
    options,         // array of 3
    berries,         // one berry per option slot (pre-shuffled)
    baseId: base.fraction, // for traceability
  };
}

/* ----------------------------------------------------------
   4. Default data structure for new players
   ---------------------------------------------------------- */
function getDefaultData() {
  const scores = {};
  EEVEE_EVOLUTIONS.forEach(e => { scores[e.id] = 0; });
  return {
    scores,
    unlockedList: [],
    gameCleared: false,
  };
}

/* ----------------------------------------------------------
   5. API helpers
   ---------------------------------------------------------- */
async function apiLogin(trainerName, password) {
  const res = await fetch('/api/auth-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      trainerName,
      password,
      gameId: GAME_ID,
      defaultData: getDefaultData(),
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || '伺服器連線失敗');
  return json; // { token, data, message }
}

async function apiSave(trainerName, token, gameData) {
  try {
    await fetch('/api/save-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trainerName, gameId: GAME_ID, gameData, token }),
    });
  } catch (e) {
    console.warn('雲端儲存失敗（不影響本地遊戲）:', e);
  }
}

/* ----------------------------------------------------------
   6. Session（玩家狀態）
   ---------------------------------------------------------- */
class Session {
  constructor() {
    this.trainerName = '';
    this.token = '';
    this.data = getDefaultData(); // { scores, unlockedList, gameCleared }
    this.currentTargetId = null;  // 當前培育目標 eevee id
    this.combo = 0;
  }

  get currentTarget() { return getEeveeById(this.currentTargetId); }
  get currentScore()  { return this.data.scores[this.currentTargetId] || 0; }

  addScore(pts) {
    if (this.data.gameCleared) return; // 爆機後不寫分
    this.data.scores[this.currentTargetId] = (this.data.scores[this.currentTargetId] || 0) + pts;
  }

  checkUnlock() {
    // 返回剛解鎖的伊布，或 null
    const eevee = this.currentTarget;
    if (!eevee) return null;
    if (this.data.unlockedList.includes(eevee.id)) return null;
    if (this.currentScore >= eevee.needed) {
      this.data.unlockedList.push(eevee.id);
      if (this.data.unlockedList.length === EEVEE_EVOLUTIONS.length) {
        this.data.gameCleared = true;
      }
      return eevee;
    }
    return null;
  }

  async save() {
    if (this.data.gameCleared) return; // 爆機後不呼叫 API
    await apiSave(this.trainerName, this.token, this.data);
  }

  isUnlocked(id) { return this.data.unlockedList.includes(id); }
  unlockedCount() { return this.data.unlockedList.length; }
}

/* ----------------------------------------------------------
   7. Audio
   ---------------------------------------------------------- */
class AudioEngine {
  constructor() {
    this._unlocked = false;
    this.sndCorrect = document.getElementById('snd-correct');
    this.sndWrong   = document.getElementById('snd-wrong');
    this.sndEvolve  = document.getElementById('snd-evolve');
  }
  unlock() {
    if (this._unlocked) return;
    [this.sndCorrect, this.sndWrong, this.sndEvolve].forEach(a => {
      if (a) { a.volume = 0; a.play().then(() => { a.pause(); a.currentTime = 0; a.volume = 1; }).catch(() => {}); }
    });
    this._unlocked = true;
  }
  play(type) {
    const map = { correct: this.sndCorrect, wrong: this.sndWrong, evolve: this.sndEvolve };
    const el = map[type];
    if (!el) return;
    el.currentTime = 0;
    el.play().catch(() => {});
  }
}

/* ----------------------------------------------------------
   8. UIManager — screens, modals, renders
   ---------------------------------------------------------- */
class UIManager {
  constructor(session, audio) {
    this.session = session;
    this.audio = audio;
    this.currentQuestion = null;
    this.answered = false;
    this._questionCount = 0;
  }

  /* ----- Screen helpers ----- */
  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => {
      s.classList.remove('active');
      s.classList.add('hidden');
    });
    const el = document.getElementById(id);
    if (el) { el.classList.remove('hidden'); el.classList.add('active'); }
  }

  showModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
  }
  hideModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  }

  setLoading(visible, msg) {
    const el = document.getElementById('loading-overlay');
    if (!el) return;
    if (visible) { el.classList.remove('hidden'); el.querySelector('.loading-text').textContent = msg || 'E家雲端連線中…'; }
    else el.classList.add('hidden');
  }

  /* ----- Background particles ----- */
  createParticles() {
    const container = document.getElementById('bg-particles');
    if (!container) return;
    const paws = ['🐾', '✦', '⋆', '🐾', '✦'];
    for (let i = 0; i < 18; i++) {
      const el = document.createElement('div');
      el.className = 'bg-paw';
      el.textContent = paws[i % paws.length];
      el.style.left = `${Math.random() * 100}%`;
      el.style.top  = `${Math.random() * 100}%`;
      el.style.animationDelay = `${Math.random() * 8}s`;
      el.style.animationDuration = `${8 + Math.random() * 6}s`;
      el.style.fontSize = `${12 + Math.random() * 14}px`;
      container.appendChild(el);
    }
  }

  /* ----- Eevee selection modal ----- */
  renderEeveePickGrid() {
    const grid = document.getElementById('eevee-pick-grid');
    if (!grid) return;
    grid.innerHTML = '';
    EEVEE_EVOLUTIONS.forEach(eevee => {
      const unlocked = this.session.isUnlocked(eevee.id);
      const card = document.createElement('div');
      card.className = 'eevee-pick-card' + (unlocked ? ' locked' : '');
      card.dataset.id = eevee.id;

      const currentScore = this.session.data.scores[eevee.id] || 0;
      card.innerHTML = `
        <img class="eevee-pick-sprite" src="${getSpritePixel(eevee.spriteId)}" alt="${eevee.name}" loading="lazy">
        <div class="eevee-pick-name">${eevee.emoji} ${eevee.name}</div>
        <div class="eevee-pick-score-needed">${unlocked ? '✅ 已解鎖' : `目標：${eevee.needed} 分`}</div>
        ${!unlocked ? `<div class="eevee-pick-badge badge-${eevee.badge}">${currentScore} / ${eevee.needed}</div>` : ''}
      `;

      if (!unlocked) {
        card.addEventListener('click', () => {
          this.session.currentTargetId = eevee.id;
          this.hideModal('overlay-choose-eevee');
          this.startGameSession();
        });
      }
      grid.appendChild(card);
    });
  }

  /* ----- Game screen render ----- */
  renderGameTopbar() {
    const s = this.session;
    const eevee = s.currentTarget;

    const trainerEl = document.getElementById('topbar-trainer');
    if (trainerEl) trainerEl.textContent = `🎯 ${s.trainerName}`;

    const nameEl = document.getElementById('topbar-eevee-name');
    if (nameEl) nameEl.textContent = eevee ? `${eevee.emoji} ${eevee.name}` : '---';

    this.updateScoreDisplay();
  }

  updateScoreDisplay() {
    const s = this.session;
    const eevee = s.currentTarget;
    if (!eevee) return;

    const scoreEl = document.getElementById('topbar-score');
    const fillEl  = document.getElementById('progress-fill');
    const labelEl = document.getElementById('progress-label');

    const cur = s.currentScore;
    const needed = eevee.needed;
    const pct = Math.min(cur / needed * 100, 100);

    if (scoreEl) scoreEl.textContent = `${cur} 分`;
    if (fillEl)  fillEl.style.width = `${pct}%`;
    if (labelEl) labelEl.textContent = `${cur} / ${needed} 分`;
  }

  updateEeveeSprite() {
    const s = this.session;
    const eevee = s.currentTarget;
    const spriteEl = document.getElementById('eevee-sprite');
    const nameEl   = document.getElementById('eevee-name-tag');
    // 遊戲中央用像素圖（較小顯示效果佳）
    if (spriteEl && eevee) spriteEl.src = getSpritePixel(eevee.spriteId);
    if (nameEl && eevee)   nameEl.textContent = `${eevee.emoji} ${eevee.name}`;
  }

  setEveeeEmotion(type) {
    const bubble = document.getElementById('emotion-bubble');
    if (!bubble) return;
    const map = {
      idle:    '( ´ ▽ ` )ﾉ',
      happy:   '(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧',
      sad:     '(｡•́︿•̀｡)',
      waiting: '(ᐢ. .ᐢ)?',
    };
    bubble.textContent = map[type] || map.idle;
    bubble.style.background = type === 'happy'
      ? 'rgba(64,184,112,0.2)'
      : type === 'sad'
      ? 'rgba(232,64,64,0.15)'
      : 'rgba(255,248,235,0.9)';
  }

  animateEevee(type) {
    // type: 'bounce' | 'shake'
    const sprite = document.getElementById('eevee-sprite');
    if (!sprite) return;
    sprite.classList.remove('bounce', 'shake');
    void sprite.offsetWidth; // reflow
    sprite.classList.add(type);
    sprite.addEventListener('animationend', () => sprite.classList.remove(type), { once: true });
  }

  /* ----- Question rendering ----- */
  renderQuestion() {
    this.answered = false;
    this._questionCount++;

    const q = generateQuestion();
    this.currentQuestion = q;

    const qNumEl   = document.getElementById('q-num');
    const qTextEl  = document.getElementById('question-text');
    const container= document.getElementById('answers-container');

    if (qNumEl)  qNumEl.textContent = this._questionCount;
    if (qTextEl) qTextEl.textContent = q.questionText;

    this.setEveeeEmotion('waiting');

    if (!container) return;
    container.innerHTML = '';

    q.options.forEach((opt, idx) => {
      const berry = q.berries[idx % 3];
      const btn = document.createElement('button');
      btn.className = 'answer-btn';
      btn.dataset.answer = opt;
      btn.innerHTML = `
        <span class="berry-icon ${berry.cls}">${berry.emoji}</span>
        <span class="answer-btn-text">${opt}</span>
      `;
      btn.addEventListener('click', () => this.handleAnswer(btn, opt, q, berry));
      container.appendChild(btn);
    });
  }

  /* ----- Answer handling ----- */
  async handleAnswer(btnEl, chosen, q, berry) {
    if (this.answered) return;
    this.answered = true;
    this.audio.unlock();

    const isCorrect = chosen === q.correctAnswer;

    // Disable all buttons
    document.querySelectorAll('.answer-btn').forEach(b => b.classList.add('disabled'));

    // Arrow + berry animation
    this._playArrowAnimation(btnEl, isCorrect, berry);

    if (isCorrect) {
      btnEl.classList.add('correct');
      this._addSparkle(btnEl);
      this.audio.play('correct');
      // chomp animation is triggered inside _triggerChomp (called when berry arrives)
      this.setEveeeEmotion('happy');

      // Combo
      this.session.combo++;
      const pts = this.session.combo >= 2 ? 10 : 5;
      this.session.addScore(pts);
      this._showCombo();
      this._showScorePopup(btnEl, `+${pts}`);
    } else {
      btnEl.classList.add('wrong');
      // Reveal correct
      document.querySelectorAll('.answer-btn').forEach(b => {
        if (b.dataset.answer === q.correctAnswer) b.classList.add('reveal-correct');
      });
      this.audio.play('wrong');
      this.animateEevee('shake');
      this.setEveeeEmotion('sad');
      this.session.combo = 0;
      this._showCombo();
    }

    // Add chip
    this._addChip(isCorrect);

    // Update UI
    this.updateScoreDisplay();

    // Save to cloud (unless cleared)
    if (!this.session.data.gameCleared) {
      await this.session.save();
    }

    // Check unlock
    const justUnlocked = this.session.checkUnlock();

    setTimeout(() => {
      if (justUnlocked) {
        // Save again with updated unlock list
        this.session.save();
        this._showCongratsModal(justUnlocked);
      } else {
        this.renderQuestion();
      }
    }, 1100);
  }

  _addChip(isCorrect) {
    const container = document.getElementById('answer-chips');
    if (!container) return;
    const chip = document.createElement('div');
    chip.className = 'chip ' + (isCorrect ? 'correct' : 'wrong');
    chip.textContent = isCorrect ? '✓' : '✗';
    container.appendChild(chip);
  }

  _showCombo() {
    const el = document.getElementById('combo-display');
    const txt = document.getElementById('combo-text');
    if (!el || !txt) return;
    if (this.session.combo >= 2) {
      txt.textContent = `COMBO ×${this.session.combo}  (+10分)`;
      el.classList.remove('hidden');
      // re-trigger animation
      el.style.animation = 'none';
      void el.offsetWidth;
      el.style.animation = '';
    } else {
      el.classList.add('hidden');
    }
  }

  _showScorePopup(refEl, text) {
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = text;
    const rect = refEl.getBoundingClientRect();
    popup.style.left = `${rect.left + rect.width / 2 - 20}px`;
    popup.style.top  = `${rect.top - 10}px`;
    document.body.appendChild(popup);
    popup.addEventListener('animationend', () => popup.remove());
  }

  /* ----- Arrow & Berry animations ----- */
  _playArrowAnimation(btnEl, isCorrect, berry) {
    const layer = document.getElementById('anim-layer');
    if (!layer) return;

    const rect = btnEl.getBoundingClientRect();
    // Start point: near the berry icon on the left of the button
    const startX = rect.left + 28;
    const startY = rect.top + rect.height / 2;

    if (isCorrect) {
      // 1) Arrow shoots upward from button
      const arrow = document.createElement('div');
      arrow.className = 'arrow-projectile';
      arrow.textContent = '🏹';
      arrow.style.cssText = `left:${startX - 11}px; top:${startY - 11}px; position:fixed; z-index:9100;`;
      document.body.appendChild(arrow);
      arrow.addEventListener('animationend', () => arrow.remove());

      // 2) Berry flies on arc to eevee's mouth
      setTimeout(() => {
        const eeveeEl = document.getElementById('eevee-sprite');
        if (!eeveeEl) return;
        const eRect = eeveeEl.getBoundingClientRect();

        // Target = lower-centre of sprite (mouth area)
        const targetX = eRect.left + eRect.width  * 0.5;
        const targetY = eRect.top  + eRect.height * 0.62;

        // Delta from start to target
        const tx = targetX - startX;
        const ty = targetY - startY;

        // Arc midpoint: curve up & toward centre
        const mx = tx * 0.4 + (tx > 0 ? -30 : 30);
        const my = Math.min(ty * 0.3, -50); // always arc upward

        const berryEl = document.createElement('div');
        berryEl.className = 'berry-fly';
        berryEl.textContent = berry.emoji;
        berryEl.style.cssText = `left:${startX - 14}px; top:${startY - 14}px;`;
        berryEl.style.setProperty('--tx', `${tx}px`);
        berryEl.style.setProperty('--ty', `${ty}px`);
        berryEl.style.setProperty('--mx', `${mx}px`);
        berryEl.style.setProperty('--my', `${my}px`);
        document.body.appendChild(berryEl);

        // When berry arrives → trigger chomp
        berryEl.addEventListener('animationend', () => {
          berryEl.remove();
          this._triggerChomp(targetX, targetY);
        });
      }, 280);

    } else {
      // Miss: arrow veers sideways
      const arrow = document.createElement('div');
      arrow.className = 'arrow-miss';
      arrow.textContent = '🏹';
      arrow.style.cssText = `left:${startX - 11}px; top:${startY - 11}px; position:fixed; z-index:9100;`;
      document.body.appendChild(arrow);
      arrow.addEventListener('animationend', () => arrow.remove());

      // Berry shatters in place
      const berryEl = document.createElement('div');
      berryEl.className = 'berry-shatter';
      berryEl.textContent = berry.emoji;
      berryEl.style.cssText = `left:${startX - 10}px; top:${startY - 10}px; position:fixed; z-index:9100;`;
      document.body.appendChild(berryEl);
      berryEl.addEventListener('animationend', () => berryEl.remove());
    }
  }

  /* ----- Chomp burst effect at eevee mouth ----- */
  _triggerChomp(mouthX, mouthY) {
    // 1) Chomp burst ring inside sprite wrap
    const burst = document.getElementById('chomp-burst');
    if (burst) {
      burst.classList.remove('pop');
      void burst.offsetWidth; // reflow
      burst.classList.add('pop');
      burst.addEventListener('animationend', () => burst.classList.remove('pop'), { once: true });
    }

    // 2) Eevee eating wobble
    const sprite = document.getElementById('eevee-sprite');
    if (sprite) {
      sprite.classList.remove('bounce', 'shake', 'chomp');
      void sprite.offsetWidth;
      sprite.classList.add('chomp');
      sprite.addEventListener('animationend', () => sprite.classList.remove('chomp'), { once: true });
    }

    // 3) Stars burst outward from mouth position
    const starEmojis = ['⭐', '✨', '💫', '🌟', '✦'];
    const count = 6;
    for (let i = 0; i < count; i++) {
      const angle = (360 / count) * i + Math.random() * 20;
      const dist  = 38 + Math.random() * 28;
      const rad   = angle * Math.PI / 180;
      const sx    = Math.cos(rad) * dist;
      const sy    = Math.sin(rad) * dist;
      const rot   = (Math.random() - 0.5) * 360;

      const star = document.createElement('div');
      star.className = 'chomp-star';
      star.textContent = starEmojis[i % starEmojis.length];
      star.style.cssText = `left:${mouthX - 8}px; top:${mouthY - 8}px;`;
      star.style.setProperty('--sx', `${sx}px`);
      star.style.setProperty('--sy', `${sy}px`);
      star.style.setProperty('--sr', `${rot}deg`);
      star.style.animationDelay = `${i * 0.04}s`;
      document.body.appendChild(star);
      star.addEventListener('animationend', () => star.remove());
    }

    // 4) Update emotion bubble to eating face
    const bubble = document.getElementById('emotion-bubble');
    if (bubble) {
      bubble.textContent = '(๑>◡<๑) ♪';
      bubble.style.background = 'rgba(64,184,112,0.2)';
      setTimeout(() => {
        bubble.textContent = '(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧';
      }, 600);
    }
  }

  _addSparkle(btnEl) {
    const sp = document.createElement('div');
    sp.className = 'sparkle-overlay';
    btnEl.appendChild(sp);
    sp.addEventListener('animationend', () => sp.remove());
  }

  /* ----- Congrats modal ----- */
  _showCongratsModal(eevee) {
    const spriteEl  = document.getElementById('congrats-sprite');
    const titleEl   = document.getElementById('congrats-title');
    const msgEl     = document.getElementById('congrats-msg');

    if (spriteEl) spriteEl.src = getSprite(eevee.spriteId);
    if (titleEl)  titleEl.textContent = `🎉 恭喜解鎖！`;
    if (msgEl)    msgEl.textContent   = `你的伊布成功進化成\n${eevee.zhName} 了！\n全部進化型：${this.session.unlockedCount()} / ${EEVEE_EVOLUTIONS.length}`;

    this.audio.play('evolve');
    this.showModal('overlay-congrats');
  }

  /* ----- Master victory screen ----- */
  showMasterVictory() {
    const parade = document.getElementById('master-eevee-parade');
    if (parade) {
      parade.innerHTML = '';
      EEVEE_EVOLUTIONS.forEach(e => {
        const img = document.createElement('img');
        img.src = getSpritePixel(e.spriteId);
        img.alt = e.name;
        parade.appendChild(img);
      });
    }
    this.showScreen('screen-master');
  }

  /* ----- Start game session (after choosing target) ----- */
  startGameSession() {
    this._questionCount = 0;
    this.session.combo = 0;
    const chipsEl = document.getElementById('answer-chips');
    if (chipsEl) chipsEl.innerHTML = '';

    this.renderGameTopbar();
    this.updateEeveeSprite();
    this.updateScoreDisplay();
    this.showScreen('screen-game');
    this.renderQuestion();
  }
}

/* ----------------------------------------------------------
   9. App bootstrap
   ---------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const session = new Session();
  const audio   = new AudioEngine();
  const ui      = new UIManager(session, audio);

  ui.createParticles();
  ui.setLoading(false);
  ui.showScreen('screen-login');

  /* Restore last trainer name */
  const lastTrainer = localStorage.getItem('eevee_math_last_trainer');
  const nameInput = document.getElementById('input-trainer-name');
  if (lastTrainer && nameInput) nameInput.value = lastTrainer;

  /* --- Login button --- */
  const btnLogin = document.getElementById('btn-login');
  if (btnLogin) {
    const doLogin = async () => {
      const trainerName = (document.getElementById('input-trainer-name')?.value || '').trim();
      const password    = (document.getElementById('input-trainer-pw')?.value || '').trim();
      if (!trainerName) { alert('請輸入訓練員代號！'); return; }
      if (!password)    { alert('請輸入密碼！'); return; }

      btnLogin.disabled = true;
      ui.setLoading(true, 'E家雲端連線中…');

      try {
        const result = await apiLogin(trainerName, password);
        session.trainerName = trainerName;
        session.token       = result.token;

        // Merge / validate data
        const remote = result.data || getDefaultData();
        // Ensure all score keys exist
        const defaultScores = getDefaultData().scores;
        remote.scores = { ...defaultScores, ...(remote.scores || {}) };
        if (!Array.isArray(remote.unlockedList)) remote.unlockedList = [];
        if (typeof remote.gameCleared !== 'boolean') remote.gameCleared = false;
        session.data = remote;

        localStorage.setItem('eevee_math_last_trainer', trainerName);
        audio.unlock();
        ui.setLoading(false);
        btnLogin.disabled = false;

        afterLogin();
      } catch (err) {
        ui.setLoading(false);
        btnLogin.disabled = false;
        alert(`❌ 登入失敗：${err.message}`);
      }
    };

    btnLogin.addEventListener('click', doLogin);

    // Enter key support
    ['input-trainer-name', 'input-trainer-pw'].forEach(id => {
      document.getElementById(id)?.addEventListener('keydown', e => {
        if (e.key === 'Enter') doLogin();
      });
    });
  }

  /* --- Post-login routing --- */
  function afterLogin() {
    if (session.data.gameCleared) {
      // 爆機後直接進遊戲，不需要選擇
      // 隨機選一隻已解鎖的伊布（純休閒模式）
      const randomEvee = EEVEE_EVOLUTIONS[Math.floor(Math.random() * EEVEE_EVOLUTIONS.length)];
      session.currentTargetId = randomEvee.id;
      ui.startGameSession();
    } else {
      // 未爆機 → 彈出選擇視窗
      ui.renderEeveePickGrid();
      ui.showScreen('screen-game'); // 先顯示遊戲畫面（做背景）
      ui.showModal('overlay-choose-eevee');
    }
  }

  /* --- Congrats OK button --- */
  document.getElementById('btn-congrats-ok')?.addEventListener('click', () => {
    ui.hideModal('overlay-congrats');

    if (session.data.gameCleared) {
      // 全數解鎖 → 顯示大爆機畫面
      setTimeout(() => ui.showMasterVictory(), 300);
    } else {
      // 還有未解鎖 → 重新選擇目標
      ui.renderEeveePickGrid();
      ui.showModal('overlay-choose-eevee');
    }
  });

  /* --- Master continue button --- */
  document.getElementById('btn-master-continue')?.addEventListener('click', () => {
    // 爆機後直接玩（隨機選）
    const randomEvee = EEVEE_EVOLUTIONS[Math.floor(Math.random() * EEVEE_EVOLUTIONS.length)];
    session.currentTargetId = randomEvee.id;
    ui.startGameSession();
  });

  /* --- Quit button (in-game) --- */
  document.getElementById('btn-quit')?.addEventListener('click', () => {
    // 返回登入畫面
    ui.showScreen('screen-login');
  });
});
