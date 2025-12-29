import { gameConfigs, currentGameMode, updateUIForMode, updateStreakBadge, updateNewBanner } from "./home.js";
import { fetchGames, fetchDailyGame } from "./data/fetchGames.js";
import { updateDailyResult, dailyState, loadDailyState, hasPlayedToday, getChallengeNumber, saveDailyState } from "./data/daily.js";
import {
  initializeChessBoard,
  removeChessBoard,
} from "./elements/chessBoard.js";
import { clearCountdown, startCountdown, displayStaticClock } from "./elements/clock.js";
import {
  getRandomEloNumbers,
  shuffleArray,
  getRandomElement,
} from "./other/utils.js";
import { adjustScreen } from "./other/resize.js";
import { remainingTimePercentage } from "./elements/clock.js";
import {
  enableSelectionWheelEvents,
  disableSelectionWheelEvents,
} from "./home.js";
import {
  streakIconHTML,
  incorrectGuessResponse,
  correctGuessResponse,
  correctGuessResponseStreak,
  timeOutResponse,
  resultHeaderAllCorrect,
  resultHeaderNegative,
  resultHeaderPositive,
} from "./other/config.js";
import { tracker } from "./analytics/metrics.js";

const startGameButton = document.getElementById("startGameButton");
const nextGameButton = document.getElementById("nextGameButton");
const viewResultButton = document.getElementById("viewResultButton");
const mainMenuButton = document.getElementById("mainMenuButton");
const shareButton = document.getElementById("shareButton");
const homeScreen = document.getElementById("homeScreen");
const gameScreen = document.getElementById("gameScreen");
const resultScreen = document.getElementById("resultScreen");
const timeControl = document.getElementById("gameMode");
const roundsText = document.getElementById("roundsText");
const score = document.getElementById("score");
const eloButtons = document.querySelectorAll("#eloButtonsContainer .eloButton");
const answerBanner = document.getElementById("answerBanner");
const answerBannerContent = document.getElementById("answerBannerContent");
const footer = document.getElementById("footer");

let eloButtonHandlers = {};
let answerBannerTimeout;

let gameArray = [];
let gameScore = 0;
let streakCount = 0;
let correctElo = 0;

let correctCount = 0;
let totalStreakBonus = 0;
let totalTimeBonus = 0;
let longestStreak = 0;

let maxRounds = 0;
let gameTimeControls = "";
let gameTimeLimit = "";
let gameEvaluation = "";
let livesCount = 3;
let partialLivesCount = 0;
let currentRound = 0;

let roundEnded = false;
let isReviewMode = false;
let dailyGameState = null; // Stores state for daily game
let endlessModeRounds = []; // Stores round data for endless mode sharing
let gameInProgress = false; // Track if game is actively being played

function resetVariables() {
  gameArray = [];
  gameScore = 0;
  streakCount = 0;
  correctElo = 0;

  correctCount = 0;
  totalStreakBonus = 0;
  totalTimeBonus = 0;
  longestStreak = 0;

  maxRounds = 0;
  gameTimeControls = "";
  gameTimeLimit = "";
  gameEvaluation = "";
  livesCount = 3;
  currentRound = 0;
  partialLivesCount = 0;
  document.getElementById("heartsContainer").classList.remove("shrink");

  roundEnded = false;
  isReviewMode = false;
  dailyGameState = null;
  endlessModeRounds = []; // Reset endless mode rounds
  gameInProgress = false;
}

function playSound(elementId) {
  const audio = document.getElementById(elementId);
  audio.currentTime = 0; // Rewind clip to start
  audio.play();
}

