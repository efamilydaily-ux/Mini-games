/**
 * 🐹 倉鼠數學訓練營 — app.js
 * 完整功能：錯題 Priority Queue、倒數計時、API 整合、自動保存
 */

'use strict';

// ═══════════════════════════════════════════════════════
//  CONFIG
// ═══════════════════════════════════════════════════════
const CONFIG = {
  GAME_ID:       'hamster-math',
  API_LOGIN:     '/api/auth-login',
  API_GET:       '/api/get-score',
  API_SAVE:      '/api/save-score',
  TIMER_SECONDS: 3,
  REVIEW_AFTER:  [5, 10, 20],           // 錯題在第 N 題後重現
  UNLOCK_THRESHOLDS: [10, 20, 60, 100, 150, 200, 250, 300, 350, 450, 550, 650, 800, 1000],
};

// 家具庫
const FURNITURE = ['🛏️','🛋️','📺','🪴','💡','🪞','🚿','🖼️','🍳','🎮','🪑','🧸','🎵','⭐'];

// 解鎖訊息庫
const MESSAGES = {
  basic: [
    '太棒了！倉鼠獲得了新家具，牠現在住得更舒服囉！',
    '哇！新家具到貨啦！倉鼠開心地在裡面跑滾輪！',
    '答題神準！倉鼠的家又升級了，看起來好溫馨！',
    '超棒的！倉鼠正在用新家具玩耍，超快樂的樣子！',
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
    '你已經超越宇宙等級！倉鼠感動到流淚，謝謝你的用心訓練！',
  ],
};

// ═══════════════════════════════════════════════════════
//  GAME STATE
// ═══════════════════════════════════════════════════════
let state = {
  trainerName:      '',
  token:            '',
  totalCorrect:     0,
  mistakeQueue:     [],   // [{ a, b, dueAfter }]
  unlockedSlots:    [],   // array of slot indices unlocked
  questionCount:    0,    // total questions shown (for due-after logic)
  pendingReviews:   [],   // reviews ready but delayed (priority queue buffer)
  isReview:         false,
  awaitingInput:    true,
};

let currentQ     = null;
let timerInterval = null;
let timeLeft     = CONFIG.TIMER_SECONDS;

// ═══════════════════════════════════════════════════════
//  DOM REFS
// ═══════════════════════════════════════════════════════
const $ = id => document.getElementById(id);

const DOM = {
  screenLogin:     $('screen-login'),
  screenGame:      $('screen-game'),
  inputName:       $('input-name'),
  inputPassword:   $('input-password'),
  btnLogin:        $('btn-login'),
  loginError:      $('login-error'),
  hudName:         $('hud-name'),
  hudScore:        $('hud-score'),
  btnSave:         $('btn-save'),
  furnitureGrid:   $('furniture-grid'),
  hamsterBubble:   $('hamster-bubble'),
  nextUnlock:      $('next-unlock-score'),
  progressFill:    $('progress-bar-fill'),
  reviewBadge:     $('review-badge'),
  ringFill:        $('ring-fill'),
  timerText:       $('timer-text'),
  questionText:    $('question-text'),
  answerInput:     $('answer-input'),
  btnSubmit:       $('btn-submit'),
  feedback:        $('feedback'),
  queueCount:      $('queue-count'),
  congratsOverlay: $('congrats-overlay'),
  congratsFurniture: $('congrats-furniture'),
  congratsMessage: $('congrats-message'),
  confettiContainer: $('confetti-container'),
  btnContinue:     $('btn-continue'),
};

// ═══════════════════════════════════════════════════════
//  API HELPERS
// ═══════════════════════════════════════════════════════
async function apiLogin(trainerName, password) {
  const defaultData = {
    totalCorrect:  0,
    mistakeQueue:  [],
    unlockedSlots: [],
  };
  const res = await fetch(CONFIG.API_LOGIN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      trainerName,
      password,
      gameId:      CONFIG.GAME_ID,
      defaultData,
    }),
  });
  return res.json();
}

async function apiSave() {
  if (!state.token) return;
  const gameData = {
    totalCorrect:  state.totalCorrect,
    mistakeQueue:  state.mistakeQueue,
    unlockedSlots: state.unlockedSlots,
  };
  try {
    await fetch(CONFIG.API_SAVE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trainerName: state.trainerName,
        gameId:      CONFIG.GAME_ID,
        gameData,
        token:       state.token,
      }),
    });
  } catch (e) {
    console.warn('自動保存失敗:', e);
  }
}

