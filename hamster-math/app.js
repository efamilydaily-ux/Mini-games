/**
 * 🐹 倉鼠數學訓練營  app.js  v5
 * 修復：scene navigation、家具解鎖、家具圖鑑清單、倉鼠尺寸
 */

/* ════════════════════════════════════════════════
   CONSTANTS (no DOM — safe at parse time)
════════════════════════════════════════════════ */
var GAME_ID      = 'hamster-math';
var API_LOGIN    = '/api/auth-login';
var API_SAVE     = '/api/save-score';
var TIMER_SEC    = 3;
var REVIEW_AFTER = [5, 10, 20];
var IMG_BASE     = 'hamster-math/images/';
var AUDIO_BASE   = 'hamster-math/audio/';

/* Furniture config
   pct  = width as % of cage scene width (hamster is 20%, so pct:20 = same size as hamster)
   top/left = position as % inside cage scene                                                */
var FURNITURE_CONFIG = [
  { score:  20, name:'飲水器', file:'20-water.jpg',   pct:24,  top:'5%',  left:'74%' },
  { score:  50, name:'食物碗', file:'50-food.png',    pct:20,  top:'72%', left:'38%' },
  { score: 100, name:'木頭塊', file:'100-wood.png',   pct:16,  top:'68%', left:'16%' },
  { score: 150, name:'小床',   file:'150-bed.png',    pct:32,  top:'52%', left:'44%' },
  { score: 200, name:'浴盆',   file:'200-bath.png',   pct:36,  top:'44%', left:'55%' },
  { score: 250, name:'椅子',   file:'250-chair.png',  pct:24,  top:'44%', left:'68%' },
  { score: 300, name:'滾輪',   file:'300-wheel.png',  pct:36,  top:'32%', left:'26%' },
  { score: 400, name:'隧道',   file:'400-tunnel.png', pct:44,  top:'6%',  left:'15%' },
  { score: 500, name:'小屋',   file:'500-house.png',  pct:56,  top:'2%',  left:'2%'  },
  { score: 600, name:'玩具',   file:'600-toy.png',    pct:36,  top:'32%', left:'72%' },
  { score: 700, name:'大樹',   file:'700-tree.png',   pct:48,  top:'1%',  left:'60%' },
  { score: 800, name:'小車',   file:'800-car.png',    pct:44,  top:'68%', left:'2%'  },
];

var THRESHOLDS = FURNITURE_CONFIG.map(function(f){ return f.score; });

var DIALOGS = [
  'Zzz...', "I'm hungry!", 'So thirsty!',
  '數學真好玩！', '快來跟我一起答題！', '今天也要加油！', '你好厲害喔！',
];

var CORRECT_COMMENTS = [
  '✅ 答對了！太厲害！', '🎯 正確！繼續衝！',
  '⚡ 閃電速度！', '🌟 完美！', '🔥 熱身中！', '💪 答對加分！',
];

