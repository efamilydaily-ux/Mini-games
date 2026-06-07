/**
 * 🐹 倉鼠數學訓練營  app.js  v3
 * Scene navigation · Spatial furniture system · AudioManager
 * Priority-queue spaced repetition · API integration
 */
'use strict';

/* ════════════════════════════════════════════════════════
   1. CONSTANTS & CONFIG
════════════════════════════════════════════════════════ */
const CFG = {
  GAME_ID:       'hamster-math',
  API_LOGIN:     '/api/auth-login',
  API_SAVE:      '/api/save-score',
  TIMER_SEC:     3,
  REVIEW_AFTER:  [5, 10, 20],       // spaced repetition offsets
  IMG:           'hamster-math/images/',
  AUDIO:         'hamster-math/audio/',
};

/* Furniture config
   pct  = image width as % of scene width (direct CSS, no px math)
   top  = top edge of item as % of scene height
   left = left edge of item as % of scene width
   ─────────────────────────────────────────────────────────────────
   Visual calibration guide (scene is 4:3):
     hamster sprite ≈ 5% scene width
     water bottle   → small object  → 6%
     food bowl      → small         → 5%
     wood block     → tiny          → 4%
     bed            → medium        → 12%
     bath            → medium-large  → 14%
     chair          → medium        → 8%
     wheel          → medium-large  → 14%
     tunnel         → large         → 18%
     house          → very large    → 24%
     toy            → medium-large  → 14%
     tree           → very large    → 20%
     car            → large         → 20%                          */
const FURNITURE_CONFIG = {
    20: { file:'20-water.jpg',   pct: 6,  top:'8%',  left:'84%' },
    50: { file:'50-food.png',    pct: 5,  top:'79%', left:'40%' },
   100: { file:'100-wood.png',   pct: 4,  top:'74%', left:'19%' },
   150: { file:'150-bed.png',    pct:12,  top:'58%', left:'48%' },
   200: { file:'200-bath.png',   pct:14,  top:'48%', left:'59%' },
   250: { file:'250-chair.png',  pct: 8,  top:'49%', left:'70%' },
   300: { file:'300-wheel.png',  pct:14,  top:'38%', left:'29%' },
   400: { file:'400-tunnel.png', pct:18,  top:'8%',  left:'18%' },
   500: { file:'500-house.png',  pct:24,  top:'4%',  left:'4%'  },
   600: { file:'600-toy.png',    pct:14,  top:'38%', left:'78%' },
   700: { file:'700-tree.png',   pct:20,  top:'3%',  left:'69%' },
   800: { file:'800-car.png',    pct:20,  top:'73%', left:'4%'  },
};

/* Ordered score thresholds for unlock checks */
const THRESHOLDS = Object.keys(FURNITURE_CONFIG).map(Number).sort((a,b)=>a-b);

/* Message pools by tier */
const MSG = {
  basic: [
    '太棒了！倉鼠獲得了新家具，牠現在住得更舒服囉！',
    '哇！新家具到貨啦！倉鼠開心地在裡面跑來跑去！',
    '答題神準！倉鼠的家又升級了，看起來好溫馨！',
    '超棒！倉鼠正在用新家具玩耍，笑得合不攏嘴！',
  ],
  advanced: [
    '你的數學直覺越來越強了！倉鼠的家變得超豪華！',
    '連續答對讓倉鼠家裝潢升上新等級，你是天才！',
    '數學小天才出現啦！倉鼠的豪宅正在成形中！',
    '驚人的實力！倉鼠搖身一變，住進了豪華公寓！',
  ],
  ultimate: [
    '任務達成！倉鼠的五星級豪華別墅正式開放，你就是最強的室內設計師！',
    '傳說級數學大師！倉鼠的夢幻莊園完工，全村倉鼠都羨慕！',
    '你已超越宇宙等級！倉鼠感動到流淚，謝謝你！',
  ],
};

