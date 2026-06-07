/**
 * 🐹 倉鼠數學訓練營 - 完整功能版
 * 修改項目：
 * 1. 登入後引導至全新的 Menu 選單畫面（只出現開始答題和查看小倉鼠的家）。
 * 2. 路由與按鈕重新編排，點擊開始答題進入遊戲，點擊查看小倉鼠的家進入小屋與圖鑑。
 * 3. 完整保留錯題複習機制 (5/10/20 題間隔) 以及倒數計時。
 */
document.addEventListener('DOMContentLoaded', function() {

  /* ════════════════════════════════════════════════
     CONSTANTS & CONFIG
  ════════════════════════════════════════════════ */
  var GAME_ID      = 'hamster-math';
  var API_LOGIN    = '/api/auth-login';
  var API_SAVE     = '/api/save-score';
  var TIMER_SEC    = 3;
  var REVIEW_AFTER = [5, 10, 20];
  var IMG_BASE     = 'hamster-math/images/';
  var AUDIO_BASE   = 'hamster-math/audio/';

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
  var THRESHOLDS = FURNITURE_CONFIG.map(function(f) { return f.score; });

  var DIALOGS = ['Zzz...', "I'm hungry!", '數學真好玩！', '快來跟我一起答題！', '今天也要加油！'];
  var CORRECT_COMMENTS = ['✅ 答對了！太厲害！', '🎯 正確！繼續衝！', '🌟 完美！'];
  var MESSAGES = {
    basic: ['太棒了！倉鼠獲得了新家具！', '哇！新家具到貨啦！'],
    advanced: ['你的數學直覺越來越強了！倉鼠的家變超豪華！'],
    ultimate: ['任務達成！最強室內設計師！']
  };

  /* ════════════════════════════════════════════════
     STATE VARIABLES
  ════════════════════════════════════════════════ */
  var state = {
    trainerName: '',
    token: '',
    totalCorrect: 0,
    unlockedScores: [],
    mistakeQueue: [],     // 未來計數點複習：{a, b, dueAfter}
    pendingReviews: [],   // 目前立刻要考的複習題
    questionCount: 0,
    awaitingInput: true
  };

  var currentQ = null;
  var timerInterval = null;
  var timeLeft = TIMER_SEC;
  var walkInterval = null;
  var dialogTimer = null;
  var CIRCUMFERENCE = 2 * Math.PI * 52;

  /* ════════════════════════════════════════════════
     DOM NODES
  ════════════════════════════════════════════════ */
  var sceneLogin      = document.getElementById('scene-login');
  var sceneMenu       = document.getElementById('scene-menu');
  var sceneHome       = document.getElementById('scene-home');
  var sceneQuiz       = document.getElementById('scene-quiz');

  // 按鈕組
  var btnLogin        = document.getElementById('btn-login');
  var btnMenuQuiz     = document.getElementById('btn-menu-quiz');
  var btnMenuHome     = document.getElementById('btn-menu-home');
  var btnHomeBack     = document.getElementById('btn-home-back');
  var btnHomeQuiz     = document.getElementById('btn-home-quiz');
  var btnQuizBack     = document.getElementById('btn-quiz-back');
  var btnSubmit       = document.getElementById('btn-submit');
  var btnContinue     = document.getElementById('btn-continue');

  // 輸入與數值呈現組
  var inpName         = document.getElementById('inp-name');
  var inpPw           = document.getElementById('inp-pw');
  var loginErr        = document.getElementById('login-err');
  var menuTitle       = document.getElementById('menu-title');
  var hudName         = document.getElementById('hud-name');
  var hudScore        = document.getElementById('hud-score');
  var nextUnlock      = document.getElementById('next-unlock');
  var pbarFill        = document.getElementById('pbar-fill');
  var queueHome       = document.getElementById('queue-home');
  var furnLayer       = document.getElementById('furniture-layer');
  var furnList        = document.getElementById('furn-list');
  var hActor          = document.getElementById('hamster-actor');
  var hSprite         = document.getElementById('h-sprite');
  var hBubble         = document.getElementById('h-bubble');
  var finalOverlay    = document.getElementById('final-overlay');

  var quizScore       = document.getElementById('quiz-score');
  var reviewBadge     = document.getElementById('review-badge');
  var qText           = document.getElementById('q-text');
  var ansInput        = document.getElementById('ans-input');
  var trFill          = document.getElementById('tr-fill');
  var tNum            = document.getElementById('t-num');
  var feedback        = document.getElementById('feedback');
  var qCount          = document.getElementById('q-count');
  var qzSprite        = document.getElementById('qz-sprite');
  var cOverlay        = document.getElementById('congrats-overlay');
  var cConfetti       = document.getElementById('c-confetti');

  /* ════════════════════════════════════════════════
     SCENE RUNTIME NAVIGATION
  ════════════════════════════════════════════════ */
  function showScene(sceneName) {
    if (sceneLogin) sceneLogin.classList.remove('active');
    if (sceneMenu)  sceneMenu.classList.remove('active');
    if (sceneHome)  sceneHome.classList.remove('active');
    if (sceneQuiz)  sceneQuiz.classList.remove('active');

    var target = document.getElementById('scene-' + sceneName);
    if (target) target.classList.add('active');
  }

  // 進入選單畫面 (登入後、或按返回時的唯一集散地)
  function enterMenu() {
    stopHamsterAI();
    stopTimer();
    showScene('menu');
    if (menuTitle) {
      menuTitle.textContent = state.trainerName + '，歡迎回來！';
    }
  }

  // 點擊「查看小倉鼠的家」
  function enterHome() {
    stopTimer();
    showScene('home');
    if (hudName) hudName.textContent = state.trainerName;
    refreshHomeHUD();
    renderFurnitureLayer();
    renderFurnitureList();
    startHamsterAI();
  }

  // 點擊「開始答題」
  function enterQuiz() {
    stopHamsterAI();
    showScene('quiz');
    if (quizScore) quizScore.textContent = state.totalCorrect;
    nextQuestion();
    if (ansInput) ansInput.focus();
  }

  /* ════════════════════════════════════════════════
     AUTHENTICATION & STORAGE API
  ════════════════════════════════════════════════ */
  function handleLogin() {
    if (!inpName || !inpPw || !loginErr || !btnLogin) return;
    var name = inpName.value.trim();
    var pw = inpPw.value;

    if (!name || !pw) {
      loginErr.textContent = '請輸入名稱與密碼！';
      return;
    }
    if (pw.length < 6) {
      loginErr.textContent = '密碼長度至少需要 6 位數！';
      return;
    }

    loginErr.textContent = '';
    btnLogin.disabled = true;
    btnLogin.textContent = '認證中...';

    // 模擬網絡 API 登入要求
    fetch(API_LOGIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trainerName: name, password: pw, gameId: GAME_ID })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      btnLogin.disabled = false;
      btnLogin.textContent = '登入 🚀';
      
      state.trainerName = name;
      state.token = data.token || 'mock-token-xyz';

      if (data.gameData) {
        state.totalCorrect   = data.gameData.totalCorrect || 0;
        state.unlockedScores = data.gameData.unlockedScores || [];
        state.mistakeQueue   = data.gameData.mistakeQueue || [];
      } else {
        // 全新帳戶初始化
        state.totalCorrect   = 0;
        state.unlockedScores = [];
        state.mistakeQueue   = [];
      }
      state.pendingReviews = [];
      state.questionCount  = 0;

      enterMenu(); // 登入完成引導至主選單
    })
    .catch(function(err) {
      // 離線本地模擬兜底機制
      console.warn('API Offline, running in guest mode.');
      btnLogin.disabled = false;
      btnLogin.textContent = '登入 🚀';
      
      state.trainerName = name;
      state.token = 'guest-token';
      state.totalCorrect = 0;
      state.unlockedScores = [];
      state.mistakeQueue = [];
      state.pendingReviews = [];
      state.questionCount = 0;

      enterMenu();
    });
  }

  function apiSave() {
    if (!state.token) return Promise.resolve();
    return fetch(API_SAVE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trainerName: state.trainerName,
        token: state.token,
        gameData: {
          totalCorrect: state.totalCorrect,
          unlockedScores: state.unlockedScores,
          mistakeQueue: state.mistakeQueue
        }
      })
    })
    .then(function(r) { return r.json(); })
    .catch(function(e) { console.warn('Save score network failed.', e); });
  }

  /* ════════════════════════════════════════════════
     BUTTON BINDINGS
  ════════════════════════════════════════════════ */
  if (btnLogin) {
    btnLogin.addEventListener('click', handleLogin);
  }
  if (inpPw) {
    inpPw.addEventListener('keydown', function(e) { if (e.key === 'Enter') handleLogin(); });
  }

  // 選單按鈕
  if (btnMenuQuiz) btnMenuQuiz.addEventListener('click', enterQuiz);
  if (btnMenuHome) btnMenuHome.addEventListener('click', enterHome);

  // 家景按鈕
  if (btnHomeBack) btnHomeBack.addEventListener('click', enterMenu);
  if (btnHomeQuiz) btnHomeQuiz.addEventListener('click', enterQuiz);

  // 答題退出按鈕
  if (btnQuizBack) {
    btnQuizBack.addEventListener('click', function() {
      btnQuizBack.disabled = true;
      btnQuizBack.textContent = '同步存檔中...';
      apiSave().then(function() {
        btnQuizBack.disabled = false;
        btnQuizBack.textContent = '💾 存檔並返回';
        enterMenu();
      });
    });
  }

  /* ════════════════════════════════════════════════
     HAMSTER HOME (CAGE VIEW & CHECKLIST)
  ════════════════════════════════════════════════ */
  function refreshHomeHUD() {
    if (hudScore) hudScore.textContent = state.totalCorrect;
    if (queueHome) {
      queueHome.textContent = state.mistakeQueue.length + state.pendingReviews.length;
    }

    var nextT = null;
    for (var i = 0; i < THRESHOLDS.length; i++) {
      if (state.totalCorrect < THRESHOLDS[i]) {
        nextT = THRESHOLDS[i];
        break;
      }
    }

    if (nextT === null) {
      if (nextUnlock) nextUnlock.textContent = '全套解鎖！';
      if (pbarFill) pbarFill.style.width = '100%';
      if (finalOverlay) finalOverlay.classList.remove('hidden');
    } else {
      if (nextUnlock) nextUnlock.textContent = nextT;
      if (finalOverlay) finalOverlay.classList.add('hidden');
      
      var idx = THRESHOLDS.indexOf(nextT);
      var prevT = (idx === 0) ? 0 : THRESHOLDS[idx - 1];
      var range = nextT - prevT;
      var currentProgress = state.totalCorrect - prevT;
      var pct = (currentProgress / range) * 100;
      if (pbarFill) pbarFill.style.width = Math.min(Math.max(pct, 0), 100) + '%';
    }
  }

  function renderFurnitureLayer() {
    if (!furnLayer) return;
    var presentItems = {};
    var domItems = furnLayer.querySelectorAll('.furn-item');
    Array.from(domItems).forEach(function(el) {
      presentItems[el.dataset.score] = true;
    });

    FURNITURE_CONFIG.forEach(function(cfg) {
      var unlocked = state.unlockedScores.indexOf(cfg.score) !== -1;
      if (!unlocked) return;
      if (presentItems[cfg.score]) return;

      var node = document.createElement('div');
      node.className = 'furn-item furn-visible';
      node.dataset.score = cfg.score;
      node.style.top = cfg.top;
      node.style.left = cfg.left;
      node.style.width = cfg.pct + '%';

      var img = document.createElement('img');
      img.src = IMG_BASE + cfg.file;
      img.alt = cfg.name;
      img.style.width = '100%';

      node.appendChild(img);
      furnLayer.appendChild(node);
    });
  }

  function renderFurnitureList() {
    if (!furnList) return;
    furnList.innerHTML = '';

    FURNITURE_CONFIG.forEach(function(cfg) {
      var isUnlocked = state.unlockedScores.indexOf(cfg.score) !== -1;
      var row = document.createElement('div');
      row.className = 'furn-row ' + (isUnlocked ? 'unlocked' : 'locked');

      row.innerHTML = [
        '<img class="furn-row-icon" src="' + IMG_BASE + cfg.file + '" onerror="this.style.display=\'none\'">',
        '<div class="furn-row-info">',
          '<div class="furn-row-name">' + cfg.name + '</div>',
          '<div class="furn-row-score">' + (isUnlocked ? '✅ 已放置到家中' : '🔒 解鎖條件：' + cfg.score + ' 題') + '</div>',
        '</div>'
      ].join('');

      furnList.appendChild(row);
    });
  }

  function startHamsterAI() {
    stopHamsterAI();
    function walkRandomly() {
      if (!hActor) return;
      var randomLeft = 5 + Math.random() * 70;
      var randomBot = 5 + Math.random() * 25;
      
      var currentLeft = parseFloat(hActor.style.left || '10');
      if (randomLeft < currentLeft) {
        hActor.classList.add('flip');
      } else {
        hActor.classList.remove('flip');
      }

      hActor.style.left = randomLeft + '%';
      hActor.style.bottom = randomBot + '%';
      hActor.classList.add('walking');

      setTimeout(function() {
        hActor.classList.remove('walking');
      }, 2400);
    }

    walkRandomly();
    walkInterval = setInterval(walkRandomly, 4000);

    dialogTimer = setInterval(function() {
      if (!hBubble) return;
      hBubble.textContent = DIALOGS[Math.floor(Math.random() * DIALOGS.length)];
      hBubble.classList.add('show');
      setTimeout(function() { hBubble.classList.remove('show'); }, 3500);
    }, 10000);
  }

  function stopHamsterAI() {
    if (walkInterval) clearInterval(walkInterval);
    if (dialogTimer) clearInterval(dialogTimer);
  }

  /* ════════════════════════════════════════════════
     QUIZ ENGINE & EXTRA 5/10/20 INTERVAL REVIEW SYSTEM
  ════════════════════════════════════════════════ */
  function extractDueReviews() {
    var ready = state.mistakeQueue.filter(function(q) {
      return q.dueAfter <= state.questionCount;
    });
    if (ready.length === 0) return;

    // 清洗移出隊列
    state.mistakeQueue = state.mistakeQueue.filter(function(q) {
      return q.dueAfter > state.questionCount;
    });

    // 推入第一道準備複習題
    state.pendingReviews.push(ready[0]);

    // 若同時有多道題重疊，進行微推延以防重疊爆發
    for (var i = 1; i < ready.length; i++) {
      ready[i].dueAfter = state.questionCount + i;
      state.mistakeQueue.push(ready[i]);
    }
  }

  function enqueueMistake(numA, numB, isReviewTask) {
    if (isReviewTask) return; // 複習本身答錯不重疊增加複習深度

    // 清理舊的重複考題
    state.mistakeQueue = state.mistakeQueue.filter(function(q) {
      return !(q.a === numA && q.b === numB);
    });

    // 依據 5, 10, 20 題間距配置三次派發
    REVIEW_AFTER.forEach(function(gap) {
      state.mistakeQueue.push({
        a: numA,
        b: numB,
        dueAfter: state.questionCount + gap
      });
    });

    if (qCount) qCount.textContent = state.mistakeQueue.length + state.pendingReviews.length;
  }

  function nextQuestion() {
    stopTimer();
    if (feedback) feedback.className = 'hidden';
    if (ansInput) {
      ansInput.value = '';
      ansInput.className = 'ans-input';
    }
    state.awaitingInput = true;
    state.questionCount++;

    extractDueReviews();

    if (state.pendingReviews.length > 0) {
      var task = state.pendingReviews.shift();
      currentQ = { a: task.a, b: task.b, answer: task.a * task.b, isReview: true };
      if (reviewBadge) reviewBadge.classList.remove('hidden');
    } else {
      var randA = Math.floor(Math.random() * 9) + 1;
      var randB = Math.floor(Math.random() * 9) + 1;
      currentQ = { a: randA, b: randB, answer: randA * randB, isReview: false };
      if (reviewBadge) reviewBadge.classList.add('hidden');
    }

    if (qText) qText.textContent = currentQ.a + ' × ' + currentQ.b + ' = ?';
    if (qCount) qCount.textContent = state.mistakeQueue.length + state.pendingReviews.length;

    if (ansInput) ansInput.focus();
    startTimer();
  }

  /* ════════ TIMER CONTROL ════════ */
  function startTimer() {
    timeLeft = TIMER_SEC;
    refreshTimerUI();

    timerInterval = setInterval(function() {
      timeLeft--;
      refreshTimerUI();

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        handleTimeout();
      } else if (timeLeft <= 1) {
        playSound('timer');
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
  }

  function refreshTimerUI() {
    if (!tNum || !trFill) return;
    tNum.textContent = timeLeft;

    var offset = CIRCUMFERENCE * (1 - (timeLeft / TIMER_SEC));
    trFill.style.strokeDashoffset = offset;
    trFill.classList.remove('warn', 'danger');

    if (timeLeft <= 1) {
      trFill.classList.add('danger');
    } else if (timeLeft <= 2) {
      trFill.classList.add('warn');
    }
  }

  /* ════════ ANSWER EVALUATION ════════ */
  if (btnSubmit) btnSubmit.addEventListener('click', evalInputAnswer);
  if (ansInput) {
    ansInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') evalInputAnswer(); });
  }

  function evalInputAnswer() {
    if (!state.awaitingInput || !currentQ || !ansInput) return;
    var parsed = parseInt(ansInput.value, 10);
    if (isNaN(parsed)) return;

    state.awaitingInput = false;
    stopTimer();

    if (parsed === currentQ.answer) {
      handleCoreCorrect();
    } else {
      handleCoreWrong();
    }
  }

  function handleCoreCorrect() {
    if (ansInput) ansInput.classList.add('correct');
    playSound('correct');
    animQuizHamster('happy');

    state.totalCorrect++;
    if (quizScore) quizScore.textContent = state.totalCorrect;

    var comment = CORRECT_COMMENTS[Math.floor(Math.random() * CORRECT_COMMENTS.length)];
    showFeedback(true, comment);

    // 核對突發解鎖
    for (var i = 0; i < THRESHOLDS.length; i++) {
      var targetThresh = THRESHOLDS[i];
      if (state.totalCorrect >= targetThresh && state.unlockedScores.indexOf(targetThresh) === -1) {
        state.unlockedScores.push(targetThresh);
        var tier = 'basic';
        if (i >= THRESHOLDS.length - 2) tier = 'ultimate';
        else if (i >= Math.floor(THRESHOLDS.length / 2)) tier = 'advanced';

        playSound(targetThresh >= 800 ? 'final' : 'unlock');
        triggerCongratsWindow(targetThresh, tier);
        break;
      }
    }

    apiSave();
    setTimeout(nextQuestion, 950);
  }

  function handleCoreWrong() {
    if (ansInput) ansInput.classList.add('wrong');
    playSound('wrong');
    animQuizHamster('sad');

    showFeedback(false, '❌ 答錯了！正確答案是 ' + currentQ.answer);
    enqueueMistake(currentQ.a, currentQ.b, currentQ.isReview);

    setTimeout(nextQuestion, 1700);
  }

  function handleTimeout() {
    if (!state.awaitingInput) return;
    state.awaitingInput = false;
    if (ansInput) ansInput.classList.add('wrong');
    playSound('wrong');
    animQuizHamster('sad');

    showFeedback(false, '⏰ 時間到！正確答案是 ' + currentQ.answer);
    enqueueMistake(currentQ.a, currentQ.b, false);

    setTimeout(nextQuestion, 1700);
  }

  /* ════════════════════════════════════════════════
     CONGRATS CELEBRATION MODAL
  ════════════════════════════════════════════════ */
  function triggerCongratsWindow(scoreValue, group) {
    if (!cOverlay) return;
    var matchedItem = FURNITURE_CONFIG.find(function(f) { return f.score === scoreValue; });
    var targetSlot = document.getElementById('c-furniture');
    
    if (targetSlot) {
      targetSlot.innerHTML = matchedItem ? '<img src="' + IMG_BASE + matchedItem.file + '" style="height:80px; object-fit:contain;">' : '⭐';
    }

    var textPool = MESSAGES[group] || MESSAGES.basic;
    var phrase = textPool[Math.floor(Math.random() * textPool.length)];
    var msgSlot = document.getElementById('c-message');
    if (msgSlot) msgSlot.textContent = phrase;

    cOverlay.classList.remove('hidden');
    launchConfettiParticles();
  }

  if (btnContinue) {
    btnContinue.addEventListener('click', function() {
      if (cOverlay) cOverlay.classList.add('hidden');
      if (ansInput) ansInput.focus();
    });
  }

  function launchConfettiParticles() {
    if (!cConfetti) return;
    cConfetti.innerHTML = '';
    var colors = ['#FF6B35', '#FFD166', '#06D6A0', '#118AB2', '#FF6BA8', '#9B5DE5'];
    for (var i = 0; i < 44; i++) {
      var p = document.createElement('div');
      p.className = 'c-piece';
      p.style.cssText = [
        'left:' + (Math.random() * 100) + '%',
        'background:' + colors[Math.floor(Math.random() * colors.length)],
        'width:' + (6 + Math.random() * 8) + 'px',
        'height:' + (6 + Math.random() * 8) + 'px',
        'border-radius:' + (Math.random() > 0.5 ? '50%' : '3px'),
        'animation-duration:' + (0.8 + Math.random() * 1.2) + 's',
        'animation-delay:' + (Math.random() * 0.5) + 's',
        'top:-10px'
      ].join(';');
      cConfetti.appendChild(p);
    }
  }

  /* ════════════════════════════════════════════════
     SOUND EFFECTS & ANIMATION HELPERS
  ════════════════════════════════════════════════ */
  function playSound(type) {
    try {
      var lookup = { correct:'correct.mp3', wrong:'wrong.mp3', unlock:'unlock.mp3', timer:'timer.mp3', final:'final.mp3' };
      if (!lookup[type]) return;
      var snd = new Audio(AUDIO_BASE + lookup[type]);
      snd.volume = (type === 'timer') ? 0.4 : 0.7;
      snd.play().catch(function() {});
    } catch (e) {}
  }

  function showFeedback(ok, text) {
    if (!feedback) return;
    feedback.textContent = text;
    feedback.className = 'feedback ' + (ok ? 'ok' : 'err');
  }

  function animQuizHamster(type) {
    if (!qzSprite) return;
    qzSprite.classList.remove('happy', 'sad');
    void qzSprite.offsetWidth; // 觸發重繪
    qzSprite.classList.add(type);
  }
});
