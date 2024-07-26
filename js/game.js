import { gameConfigs } from "./home.js";
import { fetchGames } from "./data/fetchGames.js";
import {
  initializeChessBoard,
  removeChessBoard,
} from "./elements/chessBoard.js";
import { clearCountdown, startCountdown } from "./elements/clock.js";
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

const singlePlayerStartButton = document.getElementById(
  "singlePlayerStartButton"
);
const nextGameButton = document.getElementById("nextGameButton");
const viewResultButton = document.getElementById("viewResultButton");
const mainMenuButton = document.getElementById("mainMenuButton");
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
let longestStreak = 0;

let maxRounds = 0;
let gameTimeControls = "";
let gameDifficulty = "";
let livesCount = 3;
let partialLivesCount = 0;
let currentRound = 0;

let roundEnded = false;

function resetVariables() {
  gameArray = [];
  gameScore = 0;
  streakCount = 0;
  correctElo = 0;

  correctCount = 0;
  totalStreakBonus = 0;
  longestStreak = 0;

  maxRounds = 0;
  gameTimeControls = "";
  gameDifficulty = "";
  livesCount = 3;
  currentRound = 0;
  partialLivesCount = 0;
  document.getElementById("heartsContainer").classList.remove("shrink");

  roundEnded = false;
}

function playSound(elementId) {
  const audio = document.getElementById(elementId);
  audio.currentTime = 0; // Rewind clip to start
  audio.play();
}

singlePlayerStartButton.addEventListener("click", async () => {
  playSound("gameStartSound");
  disableStartGameButton();
  resetVariables();
  maxRounds = parseInt(gameConfigs.rounds);
  gameTimeControls = gameConfigs.timeControls;
  gameDifficulty = gameConfigs.difficulty;
  gameArray = await fetchGames(gameTimeControls, maxRounds);
  generateHeartIcons();
  newGame(gameArray[currentRound]);

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
  adjustScreen();
});