const DIALOGS = [
  'Zzz...', "I'm hungry!", 'So thirsty!',
  '數學真好玩！', '快來跟我一起答題！', '今天也要加油！', '你好厲害喔！',
];

const CORRECT_COMMENTS = [
  '✅ 答對了！太厲害！','🎯 正確！繼續衝！','⚡ 閃電速度！','🌟 完美！','🔥 熱身中！','💪 答對加分！',
];

/* ════════════════════════════════════════════════════════
   2. STATE
════════════════════════════════════════════════════════ */
let state = {
  trainerName:    '',
  token:          '',
  totalCorrect:   0,
  unlockedScores: [],   // list of score thresholds already unlocked
  mistakeQueue:   [],   // [{ a, b, dueAfter }]
  pendingReviews: [],
  questionCount:  0,
  awaitingInput:  true,
};

let currentQ      = null;
let timerInterval = null;
let timeLeft      = CFG.TIMER_SEC;
let dialogTimer   = null;   // home bubble interval
let walkInterval  = null;   // hamster movement interval

/* ════════════════════════════════════════════════════════
   3. DOM REFS
════════════════════════════════════════════════════════ */
const $  = id => document.getElementById(id);
const $$ = (sel, ctx=document) => ctx.querySelector(sel);

const D = {
  // scenes
  sceneLogin: $('scene-login'),
  sceneHome:  $('scene-home'),
  sceneQuiz:  $('scene-quiz'),
  // login
  inpName:    $('inp-name'),
  inpPw:      $('inp-pw'),
  btnLogin:   $('btn-login'),
  loginErr:   $('login-err'),
  // home hud
  hudName:    $('hud-name'),
  hudScore:   $('hud-score'),
  nextUnlock: $('next-unlock'),
  pbarFill:   $('pbar-fill'),
  queueHome:  $('queue-home'),
  // cage
  cageScene:  $('cage-scene'),
  cageBg:     $('cage-bg'),
  furnLayer:  $('furniture-layer'),
  hActor:     $('hamster-actor'),
  hSprite:    $('h-sprite'),
  hBubble:    $('h-bubble'),
  finalOverlay: $('final-overlay'),
  btnStart:   $('btn-start'),
  // quiz hud
  quizScore:  $('quiz-score'),
  reviewBadge:$('review-badge'),
  btnExit:    $('btn-exit'),
  // quiz body
  qzSprite:   $('qz-sprite'),
  trFill:     $('tr-fill'),
  tNum:       $('t-num'),
  qText:      $('q-text'),
  ansInput:   $('ans-input'),
  btnSubmit:  $('btn-submit'),
  feedback:   $('feedback'),
  qCount:     $('q-count'),
  // congrats
  cOverlay:   $('congrats-overlay'),
  cFurniture: $('c-furniture'),
  cMessage:   $('c-message'),
  cConfetti:  $('c-confetti'),
  btnContinue:$('btn-continue'),
};

/* ════════════════════════════════════════════════════════
   4. AUDIO MANAGER
════════════════════════════════════════════════════════ */
const AudioManager = (() => {
  const cache = {};
  const files = {
    correct: 'correct.mp3',
    wrong:   'wrong.mp3',
    unlock:  'unlock.mp3',
    timer:   'timer.mp3',
    final:   'final.mp3',
  };
  function play(type) {
    const file = files[type];
    if (!file) return;
    try {
      if (!cache[type]) {
        const a = new Audio(CFG.AUDIO + file);
        a.preload = 'auto';
        cache[type] = a;
      }
      const a = cache[type].cloneNode();
      a.volume = type === 'timer' ? 0.5 : 0.8;
      a.play().catch(()=>{});   // ignore autoplay policy errors
    } catch(e) { /* silently ignore missing audio files */ }
  }
  return { play };
})();

/* ════════════════════════════════════════════════════════
   5. SCENE NAVIGATION
════════════════════════════════════════════════════════ */
function showScene(name) {
  [D.sceneLogin, D.sceneHome, D.sceneQuiz].forEach(s => s.classList.remove('active'));
  $(`scene-${name}`).classList.add('active');
}

