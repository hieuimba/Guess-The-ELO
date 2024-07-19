// Get a random index within an array
export function getRandomElement(array) {
  const randomIndex = Math.floor(Math.random() * array.length);

  return array[randomIndex];
}

export function getRandomEloNumbers(
  correctElo,
  eloMin = 200,
  eloMax = 3500,
  diffMin = 300,
  diffMax = 600
) {
  const a = Math.floor((correctElo - eloMin) / diffMax);
  const b = Math.floor((eloMax - eloMin) / diffMax) - a;

  function calcRandomElos(correctIndex) {
    if (correctIndex === 1) {
      return [
        correctElo,
        correctElo + repeatAndSumRandomInt(diffMin, diffMax, 1),
        correctElo + repeatAndSumRandomInt(diffMin, diffMax, 2),
        correctElo + repeatAndSumRandomInt(diffMin, diffMax, 3),
      ];
    }
    if (correctIndex === 2) {
      return [
        correctElo - repeatAndSumRandomInt(diffMin, diffMax, 1),
        correctElo,
        correctElo + repeatAndSumRandomInt(diffMin, diffMax, 1),
        correctElo + repeatAndSumRandomInt(diffMin, diffMax, 2),
      ];
    }
    if (correctIndex === 3) {
      return [
        correctElo - repeatAndSumRandomInt(diffMin, diffMax, 2),
        correctElo - repeatAndSumRandomInt(diffMin, diffMax, 1),
        correctElo,
        correctElo + repeatAndSumRandomInt(diffMin, diffMax, 1),
      ];
    }
    if (correctIndex === 4) {
      return [
        correctElo - repeatAndSumRandomInt(diffMin, diffMax, 3),
        correctElo - repeatAndSumRandomInt(diffMin, diffMax, 2),
        correctElo - repeatAndSumRandomInt(diffMin, diffMax, 1),
        correctElo,
      ];
    }
  }

  let correctIndex;
  if (a === 0) {
    correctIndex = 1;
  } else if (a === 1) {
    correctIndex = getRandomElement([1, 2]);
  } else if (a === 2) {
    correctIndex = getRandomElement([1, 2, 3]);
  } else if (a >= 3 && b >= 3) {
    correctIndex = getRandomElement([1, 2, 3, 4]);
  } else if (b === 2) {
    correctIndex = getRandomElement([2, 3, 4]);
  } else if (b === 1) {
    correctIndex = getRandomElement([3, 4]);
  } else if (b === 0) {
    correctIndex = 4;
  }
  let c = calcRandomElos(correctIndex);
  return c;
}

getRandomEloNumbers(1200, 200, 3500);
// Get a random int within a range
export function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function repeatAndSumRandomInt(min, max, times) {
  let sum = 0;
  for (let i = 0; i < times; i++) {
    sum += getRandomInt(min, max);
  }
  return sum;
}

// Explode timecontrol & eval selections into arrays, add random orientation
export function processSelections(selections) {
  selections.roundsSelection =
    selections.roundsSelection === "Endless"
      ? "300"
      : selections.roundsSelection;
  const processedSelections = {
    rounds: selections.roundsSelection,
    difficulty: selections.evalSelection,
    timeControls: selections.timeControlSelection,
  };

  return processedSelections;
}
