// ═══════════════════════════════════════════════════════════════
//  weather.js — Real weather overlay via Open-Meteo (free, no key)
//  Rain particles, cloud shadows, temperature display
// ═══════════════════════════════════════════════════════════════

let weatherData = null;
let lastWeatherPos = null;
let weatherParticles = [];
let weatherLoading = false;

// Weather codes: 0=clear, 1-3=cloudy, 45-48=fog, 51-57=drizzle,
// 61-67=rain, 71-77=snow, 80-82=showers, 85-86=snow showers, 95-99=thunderstorm
const WEATHER_NAMES = {
  0: 'Clear', 1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Rime Fog',
  51: 'Light Drizzle', 53: 'Drizzle', 55: 'Heavy Drizzle',
  61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain',
  71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow',
  77: 'Snow Grains', 80: 'Light Showers', 81: 'Showers', 82: 'Heavy Showers',
  85: 'Light Snow Showers', 86: 'Snow Showers',
  95: 'Thunderstorm', 96: 'Hail Storm', 99: 'Heavy Hail'
};

async function fetchWeather(lat, lng) {
  if (weatherLoading) return;
  weatherLoading = true;
  try {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat.toFixed(4) +
      '&longitude=' + lng.toFixed(4) +
      '&current=weather_code,temperature_2m,precipitation,wind_speed_10m,cloud_cover' +
      '&forecast_days=1';
    const res = await fetch(url);
    weatherData = await res.json();
    lastWeatherPos = { lat, lng };
  } catch (e) {
    console.log('Weather fetch error:', e);
  }
  weatherLoading = false;
}

function drawWeather() {
  if (!G.overlays.weather || !weatherData || !weatherData.current) return;

  const cur = weatherData.current;
  const wc = cur.weather_code || 0;
  const prec = cur.precipitation || 0;
  const cloud = cur.cloud_cover || 0;
  const temp = cur.temperature_2m;
  const wind = cur.wind_speed_10m || 0;
  const isSnow = wc >= 71 && wc <= 77 || wc >= 85 && wc <= 86;
  const isRain = wc >= 51 && wc <= 67 || wc >= 80 && wc <= 82;
  const isStorm = wc >= 95;

  // ── Cloud overlay ──
  if (cloud > 20) {
    ctx.globalAlpha = (cloud / 100) * 0.25;
    ctx.fillStyle = '#556';
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.globalAlpha = 1;
  }

  // ── Fog ──
  if (wc >= 45 && wc <= 48) {
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#aab';
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.globalAlpha = 1;
  }

  // ── Rain particles ──
  if (isRain || isStorm) {
    const intensity = isStorm ? 4 : prec > 5 ? 3 : prec > 1 ? 2 : 1;
    const maxP = intensity * 120;
    while (weatherParticles.length < maxP) {
      weatherParticles.push({
        x: Math.random() * cv.width,
        y: Math.random() * cv.height,
        len: 6 + Math.random() * 10 * intensity,
        spd: 3 + intensity * 2 + Math.random() * 3,
        drift: (wind * 0.1) + Math.random() * 0.5
      });
    }
    // Trim if too many
    if (weatherParticles.length > maxP) weatherParticles.length = maxP;

    ctx.strokeStyle = 'rgba(120, 180, 255, 0.5)';
    ctx.lineWidth = 1.2;
    weatherParticles.forEach(p => {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.drift * 2, p.y + p.len);
      ctx.stroke();
      p.y += p.spd;
      p.x += p.drift;
      if (p.y > cv.height + p.len) { p.y = -p.len; p.x = Math.random() * cv.width; }
      if (p.x > cv.width + 10) p.x = -10;
    });
  }

  // ── Snow particles ──
  if (isSnow) {
    const maxP = 200;
    while (weatherParticles.length < maxP) {
      weatherParticles.push({
        x: Math.random() * cv.width,
        y: Math.random() * cv.height,
        size: 1.5 + Math.random() * 3,
        spd: 0.5 + Math.random() * 1.5,
        drift: Math.sin(Math.random() * Math.PI * 2) * 0.5,
        wobble: Math.random() * Math.PI * 2
      });
    }
    if (weatherParticles.length > maxP) weatherParticles.length = maxP;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    weatherParticles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x + Math.sin(p.wobble + G.frameN * 0.02) * 2, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      p.y += p.spd;
      p.x += p.drift;
      if (p.y > cv.height + 5) { p.y = -5; p.x = Math.random() * cv.width; }
    });
  }

  // ── Lightning flash (thunderstorm) ──
  if (isStorm && G.frameN % 300 < 3 && Math.random() < 0.3) {
    ctx.globalAlpha = 0.15 + Math.random() * 0.1;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.globalAlpha = 1;
  }

  // Clear particles if weather changed to clear
  if (!isRain && !isSnow && !isStorm && weatherParticles.length > 0) {
    weatherParticles = [];
  }

  // ── Weather HUD (bottom-left info) ──
  const name = WEATHER_NAMES[wc] || ('Code ' + wc);
  const tempStr = temp !== undefined ? Math.round(temp) + '\u00B0C' : '?';
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(6, cv.height - 48, 140, 20);
  ctx.strokeStyle = 'rgba(0,191,255,0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(6, cv.height - 48, 140, 20);
  ctx.fillStyle = 'rgba(0,191,255,0.6)';
  ctx.font = "10px 'VT323',monospace";
  ctx.textAlign = 'left';
  ctx.fillText('\u{1F326} ' + name + ' ' + tempStr + ' \u{1F32C} ' + Math.round(wind) + 'km/h', 10, cv.height - 34);
}

// Check if weather needs refreshing (every 10 min or 50km movement)
function weatherCheck() {
  if (!G.overlays.weather) return;
  if (!lastWeatherPos || haversine(G.pos.lat, G.pos.lng, lastWeatherPos.lat, lastWeatherPos.lng) > 50) {
    fetchWeather(G.pos.lat, G.pos.lng);
  }
}
