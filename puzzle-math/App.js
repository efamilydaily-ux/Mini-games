/**
 * App.js
 * Main React component for 乘法神速賽 (Multiplication Blitz).
 *
 * Requires:
 *  - GameClient.js  (API layer)
 *  - GameLogic.js   (pure game logic)
 *  - style.css      (global styles)
 *  - audio/correct.mp3 & audio/wrong.mp3
 *  - images/puzzle_0.jpg … puzzle_9.jpg  (1920×1080)
 *
 * Puzzle rendering:
 *   The 12-cell grid uses CSS Grid (4 cols × 3 rows).
 *   Each cell is a <div class="puzzle-cell"> positioned over the puzzle image
 *   via background-position (nth-child offset).
 *   Cells in `unlockedIndices` get class "revealed"; others keep class "masked".
 *   The centre cell (index 5) stays masked until it is the last to unlock.
 *   On reveal, a brief "flash" animation plays via the "unlocking" class.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { gameClient } from './GameClient.js';
import {
  createDefaultGameData,
  generateQuestion,
  generateOptions,
  processAnswer,
  getUnlockedSet,
  puzzleProgress,
  scoreToNextCell,
  GAME_CONFIG,
  UNLOCK_ORDER,
} from './GameLogic.js';

// ─── Audio helpers ────────────────────────────────────────────────────────────

function playSound(src) {
  try {
    const audio = new Audio(src);
    audio.volume = 0.6;
    audio.play().catch(() => {});
  } catch (_) {}
}

// ─── Countdown hook ───────────────────────────────────────────────────────────

function useCountdown(seconds, onExpire) {
  const [remaining, setRemaining] = useState(seconds);
  const timerRef = useRef(null);

  const reset = useCallback(
    (newSeconds = seconds) => {
      clearInterval(timerRef.current);
      setRemaining(newSeconds);
      timerRef.current = setInterval(() => {
        setRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            onExpire();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [seconds, onExpire]
  );

  const stop = useCallback(() => clearInterval(timerRef.current), []);

  useEffect(() => () => clearInterval(timerRef.current), []);

  return { remaining, reset, stop };
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [name, setName] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !pass.trim()) {
      setError('請輸入名字與密碼');
      return;
    }
    if (pass.length < 6) {
      setError('密碼至少需要 6 個字元');
      return;
    }
    setLoading(true);
    setError('');

    const defaultData = createDefaultGameData();
    const result = await gameClient.login(name.trim(), pass, defaultData);

    setLoading(false);
    if (result.success) {
      onLogin(result.data || defaultData);
    } else {
      setError(result.message || '登入失敗，請再試一次');
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">✖</div>
        <h1 className="login-title">乘法神速賽</h1>
        <p className="login-subtitle">解鎖拼圖，挑戰極速乘法！</p>

        <div className="field-group">
          <label>訓練師名字</label>
          <input
            type="text"
            placeholder="輸入你的名字…"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>
        <div className="field-group">
          <label>密碼（至少 6 字）</label>
          <input
            type="password"
            placeholder="設定或輸入密碼…"
            value={pass}
            onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {error && <p className="login-error">{error}</p>}

        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? '連線中…' : '開始遊戲 →'}
        </button>
      </div>
    </div>
  );
}

// ─── Puzzle Grid ──────────────────────────────────────────────────────────────

/**
 * Renders a 4×3 CSS-grid puzzle over a background image.
 * Each cell uses background-position to show its slice of the image.
 * Revealed cells are transparent; masked cells show a dark overlay.
 *
 * backgroundImage: URL string like "images/puzzle_0.jpg"
 * unlockedSet: Set<number> of cell indices that are revealed
 * newlyUnlocked: Set<number> that just unlocked (for flash animation)
 */
function PuzzleGrid({ backgroundImage, unlockedSet, newlyUnlocked }) {
  const COLS = 4;
  const ROWS = 3;

  return (
    <div className="puzzle-grid">
      {Array.from({ length: COLS * ROWS }, (_, i) => {
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const revealed = unlockedSet.has(i);
        const flashing = newlyUnlocked.has(i);

        // background-position shifts the image slice into view
        const bpX = (col / (COLS - 1)) * 100;
        const bpY = (row / (ROWS - 1)) * 100;

        return (
          <div
            key={i}
            className={[
              'puzzle-cell',
              revealed ? 'revealed' : 'masked',
              flashing ? 'unlocking' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
              backgroundPosition: `${bpX}% ${bpY}%`,
            }}
          >
            {!revealed && <span className="mask-icon">🔒</span>}
          </div>
        );
      })}
    </div>
  );
}