// Unified start game handler
startGameButton?.addEventListener("click", async () => {
  document.title = "Guess The ELO";
  playSound("gameStartSound");
  disableStartGameButton();
  resetVariables();

  // Check if this is a review session for daily challenge
  if (currentGameMode === "daily" && hasPlayedToday() && dailyState.lastGameData) {
    // Validate the saved game data structure
    const savedData = dailyState.lastGameData;
    const hasValidData = savedData.eloChoices &&
                        Array.isArray(savedData.eloChoices) &&
                        savedData.eloChoices.length === 4 &&
                        savedData.correctElo &&
                        savedData.gameDict;

    if (hasValidData) {
      // Data looks valid, proceed with review mode
      isReviewMode = true;
      dailyGameState = savedData;
    } else {
      // Data is corrupted, clear it and let user play fresh
      console.warn('Corrupted daily challenge data detected, clearing and allowing fresh play');
      dailyState.lastGameData = null;
      dailyState.lastPlayedDate = null; // Reset so user can play today's challenge
      saveDailyState(); // Save the cleared state
      isReviewMode = false;
    }
  }

  // Set game parameters based on current mode
  if (currentGameMode === "classic") {
    maxRounds = 5; // Always 5 rounds for classic mode
    gameTimeControls = gameConfigs.timeControls;
    gameTimeLimit = gameConfigs.timeLimit;
    gameEvaluation = gameConfigs.evaluation;
    gameArray = await fetchGames(gameTimeControls, maxRounds);
  } else if (currentGameMode === "endless") {
    maxRounds = 1000; // Set high value for endless mode
    gameTimeControls = gameConfigs.timeControls;
    gameTimeLimit = gameConfigs.timeLimit;
    gameEvaluation = gameConfigs.evaluation;
    gameArray = await fetchGames(gameTimeControls, 20); // Start with 20 games
  } else if (currentGameMode === "daily") {
    maxRounds = 1;
    if (isReviewMode) {
      // Load saved game data for review (already validated above)
      try {
        gameArray = [dailyGameState.gameDict];
        gameScore = dailyGameState.finalScore || 0;
        totalTimeBonus = dailyGameState.totalTimeBonus || 0;
        totalStreakBonus = dailyGameState.totalStreakBonus || 0;
      } catch (err) {
        // If anything fails, fall back to fetching fresh game
        console.warn('Error loading review data, fetching fresh game:', err);
        isReviewMode = false;
        gameArray = [await fetchDailyGame()];
      }
    } else {
      gameArray = [await fetchDailyGame()];
    }
    // Fixed settings for daily challenge
    gameTimeLimit = "90s";
    gameEvaluation = "Yes";
  }

  generateHeartIcons();
  newGame(gameArray[currentRound]);

  // Track game start (only for actual gameplay, not reviews)
  if (!isReviewMode) {
    tracker.trackGameStart(currentGameMode, {
      timeLimit: gameTimeLimit,
      evaluation: gameEvaluation,
      timeControl: gameTimeControls
    });
    gameInProgress = true;
  }

  enableStartGameButton();
  footer.style.display = "none";
  homeScreen.style.display = "none";
  gameScreen.style.display = "block";
});

nextGameButton.addEventListener("click", async () => {
  playSound("gameStartSound");
  if (currentRound <= maxRounds) {
    if (currentRound % 20 === 0) {
      const newGames = await fetchGames(gameTimeControls, 20);
      gameArray.push(...newGames);
      newGame(gameArray[currentRound]);
    } else {
      newGame(gameArray[currentRound]);
    }
  }
  clearAnswerBanner();
  nextGameButton.style.display = "none";
});

viewResultButton.addEventListener("click", () => {
  playSound("gameEndSound");
  removeChessBoard();
  clearAnswerBanner();

  // Track game completion (before updating result screen)
  if (!isReviewMode) {
    tracker.trackGameComplete({
      mode: currentGameMode,
      finalScore: gameScore,
      roundsPlayed: currentRound,
      correctCount: correctCount,
      longestStreak: longestStreak
    });
    gameInProgress = false;
  }

  // Track daily challenge specifically
  if (currentGameMode === "daily" && !isReviewMode && dailyGameState) {
    tracker.trackDailyChallenge({
      challengeNumber: getChallengeNumber(),
      streak: dailyState.currentStreak || 0,
      score: gameScore,
      correct: dailyGameState.wasCorrect || false,
      timeUsed: dailyGameState.secondsUsed || 0
    });
  }

  // Update daily challenge completion when game ends (regardless of correct/incorrect)
  if (currentGameMode === "daily" && !isReviewMode) {
    // Save the final score before updating daily result
    if (dailyGameState) {
      dailyGameState.finalScore = gameScore;
      dailyGameState.totalTimeBonus = totalTimeBonus;
      dailyGameState.totalStreakBonus = totalStreakBonus;
    }
    updateDailyResult(dailyGameState);
    updateNewBanner(); // Hide NEW banner after first play
  }

  updateResultScreen();
  viewResultButton.style.display = "none";
  gameScreen.style.display = "none";
  resultScreen.style.display = "block";
  document.title = "Guess The ELO";
  adjustScreen();
});

mainMenuButton.addEventListener("click", () => {
  resultScreen.style.display = "none";
  homeScreen.style.display = "block";
  footer.style.display = "flex";
  document.title = "Play Guess The ELO";
  adjustScreen();
  // Reload daily state to get updated streak
  loadDailyState();
  // Update UI to reflect daily challenge completion status
  updateUIForMode();
  // Update streak badge with new streak value
  updateStreakBadge();
});

shareButton?.addEventListener("click", async () => {
  // Track share action with minimal dimensions
  tracker.trackShare(currentGameMode, gameScore);
  await shareResult();
});

