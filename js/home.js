import { processSelections } from "./other/utils.js";

const gameModesButtons = document.querySelectorAll(".gameModesButtons");
const singlePlayerButton = document.getElementById("singlePlayerButton");
const multiPlayerButton = document.getElementById("multiPlayerButton");
const privateRoomButton = document.getElementById("privateRoomButton");
const singlePlayerOptions = document.getElementById("singlePlayerOptions");
const multiPlayerOptions = document.getElementById("multiPlayerOptions");
const privateRoomOptions = document.getElementById("privateRoomOptions");
const roundsNext = document.getElementById("roundsNext");
const roundsPrev = document.getElementById("roundsPrev");
const timeControlNext = document.getElementById("timeControlNext");
const timeControlPrev = document.getElementById("timeControlPrev");
const evalNext = document.getElementById("evalNext");
const evalPrev = document.getElementById("evalPrev");
const musicToggleButton = document.getElementById("musicToggleButton");
const music = document.getElementById("music");

// Add event listener to each button
gameModesButtons.forEach((button) => {
  button.addEventListener("click", () => {
    // Remove 'active' class from all buttons
    gameModesButtons.forEach((btn) => {
      btn.classList.remove("active");
    });

    // Add 'active' class to the clicked button
    button.classList.add("active");

    // Show/hide options based on the clicked button
    if (button === singlePlayerButton) {
      singlePlayerOptions.style.display = "flex";
      multiPlayerOptions.style.display = "none";
      privateRoomOptions.style.display = "none";
    } else if (button === multiPlayerButton) {
      singlePlayerOptions.style.display = "none";
      multiPlayerOptions.style.display = "flex";
      privateRoomOptions.style.display = "none";
    } else if (button === privateRoomButton) {
      singlePlayerOptions.style.display = "none";
      multiPlayerOptions.style.display = "none";
      privateRoomOptions.style.display = "flex";
    }
  });
});

singlePlayerButton.click();
const distinctTimeControlOptions = ["Bullet", "Blitz", "Rapid", "Classical"];
const roundsOptions = ["5", "10", "Endless"];
const timeControlOptions = ["Any", ...distinctTimeControlOptions];
const evalOptions = ["Normal", "Hard"];

let optionSelections = {
  roundsSelection: roundsOptions[0],
  timeControlSelection: timeControlOptions[0],
  evalSelection: evalOptions[0],
};

export let gameConfigs = processSelections(optionSelections);

let roundsOptionsListCurrentIndex = 0;
let timeControlOptionsListCurrentIndex = 0;
let evalOptionsListCurrentIndex = 0;
let intervalId;

function updateOptionsSelection(optionLabel, action, valueList, currentIndex) {
  if (action === "prev") {
    currentIndex = (currentIndex - 1 + valueList.length) % valueList.length;
  } else if (action === "next") {
    currentIndex = (currentIndex + 1) % valueList.length;
  }

  document.getElementById(optionLabel).textContent = valueList[currentIndex];
  optionSelections[optionLabel] = valueList[currentIndex];
  gameConfigs = processSelections(
    optionSelections,
    distinctTimeControlOptions,
    evalOptions
  );
  return currentIndex;
}

function startContinuousUpdate(optionLabel, action, valueList, currentIndex) {
  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(() => {
    if (action === "next") {
      currentIndex = updateOptionsSelection(
        optionLabel,
        "next",
        valueList,
        currentIndex
      );
    } else if (action === "prev") {
      currentIndex = updateOptionsSelection(
        optionLabel,
        "prev",
        valueList,
        currentIndex
      );
    }
  }, 200);
  return currentIndex;
}

function stopContinuousUpdate() {
  clearInterval(intervalId);
}

// Update options on click
roundsNext.addEventListener("click", () => {
  roundsOptionsListCurrentIndex = updateOptionsSelection(
    "roundsSelection",
    "next",
    roundsOptions,
    roundsOptionsListCurrentIndex
  );
  optionSelections.rounds = optionSelections[roundsOptionsListCurrentIndex];
});

roundsPrev.addEventListener("click", () => {
  roundsOptionsListCurrentIndex = updateOptionsSelection(
    "roundsSelection",
    "prev",
    roundsOptions,
    roundsOptionsListCurrentIndex
  );
});

timeControlNext.addEventListener("click", () => {
  timeControlOptionsListCurrentIndex = updateOptionsSelection(
    "timeControlSelection",
    "next",
    timeControlOptions,
    timeControlOptionsListCurrentIndex
  );
});

timeControlPrev.addEventListener("click", () => {
  timeControlOptionsListCurrentIndex = updateOptionsSelection(
    "timeControlSelection",
    "prev",
    timeControlOptions,
    timeControlOptionsListCurrentIndex
  );
});

evalNext.addEventListener("click", () => {
  evalOptionsListCurrentIndex = updateOptionsSelection(
    "evalSelection",
    "next",
    evalOptions,
    evalOptionsListCurrentIndex
  );
});

evalPrev.addEventListener("click", () => {
  evalOptionsListCurrentIndex = updateOptionsSelection(
    "evalSelection",
    "prev",
    evalOptions,
    evalOptionsListCurrentIndex
  );
});

