import { useState, useEffect, useRef, useCallback } from "react";

/* ══════════════════════════════════════════════
   CONFIG
══════════════════════════════════════════════ */
const GAME_ID = "hamster-math";
const API_LOGIN = "/api/auth-login";
const API_SAVE  = "/api/save-score";
const IMG = "hamster-math/images/";
const SFX = "hamster-math/audio/";
const TIMER_SEC = 3;
const REVIEW_AFTER = [5, 10, 20];
const CIRC = 2 * Math.PI * 52;

const FURNITURE = [
  { score:  20, name:"飲水器", file:"20-water.jpg",   pct:22, top:"6%",  left:"74%" },
  { score:  50, name:"食物碗", file:"50-food.png",    pct:18, top:"72%", left:"38%" },
  { score: 100, name:"木頭塊", file:"100-wood.png",   pct:14, top:"68%", left:"16%" },
  { score: 150, name:"小床",   file:"150-bed.png",    pct:30, top:"52%", left:"44%" },
  { score: 200, name:"浴盆",   file:"200-bath.png",   pct:34, top:"44%", left:"55%" },
  { score: 250, name:"椅子",   file:"250-chair.png",  pct:22, top:"44%", left:"68%" },
  { score: 300, name:"滾輪",   file:"300-wheel.png",  pct:34, top:"32%", left:"26%" },
  { score: 400, name:"隧道",   file:"400-tunnel.png", pct:42, top:"6%",  left:"15%" },
  { score: 500, name:"小屋",   file:"500-house.png",  pct:54, top:"2%",  left:"2%"  },
  { score: 600, name:"玩具",   file:"600-toy.png",    pct:34, top:"32%", left:"72%" },
  { score: 700, name:"大樹",   file:"700-tree.png",   pct:46, top:"1%",  left:"60%" },
  { score: 800, name:"小車",   file:"800-car.png",    pct:42, top:"68%", left:"2%"  },
];

const DIALOGS = ["Zzz...", "I'm hungry!", "So thirsty!",
  "數學真好玩！", "快來跟我一起答題！", "加油加油！", "你好棒喔！"];

const QUIPS = ["✅ 答對！太厲害！","🎯 正確！繼續！","⚡ 閃電速度！",
  "🌟 完美！","🔥 熱起來了！","💪 加分！"];

const MSGS = {
  basic:    ["太棒了！倉鼠獲得了新家具，牠住得更舒服囉！",
             "哇！新家具到貨！倉鼠開心地跑來跑去！",
             "答題神準！倉鼠的家又升級！"],
  advanced: ["數學直覺越來越強！倉鼠的家超豪華！",
             "連續答對讓裝潢升級，你是天才！"],
  ultimate: ["任務達成！五星級豪華別墅開放！你是最強室內設計師！",
             "傳說級大師！夢幻莊園完工，全村倉鼠都羨慕！"],
};

/* ══════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════ */
function playSound(type) {
  const map = { correct:"correct.mp3", wrong:"wrong.mp3",
    unlock:"unlock.mp3", timer:"timer.mp3", final:"final.mp3" };
  if (!map[type]) return;
  try { new Audio(SFX + map[type]).play().catch(() => {}); } catch(e) {}
}

function rnd(n) { return Math.floor(Math.random() * n); }
function pick(arr) { return arr[rnd(arr.length)]; }

