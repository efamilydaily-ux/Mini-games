/**
 * GameLogic.js
 * Pure-logic module for 乘法神速賽.
 * No DOM / React dependency – fully testable in isolation.
 *
 * Puzzle layout (4 × 3 = 12 cells, index 0-11):
 *   [ 0][ 1][ 2][ 3]
 *   [ 4][ 5][ 6][ 7]   ← index 5 is the centre cell (must unlock LAST)
 *   [ 8][ 9][10][11]
 *
 * Unlock order (11 cells freely + centre last):
 *   Predefined sequence that skips index 5 until all others are done.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

export const GAME_CONFIG = {
  DIGITS: [2, 3, 4, 5, 6, 7, 8, 9], // strict 2-9, no 1
  POINTS_PER_20: 20,                  // score threshold per puzzle cell
  CELLS_PER_PUZZLE: 12,
  TOTAL_PUZZLES: 10,
  CENTRE_INDEX: 5,
  // Error queue: re-ask wrong answers after these answer counts
  ERROR_REPLAY_AT: [5, 10, 20],
};

/**
 * Predefined unlock order for a 12-cell puzzle.
 * Centre (5) is always the very last slot.
 */
export const UNLOCK_ORDER = [0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 5];

// ─── Default game state ───────────────────────────────────────────────────────

export function createDefaultGameData() {
  return {
    totalScore: 0,
    combo: 0,
    maxCombo: 0,
    answeredCount: 0,     // total questions answered (right or wrong)
    correctCount: 0,
    wrongCount: 0,

    // Puzzle progress: array of 10 objects, each tracking unlocked cells
    puzzles: Array.from({ length: GAME_CONFIG.TOTAL_PUZZLES }, () => ({
      unlockedIndices: [], // e.g. [0, 1, 3, ...]
      completed: false,
    })),

    // Current active puzzle index
    currentPuzzleIndex: 0,

    // Error tracker: { "3x4": { a: 3, b: 4, replayAt: [5, 10, 20], replayed: [] } }
    errorTracker: {},
  };
}

// ─── Question generation ──────────────────────────────────────────────────────

/**
 * Generate a random multiplication question.
 * Avoids factor 1; picks from DIGITS (2-9).
 * @param {object} errorTracker
 * @param {number} answeredCount  – used to decide whether to replay an error
 * @returns {{ a: number, b: number, answer: number, isReplay: boolean }}
 */
export function generateQuestion(errorTracker = {}, answeredCount = 0) {
  // Check if any error should be replayed now
  const dueReplay = getDueReplayQuestion(errorTracker, answeredCount);
  if (dueReplay) {
    return { ...dueReplay, isReplay: true };
  }

  const { DIGITS } = GAME_CONFIG;
  const a = DIGITS[Math.floor(Math.random() * DIGITS.length)];
  const b = DIGITS[Math.floor(Math.random() * DIGITS.length)];
  return { a, b, answer: a * b, isReplay: false };
}

/**
 * Returns the first error question due for replay at the current answeredCount,
 * or null if none.
 */
