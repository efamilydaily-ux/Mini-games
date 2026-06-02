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
  97:'引夢貘人', 98:'大大蟹', 99:'巨鉗蟹', 100:'霹靂電球', 101:'電擊怪',
  102:'蛋蛋', 103:'椰蛋樹', 104:'卡拉卡拉', 105:'嘎啦嘎啦', 106:'飛腿郎',
  107:'快拳郎', 108:'大舌頭', 109:'瓦斯彈', 110:'毒瓦斯', 111:'獨角犀牛',
  112:'大犀牛', 113:'吉利蛋', 114:'蔓藤怪', 115:'袋獸', 116:'墨海馬',
  117:'海刺龍', 118:'角金魚', 119:'金魚王', 120:'海星星', 121:'刺刺海星',
  122:'魔牆人偶', 123:'飛天螳螂', 124:'迷唇姐', 125:'電擊獸', 126:'鴨嘴火獸',
  127:'大甲', 128:'肯泰羅', 129:'鯉魚王', 130:'暴鯉龍', 131:'乘龍',
  132:'百變怪', 133:'伊布', 134:'水伊布', 135:'雷伊布', 136:'火伊布',
  137:'多邊獸', 138:'菊石獸', 139:'多刺菊石獸', 140:'化石盔', 141:'鐮刀盔',
  142:'化石翼龍', 143:'卡比獸', 144:'急凍鳥', 145:'閃電鳥', 146:'火焰鳥',
  147:'迷你龍', 148:'哈克龍', 149:'快龍', 150:'超夢', 151:'夢幻'
};

const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';
const getSprite = (id) => `${SPRITE_BASE}${id}.png`;

const TOTAL = 151;
const ALL_POKEMONS = [];
for (let i = 1; i <= TOTAL; i++) {
  ALL_POKEMONS.push({ id: i, name: POKE_NAMES_MAP[i] || `精靈 #${i}` });
}

// ============================================================
// CLASS: GameDataManager — 雲端資料庫存取（只有觸發時才連線）
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

  // 💡 只有當玩家輸入完名、密碼，點擊登入時，才會執行的網絡請求
  static async loginRemote(trainerName, password) {
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
      if (!res.ok || !result.success) throw new Error(result.message || '雲端服務器驗證失敗');
      return {
        gameData: result.data || this.getDefaultState(),
        token: result.token
      };
    } catch (err) {
      alert(`❌ 登入失敗：${err.message}`);
      return null;
    }
  }

  static async saveRemote(trainerName, token, state) {
    if (!token) return;
    try {
      await fetch('/api/save-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainerName: trainerName,
          gameId: this.GAME_ID,
          gameData: state,
          token: token
        })
      });
    } catch (err) {
      console.error("雲端自動同步失敗:", err);
    }
  }

  static getLastTrainer() {
    return localStorage.getItem('pkmnMath_lastTrainer') || '';
  }

  static setLastTrainer(name) {
    try { localStorage.setItem('pkmnMath_lastTrainer', name); } catch {}
  }
}

// ============================================================
// CLASS: PlayerSessionManager — 玩家狀態
// ============================================================
class PlayerSessionManager {
  constructor() {
    this.currentName = '玩家';
    this.token = '';
    this.state = GameDataManager.getDefaultState();
  }

  async loginWithCloud(name, password) {
    const result = await GameDataManager.loginRemote(name, password);
    if (!result) return false;

    this.currentName = name;
    this.token = result.token;
    this.state = result.gameData;
    GameDataManager.setLastTrainer(this.currentName);
    return true;
  }

  save() {
    GameDataManager.saveRemote(this.currentName, this.token, this.state);
  }

  getCaughtIds() {
    return Object.keys(this.state.caughtMap).map(Number).filter(id => this.state.caughtMap[id] > 0);
  }

  getUncaughtPokemons() {
    const caught = new Set(this.getCaughtIds());
    return ALL_POKEMONS.filter(p => !caught.has(p.id));
  }

  isCaught(id) {
    return (this.state.caughtMap[id] || 0) > 0;
  }

  addCaught(id) {
    this.state.caughtMap[id] = (this.state.caughtMap[id] || 0) + 1;
  }

  recordBattle(correct, answered) {
    this.state.totalBattles++;
    this.state.totalCorrect += correct;
    this.state.totalAnswered += answered;
  }