function updateResultScreen() {
  const resultHeader = document.getElementById("resultHeader");
  if (maxRounds > 10) {
    if (currentRound > 10) {
      resultHeader.textContent = getRandomElement(resultHeaderAllCorrect);
    } else if (currentRound > 3) {
      resultHeader.textContent = getRandomElement(resultHeaderPositive);
    } else {
      resultHeader.textContent = getRandomElement(resultHeaderNegative);
    }
  } else {
    if (maxRounds === 5) {
      if (correctCount <= 2) {
        resultHeader.textContent = getRandomElement(resultHeaderNegative);
      } else if (correctCount > 2 && correctCount <= 4) {
        resultHeader.textContent = getRandomElement(resultHeaderPositive);
      } else {
        resultHeader.textContent = getRandomElement(resultHeaderAllCorrect);
      }
    } else if (maxRounds === 10) {
      if (correctCount <= 2) {
        resultHeader.textContent = getRandomElement(resultHeaderNegative);
      } else if (correctCount > 2 && correctCount <= 9) {
        resultHeader.textContent = getRandomElement(resultHeaderPositive);
      } else {
        resultHeader.textContent = getRandomElement(resultHeaderAllCorrect);
      }
    }
  }

  const resultSummary = document.getElementById("resultSummary");
  if (maxRounds > 10) {
    resultSummary.textContent = `You made it to round ${currentRound}!`;
  } else {
    resultSummary.textContent = `You got ${correctCount} out of ${maxRounds} games right`;
  }

  document.getElementById("totalScore").textContent = "\u00A0";
  document.getElementById("totalBaseScoreValue").textContent = "\u00A0";
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
  const baseScore = gameScore - totalStreakBonus;

  let baseScoreAnimationTime = gameScore > 0 ? 1000 : 0;
  let totalStreakBonusAnimationTime = totalStreakBonus > 0 ? 1000 : 0;
  const longestStreakValueAnimationTime = 0;
  const totalScoreAnimationTime =
    baseScoreAnimationTime +
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

function setUpEloButtons(correctElo, eloMinRange, eloMaxRange) {
  // Select a random button for the correct answer
  const choices = shuffleArray(
    getRandomEloNumbers(parseInt(correctElo), eloMinRange, eloMaxRange)
  );

  // Enable buttons
  eloButtons.forEach((btn) => {
    btn.disabled = false;
    btn.removeAttribute("tabindex");
  });

  eloButtons.forEach((button, index) => {
    // Remove existing event listeners and classes
    button.classList.remove("correctGuess", "incorrectGuess", "unclickable");
    button.removeEventListener("click", eloButtonHandlers[button.id]);

    button.textContent = choices[index];

    // Assign ids to handler functions
    eloButtonHandlers[button.id] = () => {
      eloButtonClickHandler(button, correctElo);
    };
    // Add click event to buttons
    button.addEventListener("click", eloButtonHandlers[button.id]);
  });
}

function eloButtonClickHandler(button, correctElo) {
  const countdownSound = document.getElementById("countdownSound");
  if (!countdownSound.paused) {
    countdownSound.pause();
    countdownSound.currentTime = 0; // Reset the audio to the beginning
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
  if (remainingTimePercentage === undefined) {
    timeBonus = 500;
  } else {
    timeBonus = Math.round(500 * remainingTimePercentage);
  }

  let streakBonus = 0;

  // Disable buttons
  if (answer === "Time") {
    streakCount = 0;
    updateAnswerBannerElement(0, 0, true);
    removeHeart();
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

      updateAnswerBannerElement(correctScore + timeBonus, streakBonus);
      updateScoreElement(correctScore + timeBonus, streakBonus);
      addHeart();
    } else if (answer === "Incorrect") {
      playSound("incorrectSound");
      streakCount = 0;

      updateAnswerBannerElement(0, 0);
      removeHeart();
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
  if (maxRounds > 10 && livesCount < 5) {
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
  if (maxRounds > 10) {
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

  if (maxRounds > 10) {
    roundsText = `Round ${currentRound}`;
  } else {
    roundsText = `${currentRound} of ${maxRounds}`;
  }
  return roundsText;
}

function generateHeartIcons() {
  if (maxRounds > 10) {
    const heartsContainer = document.getElementById("heartsContainer");
    heartsContainer.innerHTML = ""; // Clear previous contents

    for (let i = 0; i < livesCount; i++) {
      const heartImg = document.createElement("img");
      heartImg.id = `heart${i}`;
      heartImg.className = "heartIcon";
      heartImg.src = "images/icons/heart.svg";
      heartsContainer.appendChild(heartImg);
    }
  }
}

export function updateAnswerBannerElement(
  addedScore,
  streakBonus,
  timeout = false
) {
  clearAnswerBanner();
  if (timeout === true) {
    answerBannerContent.textContent = getRandomElement(timeOutResponse);
    answerBanner.classList.add("active", "incorrect");
  } else if (addedScore === 0 && streakBonus === 0) {
    answerBannerContent.textContent = getRandomElement(incorrectGuessResponse);
    answerBanner.classList.add("active", "incorrect");
  } else {
    let correctResponse;
    if (streakBonus > 0) {
      correctResponse = getRandomElement([
        ...correctGuessResponseStreak,
        ...correctGuessResponse,
      ]);
      answerBannerContent.innerHTML = `${correctResponse} &nbsp; +${addedScore} points<div id = "streakBonus:">Streak Bonus &nbsp; +${streakBonus} points`;
    } else {
      correctResponse = getRandomElement(correctGuessResponse);
      answerBannerContent.innerHTML = `${correctResponse} &nbsp; +${addedScore} points`;
    }
    answerBanner.classList.add("active", "correct");
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
  const time = gameDifficulty === "Normal" ? 60 : 10;
  const evaluation = gameDifficulty === "Normal" ? true : false;
  const moves = gameDict.Moves;
  const orientation = getRandomElement(["white", "black"]);
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
  clearCountdown();
  startCountdown(time);
  roundEnded = false;
}

function enableStartGameButton() {
  // Re-enable buttons
  enableSelectionWheelEvents();
  const navButtons = document.querySelectorAll(".optionNavButton");
  navButtons.forEach((button) => {
    button.disabled = false;
  });
  singlePlayerStartButton.disabled = false;
  singlePlayerStartButton.setAttribute("aria-busy", "false");
}

function disableStartGameButton() {
  // Disable buttons while fetching data
  disableSelectionWheelEvents();
  const navButtons = document.querySelectorAll(".optionNavButton");
  navButtons.forEach((button) => {
    button.disabled = true;
  });
  singlePlayerStartButton.disabled = true;
  singlePlayerStartButton.setAttribute("aria-busy", "true");
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