export function getDueReplayQuestion(errorTracker, answeredCount) {
  for (const key of Object.keys(errorTracker)) {
    const entry = errorTracker[key];
    if (!entry.replayAt || entry.replayAt.length === 0) continue;

    const nextReplayAt = entry.replayAt[0];
    if (answeredCount >= nextReplayAt && !entry.replayed.includes(nextReplayAt)) {
      return { a: entry.a, b: entry.b, answer: entry.a * entry.b };
    }
  }
  return null;
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

/**
 * Calculate points for a correct answer given the current combo.
 * Combo 0-2 → 1 pt, 3-5 → 2 pt, 6+ → 3 pt
 */
export function calcPoints(combo) {
  if (combo >= 6) return 3;
  if (combo >= 3) return 2;
  return 1;
}

/**
 * Process a player's answer.
 * Returns a new copy of gameData with all state updated.
 *
 * @param {object} gameData   – current state (treated as immutable)
 * @param {{ a, b, answer, isReplay }} question
 * @param {number} playerAnswer  – integer entered by player
 * @returns {{ gameData: object, correct: boolean, pointsEarned: number, newUnlocks: number[] }}
 */
export function processAnswer(gameData, question, playerAnswer) {
  const correct = playerAnswer === question.answer;

  // Deep clone to keep state immutable
  const next = JSON.parse(JSON.stringify(gameData));
  const { a, b } = question;
  const key = `${a}x${b}`;

  next.answeredCount += 1;

  let pointsEarned = 0;
  let newUnlocks = [];

  if (correct) {
    next.combo += 1;
    next.maxCombo = Math.max(next.maxCombo, next.combo);
    next.correctCount += 1;
    pointsEarned = calcPoints(next.combo - 1); // combo before this answer
    next.totalScore += pointsEarned;

    // Mark replay as done if this was a replay question
    if (question.isReplay && next.errorTracker[key]) {
      const entry = next.errorTracker[key];
      const doneAt = entry.replayAt.shift(); // pop the front
      entry.replayed.push(doneAt);
    }

    // Calculate puzzle unlocks
    newUnlocks = applyScoreToPuzzle(next);
  } else {
    next.combo = 0;
    next.wrongCount += 1;

    // Register / update error tracker (FIFO)
    if (!next.errorTracker[key]) {
      next.errorTracker[key] = {
        a, b,
        replayAt: [...GAME_CONFIG.ERROR_REPLAY_AT],
        replayed: [],
      };
    } else {
      // Push remaining replay checkpoints if they haven't been scheduled
      const existingEntry = next.errorTracker[key];
      GAME_CONFIG.ERROR_REPLAY_AT.forEach(checkpoint => {
        if (
          !existingEntry.replayAt.includes(checkpoint) &&
          !existingEntry.replayed.includes(checkpoint)
        ) {
          existingEntry.replayAt.push(checkpoint);
        }
      });
      existingEntry.replayAt.sort((a, b) => a - b);
    }
  }

  return { gameData: next, correct, pointsEarned, newUnlocks };
}

// ─── Puzzle unlock logic ──────────────────────────────────────────────────────

/**
 * Based on totalScore, compute how many cells should be unlocked
 * across all puzzles, then apply any newly earned cells.
 * Mutates `gameData` in place (after deep-clone in processAnswer).
 * Returns array of newly unlocked cell indices (for animation).
 */
export function applyScoreToPuzzle(gameData) {
  const {
    totalScore,
    puzzles,
    CELLS_PER_PUZZLE = GAME_CONFIG.CELLS_PER_PUZZLE,
  } = gameData;

  const totalCellsEarned = Math.floor(totalScore / GAME_CONFIG.POINTS_PER_20);
  const newUnlocks = [];

  let remaining = totalCellsEarned;

  for (let pi = 0; pi < puzzles.length; pi++) {
    const puzzle = puzzles[pi];
    const cellsForThisPuzzle = Math.min(remaining, GAME_CONFIG.CELLS_PER_PUZZLE);

    // Determine target unlock list
    const targetUnlocked = UNLOCK_ORDER.slice(0, cellsForThisPuzzle);

    // Find what's newly unlocked
    const alreadyUnlocked = new Set(puzzle.unlockedIndices);
    targetUnlocked.forEach(idx => {
      if (!alreadyUnlocked.has(idx)) {
        puzzle.unlockedIndices.push(idx);
        if (pi === gameData.currentPuzzleIndex) {
          newUnlocks.push(idx);
        }
      }
    });

    // Maintain UNLOCK_ORDER ordering
    puzzle.unlockedIndices.sort((a, b) =>
      UNLOCK_ORDER.indexOf(a) - UNLOCK_ORDER.indexOf(b)
    );

    puzzle.completed = puzzle.unlockedIndices.length >= GAME_CONFIG.CELLS_PER_PUZZLE;

    remaining -= GAME_CONFIG.CELLS_PER_PUZZLE;
    if (remaining <= 0) break;
  }

  // Advance currentPuzzleIndex if current puzzle is complete
  if (
    puzzles[gameData.currentPuzzleIndex]?.completed &&
    gameData.currentPuzzleIndex < GAME_CONFIG.TOTAL_PUZZLES - 1
  ) {
    gameData.currentPuzzleIndex += 1;
  }

  return newUnlocks;
}

/**
 * Get the set of unlocked cell indices for a given puzzle.
 * @param {object} gameData
 * @param {number} puzzleIndex
 * @returns {Set<number>}
 */
export function getUnlockedSet(gameData, puzzleIndex) {
  return new Set(gameData.puzzles[puzzleIndex]?.unlockedIndices ?? []);
}

/**
 * Calculate progress percentage for the current puzzle.
 */
export function puzzleProgress(gameData) {
  const puzzle = gameData.puzzles[gameData.currentPuzzleIndex];
  if (!puzzle) return 0;
  return Math.round((puzzle.unlockedIndices.length / GAME_CONFIG.CELLS_PER_PUZZLE) * 100);
}

/**
 * Score needed to unlock the next puzzle cell.
 */
export function scoreToNextCell(gameData) {
  const cellsEarned = Math.floor(gameData.totalScore / GAME_CONFIG.POINTS_PER_20);
  const nextThreshold = (cellsEarned + 1) * GAME_CONFIG.POINTS_PER_20;
  return nextThreshold - gameData.totalScore;
}

// ─── Generate multiple-choice options ────────────────────────────────────────

/**
 * Generate 4 answer options including the correct answer.
 * Options are shuffled. Distractors stay within plausible multiplication range.
 */
export function generateOptions(correctAnswer) {
  const options = new Set([correctAnswer]);

  while (options.size < 4) {
    const offset = Math.floor(Math.random() * 20) - 10;
    const candidate = correctAnswer + offset;
    if (candidate > 0 && candidate !== correctAnswer) {
      options.add(candidate);
    }
  }

  return [...options].sort(() => Math.random() - 0.5);
}