function updateResultScreen() {
  const resultHeader = document.getElementById("resultHeader");
  const resultSummary = document.getElementById("resultSummary");

  if (currentGameMode === "daily") {
    // Daily challenge result
    resultHeader.textContent = "Daily Challenge Complete!";
    resultSummary.innerHTML = dailyState.currentStreak > 0
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-flame-icon lucide-flame" style="display: inline; vertical-align: middle;"><path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"/></svg> ${dailyState.currentStreak} day streak!`
      : "Start your streak tomorrow!";
    // Show share button for daily challenge
    if (shareButton) {
      shareButton.style.display = "flex";
    }
  } else if (currentGameMode === "endless") {
    // Show share button for endless mode
    if (shareButton) {
      shareButton.style.display = "flex";
    }
    if (currentRound > 10) {
      resultHeader.textContent = getRandomElement(resultHeaderAllCorrect);
    } else if (currentRound > 3) {
      resultHeader.textContent = getRandomElement(resultHeaderPositive);
    } else {
      resultHeader.textContent = getRandomElement(resultHeaderNegative);
    }
    resultSummary.textContent = `You made it to round ${currentRound}!`;
  } else {
    // Classic mode (always 5 rounds)
    // Hide share button for classic mode
    if (shareButton) {
      shareButton.style.display = "none";
    }
    if (correctCount <= 2) {
      resultHeader.textContent = getRandomElement(resultHeaderNegative);
    } else if (correctCount > 2 && correctCount <= 4) {
      resultHeader.textContent = getRandomElement(resultHeaderPositive);
    } else {
      resultHeader.textContent = getRandomElement(resultHeaderAllCorrect);
    }
    resultSummary.textContent = `You got ${correctCount} out of ${maxRounds} games right`;
  }

  document.getElementById("totalScore").textContent = "\u00A0";
  document.getElementById("totalBaseScoreValue").textContent = "\u00A0";
  document.getElementById("totalTimeBonusValue").textContent = "\u00A0";
  document.getElementById("totalStreakBonusValue").textContent = "\u00A0";
  document.getElementById("longestStreakValue").textContent = "\u00A0";

  function animateScore(elementId, startValue, endValue, duration, callback) {
    const element = document.getElementById(elementId);
    const incrementTime = 20; // interval time in milliseconds
    const steps = duration / incrementTime;
    const increment = (endValue - startValue) / steps;
    let currentValue = startValue;
    let stepCount = 0;

    const interval = setInterval(() => {
      currentValue += increment;
      stepCount++;
      if (stepCount >= steps) {
        clearInterval(interval);
        currentValue = endValue; // ensure the final value is accurate
      }

      element.textContent = Math.floor(currentValue);
    }, incrementTime);

    if (callback) {
      setTimeout(callback, duration);
    }
  }
  const baseScore = gameScore - totalStreakBonus - totalTimeBonus;

  let baseScoreAnimationTime = gameScore > 0 ? 1000 : 0;
  let totalTimeBonusAnimationTime = totalTimeBonus > 0 ? 1000 : 0;
  let totalStreakBonusAnimationTime = totalStreakBonus > 0 ? 1000 : 0;
  const longestStreakValueAnimationTime = 0;
  const totalScoreAnimationTime =
    baseScoreAnimationTime +
    totalTimeBonusAnimationTime +
    totalStreakBonusAnimationTime +
    longestStreakValueAnimationTime;

  animateScore("totalScore", 0, gameScore, totalScoreAnimationTime);

  animateScore(
    "totalBaseScoreValue",
    0,
    baseScore,
    baseScoreAnimationTime,
    () => {
      animateScore(
        "totalTimeBonusValue",
        0,
        totalTimeBonus,
        totalTimeBonusAnimationTime,
        () => {
          animateScore(
            "totalStreakBonusValue",
            0,
            totalStreakBonus,
            totalStreakBonusAnimationTime,
            () => {
              animateScore(
                "longestStreakValue",
                0,
                longestStreak,
                longestStreakValueAnimationTime
              );
            }
          );
        }
      );
    }
  );
}

// Reusable function to generate visual grid for a single round
function generateSingleRoundGrid(eloChoices, correctElo, userAnswer, timedOut) {
  const positions = ['⬜', '⬜', '⬜', '⬜'];

  if (!eloChoices) {
    return positions.join(' ');
  }

  const choices = eloChoices.map(String);
  const correctIndex = choices.indexOf(String(correctElo));
  const userIndex = choices.indexOf(String(userAnswer));

  if (timedOut) {
    return '⬛ ⬛ ⬛ ⬛';
  } else if (String(userAnswer) === String(correctElo)) {
    // User got it right - show green at correct position
    if (correctIndex !== -1) {
      positions[correctIndex] = '🟩';
    }
  } else {
    // User got it wrong - show yellow for user's guess, green for correct
    if (userIndex !== -1) {
      positions[userIndex] = '🟨';
    }
    if (correctIndex !== -1) {
      positions[correctIndex] = '🟩';
    }
  }

  return positions.join(' ');
}

// Share functionality for daily challenge
function generateVisualGrid() {
  if (!dailyGameState || !dailyGameState.eloChoices) {
    return '⬜ ⬜ ⬜ ⬜';
  }

  return generateSingleRoundGrid(
    dailyGameState.eloChoices,
    dailyGameState.correctElo,
    dailyGameState.userAnswer,
    dailyGameState.timedOut
  );
}

function generateShareText() {
  const challengeNum = getChallengeNumber();

  // User must have game data if they're on result screen
  const grid = generateVisualGrid();
  const timeStr = dailyGameState?.timedOut ? 'DNF' : `${dailyGameState?.secondsUsed || 0}s`;
  const score = dailyGameState?.finalScore || 0;
  const result = dailyGameState?.wasCorrect ? '✅' : '❌';

  return `Guess The ELO Daily #${challengeNum} ${result}\n${grid} (${score.toLocaleString()})\n⏱️ ${timeStr} | 🔥 ${dailyState.currentStreak}\n\nCan you beat my score? → https://guesstheelo.com?play=daily`;
}

function generateEndlessShareText() {
  if (!endlessModeRounds || endlessModeRounds.length === 0) {
    return 'Guess The ELO - Endless Mode\n\nNo rounds played\nTry it → https://guesstheelo.com?play=endless';
  }

  let grids = [];
  let totalScore = 0;

  // Generate grid for each round
  endlessModeRounds.forEach((round) => {
    const grid = generateSingleRoundGrid(
      round.eloChoices,
      round.correctElo,
      round.userAnswer,
      round.timedOut
    );
    totalScore += round.roundScore;
    grids.push(`${grid} (${round.roundScore.toLocaleString()})`);
  });

  const roundReached = endlessModeRounds.length;
  return `Guess The ELO - Endless Mode\n${grids.join('\n')}\n${roundReached} Rounds | Total: ${totalScore.toLocaleString()}\n\nHow far can you go? → https://guesstheelo.com?play=endless`;
}

async function shareResult() {
  const shareText = currentGameMode === "daily"
    ? generateShareText()
    : generateEndlessShareText();

  // Try modern clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(shareText);
      const notyf = new Notyf({
        duration: 2000,
        position: { x: 'center', y: 'top' }
      });
      notyf.success('Copied to clipboard!');
      return;
    } catch (err) {
      console.log('Clipboard API failed, trying fallback:', err);
    }
  }

  // Fallback: Create textarea and use execCommand
  const textarea = document.createElement('textarea');
  textarea.value = shareText;
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.width = '2em';
  textarea.style.height = '2em';
  textarea.style.padding = '0';
  textarea.style.border = 'none';
  textarea.style.outline = 'none';
  textarea.style.boxShadow = 'none';
  textarea.style.background = 'transparent';

  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);

    const notyf = new Notyf({
      duration: 2000,
      position: { x: 'center', y: 'top' }
    });

    if (successful) {
      notyf.success('Copied to clipboard!');
    } else {
      notyf.error('Failed to copy - please try again');
    }
  } catch (err) {
    document.body.removeChild(textarea);
    console.error('Copy failed:', err);

    // Last resort: show alert with text
    alert('Copy this text:\n\n' + shareText);
  }
}

