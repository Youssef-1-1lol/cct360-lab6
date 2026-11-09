// City coordinates are public place centres, not the visitor's location.
const cities = {
  oakville: { name: 'Oakville, ON', latitude: 43.4516, longitude: -79.6877 },
  toronto: { name: 'Toronto, ON', latitude: 43.6532, longitude: -79.3832 },
  montreal: { name: 'Montréal, QC', latitude: 45.5019, longitude: -73.5674 },
  vancouver: { name: 'Vancouver, BC', latitude: 49.2827, longitude: -123.1207 }
};

const $ = (id) => document.getElementById(id);
const scene = $('window');
let latest = null;
let fahrenheit = false;
let activeRequest = null;

function weatherType(code) {
  if (code >= 95) return { kind: 'storm', label: 'Thunderstorms', caption: 'A stormy sky. Stay somewhere cosy.' };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { kind: 'snow', label: 'Snow', caption: 'A softer kind of outside.' };
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { kind: 'rain', label: 'Rain or drizzle', caption: 'A good day to bring an umbrella.' };
  if ([45, 48].includes(code)) return { kind: 'fog', label: 'Fog', caption: 'The horizon is taking a quiet moment.' };
  if (code === 3) return { kind: 'cloudy', label: 'Overcast', caption: 'A little cloud cover, a slower pace.' };
  if ([1, 2].includes(code)) return { kind: 'cloudy', label: code === 1 ? 'Mainly clear' : 'Partly cloudy', caption: 'A few clouds passing through.' };
  if (code === 0) return { kind: 'clear', label: 'Clear sky', caption: 'Room to breathe. Room to look up.' };
  return { kind: 'cloudy', label: 'Weather conditions unavailable', caption: 'A landscape shaped by the weather.' };
}

function temperature(value) {
  return Math.round(fahrenheit ? value * 9 / 5 + 32 : value);
}

function renderTemperatures() {
  const unit = fahrenheit ? '°F' : '°C';
  $('temperature-unit').textContent = unit;
  $('unit').innerHTML = fahrenheit ? '°F <span aria-hidden="true">/ °C</span>' : '°C <span aria-hidden="true">/ °F</span>';
  $('unit').setAttribute('aria-label', `Switch temperature to ${fahrenheit ? 'Celsius' : 'Fahrenheit'}`);
  if (!latest) return;
  $('temperature').textContent = temperature(latest.current.temperature_2m);
  $('feels-like').textContent = `Feels like ${temperature(latest.current.apparent_temperature)}${unit}`;
  $('range').textContent = `${temperature(latest.daily.temperature_2m_min[0])}° → ${temperature(latest.daily.temperature_2m_max[0])}°`;
  $('range').setAttribute('aria-label', `Forecast low ${temperature(latest.daily.temperature_2m_min[0])}${unit}, high ${temperature(latest.daily.temperature_2m_max[0])}${unit}`);
}