/* ════════════════════════════════════════════════════════
   6. API HELPERS
════════════════════════════════════════════════════════ */
async function apiLogin(trainerName, password) {
  const res = await fetch(CFG.API_LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      trainerName, password,
      gameId: CFG.GAME_ID,
      defaultData: { totalCorrect:0, unlockedScores:[], mistakeQueue:[] },
    }),
  });
  return res.json();
}

async function apiSave() {
  if (!state.token) return;
  try {
    await fetch(CFG.API_SAVE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trainerName: state.trainerName,
        gameId:      CFG.GAME_ID,
        token:       state.token,
        gameData: {
          totalCorrect:   state.totalCorrect,
          unlockedScores: state.unlockedScores,
          mistakeQueue:   state.mistakeQueue,
        },
      }),
    });
  } catch(e) { console.warn('apiSave failed:', e); }
}

/* ════════════════════════════════════════════════════════
   7. LOGIN
════════════════════════════════════════════════════════ */
D.btnLogin.addEventListener('click', handleLogin);
[D.inpName, D.inpPw].forEach(el =>
  el.addEventListener('keydown', e => { if(e.key==='Enter') handleLogin(); })
);

async function handleLogin() {
  const name = D.inpName.value.trim();
  const pw   = D.inpPw.value;
  D.loginErr.textContent = '';

  if (!name || !pw) { D.loginErr.textContent = '請輸入名字與密碼！'; return; }
  if (pw.length < 6) { D.loginErr.textContent = '密碼至少需要 6 個字！'; return; }

  D.btnLogin.disabled = true;
  D.btnLogin.textContent = '登入中…';

  try {
    const res = await apiLogin(name, pw);
    if (!res.success) {
      D.loginErr.textContent = res.message || '登入失敗！';
      D.btnLogin.disabled = false;
      D.btnLogin.textContent = '出發！🚀';
      return;
    }
    state.trainerName    = name;
    state.token          = res.token;
    const d = res.data || {};
    state.totalCorrect   = d.totalCorrect   || 0;
    state.unlockedScores = d.unlockedScores || [];
    state.mistakeQueue   = d.mistakeQueue   || [];

    enterHome();
  } catch(err) {
    D.loginErr.textContent = '網路錯誤，請稍後再試。';
    D.btnLogin.disabled = false;
    D.btnLogin.textContent = '出發！🚀';
  }
}

/* ════════════════════════════════════════════════════════
   8. HOME SCENE
════════════════════════════════════════════════════════ */
function enterHome() {
  showScene('home');
  D.hudName.textContent = state.trainerName;
  refreshHomeHUD();
  renderFurniture();
  startHamsterAI();
  checkFinalState();
}

function refreshHomeHUD() {
  D.hudScore.textContent  = state.totalCorrect;
  D.queueHome.textContent = state.mistakeQueue.length + state.pendingReviews.length;
  updateProgress();
}

function updateProgress() {
  const score = state.totalCorrect;
  const nextT = THRESHOLDS.find(t => score < t);
  if (!nextT) {
    D.nextUnlock.textContent = '全部解鎖！';
    D.pbarFill.style.width   = '100%';
    return;
  }
  const idx   = THRESHOLDS.indexOf(nextT);
  const prevT = idx === 0 ? 0 : THRESHOLDS[idx-1];
  const pct   = ((score - prevT) / (nextT - prevT)) * 100;
  D.nextUnlock.textContent = nextT;
  D.pbarFill.style.width   = Math.min(pct,100) + '%';
}

/* ── Furniture Renderer ──
   Each item is absolutely positioned within #furniture-layer (which fills
   the cage scene). Width is expressed as % of the scene so it stays
   stable at any viewport size. Newly unlocked items get an entrance
   animation; already-rendered items are not rebuilt.                     */