function setUpEloButtons(correctElo, eloMinRange, eloMaxRange) {
  let choices;

  if (isReviewMode && dailyGameState) {
    // Use saved choices for review mode
    choices = dailyGameState.eloChoices;
  } else {
    // Generate new choices for normal play
    choices = shuffleArray(
      getRandomEloNumbers(parseInt(correctElo), eloMinRange, eloMaxRange)
    );

    // Save choices for daily challenge (first play only)
    if (currentGameMode === "daily" && !isReviewMode) {
      if (!dailyGameState) dailyGameState = {};
      dailyGameState.eloChoices = choices;
      dailyGameState.correctElo = correctElo;
    }

    // Save choices for endless mode
    if (currentGameMode === "endless") {
      const roundData = {
        eloChoices: choices,
        correctElo: correctElo,
        userAnswer: null,
        timedOut: false,
        roundScore: 0
      };
      endlessModeRounds.push(roundData);
    }
  }

  // Enable buttons (but they'll be disabled for review mode later)
  eloButtons.forEach((btn) => {
    btn.disabled = false;
    btn.removeAttribute("tabindex");
  });

  eloButtons.forEach((button, index) => {
    // Remove existing event listeners and classes
    button.classList.remove("correctGuess", "incorrectGuess", "unclickable");
    button.removeEventListener("click", eloButtonHandlers[button.id]);

    button.textContent = choices[index];

    // In review mode, show the previous selection and correct answer
    if (isReviewMode && dailyGameState) {
      if (button.textContent === dailyGameState.userAnswer) {
        button.classList.add(dailyGameState.wasCorrect ? "correctGuess" : "incorrectGuess");
      }
      if (button.textContent === dailyGameState.correctElo && !dailyGameState.wasCorrect) {
        button.classList.add("correctGuess");
      }
      // Disable clicks in review mode
      button.disabled = true;
      button.setAttribute("tabindex", "-1");
    } else {
      // Assign ids to handler functions
      eloButtonHandlers[button.id] = () => {
        eloButtonClickHandler(button, correctElo);
      };
      // Add click event to buttons
      button.addEventListener("click", eloButtonHandlers[button.id]);
    }
  });
}