// ═══════════════════════════════════════════════════════
//  LOGIN
// ═══════════════════════════════════════════════════════
DOM.btnLogin.addEventListener('click', handleLogin);
[DOM.inputName, DOM.inputPassword].forEach(el => {
  el.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
});

async function handleLogin() {
  const name = DOM.inputName.value.trim();
  const pw   = DOM.inputPassword.value;
  DOM.loginError.textContent = '';

  if (!name || !pw) {
    DOM.loginError.textContent = '請輸入名字與密碼！';
    return;
  }
  if (pw.length < 6) {
    DOM.loginError.textContent = '密碼至少需要 6 個字！';
    return;
  }

  DOM.btnLogin.disabled = true;
  DOM.btnLogin.textContent = '登入中…';

  try {
    const res = await apiLogin(name, pw);
    if (!res.success) {
      DOM.loginError.textContent = res.message || '登入失敗！';
      DOM.btnLogin.disabled = false;
      DOM.btnLogin.innerHTML = '<span>出發！</span> 🚀';
      return;
    }

    // Restore state
    state.trainerName = name;
    state.token       = res.token;
    const d = res.data || {};
    state.totalCorrect  = d.totalCorrect  || 0;
    state.mistakeQueue  = d.mistakeQueue  || [];
    state.unlockedSlots = d.unlockedSlots || [];

    startGame();
  } catch (err) {
    DOM.loginError.textContent = '網路錯誤，請稍後再試。';
    DOM.btnLogin.disabled = false;
    DOM.btnLogin.innerHTML = '<span>出發！</span> 🚀';
  }
}

// ═══════════════════════════════════════════════════════
//  START GAME
// ═══════════════════════════════════════════════════════
function startGame() {
  DOM.screenLogin.classList.remove('active');
  DOM.screenGame.classList.add('active');

  DOM.hudName.textContent = state.trainerName;
  refreshHUD();
  renderFurniture();
  DOM.answerInput.focus();

  nextQuestion();
}

// ═══════════════════════════════════════════════════════
//  QUESTION LOGIC
// ═══════════════════════════════════════════════════════

/** 從 mistakeQueue 找到 dueAfter <= questionCount 的題目 */
function getDueReviews() {
  return state.mistakeQueue.filter(q => q.dueAfter <= state.questionCount);
}

/** 移除已到期的複習題（從 mistakeQueue 暫時取出，加入 pendingReviews） */
function processDueReviews() {
  const due = getDueReviews();
  if (due.length === 0) return;

  // 從主隊列移除
  state.mistakeQueue = state.mistakeQueue.filter(q => q.dueAfter > state.questionCount);

  // 第一題立刻可出題，其餘延遲 1 題
  const [first, ...rest] = due;
  state.pendingReviews.push(first);
  rest.forEach((q, i) => {
    // 延遲 (i+1) 題後再出
    q.dueAfter = state.questionCount + i + 1;
    state.mistakeQueue.push(q);
  });
}

/** 產生一道新的隨機題目 */
function randomQuestion() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return { a, b, answer: a * b, isReview: false };
}

function nextQuestion() {
  stopTimer();
  DOM.feedback.classList.add('hidden');
  DOM.feedback.className = 'feedback hidden';
  DOM.answerInput.value = '';
  DOM.answerInput.className = 'answer-input';
  state.awaitingInput = true;

  state.questionCount++;
  processDueReviews();

  if (state.pendingReviews.length > 0) {
    // 取出複習題
    const rev = state.pendingReviews.shift();
    currentQ = { a: rev.a, b: rev.b, answer: rev.a * rev.b, isReview: true };
    state.isReview = true;
    DOM.reviewBadge.classList.remove('hidden');
  } else {
    currentQ = randomQuestion();
    state.isReview = false;
    DOM.reviewBadge.classList.add('hidden');
  }

  DOM.questionText.textContent = `${currentQ.a} × ${currentQ.b} = ?`;
  DOM.answerInput.focus();
  startTimer();
  updateQueueDisplay();
}

// ═══════════════════════════════════════════════════════
//  TIMER
// ═══════════════════════════════════════════════════════
const CIRCUMFERENCE = 2 * Math.PI * 52; // r=52