// Data drives the DOM text, sky, cloud opacity, precipitation and movement.
function renderWeather(data, city) {
  const current = data.current;
  const weather = weatherType(current.weather_code);
  scene.dataset.weather = weather.kind;
  scene.dataset.night = String(current.is_day === 0);
  scene.style.setProperty('--cloud-opacity', Math.max(.08, current.cloud_cover / 100 * .85));
  scene.style.setProperty('--wind-duration', `${Math.max(3, 28 - current.wind_speed_10m / 2)}s`);
  $('location-stamp').textContent = city.name.toUpperCase();
  $('condition').textContent = weather.label;
  $('scene-caption').textContent = current.is_day === 0 && weather.kind === 'clear' ? 'A quiet sky after dark.' : weather.caption;
  $('wind').textContent = Math.round(current.wind_speed_10m);
  $('wind-note').textContent = current.wind_speed_10m < 10 ? 'Just a gentle breeze' : current.wind_speed_10m < 25 ? 'A little movement in the trees' : 'A breezy scene outside';
  $('cloud').textContent = Math.round(current.cloud_cover);
  const particles = $('precipitation');
  particles.replaceChildren();
  if (['rain', 'storm', 'snow'].includes(weather.kind)) {
    for (let i = 0; i < 35; i++) {
      const drop = document.createElement('span');
      drop.className = weather.kind === 'snow' ? 'drop flake' : 'drop';
      drop.style.setProperty('--x', `${(i * 37) % 110}%`);
      drop.style.setProperty('--duration', weather.kind === 'snow' ? `${4 + i % 4}s` : `${.7 + (i % 4) * .15}s`);
      drop.style.setProperty('--delay', `${-i * .21}s`);
      particles.append(drop);
    }
  }
  renderTemperatures();
  $('data-badge').textContent = 'LIVE DATA';
  // API timestamps have no offset: display their literal local time with the supplied timezone.
  const modelTime = current.time.replace('T', ' · ');
  $('status').textContent = `Model time ${modelTime} (${data.timezone}). Last fetched ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
}

function validateWeather(data) {
  const currentKeys = ['temperature_2m', 'apparent_temperature', 'cloud_cover', 'wind_speed_10m', 'weather_code', 'is_day'];
  return data.current && currentKeys.every((key) => Number.isFinite(data.current[key]))
    && typeof data.current.time === 'string' && typeof data.timezone === 'string'
    && Number.isFinite(data.daily?.temperature_2m_min?.[0]) && Number.isFinite(data.daily?.temperature_2m_max?.[0]);
}

async function loadWeather() {
  if (activeRequest) activeRequest.abort();
  const controller = new AbortController();
  activeRequest = controller;
  const city = cities[$('city').value];
  const timeout = setTimeout(() => controller.abort(), 12000);
  scene.setAttribute('aria-busy', 'true');
  $('refresh').disabled = true;
  $('data-badge').textContent = 'UPDATING';
  $('status').textContent = `Loading weather for ${city.name}…`;
  const params = new URLSearchParams({
    latitude: city.latitude, longitude: city.longitude,
    current: 'temperature_2m,apparent_temperature,is_day,weather_code,cloud_cover,wind_speed_10m',
    daily: 'temperature_2m_max,temperature_2m_min', timezone: 'auto', forecast_days: '1'
  });
  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal: controller.signal });
    if (!response.ok) throw new Error(`Weather service returned ${response.status}`);
    const data = await response.json();
    if (!validateWeather(data)) throw new Error('Incomplete weather data');
    if (activeRequest !== controller) return;
    latest = data;
    renderWeather(data, city);
  } catch (error) {
    if (activeRequest !== controller) return;
    latest = null;
    $('location-stamp').textContent = city.name.toUpperCase();
    $('data-badge').textContent = 'UNAVAILABLE';
    $('condition').textContent = 'Weather is taking a moment.';
    $('temperature').textContent = '—';
    $('feels-like').textContent = 'No current weather to display';
    $('wind').textContent = '—'; $('cloud').textContent = '—'; $('range').textContent = '—';
    $('range').removeAttribute('aria-label');
    $('wind-note').textContent = 'Waiting for the breeze';
    $('scene-caption').textContent = 'Illustration only — live weather unavailable.';
    $('precipitation').replaceChildren();
    scene.dataset.weather = 'clear'; scene.dataset.night = 'false';
    scene.style.removeProperty('--cloud-opacity'); scene.style.removeProperty('--wind-duration');
    $('status').textContent = error.name === 'AbortError' ? 'The weather request timed out. Try Refresh.' : 'Could not load weather. Check your connection and try Refresh.';
  } finally {
    clearTimeout(timeout);
    if (activeRequest === controller) {
      activeRequest = null;
      scene.setAttribute('aria-busy', 'false');
      $('refresh').disabled = false;
    }
  }
}

$('city').addEventListener('change', loadWeather);
$('refresh').addEventListener('click', loadWeather);
$('unit').addEventListener('click', () => { fahrenheit = !fahrenheit; renderTemperatures(); });
$('motion').checked = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function updateMotion() { scene.classList.toggle('paused', $('motion').checked); }
$('motion').addEventListener('change', updateMotion);
updateMotion();
loadWeather();
setInterval(() => { if (!document.hidden && !activeRequest) loadWeather(); }, 5 * 60 * 1000);
