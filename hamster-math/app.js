/**
 * 🐹 倉鼠數學訓練營  app.js  v4
 * 完全平坦結構，所有初始化在 DOMContentLoaded 後執行
 */

/* ════════════════════════════════════════════════════
   CONSTANTS  (no DOM access — safe at parse time)
════════════════════════════════════════════════════ */
const GAME_ID      = 'hamster-math';
const API_LOGIN    = '/api/auth-login';
const API_SAVE     = '/api/save-score';
const TIMER_SEC    = 3;
const REVIEW_AFTER = [5, 10, 20];
const IMG_BASE     = 'hamster-math/images/';
const AUDIO_BASE   = 'hamster-math/audio/';

const FURNITURE_CONFIG = [
  { score:  20, file:'20-water.jpg',   pct:6,  top:'8%',  left:'84%' },
  { score:  50, file:'50-food.png',    pct:5,  top:'79%', left:'40%' },
  { score: 100, file:'100-wood.png',   pct:4,  top:'74%', left:'19%' },
  { score: 150, file:'150-bed.png',    pct:12, top:'58%', left:'48%' },
  { score: 200, file:'200-bath.png',   pct:14, top:'48%', left:'59%' },
  { score: 250, file:'250-chair.png',  pct:8,  top:'49%', left:'70%' },
  { score: 300, file:'300-wheel.png',  pct:14, top:'38%', left:'29%' },
  { score: 400, file:'400-tunnel.png', pct:18, top:'8%',  left:'18%' },
  { score: 500, file:'500-house.png',  pct:24, top:'4%',  left:'4%'  },
  { score: 600, file:'600-toy.png',    pct:14, top:'38%', left:'78%' },
  { score: 700, file:'700-tree.png',   pct:20, top:'3%',  left:'69%' },
  { score: 800, file:'800-car.png',    pct:20, top:'73%', left:'4%'  },
];

const THRESHOLDS = FURNITURE_CONFIG.map(f => f.score);

const DIALOGS = [
  'Zzz...', "I'm hungry!", 'So thirsty!',
  '數學真好玩！', '快來跟我一起答題！', '今天也要加油！', '你好厲害喔！',
];

const CORRECT_COMMENTS = [
  '✅ 答對了！太厲害！','🎯 正確！繼續衝！',
  '⚡ 閃電速度！','🌟 完美！','🔥 熱身中！','💪 答對加分！',
];

const MESSAGES = {
  basic: [
    '太棒了！倉鼠獲得了新家具，牠現在住得更舒服囉！',
    '哇！新家具到貨啦！倉鼠開心地在裡面跑來跑去！',
    '答題神準！倉鼠的家又升級了，看起來好溫馨！',
  ],
  advanced: [
    '你的數學直覺越來越強了！倉鼠的家變得超豪華！',
    '連續答對讓倉鼠家裝潢升上新等級，你是天才！',
    '數學小天才出現啦！倉鼠的豪宅正在成形中！',
  ],
  ultimate: [
    '任務達成！倉鼠的五星級豪華別墅正式開放，你就是最強的室內設計師！',
    '傳說級數學大師！倉鼠的夢幻莊園完工，全村倉鼠都羨慕！',
  ],
};