  getAccuracy() {
    if (this.state.totalAnswered === 0) return null;
    return Math.round(this.state.totalCorrect / this.state.totalAnswered * 100);
  }

  getCaughtCount() {
    return this.getCaughtIds().length;
  }
}

// ============================================================
// CLASS: BattleEngine — 完美保留 10 題賽制玩法（對8題才贏）
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
    const options = Array.from(distractors).sort(() => Math.random() - 0.5);
    return { a, b, answer, text: isAdd ? `${a} + ${b}` : `${a} - ${b}`, hint: type, options };
  }

  currentQuestion() { return this.questions[this.current]; }
  isFinished() { return this.current >= 10; }
  isWin() { return this.correct >= 8; }

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

  stopTimer() { clearInterval(this.timerInterval); }

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
  constructor() { this._ctx = null; }
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
// CLASS: UIManager — 修正按鈕、同步原本 HTML 的 Screen ID
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
    if (target) {
      target.classList.add('active');
    }
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
    // 💡 確保原本主畫面的頂部訓練員資訊、圖鑑完美更新
    const tag = document.getElementById('trainer-info-tag') || document.getElementById('trainer-name-display');
    if (tag) tag.textContent = `🎯 訓練員: ${s.currentName}`;
    
    const label = document.getElementById('partner-label-text');
    if (label) label.textContent = `🌟 ${s.currentName} 的伴侶`;

    const partnerData = ALL_POKEMONS.find(p => p.id === s.state.partnerId);
    const partnerName = partnerData?.name || '皮卡丘';
    
    const spriteImg = document.getElementById('partner-sprite');
    if (spriteImg) spriteImg.src = getSprite(s.state.partnerId);
    
    const nameTxt = document.getElementById('partner-name');
    if (nameTxt) nameTxt.textContent = partnerName;

    this._renderPokedex();
    this._updateStats();
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

      let inner = `<img class="dex-img ${isCaught ? '' : 'silhouette'}" src="${getSprite(p.id)}" alt="">`;
      inner += `<div class="dex-name">${isCaught ? p.name : `No.${p.id}`}</div>`;
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
    this.animateSprite('partner-sprite', 'bounce');
  }

  _updateStats() {
    const s = this.session;
    const sCaught = document.getElementById('stat-caught');
    if (sCaught) sCaught.textContent = `${s.getCaughtCount()} / ${TOTAL}`;
    
    const sBattles = document.getElementById('stat-battles');
    if (sBattles) sBattles.textContent = s.state.totalBattles;
    
    const sAcc = document.getElementById('stat-acc');
    if (sAcc) {
      const acc = s.getAccuracy();
      sAcc.textContent = acc !== null ? acc + '%' : '-%';
    }
  }

  changePartnerRandom() {
    const caughtIds = this.session.getCaughtIds();
    if (caughtIds.length <= 1) { alert('你目前只有一隻寶可夢，快進行對戰來捕獲更多吧！'); return; }
    let current = this.session.state.partnerId;
    let next = current;
    while (next === current) {
      next = caughtIds[Math.floor(Math.random() * caughtIds.length)];
    }
    this.session.state.partnerId = next;
    this.session.save();
    this.refreshHome();
    this.animateSprite('partner-sprite', 'bounce');
  }

  startBattle() {
    const uncaught = this.session.getUncaughtPokemons();
    this.battle.reset(uncaught);

    const partnerData = ALL_POKEMONS.find(p => p.id === this.session.state.partnerId);
    document.getElementById('battle-partner').src = getSprite(this.session.state.partnerId);
    document.getElementById('battle-partner-name').textContent = partnerData?.name || '皮卡丘';
    document.getElementById('battle-wild').src = getSprite(this.battle.wildPokemon.id);
    document.getElementById('battle-wild-name').textContent = `野生 ${this.battle.wildPokemon.name}`;

    this._setEnergy(0);
    this._renderChips([]);
    this.showScreen('battle-screen');
    this._showQuestion();
  }

  _setEnergy(pct) {
    const fill = document.getElementById('energy-fill');
    const txt = document.getElementById('energy-pct');
    if (fill) fill.style.width = pct + '%';
    if (txt) txt.textContent = pct + '%';
  }

  _renderChips(results) {
    const container = document.getElementById('score-chips');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 10; i++) {
      const chip = document.createElement('div');
      chip.className = 'chip' + (results[i] === true ? ' correct' : results[i] === false ? ' wrong' : '');
      chip.textContent = results[i] === true ? '✓' : results[i] === false ? '✗' : '';
      container.appendChild(chip);
    }
  }

  _showQuestion() {
    if (this.battle.isFinished()) { this._endBattle(); return; }
    this.battle.answered = false;
    const q = this.battle.currentQuestion();
    document.getElementById('q-num').textContent = this.battle.current + 1;
    document.getElementById('question-text').textContent = q.text;
    document.getElementById('question-hint').textContent = `💡 題型: ${q.hint}`;

    const grid = document.getElementById('answers-grid');
    grid.innerHTML = '';
    q.options.forEach(opt => {
      const btn = document.createElement('button');
      // 💡 完美還原你最靚嘅按鈕 Class
      btn.className = 'btn-answer';
      btn.textContent = opt;
      btn.addEventListener('click', () => this._handleAnswer(opt, q, btn));
      grid.appendChild(btn);
    });

    this.battle.startTimer(8,
      (pct, sec) => {
        const fill = document.getElementById('timer-fill');
        fill.style.width = pct + '%';
        document.getElementById('timer-sec').textContent = sec;
        if (pct < 33) fill.className = 'timer-fill danger';
        else if (pct < 66) fill.className = 'timer-fill warning';
        else fill.className = 'timer-fill';
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
    const grid = document.getElementById('answers-grid');
    const btns = grid.querySelectorAll('.btn-answer');
    const q = this.battle.questions[this.battle.current - 1];
    btns.forEach(b => {
      b.disabled = true;
      if (parseInt(b.textContent) === q.answer) b.classList.add('correct');
    });
    this.audio.play('wrong');
    this.animateSprite('battle-partner', 'shake');
    this.animateSprite('battle-wild', 'bounce');
    this._renderChips(this.battle.results);
    setTimeout(() => this._showQuestion(), 900);
  }

  _processResult(isCorrect, q, clickedBtn) {
    const grid = document.getElementById('answers-grid');
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
      this.animateSprite('battle-wild', 'shake');
      this._setEnergy(this.battle.correct * 10);
    } else {
      this.audio.play('wrong');
      this.animateSprite('battle-partner', 'shake');
      this.animateSprite('battle-wild', 'bounce');
    }

    this._renderChips(this.battle.results);
    setTimeout(() => this._showQuestion(), 900);
  }

  _endBattle() {
    this.battle.stopTimer();
    const isWin = this.battle.isWin();
    this.session.recordBattle(this.battle.correct, 10);

    document.getElementById('result-title').textContent = isWin ? '🎉 挑戰成功！' : '😿 挑戰失敗';
    document.getElementById('result-title').className = 'result-title ' + (isWin ? 'win' : 'lose');
    document.getElementById('result-score-num').textContent = this.battle.correct;

    const resultChips = document.getElementById('result-chips');
    resultChips.innerHTML = '';
    this.battle.results.forEach(r => {
      const chip = document.createElement('div');
      chip.className = 'chip ' + (r ? 'correct' : 'wrong');
      chip.textContent = r ? '✓' : '✗';
      resultChips.appendChild(chip);
    });

    if (isWin) {
      const wild = this.battle.wildPokemon;
      const wasNew = !this.session.isCaught(wild.id);
      this.session.addCaught(wild.id);
      document.getElementById('result-sprite').src = getSprite(wild.id);
      document.getElementById('result-pokemon-name').textContent = wild.name;
      document.getElementById('result-catch-msg').textContent = wasNew
        ? `🌟 全新解鎖！${wild.name} 已成功收錄至圖鑑！`
        : `捕捉到重複的 ${wild.name}！獲得進化糖果！`;
      this.session.save();
      this._showCaptureAnimation(wild, !wasNew);
    } else {
      const partnerId = this.session.state.partnerId;
      document.getElementById('result-sprite').src = getSprite(partnerId);
      const pName = ALL_POKEMONS.find(p => p.id === partnerId)?.name || '皮卡丘';
      document.getElementById('result-pokemon-name').textContent = pName;
      document.getElementById('result-catch-msg').textContent = `本輪正確率未達 80%，精靈球充能不足，${this.battle.wildPokemon.name} 逃跑了！`;
      this.session.save();
      this.showScreen('result-screen');
    }
  }

  _showCaptureAnimation(pokemon, isDuplicate) {
    const overlay = document.getElementById('capture-overlay');
    const capSprite = document.getElementById('capture-sprite');
    const capText = document.getElementById('capture-text');
    const capText2 = document.getElementById('capture-text2');
    const pokeball = document.getElementById('pokeball');
    const flash = document.getElementById('capture-flash');

    if (!overlay) { this.showScreen('result-screen'); return; }

    capSprite.src = getSprite(pokemon.id);
    capSprite.classList.remove('sucked');
    capText.textContent = '精靈球捕捉充能完畢！';
    capText2.textContent = '';
    pokeball.className = 'pokeball';
    overlay.classList.add('active');

    setTimeout(() => {
      capSprite.classList.add('sucked');
      setTimeout(() => {
        pokeball.classList.add('shake');
        this.audio.play('catch');
        setTimeout(() => {
          if(flash) flash.classList.add('flash');
          setTimeout(() => { if(flash) flash.classList.remove('flash'); }, 600);
          capText.textContent = `成功收服 ${pokemon.name}！`;
          capText2.textContent = isDuplicate ? '（圖鑑數量增加！）' : '✨ 獲得新夥伴！✨';
          setTimeout(() => {
            overlay.classList.remove('active');
            this.showScreen('result-screen');
          }, 1200);
        }, 1200);
      }, 400);
    }, 1000);
  }

  _bindAll() {
    // 💡 點擊原本 HTML 的「開始冒險」按鈕，才觸發登入連線
    const startBtn = document.getElementById('btn-start');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.audio.unlock();
        this._doLoginAndStart();
      });
    }

    // 其他原有控制綁定
    const quitBtn = document.getElementById('btn-quit');
    if (quitBtn) {
      quitBtn.addEventListener('click', () => {
        this.battle.stopTimer();
        this.refreshHome();
        this.showScreen('home-screen');
      });
    }

    const retryBtn = document.getElementById('btn-retry');
    if (retryBtn) retryBtn.addEventListener('click', () => this.startBattle());

    const homeBtn = document.getElementById('btn-home');
    if (homeBtn) {
      homeBtn.addEventListener('click', () => {
        this.refreshHome();
        this.showScreen('home-screen');
      });
    }

    const changePartnerBtn = document.getElementById('btn-change-partner');
    if (changePartnerBtn) {
      changePartnerBtn.addEventListener('click', () => this.changePartnerRandom());
    }
  }

  // 💡 核心登入與啟動邏輯
  async _doLoginAndStart() {
    const nameInput = document.getElementById('trainer-name-input');
    const name = nameInput ? nameInput.value.trim() : '';
    
    // 如果你有加密碼輸入框，就讀取；如果無，預設為 '1234'
    const pwdInput = document.getElementById('trainer-password-input');
    const password = pwdInput ? pwdInput.value.trim() : '1234';

    if (!name) { alert('請輸入訓練員名字！'); return; }

    // 1. 打開連線遮罩
    const loadingOverlay = document.getElementById('loading-overlay') || document.querySelector('.loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = 'flex';
      const p = loadingOverlay.querySelector('p');
      if (p) p.textContent = '寶可夢雲端同步中...';
    }

    // 2. 去連線 Upstash DB 讀取進度
    const success = await this.session.loginWithCloud(name, password);
    
    // 3. 關閉遮罩
    if (loadingOverlay) loadingOverlay.style.display = 'none';

    if (success) {
      // 4. 同步成功，直接幫他開始對戰！
      this.refreshHome();
      this.startBattle();
    } else {
      // 連線失敗的話，至少用本地預設狀態讓他能玩
      this.session.currentName = name;
      this.refreshHome();
      this.startBattle();
    }
  }
}

// ============================================================
// 初始化：網頁一開完全不連 DB，直接秒開
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const session = new PlayerSessionManager();
  const battle = new BattleEngine();
  const audio = new AudioEngine();
  const ui = new UIManager(session, battle, audio);

  ui.createStars();

  // 自動填入上次玩過的名字
  const last = GameDataManager.getLastTrainer();
  const input = document.getElementById('trainer-name-input');
  if (last && input) {
    input.value = last === '玩家' ? '' : last;
  }

  // 強制隱藏所有 Loading，直接露出最乾淨的主畫面（首頁）
  const loadingOverlay = document.getElementById('loading-overlay') || document.querySelector('.loading-overlay');
  if (loadingOverlay) loadingOverlay.style.display = 'none';

  // 原汁原味：一開波顯示你的主頁面 `home-screen`
  ui.showScreen('home-screen');
});
