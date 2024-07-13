// Get a random index within an array
export function getRandomElement(array) {
  const randomIndex = Math.floor(Math.random() * array.length);

  return array[randomIndex];
}

export function getRandomEloNumbers(originalElo, eloMinRange, eloMaxRange) {
  function getRandomElo(baseElo) {
    const minElo = Math.max(200, baseElo - eloMaxRange);
    const maxElo = Math.min(3000, baseElo + eloMaxRange);
    let elo;
    do {
      elo = Math.floor(Math.random() * (maxElo - minElo + 1)) + minElo;
    } while (elo < 200 || elo > 3000 || Math.abs(elo - baseElo) < eloMinRange);
    return elo;
  }

  const elo1 = getRandomElo(originalElo);
  let elo2, elo3;

  do {
    elo2 = getRandomElo(originalElo);
  } while (Math.abs(elo2 - elo1) < eloMinRange);

  do {
    elo3 = getRandomElo(originalElo);
  } while (
    Math.abs(elo3 - elo1) < eloMinRange ||
    Math.abs(elo3 - elo2) < eloMinRange
  );
  return [elo1, elo2, elo3];
}

// Get a random int within a range
export function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Explode timecontrol & eval selections into arrays, add random orientation
export function explodeSelections(selections, distinctTimeControlOptions) {
  const rounds = selections.roundsSelection;
  selections.roundsSelection =
    selections.roundsSelection === "Endless"
      ? "300"
      : selections.roundsSelection;
  const processedSelections = {
    rounds: selections.roundsSelection,
    difficulty: selections.evalSelection,
    timeControls: explodeSelection(
      selections.timeControlSelection,
      selections.roundsSelection,
      distinctTimeControlOptions
    ),
  };

  return processedSelections;
}

// Explode into array based on selected round number
function explodeSelection(selectedValue, numberOfRounds, valueArray) {
  if (selectedValue === "Any") {
    // Fill array with random elements
    numberOfRounds = parseFloat(numberOfRounds);
    return Array.from({ length: numberOfRounds }, () =>
      getRandomElement(valueArray)
    );
  } else {
    // Fill array with selection
    numberOfRounds = parseFloat(numberOfRounds);
    return Array(numberOfRounds).fill(selectedValue);
  }
}

export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function convertDictToListOfDicts(data) {
  const firstKey = Object.keys(data)[0];
  const arrayLength = data[firstKey].length;
  const resultArray = [];

  for (let i = 0; i < arrayLength; i++) {
    const resultDict = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        resultDict[key] = data[key][i];
      }
    }
    resultArray.push(resultDict);
  }

  return resultArray;
}