function eloButtonClickHandler(button, correctElo) {
  const countdownSound = document.getElementById("countdownSound");
  if (!countdownSound.paused) {
    countdownSound.pause();
    countdownSound.currentTime = 0; // Reset the audio to the beginning
  }

  // Track the round completion
  const isCorrect = button.textContent === correctElo;
  const timeRemaining = gameTimeLimit === "None" ? null :
    (remainingTimePercentage !== undefined ?
      Math.floor((gameTimeLimit === "90s" ? 90 : 45) * remainingTimePercentage) : 0);

  tracker.trackRoundComplete({
    mode: currentGameMode,
    round: currentRound + 1,
    correct: isCorrect,
    timeRemaining: timeRemaining,
    eloGuessed: parseInt(button.textContent),
    eloCorrect: parseInt(correctElo),
    pointsEarned: 0, // Will be calculated in endRound
    streak: streakCount
  });

  // Save user's answer and timing for daily challenge
  if (currentGameMode === "daily" && !isReviewMode) {
    if (!dailyGameState) dailyGameState = {};
    dailyGameState.userAnswer = button.textContent;
    dailyGameState.wasCorrect = button.textContent === correctElo;

    // Save remaining time percentage and calculate seconds used
    if (gameTimeLimit !== "None" && remainingTimePercentage !== undefined) {
      dailyGameState.remainingTimePercentage = remainingTimePercentage;
      const totalSeconds = gameTimeLimit === "90s" ? 90 : 45;
      dailyGameState.secondsRemaining = Math.floor(totalSeconds * remainingTimePercentage);
      dailyGameState.secondsUsed = totalSeconds - dailyGameState.secondsRemaining;
    } else {
      dailyGameState.remainingTimePercentage = 1;
      dailyGameState.secondsRemaining = gameTimeLimit === "90s" ? 90 : 45;
      dailyGameState.secondsUsed = 0;
    }
  }

  // Save user's answer for endless mode
  if (currentGameMode === "endless" && endlessModeRounds.length > 0) {
    const currentRoundData = endlessModeRounds[endlessModeRounds.length - 1];
    currentRoundData.userAnswer = button.textContent;
  }

  if (button.textContent === correctElo) {
    button.classList.add("correctGuess");
    endRound("Correct", button);
  } else {
    button.classList.add("incorrectGuess");
    eloButtons.forEach((button) => {
      if (button.textContent === correctElo) {
        button.classList.add("correctGuess");
      }
    });
    endRound("Incorrect", button);
  }
}

