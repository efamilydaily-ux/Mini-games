'use strict';

// ============================================================
// 151 隻寶可夢名稱對照表（關都全圖鑑）
// ============================================================
const POKE_NAMES_MAP = {
  1:'妙蛙種子', 2:'妙蛙草', 3:'妙蛙花', 4:'小火龍', 5:'火恐龍', 6:'噴火龍',
  7:'傑尼龜', 8:'卡咪龜', 9:'水箭龜', 10:'綠毛蟲', 11:'鐵甲蛹', 12:'巴大蝶',
  13:'獨角蟲', 14:'鐵殼蛹', 15:'大針蜂', 16:'波波', 17:'比比鳥', 18:'大比鳥',
  19:'小拉達', 20:'拉達', 21:'烈雀', 22:'大嘴雀', 23:'阿柏蛇', 24:'阿柏怪',
  25:'皮卡丘', 26:'雷丘', 27:'穿山鼠', 28:'穿山王', 29:'尼多蘭', 30:'尼多娜',
  31:'尼多后', 32:'尼多朗', 33:'尼多力諾', 34:'尼多王', 35:'皮皮', 36:'皮可西',
  37:'六尾', 38:'九尾', 39:'胖丁', 40:'胖可丁', 41:'超音蝠', 42:'大嘴蝠',
  43:'走路草', 44:'臭臭花', 45:'霸王花', 46:'派拉斯', 47:'派拉斯特', 48:'毛球',
  49:'摩魯蛾', 50:'地鼠', 51:'三地鼠', 52:'喵喵', 53:'貓老大', 54:'可達鴨',
  55:'哥達鴨', 56:'猴怪', 57:'火暴猴', 58:'卡蒂狗', 59:'風速狗', 60:'蚊香蝌蚪',
  61:'蚊香君', 62:'蚊香泳士', 63:'凱西', 64:'勇基拉', 65:'胡地', 66:'腕力',
  67:'豪力', 68:'怪力', 69:'喇叭芽', 70:'口呆花', 71:'大食花', 72:'瑪瑙水母',
  73:'毒刺水母', 74:'小拳石', 75:'隆隆石', 76:'隆隆岩', 77:'小火馬', 78:'烈焰馬',
  79:'呆呆獸', 80:'呆殼獸', 81:'小磁怪', 82:'三合一磁怪', 83:'大蔥鴨', 84:'嘟嘟',
  85:'嘟嘟利', 86:'小海獅', 87:'白海獅', 88:'臭泥', 89:'臭臭泥', 90:'大舌貝',
  91:'刺甲貝', 92:'鬼斯', 93:'鬼斯通', 94:'耿鬼', 95:'大岩蛇', 96:'催眠貘',
  97:'引夢貘人', 98:'大鉗蟹', 99:'巨鉗蟹', 100:'霹靂電球', 101:'頑皮雷彈',
  102:'蛋蛋', 103:'椰蛋樹', 104:'卡拉卡拉', 105:'嘎拉嘎啦', 106:'飛腿郎',
  107:'快拳郎', 108:'大舌頭', 109:'瓦斯彈', 110:'雙彈瓦斯', 111:'獨角犀牛',
  112:'鑽角犀獸', 113:'吉利蛋', 114:'蔓藤怪', 115:'袋獸', 116:'墨海馬',
  117:'海刺龍', 118:'角金魚', 119:'金魚王', 120:'海星星', 121:'寶石海星',
  122:'魔牆人偶', 123:'飛天螳螂', 124:'迷唇姐', 125:'電擊獸', 126:'鴨嘴火獸',
  127:'凱羅斯', 128:'肯泰羅', 129:'鯉魚王', 130:'暴鯉龍', 131:'拉普拉斯',
  132:'百變怪', 133:'伊布', 134:'水伊布', 135:'雷伊布', 136:'火伊布',
  137:'多邊獸', 138:'菊石獸', 139:'多刺菊石獸', 140:'化石盔', 141:'鐮刀盔',
  142:'化石翼龍', 143:'卡比獸', 144:'急凍鳥', 145:'閃電鳥', 146:'火焰鳥',
  147:'迷你龍', 148:'哈克龍', 149:'快龍', 150:'超夢', 151:'夢幻'
};

