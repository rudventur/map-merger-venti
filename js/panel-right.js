// ═══════════════════════════════════════════════════════════════
//  panel-right.js — Snout First Right Panel: the LISTS
//  Lists (always show every pet, including ones taken off the dashboard):
//    All pets · My pets · Lost · Out walking · Off dashboard · Friends and
//    family (coming later, empty)
//  Places and help: Home · Vets (real vets from OpenStreetMap, see
//    js/vets.js) · Food (LOCKED)
//  Each pet entry can be put back on / pinned to the top of the dashboard.
//  The list definitions live in js/dashboard.js (sfDash.LISTS).
// ═══════════════════════════════════════════════════════════════

(function () {

const VETS_KEY   = 'sf_vets_custom';
const FOOD_KEY   = 'sf_food_custom';

// ── Inject HTML ──
function injectRightPanel() {
  const lists = window.sfDash ? sfDash.LISTS : [];
  const listChips = lists.map(l =>
    `<div class="rp-tab${l.id === rpActiveTab ? ' active' : ''}${l.later ? ' later' : ''}" data-rptab="${l.id}">${l.icon} ${escHtml(l.label)} <b data-list-count="${l.id}"></b></div>`
  ).join('');
  const html = `
  <style>
    .rp-root {
      position: fixed; top: var(--bar-h, 50px); right: 0; bottom: 0;
      width: 260px;
      background: rgba(26,18,10,0.94);
      border-left: 2px solid #cc8833;
      z-index: 950;
      display: flex; flex-direction: column;
      transition: width .2s;
      backdrop-filter: blur(2px);
      font-family: 'VT323', monospace;
    }
    .rp-root.rp-collapsed { width: 26px; }
    .rp-root.lost-mode {
      border-left-color: #ff2222;
      box-shadow: 0 0 18px rgba(255,30,30,0.2);
    }

    .rp-toggle {
      position: absolute; top: 50%; left: -22px;
      transform: translateY(-50%);
      width: 22px; height: 64px;
      background: #cc8833; border-radius: 8px 0 0 8px;
      cursor: pointer; display: flex; align-items: center;
      justify-content: center; z-index: 955;
      font-size: .9rem; color: #1a120a; user-select: none;
    }
    .rp-hide { margin-left: auto; background: none; border: 1px solid #cc8833; color: #ffcc66; border-radius: 6px; cursor: pointer; font-family: 'VT323', monospace; font-size: .9rem; padding: 0 8px; }
    .rp-hide:hover { background: #cc8833; color: #1a120a; }
    .rp-root.lost-mode .rp-toggle { background: #ff2222; }
    .rp-root.rp-collapsed .rp-inner { opacity: 0; pointer-events: none; }

    .rp-inner { flex: 1; overflow: hidden; display: flex; flex-direction: column; }

    .rp-tabs {
      flex-shrink: 0; padding: 4px 6px 6px;
      border-bottom: 1.5px solid rgba(204,136,51,0.25);
    }
    .rp-group-label {
      color: rgba(255,204,102,0.35); font-size: .6rem; letter-spacing: 2px;
      margin: 3px 0 3px; font-family: 'VT323', monospace;
    }
    .rp-chips { display: flex; flex-wrap: wrap; gap: 4px; }
    .rp-tab {
      padding: 2px 7px; border-radius: 8px;
      border: 1px solid rgba(204,136,51,0.3); background: rgba(0,0,0,0.25);
      color: rgba(255,204,102,0.6); font-size: .74rem;
      cursor: pointer; transition: all .12s; white-space: nowrap;
      font-family: 'VT323', monospace; user-select: none;
    }
    .rp-tab b { font-weight: normal; color: #88cc44; margin-left: 2px; }
    .rp-tab.active { background: #cc8833; border-color: #cc8833; color: #1a120a; }
    .rp-tab.active b { color: #1a120a; }
    .rp-tab:hover:not(.active) { color: #ffcc66; border-color: #cc8833; }
    .rp-tab.later { border-style: dashed; }

    .rp-content { flex: 1; overflow-y: auto; padding: 6px; }

    /* Pet list entries */
    .rp-list-desc {
      color: rgba(255,204,102,0.4); font-size: .68rem; margin: 0 2px 6px;
      font-style: italic; line-height: 1.3;
    }
    .rp-pet {
      background: rgba(0,0,0,0.3);
      border: 1.5px solid rgba(204,136,51,0.22);
      border-radius: 9px; padding: 6px 8px; margin-bottom: 5px;
      cursor: pointer; transition: all .12s;
    }
    .rp-pet:hover { border-color: #cc8833; background: rgba(204,136,51,0.07); }
    .rp-pet.is-off { border-style: dashed; }
    .rp-pet-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; flex: 1; }
    .rp-badge {
      font-family: 'VT323', monospace; font-size: .6rem; padding: 0 5px;
      border-radius: 5px; flex-shrink: 0; border: 1px solid rgba(136,204,68,0.35); color: #88cc44;
    }
    .rp-badge.off { border-color: rgba(255,204,102,0.3); color: rgba(255,204,102,0.6); }
    .rp-badge.pin { border-color: rgba(255,204,102,0.6); color: #ffcc66; }
    .rp-badge.mine { border-color: rgba(204,136,51,0.4); color: #cc8833; margin-left: auto; }
    .rp-pet-tags { display: flex; flex-wrap: wrap; gap: 3px; margin-top: 3px; }
    .rp-pet-btns { display: flex; gap: 4px; margin-top: 5px; align-items: center; }
    .rp-pin-btn.add { border-color: rgba(136,204,68,0.5); color: #88cc44; background: rgba(136,204,68,0.1); }
    .rp-pin-btn.add:hover { background: rgba(136,204,68,0.2); }
    .rp-pet.dragging { opacity: .45; }

    /* Home tab */
    .rp-home-gps {
      background: rgba(136,204,68,0.07);
      border: 1px solid rgba(136,204,68,0.2);
      border-radius: 8px; padding: 7px; margin-bottom: 6px;
    }
    .rp-hg-title { color: #88cc44; font-size: .72rem; margin-bottom: 3px; }
    .rp-hg-coords { color: rgba(255,204,102,0.55); font-size: .7rem; font-family: 'VT323', monospace; }
    .rp-hg-upd { color: rgba(255,204,102,0.28); font-size: .6rem; margin-top: 2px; }
    .rp-set-home {
      width: 100%; padding: 5px;
      background: rgba(204,136,51,0.1);
      border: 1px solid rgba(204,136,51,0.3);
      color: #cc8833; border-radius: 7px; cursor: pointer;
      font-family: 'VT323', monospace; font-size: .72rem;
    }
    .rp-set-home:hover { background: rgba(204,136,51,0.2); }

    /* Link cards (Vets / Food) */
    .rp-link {
      background: rgba(0,0,0,0.3);
      border: 1.5px solid rgba(204,136,51,0.2);
      border-radius: 9px; padding: 6px 8px; margin-bottom: 4px;
      transition: all .12s;
    }
    .rp-link:hover { border-color: rgba(204,136,51,0.5); background: rgba(204,136,51,0.06); }
    .rp-lname {
      font-family: 'Bubblegum Sans', cursive;
      color: #ffcc66; font-size: .78rem;
      display: flex; align-items: center; justify-content: space-between; gap: 4px;
    }
    .rp-lname a {
      color: #ffcc66; text-decoration: none; flex: 1;
    }
    .rp-lname a:hover { color: #fff; text-decoration: underline; }
    .rp-laddr { color: rgba(255,204,102,0.4); font-size: .65rem; margin-top: 2px; }
    .rp-ltags { display: flex; gap: 3px; margin-top: 4px; flex-wrap: wrap; }
    .rp-ltag {
      font-size: .58rem; padding: 1px 5px; border-radius: 4px;
      background: rgba(136,204,68,0.1);
      border: 1px solid rgba(136,204,68,0.25); color: #88cc44;
      font-family: 'VT323', monospace;
    }
    .rp-ltag.em {
      background: rgba(204,51,51,0.1);
      border-color: rgba(204,51,51,0.3); color: #ff6666;
    }
    .rp-ltag.pl {
      background: rgba(204,136,51,0.08);
      border-color: rgba(204,136,51,0.3); color: #cc8833;
    }
    .rp-pin-btn {
      font-size: .6rem; padding: 1px 5px; border-radius: 4px;
      background: rgba(204,136,51,0.1);
      border: 1px solid rgba(204,136,51,0.25); color: #cc8833;
      cursor: pointer; font-family: 'VT323', monospace; flex-shrink: 0;
    }
    .rp-pin-btn:hover { background: rgba(204,136,51,0.2); }

    /* Charity subtle buttons */
    .rp-charity-section {
      margin-top: 10px; padding-top: 8px;
      border-top: 1px solid rgba(204,136,51,0.15);
    }
    .rp-charity-label {
      color: rgba(255,204,102,0.3); font-size: .6rem;
      letter-spacing: 2px; margin-bottom: 5px;
      font-family: 'VT323', monospace;
    }
    .rp-charity-grid { display: flex; flex-wrap: wrap; gap: 4px; }
    .rp-charity-btn {
      font-size: .65rem; padding: 3px 7px; border-radius: 6px;
      background: rgba(0,0,0,0.25);
      border: 1px solid rgba(204,136,51,0.2);
      color: rgba(255,204,102,0.5);
      cursor: pointer; font-family: 'VT323', monospace;
      text-decoration: none; display: inline-block;
      transition: all .12s;
    }
    .rp-charity-btn:hover {
      background: rgba(204,136,51,0.12);
      color: #ffcc66;
      border-color: rgba(204,136,51,0.4);
    }
    .rp-charity-btn.pl {
      border-color: rgba(255,80,80,0.2);
      color: rgba(255,150,150,0.5);
    }
    .rp-charity-btn.pl:hover { color: #ff8888; border-color: rgba(255,80,80,0.4); }

    .rp-add-btn {
      width: 100%; padding: 4px; margin-top: 4px;
      background: rgba(204,136,51,0.06);
      border: 1.5px dashed rgba(204,136,51,0.22);
      color: rgba(204,136,51,0.5); border-radius: 8px;
      cursor: pointer; font-family: 'VT323', monospace; font-size: .7rem;
    }
    .rp-add-btn:hover { background: rgba(204,136,51,0.12); color: #cc8833; }

    /* Real vet locator */
    .rp-vet-search { margin-bottom: 8px; }
    .rp-vet-status {
      color: rgba(255,204,102,0.45); font-size: .68rem;
      text-align: center; padding: 4px 2px; font-family: 'VT323', monospace;
      line-height: 1.4;
    }
    .rp-vet-status.err { color: rgba(255,120,120,0.85); }

    /* Real vets from OpenStreetMap (js/vets.js) */
    .sf-vet-bar { display: flex; gap: 4px; margin-bottom: 4px; }
    .sf-vet-bar .rp-add-btn { flex: 1; margin: 0; }
    .sf-vet-status { font-size: .74rem; }
    .sf-vet-status.loading { color: #ffcc66; }
    .sf-vet-status.empty { color: #ffcc66; }
    .sf-vet-hint, .sf-vet-note { font-size: .64rem; }
    .sf-vet-retry { color: #ffcc66; border-style: solid; }
    .sf-vet-retry:disabled { opacity: .5; cursor: default; }
    .sf-vet { cursor: default; }
    .sf-vet.sel { border-color: #ffcc66; box-shadow: 0 0 0 1px rgba(255,204,102,0.35) inset; }
    .sf-vet-head { display: flex; gap: 5px; align-items: flex-start; }
    .sf-vet-icon { flex-shrink: 0; }
    .sf-vet-name {
      font-family: 'Bubblegum Sans', cursive; color: #ffcc66; font-size: .82rem;
      overflow-wrap: anywhere; min-width: 0;
    }
    .sf-vet-addr { overflow-wrap: anywhere; font-size: .68rem; color: rgba(255,204,102,0.6); }
    .sf-vet-hours, .sf-vet-phone, .sf-vet-web {
      color: rgba(255,204,102,0.75); font-size: .7rem; margin-top: 3px;
      font-family: 'VT323', monospace; overflow-wrap: anywhere; line-height: 1.25;
    }
    .sf-vet-hours div + div { padding-left: 1.4em; }
    .sf-vet .missing { color: rgba(255,204,102,0.38); font-style: italic; }
    .sf-vet a { color: #88cc44; }
    .sf-vet a:hover { color: #bbee77; }
    .sf-vet .rp-ltag.sf-vet-open { color: #88cc44; }
    .sf-vet .rp-ltag.sf-vet-open.em { color: #ff6666; }
    .sf-vet-osm { text-decoration: none; }
    .sf-vet-credit {
      color: rgba(255,204,102,0.4); font-size: .6rem; margin: 6px 2px 2px;
      font-family: 'VT323', monospace; line-height: 1.35;
    }
    .sf-vet-credit a { color: rgba(255,204,102,0.7); }

    /* Doglost embed */
    .rp-doglost-frame {
      width: 100%; height: 220px; border: none;
      border-radius: 8px; margin-top: 6px;
      background: rgba(0,0,0,0.3);
    }
    .rp-doglost-fallback {
      background: rgba(0,0,0,0.3); border-radius: 8px;
      padding: 10px; text-align: center;
      color: rgba(255,204,102,0.4); font-size: .72rem; margin-top: 6px;
    }

    /* Phones: the panel is a bottom sheet (see js/dashboard.js) */
    @media (max-width: 700px) {
      .rp-root {
        top: auto; bottom: 0; left: 0; right: 0; width: 100%;
        height: var(--sheet-h, 62vh); transition: none; z-index: 970;
        border-left: none; border-top: 2px solid #cc8833;
      }
      .rp-root.rp-collapsed {
        width: 50%; left: auto; height: var(--strip-h, 40px);
        border-left: 1px solid rgba(204,136,51,0.4);
      }
      .rp-root.rp-collapsed .rp-inner { display: none; }
      .rp-toggle { display: flex; top: auto; bottom: 8px; left: 8px; width: 36px; height: 28px; border-radius: 8px; }
      .rp-tab { font-size: .85rem; padding: 4px 9px; }
      .rp-pin-btn { font-size: .8rem; padding: 3px 8px; }
      .sf-vet-bar .rp-add-btn, .sf-vet-retry { font-size: .85rem; padding: 8px 4px; }
      .sf-vet .rp-pin-btn { font-size: .9rem; padding: 5px 12px; }
      .sf-vet-name { font-size: .95rem; }
      .sf-vet-hours, .sf-vet-phone, .sf-vet-web { font-size: .85rem; }
      .sf-vet-addr { font-size: .8rem; }
      .sf-vet-phone a { display: inline-block; padding: 3px 0; }
      .sf-vet-credit { font-size: .72rem; }
    }
  </style>

  <div class="rp-root" id="rpRoot">
    <div class="rp-toggle" id="rpToggleBtn" title="Hide or show the right panel" onclick="rpToggle()">▶</div>
    <div class="sf-phead">
      <button class="sf-ph-btn sf-ph-left" type="button" data-sheet="left">📋 DASHBOARD<b data-count="dash"></b></button>
      <button class="sf-ph-btn sf-ph-right" type="button" data-sheet="right">📚 LISTS<b data-count="all"></b></button>
      <button class="rp-hide" type="button" onclick="rpToggle()" title="Hide the right panel">hide</button>
      <button class="sf-ph-close" type="button" data-sheet="close" title="Close">▼</button>
    </div>
    <div class="rp-inner">
      <div class="rp-tabs" id="rpTabBar">
        <div class="rp-group-label">LISTS</div>
        <div class="rp-chips">${listChips}</div>
        <div class="rp-group-label">PLACES AND HELP</div>
        <div class="rp-chips">
          <div class="rp-tab" data-rptab="home">📍 Home</div>
          <div class="rp-tab" data-rptab="vets">🏥 Vets</div>
          <div class="rp-tab" data-rptab="food">🥣 Food</div>
        </div>
      </div>
      <div class="rp-content" id="rpContent"></div>
    </div>
  </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);
}

// ── Data ──
// (The old Pack and Family tabs showed made-up example pets; they are replaced
// by real-data lists. Friends and family is shown as "coming later", empty.)
// (The Vets tab used to start with two made-up clinics, "City Vet Clinic" and
// "Paws & Claws". They are gone: the vets now come live from OpenStreetMap,
// see js/vets.js.)

// Real emergency contacts — shown first, always visible, not dependent on location
const EMERGENCY_UK = [
  { label:'🚨 Vets Now (24 hour emergency vets)', url:'https://www.vets-now.com/find-an-emergency-vet/' },
  { label:'☠️ Animal PoisonLine', url:'https://www.animalpoisonline.co.uk' },
  { label:'🐾 RSPCA (24 hour cruelty line)', url:'https://www.rspca.org.uk/utilities/contactus' },
];

// FOOD TAB — LOCKED AS HOLY GRAIL
const FOOD_DATA = [
  { n:'East London Pet Food Bank', a:'Whitechapel Community Hub', url:'https://www.eastlondonpetfoodbank.org', tags:['dogs','cats','free'], pinned:true },
  { n:'RSPCA Foodshare', a:'rspca.org.uk', url:'https://www.rspca.org.uk', tags:['all pets','national'], pinned:false },
  { n:'Hackney Animal Aid', a:'Hackney, E8', url:'https://maps.google.com/?q=hackney+animal+aid', tags:['emergency','local'], pinned:false },
];

const CHARITIES_UK = [
  { label:'RSPCA', url:'https://www.rspca.org.uk' },
  { label:'PDSA', url:'https://www.pdsa.org.uk' },
  { label:'Blue Cross', url:'https://www.bluecross.org.uk' },
  { label:'Dogs Trust', url:'https://www.dogstrust.org.uk' },
  { label:"Cats Protection", url:'https://www.cats.org.uk' },
  { label:'DogLost', url:'https://www.doglost.co.uk' },
  { label:'Freeads Pets', url:'https://www.freeads.co.uk/pets' },
  { label:'Battersea', url:'https://www.battersea.org.uk' },
  { label:'Woodgreen', url:'https://www.woodgreen.org.uk' },
  { label:'International Cat Care', url:'https://icatcare.org' },
  { label:'Animal Trust (low-cost vets)', url:'https://www.animaltrust.org.uk' },
];

const CHARITIES_PL = [
  { label:'Psia Krew 🇵🇱', url:'https://fundacjapsiakrew.pl' },
  { label:'Animal Helper 🇵🇱', url:'https://www.animalhelper.pl' },
  { label:'RatujemyZwierzaki 🇵🇱', url:'https://www.ratujemyzwierzaki.pl' },
  { label:'Fundacja Viva! 🇵🇱', url:'https://www.viva.org.pl' },
  { label:'OTOZ Animals 🇵🇱', url:'https://www.otoz.pl' },
];

// ── State ──
let rpActiveTab = 'all';
const RP_OLD_TABS = { mypets: 'mine', family: 'friends' };   // names used before the lists
function rpIsList(tab) { return !!(window.sfDash && sfDash.listById(tab)); }
function rpToggle() {
  const root = document.getElementById('rpRoot');
  const open = root.classList.contains('rp-collapsed');
  if (window.sfDash) { sfDash.setPanelOpen('right', open); return; }
  root.classList.toggle('rp-collapsed', !open);
  document.getElementById('rpToggleBtn').textContent = open ? '▶' : '◀';
}

function rpSwitchTab(tab) {
  tab = RP_OLD_TABS[tab] || tab;
  rpActiveTab = tab;
  if (window.sfVets) sfVets.setActive(tab === 'vets');
  document.querySelectorAll('.rp-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.rptab === tab)
  );
  rpRender();
}

function rpRender() {
  const el = document.getElementById('rpContent');
  if (!el) return;
  switch (rpActiveTab) {
    case 'home':    el.innerHTML = rpRenderHome();    break;
    case 'vets':
      el.innerHTML = rpRenderVets();
      if (window.sfVets) sfVets.mount(document.getElementById('rpVetsLive'));
      else document.getElementById('rpVetsLive').textContent = 'The vet search did not load. Reload the page to try again.';
      break;
    case 'food':    el.innerHTML = rpRenderFood();    break;
    default:        el.innerHTML = rpRenderList(rpActiveTab);
  }
  rpUpdateCounts();
}

// ── Lists: every pet, organised; none are ever hidden here ──
function rpPetEntry(p) {
  const D = window.sfDash;
  const em = (typeof SPECIES_EM !== 'undefined' ? SPECIES_EM[p.species] : '') || '🐾';
  const off = D.isOff(p), pinned = D.isPinned(p);
  const badge = off ? '<span class="rp-badge off">off dashboard</span>'
    : pinned ? '<span class="rp-badge pin">📌 pinned</span>'
    : '<span class="rp-badge">on dashboard</span>';
  const action = off ? '<span class="rp-pin-btn add" data-act="show">+ back on dashboard</span>'
    : pinned ? '<span class="rp-pin-btn" data-act="unpin">📌 unpin</span>'
    : '<span class="rp-pin-btn" data-act="pin">📌 pin to top</span>';
  const mood = p.mood ? ' · ' + ((typeof MOOD_EM !== 'undefined' ? MOOD_EM[p.mood] : '') || '') + ' ' + escHtml(p.mood) : '';
  const tags = (Array.isArray(p.tags) ? p.tags : []).slice(0, 5)
    .map(t => `<span class="rp-ltag">${escHtml(t)}</span>`).join('');
  return `<div class="rp-pet${off ? ' is-off' : ''}" data-key="${escHtml(D.key(p))}" draggable="true" title="Show ${escHtml(p.name)} on the map">
    <div class="rp-lname"><span class="rp-pet-name">${em} ${escHtml(p.name)}</span>${badge}</div>
    <div class="rp-laddr">${escHtml(p.breed || p.species || '')} · ${p.lost ? '🔴 LOST' : escHtml(p.status || 'home')}${mood}</div>
    ${tags ? `<div class="rp-pet-tags">${tags}</div>` : ''}
    <div class="rp-pet-btns">
      <span class="rp-pin-btn" data-act="go">🎯 Go</span>
      ${action}
      ${D.isMine(p) ? '<span class="rp-badge mine">yours</span>' : ''}
    </div>
  </div>`;
}

function rpRenderList(id) {
  const D = window.sfDash;
  const l = D && D.listById(id);
  if (!l) return '';
  const desc = l.desc ? `<div class="rp-list-desc">${escHtml(l.desc)}</div>` : '';
  if (l.later) return `<div class="sf-empty" id="rpListEmpty">${escHtml(l.empty)}</div>`;
  const inList = D.listPets(id);
  if (!inList.length) return desc + `<div class="sf-empty" id="rpListEmpty">${escHtml(l.empty)}</div>`;
  const shown = inList.filter(D.matches);
  if (!shown.length) return desc + `<div class="sf-empty" id="rpListEmpty">No pets in "${escHtml(l.label)}" match "${escHtml(D.query())}".</div>`;
  return desc + shown.map(rpPetEntry).join('');
}

// Numbers on the list chips (matching / total while searching).
function rpUpdateCounts() {
  const D = window.sfDash;
  if (!D) return;
  const q = D.query();
  D.LISTS.forEach(l => {
    const el = document.querySelector(`[data-list-count="${l.id}"]`);
    if (!el) return;
    if (l.later) { el.textContent = 'later'; return; }
    const pets = D.listPets(l.id);
    el.textContent = q ? pets.filter(D.matches).length + '/' + pets.length : String(pets.length);
  });
}

function rpOnContentClick(e) {
  const card = e.target.closest('.rp-pet[data-key]');
  if (!card || !window.sfDash || typeof S === 'undefined') return;
  const pet = sfDash.byKey(card.getAttribute('data-key'));
  if (!pet) return;
  const actEl = e.target.closest('[data-act]');
  const act = actEl ? actEl.dataset.act : 'go';
  if (act === 'show') {
    sfDash.putBack(pet);
    if (typeof toast === 'function') toast(`🐾 ${pet.name} is back on your dashboard`);
  } else if (act === 'pin') {
    sfDash.pin(pet);
    if (typeof toast === 'function') toast(`📌 ${pet.name} pinned to the top of your dashboard`);
  } else if (act === 'unpin') {
    sfDash.unpin(pet);
  } else {
    if (typeof panToPet === 'function') panToPet(S.pets.indexOf(pet));
    if (sfDash.isPhone()) sfDash.setPanelOpen('right', false);
  }
}

// ── Home ──
function rpRenderHome() {
  const lat = (typeof S !== 'undefined' && S.lat) ? S.lat.toFixed(4) : '51.5120';
  const lon = (typeof S !== 'undefined' && S.lon) ? S.lon.toFixed(4) : '-0.0900';
  const saved = JSON.parse(localStorage.getItem('sf_home') || 'null');
  const hLat = saved ? saved.lat.toFixed(4) : lat;
  const hLon = saved ? saved.lon.toFixed(4) : lon;
  const ago = saved ? rpTimeAgo(saved.ts) : 'not set';
  return `
    <div class="rp-home-gps">
      <div class="rp-hg-title">📍 Home GPS anchor</div>
      <div class="rp-hg-coords">${hLat}° N · ${hLon}° W</div>
      <div class="rp-hg-upd">set ${ago} · <span id="rpAutoGPS" style="cursor:pointer;color:${rpIsAutoGpsOn() ? '#88cc44' : 'rgba(136,204,68,0.5)'}" onclick="rpToggleAutoGPS()">auto ${rpIsAutoGpsOn() ? 'on' : 'off'}</span></div>
    </div>
    <button class="rp-set-home" onclick="rpSetHome()">📍 Set current location as home</button>
    <div style="color:rgba(255,204,102,0.25);font-size:.62rem;margin-top:6px;font-family:'VT323',monospace;line-height:1.4">
      Home anchor is used as the base for all pets.<br>Override per-pet in the left GPS tab.
    </div>`;
}

window.rpSetHome = function() {
  if (typeof S === 'undefined') return;
  const home = { lat: S.lat, lon: S.lon, ts: Date.now() };
  localStorage.setItem('sf_home', JSON.stringify(home));
  if (typeof toast === 'function') toast('🏠 Home location saved!');
  rpRender();
};

let rpAutoGpsWatchId = null;
function rpIsAutoGpsOn() {
  return localStorage.getItem('sf_home_auto') === '1';
}

window.rpToggleAutoGPS = function() {
  if (rpIsAutoGpsOn()) rpStopAutoGPS();
  else rpStartAutoGPS();
};

function rpStartAutoGPS() {
  if (!navigator.geolocation) {
    if (typeof toast === 'function') toast('GPS not supported by this browser 🐾');
    return;
  }
  rpAutoGpsWatchId = navigator.geolocation.watchPosition(
    pos => {
      localStorage.setItem('sf_home', JSON.stringify({
        lat: pos.coords.latitude, lon: pos.coords.longitude, ts: Date.now()
      }));
      if (rpActiveTab === 'home') rpRender();
    },
    err => { if (typeof toast === 'function') toast('Auto-GPS error: ' + err.message); },
    { enableHighAccuracy: false, maximumAge: 30000 }
  );
  localStorage.setItem('sf_home_auto', '1');
  if (typeof toast === 'function') toast('📍 Auto-GPS on — home anchor will follow you');
  rpRender();
}

function rpStopAutoGPS() {
  if (rpAutoGpsWatchId != null && navigator.geolocation) navigator.geolocation.clearWatch(rpAutoGpsWatchId);
  rpAutoGpsWatchId = null;
  localStorage.setItem('sf_home_auto', '0');
  if (typeof toast === 'function') toast('📍 Auto-GPS off');
  rpRender();
}

// Resume tracking if it was left on from a previous session
if (rpIsAutoGpsOn()) rpStartAutoGPS();

// ── Vets ──
// Real vets near the map come from OpenStreetMap (js/vets.js fills #rpVetsLive
// using text only). Vets the user typed in themselves stay on this device.
function rpRenderVets() {
  let custom = [];
  try { custom = JSON.parse(localStorage.getItem(VETS_KEY) || '[]'); } catch (e) { custom = []; }
  if (!Array.isArray(custom)) custom = [];

  const emergencySection = `
    <div class="rp-charity-section" style="margin-top:0;border:1px solid rgba(255,60,60,0.35);border-radius:8px;padding:6px 6px 4px;background:rgba(255,30,30,0.06)">
      <div class="rp-charity-label" style="color:#ff8888">🚨 EMERGENCY — CALL FIRST</div>
      <div class="rp-charity-grid">
        ${EMERGENCY_UK.map(c => `<a class="rp-charity-btn" style="border-color:rgba(255,80,80,0.4);color:#ff9999" href="${safeUrl(c.url)}" target="_blank" rel="noopener">${escHtml(c.label)}</a>`).join('')}
      </div>
    </div>`;

  const liveSection = `
    <div class="rp-vet-search">
      <div class="rp-charity-label">🏥 VETS NEAR THE MAP (live from OpenStreetMap)</div>
      <div id="rpVetsLive"></div>
    </div>`;

  // Only what the user typed in on this device; no map pin (there is no real position).
  const cards = custom.filter(v => v && v.n).map(v => {
    const href = safeUrl(v.url);
    const name = `🏥 ${escHtml(v.n)}`;
    return `<div class="rp-link">
      <div class="rp-lname">${href !== '#' ? `<a href="${href}" target="_blank" rel="noopener">${name}</a>` : `<span>${name}</span>`}</div>
      ${v.a ? `<div class="rp-laddr">${escHtml(v.a)}</div>` : ''}
    </div>`;
  }).join('');

  const ukCharities = CHARITIES_UK.map(c =>
    `<a class="rp-charity-btn" href="${safeUrl(c.url)}" target="_blank" rel="noopener">${escHtml(c.label)}</a>`
  ).join('');
  const plCharities = CHARITIES_PL.map(c =>
    `<a class="rp-charity-btn pl" href="${safeUrl(c.url)}" target="_blank" rel="noopener">${escHtml(c.label)}</a>`
  ).join('');

  // DogLost embed attempt (js/doglost-embed.js replaces the placeholder)
  const doglostSection = `
    <div style="margin-top:8px;border-top:1px solid rgba(204,136,51,0.15);padding-top:6px">
      <div class="rp-charity-label">🐾 DOGLOST MAP</div>
      <a class="rp-charity-btn" href="https://www.doglost.co.uk/map" target="_blank" rel="noopener" style="display:block;text-align:center;margin-bottom:5px">
        Open DogLost Map ↗
      </a>
      <div class="rp-doglost-fallback" id="rpDoglostEmbed">
        Checking whether the DogLost map can be shown here…<br>
        <span style="font-size:.6rem;opacity:.5">(if not, the link above opens it in a new tab)</span>
      </div>
    </div>`;

  return emergencySection + liveSection +
    `<div class="rp-charity-section" style="margin-top:2px">
      <div class="rp-charity-label">⭐ SAVED BY YOU (THIS DEVICE ONLY)</div>
      ${cards}
      <button class="rp-add-btn" onclick="rpAddVet()">+ add vet / clinic</button>
    </div>` +
    `<div class="rp-charity-section">
      <div class="rp-charity-label">🇬🇧 BRITISH ORGANISATIONS</div>
      <div class="rp-charity-grid">${ukCharities}</div>
    </div>
    <div class="rp-charity-section">
      <div class="rp-charity-label">🇵🇱 POLISH ORGANISATIONS</div>
      <div class="rp-charity-grid">${plCharities}</div>
    </div>
    ${doglostSection}`;
}

window.rpAddVet = function() {
  const n = prompt('Vet / clinic name:');
  if (!n) return;
  const a = prompt('Address or website:') || '';
  const u = prompt('Website (https://...), or leave empty:') || '';
  let custom = [];
  try { custom = JSON.parse(localStorage.getItem(VETS_KEY) || '[]'); } catch (e) { custom = []; }
  if (!Array.isArray(custom)) custom = [];
  custom.push({ n, a, url: u, tags: ['custom'], pinned: false });
  localStorage.setItem(VETS_KEY, JSON.stringify(custom));
  rpRender();
  if (typeof toast === 'function') toast('🏥 Vet added!');
};

// ── Food (LOCKED AS HOLY GRAIL) ──
function rpRenderFood() {
  const cards = FOOD_DATA.map((f, i) =>
    `<div class="rp-link">
      <div class="rp-lname">
        <a href="${safeUrl(f.url)}" target="_blank" rel="noopener">🥣 ${escHtml(f.n)}</a>
        <span class="rp-pin-btn" onclick="rpPinOnMap('food',${i},${escJsArg(f.n)})">
          ${f.pinned ? '📍' : '+ map'}
        </span>
      </div>
      <div class="rp-laddr">${escHtml(f.a)}</div>
      <div class="rp-ltags">
        ${f.tags.map(t => `<span class="rp-ltag">${escHtml(t)}</span>`).join('')}
      </div>
    </div>`
  ).join('');

  const ukCharities = CHARITIES_UK.map(c =>
    `<a class="rp-charity-btn" href="${c.url}" target="_blank" rel="noopener">${c.label}</a>`
  ).join('');

  return cards +
    `<button class="rp-add-btn" onclick="rpAddFood()">+ add food bank</button>` +
    `<div class="rp-charity-section">
      <div class="rp-charity-label">🇬🇧 UK RESOURCES</div>
      <div class="rp-charity-grid">${ukCharities}</div>
    </div>`;
}

window.rpAddFood = function() {
  const n = prompt('Food bank name:');
  if (!n) return;
  const a = prompt('Address:') || '';
  const u = prompt('URL (https://...):') || '#';
  const custom = JSON.parse(localStorage.getItem(FOOD_KEY) || '[]');
  custom.push({ n, a, url: u, tags: ['custom'], pinned: false });
  localStorage.setItem(FOOD_KEY, JSON.stringify(custom));
  rpRender();
  if (typeof toast === 'function') toast('🥣 Food bank added!');
};

// ── Pin on map ──
window.rpPinOnMap = function(type, idx, name) {
  // Tells panel-drag / lost-zone to place a map marker
  if (typeof addServicePin === 'function') {
    addServicePin(type, name);
  } else {
    if (typeof toast === 'function') toast(`📍 ${name} pinned to map (placeholder)`);
  }
};

// ── Drag a list entry onto the dashboard to put it back ──
function rpBindListDrag() {
  const el = document.getElementById('rpContent');
  el.addEventListener('dragstart', e => {
    const card = e.target.closest && e.target.closest('.rp-pet[data-key]');
    if (!card) return;
    e.dataTransfer.setData('text/sf-pet-key', card.getAttribute('data-key'));
    e.dataTransfer.effectAllowed = 'move';
    card.classList.add('dragging');
    document.body.classList.add('sf-dragging');
  });
  el.addEventListener('dragend', e => {
    const card = e.target.closest && e.target.closest('.rp-pet');
    if (card) card.classList.remove('dragging');
    document.body.classList.remove('sf-dragging');
  });
}

// ── Helpers ──
function rpTimeAgo(ts) {
  if (!ts) return 'never';
  const d = Date.now() - ts;
  const m = Math.floor(d / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
}

// ── Lost mode sync ──
window.rpSetLostMode = function(on) {
  document.getElementById('rpRoot').classList.toggle('lost-mode', on);
};

// ── Public ──
window.rpRefresh = rpRender;
window.rpSwitchTab = rpSwitchTab;

// ── Init ──
function init() {
  injectRightPanel();
  document.getElementById('rpToggleBtn').addEventListener('click', rpToggle);
  document.getElementById('rpTabBar').addEventListener('click', e => {
    const tab = e.target.closest('.rp-tab');
    if (!tab) return;
    rpSwitchTab(tab.dataset.rptab);
  });
  document.getElementById('rpContent').addEventListener('click', rpOnContentClick);
  rpBindListDrag();
  rpRender();
  // Lists follow the pets, the search and the dashboard. Home, Vets and Food
  // are left alone (they have their own forms and searches).
  if (window.sfDash) sfDash.onChange(() => {
    rpUpdateCounts();
    if (rpIsList(rpActiveTab)) rpRender();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