function renderFurniture() {
  const existing = new Set(
    [...D.furnLayer.querySelectorAll('.furn-item')].map(el => Number(el.dataset.score))
  );

  THRESHOLDS.forEach(score => {
    if (!state.unlockedScores.includes(score)) return;
    if (existing.has(score)) return;   // already in DOM, skip

    const cfg = FURNITURE_CONFIG[score];

    const wrap = document.createElement('div');
    wrap.className     = 'furn-item';
    wrap.dataset.score = score;

    /* Position as % of scene (furniture-layer is position:absolute inset:0) */
    wrap.style.top   = cfg.top;
    wrap.style.left  = cfg.left;
    /* Width as % of scene width; height auto for correct aspect ratio */
    wrap.style.width = cfg.pct + '%';

    const img = document.createElement('img');
    img.src          = CFG.IMG + cfg.file;
    img.alt          = 'furniture-' + score;
    img.style.width  = '100%';
    img.style.height = 'auto';
    img.style.display = 'block';
    img.onerror = () => { wrap.style.display = 'none'; };

    wrap.appendChild(img);
    D.furnLayer.appendChild(wrap);

    /* Trigger CSS entrance animation after paint */
    requestAnimationFrame(() => { wrap.classList.add('furn-visible'); });
  });
}

/* ── Hamster AI ── */
function startHamsterAI() {
  stopHamsterAI();
  moveHamster();
  walkInterval = setInterval(moveHamster, 3000 + Math.random() * 2000);

  // dialog bubbles every 8-10 seconds
  dialogTimer = setInterval(showRandomDialog, 8000 + Math.random() * 2000);
}

function stopHamsterAI() {
  clearInterval(walkInterval);
  clearInterval(dialogTimer);
}

function moveHamster() {
  const newLeft   = 5  + Math.random() * 70;  // 5% – 75%
  const newBottom = 5  + Math.random() * 30;  // 5% – 35%
  const curLeft   = parseFloat(D.hActor.style.left) || 10;

  D.hActor.style.left   = newLeft + '%';
  D.hActor.style.bottom = newBottom + '%';

  D.hActor.classList.toggle('flip', newLeft < curLeft);
  D.hActor.classList.add('walking');
  setTimeout(() => D.hActor.classList.remove('walking'), 2400);
}

function showRandomDialog() {
  const text = DIALOGS[Math.floor(Math.random() * DIALOGS.length)];
  D.hBubble.textContent = text;
  D.hBubble.classList.add('show');
  setTimeout(() => D.hBubble.classList.remove('show'), 3500);
}

/* ── Final state ── */
function checkFinalState() {
  if (state.totalCorrect >= 800) {
    D.finalOverlay.classList.remove('hidden');
    AudioManager.play('final');
  }
}

/* ── Start quiz button ── */
D.btnStart.addEventListener('click', enterQuiz);

/* ════════════════════════════════════════════════════════
   9. QUIZ SCENE
════════════════════════════════════════════════════════ */
function enterQuiz() {
  stopHamsterAI();
  showScene('quiz');
  D.quizScore.textContent = state.totalCorrect;
  nextQuestion();
  D.ansInput.focus();
}

async function exitQuiz() {
  stopTimer();
  D.btnExit.disabled = true;
  D.btnExit.textContent = '存檔中…';
  await apiSave();
  D.btnExit.disabled = false;
  D.btnExit.textContent = '💾 退出存檔';
  enterHome();
}

D.btnExit.addEventListener('click', exitQuiz);

/* ════════════════════════════════════════════════════════
   10. QUESTION LOGIC (Spaced Repetition)
════════════════════════════════════════════════════════ */
function getDueReviews() {
  return state.mistakeQueue.filter(q => q.dueAfter <= state.questionCount);
}

function processDueReviews() {
  const due = getDueReviews();
  if (!due.length) return;
  state.mistakeQueue = state.mistakeQueue.filter(q => q.dueAfter > state.questionCount);
  const [first, ...rest] = due;
  state.pendingReviews.push(first);
  rest.forEach((q, i) => {
    q.dueAfter = state.questionCount + i + 1;
    state.mistakeQueue.push(q);
  });
}