const TOTAL = 151;
const ALL_POKEMONS = Object.keys(POKE_NAMES_MAP).map(idStr => {
  const id = Number(idStr);
  return { id, name: POKE_NAMES_MAP[id] };
});

function getSprite(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

// ============================================================
// CLASS: GameDataManager (雲端備份控制)
// ============================================================
class GameDataManager {
  static get GAME_ID() { return 'pokemon-math'; }

  static getDefaultState() {
    return {
      partnerId: 25,
      caughtMap: { 25: 1 },
      totalBattles: 0,
      totalCorrect: 0,
      totalAnswered: 0
    };
  }

  static async loginOrRegisterRemote(trainerName, password) {
    try {
      const res = await fetch('/api/auth-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainerName: trainerName,
          password: password,
          gameId: this.GAME_ID,
          defaultData: this.getDefaultState()
        })
      });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || '連線伺服器失敗');
      return {
        gameData: result.data || this.getDefaultState(),
        token: result.token,
        message: result.message
      };
    } catch (err) {
      alert(`❌ 失敗：${err.message}`);
      return null;
    }
  }

  static async savePlayerStateRemote(trainerName, token, gameData) {
    try {
      await fetch('/api/save-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainerName: trainerName,
          gameId: this.GAME_ID,
          gameData: gameData,
          token: token
        })
      });
    } catch (err) {
      console.error("雲端備份失敗:", err);
    }
  }
}

// ============================================================
// CLASS: PlayerSessionManager
// ============================================================
class PlayerSessionManager {
  constructor() {
    this.currentName = '玩家';
    this.token = '';
    this.state = GameDataManager.getDefaultState();
  }

  async doCloudAuth(name, password) {
    const authResult = await GameDataManager.loginOrRegisterRemote(name, password);
    if (!authResult) return false;
    this.currentName = name;
    this.token = authResult.token;
    this.state = authResult.gameData;
    localStorage.setItem('pokemon_math_last_trainer', name);
    return true;
  }

  async save() {
    if (!this.token) return;
    await GameDataManager.savePlayerStateRemote(this.currentName, this.token, this.state);
  }

  getCaughtIds() { return Object.keys(this.state.caughtMap).map(Number).filter(id => this.state.caughtMap[id] > 0); }
  getUncaughtPokemons() {
    const caught = new Set(this.getCaughtIds());
    return ALL_POKEMONS.filter(p => !caught.has(p.id));
  }
  isCaught(id) { return (this.state.caughtMap[id] || 0) > 0; }
  addCaught(id) { this.state.caughtMap[id] = (this.state.caughtMap[id] || 0) + 1; }
  recordBattle(correct, answered) {
    this.state.totalBattles++;
    this.state.totalCorrect += correct;
    this.state.totalAnswered += answered;
  }
  getAccuracy() {
    if (this.state.totalAnswered === 0) return null;
    return Math.round(this.state.totalCorrect / this.state.totalAnswered * 100);
  }
  getCaughtCount() { return this.getCaughtIds().length; }
}

// ============================================================
// CLASS: BattleEngine — 題目生成、計時、勝負判定
// ============================================================
class BattleEngine {
  constructor() {
    this.questions = [];
    this.current = 0;
    this.correct = 0;
    this.results = [];
    this.wildPokemon = null;
    this.timerInterval = null;
    this.timerStart = null;
    this.answered = false;
  }

  reset(uncaughtPokemons) {
    const pool = uncaughtPokemons.length > 0 ? uncaughtPokemons : ALL_POKEMONS;
    this.wildPokemon = pool[Math.floor(Math.random() * pool.length)];

    this.questions = Array.from({ length: 10 }, () => this.generateQuestion());
    this.current = 0;
    this.correct = 0;
    this.results = [];
    this.answered = false;
  }