// Start continuous update on mousedown
roundsNext.addEventListener("mousedown", () => {
  startContinuousUpdate(
    "roundsSelection",
    "next",
    roundsOptions,
    roundsOptionsListCurrentIndex
  );
});

roundsPrev.addEventListener("mousedown", () => {
  startContinuousUpdate(
    "roundsSelection",
    "prev",
    roundsOptions,
    roundsOptionsListCurrentIndex
  );
});

timeControlNext.addEventListener("mousedown", () => {
  startContinuousUpdate(
    "timeControlSelection",
    "next",
    timeControlOptions,
    timeControlOptionsListCurrentIndex
  );
});

timeControlPrev.addEventListener("mousedown", () => {
  startContinuousUpdate(
    "timeControlSelection",
    "prev",
    timeControlOptions,
    timeControlOptionsListCurrentIndex
  );
});

evalNext.addEventListener("mousedown", () => {
  startContinuousUpdate(
    "evalSelection",
    "next",
    evalOptions,
    evalOptionsListCurrentIndex
  );
});

evalPrev.addEventListener("mousedown", () => {
  startContinuousUpdate(
    "evalSelection",
    "prev",
    evalOptions,
    evalOptionsListCurrentIndex
  );
});

// Stop continuous update on mouseup or mouseleave
document.addEventListener("mouseup", stopContinuousUpdate);
document.addEventListener("mouseleave", stopContinuousUpdate);

// Scroll event to iterate through options

const roundsWheelEvent = (event) => {
  event.preventDefault();
  if (event.deltaY > 0) {
    // Scroll down
    roundsOptionsListCurrentIndex = updateOptionsSelection(
      "roundsSelection",
      "next",
      roundsOptions,
      roundsOptionsListCurrentIndex
    );
    roundsNext.classList.add("active");
  } else if (event.deltaY < 0) {
    // Scroll up
    roundsOptionsListCurrentIndex = updateOptionsSelection(
      "roundsSelection",
      "prev",
      roundsOptions,
      roundsOptionsListCurrentIndex
    );
    roundsPrev.classList.add("active");
  }
  setTimeout(() => {
    roundsNext.classList.remove("active");
    roundsPrev.classList.remove("active");
  }, 200);
};

const timeControlWheelEvent = (event) => {
  event.preventDefault();
  if (event.deltaY > 0) {
    // Scroll down
    timeControlOptionsListCurrentIndex = updateOptionsSelection(
      "timeControlSelection",
      "next",
      timeControlOptions,
      timeControlOptionsListCurrentIndex
    );
    timeControlNext.classList.add("active");
  } else if (event.deltaY < 0) {
    // Scroll up
    timeControlOptionsListCurrentIndex = updateOptionsSelection(
      "timeControlSelection",
      "prev",
      timeControlOptions,
      timeControlOptionsListCurrentIndex
    );
    timeControlPrev.classList.add("active");
  }
  setTimeout(() => {
    timeControlNext.classList.remove("active");
    timeControlPrev.classList.remove("active");
  }, 200);
};

const evalWheelEvent = (event) => {
  event.preventDefault(); // Prevent default scrolling behavior
  if (event.deltaY > 0) {
    // Scroll down
    evalOptionsListCurrentIndex = updateOptionsSelection(
      "evalSelection",
      "next",
      evalOptions,
      evalOptionsListCurrentIndex
    );
    evalNext.classList.add("active");
  } else if (event.deltaY < 0) {
    // Scroll up
    evalOptionsListCurrentIndex = updateOptionsSelection(
      "evalSelection",
      "prev",
      evalOptions,
      evalOptionsListCurrentIndex
    );
    evalPrev.classList.add("active");
  }
  setTimeout(() => {
    evalNext.classList.remove("active");
    evalPrev.classList.remove("active");
  }, 200);
};

export function enableSelectionWheelEvents() {
  document
    .getElementById("evalSelection")
    .addEventListener("wheel", evalWheelEvent);
  document
    .getElementById("roundsSelection")
    .addEventListener("wheel", roundsWheelEvent);
  document
    .getElementById("timeControlSelection")
    .addEventListener("wheel", timeControlWheelEvent);
}

export function disableSelectionWheelEvents() {
  document
    .getElementById("evalSelection")
    .removeEventListener("wheel", evalWheelEvent);
  document
    .getElementById("roundsSelection")
    .removeEventListener("wheel", roundsWheelEvent);
  document
    .getElementById("timeControlSelection")
    .removeEventListener("wheel", timeControlWheelEvent);
}

// Initialize the selections with the first value
document.getElementById("roundsSelection").textContent =
  optionSelections.roundsSelection;
document.getElementById("timeControlSelection").textContent =
  optionSelections.timeControlSelection;
document.getElementById("evalSelection").textContent =
  optionSelections.evalSelection;

enableSelectionWheelEvents();

musicToggleButton.addEventListener("click", () => {
  musicToggleButton.classList.toggle("active");
  if (music.paused) {
    music.volume = 0.7; // Set the volume to 0.7
    music.play();
  } else {
    music.pause();
  }
});
