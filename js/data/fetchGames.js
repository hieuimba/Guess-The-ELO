import { gamesURL } from "../other/config.js";

export async function fetchGames(timeControlSelection, roundsSelection) {
  const gamesURLWithParam =
    gamesURL + `?event=${timeControlSelection}&limit=${roundsSelection}`;

  try {
    const response = await fetch(gamesURLWithParam);
    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error("Error sending data:", error);
  }
}