export function endRound(answer, button) {
  roundEnded = true;
  const correctScore = 1000;
  let timeBonus;
  if (gameTimeLimit === "None") {
    timeBonus = 0;
  } else {
    if (remainingTimePercentage === undefined) {
      timeBonus = 500;
    } else {
      timeBonus = Math.round(500 * remainingTimePercentage);
    }
  }

  if (gameTimeLimit === "45s") {
    timeBonus = timeBonus * 2;
  }

  // Save time bonus for daily challenge
  if (currentGameMode === "daily" && !isReviewMode) {
    if (!dailyGameState) dailyGameState = {};
    dailyGameState.timeBonus = timeBonus;
  }

  let streakBonus = 0;

  // Disable buttons
  if (answer === "Time") {
    // Save timing data when time runs out for daily challenge
    if (currentGameMode === "daily" && !isReviewMode) {
      if (!dailyGameState) dailyGameState = {};
      dailyGameState.wasCorrect = false;
      dailyGameState.timedOut = true;
      dailyGameState.remainingTimePercentage = 0;
      dailyGameState.secondsRemaining = 0;
      const totalSeconds = gameTimeLimit === "90s" ? 90 : 45;
      dailyGameState.secondsUsed = totalSeconds;
    }

    streakCount = 0;
    updateAnswerBannerElement(0, 0, true);
    removeHeart();

    // Save timeout for endless mode
    if (currentGameMode === "endless" && endlessModeRounds.length > 0) {
      const currentRoundData = endlessModeRounds[endlessModeRounds.length - 1];
      currentRoundData.timedOut = true;
      currentRoundData.roundScore = 0;
    }

    eloButtons.forEach((btn) => {
      if (btn.textContent === correctElo) {
        btn.classList.add("correctGuess");
      }
      btn.disabled = true;
      btn.setAttribute("tabindex", "-1");
      btn.blur();
    });
  } else {
    if (answer === "Correct") {
      playSound("correctSound");
      correctCount++;
      streakCount++;

      longestStreak = Math.max(longestStreak, streakCount);
      streakBonus = streakCount >= 3 ? streakCount * 100 : 0;
      totalStreakBonus += streakBonus;
      totalTimeBonus += timeBonus;

      updateAnswerBannerElement(correctScore + timeBonus, streakBonus);
      updateScoreElement(correctScore + timeBonus, streakBonus);
      addHeart();

      // Save round score for endless mode
      if (currentGameMode === "endless" && endlessModeRounds.length > 0) {
        const currentRoundData = endlessModeRounds[endlessModeRounds.length - 1];
        currentRoundData.roundScore = correctScore + timeBonus + streakBonus;
      }

      // Extension point: submitAnonymousStats(correctElo, button.textContent) for daily mode
    } else if (answer === "Incorrect") {
      playSound("incorrectSound");
      streakCount = 0;

      updateAnswerBannerElement(0, 0);
      removeHeart();

      // Save round score for endless mode
      if (currentGameMode === "endless" && endlessModeRounds.length > 0) {
        const currentRoundData = endlessModeRounds[endlessModeRounds.length - 1];
        currentRoundData.roundScore = 0;
      }

      // Extension point: submitAnonymousStats(correctElo, button.textContent) for daily mode
    }
    eloButtons.forEach((btn) => {
      if (btn !== button && btn.textContent !== correctElo) {
        btn.disabled = true;
      }
      btn.setAttribute("tabindex", "-1");
      btn.blur();
    });
  }
  // Clear countdown
  clearCountdown();
  // Show next game/ view result button
  nextGameButton.style.display = "block";
  if (currentRound === maxRounds || livesCount === 0) {
    viewResultButton.style.display = "block";
    nextGameButton.style.display = "none";
  }
}

function addHeart() {
  if (currentGameMode === "endless" && livesCount < 5) {
    const heartsContainer = document.getElementById("heartsContainer");
    heartsContainer.innerHTML = ""; // Clear previous contents

    for (let i = 0; i < livesCount; i++) {
      const heartImg = document.createElement("img");
      heartImg.id = `heart${i}`;
      heartImg.className = "heartIcon";
      heartImg.src = "images/icons/heart.svg";
      heartsContainer.appendChild(heartImg);
    }
    partialLivesCount++;

    if (partialLivesCount % 3 === 0) {
      livesCount++;
      const heartImg = document.createElement("img");
      heartImg.id = `heart${livesCount - 1}`;
      heartImg.className = "heartIcon";
      heartImg.src = "images/icons/heart.svg";
      heartsContainer.appendChild(heartImg);
      partialLivesCount = 0;
      const heart = document.getElementById(`heart${livesCount - 1}`);
      heart.classList.add("pulse");
    } else if (partialLivesCount % 3 === 2) {
      const heartImg = document.createElement("img");
      heartImg.className = "heartIcon";
      heartImg.id = "heart-mid";
      heartImg.src = "images/icons/heart-mid.svg";
      heartsContainer.appendChild(heartImg);
      const heart = document.getElementById(`heart-mid`);
      heart.classList.add("pulse");
    } else if (partialLivesCount % 3 === 1) {
      const heartImg = document.createElement("img");
      heartImg.className = "heartIcon";
      heartImg.id = "heart-low";
      heartImg.src = "images/icons/heart-low.svg";
      heartsContainer.appendChild(heartImg);
      const heart = document.getElementById(`heart-low`);
      heart.style.opacity = 0;
      heart.style.width = 0;
      heart.style.height = 0;

      heart.style.transition = "width 0.5s, height 0.5s, opacity 0.5s";
      requestAnimationFrame(() => {
        heart.style.opacity = 1;
        heart.style.width = "clamp(0.88rem, 0.582rem + 1.38vw, 1.1rem)";
        heart.style.height = "clamp(0.88rem, 0.582rem + 1.38vw, 1.1rem)";
      });
    }
  }
}