var MESSAGES = {
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

/* ════════════════════════════════════════════════
   BOOT
════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {

  /* ── DOM refs ── */
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
  var furnLayer    = document.getElementById('furniture-layer');
  var furnList     = document.getElementById('furn-list');
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

  /* ── Log any missing elements but DO NOT abort ── */
  var allRefs = {
    sceneLogin:sceneLogin, sceneHome:sceneHome, sceneQuiz:sceneQuiz,
    inpName:inpName, inpPw:inpPw, btnLogin:btnLogin, btnStart:btnStart,
    btnExit:btnExit, btnSubmit:btnSubmit, ansInput:ansInput,
    furnLayer:furnLayer, furnList:furnList, hActor:hActor,
    trFill:trFill, tNum:tNum, qText:qText, feedback:feedback
  };
  var missing = [];
  for (var k in allRefs) { if (!allRefs[k]) missing.push(k); }
  if (missing.length) {
    console.error('⚠️ Missing DOM elements:', missing.join(', '));
    /* Only abort if truly critical rendering elements are gone */
    if (!sceneLogin || !sceneHome || !sceneQuiz || !btnLogin) {
      console.error('Fatal: core scene elements missing, aborting.');
      return;
    }
  }
  console.log('✅ DOM ready, initialising game...');

  /* ── State ── */
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
  var CIRCUMFERENCE = 2 * Math.PI * 52;  // r=52 on SVG ring

  /* ════════════════════════════════════════════════
     AUDIO
  ════════════════════════════════════════════════ */
  function playSound(type) {
    var map = { correct:'correct.mp3', wrong:'wrong.mp3',
                unlock:'unlock.mp3', timer:'timer.mp3', final:'final.mp3' };
    if (!map[type]) return;
    try {
      var a = new Audio(AUDIO_BASE + map[type]);
      a.volume = (type === 'timer') ? 0.5 : 0.8;
      a.play().catch(function(){});
    } catch(e) { /* ignore missing audio */ }
  }

  /* ════════════════════════════════════════════════
     SCENE NAVIGATION
     — explicitly toggle each scene; no dynamic $() call
  ════════════════════════════════════════════════ */
  function showScene(name) {
    sceneLogin.classList.remove('active');
    sceneHome.classList.remove('active');
    sceneQuiz.classList.remove('active');
    if (name === 'login') sceneLogin.classList.add('active');
    else if (name === 'home')  sceneHome.classList.add('active');
    else if (name === 'quiz')  sceneQuiz.classList.add('active');
    console.log('Scene →', name);
  }

  /* ════════════════════════════════════════════════
     API
  ════════════════════════════════════════════════ */
  function apiLogin(name, pw) {
    return fetch(API_LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trainerName: name, password: pw, gameId: GAME_ID,
        defaultData: { totalCorrect:0, unlockedScores:[], mistakeQueue:[] },
      }),
    }).then(function(r){ return r.json(); });
  }

  function apiSave() {
    if (!state.token) return Promise.resolve();
    return fetch(API_SAVE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trainerName: state.trainerName, gameId: GAME_ID, token: state.token,
        gameData: {
          totalCorrect:   state.totalCorrect,
          unlockedScores: state.unlockedScores,
          mistakeQueue:   state.mistakeQueue,
        },
      }),
    }).catch(function(e){ console.warn('apiSave error:', e); });
  }

  /* ════════════════════════════════════════════════
     LOGIN
  ════════════════════════════════════════════════ */
  btnLogin.addEventListener('click', handleLogin);
  inpName.addEventListener('keydown', function(e){ if(e.key==='Enter') handleLogin(); });
  inpPw.addEventListener('keydown',   function(e){ if(e.key==='Enter') handleLogin(); });

  function handleLogin() {
    var name = inpName.value.trim();
    var pw   = inpPw.value;
    loginErr.textContent = '';
    if (!name || !pw)  { loginErr.textContent = '請輸入名字與密碼！'; return; }
    if (pw.length < 6) { loginErr.textContent = '密碼至少需要 6 個字！'; return; }
    btnLogin.disabled    = true;
    btnLogin.textContent = '登入中…';

    apiLogin(name, pw).then(function(res) {
      if (!res.success) {
        loginErr.textContent = res.message || '登入失敗！';
        btnLogin.disabled    = false;
        btnLogin.textContent = '出發！🚀';
        return;
      }
      state.trainerName    = name;
      state.token          = res.token;
      var d = res.data || {};
      state.totalCorrect   = Number(d.totalCorrect)   || 0;
      state.unlockedScores = d.unlockedScores || [];
      state.mistakeQueue   = d.mistakeQueue   || [];
      console.log('Login OK, score=', state.totalCorrect, 'unlocked=', state.unlockedScores);
      enterHome();
    }).catch(function(err) {
      console.error('Login error:', err);
      loginErr.textContent = '網路錯誤，請稍後再試。';
      btnLogin.disabled    = false;
      btnLogin.textContent = '出發！🚀';
    });
  }

  /* ════════════════════════════════════════════════
     HOME
  ════════════════════════════════════════════════ */
  function enterHome() {
    showScene('home');
    hudName.textContent = state.trainerName;
    refreshHomeHUD();
    renderFurnitureLayer();   // cage scene overlays
    renderFurnitureList();    // side panel checklist
    startHamsterAI();
    if (state.totalCorrect >= 800 && finalOverlay) {
      finalOverlay.classList.remove('hidden');
    }
  }

  function refreshHomeHUD() {
    if (hudScore)   hudScore.textContent  = state.totalCorrect;
    if (queueHome)  queueHome.textContent = state.mistakeQueue.length + state.pendingReviews.length;
    updateProgress();
  }

  function updateProgress() {
    var score = state.totalCorrect;
    var nextT = null;
    for (var i = 0; i < THRESHOLDS.length; i++) {
      if (score < THRESHOLDS[i]) { nextT = THRESHOLDS[i]; break; }
    }
    if (nextT === null) {
      if (nextUnlock) nextUnlock.textContent = '全部解鎖！';
      if (pbarFill)   pbarFill.style.width   = '100%';
      return;
    }
    var idx   = THRESHOLDS.indexOf(nextT);
    var prevT = idx === 0 ? 0 : THRESHOLDS[idx - 1];
    var pct   = ((score - prevT) / (nextT - prevT)) * 100;
    if (nextUnlock) nextUnlock.textContent = nextT;
    if (pbarFill)   pbarFill.style.width   = Math.min(pct, 100) + '%';
  }

  /* ─── Furniture layer (cage overlays) ─── */
  function renderFurnitureLayer() {
    if (!furnLayer) return;
    /* Track existing to avoid duplicates */
    var existing = {};
    var items = furnLayer.querySelectorAll('.furn-item');
    for (var i = 0; i < items.length; i++) {
      existing[items[i].dataset.score] = true;
    }
    for (var j = 0; j < FURNITURE_CONFIG.length; j++) {
      var cfg = FURNITURE_CONFIG[j];
      if (state.unlockedScores.indexOf(cfg.score) === -1) continue;
      if (existing[cfg.score]) continue;

      var wrap = document.createElement('div');
      wrap.className     = 'furn-item';
      wrap.dataset.score = cfg.score;
      wrap.style.top     = cfg.top;
      wrap.style.left    = cfg.left;
      wrap.style.width   = cfg.pct + '%';

      var img = document.createElement('img');
      img.src           = IMG_BASE + cfg.file;
      img.alt           = cfg.name;
      img.style.width   = '100%';
      img.style.height  = 'auto';
      img.style.display = 'block';
      (function(w){ img.onerror = function(){ w.style.display='none'; }; })(wrap);

      wrap.appendChild(img);
      furnLayer.appendChild(wrap);

      /* Entrance animation */
      (function(w){
        requestAnimationFrame(function(){
          requestAnimationFrame(function(){ w.classList.add('furn-visible'); });
        });
      })(wrap);
    }
  }

  /* ─── Furniture list (side panel — shows ALL items) ─── */
  function renderFurnitureList() {
    if (!furnList) return;
    furnList.innerHTML = '';
    for (var i = 0; i < FURNITURE_CONFIG.length; i++) {
      var cfg      = FURNITURE_CONFIG[i];
      var isUnlocked = state.unlockedScores.indexOf(cfg.score) !== -1;

      var row = document.createElement('div');
      row.className = 'furn-row ' + (isUnlocked ? 'unlocked' : 'locked');

      /* Icon */
      var icon = document.createElement('img');
      icon.className = 'furn-row-icon';
      icon.src       = IMG_BASE + cfg.file;
      icon.alt       = cfg.name;
      icon.onerror   = function(){ this.style.display='none'; };

      /* Info */
      var info = document.createElement('div');
      info.className = 'furn-row-info';

      var nameEl = document.createElement('div');
      nameEl.className   = 'furn-row-name';
      nameEl.textContent = cfg.name;

      var scoreEl = document.createElement('div');
      scoreEl.className   = 'furn-row-score';
      scoreEl.textContent = isUnlocked ? '✅ 已解鎖' : '🔒 需 ' + cfg.score + ' 題';

      info.appendChild(nameEl);
      info.appendChild(scoreEl);

      row.appendChild(icon);
      row.appendChild(info);

      furnList.appendChild(row);
    }
  }

  /* ─── Hamster AI ─── */
  function startHamsterAI() {
    stopHamsterAI();
    moveHamster();
    walkInterval = setInterval(moveHamster, 3500);
    dialogTimer  = setInterval(showDialog, 9000);
  }
  function stopHamsterAI() {
    clearInterval(walkInterval);
    clearInterval(dialogTimer);
    walkInterval = null;
    dialogTimer  = null;
  }
  function moveHamster() {
    if (!hActor) return;
    var curLeft = parseFloat(hActor.style.left) || 10;
    /* Keep hamster within visible area — max left = 75% because hamster is 20% wide */
    var newLeft = 5 + Math.random() * 70;
    var newBot  = 5 + Math.random() * 25;
    hActor.style.left   = newLeft + '%';
    hActor.style.bottom = newBot  + '%';
    hActor.classList.toggle('flip', newLeft < curLeft);
    hActor.classList.add('walking');
    setTimeout(function(){ hActor.classList.remove('walking'); }, 2400);
  }
  function showDialog() {
    if (!hBubble) return;
    hBubble.textContent = DIALOGS[Math.floor(Math.random() * DIALOGS.length)];
    hBubble.classList.add('show');
    setTimeout(function(){ hBubble.classList.remove('show'); }, 3500);
  }

  /* ─── Start quiz button ─── */
  if (btnStart) {
    btnStart.addEventListener('click', function() {
      console.log('▶ Start quiz clicked');
      enterQuiz();
    });
  }

  /* ════════════════════════════════════════════════
     QUIZ
  ════════════════════════════════════════════════ */
  function enterQuiz() {
    stopHamsterAI();
    showScene('quiz');
    if (quizScore) quizScore.textContent = state.totalCorrect;
    nextQuestion();
    if (ansInput) ansInput.focus();
  }

  if (btnExit) {
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
  }

  /* ─── Spaced Repetition ─── */
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
    if (qCount) qCount.textContent = state.mistakeQueue.length + state.pendingReviews.length;
  }

  function nextQuestion() {
    stopTimer();
    if (feedback)  { feedback.className = 'feedback hidden'; }
    if (ansInput)  { ansInput.value = ''; ansInput.className = 'ans-input'; }
    state.awaitingInput = true;

    state.questionCount++;
    processDueReviews();

    if (state.pendingReviews.length > 0) {
      var rev = state.pendingReviews.shift();
      currentQ = { a:rev.a, b:rev.b, answer:rev.a*rev.b, isReview:true };
      if (reviewBadge) reviewBadge.classList.remove('hidden');
    } else {
      var a = Math.floor(Math.random()*9)+1;
      var b = Math.floor(Math.random()*9)+1;
      currentQ = { a:a, b:b, answer:a*b, isReview:false };
      if (reviewBadge) reviewBadge.classList.add('hidden');
    }

    if (qText)  qText.textContent  = currentQ.a + ' × ' + currentQ.b + ' = ?';
    if (qCount) qCount.textContent = state.mistakeQueue.length + state.pendingReviews.length;
    if (ansInput) ansInput.focus();
    startTimer();
  }

  /* ─── Timer ─── */
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
    if (tNum)   tNum.textContent = t;
    if (trFill) {
      trFill.style.strokeDashoffset = CIRCUMFERENCE * (1 - t / TIMER_SEC);
      trFill.classList.remove('warn','danger');
      if (t <= 1)      trFill.classList.add('danger');
      else if (t <= 2) trFill.classList.add('warn');
    }
  }
  function handleTimeout() {
    if (!state.awaitingInput) return;
    state.awaitingInput = false;
    playSound('wrong');
    animQuizHamster('sad');
    showFeedback(false, '⏰ 時間到！答案是 ' + (currentQ ? currentQ.answer : '?'));
    if (currentQ) addMistake(currentQ.a, currentQ.b, false);
    setTimeout(nextQuestion, 1700);
  }

  /* ─── Answer ─── */
  if (btnSubmit) btnSubmit.addEventListener('click', submitAnswer);
  if (ansInput)  ansInput.addEventListener('keydown', function(e){ if(e.key==='Enter') submitAnswer(); });

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
    if (ansInput) ansInput.classList.add('correct');
    playSound('correct');
    animQuizHamster('happy');
    state.totalCorrect++;
    if (quizScore) quizScore.textContent = state.totalCorrect;
    showFeedback(true, CORRECT_COMMENTS[Math.floor(Math.random()*CORRECT_COMMENTS.length)]);
    checkUnlock();
    apiSave();
    setTimeout(nextQuestion, 950);
  }
  function handleWrong() {
    if (ansInput) ansInput.classList.add('wrong');
    playSound('wrong');
    animQuizHamster('sad');
    showFeedback(false, '❌ 答案是 ' + currentQ.answer + '，再努力！');
    addMistake(currentQ.a, currentQ.b, currentQ.isReview);
    setTimeout(nextQuestion, 1700);
  }

  /* ─── Unlock check ─── */
  function checkUnlock() {
    console.log('checkUnlock: score=', state.totalCorrect, 'unlocked=', state.unlockedScores);
    for (var i = 0; i < THRESHOLDS.length; i++) {
      var score = THRESHOLDS[i];
      if (state.totalCorrect >= score && state.unlockedScores.indexOf(score) === -1) {
        state.unlockedScores.push(score);
        console.log('🔓 Unlocked score:', score);
        /* Update cage layer immediately (even though quiz is visible, layer is ready) */
        renderFurnitureLayer();
        /* Update side checklist too */
        renderFurnitureList();
        var tier = i >= THRESHOLDS.length - 2 ? 'ultimate'
                 : i >= Math.floor(THRESHOLDS.length / 2) ? 'advanced'
                 : 'basic';
        playSound(score >= 800 ? 'final' : 'unlock');
        showCongrats(score, tier);
        break; /* one unlock per correct answer */
      }
    }
    refreshHomeHUD();
  }

  /* ─── Congrats overlay ─── */
  function showCongrats(score, tier) {
    var cfg = null;
    for (var i = 0; i < FURNITURE_CONFIG.length; i++) {
      if (FURNITURE_CONFIG[i].score === score) { cfg = FURNITURE_CONFIG[i]; break; }
    }
    if (cFurniture) {
      cFurniture.innerHTML = cfg
        ? '<img src="' + IMG_BASE + cfg.file + '" onerror="this.style.display=\'none\'">'
        : '⭐';
    }
    if (cMessage) {
      var pool = MESSAGES[tier] || MESSAGES.basic;
      cMessage.textContent = pool[Math.floor(Math.random() * pool.length)];
    }
    launchConfetti();
    if (cOverlay) cOverlay.classList.remove('hidden');
  }

  if (btnContinue) {
    btnContinue.addEventListener('click', function() {
      if (cOverlay) cOverlay.classList.add('hidden');
      if (ansInput) ansInput.focus();
    });
  }

  function launchConfetti() {
    if (!cConfetti) return;
    cConfetti.innerHTML = '';
    var colors = ['#FF6B35','#FFD166','#06D6A0','#118AB2','#FF6BA8','#9B5DE5'];
    for (var i = 0; i < 44; i++) {
      var p = document.createElement('div');
      p.className = 'c-piece';
      p.style.cssText = [
        'left:'+(Math.random()*100)+'%',
        'background:'+colors[Math.floor(Math.random()*colors.length)],
        'width:'+(6+Math.random()*8)+'px',
        'height:'+(6+Math.random()*8)+'px',
        'border-radius:'+(Math.random()>.5?'50%':'3px'),
        'animation-duration:'+(.8+Math.random()*1.2)+'s',
        'animation-delay:'+(Math.random()*.5)+'s',
      ].join(';');
      cConfetti.appendChild(p);
    }
  }

  /* ─── Helpers ─── */
  function showFeedback(ok, text) {
    if (!feedback) return;
    feedback.textContent = text;
    feedback.className   = 'feedback ' + (ok ? 'ok' : 'err');
  }
  function animQuizHamster(type) {
    if (!qzSprite) return;
    qzSprite.classList.remove('happy','sad');
    void qzSprite.offsetWidth;
    qzSprite.classList.add(type);
    setTimeout(function(){ qzSprite.classList.remove(type); }, type==='happy' ? 1400 : 650);
  }

  /* ─── Beforeunload ─── */
  window.addEventListener('beforeunload', function(e) {
    if (state.token) { apiSave(); e.preventDefault(); e.returnValue = ''; }
  });

  console.log('✅ Game ready');
});
