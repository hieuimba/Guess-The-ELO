import { keyURL } from "../other/config.js";

let cachedData = null;
let lastFetchedTime = 0;

export async function fetchKeysFromCache() {
  let keysData;

  // Check if cached data exists in localStorage
  const cachedDataString = localStorage.getItem("cachedData");
  const cachedTime = localStorage.getItem("lastFetchedTime");

  if (cachedDataString && cachedTime) {
    cachedData = JSON.parse(cachedDataString);
    lastFetchedTime = parseInt(cachedTime);
  }

  // If there is no cached data or the last fetch was more than 1 hour ago
  if (!cachedData || Date.now() - lastFetchedTime > 3600000 * 1) {
    keysData = await fetchKeys(); // Fetch new data
  } else {
    console.log(
      "Using cached keys, time left (minutes):",
      (3600000 - (Date.now() - lastFetchedTime)) / 1000 / 60
    );
    keysData = cachedData;
  }

  return keysData;
}

async function fetchKeys() {
  try {
    const response = await fetch(keyURL);
    const data = await response.json();
    lastFetchedTime = Date.now(); // Record the time of the last fetch
    // Store the data in localStorage
    localStorage.setItem("cachedData", JSON.stringify(data));
    localStorage.setItem("lastFetchedTime", lastFetchedTime.toString());
    console.log("Fetched new keys:", data);
    return data; // Return the fetched data
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

function getDistinctTimeControls(keyData) {
  // Default array to store distinct events
  const distinctEvents = [
    "UltraBullet",
    "Bullet",
    "Blitz",
    "Rapid",
    "Classical",
  ];

  keyData.forEach((item) => {
    // Check if the event already exists in the distinctEvents array
    if (!distinctEvents.includes(item.Event)) {
      // If not, add it to the array
      distinctEvents.push(item.Event);
    }
  });

  return distinctEvents;
}
const keysData = await fetchKeysFromCache();
export const distinctTimeControlOptions = getDistinctTimeControls(keysData);