  generateQuestion() {
    const isAdd = Math.random() < 0.5;
    let a, b, answer, type;

    if (isAdd) {
      const units = Math.floor(Math.random() * 8) + 2;
      b = Math.floor(Math.random() * (9 - (10 - units) + 1)) + (10 - units);
      if (b > 9) b = 9;
      const tens = Math.floor(Math.random() * 8) + 1;
      a = tens * 10 + units;
      if (a + b > 99) a -= 10;
      answer = a + b;
      type = '進位加法';
    } else {
      const aUnits = Math.floor(Math.random() * 8);
      b = aUnits + Math.floor(Math.random() * (8 - aUnits)) + 2;
      if (b > 9) b = 9;
      const aTens = Math.floor(Math.random() * 8) + 2;
      a = aTens * 10 + aUnits;
      answer = a - b;
      if (answer < 10) { a += 10; answer = a - b; }
      type = '退位減法';
    }

    const distractors = new Set([answer]);
    const candidates = [];
    for (let d = -5; d <= 5; d++) { if (d !== 0) candidates.push(answer + d); }
    candidates.sort(() => Math.random() - 0.5);
    for (const c of candidates) {
      if (distractors.size >= 4) break;
      if (c > 0 && c < 100) distractors.add(c);
    }
    while (distractors.size < 4) {
      const rand = answer + Math.floor(Math.random() * 15) - 7;
      if (rand > 0 && rand !== answer) distractors.add(rand);
    }
    const options = Array.from(distractors).sort((x, y) => x - y); // 升序排列讓排版更精美齊整
    return { a, b, answer, text: isAdd ? `${a} + ${b}` : `${a} - ${b}`, hint: type, options };
  }

  currentQuestion() {
    return this.questions[this.current];
  }

  isFinished() {
    return this.current >= 10;
  }

  isWin() {
    return this.correct >= 8;
  }

  startTimer(secs, onTick, onTimeout) {
    clearInterval(this.timerInterval);
    this.timerStart = Date.now();
    const total = secs * 1000;

    this.timerInterval = setInterval(() => {
      const elapsed = Date.now() - this.timerStart;
      const remaining = Math.max(0, total - elapsed);
      const pct = (remaining / total) * 100;
      onTick(pct, Math.ceil(remaining / 1000));
      if (remaining <= 0) {
        clearInterval(this.timerInterval);
        if (!this.answered) onTimeout();
      }
    }, 50);
  }

  stopTimer() {
    clearInterval(this.timerInterval);
  }

  submitAnswer(chosen) {
    if (this.answered) return false;
    this.answered = true;
    this.stopTimer();
    const isCorrect = chosen === this.currentQuestion().answer;
    if (isCorrect) this.correct++;
    this.results.push(isCorrect);
    this.current++;
    return isCorrect;
  }

  timeout() {
    if (this.answered) return;
    this.answered = true;
    this.results.push(false);
    this.current++;
  }
}

// ============================================================
// CLASS: AudioEngine — 音效
// ============================================================
class AudioEngine {
  constructor() {
    this._ctx = null;
  }

  _getCtx() {
    if (!this._ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      this._ctx = new C();
    }
    return this._ctx;
  }

  unlock() { this._getCtx(); }

  play(type) {
    try {
      const ctx = this._getCtx();
      if (type === 'right') {
        [523, 659, 784, 1047].forEach((freq, i) => {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination); o.frequency.value = freq;
          const t = ctx.currentTime + i * 0.07;
          g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.15, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
          o.start(t); o.stop(t + 0.18);
        });
      } else if (type === 'wrong') {
        [220, 180].forEach((freq, i) => {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination); o.frequency.value = freq; o.type = 'sawtooth';
          const t = ctx.currentTime + i * 0.1;
          g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.15, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
          o.start(t); o.stop(t + 0.25);
        });
      } else if (type === 'catch') {
        [600, 800, 1000, 1200, 1500].forEach((freq, i) => {
          const o = ctx.createOscillator(), g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination); o.frequency.value = freq;
          const t = ctx.currentTime + i * 0.08;
          g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.2, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
          o.start(t); o.stop(t + 0.35);
        });
      }
    } catch {}
  }
}

