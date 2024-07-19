import {
  displayNextButton,
  updateAnswerBannerElement,
  removeHeart,
} from "../game.js";

const clock = document.getElementById("clock");
const countdownBar = document.getElementById("countdownBar");
const eloButtons = document.querySelectorAll("#eloButtonsContainer .eloButton");
const green = "#398712";
const yellow = "#FF9500";
const red = "#D93526";
let countdown;
export let remainingTimePercentage;

export function startCountdown(secondsLeft, correctElo) {
  const totalSecondsLeft = secondsLeft;
  clock.textContent = totalSecondsLeft;
  countdownBar.value = totalSecondsLeft;
  countdownBar.max = totalSecondsLeft;
  let wholeSecondsLeft;
  updateCountdownColor(green);

  countdown = setInterval(() => {
    secondsLeft = (secondsLeft - 0.1).toFixed(2); // Subtract 0.1 seconds
    wholeSecondsLeft = Math.floor(secondsLeft).toFixed(2);
    // Update the visual clock only at whole seconds
    if (secondsLeft === wholeSecondsLeft) {
      clock.textContent = Math.floor(secondsLeft);
      document.title = `Guess The ELO - ${Math.floor(secondsLeft)}`;

      // Determine remaining time percentage
      const remainingPercentage = secondsLeft / totalSecondsLeft;
      remainingTimePercentage = remainingPercentage;
      // Change color based on remaining time percentage
      if (remainingPercentage > 0.5) {
        updateCountdownColor(green, "#f2f2f2");
      } else if (remainingPercentage > 0.25) {
        updateCountdownColor(yellow, "#1F1F1F");
      } else {
        updateCountdownColor(red, "#1F1F1F");
      }
    }
    countdownBar.value = secondsLeft;
    if (secondsLeft <= 11) {
      document.getElementById("countdownSound").play();
    }
    // Check if time has run out
    if (secondsLeft <= 0) {
      clock.textContent = "0";
      document.title = `Guess The ELO - Time Out!`;
      clearCountdown();
      eloButtons.forEach((button) => {
        if (button.textContent === correctElo) {
          button.classList.add("correctGuess");
        }
        button.disabled = true;
      });
      updateAnswerBannerElement(0, 0, 0, true);
      removeHeart();
      displayNextButton();
    }
  }, 100); // Update the clock every 0.01 seconds
}

function updateCountdownColor(backgroundColor, fontColor) {
  countdownBar.style.setProperty("--pico-progress-color", backgroundColor);
  clock.style.backgroundColor = backgroundColor;
  clock.style.color = fontColor;
}

export function clearCountdown() {
  clearInterval(countdown); // Clear any existing countdown interval
}
