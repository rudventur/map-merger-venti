/* World Keyboards — on-screen keyboards for many languages, part of the RUDVENTUR translator.
   Moved here from windows13/keyboard-realistic.html. The panel types into whichever text box
   was focused last: the translator's text box, or the chat box inside the Chat tab.
   The layout follows the useR's language (?lang= or rvUserLang), unless one is picked by hand.
   API: WorldKeyboards.open(), .close(), .toggle(), .watch(document), .setLang(code) */
(function () {
'use strict';
const LAYOUTS = {
  us: {
    name: "US English QWERTY",
    accent: { note: "US has no accent keys. The mark is not on the board; these chips insert it.", chips: [["é","e + acute"],["ñ","n + tilde"],["ü","u + umlaut"],["ç","c + cedilla"]] },
    group: "Europe / Americas",
    rows: [
      [["`", "~"], ["1","!"], ["2","@"], ["3","#"], ["4","$"], ["5","%"], ["6","^"], ["7","&"], ["8","*"], ["9","("], ["0",")"], ["-","_"], ["=","+"], {id:"Backspace", label:"⌫", cls:"backspace special w20", action:"backspace"}],
      [{id:"Tab", label:"Tab", cls:"tab modifier w15", action:"tab"}, ["q","Q"], ["w","W"], ["e","E"], ["r","R"], ["t","T"], ["y","Y"], ["u","U"], ["i","I"], ["o","O"], ["p","P"], ["[","{"], ["]","}"], ["\\","|"]],
      [{id:"CapsLock", label:"Caps", cls:"caps modifier w17", action:"caps"}, ["a","A"], ["s","S"], ["d","D"], ["f","F"], ["g","G"], ["h","H"], ["j","J"], ["k","K"], ["l","L"], [";",":"], ["'","\""], {id:"Enter", label:"Enter", cls:"enter special w20", action:"enter"}],
      [{id:"Shift", label:"Shift", cls:"shift modifier w23", action:"shift"}, ["z","Z"], ["x","X"], ["c","C"], ["v","V"], ["b","B"], ["n","N"], ["m","M"], [",","<"], [".",">"], ["/","?"], {id:"ShiftR", label:"Shift", cls:"shift modifier w23", action:"shift"}],
      [{id:"Ctrl", label:"Ctrl", cls:"ctrl modifier", action:"noop"}, {id:"Alt", label:"Alt", cls:"alt modifier", action:"noop"}, {id:"Space", label:"space", cls:"space", action:"space"}, {id:"AltR", label:"Alt", cls:"alt modifier", action:"noop"}, {id:"CtrlR", label:"Ctrl", cls:"ctrl modifier", action:"noop"}]
    ]
  },
  uk: {
    name: "UK English",
    accent: { note: "UK prints £ on 3 and ¬ on the top-left key. Accents are still not dedicated keys.", chips: [["é","e acute"],["£","Shift 3"],["¬","Shift `"] ] },
    group: "Europe / Americas",
    rows: [
      [["`", "¬"], ["1","!"], ["2","\""], ["3","£"], ["4","$"], ["5","%"], ["6","^"], ["7","&"], ["8","*"], ["9","("], ["0",")"], ["-","_"], ["=","+"], {id:"Backspace", label:"⌫", cls:"special w20", action:"backspace"}],
      [{id:"Tab", label:"Tab", cls:"modifier w15", action:"tab"}, ["q","Q"], ["w","W"], ["e","E"], ["r","R"], ["t","T"], ["y","Y"], ["u","U"], ["i","I"], ["o","O"], ["p","P"], ["[","{"], ["]","}"]],
      [{id:"CapsLock", label:"Caps", cls:"modifier w17", action:"caps"}, ["a","A"], ["s","S"], ["d","D"], ["f","F"], ["g","G"], ["h","H"], ["j","J"], ["k","K"], ["l","L"], [";",":"], ["'","@"], ["#","~"], {id:"Enter", label:"Enter", cls:"special w17", action:"enter"}],
      [{id:"Shift", label:"Shift", cls:"modifier w20", action:"shift"}, ["\\","|"], ["z","Z"], ["x","X"], ["c","C"], ["v","V"], ["b","B"], ["n","N"], ["m","M"], [",","<"], [".",">"], ["/","?"], {id:"ShiftR", label:"Shift", cls:"modifier w20", action:"shift"}],
      [{id:"Ctrl", label:"Ctrl", cls:"modifier", action:"noop"}, {id:"Alt", label:"Alt", cls:"modifier", action:"noop"}, {id:"Space", label:"space", cls:"space", action:"space"}, {id:"AltR", label:"AltGr", cls:"modifier", action:"noop"}, {id:"CtrlR", label:"Ctrl", cls:"modifier", action:"noop"}]
    ]
  },
  polish: {
    name: "Polish programmers",
    accent: { note: "Programmers layout: AltGr adds the ogonek, stroke, or acute. Right Alt is the accent key.", chips: [["ą","AltGr a"],["ć","AltGr c"],["ę","AltGr e"],["ł","AltGr l"],["ń","AltGr n"],["ó","AltGr o"],["ś","AltGr s"],["ź","AltGr x"],["ż","AltGr z"]] },
    group: "Europe / Americas",
    rows: [
      [["`", "~"], ["1","!"], ["2","@"], ["3","#"], ["4","$"], ["5","%"], ["6","^"], ["7","&"], ["8","*"], ["9","("], ["0",")"], ["-","_"], ["=","+"], {id:"Backspace", label:"⌫", cls:"special w20", action:"backspace"}],
      [{id:"Tab", label:"Tab", cls:"modifier w15", action:"tab"}, ["q","Q"], ["w","W"], ["e","E"], ["r","R"], ["t","T"], ["y","Y"], ["u","U"], ["i","I"], ["o","O"], ["p","P"], ["[","{"], ["]","}"], ["\\","|"]],
      [{id:"CapsLock", label:"Caps", cls:"modifier w17", action:"caps"}, ["a","A"], ["s","S"], ["d","D"], ["f","F"], ["g","G"], ["h","H"], ["j","J"], ["k","K"], ["l","L"], [";",":"], ["'","\""], {id:"Enter", label:"Enter", cls:"special w20", action:"enter"}],
      [{id:"Shift", label:"Shift", cls:"modifier w23", action:"shift"}, ["z","Z"], ["x","X"], ["c","C"], ["v","V"], ["b","B"], ["n","N"], ["m","M"], [",","<"], [".",">"], ["/","?"], {id:"ShiftR", label:"Shift", cls:"modifier w23", action:"shift"}],
      [{id:"Ctrl", label:"Ctrl", cls:"modifier", action:"noop"}, {id:"Alt", label:"Alt", cls:"modifier", action:"noop"}, {id:"Space", label:"space", cls:"space", action:"space"}, {label:"ą ć ę", cls:"special", action:"char", ch:"ą"}, {label:"ł ń ó", cls:"special", action:"char", ch:"ł"}, {label:"ś ź ż", cls:"special", action:"char", ch:"ś"}]
    ],
    alt: { a:"ą", c:"ć", e:"ę", l:"ł", n:"ń", o:"ó", s:"ś", x:"ź", z:"ż", A:"Ą", C:"Ć", E:"Ę", L:"Ł", N:"Ń", O:"Ó", S:"Ś", X:"Ź", Z:"Ż" }
  },
  german: {
    name: "German QWERTZ",
    accent: { note: "Umlauts are their own keys, not dead keys. ß is unshifted, next to 0.", chips: [["ä","own key"],["ö","own key"],["ü","own key"],["ß","own key"]] },
    group: "Europe / Americas",
    rows: [
      [["^","°"], ["1","!"], ["2","\""], ["3","§"], ["4","$"], ["5","%"], ["6","&"], ["7","/"], ["8","("], ["9",")"], ["0","="], ["ß","?"], ["´","`"], {id:"Backspace", label:"⌫", cls:"special w20", action:"backspace"}],
      [{id:"Tab", label:"Tab", cls:"modifier w15", action:"tab"}, ["q","Q"], ["w","W"], ["e","E"], ["r","R"], ["t","T"], ["z","Z"], ["u","U"], ["i","I"], ["o","O"], ["p","P"], ["ü","Ü"], ["+","*"]],
      [{id:"CapsLock", label:"Caps", cls:"modifier w17", action:"caps"}, ["a","A"], ["s","S"], ["d","D"], ["f","F"], ["g","G"], ["h","H"], ["j","J"], ["k","K"], ["l","L"], ["ö","Ö"], ["ä","Ä"], ["#","'"], {id:"Enter", label:"Enter", cls:"special w17", action:"enter"}],
      [{id:"Shift", label:"Shift", cls:"modifier w20", action:"shift"}, ["<","›"], ["y","Y"], ["x","X"], ["c","C"], ["v","V"], ["b","B"], ["n","N"], ["m","M"], [",",";"], [".",":"], ["-","_"], {id:"ShiftR", label:"Shift", cls:"modifier w20", action:"shift"}],
      [{id:"Ctrl", label:"Strg", cls:"modifier", action:"noop"}, {id:"Alt", label:"Alt", cls:"modifier", action:"noop"}, {id:"Space", label:"Leer", cls:"space", action:"space"}, {id:"AltR", label:"AltGr", cls:"modifier", action:"noop"}, {id:"CtrlR", label:"Strg", cls:"modifier", action:"noop"}]
    ]
  },
  french: {
    name: "French AZERTY",
    accent: { note: "é è ç à ù are printed keys. ^ and ¨ are dead keys: press the mark, then the letter.", chips: [["é","own key"],["è","own key"],["ê","^ then e"],["ë","¨ then e"],["ç","own key"],["à","own key"],["ù","own key"]] },
    group: "Europe / Americas",
    rows: [
      [["²"], ["&","1"], ["é","2"], ["\"","3"], ["'","4"], ["(","5"], ["-","6"], ["è","7"], ["_","8"], ["ç","9"], ["à","0"], [")","°"], ["=","+"], {id:"Backspace", label:"⌫", cls:"special w17", action:"backspace"}],
      [{id:"Tab", label:"Tab", cls:"modifier w15", action:"tab"}, ["a","A"], ["z","Z"], ["e","E"], ["r","R"], ["t","T"], ["y","Y"], ["u","U"], ["i","I"], ["o","O"], ["p","P"], ["^","¨"], ["$","£"]],
      [{id:"CapsLock", label:"Caps", cls:"modifier w17", action:"caps"}, ["q","Q"], ["s","S"], ["d","D"], ["f","F"], ["g","G"], ["h","H"], ["j","J"], ["k","K"], ["l","L"], ["m","M"], ["ù","%"], ["*","µ"], {id:"Enter", label:"Entrée", cls:"special w15", action:"enter"}],
      [{id:"Shift", label:"Shift", cls:"modifier w20", action:"shift"}, ["<","›"], ["w","W"], ["x","X"], ["c","C"], ["v","V"], ["b","B"], ["n","N"], [",","?"], [";","."], [":","/"], ["!","§"], {id:"ShiftR", label:"Shift", cls:"modifier w17", action:"shift"}],
      [{id:"Ctrl", label:"Ctrl", cls:"modifier", action:"noop"}, {id:"Alt", label:"Alt", cls:"modifier", action:"noop"}, {id:"Space", label:"espace", cls:"space", action:"space"}, {id:"AltR", label:"AltGr", cls:"modifier", action:"noop"}, {id:"CtrlR", label:"Ctrl", cls:"modifier", action:"noop"}]
    ]
  },
  spanish: {
    name: "Spanish QWERTY",
    accent: { note: "ñ is its own key. ´ and ¨ are dead keys. ¿ and ¡ sit on the number row.", chips: [["ñ","own key"],["á","´ then a"],["é","´ then e"],["í","´ then i"],["ó","´ then o"],["ú","´ then u"],["ü","¨ then u"]] },
    group: "Europe / Americas",
    rows: [
      [["º","ª"], ["1","!"], ["2","\""], ["3","·"], ["4","$"], ["5","%"], ["6","&"], ["7","/"], ["8","("], ["9",")"], ["0","="], ["'","?"], ["¡","¿"], {id:"Backspace", label:"⌫", cls:"special w17", action:"backspace"}],
      [{id:"Tab", label:"Tab", cls:"modifier w15", action:"tab"}, ["q","Q"], ["w","W"], ["e","E"], ["r","R"], ["t","T"], ["y","Y"], ["u","U"], ["i","I"], ["o","O"], ["p","P"], ["`","^"], ["+","*"]],
      [{id:"CapsLock", label:"Caps", cls:"modifier w17", action:"caps"}, ["a","A"], ["s","S"], ["d","D"], ["f","F"], ["g","G"], ["h","H"], ["j","J"], ["k","K"], ["l","L"], ["ñ","Ñ"], ["´","¨"], ["ç","Ç"], {id:"Enter", label:"Intro", cls:"special w15", action:"enter"}],
      [{id:"Shift", label:"Shift", cls:"modifier w20", action:"shift"}, ["<","›"], ["z","Z"], ["x","X"], ["c","C"], ["v","V"], ["b","B"], ["n","N"], ["m","M"], [",",";"], [".",":"], ["-","_"], {id:"ShiftR", label:"Shift", cls:"modifier w17", action:"shift"}],
      [{id:"Ctrl", label:"Ctrl", cls:"modifier", action:"noop"}, {id:"Alt", label:"Alt", cls:"modifier", action:"noop"}, {id:"Space", label:"espacio", cls:"space", action:"space"}, {id:"AltR", label:"AltGr", cls:"modifier", action:"noop"}, {id:"CtrlR", label:"Ctrl", cls:"modifier", action:"noop"}]
    ]
  },
  arabic: {
    name: "Arabic",
    accent: { note: "Harakat are vowel marks, not separate letters. They sit on a consonant. The board types the letters; these chips add the mark.", chips: [["َ","fatha"],["ِ","kasra"],["ُ","damma"],["ْ","sukun"],["ّ","shadda"]] },
    group: "Asia / Middle East",
    rtl: true,
    rows: [
      [["ذ"], ["1","!"], ["2","@"], ["3","#"], ["4","$"], ["5","%"], ["6","^"], ["7","&"], ["8","*"], ["9",")"], ["0","("], ["-","_"], ["=","+"], {id:"Backspace", label:"⌫", cls:"special w17", action:"backspace"}],
      [{id:"Tab", label:"Tab", cls:"modifier w15", action:"tab"}, ["ض"], ["ص"], ["ث"], ["ق"], ["ف"], ["غ"], ["ع"], ["ه"], ["خ"], ["ح"], ["ج"], ["د"]],
      [{id:"CapsLock", label:"Caps", cls:"modifier w15", action:"caps"}, ["ش"], ["س"], ["ي"], ["ب"], ["ل"], ["ا"], ["ت"], ["ن"], ["م"], ["ك"], ["ط"], {id:"Enter", label:"Enter", cls:"special w17", action:"enter"}],
      [{id:"Shift", label:"Shift", cls:"modifier w20", action:"shift"}, ["ئ"], ["ء"], ["ؤ"], ["ر"], ["لا"], ["ى"], ["ة"], ["و"], ["ز"], ["ظ"], {id:"ShiftR", label:"Shift", cls:"modifier w20", action:"shift"}],
      [{id:"Ctrl", label:"Ctrl", cls:"modifier", action:"noop"}, {id:"Alt", label:"Alt", cls:"modifier", action:"noop"}, {id:"Space", label:"مسافة", cls:"space", action:"space"}, {id:"AltR", label:"Alt", cls:"modifier", action:"noop"}, {id:"CtrlR", label:"Ctrl", cls:"modifier", action:"noop"}]
    ]
  },
  japanese: {
    name: "Japanese JIS",
    accent: { note: "Dakuten ゛ and handakuten ゜ are the accent keys, on @ and [. They voice the kana: か + ゛ = が, は + ゜ = ぱ.", chips: [["が","か + ゛"],["ぎ","き + ゛"],["ぱ","は + ゜"],["ぴ","ひ + ゜"]] },
    group: "Asia / Middle East",
    alphabet: "hiragana",
    note: "JIS order. Keys are printed in hiragana, as on a real board. カタカナ is the same keys, other alphabet.",
    rows: [
      [{id:"CapsLock", label:"半/全", cls:"modifier", action:"caps"}, ["1","ぬ"], ["2","ふ"], ["3","あ"], ["4","う"], ["5","え"], ["6","お"], ["7","や"], ["8","ゆ"], ["9","よ"], ["0","わ"], ["-","ほ"], ["^","へ"], ["¥","ー"], {id:"Backspace", label:"⌫", cls:"special w17", action:"backspace"}],
      [{id:"Tab", label:"Tab", cls:"modifier w15", action:"tab"}, ["q","た"], ["w","て"], ["e","い"], ["r","す"], ["t","か"], ["y","ん"], ["u","な"], ["i","に"], ["o","ら"], ["p","せ"], ["@","゛"], ["[","゜"]],
      [{id:"Eisu", label:"英数", cls:"modifier w15", action:"eisu"}, ["a","ち"], ["s","と"], ["d","し"], ["f","は"], ["g","き"], ["h","く"], ["j","ま"], ["k","の"], ["l","り"], [";","れ"], [":","け"], ["]","む"], {id:"Enter", label:"Enter", cls:"special w15", action:"enter"}],
      [{id:"Shift", label:"Shift", cls:"modifier w20", action:"shift"}, ["z","つ"], ["x","さ"], ["c","そ"], ["v","ひ"], ["b","こ"], ["n","み"], ["m","も"], [",","ね"], [".","る"], ["/","め"], ["\\","ろ"], {id:"ShiftR", label:"Shift", cls:"modifier w17", action:"shift"}],
      [{id:"Ctrl", label:"Ctrl", cls:"modifier", action:"noop"}, {id:"Win", label:"Win", cls:"modifier", action:"noop"}, {id:"Alt", label:"Alt", cls:"modifier", action:"noop"}, {id:"Muhenkan", label:"無変換", cls:"modifier", action:"noop"}, {id:"Space", label:"space", cls:"space", action:"space"}, {id:"Henkan", label:"変換", cls:"modifier", action:"noop"}, {id:"Kana", label:"かな", cls:"modifier", action:"kana"}, {id:"Kata", label:"カタカナ", cls:"modifier", action:"kata"}, {id:"AltR", label:"Alt", cls:"modifier", action:"noop"}, {id:"CtrlR", label:"Ctrl", cls:"modifier", action:"noop"}]
    ]
  },
  korean: {
    name: "Korean 2-set",
    accent: { note: "Tense consonants are the shift layer, not a separate accent key. ㄱ + Shift = ㄲ.", chips: [["ㄲ","Shift ㄱ"],["ㄸ","Shift ㄷ"],["ㅃ","Shift ㅂ"],["ㅆ","Shift ㅅ"],["ㅉ","Shift ㅈ"]] },
    group: "Asia / Middle East",
    note: "Dubeolsik jamo. Syllable composition is not applied.",
    rows: [
      [["`", "~"], ["1","!"], ["2","@"], ["3","#"], ["4","$"], ["5","%"], ["6","^"], ["7","&"], ["8","*"], ["9","("], ["0",")"], ["-","_"], ["=","+"], {id:"Backspace", label:"⌫", cls:"special w17", action:"backspace"}],
      [{id:"Tab", label:"Tab", cls:"modifier w15", action:"tab"}, ["ㅂ","ㅃ"], ["ㅈ","ㅉ"], ["ㄷ","ㄸ"], ["ㄱ","ㄲ"], ["ㅅ","ㅆ"], ["ㅛ"], ["ㅕ"], ["ㅑ"], ["ㅐ","ㅒ"], ["ㅔ","ㅖ"], ["[", "{"], ["]", "}"]],
      [{id:"CapsLock", label:"한/영", cls:"modifier w17", action:"caps"}, ["ㅁ"], ["ㄴ"], ["ㅇ"], ["ㄹ"], ["ㅎ"], ["ㅗ"], ["ㅓ"], ["ㅏ"], ["ㅣ"], [";", ":"], ["'", "\""], {id:"Enter", label:"Enter", cls:"special w17", action:"enter"}],
      [{id:"Shift", label:"Shift", cls:"modifier w23", action:"shift"}, ["ㅋ"], ["ㅌ"], ["ㅊ"], ["ㅍ"], ["ㅠ"], ["ㅜ"], ["ㅡ"], [",", "<"], [".", ">"], ["/", "?"], {id:"ShiftR", label:"Shift", cls:"modifier w20", action:"shift"}],
      [{id:"Ctrl", label:"Ctrl", cls:"modifier", action:"noop"}, {id:"Alt", label:"Alt", cls:"modifier", action:"noop"}, {id:"Space", label:"space", cls:"space", action:"space"}, {id:"AltR", label:"한자", cls:"modifier", action:"noop"}, {id:"CtrlR", label:"Ctrl", cls:"modifier", action:"noop"}]
    ]
  },
  emoji: {
    name: "Emoji",
    group: "Fun",
    rows: [
      [["😀"], ["😃"], ["😄"], ["😁"], ["😆"], ["😅"], ["🤣"], ["😂"], ["🙂"], ["😉"], ["😊"], {id:"Backspace", label:"⌫", cls:"special", action:"backspace"}],
      [["🥰"], ["😍"], ["🤩"], ["😘"], ["😎"], ["🤔"], ["😴"], ["🤯"], ["🎃"], ["⚡"]],
      [["☢️"], ["🌐"], ["💬"], ["⌨️"], ["🗺️"], ["🎮"], ["💰"], ["🍿"], ["❤️"], ["💚"]],
      [["👍"], ["👎"], ["✌️"], ["🤘"], ["🙏"], ["💪"], ["🔥"], ["✨"]],
      [{id:"Ctrl", label:"Ctrl", cls:"modifier", action:"noop"}, {id:"Alt", label:"Alt", cls:"modifier", action:"noop"}, {id:"Space", label:"space", cls:"space", action:"space"}, {id:"AltR", label:"Alt", cls:"modifier", action:"noop"}, {id:"CtrlR", label:"Ctrl", cls:"modifier", action:"noop"}]
    ]
  }
};

const LANG_MAP = [
  ["ja", "japanese"], ["ko", "korean"], ["ar", "arabic"], ["pl", "polish"], ["de", "german"],
  ["fr", "french"], ["es", "spanish"], ["en-gb", "uk"], ["en-au", "uk"], ["en", "uk"]
];
function layoutForLang(code) {
  const tag = String(code || "en").toLowerCase();
  const hit = LANG_MAP.find(([p]) => tag === p || tag.startsWith(p + "-"));
  return hit ? hit[1] : "uk";
}
function userLang() {
  try { return new URLSearchParams(location.search).get("lang") || localStorage.getItem("rvUserLang") || navigator.language || "en"; }
  catch (e) { return "en"; }
}

const state = {
  layout: localStorage.getItem("rvkb-layout") || layoutForLang(userLang()),
  manual: localStorage.getItem("rvkb-layout") !== null,
  shift: false, caps: false, script: "hira", alt: false, dead: ""
};
let target = null;   // the last focused text box (input or textarea), in this page or the chat frame
let panel, tab, keysEl, selectEl, targetEl, accentEl;

function toKata(ch) {
  return Array.from(ch).map(c => {
    const n = c.codePointAt(0);
    return n >= 0x3041 && n <= 0x3096 ? String.fromCodePoint(n + 0x60) : c;
  }).join("");
}
function glyph(key) {
  if (key.action) return key.label;
  const base = key[0], shifted = key[1] || key[0];
  if (state.layout === "japanese") {
    if (state.script === "hira") return state.shift ? base : shifted;
    if (state.script === "kata") return state.shift ? base : toKata(shifted);
    return state.shift ? base.toUpperCase() : base;
  }
  const shown = state.shift ? shifted : base;
  if (state.alt && LAYOUTS[state.layout].alt && LAYOUTS[state.layout].alt[shown]) return LAYOUTS[state.layout].alt[shown];
  const letter = base.toLowerCase() !== base.toUpperCase() && base.toLowerCase() === base;
  if (state.shift) return shifted;
  if (state.caps && letter) return base.toUpperCase();
  return base;
}
const DEAD = {
  "^": { a:"â", e:"ê", i:"î", o:"ô", u:"û", A:"Â", E:"Ê", I:"Î", O:"Ô", U:"Û" },
  "¨": { a:"ä", e:"ë", i:"ï", o:"ö", u:"ü", A:"Ä", E:"Ë", I:"Ï", O:"Ö", U:"Ü" },
  "´": { a:"á", e:"é", i:"í", o:"ó", u:"ú", A:"Á", E:"É", I:"Í", O:"Ó", U:"Ú" }
};
const DAKU = { か:"が",き:"ぎ",く:"ぐ",け:"げ",こ:"ご",さ:"ざ",し:"じ",す:"ず",せ:"ぜ",そ:"ぞ",た:"だ",ち:"ぢ",つ:"づ",て:"で",と:"ど",は:"ば",ひ:"び",ふ:"ぶ",へ:"べ",ほ:"ぼ" };
const HANDAKU = { は:"ぱ",ひ:"ぴ",ふ:"ぷ",へ:"ぺ",ほ:"ぽ" };
function voice(table, ch) {
  const kata = ch.codePointAt(0) >= 0x30A1;
  const base = kata ? String.fromCodePoint(ch.codePointAt(0) - 0x60) : ch;
  const next = table[base];
  return next ? (kata ? toKata(next) : next) : "";
}

/* ---- typing into the focused text box ---- */
function isText(el) {
  return el && (el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && /^(text|search|)$/i.test(el.type || ""))) && !el.readOnly && !el.disabled;
}
function ensureTarget() {
  if (target && target.isConnected) return target;
  target = document.getElementById("translate-input");
  return target;
}
function edit(fn) {
  const t = ensureTarget(); if (!t) return;
  const s = t.selectionStart ?? t.value.length, e = t.selectionEnd ?? s;
  fn(t, s, e);
  t.dispatchEvent(new Event("input", { bubbles: true }));
  try { t.focus({ preventScroll: true }); } catch (x) {}
}
function insert(ch) {
  if (state.dead && DEAD[state.dead] && DEAD[state.dead][ch]) { ch = DEAD[state.dead][ch]; state.dead = ""; }
  else if (state.dead) { ch = state.dead + ch; state.dead = ""; }
  edit((t, s, e) => t.setRangeText(ch, s, e, "end"));
  if (state.shift) state.shift = false;
  render();
}
function backspace() {
  edit((t, s, e) => {
    if (s !== e) t.setRangeText("", s, e, "end");
    else if (s > 0) { const before = Array.from(t.value.slice(0, s)); const last = before.pop() || ""; t.setRangeText("", s - last.length, s, "end"); }
  });
}
function enter() {
  const t = ensureTarget(); if (!t) return;
  if (t.tagName === "TEXTAREA" && !/globalInput/.test(t.id)) { insert("\n"); return; }
  // single-line boxes and the chat box: Enter sends, like the real keyboard
  ["keydown", "keypress", "keyup"].forEach(type => t.dispatchEvent(new KeyboardEvent(type, { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true, cancelable: true })));
}
function press(key) {
  if (key.action === "backspace") { state.dead = ""; backspace(); }
  else if (key.action === "space") insert(" ");
  else if (key.action === "enter") enter();
  else if (key.action === "tab") insert("\t");
  else if (key.action === "shift") state.shift = !state.shift;
  else if (key.action === "caps") state.caps = !state.caps;
  else if (key.action === "kana") state.script = "hira";
  else if (key.action === "kata") state.script = "kata";
  else if (key.action === "eisu") state.script = "latin";
  else if (key.id === "AltR") state.alt = !state.alt;
  else if (key.action === "char") { insert(key.ch); return; }
  else if (key.action === "noop") return;
  else {
    const ch = glyph(key);
    const t = ensureTarget();
    if ((ch === "゛" || ch === "゜") && t) {
      const s = t.selectionStart ?? t.value.length;
      const last = Array.from(t.value.slice(0, s)).pop();
      const voiced = last && voice(ch === "゛" ? DAKU : HANDAKU, last);
      if (voiced) { edit((x, a) => x.setRangeText(voiced, a - last.length, a, "end")); return; }
    }
    if ("^¨´".includes(ch) && (state.layout === "french" || state.layout === "spanish")) {
      state.dead = state.dead === ch ? "" : ch; render(); return;
    }
    insert(ch); return;
  }
  render();
}

/* ---- panel ---- */
const CSS = `
#wk-panel{position:fixed;left:0;right:0;bottom:0;z-index:2500;background:rgba(0,15,5,.97);border-top:2px solid #00ff41;
  color:#00ff41;font-family:"Courier New",monospace;padding:8px 10px 10px;max-height:46vh;overflow:auto;display:none;box-shadow:0 -6px 30px rgba(0,255,65,.18)}
#wk-panel.open{display:block}
#wk-panel .wk-head{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:6px;font-size:.8rem}
#wk-panel .wk-title{color:#ffe600;font-weight:bold}
#wk-panel select,#wk-panel .wk-btn{background:#000;color:#00ff41;border:1px solid #00ff41;border-radius:5px;padding:4px 8px;font:inherit;cursor:pointer}
#wk-panel .wk-target{opacity:.8}
#wk-panel .wk-close{margin-left:auto}
#wk-panel .wk-keys{display:flex;flex-direction:column;gap:5px}
#wk-panel .kb-row{display:flex;gap:4px;width:100%}
#wk-panel .key{background:#141414;border:2px solid #00ff41;border-radius:6px;color:#00ff41;font:600 .9rem "Courier New",monospace;cursor:pointer;
  user-select:none;display:flex;align-items:center;justify-content:center;flex:1 1 0;min-width:0;height:44px;padding:3px 5px;position:relative;box-shadow:0 2px 0 #062}
#wk-panel .key small{position:absolute;top:2px;left:4px;font-size:.58rem;color:#ffe600}
#wk-panel .key:active{transform:translateY(1px);background:#00ff41;color:#000}
#wk-panel .key.special{border-color:#ffe600;color:#ffe600}
#wk-panel .key.modifier{border-color:#0af;color:#0af;font-size:.74rem}
#wk-panel .key.latched{background:rgba(0,255,65,.28)}
/* keys share the full width; wider keys take a bigger share */
#wk-panel .key.w15{flex-grow:1.5}#wk-panel .key.w17{flex-grow:1.7}#wk-panel .key.w20{flex-grow:2}#wk-panel .key.w23{flex-grow:2.3}
#wk-panel .key.space{flex-grow:6}
#wk-tab{position:fixed;left:50%;bottom:0;transform:translateX(-50%);z-index:2501;background:rgba(0,15,5,.97);color:#00ff41;
  border:2px solid #00ff41;border-bottom:0;border-radius:8px 8px 0 0;padding:3px 14px;font:bold .8rem "Courier New",monospace;cursor:pointer}
#wk-tab:hover{background:#00ff41;color:#000}
#wk-panel .wk-accent{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px;font-size:.75rem;align-items:center}
#wk-panel .wk-chip{background:#000;color:#00ff41;border:1px solid #00ff41;border-radius:4px;padding:3px 7px;cursor:pointer;font:inherit}
@media (max-width:760px){#wk-panel .key{height:38px;font-size:.78rem;padding:2px}
  #wk-panel .kb-row{gap:3px}#wk-panel{padding:6px 3px 8px}}
`;
function build() {
  if (panel) return;
  const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
  panel = document.createElement("div"); panel.id = "wk-panel"; panel.setAttribute("aria-label", "World Keyboards");
  panel.innerHTML = '<div class="wk-head"><span class="wk-title">⌨️ WORLD KEYBOARDS</span>' +
    '<select id="wk-layout" title="Keyboard layout (follows your language until you pick one)"></select>' +
    '<button type="button" class="wk-btn" id="wk-follow" title="Use the keyboard of your language">Your language</button>' +
    '<span class="wk-target" id="wk-target"></span>' +
    '<button type="button" class="wk-btn wk-close" id="wk-close" title="Hide the keyboard (the ⌨️ tab at the bottom brings it back)">▼ Hide</button></div>' +
    '<div class="wk-keys" id="wk-keys"></div><div class="wk-accent" id="wk-accent"></div>';
  document.body.appendChild(panel);
  // the tab stays visible while the keyboard is hidden
  tab = document.createElement("button"); tab.type = "button"; tab.id = "wk-tab";
  tab.textContent = "⌨️ ▲ Keyboard"; tab.title = "Show the keyboard";
  tab.addEventListener("click", open);
  document.body.appendChild(tab);
  // keep the text box focused while keys are pressed
  panel.addEventListener("mousedown", e => { if (e.target.tagName !== "SELECT") e.preventDefault(); });
  keysEl = panel.querySelector("#wk-keys"); selectEl = panel.querySelector("#wk-layout");
  targetEl = panel.querySelector("#wk-target"); accentEl = panel.querySelector("#wk-accent");
  const groups = {};
  Object.entries(LAYOUTS).forEach(([id, l]) => (groups[l.group] ||= []).push([id, l.name]));
  Object.entries(groups).forEach(([name, items]) => {
    const og = document.createElement("optgroup"); og.label = name;
    items.forEach(([id, label]) => { const o = document.createElement("option"); o.value = id; o.textContent = label; og.appendChild(o); });
    selectEl.appendChild(og);
  });
  selectEl.addEventListener("change", () => { state.layout = selectEl.value; state.manual = true; localStorage.setItem("rvkb-layout", state.layout); render(); });
  panel.querySelector("#wk-follow").addEventListener("click", () => { state.manual = false; localStorage.removeItem("rvkb-layout"); state.layout = layoutForLang(userLang()); render(); });
  panel.querySelector("#wk-close").addEventListener("click", close);
}
function describe(t) {
  if (!t) return "";
  if (t.id === "translate-input") return "→ typing into: Translate";
  if (t.id === "globalInput") return "→ typing into: Chat";
  return "→ typing into: " + (t.placeholder || t.id || "text box").slice(0, 30);
}
function render() {
  if (!panel) return;
  const layout = LAYOUTS[state.layout] || LAYOUTS.uk;
  selectEl.value = state.layout;
  targetEl.textContent = describe(ensureTarget()) + (state.dead ? " · accent " + state.dead : "");
  keysEl.innerHTML = ""; keysEl.dir = "ltr";
  layout.rows.forEach(row => {
    const r = document.createElement("div"); r.className = "kb-row";
    row.forEach(key => {
      const el = document.createElement("button"); el.type = "button"; el.className = "key " + (key.cls || "");
      if ((key.action === "shift" && state.shift) || (key.action === "caps" && state.caps) ||
          (key.action === "kana" && state.script === "hira") || (key.action === "kata" && state.script === "kata") ||
          (key.id === "AltR" && state.alt)) el.classList.add("latched");
      if (!key.action && key[1] && key[1] !== key[0]) { const s = document.createElement("small"); s.textContent = state.shift ? key[0] : key[1]; el.appendChild(s); }
      el.appendChild(document.createTextNode(glyph(key)));
      el.addEventListener("click", () => press(key));
      r.appendChild(el);
    });
    keysEl.appendChild(r);
  });
  accentEl.innerHTML = "";
  if (layout.accent && layout.accent.chips && layout.accent.chips.length) {
    layout.accent.chips.forEach(([ch, label]) => {
      const b = document.createElement("button"); b.type = "button"; b.className = "wk-chip"; b.title = label; b.textContent = ch;
      b.addEventListener("click", () => insert(ch)); accentEl.appendChild(b);
    });
  }
}

/* follow focus in this page and in any same-origin frame given to watch() */
function watch(doc) {
  try {
    doc.addEventListener("focusin", e => { if (isText(e.target)) { target = e.target; render(); } }, true);
  } catch (e) {}
}
// shown or hidden is remembered on the device
function remember(v) { try { localStorage.setItem("rvkb-state", v); } catch (e) {} }
function open() { build(); ensureTarget(); render(); panel.classList.add("open"); tab.style.display = "none"; document.body.classList.add("wk-open"); remember("shown"); fire(); }
function close() { build(); panel.classList.remove("open"); tab.style.display = ""; document.body.classList.remove("wk-open"); remember("hidden"); fire(); }
function toggle() { panel && panel.classList.contains("open") ? close() : open(); }
function isOpen() { return !!(panel && panel.classList.contains("open")); }
function fire() { document.dispatchEvent(new CustomEvent("worldkeyboards", { detail: { open: isOpen() } })); }
function setLang(code) { if (!state.manual) { state.layout = layoutForLang(code); render(); } }

watch(document);
// start as last time: shown, or hidden with only the tab (the page may still ask to open it)
(function start() {
  if (!document.body) { document.addEventListener("DOMContentLoaded", start); return; }
  let st = null; try { st = localStorage.getItem("rvkb-state"); } catch (e) {}
  if (st === "shown") open(); else { build(); render(); }
})();
window.WorldKeyboards = { open, close, toggle, isOpen, watch, setLang, layouts: LAYOUTS, layoutForLang };
})();