export function removeHeart() {
  if (currentGameMode === "endless") {
    livesCount--;
    const heart = document.getElementById(`heart${livesCount}`);
    heart.classList.add("shrink");
    if (livesCount === 0) {
      document.getElementById("heartsContainer").classList.add("shrink");
    }
  }
}

function updateScoreElement(addedScore, streakBonus) {
  const targetScore = gameScore + addedScore + streakBonus;
  const duration = 500; // 1 second
  const incrementTime = 20; // interval time in milliseconds
  const steps = duration / incrementTime;
  const increment = (targetScore - gameScore) / steps;
  let currentScore = gameScore;
  let stepCount = 0;

  const interval = setInterval(() => {
    currentScore += increment;
    stepCount++;
    if (stepCount >= steps) {
      clearInterval(interval);
      currentScore = targetScore; // ensure the final score is accurate
    }

    score.innerHTML = createScoreText(Math.floor(currentScore));
  }, incrementTime);

  gameScore = targetScore; // update the gameScore to the target score
}

function createScoreText(currentScore) {
  let streakIcon;
  let streakText;
  if (streakCount >= 3 && streakCount < 5) {
    streakIcon = streakIconHTML;
  } else if (streakCount >= 5 && streakCount < 10) {
    streakIcon = streakIconHTML.repeat(2);
  } else if (streakCount >= 10) {
    streakIcon = streakIconHTML.repeat(3);
  } else {
    streakIcon = "";
  }
  if (streakCount >= 3) {
    streakText = `<div id="scoreText" class="streak">${currentScore} points</div>`;
  } else {
    streakText = `<div id="scoreText">${currentScore} points</div>`;
  }
  return streakIcon + streakText;
}

function createRoundsText() {
  let roundsText;

  if (currentGameMode === "endless") {
    roundsText = `Round ${currentRound}`;
  } else {
    roundsText = `${currentRound} of ${maxRounds}`;
  }
  return roundsText;
}

function generateHeartIcons() {
  const heartsContainer = document.getElementById("heartsContainer");

  if (currentGameMode === "endless") {
    heartsContainer.innerHTML = ""; // Clear previous contents
    heartsContainer.style.display = "flex"; // Show the container

    for (let i = 0; i < livesCount; i++) {
      const heartImg = document.createElement("img");
      heartImg.id = `heart${i}`;
      heartImg.className = "heartIcon";
      heartImg.src = "images/icons/heart.svg";
      heartsContainer.appendChild(heartImg);
    }
  } else {
    // Hide hearts container for non-endless modes
    heartsContainer.innerHTML = ""; // Clear any existing hearts
    heartsContainer.style.display = "none"; // Hide the container
  }
}

export function updateAnswerBannerElement(
  addedScore,
  streakBonus,
  timeout = false
) {
  clearAnswerBanner();

  // In review mode, show saved banner message
  if (isReviewMode && dailyGameState && dailyGameState.answerBannerHTML) {
    answerBannerContent.innerHTML = dailyGameState.answerBannerHTML;
    answerBanner.classList.add("active", dailyGameState.wasCorrect ? "correct" : "incorrect");
  } else {
    // Normal game mode
    let bannerHTML, bannerClass;

    if (timeout === true) {
      bannerHTML = getRandomElement(timeOutResponse);
      bannerClass = "incorrect";
      answerBannerContent.textContent = bannerHTML;
    } else if (addedScore === 0 && streakBonus === 0) {
      bannerHTML = getRandomElement(incorrectGuessResponse);
      bannerClass = "incorrect";
      answerBannerContent.textContent = bannerHTML;
    } else {
      let correctResponse;
      if (streakBonus > 0) {
        correctResponse = getRandomElement([
          ...correctGuessResponseStreak,
          ...correctGuessResponse,
        ]);
        bannerHTML = `${correctResponse} &nbsp; +${addedScore} points<div id = "streakBonus:">Streak Bonus &nbsp; +${streakBonus} points`;
      } else {
        correctResponse = getRandomElement(correctGuessResponse);
        bannerHTML = `${correctResponse} &nbsp; +${addedScore} points`;
      }
      bannerClass = "correct";
      answerBannerContent.innerHTML = bannerHTML;
    }

    answerBanner.classList.add("active", bannerClass);

    // Save banner message for daily challenge
    if (currentGameMode === "daily" && !isReviewMode) {
      if (!dailyGameState) dailyGameState = {};
      dailyGameState.answerBannerHTML = bannerHTML;
      dailyGameState.baseScore = addedScore;
      dailyGameState.streakBonus = streakBonus;
    }
  }

  // Clear the previous timeout, if any
  if (answerBannerTimeout) {
    clearTimeout(answerBannerTimeout);
  }

  // Set a new timeout for hiding the answer banner
  answerBannerTimeout = setTimeout(() => {
    answerBanner.classList.remove("active");
  }, 2000);
}

