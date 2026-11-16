
// SELECT HTML ELEMENTS

const cityInputElmt = document.querySelector("#cityInput");
const weatherResultElmt = document.querySelector("#weatherResult");
const searchBtn = document.querySelector("#searchBtn");
const currentDateElmt = document.querySelector("#currentDate");


// DISPLAY CURRENT DATE

currentDateElmt.innerText = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
});


// SEARCH EVENTS

searchBtn.addEventListener("click", getWeather);

cityInputElmt.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        getWeather();
    }
});


// GET WEATHER

async function getWeather() {

    const city = cityInputElmt.value.trim();

    if (city === "") {
        showError("Please enter a city name.");
        return;
    }

    await fetchWeather(city);
}


// FETCH WEATHER DATA

async function fetchWeather(city) {

    try {

        searchBtn.disabled = true;
        searchBtn.innerText = "Loading...";

        weatherResultElmt.innerHTML = `
            <div class="welcome-card">
                <div class="welcome-emoji">🌍</div>
                <h3>Getting weather information...</h3>
                <p>Please wait a moment.</p>
            </div>
        `;


        // GET CITY LOCATION

        const geoUrl =
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

        const geoResponse = await fetch(geoUrl);

        if (!geoResponse.ok) {
            throw new Error("Unable to search for this city.");
        }

        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("City not found. Please try another city.");
        }

        const location = geoData.results[0];


        // GET WEATHER DATA

        const weatherUrl =
            `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&forecast_days=5&timezone=auto`;

        const weatherResponse = await fetch(weatherUrl);

        if (!weatherResponse.ok) {
            throw new Error("Unable to fetch weather information.");
        }

        const weatherData = await weatherResponse.json();

        renderData(location, weatherData);

    }

    catch (error) {

        console.log(error);

        showError(error.message);

    }

    finally {

        searchBtn.disabled = false;
        searchBtn.innerText = "Search";

    }
}


// WEATHER CONDITION

function getWeatherCondition(code) {

    if (code === 0) return "Clear Sky";

    if ([1, 2, 3].includes(code)) return "Partly Cloudy";

    if ([45, 48].includes(code)) return "Foggy";

    if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";

    if ([61, 63, 65, 66, 67].includes(code)) return "Rainy";

    if ([71, 73, 75, 77].includes(code)) return "Snowy";

    if ([80, 81, 82].includes(code)) return "Rain Showers";

    if ([85, 86].includes(code)) return "Snow Showers";

    if ([95, 96, 99].includes(code)) return "Thunderstorm";

    return "Unknown";
}


// WEATHER ICON

function getWeatherIcon(code, isDay = true) {

    if (code === 0) return isDay ? "☀️" : "🌙";

    if ([1, 2].includes(code)) return isDay ? "🌤️" : "☁️";

    if (code === 3) return "☁️";

    if ([45, 48].includes(code)) return "🌫️";

    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
        return "🌧️";
    }

    if ([71, 73, 75, 77, 85, 86].includes(code)) {
        return "❄️";
    }

    if ([95, 96, 99].includes(code)) return "⛈️";

    return "🌤️";
}


// FORMAT TIME

function formatTime(time) {

    return new Date(time).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit"
    });
}


// DISPLAY WEATHER DATA