function startTimer() {
  timeLeft = CONFIG.TIMER_SECONDS;
  updateTimerUI(timeLeft);
  timerInterval = setInterval(() => {
    timeLeft -= 1;
    updateTimerUI(timeLeft);
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handleTimeout();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function updateTimerUI(t) {
  DOM.timerText.textContent = t;
  const ratio = t / CONFIG.TIMER_SECONDS;
  DOM.ringFill.style.strokeDashoffset = CIRCUMFERENCE * (1 - ratio);

  DOM.ringFill.classList.remove('warning', 'danger');
  if (t <= 1) DOM.ringFill.classList.add('danger');
  else if (t <= 2) DOM.ringFill.classList.add('warning');
}

function handleTimeout() {
  if (!state.awaitingInput) return;
  state.awaitingInput = false;
  showFeedback(false, `時間到！答案是 ${currentQ.answer}`);
  addToMistakeQueue(currentQ.a, currentQ.b);
  setTimeout(nextQuestion, 1600);
}

// ═══════════════════════════════════════════════════════
//  ANSWER SUBMISSION
// ═══════════════════════════════════════════════════════
DOM.btnSubmit.addEventListener('click', submitAnswer);
DOM.answerInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') submitAnswer();
});

function submitAnswer() {
  if (!state.awaitingInput || !currentQ) return;
  const val = parseInt(DOM.answerInput.value, 10);
  if (isNaN(val)) return;

  state.awaitingInput = false;
  stopTimer();

  if (val === currentQ.answer) {
    handleCorrect();
  } else {
    handleWrong(val);
  }
}

function handleCorrect() {
  DOM.answerInput.classList.add('correct');
  state.totalCorrect++;
  showFeedback(true, getCorrectComment());

  // 若是複習題且答對，不重加佇列（已從 pendingReviews 移除）
  checkUnlock();
  refreshHUD();
  apiSave(); // 自動保存

  setTimeout(nextQuestion, 900);
}

function handleWrong(userVal) {
  DOM.answerInput.classList.add('wrong');
  showFeedback(false, `❌ 答案是 ${currentQ.answer}，再努力！`);

  if (currentQ.isReview) {
    // 複習中答錯 → 重置所有計數，重新加入
    addToMistakeQueue(currentQ.a, currentQ.b, true);
  } else {
    addToMistakeQueue(currentQ.a, currentQ.b, false);
  }

  setTimeout(nextQuestion, 1600);
}

// ═══════════════════════════════════════════════════════
//  MISTAKE QUEUE  (Spaced Repetition)
// ═══════════════════════════════════════════════════════
function addToMistakeQueue(a, b, reset = false) {
  // 避免重複（同一題）
  const existing = state.mistakeQueue.findIndex(q => q.a === a && q.b === b);
  if (existing !== -1 && !reset) return; // 已在隊列且不重置
  if (existing !== -1)  state.mistakeQueue.splice(existing, 1); // 移除舊的

  // 3 個到期點：+5, +10, +20 題後
  CONFIG.REVIEW_AFTER.forEach(offset => {
    state.mistakeQueue.push({
      a,
      b,
      dueAfter: state.questionCount + offset,
    });
  });
  updateQueueDisplay();
}

function updateQueueDisplay() {
  DOM.queueCount.textContent = state.mistakeQueue.length + state.pendingReviews.length;
}

// ═══════════════════════════════════════════════════════
//  UNLOCK / FURNITURE SYSTEM
// ═══════════════════════════════════════════════════════
function checkUnlock() {
  const thresholds = CONFIG.UNLOCK_THRESHOLDS;
  for (let i = 0; i < thresholds.length; i++) {
    if (state.totalCorrect >= thresholds[i] && !state.unlockedSlots.includes(i)) {
      state.unlockedSlots.push(i);
      renderFurniture();
      setTimeout(() => showCongrats(i), 300);
      break; // 一次只解鎖一個
    }
  }
  updateProgress();
}

function renderFurniture() {
  const slots = DOM.furnitureGrid.querySelectorAll('.furniture-slot');
  slots.forEach((slot, i) => {
    if (state.unlockedSlots.includes(i)) {
      slot.textContent = FURNITURE[i] || '🌟';
      slot.classList.add('unlocked');
      slot.title = `已解鎖！`;
    } else {
      slot.textContent = '🔒';
      slot.classList.remove('unlocked');
      slot.title = `答對 ${CONFIG.UNLOCK_THRESHOLDS[i]} 題解鎖`;
    }
  });
}

function updateProgress() {
  const score = state.totalCorrect;
  const thresholds = CONFIG.UNLOCK_THRESHOLDS;
  const nextIdx = thresholds.findIndex(t => score < t);

  if (nextIdx === -1) {
    DOM.nextUnlock.textContent = '全部解鎖！';
    DOM.progressFill.style.width = '100%';
    return;
  }

  const nextT = thresholds[nextIdx];
  const prevT = nextIdx === 0 ? 0 : thresholds[nextIdx - 1];
  const pct = ((score - prevT) / (nextT - prevT)) * 100;
  DOM.nextUnlock.textContent = nextT;
  DOM.progressFill.style.width = Math.min(pct, 100) + '%';
}

// ═══════════════════════════════════════════════════════
//  CONGRATS MODAL
// ═══════════════════════════════════════════════════════
function showCongrats(slotIndex) {
  const furniture = FURNITURE[slotIndex] || '🌟';
  const threshold = CONFIG.UNLOCK_THRESHOLDS[slotIndex];

  // Pick message tier
  let msgPool;
  if (slotIndex >= 12)      msgPool = MESSAGES.ultimate;
  else if (slotIndex >= 6)  msgPool = MESSAGES.advanced;
  else                      msgPool = MESSAGES.basic;

  const msg = msgPool[Math.floor(Math.random() * msgPool.length)];

  DOM.congratsFurniture.textContent = furniture;
  DOM.congratsMessage.textContent = msg;

  launchConfetti();
  DOM.congratsOverlay.classList.remove('hidden');

  // Hamster bubble
  showHamsterBubble(`我有新的${['床','沙發','電視','盆栽','燈','鏡子','浴室','畫','廚具','遊戲機','椅子','玩具','音響','星星'][slotIndex]}啦！`);
}

DOM.btnContinue.addEventListener('click', () => {
  DOM.congratsOverlay.classList.add('hidden');
  DOM.answerInput.focus();
});

function launchConfetti() {
  DOM.confettiContainer.innerHTML = '';
  const colors = ['#FF6B35','#FFD166','#06D6A0','#118AB2','#FF6BA8','#9B5DE5'];
  for (let i = 0; i < 40; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.cssText = `
      left: ${Math.random() * 100}%;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      width: ${6 + Math.random() * 8}px;
      height: ${6 + Math.random() * 8}px;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
      animation-duration: ${0.8 + Math.random() * 1.2}s;
      animation-delay: ${Math.random() * 0.5}s;
      animation-name: confettiFall;
    `;
    DOM.confettiContainer.appendChild(piece);
  }
}

// ═══════════════════════════════════════════════════════
//  FEEDBACK & HUD
// ═══════════════════════════════════════════════════════
const CORRECT_COMMENTS = [
  '✅ 答對了！太厲害！','🎯 正確！繼續衝！','⚡ 閃電速度！','🌟 完美！','🔥 熱身中！','💪 答對加分！',
];
function getCorrectComment() {
  return CORRECT_COMMENTS[Math.floor(Math.random() * CORRECT_COMMENTS.length)];
}

function showFeedback(isCorrect, text) {
  DOM.feedback.textContent = text;
  DOM.feedback.className = `feedback ${isCorrect ? 'correct-fb' : 'wrong-fb'}`;
}

function refreshHUD() {
  DOM.hudScore.textContent = state.totalCorrect;
  updateProgress();
}

function showHamsterBubble(text) {
  DOM.hamsterBubble.textContent = text;
  DOM.hamsterBubble.classList.add('visible');
  setTimeout(() => DOM.hamsterBubble.classList.remove('visible'), 3500);
}

// ═══════════════════════════════════════════════════════
//  MANUAL SAVE
// ═══════════════════════════════════════════════════════
DOM.btnSave.addEventListener('click', async () => {
  DOM.btnSave.textContent = '儲存中…';
  await apiSave();
  DOM.btnSave.textContent = '✅ 已存檔';
  setTimeout(() => { DOM.btnSave.innerHTML = '💾 存檔'; }, 1500);
});

// ═══════════════════════════════════════════════════════
//  BEFOREUNLOAD — 防止進度遺失
// ═══════════════════════════════════════════════════════
window.addEventListener('beforeunload', e => {
  if (state.token) {
    apiSave(); // 盡力保存（非同步，不保證完成）
    e.preventDefault();
    e.returnValue = ''; // 觸發瀏覽器確認框
  }
});
