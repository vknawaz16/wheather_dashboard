// ===== Setup =====

// We use Open-Meteo, a free weather API that needs NO API key at all,
// so there's no "key not active yet" problem to worry about.
// Docs: https://open-meteo.com/

// Step 1: turn a city name into coordinates (geocoding)
const geocodeUrl = "https://geocoding-api.open-meteo.com/v1/search";

// Step 2: get the weather for those coordinates
const forecastUrl = "https://api.open-meteo.com/v1/forecast";

// Get references to all the elements we need
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");

const loading = document.getElementById("loading");
const errorMsg = document.getElementById("error");
const weatherCard = document.getElementById("weatherCard");

const cityName = document.getElementById("cityName");
const condition = document.getElementById("condition");
const temperature = document.getElementById("temperature");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");

// ===== Run search when button is clicked =====
searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();

  if (city === "") {
    alert("Please enter a city name.");
    return;
  }

  getWeather(city);
});

// Also allow pressing "Enter" in the input box
cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    searchBtn.click();
  }
});

// ===== Main function to fetch weather data =====
async function getWeather(city) {
  // Reset the UI before starting a new search
  weatherCard.classList.add("hidden");
  errorMsg.classList.add("hidden");
  loading.classList.remove("hidden");

  try {
    // --- Step 1: look up the city's coordinates ---
    const geoResponse = await fetch(
      `${geocodeUrl}?name=${encodeURIComponent(city)}&count=1`
    );

    if (!geoResponse.ok) {
      throw new Error(`Geocoding request failed (status ${geoResponse.status})`);
    }

    const geoData = await geoResponse.json();

    // If no matching place was found, "results" will be missing
    if (!geoData.results || geoData.results.length === 0) {
      errorMsg.textContent = "City not found. Please check the spelling.";
      errorMsg.classList.remove("hidden");
      return;
    }

    const place = geoData.results[0];

    // --- Step 2: fetch the current weather for that location ---
    const weatherResponse = await fetch(
      `${forecastUrl}?latitude=${place.latitude}&longitude=${place.longitude}` +
      `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`
    );

    if (!weatherResponse.ok) {
      throw new Error(`Weather request failed (status ${weatherResponse.status})`);
    }

    const weatherData = await weatherResponse.json();
    showWeather(place, weatherData.current);

  } catch (err) {
    // This runs for network failures (offline, DNS, blocked request, etc.)
    console.error(err);
    errorMsg.textContent = "Couldn't reach the weather service. Check your internet connection.";
    errorMsg.classList.remove("hidden");

  } finally {
    // Always hide the loading message when we're done
    loading.classList.add("hidden");
  }
}

// Open-Meteo returns a numeric "weather code" instead of a text description,
// so we translate the common codes into plain words ourselves.
function describeWeatherCode(code) {
  if (code === 0) return "clear sky";
  if (code <= 3) return "partly cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if (code >= 61 && code <= 67) return "rain";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 80 && code <= 82) return "rain showers";
  if (code >= 95) return "thunderstorm";
  return "unknown conditions";
}

// ===== Display the weather data on the page =====
function showWeather(place, current) {
  cityName.textContent = `${place.name}, ${place.country}`;
  condition.textContent = describeWeatherCode(current.weather_code);
  temperature.textContent = `${Math.round(current.temperature_2m)}°C`;
  humidity.textContent = current.relative_humidity_2m;

  // Open-Meteo already returns wind speed in km/h by default, no conversion needed
  wind.textContent = Math.round(current.wind_speed_10m);

  weatherCard.classList.remove("hidden");
}