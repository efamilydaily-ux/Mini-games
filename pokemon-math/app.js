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
  102:'蛋蛋', 103:'椰蛋樹', 104:'卡拉卡拉', 105:'嘎啦嘎啦', 106:'飛腿郎',
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

// ============================================================
// CLASS: GameDataManager
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
// CLASS: BattleEngine (5秒挑戰)
// ============================================================
class BattleEngine {
  constructor() {
    this.duration = 5000; 
    this.timer = null;
    this.startTime = 0;
  }

  generateQuestion() {
    const isSub = Math.random() < 0.5;
    let a, b, answer, text;
    if (!isSub) {
      const unitA = Math.floor(Math.random() * 9) + 1; 
      const unitB = Math.floor(Math.random() * (10 - unitA)) + (10 - unitA); 
      const tensA = Math.floor(Math.random() * 8) + 1; 
      const tensB = Math.floor(Math.random() * (9 - tensA)) + 1; 
      a = tensA * 10 + unitA; b = tensB * 10 + unitB; answer = a + b;
      text = `${a} + ${b} = ?`;
    } else {
      const unitA = Math.floor(Math.random() * 9); 
      let unitB = Math.floor(Math.random() * 9) + 1; 
      if (unitA >= unitB) { unitB = unitA + 1 + Math.floor(Math.random() * (9 - unitA)); }
      const tensA = Math.floor(Math.random() * 7) + 3; 
      const tensB = Math.floor(Math.random() * (tensA - 1)) + 1; 
      a = tensA * 10 + unitA; b = tensB * 10 + unitB; answer = a - b;
      text = `${a} - ${b} = ?`;
    }
    const options = new Set([answer]);
    while (options.size < 4) {
      const offset = (Math.floor(Math.random() * 5) + 1) * (Math.random() < 0.5 ? 1 : -1);
      const fake = answer + offset;
      if (fake > 0 && fake < 200) options.add(fake);
    }
    return { text, answer, options: Array.from(options).sort((x, y) => x - y) };
  }

  startTimer(onTick, onTimeout) {
    this.stopTimer(); this.startTime = Date.now();
    const loop = () => {
      const elapsed = Date.now() - this.startTime;
      const remain = Math.max(0, this.duration - elapsed);
      if (onTick) onTick(remain / 1000);
      if (remain <= 0) { if (onTimeout) onTimeout(); }
      else { this.timer = requestAnimationFrame(loop); }
    };
    this.timer = requestAnimationFrame(loop);
  }

  stopTimer() { if (this.timer) { cancelAnimationFrame(this.timer); this.timer = null; } }
}

// ============================================================
// CLASS: AudioEngine
// ============================================================
class AudioEngine {
  constructor() { this.ctx = null; }
  unlock() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }
  play(type) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.ctx.destination); const now = this.ctx.currentTime;
    if (type === 'correct') {
      osc.frequency.setValueAtTime(523.25, now); osc.frequency.setValueAtTime(659.25, now + 0.08);
      gain.gain.setValueAtTime(0.1, now); osc.start(now); osc.stop(now + 0.25);
    } else if (type === 'wrong') {
      osc.frequency.setValueAtTime(180, now); osc.frequency.linearRampToValueAtTime(100, now + 0.2);
      gain.gain.setValueAtTime(0.1, now); osc.start(now); osc.stop(now + 0.25);
    } else if (type === 'capture') {
      osc.frequency.setValueAtTime(440, now); osc.frequency.setValueAtTime(880, now + 0.18);
      gain.gain.setValueAtTime(0.12, now); osc.start(now); osc.stop(now + 0.4);
    }
  }
}

// ============================================================
// CLASS: UIManager (美化排版、注入 10 題對 8 題邏輯)
// ============================================================
class UIManager {
  constructor(session, battle, audio) {
    this.session = session; this.battle = battle; this.audio = audio;
    this.currentQuestion = null; this.score = 0; this.qCount = 0; this.cCount = 0;
    this.spriteBase = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';
    this._bindAll();
  }

