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
  secondsLeft = secondsLeft - 1;
  const totalSecondsLeft = secondsLeft;
  clock.textContent = totalSecondsLeft + 1;
  countdownBar.value = totalSecondsLeft;
  countdownBar.max = totalSecondsLeft;
  updateCountdownColor(green);

  secondsLeft += 0.3;
  countdown = setInterval(() => {
    secondsLeft -= 0.1; // Subtract 0.01 seconds

    // Update the visual clock only at whole seconds
    if (Math.floor(secondsLeft) !== Math.floor(secondsLeft + 0.01)) {
      clock.textContent = Math.floor(secondsLeft) + 1;
      document.title = `Guess The ELO - ${Math.floor(secondsLeft) + 1}`;

      // Determine remaining time percentage
      const remainingPercentage = secondsLeft / totalSecondsLeft;
      remainingTimePercentage = remainingPercentage;
      // Change color based on remaining time percentage
      if (remainingPercentage >= 0.5) {
        updateCountdownColor(green, "#f2f2f2");
      } else if (remainingPercentage >= 0.25) {
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