function randomQuestion() {
  const a = Math.floor(Math.random()*9)+1;
  const b = Math.floor(Math.random()*9)+1;
  return { a, b, answer: a*b, isReview: false };
}

function nextQuestion() {
  stopTimer();
  D.feedback.className = 'feedback hidden';
  D.ansInput.value  = '';
  D.ansInput.className = 'ans-input';
  state.awaitingInput  = true;

  state.questionCount++;
  processDueReviews();

  if (state.pendingReviews.length > 0) {
    const rev = state.pendingReviews.shift();
    currentQ = { a:rev.a, b:rev.b, answer:rev.a*rev.b, isReview:true };
    D.reviewBadge.classList.remove('hidden');
  } else {
    currentQ = randomQuestion();
    D.reviewBadge.classList.add('hidden');
  }

  D.qText.textContent = `${currentQ.a} × ${currentQ.b} = ?`;
  D.ansInput.focus();
  startTimer();
  updateQueueBadge();
}

/* ════════════════════════════════════════════════════════
   11. TIMER
════════════════════════════════════════════════════════ */
const CIRCUMFERENCE = 2 * Math.PI * 52;

function startTimer() {
  timeLeft = CFG.TIMER_SEC;
  updateTimerUI(timeLeft);
  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerUI(timeLeft);
    if (timeLeft <= 0) { clearInterval(timerInterval); handleTimeout(); }
    else if (timeLeft <= 1) AudioManager.play('timer');
  }, 1000);
}

function stopTimer() { clearInterval(timerInterval); }

function updateTimerUI(t) {
  D.tNum.textContent = t;
  const ratio = t / CFG.TIMER_SEC;
  D.trFill.style.strokeDashoffset = CIRCUMFERENCE * (1-ratio);
  D.trFill.classList.remove('warn','danger');
  if (t <= 1) D.trFill.classList.add('danger');
  else if (t <= 2) D.trFill.classList.add('warn');
}

function handleTimeout() {
  if (!state.awaitingInput) return;
  state.awaitingInput = false;
  AudioManager.play('wrong');
  quizHamsterAnim('sad');
  showFeedback(false, `⏰ 時間到！答案是 ${currentQ.answer}`);
  addMistake(currentQ.a, currentQ.b, false);
  setTimeout(nextQuestion, 1700);
}

/* ════════════════════════════════════════════════════════
   12. ANSWER SUBMISSION
════════════════════════════════════════════════════════ */
D.btnSubmit.addEventListener('click', submitAnswer);
D.ansInput.addEventListener('keydown', e => { if(e.key==='Enter') submitAnswer(); });

function submitAnswer() {
  if (!state.awaitingInput || !currentQ) return;
  const val = parseInt(D.ansInput.value, 10);
  if (isNaN(val)) return;
  state.awaitingInput = false;
  stopTimer();
  val === currentQ.answer ? handleCorrect() : handleWrong();
}

function handleCorrect() {
  D.ansInput.classList.add('correct');
  AudioManager.play('correct');
  quizHamsterAnim('happy');
  state.totalCorrect++;
  D.quizScore.textContent = state.totalCorrect;
  showFeedback(true, CORRECT_COMMENTS[Math.floor(Math.random()*CORRECT_COMMENTS.length)]);
  checkUnlock();
  apiSave();
  setTimeout(nextQuestion, 950);
}

function handleWrong() {
  D.ansInput.classList.add('wrong');
  AudioManager.play('wrong');
  quizHamsterAnim('sad');
  showFeedback(false, `❌ 答案是 ${currentQ.answer}，再努力！`);
  addMistake(currentQ.a, currentQ.b, currentQ.isReview);
  setTimeout(nextQuestion, 1700);
}