/* ════════════════════════════════════════════════════
   BOOT — wait for DOM
════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', init);

function init() {

  /* ── DOM refs ─────────────────────────────────── */
  var sceneLogin   = document.getElementById('scene-login');
  var sceneHome    = document.getElementById('scene-home');
  var sceneQuiz    = document.getElementById('scene-quiz');
  var inpName      = document.getElementById('inp-name');
  var inpPw        = document.getElementById('inp-pw');
  var btnLogin     = document.getElementById('btn-login');
  var loginErr     = document.getElementById('login-err');
  var hudName      = document.getElementById('hud-name');
  var hudScore     = document.getElementById('hud-score');
  var nextUnlock   = document.getElementById('next-unlock');
  var pbarFill     = document.getElementById('pbar-fill');
  var queueHome    = document.getElementById('queue-home');
  var cageScene    = document.getElementById('cage-scene');
  var furnLayer    = document.getElementById('furniture-layer');
  var hActor       = document.getElementById('hamster-actor');
  var hSprite      = document.getElementById('h-sprite');
  var hBubble      = document.getElementById('h-bubble');
  var finalOverlay = document.getElementById('final-overlay');
  var btnStart     = document.getElementById('btn-start');
  var quizScore    = document.getElementById('quiz-score');
  var reviewBadge  = document.getElementById('review-badge');
  var btnExit      = document.getElementById('btn-exit');
  var qzSprite     = document.getElementById('qz-sprite');
  var trFill       = document.getElementById('tr-fill');
  var tNum         = document.getElementById('t-num');
  var qText        = document.getElementById('q-text');
  var ansInput     = document.getElementById('ans-input');
  var btnSubmit    = document.getElementById('btn-submit');
  var feedback     = document.getElementById('feedback');
  var qCount       = document.getElementById('q-count');
  var cOverlay     = document.getElementById('congrats-overlay');
  var cFurniture   = document.getElementById('c-furniture');
  var cMessage     = document.getElementById('c-message');
  var cConfetti    = document.getElementById('c-confetti');
  var btnContinue  = document.getElementById('btn-continue');

  /* ── Verify critical elements exist ──────────── */
  var criticals = { sceneLogin, sceneHome, sceneQuiz, btnLogin, btnStart, btnExit, btnSubmit, ansInput };
  for (var key in criticals) {
    if (!criticals[key]) {
      console.error('Missing element:', key);
      return;
    }
  }
  console.log('✅ All DOM elements found, binding events...');

  /* ── State ────────────────────────────────────── */
  var state = {
    trainerName:    '',
    token:          '',
    totalCorrect:   0,
    unlockedScores: [],
    mistakeQueue:   [],
    pendingReviews: [],
    questionCount:  0,
    awaitingInput:  true,
  };

  var currentQ      = null;
  var timerInterval = null;
  var timeLeft      = TIMER_SEC;
  var dialogTimer   = null;
  var walkInterval  = null;

  /* ════════════════════════════════════════════════
     AUDIO
  ════════════════════════════════════════════════ */
  function playSound(type) {
    var files = { correct:'correct.mp3', wrong:'wrong.mp3',
                  unlock:'unlock.mp3', timer:'timer.mp3', final:'final.mp3' };
    if (!files[type]) return;
    try {
      var a = new Audio(AUDIO_BASE + files[type]);
      a.volume = type === 'timer' ? 0.5 : 0.8;
      a.play().catch(function(){});
    } catch(e) {}
  }

  /* ════════════════════════════════════════════════
     SCENE NAVIGATION
  ════════════════════════════════════════════════ */
  function showScene(name) {
    sceneLogin.classList.remove('active');
    sceneHome.classList.remove('active');
    sceneQuiz.classList.remove('active');
    if (name === 'login') sceneLogin.classList.add('active');
    if (name === 'home')  sceneHome.classList.add('active');
    if (name === 'quiz')  sceneQuiz.classList.add('active');
  }

  /* ════════════════════════════════════════════════
     API
  ════════════════════════════════════════════════ */
  async function apiLogin(name, pw) {
    var res = await fetch(API_LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trainerName: name, password: pw,
        gameId: GAME_ID,
        defaultData: { totalCorrect:0, unlockedScores:[], mistakeQueue:[] },
      }),
    });
    return res.json();
  }

  async function apiSave() {
    if (!state.token) return;
    try {
      await fetch(API_SAVE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainerName: state.trainerName,
          gameId:      GAME_ID,
          token:       state.token,
          gameData: {
            totalCorrect:   state.totalCorrect,
            unlockedScores: state.unlockedScores,
            mistakeQueue:   state.mistakeQueue,
          },
        }),
      });
    } catch(e) { console.warn('apiSave error:', e); }
  }

  /* ════════════════════════════════════════════════
     LOGIN
  ════════════════════════════════════════════════ */
  btnLogin.addEventListener('click', handleLogin);
  inpName.addEventListener('keydown', function(e){ if(e.key==='Enter') handleLogin(); });
  inpPw.addEventListener('keydown',   function(e){ if(e.key==='Enter') handleLogin(); });

  async function handleLogin() {
    var name = inpName.value.trim();
    var pw   = inpPw.value;
    loginErr.textContent = '';

    if (!name || !pw) { loginErr.textContent = '請輸入名字與密碼！'; return; }
    if (pw.length < 6) { loginErr.textContent = '密碼至少需要 6 個字！'; return; }

    btnLogin.disabled     = true;
    btnLogin.textContent  = '登入中…';

    try {
      var res = await apiLogin(name, pw);
      if (!res.success) {
        loginErr.textContent  = res.message || '登入失敗！';
        btnLogin.disabled     = false;
        btnLogin.textContent  = '出發！🚀';
        return;
      }
      state.trainerName    = name;
      state.token          = res.token;
      var d = res.data || {};
      state.totalCorrect   = d.totalCorrect   || 0;
      state.unlockedScores = d.unlockedScores || [];
      state.mistakeQueue   = d.mistakeQueue   || [];

      enterHome();
    } catch(err) {
      loginErr.textContent = '網路錯誤，請稍後再試。';
      btnLogin.disabled    = false;
      btnLogin.textContent = '出發！🚀';
    }
  }

  /* ════════════════════════════════════════════════
     HOME
  ════════════════════════════════════════════════ */
  function enterHome() {
    showScene('home');
    hudName.textContent = state.trainerName;
    refreshHomeHUD();
    renderFurniture();
    startHamsterAI();
    if (state.totalCorrect >= 800) {
      finalOverlay.classList.remove('hidden');
    }
  }

  function refreshHomeHUD() {
    hudScore.textContent  = state.totalCorrect;
    queueHome.textContent = state.mistakeQueue.length + state.pendingReviews.length;
    updateProgress();
  }

  function updateProgress() {
    var score = state.totalCorrect;
    var nextT = null;
    for (var i = 0; i < THRESHOLDS.length; i++) {
      if (score < THRESHOLDS[i]) { nextT = THRESHOLDS[i]; break; }
    }
    if (nextT === null) {
      nextUnlock.textContent = '全部解鎖！';
      pbarFill.style.width   = '100%';
      return;
    }
    var idx   = THRESHOLDS.indexOf(nextT);
    var prevT = idx === 0 ? 0 : THRESHOLDS[idx - 1];
    var pct   = ((score - prevT) / (nextT - prevT)) * 100;
    nextUnlock.textContent = nextT;
    pbarFill.style.width   = Math.min(pct, 100) + '%';
  }

  /* ─── Furniture ──────────────────────────────── */
  function renderFurniture() {
    /* Only add newly unlocked items — don't wipe and rebuild */
    var existing = new Set();
    var items = furnLayer.querySelectorAll('.furn-item');
    for (var i = 0; i < items.length; i++) {
      existing.add(Number(items[i].dataset.score));
    }

    for (var j = 0; j < FURNITURE_CONFIG.length; j++) {
      var cfg = FURNITURE_CONFIG[j];
      if (state.unlockedScores.indexOf(cfg.score) === -1) continue;
      if (existing.has(cfg.score)) continue;

      var wrap = document.createElement('div');
      wrap.className     = 'furn-item';
      wrap.dataset.score = cfg.score;
      wrap.style.top     = cfg.top;
      wrap.style.left    = cfg.left;
      wrap.style.width   = cfg.pct + '%';

      var img = document.createElement('img');
      img.src          = IMG_BASE + cfg.file;
      img.alt          = 'furniture';
      img.style.width  = '100%';
      img.style.height = 'auto';
      img.style.display = 'block';
      img.onerror = (function(w){ return function(){ w.style.display='none'; }; })(wrap);

      wrap.appendChild(img);
      furnLayer.appendChild(wrap);

      /* Trigger entrance animation */
      (function(w){
        requestAnimationFrame(function(){ w.classList.add('furn-visible'); });
      })(wrap);
    }
  }

  /* ─── Hamster AI ─────────────────────────────── */
  function startHamsterAI() {
    stopHamsterAI();
    moveHamster();
    walkInterval  = setInterval(moveHamster,  3500);
    dialogTimer   = setInterval(showDialog,   9000);
  }

  function stopHamsterAI() {
    clearInterval(walkInterval);
    clearInterval(dialogTimer);
    walkInterval = null;
    dialogTimer  = null;
  }

  function moveHamster() {
    var curLeft  = parseFloat(hActor.style.left)   || 10;
    var newLeft  = 5  + Math.random() * 70;
    var newBot   = 5  + Math.random() * 25;

    hActor.style.left   = newLeft + '%';
    hActor.style.bottom = newBot  + '%';
    hActor.classList.toggle('flip', newLeft < curLeft);
    hActor.classList.add('walking');
    setTimeout(function(){ hActor.classList.remove('walking'); }, 2400);
  }

  function showDialog() {
    var text = DIALOGS[Math.floor(Math.random() * DIALOGS.length)];
    hBubble.textContent = text;
    hBubble.classList.add('show');
    setTimeout(function(){ hBubble.classList.remove('show'); }, 3500);
  }

  /* ─── Start quiz ─────────────────────────────── */
  btnStart.addEventListener('click', function() {
    console.log('Start button clicked');
    enterQuiz();
  });

  /* ════════════════════════════════════════════════
     QUIZ
  ════════════════════════════════════════════════ */
  function enterQuiz() {
    stopHamsterAI();
    showScene('quiz');
    quizScore.textContent = state.totalCorrect;
    nextQuestion();
    ansInput.focus();
  }

  btnExit.addEventListener('click', function() {
    stopTimer();
    btnExit.disabled    = true;
    btnExit.textContent = '存檔中…';
    apiSave().then(function() {
      btnExit.disabled    = false;
      btnExit.textContent = '💾 退出存檔';
      enterHome();
    });
  });

  /* ─── Spaced Repetition ──────────────────────── */
  function processDueReviews() {
    var due = state.mistakeQueue.filter(function(q){ return q.dueAfter <= state.questionCount; });
    if (!due.length) return;
    state.mistakeQueue = state.mistakeQueue.filter(function(q){ return q.dueAfter > state.questionCount; });
    state.pendingReviews.push(due[0]);
    for (var i = 1; i < due.length; i++) {
      due[i].dueAfter = state.questionCount + i;
      state.mistakeQueue.push(due[i]);
    }
  }

  function addMistake(a, b, reset) {
    var idx = -1;
    for (var i = 0; i < state.mistakeQueue.length; i++) {
      if (state.mistakeQueue[i].a === a && state.mistakeQueue[i].b === b) { idx = i; break; }
    }
    if (idx !== -1 && !reset) return;
    if (idx !== -1) state.mistakeQueue.splice(idx, 1);
    for (var j = 0; j < REVIEW_AFTER.length; j++) {
      state.mistakeQueue.push({ a:a, b:b, dueAfter: state.questionCount + REVIEW_AFTER[j] });
    }
    qCount.textContent = state.mistakeQueue.length + state.pendingReviews.length;
  }

  function nextQuestion() {
    stopTimer();
    feedback.className   = 'feedback hidden';
    ansInput.value       = '';
    ansInput.className   = 'ans-input';
    state.awaitingInput  = true;

    state.questionCount++;
    processDueReviews();

    if (state.pendingReviews.length > 0) {
      var rev = state.pendingReviews.shift();
      currentQ = { a:rev.a, b:rev.b, answer:rev.a*rev.b, isReview:true };
      reviewBadge.classList.remove('hidden');
    } else {
      var a = Math.floor(Math.random()*9)+1;
      var b = Math.floor(Math.random()*9)+1;
      currentQ = { a:a, b:b, answer:a*b, isReview:false };
      reviewBadge.classList.add('hidden');
    }

    qText.textContent = currentQ.a + ' × ' + currentQ.b + ' = ?';
    qCount.textContent = state.mistakeQueue.length + state.pendingReviews.length;
    ansInput.focus();
    startTimer();
  }

  /* ─── Timer ──────────────────────────────────── */
  var CIRCUMFERENCE = 2 * Math.PI * 52;

  function startTimer() {
    timeLeft = TIMER_SEC;
    updateTimerUI(timeLeft);
    timerInterval = setInterval(function() {
      timeLeft--;
      updateTimerUI(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        handleTimeout();
      } else if (timeLeft <= 1) {
        playSound('timer');
      }
    }, 1000);
  }

  function stopTimer() { clearInterval(timerInterval); }

  function updateTimerUI(t) {
    tNum.textContent = t;
    var ratio = t / TIMER_SEC;
    trFill.style.strokeDashoffset = CIRCUMFERENCE * (1 - ratio);
    trFill.classList.remove('warn', 'danger');
    if (t <= 1)      trFill.classList.add('danger');
    else if (t <= 2) trFill.classList.add('warn');
  }

  function handleTimeout() {
    if (!state.awaitingInput) return;
    state.awaitingInput = false;
    playSound('wrong');
    animQuizHamster('sad');
    showFeedback(false, '⏰ 時間到！答案是 ' + currentQ.answer);
    addMistake(currentQ.a, currentQ.b, false);
    setTimeout(nextQuestion, 1700);
  }

  /* ─── Answer ─────────────────────────────────── */
  btnSubmit.addEventListener('click', submitAnswer);
  ansInput.addEventListener('keydown', function(e){ if(e.key==='Enter') submitAnswer(); });

  function submitAnswer() {
    if (!state.awaitingInput || !currentQ) return;
    var val = parseInt(ansInput.value, 10);
    if (isNaN(val)) return;
    state.awaitingInput = false;
    stopTimer();
    if (val === currentQ.answer) handleCorrect();
    else handleWrong();
  }

  function handleCorrect() {
    ansInput.classList.add('correct');
    playSound('correct');
    animQuizHamster('happy');
    state.totalCorrect++;
    quizScore.textContent = state.totalCorrect;
    showFeedback(true, CORRECT_COMMENTS[Math.floor(Math.random()*CORRECT_COMMENTS.length)]);
    checkUnlock();
    apiSave();
    setTimeout(nextQuestion, 950);
  }

  function handleWrong() {
    ansInput.classList.add('wrong');
    playSound('wrong');
    animQuizHamster('sad');
    showFeedback(false, '❌ 答案是 ' + currentQ.answer + '，再努力！');
    addMistake(currentQ.a, currentQ.b, currentQ.isReview);
    setTimeout(nextQuestion, 1700);
  }

  /* ─── Unlock ─────────────────────────────────── */
  function checkUnlock() {
    for (var i = 0; i < THRESHOLDS.length; i++) {
      var score = THRESHOLDS[i];
      if (state.totalCorrect >= score && state.unlockedScores.indexOf(score) === -1) {
        state.unlockedScores.push(score);
        renderFurniture();
        var tier = i >= THRESHOLDS.length - 2 ? 'ultimate'
                 : i >= THRESHOLDS.length / 2  ? 'advanced'
                 : 'basic';
        playSound(score >= 800 ? 'final' : 'unlock');
        showCongrats(score, tier);
        break;
      }
    }
    refreshHomeHUD();
  }

  function showCongrats(score, tier) {
    var cfg = null;
    for (var i = 0; i < FURNITURE_CONFIG.length; i++) {
      if (FURNITURE_CONFIG[i].score === score) { cfg = FURNITURE_CONFIG[i]; break; }
    }
    if (cfg) {
      cFurniture.innerHTML = '<img src="' + IMG_BASE + cfg.file + '" style="height:80px;object-fit:contain" onerror="this.style.display=\'none\'">';
    }
    var pool = MESSAGES[tier];
    cMessage.textContent = pool[Math.floor(Math.random() * pool.length)];
    launchConfetti();
    cOverlay.classList.remove('hidden');
  }

  btnContinue.addEventListener('click', function() {
    cOverlay.classList.add('hidden');
    ansInput.focus();
  });

  function launchConfetti() {
    cConfetti.innerHTML = '';
    var colors = ['#FF6B35','#FFD166','#06D6A0','#118AB2','#FF6BA8','#9B5DE5'];
    for (var i = 0; i < 44; i++) {
      var p = document.createElement('div');
      p.className = 'c-piece';
      p.style.cssText = [
        'left:' + (Math.random()*100) + '%',
        'background:' + colors[Math.floor(Math.random()*colors.length)],
        'width:'  + (6 + Math.random()*8) + 'px',
        'height:' + (6 + Math.random()*8) + 'px',
        'border-radius:' + (Math.random()>.5 ? '50%' : '3px'),
        'animation-duration:' + (.8+Math.random()*1.2) + 's',
        'animation-delay:' + (Math.random()*.5) + 's',
      ].join(';');
      cConfetti.appendChild(p);
    }
  }

  /* ─── Feedback & Animations ──────────────────── */
  function showFeedback(ok, text) {
    feedback.textContent = text;
    feedback.className   = 'feedback ' + (ok ? 'ok' : 'err');
  }

  function animQuizHamster(type) {
    qzSprite.classList.remove('happy', 'sad');
    void qzSprite.offsetWidth;
    qzSprite.classList.add(type);
    setTimeout(function(){ qzSprite.classList.remove(type); }, type==='happy' ? 1400 : 650);
  }

  /* ─── Beforeunload ───────────────────────────── */
  window.addEventListener('beforeunload', function(e) {
    if (state.token) {
      apiSave();
      e.preventDefault();
      e.returnValue = '';
    }
  });

  console.log('✅ App initialised');

} // end init()
