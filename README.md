# Outside Now

CCT360 Lab 6 — Working with API. A weather window built with plain HTML, CSS and JavaScript.

## Links

- Live: https://youssef-1-1lol.github.io/cct360-lab6/
- Repository: https://github.com/Youssef-1-1lol/cct360-lab6

## How it works

`loadWeather()` uses `fetch()` to retrieve JSON from `https://api.open-meteo.com/v1/forecast`. The request includes fixed city coordinates, current temperature, feels-like temperature, weather code, day/night status, cloud cover, wind speed, and today's forecast low/high. `response.json()` parses the response; `validateWeather()` checks the required values before updating the page.

`renderWeather()` updates the DOM and CSS variables. Weather codes select clear/cloud/rain/snow/fog/storm scenes; day/night changes the sky and sun/moon; cloud cover changes cloud opacity; wind speed changes animation duration. Rain and snow create different animated particles. These are interpretive illustrations, not photographs or exact forecasts of individual clouds.

Open-Meteo provides modelled current conditions, not a live camera or an on-site instrument reading. The model's local timestamp and timezone are shown separately from the browser's last-fetch time. Refresh requests run every five minutes while the page is visible, or when a city is selected or Refresh is pressed. Upstream weather values may stay unchanged between requests.

## Controls

- Select Oakville, Toronto, Montréal or Vancouver. Fixed coordinates avoid requesting location permissions.
- Toggle Celsius/Fahrenheit without another API request.
- Refresh weather on demand.
- Pause decorative motion. The page also respects the operating system's reduced-motion preference.

Loading, network errors, incomplete data and a 12-second timeout have visible states. Failed requests clear the old measurements rather than showing invented weather. An older city request cannot overwrite a newer selection.

## Run locally

Serve the folder with any static HTTP server, for example `python3 -m http.server 8000`, then open `http://localhost:8000`. No installation, build step or API key is needed. An internet connection is required for weather; fonts use local fallbacks if Google Fonts is unavailable.

## Lab 6 checklist

| Requirement | Implementation |
| --- | --- |
| Retrieve live public API data | Open-Meteo current-conditions request |
| Work with JSON and fetch | `loadWeather()` and response validation in `script.js` |
| DOM updates/data-driven interaction | Weather text, theme, clouds, wind animation and precipitation |
| Repository and live URLs | Both listed above |
| All site files in repository | `index.html`, `style.css`, `script.js`; scene uses CSS, no missing media |
| Individual work mode | Standalone lab repository, separate from Project 2 |

Development started November 9, 2026 outside class. The `Class Progress` commit records the first functioning API version, followed by validation/documentation work. Commits use their actual creation times; this does not claim an in-class checkpoint was completed.

## Credits and assistance

- Weather: [Open-Meteo](https://open-meteo.com/), [API documentation](https://open-meteo.com/en/docs), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Attribution also appears on the website.
- Fonts: DM Sans and Manrope through [Google Fonts](https://fonts.google.com/), with system sans-serif fallbacks.
- Landscape made with CSS shapes; no external photographs, sounds or template assets.
- HTML, CSS, JavaScript and documentation were developed with OpenAI Codex assistance. Review and understand the code and follow your course's AI-use/disclosure rules before submitting.

## Validation

- JavaScript syntax check passed.
- Browser check: actual API data, city selection, unit toggle and motion toggle.
- Phone-width layout (390 px): no horizontal overflow; controls fit.
- Isolated logic checks: clear/rain/snow/storm/fog/night, unit conversion, invalid API values, offline/timeout feedback, and protection against out-of-order city responses.
- Final Quercus submission is a separate step requiring the student's confirmation.