function clearAnswerBanner() {
  answerBannerContent.textContent = "";
  answerBanner.classList.remove("active", "correct", "incorrect");
}

async function newGame(gameDict) {
  currentRound++;
  let time;
  let evaluation;
  if (gameTimeLimit === "90s") {
    time = 90;
  } else if (gameTimeLimit === "45s") {
    time = 45;
  } else {
    time = 0;
  }
  if (gameEvaluation === "Yes") {
    evaluation = true;
  } else {
    evaluation = false;
  }
  const moves = gameDict.Moves;

  let orientation;
  if (isReviewMode && dailyGameState && dailyGameState.orientation) {
    // Use saved orientation for review
    orientation = dailyGameState.orientation;
  } else {
    // Generate new orientation for normal play
    orientation = getRandomElement(["white", "black"]);
    // Save orientation for daily challenge
    if (currentGameMode === "daily" && !isReviewMode) {
      if (!dailyGameState) dailyGameState = {};
      dailyGameState.orientation = orientation;
      dailyGameState.gameDict = gameDict; // Save the entire game dict
    }
  }

  const site = gameDict.Site;
  correctElo =
    orientation === "white"
      ? gameDict.WhiteElo.toString()
      : gameDict.BlackElo.toString();
  await initializeChessBoard(moves, orientation, evaluation, site);

  timeControl.textContent = `${gameDict.Event} ${gameDict.TimeControl}`;
  score.innerHTML = createScoreText(gameScore);
  roundsText.innerHTML = createRoundsText(livesCount);

  setUpEloButtons(correctElo);
  adjustScreen();

  // In review mode, don't start countdown and show answer immediately
  if (isReviewMode) {
    // Display static clock with saved time data
    if (dailyGameState && dailyGameState.secondsRemaining !== undefined) {
      const totalSeconds = gameTimeLimit === "90s" ? 90 : (gameTimeLimit === "45s" ? 45 : 0);
      displayStaticClock(dailyGameState.secondsRemaining, totalSeconds);
    } else {
      clearCountdown();
    }
    // Show the saved answer banner
    updateAnswerBannerElement(
      dailyGameState.baseScore || 0,
      dailyGameState.streakBonus || 0
    );
    // Show view result button immediately
    viewResultButton.style.display = "block";
  } else {
    clearCountdown();
    startCountdown(time);
  }
  // console.log(correctElo);
  roundEnded = isReviewMode; // End round immediately in review mode
}

function enableStartGameButton() {
  // Re-enable buttons
  enableSelectionWheelEvents();
  const navButtons = document.querySelectorAll(".optionNavButton");
  navButtons.forEach((button) => {
    button.disabled = false;
  });

  startGameButton.disabled = false;
  startGameButton.setAttribute("aria-busy", "false");
}

function disableStartGameButton() {
  // Disable buttons while fetching data
  disableSelectionWheelEvents();
  const navButtons = document.querySelectorAll(".optionNavButton");
  navButtons.forEach((button) => {
    button.disabled = true;
  });

  startGameButton.disabled = true;
  startGameButton.setAttribute("aria-busy", "true");
}

let observer;

function checkForElement() {
  const element = document.querySelector(
    "#boardContainer > div.lpv.lpv--moves-auto.lpv--controls-true.lpv--players.lpv--menu > div.lpv__menu.lpv__pane > a:nth-child(4)"
  );
  if (element) {
    // Temporarily disconnect observer
    observer.disconnect();

    element.style.pointerEvents = "none";
    element.setAttribute("tabindex", "-1");
    element.blur();
    element.textContent = "View on Lichess - disabled";

    // Reconnect observer
    observer.observe(document.body, { childList: true, subtree: true });

    if (roundEnded) {
      element.style.pointerEvents = "auto";
      element.removeAttribute("tabindex");

      // Temporarily disconnect observer again
      observer.disconnect();

      element.textContent = "View on Lichess ↗️";
      element.classList.add("enabled");

      // Reconnect observer
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }
}

function observeDocument() {
  observer = new MutationObserver((mutations) => {
    mutations.forEach(() => {
      checkForElement();
    });
  });

  // Start observing the document for added nodes
  observer.observe(document.body, { childList: true, subtree: true });
}

// Start observing the document
observeDocument();

// Track game abandonment when user leaves page
window.addEventListener('beforeunload', () => {
  if (gameInProgress && !isReviewMode) {
    tracker.trackGameAbandon(currentGameMode, currentRound + 1);
  }
});