/* ══════════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════════ */
export default function App() {
  // "login" | "menu" | "quiz" | "home"
  const [page, setPage] = useState("login");
  const [auth, setAuth] = useState({ name:"", token:"" });
  const [gameData, setGameData] = useState({
    score: 0, unlocked: [], mistakes: [], pending: []
  });
  const [congrats, setCongrats] = useState(null); // null | furniture config

  function saveGame(data) {
    if (!auth.token) return;
    fetch(API_SAVE, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        trainerName: auth.name, gameId: GAME_ID, token: auth.token,
        gameData: { score: data.score, unlocked: data.unlocked, mistakes: data.mistakes },
      }),
    }).catch(e => console.warn("save err", e));
  }

  function onLogin(name, token, raw) {
    const d = raw || {};
    const loaded = {
      score:    Number(d.score || d.totalCorrect || 0),
      unlocked: d.unlocked || d.unlockedScores || [],
      mistakes: d.mistakes || d.mistakeQueue   || [],
      pending:  [],
    };
    setAuth({ name, token });
    setGameData(loaded);
    setPage("menu");
  }

  function exitQuiz(updatedData) {
    saveGame(updatedData);
    setGameData(updatedData);
    setPage("menu");
  }

  function onUnlock(f, updatedData) {
    setGameData(updatedData);
    setCongrats(f);
  }

  return (
    <div style={{ fontFamily:"'Nunito','Baloo 2',sans-serif", minHeight:"100vh",
      background:"#FFF9F0", color:"#2D2D2D" }}>

      {page === "login" && <LoginPage onLogin={onLogin} />}
      {page === "menu"  && (
        <MenuPage
          name={auth.name}
          gameData={gameData}
          onGoQuiz={() => setPage("quiz")}
          onGoHome={() => setPage("home")}
        />
      )}
      {page === "quiz" && (
        <QuizPage
          auth={auth}
          gameData={gameData}
          onExit={exitQuiz}
          onUnlock={onUnlock}
          saveGame={saveGame}
        />
      )}
      {page === "home" && (
        <HomePage
          gameData={gameData}
          onBack={() => setPage("menu")}
        />
      )}

      {congrats && (
        <CongratsOverlay
          furniture={congrats}
          onClose={() => { setCongrats(null); }}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   LOGIN PAGE
══════════════════════════════════════════════ */
function LoginPage({ onLogin }) {
  const [name, setName] = useState("");
  const [pw,   setPw]   = useState("");
  const [err,  setErr]  = useState("");
  const [busy, setBusy] = useState(false);

  async function doLogin() {
    setErr("");
    if (!name.trim() || !pw) { setErr("請輸入名字與密碼！"); return; }
    if (pw.length < 6) { setErr("密碼至少需要 6 個字！"); return; }
    setBusy(true);
    try {
      const res = await fetch(API_LOGIN, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          trainerName: name.trim(), password: pw, gameId: GAME_ID,
          defaultData: { score:0, unlocked:[], mistakes:[] },
        }),
      });
      const data = await res.json();
      if (!data.success) { setErr(data.message || "登入失敗！"); setBusy(false); return; }
      onLogin(name.trim(), data.token, data.data);
    } catch(e) {
      setErr("網路錯誤，請稍後再試。"); setBusy(false);
    }
  }

  const onKey = e => { if (e.key === "Enter") doLogin(); };

  return (
    <div style={{
      minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:"linear-gradient(135deg,#FFD166,#FF6B35 55%,#FF6BA8)",
      position:"relative", overflow:"hidden",
    }}>
      {/* blobs */}
      {[
        {w:320,h:320,top:-90,left:-90,bg:"rgba(255,255,255,.15)"},
        {w:200,h:200,bottom:-60,right:-60,bg:"rgba(255,255,255,.15)"},
        {w:150,h:150,top:"40%",left:"70%",bg:"rgba(155,93,229,.2)"},
      ].map((b,i) => (
        <div key={i} style={{
          position:"absolute", borderRadius:"50%",
          width:b.w, height:b.h, background:b.bg,
          top:b.top, left:b.left, bottom:b.bottom, right:b.right,
        }}/>
      ))}

      <div style={{
        background:"#fff", borderRadius:28, padding:"40px 46px",
        width:380, maxWidth:"93vw", textAlign:"center",
        boxShadow:"0 20px 60px rgba(0,0,0,.22)", position:"relative", zIndex:1,
      }}>
        <div style={{ fontSize:64, animation:"bounce 2s ease-in-out infinite" }}>🐹</div>
        <h1 style={{ fontFamily:"'Baloo 2',sans-serif", fontSize:"1.8rem",
          fontWeight:800, color:"#FF6B35", margin:"8px 0 4px" }}>倉鼠數學訓練營</h1>
        <p style={{ fontSize:".88rem", color:"#999", marginBottom:24 }}>
          練好數學，幫倉鼠佈置夢幻豪宅！
        </p>
        <Field label="訓練師名字" value={name} onChange={setName}
          placeholder="你的名字" onKey={onKey} />
        <Field label="密碼（至少 6 位）" value={pw} onChange={setPw}
          placeholder="密碼" type="password" onKey={onKey} />
        <BigBtn onClick={doLogin} disabled={busy} gradient="linear-gradient(135deg,#FF6B35,#FF6BA8)">
          {busy ? "登入中…" : "出發！🚀"}
        </BigBtn>
        {err && <p style={{ color:"#e74c3c", fontSize:".83rem", fontWeight:700, marginTop:8 }}>{err}</p>}
      </div>
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}`}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MENU PAGE
══════════════════════════════════════════════ */
function MenuPage({ name, gameData, onGoQuiz, onGoHome }) {
  const { score, unlocked, mistakes, pending } = gameData;
  const queueLen = mistakes.length + pending.length;

  return (
    <div style={{
      minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      background:"linear-gradient(160deg,#fff8e7,#e8f9f4)",
    }}>
      <div style={{
        width:"100%", maxWidth:420, padding:"32px 24px",
        display:"flex", flexDirection:"column", alignItems:"center", gap:20,
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%" }}>
          <span style={{ fontSize:"1rem", fontWeight:800, color:"#FF6B35" }}>🐹 {name}，你好！</span>
          <ScoreChip>{score}</ScoreChip>
        </div>

        <div style={{ fontSize:80 }}>🐹</div>
        <h2 style={{ fontFamily:"'Baloo 2',sans-serif", fontSize:"1.5rem",
          fontWeight:800, color:"#2D2D2D" }}>今天要做什麼？</h2>

        <div style={{ display:"flex", flexDirection:"column", gap:14, width:"100%" }}>
          <MenuBtn
            gradient="linear-gradient(135deg,#06D6A0,#118AB2)"
            onClick={onGoQuiz}
            sub={`錯題複習：${queueLen} 題`}
          >✏️ 開始答題！</MenuBtn>

          <MenuBtn
            gradient="linear-gradient(135deg,#FFD166,#FF6B35)"
            onClick={onGoHome}
            sub={`已解鎖 ${unlocked.length} / ${FURNITURE.length} 件家具`}
          >🏠 查看小倉鼠的家</MenuBtn>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   QUIZ PAGE
══════════════════════════════════════════════ */
function QuizPage({ auth, gameData, onExit, onUnlock, saveGame }) {
  const [data,    setData]    = useState(() => ({ ...gameData, pending: [...(gameData.pending||[])] }));
  const [qCount,  setQCount]  = useState(0);
  const [question,setQuestion]= useState(null);
  const [answer,  setAnswer]  = useState("");
  const [fb,      setFb]      = useState(null);   // null | {ok, text}
  const [hamState,setHamState]= useState("idle"); // idle|happy|sad
  const [timeLeft,setTimeLeft]= useState(TIMER_SEC);
  const [isReview,setIsReview]= useState(false);
  const [waiting, setWaiting] = useState(false);

  const timerRef   = useRef(null);
  const inputRef   = useRef(null);
  const dataRef    = useRef(data);
  const qCountRef  = useRef(qCount);
  const waitingRef = useRef(waiting);

  // keep refs in sync
  useEffect(() => { dataRef.current    = data;    }, [data]);
  useEffect(() => { qCountRef.current  = qCount;  }, [qCount]);
  useEffect(() => { waitingRef.current = waiting; }, [waiting]);

  const stopTimer = useCallback(() => { clearInterval(timerRef.current); }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    setTimeLeft(TIMER_SEC);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        const next = t - 1;
        if (next <= 0) {
          clearInterval(timerRef.current);
          // timeout handled in effect below
        }
        if (next === 1) playSound("timer");
        return next;
      });
    }, 1000);
  }, [stopTimer]);

  // handle timeout
  useEffect(() => {
    if (timeLeft <= 0 && waitingRef.current) {
      handleTimeout();
    }
  }, [timeLeft]);

  // generate next question
  const nextQuestion = useCallback(() => {
    stopTimer();
    setFb(null);
    setAnswer("");

    const d = dataRef.current;
    const qc = qCountRef.current + 1;
    setQCount(qc);

    // process due reviews
    const due = d.mistakes.filter(q => q.dueAfter <= qc);
    let newMistakes = d.mistakes.filter(q => q.dueAfter > qc);
    let newPending  = [...d.pending];
    if (due.length) {
      newPending.push(due[0]);
      for (let i = 1; i < due.length; i++) {
        due[i].dueAfter = qc + i;
        newMistakes.push(due[i]);
      }
    }

    let cq, rev;
    if (newPending.length) {
      const r = newPending.shift();
      cq  = { a: r.a, b: r.b, ans: r.a * r.b };
      rev = true;
    } else {
      const a = rnd(9)+1, b = rnd(9)+1;
      cq  = { a, b, ans: a*b };
      rev = false;
    }

    const updated = { ...d, mistakes: newMistakes, pending: newPending };
    setData(updated);
    setQuestion(cq);
    setIsReview(rev);
    setWaiting(true);
    setHamState("idle");
    startTimer();
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [stopTimer, startTimer]);

  // start first question
  useEffect(() => { nextQuestion(); return () => stopTimer(); }, []);

  function handleTimeout() {
    if (!waitingRef.current) return;
    setWaiting(false);
    playSound("wrong");
    setHamState("sad");
    const q = question;
    if (q) {
      setFb({ ok:false, text:`⏰ 時間到！答案是 ${q.ans}` });
      addMistakeLocal(q.a, q.b, false);
    }
    setTimeout(() => nextQuestion(), 1700);
  }

  function addMistakeLocal(a, b, reset) {
    const d = dataRef.current;
    let m = [...d.mistakes];
    const i = m.findIndex(q => q.a===a && q.b===b);
    if (i !== -1 && !reset) return;
    if (i !== -1) m.splice(i,1);
    const qc = qCountRef.current;
    REVIEW_AFTER.forEach(o => m.push({a,b,dueAfter:qc+o}));
    setData(prev => ({...prev, mistakes:m}));
  }

  function submit() {
    if (!waitingRef.current || !question) return;
    const v = parseInt(answer, 10);
    if (isNaN(v)) return;
    setWaiting(false);
    stopTimer();
    if (v === question.ans) handleCorrect();
    else handleWrong();
  }

  function handleCorrect() {
    playSound("correct");
    setHamState("happy");
    setFb({ ok:true, text: pick(QUIPS) });
    const newScore = dataRef.current.score + 1;
    const newUnlocked = [...dataRef.current.unlocked];
    const newData = { ...dataRef.current, score: newScore, unlocked: newUnlocked };

    // check unlock
    let unlockedFurn = null;
    for (const f of FURNITURE) {
      if (newScore >= f.score && !newUnlocked.includes(f.score)) {
        newUnlocked.push(f.score);
        unlockedFurn = f;
        const tier = FURNITURE.indexOf(f) >= FURNITURE.length-2 ? "ultimate"
                   : FURNITURE.indexOf(f) >= Math.floor(FURNITURE.length/2) ? "advanced" : "basic";
        playSound(f.score >= 800 ? "final" : "unlock");
        setTimeout(() => onUnlock(f, { ...newData, unlocked: newUnlocked }), 300);
        break;
      }
    }

    setData({ ...newData, unlocked: newUnlocked });
    saveGame({ ...newData, unlocked: newUnlocked });
    setTimeout(() => nextQuestion(), 950);
  }

  function handleWrong() {
    playSound("wrong");
    setHamState("sad");
    setFb({ ok:false, text:`❌ 答案是 ${question.ans}，再努力！` });
    addMistakeLocal(question.a, question.b, question?.isReview);
    setTimeout(() => nextQuestion(), 1700);
  }

  function doExit() {
    stopTimer();
    onExit(dataRef.current);
  }

  const queueLen = data.mistakes.length + data.pending.length;
  const offset   = CIRC * (1 - timeLeft / TIMER_SEC);

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column",
      background:"radial-gradient(ellipse at 30% 0%,rgba(255,107,53,.15),transparent 50%),radial-gradient(ellipse at 80% 100%,rgba(155,93,229,.12),transparent 50%),#FFF9F0" }}>

      {/* Bar */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"10px 18px", background:"#fff", boxShadow:"0 2px 14px rgba(0,0,0,.12)", gap:10 }}>
        <ScoreChip>{data.score}</ScoreChip>
        {isReview && (
          <span style={{ background:"#9B5DE5", color:"#fff", padding:"4px 14px",
            borderRadius:50, fontSize:".8rem", fontWeight:800 }}>🔄 複習</span>
        )}
        <button onClick={doExit} style={{
          background:"#FF6B35", color:"#fff", border:"none", borderRadius:10,
          padding:"7px 14px", fontSize:".85rem", fontWeight:700, cursor:"pointer",
        }}>💾 退出</button>
      </div>

      {/* Body */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center",
        justifyContent:"center", gap:18, padding:"20px 16px", maxWidth:460, margin:"0 auto", width:"100%" }}>

        {/* Hamster */}
        <div style={{ fontSize: hamState==="happy" ? "5rem" : "4rem",
          transition:"font-size .2s",
          animation: hamState==="happy" ? "hamHappy .4s ease-in-out 3"
                   : hamState==="sad"   ? "hamSad .45s ease-in-out 1" : "none",
        }}>🐹</div>

        {/* Timer */}
        <div style={{ position:"relative", width:110, height:110 }}>
          <svg style={{ width:"100%", height:"100%", transform:"rotate(-90deg)" }} viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#EEE" strokeWidth="10"/>
            <circle cx="60" cy="60" r="52" fill="none"
              stroke={timeLeft <= 1 ? "#FF4757" : timeLeft <= 2 ? "#FFD166" : "#06D6A0"}
              strokeWidth="10" strokeLinecap="round"
              strokeDasharray={CIRC} strokeDashoffset={offset}
              style={{ transition:"stroke-dashoffset 1s linear, stroke .3s" }}/>
          </svg>
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center",
            justifyContent:"center", fontFamily:"'Baloo 2',sans-serif",
            fontSize:"2.2rem", fontWeight:800 }}>{timeLeft}</div>
        </div>

        {/* Question */}
        <div style={{ background:"#fff", borderRadius:18, padding:"20px 36px", width:"100%",
          textAlign:"center", boxShadow:"0 6px 24px rgba(0,0,0,.12)", border:"3px solid #FFD166" }}>
          <div style={{ fontFamily:"'Baloo 2',sans-serif", fontSize:"clamp(2rem,7vw,2.8rem)",
            fontWeight:800, letterSpacing:2 }}>
            {question ? `${question.a} × ${question.b} = ?` : "準備好了嗎？"}
          </div>
        </div>

        {/* Answer */}
        <div style={{ display:"flex", gap:10, width:"100%" }}>
          <input
            ref={inputRef}
            type="number" value={answer}
            onChange={e => setAnswer(e.target.value)}
            onKeyDown={e => { if(e.key==="Enter") submit(); }}
            placeholder="答案"
            style={{
              flex:1, padding:"13px 16px", border:"3px solid #DDD", borderRadius:14,
              fontSize:"1.5rem", fontFamily:"'Baloo 2',sans-serif", fontWeight:800,
              textAlign:"center", outline:"none", background:"#fff",
            }}
          />
          <button onClick={submit} style={{
            background:"linear-gradient(135deg,#118AB2,#9B5DE5)", color:"#fff",
            border:"none", borderRadius:14, padding:"13px 20px", fontSize:"1.4rem",
            cursor:"pointer", fontWeight:800,
          }}>✔</button>
        </div>

        {/* Feedback */}
        {fb && (
          <div style={{
            padding:"10px 20px", borderRadius:14, fontSize:".95rem", fontWeight:800,
            textAlign:"center", width:"100%",
            background: fb.ok ? "rgba(6,214,160,.14)" : "rgba(255,71,87,.11)",
            color:       fb.ok ? "#049870"             : "#d40019",
            border:`2px solid ${fb.ok ? "#06D6A0" : "#FF4757"}`,
          }}>{fb.text}</div>
        )}

        <div style={{ fontSize:".82rem", fontWeight:700, color:"#aaa" }}>
          錯題隊列：<span style={{ background:"#9B5DE5", color:"#fff",
            borderRadius:99, padding:"1px 9px", fontWeight:800 }}>{queueLen}</span> 題
        </div>
      </div>

      <style>{`
        @keyframes hamHappy{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px) scale(1.1)}}
        @keyframes hamSad{0%,100%{transform:rotate(0)}40%{transform:rotate(-20deg)}}
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════
   HOME PAGE
