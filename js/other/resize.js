const shade = document.getElementById("shade");
const gameScreen = document.getElementById("gameScreen");
const boardContainer = document.getElementById("boardContainer");
const eloButtonsContainer = document.getElementById("eloButtonsContainer");
const nextGameButton = document.getElementById("nextGameButton");
const viewResultButton = document.getElementById("viewResultButton");
const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);

function offsetHeight() {
  let offsetHeight;
  if (
    nextGameButton.offsetHeight === 0 &&
    viewResultButton.offsetHeight === 0
  ) {
    offsetHeight =
      (window.innerHeight - gameScreen.offsetHeight) / 2 -
      (eloButtonsContainer.firstElementChild.offsetHeight + 4.75 * rem) / 4;
  } else {
    offsetHeight = (window.innerHeight - gameScreen.offsetHeight) / 2;
  }
  if (gameScreen.style.display === "block") {
    document.body.style.alignItems = "stretch";
    shade.style.transform = `translateY(${offsetHeight}px)`;
  } else {
    document.body.style.alignItems = "center";
    shade.style.transform = "";
  }
}

function adjustEloButtonLayout() {
  const viewportHeight = window.innerHeight;
  const elementHeight = boardContainer.offsetHeight;
  // console.log(elementHeight, viewportHeight / 1.5);
  if (elementHeight < viewportHeight / 1.5) {
    // Adjust the condition as needed
    eloButtonsContainer.style.gridTemplateColumns = "1fr 1fr";
  } else {
    eloButtonsContainer.style.gridTemplateColumns = "repeat(4, 1fr)";
  }
}

export function adjustScreen() {
  adjustEloButtonLayout();
  offsetHeight();
}

const resizeObserver = new ResizeObserver(() => {
  adjustEloButtonLayout();
});
resizeObserver.observe(boardContainer);
window.addEventListener("resize", adjustScreen);

function endlessOptionCheck() {
  const div = document.getElementById("roundsSelection");
  if (div.textContent === "Endless") {
    div.classList.add("endlessStyle");
    div.setAttribute(
      "data-tooltip",
      "Start with 3 lives and earn an extra life for every 3 correct guesses"
    );
    div.style.borderBottomWidth = 0;
  } else {
    div.classList.remove("endlessStyle");
    div.removeAttribute("data-tooltip");
  }
}

const endlessOptionObserver = new MutationObserver(endlessOptionCheck);
endlessOptionObserver.observe(document.getElementById("roundsSelection"), {
  childList: true,
});

function difficultyOptionCheck() {
  const div = document.getElementById("evalSelection");
  if (div.textContent === "Hard") {
    div.classList.add("hardStyle");
    div.setAttribute(
      "data-tooltip",
      "No evaluation clues and reduced time for each guess"
    );
    div.style.borderBottomWidth = 0;
  } else {
    div.classList.remove("hardStyle");
    div.removeAttribute("data-tooltip");
  }
}

const difficultyOptionObserver = new MutationObserver(difficultyOptionCheck);
difficultyOptionObserver.observe(document.getElementById("evalSelection"), {
  childList: true,
});
