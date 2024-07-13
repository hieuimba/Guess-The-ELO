import { fetchKeysFromCache } from "./fetchKeys.js";
import { gamesURL } from "../other/config.js";

let usedGameIDs = [];

export async function fetchGames(timeControlSelections) {
  const keysData = await fetchKeysFromCache();
  const gameID = timeControlSelections.map((timeControl) =>
    getRandomGameID(timeControl, keysData)
  );

  const postData = {
    GameID: gameID,
  };

  console.log(postData.GameID);

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postData),
  };
  try {
    const response = await fetch(gamesURL, options);
    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error("Error sending data:", error);
  }
}

export function resetUsedGameIDs() {
  usedGameIDs = [];
}

function getRandomGameID(event, keysData) {
  const eventData = keysData.find((item) => item.Event === event);

  if (eventData) {
    // Randomly select a month from the available months for the event
    const selectedMonthData =
      eventData.GameIDs[Math.floor(Math.random() * eventData.GameIDs.length)];

    // Function to generate a random game ID within the range of Min and Max game IDs
    function generateRandomID() {
      return (
        Math.floor(
          Math.random() *
            (selectedMonthData.Range.Max - selectedMonthData.Range.Min + 1)
        ) + selectedMonthData.Range.Min
      );
    }

    let randomGameID;
    let uniqueIDFound = false;
    let attemptCount = 0;
    const maxAttempts = 100; // Max attempts to find a unique ID to prevent infinite loops

    while (!uniqueIDFound && attemptCount < maxAttempts) {
      randomGameID = generateRandomID();
      const formattedGameID = `${selectedMonthData.Month}-${randomGameID}`;

      // Check if the generated ID is unique
      if (!usedGameIDs.includes(formattedGameID)) {
        uniqueIDFound = true;
        usedGameIDs.push(formattedGameID);
      } else {
        attemptCount++;
        console.log(`Duplicate found: ${formattedGameID}. Attempting again...`);
      }
    }

    if (!uniqueIDFound) {
      console.error(
        `Failed to generate unique game ID after ${maxAttempts} attempts.`
      );
      return null;
    }

    return `${selectedMonthData.Month}-${randomGameID}`;
  } else {
    return null;
  }
}
