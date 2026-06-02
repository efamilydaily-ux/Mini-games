
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
  122:'魔因特', 123:'飛天螳螂', 124:'迷唇姐', 125:'電擊獸', 126:'鴨嘴火獸',
  127:'鉗形炮', 128:'肯泰羅', 129:'鯉魚王', 130:'暴鯉龍', 131:'乘龍',
  132:'百變怪', 133:'伊布', 134:'水伊布', 135:'雷伊布', 136:'火伊布',
  137:'多邦', 138:'菊石獸', 139:'多刺菊石獸', 140:'化石盔', 141:'多刺化石盔',
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
// CLASS: GameDataManager — 全域數據與存檔管理
// ============================================================
class GameDataManager {
  static PLAYER_LIST_KEY = 'pkmnMath_player_list';
  static SAVE_PREFIX = 'pkmnMath_save_';

  static getDefaultState() {
    return {
      partnerId: 25,
      caughtMap: { 25: 1 },
      totalBattles: 0,
      totalCorrect: 0,
      totalAnswered: 0
    };
  }

  static getPlayerList() {
    try {
      const raw = localStorage.getItem(this.PLAYER_LIST_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  static addPlayerToList(name) {
    const list = this.getPlayerList();
    if (!list.includes(name)) {
      list.push(name);
      try { localStorage.setItem(this.PLAYER_LIST_KEY, JSON.stringify(list)); } catch {}
    }
  }

  static loadPlayerState(name) {
    try {
      const raw = localStorage.getItem(this.SAVE_PREFIX + name);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.caughtMap) return parsed;
      }
    } catch {}
    return this.getDefaultState();
  }

  static savePlayerState(name, state) {
    try {
      this.addPlayerToList(name);
      localStorage.setItem(this.SAVE_PREFIX + name, JSON.stringify(state));
    } catch {}
  }

  static getLastTrainer() {
    return localStorage.getItem('pkmnMath_lastTrainer') || '';
  }

  static setLastTrainer(name) {
    try { localStorage.setItem('pkmnMath_lastTrainer', name); } catch {}
  }
}

// ============================================================
// CLASS: PlayerSessionManager — 玩家帳戶與統計管理
// ============================================================
class PlayerSessionManager {
  constructor() {
    this.currentName = '';
    this.state = GameDataManager.getDefaultState();
  }

  login(name) {
    this.currentName = name || '玩家';
    GameDataManager.setLastTrainer(this.currentName);
    this.state = GameDataManager.loadPlayerState(this.currentName);
  }

  save() {
    GameDataManager.savePlayerState(this.currentName, this.state);
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

  getAllPlayersData() {
    return GameDataManager.getPlayerList().map(name => {
      const state = GameDataManager.loadPlayerState(name);
      const caught = Object.keys(state.caughtMap).filter(k => state.caughtMap[k] > 0).length;
      const acc = state.totalAnswered > 0
        ? Math.round(state.totalCorrect / state.totalAnswered * 100)
        : null;
      return { name, caught, totalBattles: state.totalBattles, acc };
    });
  }
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
    // 從未捕獲中隨機選野生寶可夢
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
// CLASS: UIManager — 頁面切換、渲染、Modal
// ============================================================
class UIManager {
  constructor(session, battle, audio) {
    this.session = session;
    this.battle = battle;
    this.audio = audio;
    this._bindAll();
  }

  // -------- 頁面路由 --------
  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0, 0);
  }