══════════════════════════════════════════════ */
function HomePage({ gameData, onBack }) {
  const { score, unlocked } = gameData;
  const hamRef   = useRef(null);
  const walkRef  = useRef(null);
  const dialRef  = useRef(null);
  const [bubble, setBubble] = useState("");
  const [showBubble, setShowBubble] = useState(false);

  function moveHamster() {
    if (!hamRef.current) return;
    const newL = 5 + Math.random() * 70;
    const newB = 5 + Math.random() * 25;
    hamRef.current.style.left   = newL + "%";
    hamRef.current.style.bottom = newB + "%";
  }

  function showDialog() {
    setBubble(pick(DIALOGS));
    setShowBubble(true);
    setTimeout(() => setShowBubble(false), 3500);
  }

  useEffect(() => {
    moveHamster();
    walkRef.current = setInterval(moveHamster, 3500);
    dialRef.current = setInterval(showDialog, 9000);
    return () => { clearInterval(walkRef.current); clearInterval(dialRef.current); };
  }, []);

  return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column",
      background:"radial-gradient(ellipse at 0 0,rgba(255,209,102,.25),transparent 55%),radial-gradient(ellipse at 100% 100%,rgba(6,214,160,.18),transparent 55%),#FFF9F0" }}>

      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"10px 18px", background:"#fff", boxShadow:"0 2px 14px rgba(0,0,0,.12)" }}>
        <ScoreChip>{score}</ScoreChip>
        <button onClick={onBack} style={{
          background:"#06D6A0", color:"#fff", border:"none", borderRadius:10,
          padding:"7px 14px", fontSize:".85rem", fontWeight:700, cursor:"pointer",
        }}>← 返回</button>
      </div>

      <div style={{ flex:1, display:"flex", gap:16, padding:16,
        maxWidth:1080, margin:"0 auto", width:"100%", alignItems:"flex-start" }}>

        {/* Cage */}
        <div style={{ flex:"1 1 0", minWidth:0 }}>
          <div style={{
            position:"relative", width:"100%", paddingBottom:"75%", /* 4:3 */
            borderRadius:18, overflow:"hidden",
            boxShadow:"0 12px 44px rgba(0,0,0,.18)", border:"4px solid #FFD166",
            background:"#c8d8a0",
          }}>
            <div style={{ position:"absolute", inset:0 }}>
              {/* Cage background */}
              <img src={`${IMG}cage.jpg`} alt="cage"
                style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }}
                onError={e => e.target.style.display="none"}
              />

              {/* Furniture overlays */}
              {FURNITURE.map(f => {
                if (!unlocked.includes(f.score)) return null;
                return (
                  <div key={f.score} style={{
                    position:"absolute", top:f.top, left:f.left, width:f.pct+"%",
                    transformOrigin:"bottom center",
                  }}>
                    <img src={`${IMG}${f.file}`} alt={f.name}
                      style={{ width:"100%", height:"auto", display:"block" }}
                      onError={e => e.target.style.display="none"}
                    />
                  </div>
                );
              })}

              {/* Hamster */}
              <div ref={hamRef} style={{
                position:"absolute", width:"20%", bottom:"8%", left:"10%",
                display:"flex", flexDirection:"column", alignItems:"center",
                transition:"left 2.4s cubic-bezier(.45,.05,.55,.95), bottom 2.4s cubic-bezier(.45,.05,.55,.95)",
                zIndex:20,
              }}>
                {showBubble && (
                  <div style={{
                    background:"#fff", border:"2.5px solid #FFD166", borderRadius:12,
                    padding:"4px 12px", fontSize:".8rem", fontWeight:700, color:"#FF6B35",
                    textAlign:"center", marginBottom:5, whiteSpace:"nowrap",
                    position:"relative",
                  }}>
                    {bubble}
                    <div style={{
                      position:"absolute", bottom:-7, left:"50%", transform:"translateX(-50%)",
                      borderWidth:4, borderStyle:"solid",
                      borderColor:"#FFD166 transparent transparent transparent",
                    }}/>
                  </div>
                )}
                <img src={`${IMG}hamster.png`} alt="hamster"
                  style={{ width:"100%", height:"auto", display:"block" }}
                  onError={e => { e.target.style.display="none";
                    e.target.parentNode.querySelector(".ham-emoji").style.display="block"; }}
                />
                <span className="ham-emoji" style={{ fontSize:"3rem", display:"none" }}>🐹</span>
              </div>

              {/* Final overlay */}
              {score >= 800 && (
                <div style={{
                  position:"absolute", inset:0, zIndex:40,
                  background:"rgba(0,0,0,.58)", backdropFilter:"blur(4px)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                }}>
                  <div style={{ textAlign:"center", color:"#fff" }}>
                    <div style={{ fontSize:"clamp(3rem,8vw,6rem)" }}>🏆</div>
                    <div style={{ fontFamily:"'Baloo 2',sans-serif",
                      fontSize:"clamp(1.6rem,5vw,3rem)", fontWeight:800, color:"#FFD166" }}>
                      恭喜通關！
                    </div>
                    <div style={{ marginTop:8, fontWeight:700 }}>你是倉鼠最強室內設計師！</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Furniture list */}
        <div style={{
          width:210, flexShrink:0, background:"#fff", borderRadius:18,
          padding:16, boxShadow:"0 4px 18px rgba(0,0,0,.12)",
          display:"flex", flexDirection:"column", gap:10,
          maxHeight:"calc(100vh - 100px)", overflow:"hidden",
        }}>
          <div style={{ fontSize:".9rem", fontWeight:800, color:"#118AB2" }}>🏡 家具圖鑑</div>
          <div style={{ overflowY:"auto", display:"flex", flexDirection:"column", gap:6 }}>
            {FURNITURE.map(f => {
              const done = unlocked.includes(f.score);
              return (
                <div key={f.score} style={{
                  display:"flex", alignItems:"center", gap:8, padding:"6px 8px",
                  borderRadius:10, fontSize:".78rem", fontWeight:700,
                  background: done ? "rgba(255,209,102,.18)" : "#F4F4F4",
                  border:     done ? "1.5px solid #FFD166"   : "1.5px solid transparent",
                  color:      done ? "#2D2D2D" : "#BBB",
                }}>
                  <img src={`${IMG}${f.file}`} alt={f.name}
                    style={{ width:34, height:34, objectFit:"contain", borderRadius:6,
                      filter: done ? "none" : "grayscale(1) opacity(.3)" }}
                    onError={e => e.target.style.display="none"}
                  />
                  <div style={{ display:"flex", flexDirection:"column", gap:1, minWidth:0 }}>
                    <div style={{ fontWeight:800, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{f.name}</div>
                    <div style={{ fontSize:".68rem", color: done ? "#06D6A0" : "#BBB" }}>
                      {done ? "✅ 已解鎖" : `🔒 ${f.score} 題`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   CONGRATS OVERLAY
══════════════════════════════════════════════ */
function CongratsOverlay({ furniture, onClose }) {
  const tier = FURNITURE.indexOf(furniture) >= FURNITURE.length-2 ? "ultimate"
             : FURNITURE.indexOf(furniture) >= Math.floor(FURNITURE.length/2) ? "advanced" : "basic";
  const msg = pick(MSGS[tier]);
  const pieces = Array.from({length:44}, (_,i) => ({
    id:i,
    left: Math.random()*100,
    color: ["#FF6B35","#FFD166","#06D6A0","#118AB2","#FF6BA8","#9B5DE5"][rnd(6)],
    size:  6+Math.random()*8,
    dur:   .8+Math.random()*1.2,
    delay: Math.random()*.5,
    round: Math.random()>.5,
  }));

  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,.55)",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:200, backdropFilter:"blur(5px)",
    }}>
      <div style={{
        background:"#fff", borderRadius:28, padding:"34px 40px",
        textAlign:"center", maxWidth:400, width:"93vw",
        boxShadow:"0 28px 70px rgba(0,0,0,.24)",
        position:"relative", overflow:"hidden",
      }}>
        {/* Confetti */}
        {pieces.map(p => (
          <div key={p.id} style={{
            position:"absolute", left:`${p.left}%`, top:-10,
            width:p.size, height:p.size, background:p.color,
            borderRadius: p.round ? "50%" : 3,
            animation:`confettiFall ${p.dur}s ${p.delay}s linear both`,
            pointerEvents:"none",
          }}/>
        ))}

        <div style={{
          fontFamily:"'Baloo 2',sans-serif", fontSize:"1.9rem", fontWeight:800,
          background:"linear-gradient(135deg,#FF6B35,#FF6BA8,#9B5DE5)",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
        }}>🎉 Congrats! 🎉</div>

        <div style={{ fontSize:"3.2rem", margin:"8px 0",
          animation:"cHam .6s ease-in-out infinite alternate" }}>🐹</div>

        <img src={`${IMG}${furniture.file}`} alt={furniture.name}
          style={{ height:72, objectFit:"contain", margin:"4px 0",
            animation:"cFurn 1s ease-in-out infinite alternate" }}
          onError={e => e.target.style.display="none"}
        />

        <p style={{ fontSize:".92rem", fontWeight:700, color:"#2D2D2D",
          margin:"10px 0 16px", lineHeight:1.5 }}>{msg}</p>

        <button onClick={onClose} style={{
          background:"linear-gradient(135deg,#FF6B35,#FF6BA8)", color:"#fff",
          border:"none", borderRadius:50, padding:"12px 36px",
          fontSize:"1.05rem", fontFamily:"'Nunito',sans-serif", fontWeight:800,
          cursor:"pointer", width:"100%",
          boxShadow:"0 6px 18px rgba(255,107,53,.35)",
        }}>繼續練習！</button>
      </div>
      <style>{`
        @keyframes confettiFall{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(420px) rotate(720deg) scale(.5);opacity:0}}
        @keyframes cHam{from{transform:translateY(0) rotate(-10deg)}to{transform:translateY(-12px) rotate(10deg) scale(1.1)}}
        @keyframes cFurn{from{transform:rotate(-12deg) scale(.9)}to{transform:rotate(12deg) scale(1.1)}}
      `}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════
   SHARED UI COMPONENTS
══════════════════════════════════════════════ */
function ScoreChip({ children }) {
  return (
    <div style={{
      background:"linear-gradient(135deg,#FFD166,#FF6B35)", color:"#fff",
      borderRadius:50, padding:"5px 16px", fontWeight:800, fontSize:".9rem",
      boxShadow:"0 3px 10px rgba(255,107,53,.3)", whiteSpace:"nowrap",
      display:"flex", gap:4, alignItems:"center",
    }}>
      <span style={{ fontSize:".76rem" }}>答對</span>
      <span style={{ fontFamily:"'Baloo 2',sans-serif", fontSize:"1.1rem" }}>{children}</span>
      <span style={{ fontSize:".76rem" }}>題</span>
    </div>
  );
}

function MenuBtn({ children, gradient, onClick, sub }) {
  return (
    <button onClick={onClick} style={{
      background: gradient, color:"#fff", border:"none", borderRadius:20,
      padding:"20px 24px", fontFamily:"'Nunito',sans-serif", fontWeight:800,
      fontSize:"1.2rem", cursor:"pointer",
      display:"flex", flexDirection:"column", alignItems:"flex-start", gap:4,
      boxShadow:"0 6px 22px rgba(0,0,0,.12)",
      width:"100%", textAlign:"left",
      transition:"transform .15s, box-shadow .15s",
    }}
    onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px) scale(1.01)"; }}
    onMouseLeave={e => { e.currentTarget.style.transform=""; }}
    >
      {children}
      <span style={{ fontSize:".78rem", fontWeight:600, opacity:.85 }}>{sub}</span>
    </button>
  );
}

function BigBtn({ children, onClick, disabled, gradient }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: gradient, color:"#fff", border:"none", borderRadius:50,
      padding:"13px 36px", fontSize:"1.05rem", fontFamily:"'Nunito',sans-serif",
      fontWeight:800, cursor: disabled ? "not-allowed" : "pointer",
      width:"100%", marginTop:6, opacity: disabled ? .7 : 1,
      boxShadow:"0 6px 18px rgba(255,107,53,.35)",
    }}>{children}</button>
  );
}

function Field({ label, value, onChange, placeholder, type="text", onKey }) {
  return (
    <div style={{ textAlign:"left", marginBottom:16 }}>
      <label style={{ display:"block", fontWeight:700, fontSize:".82rem",
        color:"#118AB2", marginBottom:5 }}>{label}</label>
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)} onKeyDown={onKey}
        style={{
          width:"100%", padding:"11px 15px", border:"3px solid #EEE",
          borderRadius:12, fontSize:"1rem", fontFamily:"'Nunito',sans-serif",
          fontWeight:700, outline:"none", background:"#FAFAFA",
        }}
      />
    </div>
  );
}