// ============================================================
// CLASS: UIManager — 頁面切換、渲染、按鈕美化與動畫控制
// ============================================================
class UIManager {
  constructor(session, battle, audio) {
    this.session = session;
    this.battle = battle;
    this.audio = audio;
    this._bindAll();
  }

  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) target.classList.add('active');
    window.scrollTo(0, 0);
  }

  createStars() {
    const container = document.getElementById('stars');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 40; i++) {
      const s = document.createElement('div'); s.className = 'star';
      const size = Math.random() * 2 + 1;
      s.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;top:${Math.random()*100}%;--dur:${2+Math.random()*3}s;--delay:${Math.random()*3}s;`;
      container.appendChild(s);
    }
  }

  animateSprite(id, anim) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('bounce', 'shake');
    void el.offsetWidth;
    el.classList.add(anim);
    el.addEventListener('animationend', () => el.classList.remove(anim), { once: true });
  }

  refreshHome() {
    const s = this.session;
    const nameDisplay = document.getElementById('trainer-name-display') || document.getElementById('trainer-info-tag');
    if (nameDisplay) nameDisplay.textContent = `🎯 訓練員: ${s.currentName}`;

    const partnerLabel = document.getElementById('partner-label-text');
    if (partnerLabel) partnerLabel.textContent = `🌟 ${s.currentName} 的伴侶`;

    const partnerData = ALL_POKEMONS.find(p => p.id === s.state.partnerId);
    const partnerName = partnerData?.name || '皮卡丘';
    
    const pSprite = document.getElementById('partner-sprite') || document.getElementById('home-partner-sprite');
    if (pSprite) pSprite.src = getSprite(s.state.partnerId);

    const pNameEl = document.getElementById('partner-name');
    if (pNameEl) pNameEl.textContent = partnerName;

    const valPokedex = document.getElementById('val-pokedex') || document.getElementById('stat-caught');
    if (valPokedex) valPokedex.textContent = `${s.getCaughtCount()} / ${TOTAL}`;

    const valBattles = document.getElementById('val-battles') || document.getElementById('stat-battles');
    if (valBattles) valBattles.textContent = s.state.totalBattles;

    const valAcc = document.getElementById('val-accuracy') || document.getElementById('stat-acc');
    const acc = s.getAccuracy();
    if (valAcc) valAcc.textContent = acc !== null ? acc + '%' : '-%';

    this._renderPokedex();
  }

  _renderPokedex() {
    const grid = document.getElementById('pokedex-grid');
    if (!grid) return;
    grid.innerHTML = '';

    ALL_POKEMONS.forEach(p => {
      const count = this.session.state.caughtMap[p.id] || 0;
      const isCaught = count > 0;
      const isPartner = this.session.state.partnerId === p.id;

      const card = document.createElement('div');
      let cls = 'dex-card';
      if (isCaught) cls += ' caught';
      if (isPartner) cls += ' active-partner';
      card.className = cls;

      let inner = `<div class="dex-num">#${String(p.id).padStart(3, '0')}</div>`;
      inner += `<img class="dex-img ${isCaught ? '' : 'silhouette'}" src="${getSprite(p.id)}" style="${isCaught ? '' : 'filter:brightness(0);'}" alt="">`;
      inner += `<div class="dex-name">${isCaught ? p.name : '???'}</div>`;
      if (count > 1) inner += `<div class="dex-count">x${count}</div>`;
      card.innerHTML = inner;

      if (isCaught) {
        card.addEventListener('click', () => this._selectPartner(p.id));
      }

      grid.appendChild(card);
    });
  }

  _selectPartner(id) {
    this.session.state.partnerId = id;
    this.session.save();
    this.refreshHome();
    this.animateSprite('home-partner-sprite', 'bounce');
    this.animateSprite('partner-sprite', 'bounce');
  }

  changePartnerRandom() {
    const caughtIds = this.session.getCaughtIds();
    if (caughtIds.length <= 1) { alert('你目前只有一隻寶可夢，快挑戰對戰來捕獲更多吧！'); return; }
    let current = this.session.state.partnerId;
    let next = current;
    while (next === current) {
      next = caughtIds[Math.floor(Math.random() * caughtIds.length)];
    }
    this.session.state.partnerId = next;
    this.session.save();
    this.refreshHome();
    this.animateSprite('home-partner-sprite', 'bounce');
    this.animateSprite('partner-sprite', 'bounce');
  }

  // -------- 對戰開始 --------
  startBattle() {
    const uncaught = this.session.getUncaughtPokemons();
    this.battle.reset(uncaught);

    const partnerData = ALL_POKEMONS.find(p => p.id === this.session.state.partnerId);
    
    const bPartner = document.getElementById('battle-partner') || document.getElementById('home-partner-sprite');
    if (bPartner) bPartner.src = getSprite(this.session.state.partnerId);
    
    const bPartnerName = document.getElementById('battle-partner-name');
    if (bPartnerName) bPartnerName.textContent = partnerData?.name || '皮卡丘';
    
    const bWild = document.getElementById('battle-wild') || document.getElementById('enemy-sprite');
    if (bWild) bWild.src = getSprite(this.battle.wildPokemon.id);
    
    const bWildName = document.getElementById('battle-wild-name');
    if (bWildName) bWildName.textContent = `野生 ${this.battle.wildPokemon.name}`;

    this._setEnergy(0);
    this._renderChips([]);
    this.showScreen('battle-screen');
    this._showQuestion();
  }

  _setEnergy(pct) {
    const fill = document.getElementById('energy-fill') || document.getElementById('timer-fill');
    const txt = document.getElementById('energy-pct') || document.getElementById('battle-time');
    if (fill) fill.style.width = pct + '%';
    if (txt) txt.textContent = pct + '%';
  }

  _renderChips(results) {
    const container = document.getElementById('score-chips') || document.getElementById('battle-score');
    if (!container) return;

    // 如果頁面用的是舊的文字純容器，動態轉化為靚靚的進度條樣式
    if (container.tagName !== 'DIV' || container.id === 'battle-score') {
      const qNum = this.battle.current + (this.battle.answered ? 0 : 1);
      container.textContent = `題目：${Math.min(10, qNum)} / 10 | 正確：${this.battle.correct}`;
      return;
    }
    
    container.innerHTML = '';
    for (let i = 0; i < 10; i++) {
      const chip = document.createElement('div');
      chip.className = 'chip' + (results[i] === true ? ' correct' : results[i] === false ? ' wrong' : '');
      chip.textContent = results[i] === true ? '✓' : results[i] === false ? '✗' : '';
      container.appendChild(chip);
    }
  }

  // 💡 關鍵核心更新：動態精美渲染答題按鈕，絕不擠壓
  _showQuestion() {
    if (this.battle.isFinished()) { this._endBattle(); return; }
    this.battle.answered = false;
    const q = this.battle.currentQuestion();
    
    const qNumEl = document.getElementById('q-num');
    if (qNumEl) qNumEl.textContent = this.battle.current + 1;
    
    document.getElementById('question-text').textContent = q.text;
    
    const qHint = document.getElementById('question-hint');
    if (qHint) qHint.textContent = `💡 題型: ${q.hint}`;

    // 大粒漂亮按鈕動態注入、完美清除舊狀態
    const grid = document.getElementById('answers-grid') || document.querySelector('.answers-grid');
    if (grid) {
      grid.innerHTML = '';
      q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'btn-answer';
        btn.style.width = '100%';
        btn.style.display = 'block';
        btn.textContent = opt;
        btn.setAttribute('data-idx', idx);
        btn.addEventListener('click', () => this._handleAnswer(opt, q, btn));
        grid.appendChild(btn);
      });
    } else {
      // 兼容傳統舊 HTML 結構四按鈕
      const btns = document.querySelectorAll('.btn-answer') || document.querySelectorAll('.btn-ans');
      btns.forEach((btn, i) => {
        if (btn && q.options[i] !== undefined) {
          btn.textContent = q.options[i];
          btn.className = 'btn-answer';
          btn.disabled = false;
          btn.style.display = 'block';
          btn.setAttribute('data-idx', i);
          // 移除舊的監聽，重新綁定新核心數據
          const newBtn = btn.cloneNode(true);
          btn.parentNode.replaceChild(newBtn, btn);
          newBtn.addEventListener('click', () => this._handleAnswer(q.options[i], q, newBtn));
        }
      });
    }

    // 8秒挑戰計時器驅動
    this.battle.startTimer(8,
      (pct, sec) => {
        const fill = document.getElementById('timer-fill');
        const timeTxt = document.getElementById('timer-sec') || document.getElementById('battle-time');
        if (fill) fill.style.width = pct + '%';
        if (timeTxt) timeTxt.textContent = sec + 's';
        if (fill) {
          if (pct < 33) fill.className = 'timer-fill danger';
          else if (pct < 66) fill.className = 'timer-fill warning';
          else fill.className = 'timer-fill';
        }
      },
      () => this._handleTimeout()
    );
  }

  _handleAnswer(chosen, q, btn) {
    if (this.battle.answered) return;
    const isCorrect = this.battle.submitAnswer(chosen);
    this._processResult(isCorrect, q, btn);
  }

  _handleTimeout() {
    this.battle.timeout();
    const grid = document.getElementById('answers-grid') || document.querySelector('.answers-grid') || document.body;
    const btns = grid.querySelectorAll('.btn-answer');
    const q = this.battle.questions[this.battle.current - 1];
    
    btns.forEach(b => {
      b.disabled = true;
      if (parseInt(b.textContent) === q.answer) b.classList.add('correct');
    });
    
    this.audio.play('wrong');
    this.animateSprite('battle-partner', 'shake');
    this.animateSprite('home-partner-sprite', 'shake');
    this.animateSprite('battle-wild', 'bounce');
    this.animateSprite('enemy-sprite', 'bounce');
    
    this._renderChips(this.battle.results);
    setTimeout(() => this._showQuestion(), 900);
  }

  _processResult(isCorrect, q, clickedBtn) {
    const grid = document.getElementById('answers-grid') || document.querySelector('.answers-grid') || document.body;
    const btns = grid.querySelectorAll('.btn-answer');
    btns.forEach(b => b.disabled = true);

    if (clickedBtn) {
      clickedBtn.classList.add(isCorrect ? 'correct' : 'wrong');
      if (!isCorrect) {
        btns.forEach(b => { if (parseInt(b.textContent) === q.answer) b.classList.add('correct'); });
      }
    }

    if (isCorrect) {
      this.audio.play('right');
      this.animateSprite('battle-partner', 'bounce');
      this.animateSprite('home-partner-sprite', 'bounce');
      this.animateSprite('battle-wild', 'shake');
      this.animateSprite('enemy-sprite', 'shake');
      this._setEnergy(this.battle.correct * 10);
    } else {
      this.audio.play('wrong');
      this.animateSprite('battle-partner', 'shake');
      this.animateSprite('home-partner-sprite', 'shake');
      this.animateSprite('battle-wild', 'bounce');
      this.animateSprite('enemy-sprite', 'bounce');
    }

    this._renderChips(this.battle.results);
    setTimeout(() => this._showQuestion(), 900);
  }

  async _endBattle() {
    this.battle.stopTimer();
    const isWin = this.battle.isWin();
    this.session.recordBattle(this.battle.correct, 10);

    const rTitle = document.getElementById('result-title');
    if (rTitle) {
      rTitle.textContent = isWin ? '🎉 挑戰成功！' : '😿 挑戰失敗';
      rTitle.className = 'result-title ' + (isWin ? 'win' : 'lose');
    }

    const rScoreNum = document.getElementById('result-score-num') || document.getElementById('res-score');
    if (rScoreNum) rScoreNum.textContent = this.battle.correct * 10;

    const rDetailsCount = document.getElementById('res-details-count');
    if (rDetailsCount) rDetailsCount.textContent = `${this.battle.correct} / 10`;

    const rDetailsAcc = document.getElementById('res-details-acc');
    if (rDetailsAcc) rDetailsAcc.textContent = (this.battle.correct * 10) + '%';

    const resultChips = document.getElementById('result-chips');
    if (resultChips) {
      resultChips.innerHTML = '';
      this.battle.results.forEach(r => {
        const chip = document.createElement('div');
        chip.className = 'chip ' + (r ? 'correct' : 'wrong');
        chip.textContent = r ? '✓' : '✗';
        resultChips.appendChild(chip);
      });
    }

    if (isWin) {
      const wild = this.battle.wildPokemon;
      const wasNew = !this.session.isCaught(wild.id);
      this.session.addCaught(wild.id);
      
      const rSprite = document.getElementById('result-sprite');
      if (rSprite) rSprite.src = getSprite(wild.id);
      
      const rPName = document.getElementById('result-pokemon-name');
      if (rPName) rPName.textContent = wild.name;
      
      const rCatchMsg = document.getElementById('result-catch-msg') || document.getElementById('capture-text');
      if (rCatchMsg) {
        rCatchMsg.textContent = wasNew
          ? `🌟 全新解鎖！${wild.name} 已成功收錄至圖鑑！`
          : `捕捉到重複的 ${wild.name}！精靈球圖鑑數量增加！`;
      }
      
      await this.session.save();
      this._showCaptureAnimation(wild, !wasNew);
    } else {
      const partnerId = this.session.state.partnerId;
      const rSprite = document.getElementById('result-sprite');
      if (rSprite) rSprite.src = getSprite(partnerId);
      
      const pName = ALL_POKEMONS.find(p => p.id === partnerId)?.name || '皮卡丘';
      const rPName = document.getElementById('result-pokemon-name');
      if (rPName) rPName.textContent = pName;
      
      const rCatchMsg = document.getElementById('result-catch-msg') || document.getElementById('capture-text');
      if (rCatchMsg) {
        rCatchMsg.textContent = `本輪正確率未達 80%（需答對8題），精靈球充能不足，${this.battle.wildPokemon.name} 逃跑了！`;
      }
      
      await this.session.save();
      this.showScreen('result-screen');
    }
  }

  _showCaptureAnimation(pokemon, isDuplicate) {
    const overlay = document.getElementById('capture-overlay');
    if (!overlay) {
      this.showScreen('result-screen');
      return;
    }

    const capSprite = document.getElementById('capture-sprite');
    const capText = document.getElementById('capture-text');
    const capText2 = document.getElementById('capture-text2');
    const pokeball = document.getElementById('pokeball');
    const flash = document.getElementById('capture-flash');

    if (capSprite) {
      capSprite.src = getSprite(pokemon.id);
      capSprite.classList.remove('sucked');
    }
    if (capText) capText.textContent = '精靈球捕捉充能完畢！';
    if (capText2) capText2.textContent = '';
    if (pokeball) pokeball.className = 'pokeball';
    
    overlay.classList.add('active');

    setTimeout(() => {
      if (capSprite) capSprite.classList.add('sucked');
      setTimeout(() => {
        if (pokeball) pokeball.classList.add('shake');
        this.audio.play('catch');
        setTimeout(() => {
          if (flash) {
            flash.classList.add('flash');
            setTimeout(() => flash.classList.remove('flash'), 600);
          }
          if (capText) capText.innerHTML = `成功收服 ${pokemon.name}！`;
          if (capText2) capText2.textContent = isDuplicate ? '（圖鑑數量增加！）' : '✨ 獲得新夥伴！✨';
          setTimeout(() => {
            overlay.classList.remove('active');
            this.showScreen('result-screen');
          }, 1500);
        }, 1200);
      }, 400);
    }, 1000);
  }

  _bindAll() {
    // 登入按鈕事件綁定
    const loginBtn = document.getElementById('btn-login') || document.getElementById('btn-login-submit') || document.querySelector('.btn-login');
    if (loginBtn) {
      loginBtn.addEventListener('click', async () => {
        const name = document.getElementById('trainer-name-input').value.trim();
        const password = document.getElementById('trainer-password-input')?.value?.trim() || '';
        if (!name) { alert('請輸入訓練員名字！'); return; }
        if (!password) { alert('請輸入密碼！'); return; }

        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
          overlay.style.display = 'flex';
          const pTag = overlay.querySelector('p');
          if (pTag) pTag.textContent = 'E家雲端連線中...';
        }

        loginBtn.disabled = true;
        const success = await this.session.doCloudAuth(name, password);
        loginBtn.disabled = false;
        
        if (!success && overlay) overlay.style.display = 'none';
        if (success) { 
          if (overlay) overlay.style.display = 'none';
          this.audio.unlock(); 
          this.refreshHome(); 
          this.showScreen('home-screen'); 
        }
      });
    }

    const switchBtn = document.getElementById('btn-switch-user');
    if (switchBtn) { switchBtn.addEventListener('click', () => { window.location.href = '../index.html'; }); }

    const changePartnerBtn = document.getElementById('btn-change-partner');
    if (changePartnerBtn) changePartnerBtn.addEventListener('click', () => this.changePartnerRandom());

    const startBtn = document.getElementById('btn-start');
    if (startBtn) startBtn.addEventListener('click', () => { this.audio.unlock(); this.startBattle(); });

    const openDexBtn = document.getElementById('btn-open-pokedex') || document.getElementById('btn-view-all-scores');
    if (openDexBtn) openDexBtn.addEventListener('click', () => this.refreshHome() || document.getElementById('dex-modal')?.classList.add('active'));

    const closeDexBtn = document.getElementById('btn-close-dex') || document.getElementById('modal-close');
    if (closeDexBtn) closeDexBtn.addEventListener('click', () => document.getElementById('dex-modal')?.classList.remove('active'));

    const dexOverlay = document.getElementById('dex-modal-overlay');
    if (dexOverlay) dexOverlay.addEventListener('click', () => document.getElementById('dex-modal')?.classList.remove('active'));

    const quitBtn = document.getElementById('btn-quit');
    if (quitBtn) quitBtn.addEventListener('click', () => { this.battle.stopTimer(); this.refreshHome(); this.showScreen('home-screen'); });

    const retryBtn = document.getElementById('btn-retry');
    if (retryBtn) retryBtn.addEventListener('click', () => this.startBattle());

    const homeBtn = document.getElementById('btn-home');
    if (homeBtn) homeBtn.addEventListener('click', () => { this.refreshHome(); this.showScreen('home-screen'); });
  }
}

// ============================================================
// 頁面載入完成初始化
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const session = new PlayerSessionManager();
  const battle = new BattleEngine();
  const audio = new AudioEngine();
  const ui = new UIManager(session, battle, audio);

  ui.createStars();

  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.style.display = 'none';

  const last = localStorage.getItem('pokemon_math_last_trainer');
  const input = document.getElementById('trainer-name-input');
  if (last && input) { input.value = last; }

  ui.showScreen('login-screen');
});