function renderData(location, data) {

    const current = data.current;
    const hourly = data.hourly;
    const daily = data.daily;

    const isDay = current.is_day === 1;


    // HOURLY FORECAST

    const currentHourIndex = hourly.time.findIndex(
        time => time >= current.time
    );

    const startIndex = currentHourIndex === -1 ? 0 : currentHourIndex;

    let hourlyHTML = "";

    hourly.time.slice(startIndex, startIndex + 6).forEach((time, index) => {

        const actualIndex = startIndex + index;

        hourlyHTML += `
            <div class="hour-card">

                <div class="hour-time">
                    ${formatTime(time)}
                </div>

                <div class="hour-icon">
                    ${getWeatherIcon(hourly.weather_code[actualIndex])}
                </div>

                <div class="hour-temp">
                    ${Math.round(hourly.temperature_2m[actualIndex])}°
                </div>

                <div class="hour-rain">
                    💧 ${hourly.precipitation_probability[actualIndex] ?? 0}%
                </div>

            </div>
        `;

    });


    // FIVE DAY FORECAST

    let forecastHTML = "";

    daily.time.forEach((day, index) => {

        const date = new Date(day + "T00:00:00").toLocaleDateString(
            "en-US",
            { weekday: "short" }
        );

        forecastHTML += `
            <div class="forecast-card">

                <div class="forecast-day">
                    ${date}
                </div>

                <div class="forecast-icon">
                    ${getWeatherIcon(daily.weather_code[index])}
                </div>

                <div class="forecast-high">
                    ${Math.round(daily.temperature_2m_max[index])}°
                </div>

                <div class="forecast-low">
                    ${Math.round(daily.temperature_2m_min[index])}° low
                </div>

                <div class="forecast-condition">
                    ${getWeatherCondition(daily.weather_code[index])}
                </div>

            </div>
        `;

    });


    // MAIN WEATHER DASHBOARD

    weatherResultElmt.innerHTML = `

        <div class="weather-layout">

            <!-- CURRENT WEATHER -->

            <section class="panel main-weather">

                <p class="panel-label">CURRENT WEATHER</p>

                <h2 class="location-name">
                    📍 ${location.name}, ${location.country}
                </h2>

                <p class="weather-condition">
                    ${getWeatherCondition(current.weather_code)}
                </p>

                <div class="weather-display">

                    <div>
                        <h1 class="temperature">
                            ${Math.round(current.temperature_2m)}°
                        </h1>

                        <p class="feels-like">
                            Feels like ${Math.round(current.apparent_temperature)}°C
                        </p>
                    </div>

                    <div class="weather-emoji">
                        ${getWeatherIcon(current.weather_code, isDay)}
                    </div>

                </div>

                <p class="feels-like">
                    ${isDay ? "☀️ Daytime" : "🌙 Nighttime"}
                    &nbsp; | &nbsp;
                    Updated: ${formatTime(current.time)}
                </p>

            </section>


            <!-- WEATHER HIGHLIGHTS -->

            <section class="panel">

                <h3 class="section-heading">
                    Today's Highlights
                </h3>

                <div class="highlight-grid">

                    <div class="highlight-card">
                        <div class="highlight-top">
                            <span class="highlight-icon">💧</span>
                            Humidity
                        </div>

                        <div class="highlight-value">
                            ${current.relative_humidity_2m}%
                        </div>
                    </div>


                    <div class="highlight-card">
                        <div class="highlight-top">
                            <span class="highlight-icon">🌬️</span>
                            Wind Speed
                        </div>

                        <div class="highlight-value">
                            ${current.wind_speed_10m}
                            <span class="highlight-unit">km/h</span>
                        </div>
                    </div>


                    <div class="highlight-card">
                        <div class="highlight-top">
                            <span class="highlight-icon">☁️</span>
                            Cloud Cover
                        </div>

                        <div class="highlight-value">
                            ${current.cloud_cover}%
                        </div>
                    </div>


                    <div class="highlight-card">
                        <div class="highlight-top">
                            <span class="highlight-icon">🌡️</span>
                            Pressure
                        </div>

                        <div class="highlight-value">
                            ${Math.round(current.pressure_msl)}
                            <span class="highlight-unit">hPa</span>
                        </div>
                    </div>


                    <div class="highlight-card">
                        <div class="highlight-top">
                            <span class="highlight-icon">☀️</span>
                            UV Index
                        </div>

                        <div class="highlight-value">
                            ${daily.uv_index_max[0] ?? "N/A"}
                        </div>
                    </div>


                    <div class="highlight-card">
                        <div class="highlight-top">
                            <span class="highlight-icon">🌧️</span>
                            Precipitation
                        </div>

                        <div class="highlight-value">
                            ${current.precipitation}
                            <span class="highlight-unit">mm</span>
                        </div>
                    </div>

                </div>

            </section>

        </div>


        <!-- SUNRISE AND SUNSET -->

        <section class="panel sun-card">

            <div class="sun-item">
                <span>🌅 SUNRISE</span>
                <h4>${formatTime(daily.sunrise[0])}</h4>
            </div>

            <div class="sun-item">
                <span>🌇 SUNSET</span>
                <h4>${formatTime(daily.sunset[0])}</h4>
            </div>

        </section>


        <!-- HOURLY FORECAST -->

        <section class="hourly-section">

            <h3 class="section-heading">
                Hourly Forecast
            </h3>

            <div class="hourly-list">
                ${hourlyHTML}
            </div>

        </section>


        <!-- FIVE DAY FORECAST -->

        <section class="forecast-section">

            <h3 class="section-heading">
                5-Day Forecast
            </h3>

            <div class="forecast-grid">
                ${forecastHTML}
            </div>

        </section>

    `;

}


// ERROR MESSAGE

function showError(message) {

    weatherResultElmt.innerHTML = `

        <div class="error-card">

            <div class="welcome-emoji">⚠️</div>

            <h3>Something went wrong!</h3>

            <p>${message}</p>

        </div>

    `;

}