/* ════════════════════════════════════════════════════════
   13. MISTAKE QUEUE
════════════════════════════════════════════════════════ */
function addMistake(a, b, reset) {
  const idx = state.mistakeQueue.findIndex(q => q.a===a && q.b===b);
  if (idx !== -1) {
    if (!reset) return;
    state.mistakeQueue.splice(idx, 1);
  }
  CFG.REVIEW_AFTER.forEach(offset => {
    state.mistakeQueue.push({ a, b, dueAfter: state.questionCount + offset });
  });
  updateQueueBadge();
}

function updateQueueBadge() {
  const total = state.mistakeQueue.length + state.pendingReviews.length;
  D.qCount.textContent = total;
}

/* ════════════════════════════════════════════════════════
   14. UNLOCK SYSTEM
════════════════════════════════════════════════════════ */
function checkUnlock() {
  for (const score of THRESHOLDS) {
    if (state.totalCorrect >= score && !state.unlockedScores.includes(score)) {
      state.unlockedScores.push(score);
      // re-render furniture on home (will be visible when user exits quiz)
      renderFurniture();
      // Determine message tier
      const idx = THRESHOLDS.indexOf(score);
      const tier = idx >= THRESHOLDS.length-2 ? 'ultimate'
                 : idx >= THRESHOLDS.length/2  ? 'advanced'
                 : 'basic';
      AudioManager.play(score >= 800 ? 'final' : 'unlock');
      setTimeout(() => showCongrats(score, tier), 300);
      break; // one unlock per correct answer
    }
  }
}

function showCongrats(score, tier) {
  const cfg = FURNITURE_CONFIG[score];
  const imgEl = cfg
    ? `<img src="${CFG.IMG+cfg.file}" style="height:80px;object-fit:contain" onerror="this.style.display='none'">`
    : '⭐';

  D.cFurniture.innerHTML = imgEl;
  const pool = MSG[tier];
  D.cMessage.textContent = pool[Math.floor(Math.random()*pool.length)];
  launchConfetti();
  D.cOverlay.classList.remove('hidden');
}

D.btnContinue.addEventListener('click', () => {
  D.cOverlay.classList.add('hidden');
  D.ansInput.focus();
});

function launchConfetti() {
  D.cConfetti.innerHTML = '';
  const colors = ['#FF6B35','#FFD166','#06D6A0','#118AB2','#FF6BA8','#9B5DE5'];
  for (let i=0; i<44; i++) {
    const p = document.createElement('div');
    p.className = 'c-piece';
    p.style.cssText = `
      left:${Math.random()*100}%;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      width:${6+Math.random()*8}px;height:${6+Math.random()*8}px;
      border-radius:${Math.random()>.5?'50%':'3px'};
      animation-duration:${.8+Math.random()*1.2}s;
      animation-delay:${Math.random()*.5}s;
    `;
    D.cConfetti.appendChild(p);
  }
}

/* ════════════════════════════════════════════════════════
   15. FEEDBACK & ANIMATIONS
════════════════════════════════════════════════════════ */
function showFeedback(ok, text) {
  D.feedback.textContent = text;
  D.feedback.className   = `feedback ${ok ? 'ok' : 'err'}`;
}

function quizHamsterAnim(type) {
  D.qzSprite.classList.remove('happy','sad');
  void D.qzSprite.offsetWidth; // reflow
  D.qzSprite.classList.add(type);
  setTimeout(() => D.qzSprite.classList.remove(type), type==='happy' ? 1400 : 600);
}

/* ════════════════════════════════════════════════════════
   16. BEFOREUNLOAD GUARD
════════════════════════════════════════════════════════ */
window.addEventListener('beforeunload', e => {
  if (state.token) {
    apiSave();
    e.preventDefault();
    e.returnValue = '';
  }
});

/* ════════════════════════════════════════════════════════
   17. RESIZE — no-op: furniture uses pure CSS % so always stable
════════════════════════════════════════════════════════ */
// No resize handler needed — all furniture sizing is in CSS %
