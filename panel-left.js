// ═══════════════════════════════════════════════════════════════
//  panel-left.js — Snout First Left Panel
//  Tabs: My Pets · GPS · Notebook · 🔴 LOST
//  Additive only — reads S.pets from main, writes nothing upstream
// ═══════════════════════════════════════════════════════════════

(function () {

// ── Constants ──
const HOLD_MS = 700; // hold duration to unlock LOST tab

// ── Inject panel HTML ──
function injectLeftPanel() {
  const html = `
  <style>
    .lp-root {
      position: fixed; top: 50px; left: 0; bottom: 0;
      width: 220px;
      background: rgba(26,18,10,0.94);
      border-right: 2px solid #cc8833;
      z-index: 950;
      display: flex; flex-direction: column;
      transition: width .2s, opacity .2s;
      backdrop-filter: blur(2px);
      font-family: 'VT323', monospace;
    }
    .lp-root.lp-collapsed { width: 26px; }
    .lp-root.lost-mode {
      border-right-color: #ff2222;
      box-shadow: 0 0 18px rgba(255,30,30,0.25);
    }

    .lp-toggle {
      position: absolute; top: 50%; right: -13px;
      transform: translateY(-50%);
      width: 13px; height: 44px;
      background: #cc8833; border-radius: 0 7px 7px 0;
      cursor: pointer; display: flex; align-items: center;
      justify-content: center; z-index: 955;
      font-size: .65rem; color: #1a120a; user-select: none;
    }
    .lp-root.lost-mode .lp-toggle { background: #ff2222; }

    .lp-inner {
      flex: 1; overflow: hidden; display: flex;
      flex-direction: column; min-width: 0;
    }
    .lp-root.lp-collapsed .lp-inner { opacity: 0; pointer-events: none; }

    /* Tab bar */
    .lp-tabs {
      display: flex; flex-shrink: 0;
      border-bottom: 1.5px solid rgba(204,136,51,0.25);
      overflow-x: auto;
    }
    .lp-tabs::-webkit-scrollbar { height: 0; }
    .lp-tab {
      flex-shrink: 0; padding: 5px 8px;
      color: rgba(255,204,102,0.4);
      font-size: .72rem; cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all .12s; white-space: nowrap;
      user-select: none;
    }
    .lp-tab.active { color: #ffcc66; border-bottom-color: #cc8833; }
    .lp-tab.lost-tab {
      color: rgba(255,60,60,0.5);
      border-bottom-color: transparent;
      position: relative;
    }
    .lp-tab.lost-tab.active {
      color: #ff3333;
      border-bottom-color: #ff2222;
      text-shadow: 0 0 8px rgba(255,30,30,0.6);
    }
    .lp-root.lost-mode .lp-tabs {
      border-bottom-color: rgba(255,30,30,0.3);
    }

    .lp-content { flex: 1; overflow-y: auto; padding: 6px; }

    /* Pet tile */
    .lp-pet-tile {
      background: rgba(0,0,0,0.3);
      border: 1.5px solid rgba(204,136,51,0.25);
      border-radius: 9px; padding: 6px 8px;
      margin-bottom: 5px; cursor: pointer;
      transition: all .12s; position: relative;
    }
    .lp-pet-tile:hover { border-color: #cc8833; background: rgba(204,136,51,0.07); }
    .lp-pet-tile.dragging-over { border-color: #88cc44; background: rgba(136,204,68,0.07); }
    .lp-pt-name {
      font-family: 'Bubblegum Sans', cursive;
      color: #ffcc66; font-size: .82rem;
      display: flex; align-items: center; gap: 4px;
    }
    .lp-pt-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #88cc44; flex-shrink: 0;
    }
    .lp-pt-dot.walk { background: #ffcc66; }
    .lp-pt-dot.lost { background: #ff3333; animation: lp-pulse 1s infinite; }
    @keyframes lp-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
    .lp-pt-breed { color: rgba(255,204,102,0.4); font-size: .68rem; margin-top: 2px; }
    .lp-pt-opts {
      position: absolute; top: 4px; right: 5px;
      background: none; border: none;
      color: rgba(204,136,51,0.35); cursor: pointer; font-size: .8rem;
    }
    .lp-pt-opts:hover { color: #cc8833; }

    /* GPS tab */
    .lp-gps-card {
      background: rgba(0,0,0,0.3);
      border: 1.5px solid rgba(136,204,68,0.2);
      border-radius: 9px; padding: 7px 8px; margin-bottom: 5px;
    }
    .lp-gps-name {
      font-family: 'Bubblegum Sans', cursive;
      color: #ffcc66; font-size: .8rem; margin-bottom: 4px;
    }
    .lp-gps-row { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px; }
    .lp-gps-btn {
      font-size: .65rem; padding: 2px 6px; border-radius: 5px;
      cursor: pointer; font-family: 'VT323', monospace;
      border: 1px solid rgba(136,204,68,0.3);
      background: rgba(136,204,68,0.08); color: #88cc44;
    }
    .lp-gps-btn:hover { background: rgba(136,204,68,0.18); }
    .lp-gps-btn.device {
      border-color: rgba(255,204,102,0.25);
      background: rgba(255,204,102,0.06);
      color: rgba(255,204,102,0.5);
    }
    .lp-gps-btn.device.linked {
      border-color: rgba(255,204,102,0.5);
      color: #ffcc66;
    }
    .lp-coords { color: rgba(255,204,102,0.45); font-size: .65rem; font-family: 'VT323', monospace; }

    /* Notebook tab */
    .lp-note {
      background: rgba(0,0,0,0.3);
      border: 1.5px solid rgba(204,136,51,0.2);
      border-radius: 9px; padding: 7px 8px; margin-bottom: 5px;
    }
    .lp-note-head {
      display: flex; align-items: center;
      justify-content: space-between; margin-bottom: 4px;
    }
    .lp-note-label {
      font-family: 'Bubblegum Sans', cursive;
      color: rgba(255,204,102,0.6); font-size: .75rem;
    }
    .lp-note-del {
      background: none; border: none;
      color: rgba(204,51,51,0.4); cursor: pointer; font-size: .75rem;
    }
    .lp-note-del:hover { color: #ff4444; }
    .lp-note-txt { color: rgba(255,204,102,0.75); font-size: .82rem; line-height: 1.3; }
    .lp-note-time { color: rgba(255,204,102,0.25); font-size: .6rem; margin-top: 3px; }
    .lp-note-form { margin-top: 6px; }
    .lp-note-select, .lp-note-input {
      width: 100%; background: rgba(0,0,0,0.4);
      color: #ffcc66; border: 1.5px solid rgba(204,136,51,0.3);
      padding: 4px 7px; border-radius: 7px;
      font-family: 'VT323', monospace; font-size: .82rem;
      outline: none; margin-bottom: 4px; resize: none;
    }
    .lp-note-input:focus, .lp-note-select:focus { border-color: #ffcc66; }
    .lp-note-save {
      width: 100%; padding: 4px;
      background: rgba(204,136,51,0.1);
      border: 1px solid rgba(204,136,51,0.35);
      color: #cc8833; border-radius: 7px;
      cursor: pointer; font-family: 'VT323', monospace; font-size: .75rem;
    }
    .lp-note-save:hover { background: rgba(204,136,51,0.2); }

    /* LOST tab */
    .lp-lost-header {
      text-align: center; padding: 8px 6px 4px;
      font-family: 'Bubblegum Sans', cursive;
      color: #ff3333; font-size: 1rem;
      text-shadow: 0 0 10px rgba(255,30,30,0.5);
    }
    .lp-lost-pet-btn {
      width: 100%; padding: 10px;
      background: rgba(180,20,20,0.15);
      border: 2px solid rgba(255,30,30,0.5);
      color: #ff4444; border-radius: 10px;
      cursor: pointer; font-family: 'Bubblegum Sans', cursive;
      font-size: .95rem; margin-bottom: 6px;
      transition: all .15s; text-align: left;
      display: flex; align-items: center; gap: 8px;
    }
    .lp-lost-pet-btn:hover {
      background: rgba(180,20,20,0.28);
      border-color: #ff2222;
      box-shadow: 0 0 12px rgba(255,20,20,0.2);
    }
    .lp-lost-pet-btn.active-lost {
      background: rgba(180,20,20,0.35);
      border-color: #ff2222;
      animation: lp-pulse 1.2s infinite;
    }
    .lp-found-btn {
      width: 100%; padding: 8px;
      background: rgba(20,140,20,0.15);
      border: 2px solid rgba(80,200,80,0.4);
      color: #88cc44; border-radius: 10px;
      cursor: pointer; font-family: 'Bubblegum Sans', cursive;
      font-size: .9rem; margin-bottom: 6px;
      transition: all .15s;
    }
    .lp-found-btn:hover { background: rgba(20,140,20,0.28); }
    .lp-lost-info {
      color: rgba(255,80,80,0.5); font-size: .68rem;
      text-align: center; padding: 4px; line-height: 1.4;
    }

    /* Add pet button */
    .lp-add-btn {
      margin: 5px; padding: 5px;
      background: rgba(136,204,68,0.06);
      border: 1.5px dashed rgba(136,204,68,0.25);
      color: #88cc44; border-radius: 9px;
      cursor: pointer; font-size: .72rem; text-align: center;
      font-family: 'VT323', monospace; flex-shrink: 0;
    }
    .lp-add-btn:hover { background: rgba(136,204,68,0.12); }

    /* Drop zone */
    .lp-drop-zone {
      border: 2px dashed rgba(136,204,68,0.0);
      border-radius: 9px; padding: 10px;
      text-align: center;
      color: rgba(136,204,68,0); font-size: .72rem;
      transition: all .2s; margin: 4px 0;
      font-family: 'VT323', monospace;
    }
    .lp-drop-zone.active {
      border-color: rgba(136,204,68,0.5);
      color: #88cc44;
      background: rgba(136,204,68,0.06);
    }
  </style>

  <div class="lp-root" id="lpRoot">
    <div class="lp-toggle" id="lpToggleBtn">◀</div>
    <div class="lp-inner">
      <div class="lp-tabs" id="lpTabBar">
        <div class="lp-tab active" data-lptab="pets">🐾 Pets</div>
        <div class="lp-tab" data-lptab="gps">📍 GPS</div>
        <div class="lp-tab" data-lptab="notebook">📓 Notes</div>
        <div class="lp-tab lost-tab" data-lptab="lost" id="lpLostTab">🔴 LOST</div>
      </div>
      <div class="lp-content" id="lpContent"></div>
      <div class="lp-add-btn" id="lpAddBtn">+ register a pet</div>
    </div>
  </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);
}

// ── State ──
let lpOpen = true;
let lpActiveTab = 'pets';
let lpNotes = JSON.parse(localStorage.getItem('sf_notes') || '[]');
let lpLostHoldTimer = null;

// ── Toggle ──
function lpToggle() {
  lpOpen = !lpOpen;
  const root = document.getElementById('lpRoot');
  const btn = document.getElementById('lpToggleBtn');
  root.classList.toggle('lp-collapsed', !lpOpen);
  btn.textContent = lpOpen ? '◀' : '▶';
}

// ── Tab switch ──
function lpSwitchTab(tab) {
  lpActiveTab = tab;
  document.querySelectorAll('.lp-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.lptab === tab);
  });
  lpRender();
}

// ── Render ──
function lpRender() {
  const el = document.getElementById('lpContent');
  if (!el) return;
  if (lpActiveTab === 'pets') el.innerHTML = lpRenderPets();
  else if (lpActiveTab === 'gps') el.innerHTML = lpRenderGPS();
  else if (lpActiveTab === 'notebook') lpRenderNotebook(el);
  else if (lpActiveTab === 'lost') el.innerHTML = lpRenderLost();
  lpBindContent();
}

// ── Pets tab ──
function lpRenderPets() {
  const pets = (typeof S !== 'undefined' ? S.pets : []) || [];
  if (!pets.length) {
    return '<div style="color:rgba(255,204,102,0.3);text-align:center;padding:16px;font-style:italic;font-size:.8rem">No pets yet...<br>Drop a pin or register one!</div>' +
      '<div class="lp-drop-zone" id="lpDropZone">drop from map or friends panel</div>';
  }
  return '<div class="lp-drop-zone" id="lpDropZone">drop from map or friends panel</div>' +
    pets.map((p, i) => {
      const em = (typeof SPECIES_EM !== 'undefined' ? SPECIES_EM[p.species] : '') || '🐾';
      const dotClass = p.lost ? 'lost' : (p.status === 'walking' ? 'walk' : '');
      return `<div class="lp-pet-tile" data-pidx="${i}" id="lpTile${i}">
        <button class="lp-pt-opts">⚙</button>
        <div class="lp-pt-name">
          <span class="lp-pt-dot ${dotClass}"></span>
          ${em} ${p.name}
          ${p.lost ? '<span style="color:#ff3333;font-size:.65rem;margin-left:4px">LOST</span>' : ''}
        </div>
        <div class="lp-pt-breed">${p.breed || p.species || ''} · ${p.lost ? '🔴 LOST' : (p.status || 'home')}</div>
      </div>`;
    }).join('');
}

// ── GPS tab ──
function lpRenderGPS() {
  const pets = (typeof S !== 'undefined' ? S.pets : []) || [];
  if (!pets.length) return '<div style="color:rgba(255,204,102,0.3);text-align:center;padding:16px;font-size:.8rem">No pets registered yet.</div>';
  return pets.map((p, i) => {
    const em = (typeof SPECIES_EM !== 'undefined' ? SPECIES_EM[p.species] : '') || '🐾';
    const hasGPS = p.gps || false;
    const hasDevice = p.gpsDevice || false;
    const lat = p.lat ? p.lat.toFixed(4) : '—';
    const lon = p.lon ? p.lon.toFixed(4) : '—';
    return `<div class="lp-gps-card">
      <div class="lp-gps-name">${em} ${p.name}</div>
      <div class="lp-coords">📍 ${lat}° N · ${lon}° W</div>
      <div class="lp-gps-row">
        <span class="lp-gps-btn" onclick="lpToggleGPS(${i})">${hasGPS ? '📍 GPS on' : '📍 GPS off'}</span>
        <span class="lp-gps-btn device ${hasDevice ? 'linked' : ''}" onclick="lpLinkDevice(${i})">${hasDevice ? '🔗 tracker linked' : '+ link device'}</span>
      </div>
      <div style="color:rgba(255,204,102,0.25);font-size:.6rem;margin-top:4px;font-family:'VT323',monospace">
        ${hasDevice ? '⚡ live tracking active — placeholder for device API' : 'No tracker device linked yet'}
      </div>
    </div>`;
  }).join('');
}

window.lpToggleGPS = function(i) {
  if (typeof S === 'undefined') return;
  S.pets[i].gps = !S.pets[i].gps;
  lpRender();
  if (typeof savePets === 'function') savePets();
};

window.lpLinkDevice = function(i) {
  if (typeof S === 'undefined') return;
  // PLACEHOLDER — connect to GPS tracker device API here
  // e.g. Tractive, Findster, Pod Tracker, etc.
  const name = S.pets[i].name;
  if (S.pets[i].gpsDevice) {
    S.pets[i].gpsDevice = false;
    if (typeof toast === 'function') toast(`📍 Tracker unlinked from ${name}`);
  } else {
    S.pets[i].gpsDevice = true;
    if (typeof toast === 'function') toast(`🔗 Tracker linked to ${name} (placeholder)`);
  }
  lpRender();
  if (typeof savePets === 'function') savePets();
};

// ── Notebook tab ──
function lpRenderNotebook(el) {
  const pets = (typeof S !== 'undefined' ? S.pets : []) || [];
  const petOptions = pets.map((p, i) =>
    `<option value="${i}">${(typeof SPECIES_EM !== 'undefined' ? SPECIES_EM[p.species] : '') || '🐾'} ${p.name}</option>`
  ).join('');

  const noteCards = lpNotes.slice().reverse().map((n, ri) => {
    const i = lpNotes.length - 1 - ri;
    const pet = n.petIdx >= 0 && pets[n.petIdx] ? pets[n.petIdx].name : 'General';
    const ago = lpTimeAgo(n.ts);
    return `<div class="lp-note">
      <div class="lp-note-head">
        <span class="lp-note-label">🐾 ${pet}</span>
        <button class="lp-note-del" onclick="lpDeleteNote(${i})">✕</button>
      </div>
      <div class="lp-note-txt">${lpEscape(n.text)}</div>
      <div class="lp-note-time">${ago}</div>
    </div>`;
  }).join('');

  el.innerHTML = noteCards +
    `<div class="lp-note-form">
      <select class="lp-note-select" id="lpNoteTarget">
        <option value="-1">📓 General note</option>
        ${petOptions}
      </select>
      <textarea class="lp-note-input" id="lpNoteText" rows="2" placeholder="e.g. Ferajna hates the carrier..."></textarea>
      <button class="lp-note-save" onclick="lpSaveNote()">💾 Save note</button>
    </div>`;
}

window.lpSaveNote = function() {
  const text = (document.getElementById('lpNoteText') || {}).value || '';
  const petIdx = parseInt((document.getElementById('lpNoteTarget') || {}).value || '-1');
  if (!text.trim()) return;
  lpNotes.push({ text: text.trim(), petIdx, ts: Date.now() });
  localStorage.setItem('sf_notes', JSON.stringify(lpNotes));
  lpRender();
  if (typeof toast === 'function') toast('📓 Note saved!');
};

window.lpDeleteNote = function(i) {
  lpNotes.splice(i, 1);
  localStorage.setItem('sf_notes', JSON.stringify(lpNotes));
  lpRender();
};

// ── LOST tab ──
function lpRenderLost() {
  const pets = (typeof S !== 'undefined' ? S.pets : []) || [];
  const lostMode = document.getElementById('lpRoot').classList.contains('lost-mode');

  if (!pets.length) {
    return '<div style="color:rgba(255,80,80,0.4);text-align:center;padding:16px;font-size:.8rem">No pets registered.<br>Register a pet first.</div>';
  }

  const petBtns = pets.map((p, i) => {
    const em = (typeof SPECIES_EM !== 'undefined' ? SPECIES_EM[p.species] : '') || '🐾';
    const isLost = p.lost || false;
    if (isLost) {
      return `<button class="lp-lost-pet-btn active-lost" onclick="lpMarkFound(${i})">
        ${em} ${p.name} <span style="margin-left:auto;font-size:.75rem">🔴 LOST</span>
      </button>
      <button class="lp-found-btn" onclick="lpMarkFound(${i})">✅ ${p.name} IS FOUND!</button>`;
    }
    return `<button class="lp-lost-pet-btn" onclick="lpMarkLost(${i})">
      ${em} ${p.name} <span style="margin-left:auto;font-size:.75rem;color:rgba(255,80,80,0.4)">mark lost →</span>
    </button>`;
  }).join('');

  const socialBtns = lostMode
    ? `<div style="margin-top:8px;border-top:1px solid rgba(255,30,30,0.2);padding-top:8px">
        <div style="color:rgba(255,80,80,0.5);font-size:.65rem;margin-bottom:5px">📢 Broadcast to:</div>
        <div id="lpSocialBtns"></div>
      </div>`
    : '';

  return `<div class="lp-lost-header">🔴 Lost Pet Alert</div>
    <div class="lp-lost-info">Tap a pet to mark lost.<br>The whole network will be alerted.</div>
    ${petBtns}
    ${socialBtns}`;
}

window.lpMarkLost = function(i) {
  if (typeof S === 'undefined') return;
  const pet = S.pets[i];
  if (!pet) return;
  if (!confirm(`Mark ${pet.name} as LOST? This will alert the whole Snout First network.`)) return;

  pet.lost = true;
  pet.lostAt = Date.now();
  pet.lostLat = pet.lat;
  pet.lostLon = pet.lon;

  if (typeof savePets === 'function') savePets();
  if (typeof activateLostMode === 'function') activateLostMode(pet);
  if (typeof toast === 'function') toast(`🔴 ${pet.name} marked as LOST. Network alerted.`);

  lpRender();

  // Inject social buttons via lost-social.js
  setTimeout(() => {
    const el = document.getElementById('lpSocialBtns');
    if (el && typeof renderLostSocialButtons === 'function') renderLostSocialButtons(pet, el);
  }, 50);
};

window.lpMarkFound = function(i) {
  if (typeof S === 'undefined') return;
  const pet = S.pets[i];
  if (!pet) return;
  pet.lost = false;
  pet.foundAt = Date.now();
  if (typeof savePets === 'function') savePets();
  if (typeof deactivateLostMode === 'function') deactivateLostMode();
  if (typeof toast === 'function') toast(`🎉 ${pet.name} is HOME SAFE! 🐾`);
  lpRender();
};

// ── LOST tab hold-to-unlock ──
function bindLostTabHold() {
  const tab = document.getElementById('lpLostTab');
  if (!tab) return;
  tab.addEventListener('pointerdown', () => {
    lpLostHoldTimer = setTimeout(() => {
      lpSwitchTab('lost');
    }, HOLD_MS);
  });
  tab.addEventListener('pointerup', () => clearTimeout(lpLostHoldTimer));
  tab.addEventListener('pointerleave', () => clearTimeout(lpLostHoldTimer));
  // Prevent normal click from switching
  tab.addEventListener('click', e => e.stopPropagation());
}

// ── Bind content interactions ──
function lpBindContent() {
  // Drop zone for dragged pets
  const dz = document.getElementById('lpDropZone');
  if (dz) {
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('active'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('active'));
    dz.addEventListener('drop', e => {
      e.preventDefault();
      dz.classList.remove('active');
      try {
        const data = JSON.parse(e.dataTransfer.getData('sfPet') || e.dataTransfer.getData('pet') || '{}');
        if (data.name && typeof S !== 'undefined') {
          const exists = S.pets.findIndex(p => p.name === data.name);
          if (exists < 0) {
            S.pets.push({
              name: data.name, species: data.species || 'other',
              breed: data.breed || data.o || '',
              bio: data.bio || '', tags: data.tags || [],
              mood: data.mood || 'playful',
              lat: data.lat || S.lat, lon: data.lon || S.lon,
              timestamp: Date.now()
            });
            if (typeof savePets === 'function') savePets();
            if (typeof toast === 'function') toast(`🐾 ${data.name} added to My Pets!`);
          } else {
            if (typeof toast === 'function') toast(`${data.name} is already in your pack!`);
          }
          lpRender();
        }
      } catch(e) { console.warn('LP drop parse error', e); }
    });
  }

  // Pet tile click → pan to pet
  document.querySelectorAll('.lp-pet-tile[data-pidx]').forEach(tile => {
    tile.addEventListener('click', e => {
      if (e.target.classList.contains('lp-pt-opts')) return;
      const i = parseInt(tile.dataset.pidx);
      if (typeof panToPet === 'function') panToPet(i);
    });
  });

  // Social buttons after render
  if (lpActiveTab === 'lost') {
    const el = document.getElementById('lpSocialBtns');
    if (el && typeof S !== 'undefined') {
      const lostPet = S.pets.find(p => p.lost);
      if (lostPet && typeof renderLostSocialButtons === 'function') {
        renderLostSocialButtons(lostPet, el);
      }
    }
  }
}

// ── Helpers ──
function lpTimeAgo(ts) {
  const d = Date.now() - ts;
  const m = Math.floor(d / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
}
function lpEscape(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Register a pet shortcut ──
function bindAddBtn() {
  const btn = document.getElementById('lpAddBtn');
  if (btn) btn.addEventListener('click', () => {
    if (typeof togglePinPet === 'function') togglePinPet();
    if (typeof toast === 'function') toast('📍 Tap the map to drop a pet pin!');
  });
}

// ── Init ──
function init() {
  injectLeftPanel();

  // Toggle
  document.getElementById('lpToggleBtn').addEventListener('click', lpToggle);

  // Tab bar clicks
  document.getElementById('lpTabBar').addEventListener('click', e => {
    const tab = e.target.closest('.lp-tab');
    if (!tab) return;
    if (tab.dataset.lptab === 'lost') return; // handled by hold
    lpSwitchTab(tab.dataset.lptab);
  });

  bindLostTabHold();
  bindAddBtn();
  lpRender();

  // Re-render when pets change (poll — lightweight)
  setInterval(() => {
    if (document.getElementById('lpRoot') && lpActiveTab === 'pets') {
      lpRenderPetsQuick();
    }
  }, 3000);
}

function lpRenderPetsQuick() {
  // Lightweight re-render just the pet count badge without full redraw
  const el = document.getElementById('lpContent');
  if (!el || lpActiveTab !== 'pets') return;
  // Only re-render if count changed
  const pets = (typeof S !== 'undefined' ? S.pets : []) || [];
  const current = el.querySelectorAll('.lp-pet-tile').length;
  if (current !== pets.length) lpRender();
}

// ── Public API ──
window.lpRefresh = lpRender;
window.lpSwitchTab = lpSwitchTab;

// ── Kick off after DOM ready ──
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