// ─── Congrats Overlay ─────────────────────────────────────────────────────────

function CongratsOverlay({ puzzleIndex, onNext, onViewPuzzle }) {
  const isLast = puzzleIndex >= GAME_CONFIG.TOTAL_PUZZLES - 1;
  return (
    <div className="congrats-overlay">
      <div className="congrats-card">
        <div className="congrats-emoji">🎉</div>
        <h2>拼圖完成！</h2>
        <p>
          第 <strong>{puzzleIndex + 1}</strong> 幅圖解鎖完畢，你太厲害了！
        </p>
        <div className="congrats-actions">
          <button className="btn-secondary" onClick={onViewPuzzle}>
            欣賞拼圖
          </button>
          {!isLast && (
            <button className="btn-primary" onClick={onNext}>
              繼續挑戰 →
            </button>
          )}
          {isLast && (
            <p className="all-done">🏆 全部 10 幅拼圖已完成！你是乘法冠軍！</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

const COUNTDOWN_SECONDS = 3; // seconds per question

export default function App() {
  // ── Auth state ──────────────────────────────────────────────────────────────
  const [loggedIn, setLoggedIn] = useState(false);
  const [gameData, setGameData] = useState(null);

  // ── Question state ──────────────────────────────────────────────────────────
  const [question, setQuestion] = useState(null);
  const [options, setOptions] = useState([]);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong' | null
  const [selectedOption, setSelectedOption] = useState(null);
  const [locked, setLocked] = useState(false); // prevent double-tap

  // ── Puzzle animation state ───────────────────────────────────────────────────
  const [newlyUnlocked, setNewlyUnlocked] = useState(new Set());
  const [showCongrats, setShowCongrats] = useState(false);

  // ── Save status ─────────────────────────────────────────────────────────────
  const [saveStatus, setSaveStatus] = useState(''); // '' | 'saving' | 'saved' | 'error'

  // ─── Load next question ────────────────────────────────────────────────────

  const loadQuestion = useCallback(data => {
    const q = generateQuestion(data.errorTracker, data.answeredCount);
    const opts = generateOptions(q.answer);
    setQuestion(q);
    setOptions(opts);
    setFeedback(null);
    setSelectedOption(null);
    setLocked(false);
  }, []);

  // ─── Timer expiry = wrong answer ────────────────────────────────────────────

  const handleExpire = useCallback(() => {
    if (!question || locked) return;
    // Treat timeout as wrong answer (-1 as sentinel)
    handleAnswer(-1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, locked, gameData]);

  const { remaining, reset: resetTimer, stop: stopTimer } = useCountdown(
    COUNTDOWN_SECONDS,
    handleExpire
  );

  // ─── Answer handling ────────────────────────────────────────────────────────

  async function handleAnswer(playerAnswer) {
    if (locked || !question || !gameData) return;
    setLocked(true);
    stopTimer();
    setSelectedOption(playerAnswer);

    const { gameData: nextData, correct, newUnlocks } = processAnswer(
      gameData,
      question,
      playerAnswer
    );

    setFeedback(correct ? 'correct' : 'wrong');

    if (correct) {
      playSound('audio/correct.mp3');
    } else {
      playSound('audio/wrong.mp3');
    }

    // Animate newly unlocked cells
    if (newUnlocks.length > 0) {
      setNewlyUnlocked(new Set(newUnlocks));
      setTimeout(() => setNewlyUnlocked(new Set()), 1200);
    }

    setGameData(nextData);

    // Check puzzle completion
    const puzzle = nextData.puzzles[nextData.currentPuzzleIndex];
    const prevPuzzle = gameData.puzzles[gameData.currentPuzzleIndex];
    const justCompleted =
      puzzle?.completed && !prevPuzzle?.completed;

    // Persist to Redis
    setSaveStatus('saving');
    const saveResult = await gameClient.saveScore(nextData);
    setSaveStatus(saveResult.success ? 'saved' : 'error');
    setTimeout(() => setSaveStatus(''), 2000);

    if (justCompleted) {
      setShowCongrats(true);
      return;
    }

    // Advance after short feedback delay
    setTimeout(() => {
      loadQuestion(nextData);
      resetTimer(COUNTDOWN_SECONDS);
    }, 800);
  }

  // ─── Login callback ─────────────────────────────────────────────────────────

  function handleLogin(data) {
    setGameData(data);
    setLoggedIn(true);
  }

  // ─── Start first question after login ───────────────────────────────────────

  useEffect(() => {
    if (loggedIn && gameData) {
      loadQuestion(gameData);
      resetTimer(COUNTDOWN_SECONDS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  // ─── Congrats: continue ──────────────────────────────────────────────────────

  function handleContinue() {
    setShowCongrats(false);
    loadQuestion(gameData);
    resetTimer(COUNTDOWN_SECONDS);
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (!loggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (!gameData || !question) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>載入中…</p>
      </div>
    );
  }

  const currentPuzzleIdx = gameData.currentPuzzleIndex;
  const currentPuzzle = gameData.puzzles[currentPuzzleIdx];
  const unlockedSet = getUnlockedSet(gameData, currentPuzzleIdx);
  const progress = puzzleProgress(gameData);
  const toNext = scoreToNextCell(gameData);
  const comboLabel =
    gameData.combo >= 6
      ? '🔥🔥🔥 MAX COMBO'
      : gameData.combo >= 3
      ? '🔥 COMBO x' + gameData.combo
      : gameData.combo > 0
      ? 'Combo x' + gameData.combo
      : '';

  const timerFraction = remaining / COUNTDOWN_SECONDS;
  const timerColor =
    remaining <= 1
      ? '#ef4444'
      : remaining <= 2
      ? '#f59e0b'
      : '#22c55e';

  return (
    <div className="game-screen">
      {/* ── Top HUD ── */}
      <header className="hud">
        <div className="hud-score">
          <span className="hud-label">得分</span>
          <span className="hud-value">{gameData.totalScore}</span>
        </div>
        <div className="hud-center">
          <div
            className="timer-ring"
            style={{ '--fraction': timerFraction, '--color': timerColor }}
          >
            <span className="timer-number">{remaining}</span>
          </div>
        </div>
        <div className="hud-puzzle">
          <span className="hud-label">拼圖 {currentPuzzleIdx + 1}/10</span>
          <span className="hud-value">{progress}%</span>
        </div>
      </header>

      {/* ── Combo banner ── */}
      {comboLabel && (
        <div className={`combo-banner ${gameData.combo >= 6 ? 'max' : ''}`}>
          {comboLabel}
        </div>
      )}

      {/* ── Puzzle ── */}
      <section className="puzzle-section">
        <PuzzleGrid
          backgroundImage={`images/puzzle_${currentPuzzleIdx}.jpg`}
          unlockedSet={unlockedSet}
          newlyUnlocked={newlyUnlocked}
        />
        <p className="next-unlock-hint">再 {toNext} 分解鎖下一格</p>
      </section>

      {/* ── Question ── */}
      <section className="question-section">
        {question.isReplay && (
          <span className="replay-badge">📋 複習題</span>
        )}
        <div className="question-display">
          <span className="operand">{question.a}</span>
          <span className="operator">✕</span>
          <span className="operand">{question.b}</span>
          <span className="operator">=</span>
          <span className="answer-blank">?</span>
        </div>
      </section>

      {/* ── Options ── */}
      <section className="options-grid">
        {options.map(opt => {
          let cls = 'option-btn';
          if (selectedOption !== null) {
            if (opt === question.answer) cls += ' correct';
            else if (opt === selectedOption) cls += ' wrong';
          }
          return (
            <button
              key={opt}
              className={cls}
              onClick={() => handleAnswer(opt)}
              disabled={locked}
            >
              {opt}
            </button>
          );
        })}
      </section>

      {/* ── Feedback flash ── */}
      {feedback && (
        <div className={`feedback-flash ${feedback}`}>
          {feedback === 'correct' ? '✓ 正確！' : '✗ 再加油！'}
        </div>
      )}

      {/* ── Save status ── */}
      /* 
      {saveStatus && (
        <div className={`save-status ${saveStatus}`}>
          {saveStatus === 'saving' && '☁️ 儲存中…'}
          {saveStatus === 'saved' && '✅ 已儲存'}
          {saveStatus === 'error' && '⚠️ 儲存失敗'}
        </div>
      )}
      */

      {/* ── Congrats overlay ── */}
      {showCongrats && (
        <CongratsOverlay
          puzzleIndex={currentPuzzleIdx}
          onNext={handleContinue}
          onViewPuzzle={() => setShowCongrats(false)}
        />
      )}
    </div>
  );
}
