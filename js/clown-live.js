// ═══════════════════════════════════════════════════════════════
//  clown-live.js — Live-location "Clown Walk" mode for Map Merger Venti
//
//  A GPS-anchored vehicle mode: your avatar becomes the shared rudventur.com
//  clown (js/clown-markers.js draws the same presence on Snout First).
//  Colour = your on-map position matches your real GPS. Grayscale = you've
//  wandered away from it (WASD/joystick) — tap the badge to snap back.
// ═══════════════════════════════════════════════════════════════

(function() {
  'use strict';

  const DRIFT_KM   = 0.03;   // ~30m — beyond this, considered "moved away from GPS"
  const AUTO_MS    = 30 * 1000; // matches Snout First's cadence
  const AUTOREFRESH_KEY = 'rv_clown_autorefresh';

  let clownActive = false;
  let clownSynced = true;
  let clownGpsFix = null;      // { lat, lng }
  let myClownRef = null;
  let autoTimer = null;
  let driftChecker = null;
  let faceImg = null;          // custom face from clown-face-maker.html, if saved

  loadCustomFace();

  // ── Options toggle (read by index.html's Options panel) ──
  window.clownAutoRefreshEnabled = localStorage.getItem(AUTOREFRESH_KEY) === 'true';

  window.toggleClownAutoRefresh = function(checked) {
    window.clownAutoRefreshEnabled = !!checked;
    localStorage.setItem(AUTOREFRESH_KEY, checked ? 'true' : 'false');
    if (clownActive) restartAutoTimer();
  };

  // ── Entering / leaving Clown-Walk mode (called from setV in game.js) ──
  window.enterClownWalk = async function() {
    clownActive = true;
    clownSynced = true;
    updateBadge();
    showBadge(true);

    await syncToGps({ silent: true, initial: true });

    driftChecker = setInterval(checkDrift, 1000);
    restartAutoTimer();

    if (await ensureFirebaseReady()) startPresence();
  };

  window.exitClownWalk = function() {
    clownActive = false;
    showBadge(false);
    if (driftChecker) { clearInterval(driftChecker); driftChecker = null; }
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    if (myClownRef) { myClownRef.remove(); myClownRef = null; }
  };

  function restartAutoTimer() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    if (window.clownAutoRefreshEnabled) {
      autoTimer = setInterval(() => syncToGps({ silent: true }), AUTO_MS);
    }
  }

  // ── Manual "reset to GPS" — also the badge's click handler ──
  window.refreshClownGps = function() {
    if (!clownActive) return;
    syncToGps({ silent: false });
  };

  async function syncToGps(opts) {
    opts = opts || {};
    try {
      const pos = await new Promise((res, rej) => {
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000, enableHighAccuracy: true });
      });
      clownGpsFix = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      G.pos.lat = clownGpsFix.lat;
      G.pos.lng = clownGpsFix.lng;
      clownSynced = true;
      updateBadge();
      if (!opts.silent) showToast('🤡 Position updated!', '#ff69b4');
      pushPresence();
    } catch (e) {
      if (opts.initial) {
        clownGpsFix = { lat: G.pos.lat, lng: G.pos.lng };
        showToast('No GPS — starting from map centre', '#ff69b4');
      } else if (!opts.silent) {
        showToast('Could not get GPS position', '#ff2244');
      }
    }
  }

  function checkDrift() {
    if (!clownActive || !clownGpsFix) return;
    const km = haversine(G.pos.lat, G.pos.lng, clownGpsFix.lat, clownGpsFix.lng);
    const nowSynced = km <= DRIFT_KM;
    if (nowSynced !== clownSynced) {
      clownSynced = nowSynced;
      updateBadge();
    }
  }

  // ── Firebase presence (shared with Snout First's clown_markers) ──
  let firebaseReady = false;

  async function ensureFirebaseReady() {
    if (firebaseReady) return true;
    if (typeof initFirebase !== 'function' || !initFirebase()) return false;
    const uid = await ensureAuth();
    firebaseReady = !!uid;
    return firebaseReady;
  }

  function startPresence() {
    if (!db) return;
    const uid = getUid();
    myClownRef = db.ref('clown_markers/' + CLOWN_CHANNEL + '/' + uid);
    pushPresence();
    myClownRef.onDisconnect().remove();
  }

  function pushPresence() {
    if (!myClownRef || !db) return;
    myClownRef.set({
      lat: G.pos.lat,
      lng: G.pos.lng,
      name: localStorage.getItem('rv_username') || 'Anonymous Clown',
      emoji: '🤡',
      last_updated: Date.now(),
      pet_id: null,
      pet_emoji: null,
      status: 'active'
    });
  }

  // ── Badge (status + manual refresh) ──
  function showBadge(show) {
    const el = document.getElementById('clownLiveBadge');
    if (el) el.classList.toggle('show', show);
  }

  function updateBadge() {
    const el = document.getElementById('clownLiveBadge');
    if (!el) return;
    if (clownSynced) {
      el.textContent = '🤡 Live at your GPS';
      el.classList.remove('desynced');
    } else {
      el.textContent = '🤡 Not your real spot — tap to reset';
      el.classList.add('desynced');
    }
  }

  // ── Custom face from clown-face-maker.html (optional) ──
  function loadCustomFace() {
    try {
      const dataUrl = localStorage.getItem('rv_clown_face_svg');
      if (!dataUrl) return;
      const img = new Image();
      img.onload = () => { faceImg = img; };
      img.src = dataUrl;
    } catch (e) { /* localStorage unavailable — fall back to emoji */ }
  }

  // ── Sprite (drawn at screen centre, like every other vehicle) ──
  window.drawClownSprite = function() {
    const px = cv.width / 2, py = cv.height / 2;
    const moving = Object.values(G.keys).some(Boolean);
    const bob = moving ? Math.sin(G.frameN * 0.18) * 2 : 0;
    const now = Date.now();

    const grayscale = !clownSynced;

    // Glow ring
    const glowAlpha = 0.25 + Math.sin(now * 0.003) * 0.1;
    ctx.beginPath();
    ctx.arc(px, py + bob, 26, 0, Math.PI * 2);
    ctx.fillStyle = grayscale ? 'rgba(160,160,160,' + glowAlpha + ')' : 'rgba(255,105,180,' + glowAlpha + ')';
    ctx.fill();

    ctx.save();
    if (grayscale) ctx.filter = 'grayscale(1) brightness(0.85)';

    if (faceImg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py + bob, 20, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(faceImg, px - 20, py + bob - 20, 40, 40);
      ctx.restore();
    } else {
      ctx.font = '32px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🤡', px, py + bob - 2);
    }
    ctx.restore();

    // Sync indicator dot
    ctx.beginPath();
    ctx.arc(px + 18, py + bob - 18, 4, 0, Math.PI * 2);
    ctx.fillStyle = grayscale ? '#888' : '#00ff41';
    ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.stroke();
  };

})();