  // -------- 星空背景 --------
  createStars() {
    const container = document.getElementById('stars');
    for (let i = 0; i < 40; i++) {
      const s = document.createElement('div'); s.className = 'star';
      const size = Math.random() * 2 + 1;
      s.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;top:${Math.random()*100}%;--dur:${2+Math.random()*3}s;--delay:${Math.random()*3}s;`;
      container.appendChild(s);
    }
  }

  // -------- 精靈動畫 --------
  animateSprite(id, anim) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('bounce', 'shake');
    void el.offsetWidth;
    el.classList.add(anim);
    el.addEventListener('animationend', () => el.classList.remove(anim), { once: true });
  }

  // -------- 主畫面更新 --------
  refreshHome() {
    const s = this.session;
    document.getElementById('trainer-info-tag').textContent = `🎯 訓練員: ${s.currentName}`;
    document.getElementById('partner-label-text').textContent = `🌟 ${s.currentName} 的伴侶`;

    const partnerData = ALL_POKEMONS.find(p => p.id === s.state.partnerId);
    const partnerName = partnerData?.name || '皮卡丘';
    document.getElementById('partner-sprite').src = getSprite(s.state.partnerId);
    document.getElementById('partner-name').textContent = partnerName;

    this._renderPokedex();
    this._updateStats();
  }

  _renderPokedex() {
    const grid = document.getElementById('pokedex-grid');
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
    document.getElementById('stat-caught').textContent = `${s.getCaughtCount()} / ${TOTAL}`;
    document.getElementById('stat-battles').textContent = s.state.totalBattles;
    const acc = s.getAccuracy();
    document.getElementById('stat-acc').textContent = acc !== null ? acc + '%' : '-%';
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
    this.animateSprite('partner-sprite', 'bounce');
  }

  // -------- 對戰畫面 --------
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
    document.getElementById('energy-fill').style.width = pct + '%';
    document.getElementById('energy-pct').textContent = pct + '%';
  }

  _renderChips(results) {
    const container = document.getElementById('score-chips');
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
          flash.classList.add('flash');
          setTimeout(() => flash.classList.remove('flash'), 600);
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

  // -------- 所有玩家 Modal --------
  showPlayersModal() {
    const modal = document.getElementById('players-modal');
    const body = document.getElementById('modal-body');
    body.innerHTML = '';

    const players = this.session.getAllPlayersData();

    if (players.length === 0) {
      body.innerHTML = '<div class="modal-empty">📭 尚無任何訓練員紀錄</div>';
    } else {
      players.forEach(p => {
        const card = document.createElement('div');
        card.className = 'player-card';
        const accText = p.acc !== null ? p.acc + '%' : '-%';
        card.innerHTML = `
          <div class="player-avatar">🎯</div>
          <div class="player-info">
            <div class="player-name">${this._esc(p.name)}</div>
            <div class="player-stats-mini">
              <span class="player-stat-badge highlight">📖 ${p.caught} / ${TOTAL} 隻</span>
              <span class="player-stat-badge">⚔️ ${p.totalBattles} 次</span>
              <span class="player-stat-badge">🎯 ${accText}</span>
            </div>
          </div>
          <button class="btn-quick-login" data-name="${this._esc(p.name)}">▶ 登入</button>
        `;
        body.appendChild(card);
      });

      body.querySelectorAll('.btn-quick-login').forEach(btn => {
        btn.addEventListener('click', () => {
          const name = btn.dataset.name;
          this.hidePlayersModal();
          this._quickLogin(name);
        });
      });
    }

    modal.classList.add('active');
  }

  hidePlayersModal() {
    document.getElementById('players-modal').classList.remove('active');
  }

  _quickLogin(name) {
    document.getElementById('trainer-name-input').value = name;
    this.session.login(name);
    this.refreshHome();
    this.showScreen('home-screen');
  }

  _esc(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // -------- 事件綁定 --------
  _bindAll() {
    // 登入
    document.getElementById('btn-login-submit').addEventListener('click', () => {
      this.audio.unlock();
      this._doLogin();
    });
    document.getElementById('trainer-name-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') { this.audio.unlock(); this._doLogin(); }
    });

    // 查看所有玩家
    document.getElementById('btn-view-all-scores').addEventListener('click', () => this.showPlayersModal());
    document.getElementById('modal-close').addEventListener('click', () => this.hidePlayersModal());
    document.getElementById('players-modal').addEventListener('click', e => {
      if (e.target === document.getElementById('players-modal')) this.hidePlayersModal();
    });

    // 主畫面
    document.getElementById('btn-switch-user').addEventListener('click', () => {
      document.getElementById('trainer-name-input').value = this.session.currentName === '玩家' ? '' : this.session.currentName;
      this.showScreen('login-screen');
    });
    document.getElementById('btn-change-partner').addEventListener('click', () => this.changePartnerRandom());
    document.getElementById('btn-start').addEventListener('click', () => {
      this.audio.unlock();
      this.startBattle();
    });

    // 對戰
    document.getElementById('btn-quit').addEventListener('click', () => {
      this.battle.stopTimer();
      this.refreshHome();
      this.showScreen('home-screen');
    });

    // 結果
    document.getElementById('btn-retry').addEventListener('click', () => this.startBattle());
    document.getElementById('btn-home').addEventListener('click', () => {
      this.refreshHome();
      this.showScreen('home-screen');
    });
  }

  _doLogin() {
    let val = document.getElementById('trainer-name-input').value.trim();
    if (!val) val = '玩家';
    this.session.login(val);
    this.refreshHome();
    this.showScreen('home-screen');
  }
}

// ============================================================
// 初始化
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const session = new PlayerSessionManager();
  const battle = new BattleEngine();
  const audio = new AudioEngine();
  const ui = new UIManager(session, battle, audio);

  ui.createStars();

  // 自動填入上次登入的訓練員名字
  const last = GameDataManager.getLastTrainer();
  if (last && last !== '玩家') {
    document.getElementById('trainer-name-input').value = last;
  }

  ui.showScreen('login-screen');
});