  createStars() {
    const box = document.getElementById('stars'); if (!box) return; box.innerHTML = '';
    for (let i = 0; i < 40; i++) {
      const s = document.createElement('div'); s.className = 'star';
      s.style.left = Math.random() * 100 + '%'; s.style.top = Math.random() * 100 + '%';
      box.appendChild(s);
    }
  }

  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id); if (target) target.classList.add('active');
  }

  refreshHome() {
    document.getElementById('val-pokedex').textContent = `${this.session.getCaughtCount()} / ${TOTAL}`;
    document.getElementById('val-battles').textContent = this.session.state.totalBattles;
    const acc = this.session.getAccuracy();
    document.getElementById('val-accuracy').textContent = acc !== null ? acc + '%' : '-%';
    document.getElementById('home-partner-sprite').src = `${this.spriteBase}${this.session.state.partnerId}.png`;
    const nameEl = document.getElementById('trainer-name-display');
    if (nameEl) nameEl.textContent = `訓練員：${this.session.currentName}`;
  }

  changePartnerRandom() {
    const list = this.session.getCaughtIds(); if (list.length === 0) return;
    this.session.state.partnerId = list[Math.floor(Math.random() * list.length)];
    this.session.save(); this.refreshHome();
  }

  startBattle() {
    this.score = 0; this.qCount = 0; this.cCount = 0;
    document.getElementById('battle-score').textContent = '得分: 0';
    this.nextQuestion(); this.showScreen('battle-screen');
  }

  nextQuestion() {
    if (this.qCount >= 10) {
      this.endBattle();
      return;
    }

    this.qCount++;
    const scoreEl = document.getElementById('battle-score');
    if (scoreEl) scoreEl.textContent = `題目：${this.qCount} / 10 | 正確：${this.cCount}`;

    this.currentQuestion = this.battle.generateQuestion();
    const pool = this.session.getUncaughtPokemons();
    const wild = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : ALL_POKEMONS[Math.floor(Math.random() * TOTAL)];
    
    document.getElementById('enemy-sprite').src = `${this.spriteBase}${wild.id}.png`;
    document.getElementById('question-text').textContent = this.currentQuestion.text;

    // 💡 關鍵修正：將 'btn-ans' 改回你 HTML 本來的精美 Class 'btn-answer'！
    const btns = document.querySelectorAll('.btn-answer');
    this.currentQuestion.options.forEach((val, i) => {
      if (btns[i]) { 
        btns[i].textContent = val; 
        btns[i].className = 'btn-answer'; 
        btns[i].style.transform = 'none'; 
      }
    });

    this.battle.startTimer(
      (sec) => {
        document.getElementById('battle-time').textContent = sec.toFixed(1) + 's';
        document.getElementById('timer-fill').style.width = (sec / 5.0 * 100) + '%';
      },
      () => { 
        this.audio.play('wrong'); 
        this.nextQuestion(); 
      }
    );
  }

  handleAnswer(idx) {
    this.battle.stopTimer();
    const btns = document.querySelectorAll('.btn-answer');
    const selected = this.currentQuestion.options[idx];
    const isCorrect = (selected === this.currentQuestion.answer);

    btns.forEach((b, i) => {
      if (this.currentQuestion.options[i] === this.currentQuestion.answer) b.classList.add('correct');
      else if (i === idx && !isCorrect) b.classList.add('wrong');
    });

    if (isCorrect) {
      this.audio.play('correct'); this.score += 10; this.cCount++;
    } else { 
      this.audio.play('wrong'); 
    }
    
    setTimeout(() => this.nextQuestion(), 600);
  }

  async endBattle() {
    this.battle.stopTimer(); 
    this.session.recordBattle(this.cCount, this.qCount);
    
    document.getElementById('res-score').textContent = this.score;
    document.getElementById('res-details-count').textContent = `${this.cCount} / ${this.qCount}`;
    document.getElementById('res-details-acc').textContent = (this.qCount > 0 ? Math.round(this.cCount / this.qCount * 100) : 0) + '%';

    if (this.cCount >= 8) {
      const uncaught = this.session.getUncaughtPokemons();
      if (uncaught.length > 0) {
        const target = uncaught[Math.floor(Math.random() * uncaught.length)];
        this.session.addCaught(target.id);
        
        document.getElementById('capture-text').innerHTML = `太厲害了！答對 ${this.cCount} 題符合資格！<br><span style="color:#ffcb05; font-size:24px; font-weight:bold; text-shadow:2px 2px #3b4cca;">成功捕捉 ${target.name}！</span>`;
        document.getElementById('capture-sprite').src = `${this.spriteBase}${target.id}.png`;
        
        const overlay = document.getElementById('capture-overlay');
        if (overlay) {
          overlay.classList.add('active'); 
          this.audio.play('capture');
          setTimeout(() => { 
            overlay.classList.remove('active'); 
            this.showScreen('result-screen'); 
          }, 3200);
        }
        await this.session.save(); 
        return;
      }
    } else {
      const capText = document.getElementById('capture-text');
      if (capText) capText.innerHTML = `可惜！只答對了 ${this.cCount} 題。<br>需要答對 8 題以上才能捕捉喔！繼續加油！`;
    }
    
    await this.session.save(); 
    this.showScreen('result-screen');
  }

  showPokedex() {
    const grid = document.getElementById('pokedex-grid'); grid.innerHTML = '';
    ALL_POKEMONS.forEach(p => {
      const card = document.createElement('div'); const isC = this.session.isCaught(p.id);
      card.className = `dex-card ${isC ? 'caught' : 'missing'}`;
      card.innerHTML = `
        <div class="dex-num">#${String(p.id).padStart(3, '0')}</div>
        <img class="dex-img" src="${this.spriteBase}${p.id}.png" style="${isC ? '' : 'filter:brightness(0);'}">
        <div class="dex-name">${isC ? p.name : '???'}</div>
      `;
      grid.appendChild(card);
    });
    document.getElementById('dex-modal').classList.add('active');
  }

  _bindAll() {
    const loginBtn = document.getElementById('btn-login') || document.querySelector('.btn-login');
    if (loginBtn) {
      loginBtn.addEventListener('click', async () => {
        const name = document.getElementById('trainer-name-input').value.trim();
        const password = document.getElementById('trainer-password-input')?.value?.trim() || '';
        if (!name) { alert('請輸入訓練員名字！'); return; }
        if (!password) { alert('請輸入密碼！'); return; }

        const overlay = document.getElementById('loading-overlay') || document.querySelector('.loading-overlay');
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
          this.audio.unlock(); this.refreshHome(); this.showScreen('home-screen'); 
        }
      });
    }

    const switchBtn = document.getElementById('btn-switch-user');
    if (switchBtn) { switchBtn.addEventListener('click', () => { window.location.href = '../index.html'; }); }

    document.getElementById('btn-change-partner').addEventListener('click', () => this.changePartnerRandom());
    document.getElementById('btn-start').addEventListener('click', () => { this.audio.unlock(); this.startBattle(); });
    document.getElementById('btn-open-pokedex').addEventListener('click', () => this.showPokedex());
    document.getElementById('btn-close-dex').addEventListener('click', () => document.getElementById('dex-modal').classList.remove('active'));
    document.getElementById('dex-modal-overlay').addEventListener('click', () => document.getElementById('dex-modal').classList.remove('active'));

    // 💡 關鍵修正：原本綁定監聽事件的地方，也同步由 '.btn-ans' 改為 '.btn-answer'
    document.querySelectorAll('.btn-answer').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleAnswer(Number(e.currentTarget.dataset.idx)));
    });

    document.getElementById('btn-quit').addEventListener('click', () => { this.battle.stopTimer(); this.refreshHome(); this.showScreen('home-screen'); });
    document.getElementById('btn-retry').addEventListener('click', () => this.startBattle());
    document.getElementById('btn-home').addEventListener('click', () => { this.refreshHome(); this.showScreen('home-screen'); });
  }
}

// 頁面載入完成初始化
document.addEventListener('DOMContentLoaded', () => {
  const session = new PlayerSessionManager();
  const battle = new BattleEngine();
  const audio = new AudioEngine();
  const ui = new UIManager(session, battle, audio);

  ui.createStars();

  const overlay = document.getElementById('loading-overlay') || document.querySelector('.loading-overlay');
  if (overlay) overlay.style.display = 'none';

  const last = localStorage.getItem('pokemon_math_last_trainer');
  const input = document.getElementById('trainer-name-input');
  if (last && input) { input.value = last; }

  ui.showScreen('login-screen');
});
