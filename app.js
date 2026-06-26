
"use strict";

const STORAGE_KEY = "vocabTrainerData";
const LISTEN_STORAGE_KEY = "vocabTrainerListenText";
const PRESET_VERSION = 20;
const SMART_LIMIT = 20;
const TODAY_LABEL = new Date().toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" });

const IMPORT_TEMPLATE = `deck;tags;en;pronounce;cz;example;note
Lekce 2;cestování, fráze;go away;gou əwéj;odjet pryč;We went away for the weekend.;
Lekce 2;jídlo;a picky eater;ə pyki ítr;vybíravý v jídle;My son is a picky eater.;`;

const GPT_IMPORT_PROMPT = `Připrav mi slovíčka pro import do mé aplikace.

Výstup musí být pouze CSV se středníkem, bez komentářů okolo.

Formát:
deck;tags;en;pronounce;cz;example;note

Pravidla:
- deck = název lekce, například Lekce 3
- tags = krátké štítky oddělené čárkou
- en = anglické slovíčko nebo fráze
- pronounce = jednoduchý český fonetický přepis
- cz = český překlad
- example = krátká anglická věta
- note = jen pokud je potřeba vysvětlení, jinak prázdné
- nevkládej nepravidelná slovesa, ta už jsou v aplikaci
- nepoužívej středník uvnitř hodnot
- každý řádek musí mít přesně 7 sloupců
- ponech hlavičku jako první řádek

Tady jsou moje slovíčka / poznámky:
[vložím text]`;

const LISTEN_TEMPLATE = `title: Past simple - moje věty
repeat: 2
pauseAfterEnglish: 2
pauseBeforeCzech: 3

bought = koupil
EN: I bought a new phone.
CZ: Koupil jsem si nový telefon.`;

const GPT_LISTEN_PROMPT = `Připrav mi podklad pro poslech do mé aplikace na učení angličtiny.

Výstup musí být pouze čistý text ve formátu:

title: Název poslechu
repeat: 2
pauseAfterEnglish: 2
pauseBeforeCzech: 3

anglické slovo nebo fráze = český překlad
EN: krátká anglická věta
CZ: český překlad věty`;

const IRREGULAR_VERBS = [
  ["be", "bí", "was / were", "woz / wér", "být", "I am at home.", "I was at home yesterday.", "been"],
  ["become", "bikam", "became", "bikejm", "stát se", "She wants to become a doctor.", "She became a doctor.", "become"],
  ["begin", "bigin", "began", "bigen", "začít", "The lesson begins at nine.", "The lesson began at nine.", "begun"],
  ["break", "brejk", "broke", "brouk", "rozbít, zlomit", "Please do not break it.", "He broke his phone.", "broken"],
  ["bring", "bring", "brought", "brót", "přinést", "Please bring your book.", "She brought a cake.", "brought"],
  ["build", "bild", "built", "bilt", "stavět", "They build houses.", "They built a house.", "built"],
  ["buy", "baj", "bought", "bót", "koupit", "I want to buy a ticket.", "I bought a ticket.", "bought"],
  ["can", "ken", "could", "kud", "moci, umět", "I can swim.", "I could swim when I was younger.", "-"],
  ["catch", "keč", "caught", "kót", "chytit", "I catch the ball.", "I caught the ball.", "caught"],
  ["choose", "čúz", "chose", "čouz", "vybrat", "I choose this one.", "I chose this one.", "chosen"],
  ["come", "kam", "came", "kejm", "přijít", "They often come late.", "They came late.", "come"],
  ["cost", "kost", "cost", "kost", "stát cenu", "It costs ten crowns.", "It cost ten crowns.", "cost"],
  ["cut", "kat", "cut", "kat", "řezat, krájet", "Cut the paper.", "He cut the paper.", "cut"],
  ["do", "dú", "did", "did", "dělat", "I do my homework.", "I did my homework.", "done"],
  ["drink", "drink", "drank", "drenk", "pít", "She drinks water.", "She drank water.", "drunk"],
  ["drive", "drajv", "drove", "drouv", "řídit", "He can drive a car.", "He drove to Prague.", "driven"],
  ["eat", "ít", "ate", "ejt", "jíst", "We eat dinner at seven.", "We ate dinner.", "eaten"],
  ["fall", "fól", "fell", "fel", "padat", "Leaves fall in autumn.", "He fell down.", "fallen"],
  ["feel", "fíl", "felt", "felt", "cítit", "I feel good.", "I felt good.", "felt"],
  ["find", "fajnd", "found", "faund", "najít", "I need to find my keys.", "I found my keys.", "found"],
  ["fly", "flaj", "flew", "flú", "létat", "Birds fly.", "We flew to London.", "flown"],
  ["forget", "forget", "forgot", "forgot", "zapomenout", "Do not forget it.", "I forgot it.", "forgotten"],
  ["get", "get", "got", "got", "dostat, získat", "I get a lot of emails.", "I got a message.", "got/gotten"],
  ["give", "giv", "gave", "gejv", "dát", "She gives good advice.", "She gave me advice.", "given"],
  ["go", "gou", "went", "went", "jít, jet", "We go away every summer.", "We went away for the weekend.", "gone"],
  ["grow", "grou", "grew", "grú", "růst, pěstovat", "Plants grow fast.", "The plant grew fast.", "grown"],
  ["have", "hev", "had", "hed", "mít", "I have a good idea.", "I had a good idea.", "had"],
  ["hear", "hír", "heard", "hérd", "slyšet", "I hear music.", "I heard music.", "heard"],
  ["hit", "hit", "hit", "hit", "udeřit", "Hit the ball.", "He hit the ball.", "hit"],
  ["keep", "kýp", "kept", "kept", "držet, nechat", "Keep it safe.", "I kept it safe.", "kept"],
  ["know", "nou", "knew", "ňú", "vědět, znát", "I know the answer.", "I knew the answer.", "known"],
  ["learn", "lern", "learnt", "lernt", "učit se", "I learn English.", "I learnt English.", "learnt"],
  ["leave", "lív", "left", "left", "odejít, opustit", "I leave at six.", "I left at six.", "left"],
  ["lend", "lend", "lent", "lent", "půjčit někomu", "Lend me your pen.", "He lent me his pen.", "lent"],
  ["let", "let", "let", "let", "nechat, dovolit", "Let me go.", "He let me go.", "let"],
  ["lose", "lúz", "lost", "lost", "ztratit", "Do not lose it.", "I lost it.", "lost"],
  ["make", "mejk", "made", "mejd", "udělat, vyrobit", "They make mistakes.", "They made a mistake.", "made"],
  ["meet", "mít", "met", "met", "potkat", "We meet every Monday.", "We met yesterday.", "met"],
  ["pay", "pej", "paid", "pejd", "platit", "I pay by card.", "I paid by card.", "paid"],
  ["put", "put", "put", "put", "dát, položit", "Put it here.", "I put it here.", "put"],
  ["read", "ríd", "read", "red", "číst", "I read every evening.", "I read the article yesterday.", "read"],
  ["ring", "ring", "rang", "reng", "zvonit", "The phone rings.", "The phone rang.", "rung"],
  ["run", "ran", "ran", "ran", "běžet", "I run every day.", "I ran yesterday.", "run"],
  ["say", "sej", "said", "sed", "říct", "I say hello.", "I said hello.", "said"],
  ["see", "sí", "saw", "só", "vidět", "I see him every day.", "I saw him yesterday.", "seen"],
  ["sell", "sel", "sold", "sould", "prodat", "They sell cars.", "They sold the car.", "sold"],
  ["send", "send", "sent", "sent", "poslat", "I send emails.", "I sent an email.", "sent"],
  ["shut", "šat", "shut", "šat", "zavřít", "Shut the door.", "He shut the door.", "shut"],
  ["sing", "sing", "sang", "seng", "zpívat", "I sing songs.", "I sang a song.", "sung"],
  ["sit", "sit", "sat", "sat", "sedět", "I sit here.", "I sat here.", "sat"],
  ["sleep", "slíp", "slept", "slept", "spát", "I sleep well.", "I slept well.", "slept"],
  ["speak", "spík", "spoke", "spouk", "mluvit", "She speaks English.", "She spoke English.", "spoken"],
  ["spend", "spend", "spent", "spent", "trávit, utratit", "I spend time at home.", "I spent time at home.", "spent"],
  ["stand", "stend", "stood", "stud", "stát", "I stand here.", "I stood here.", "stood"],
  ["steal", "stíl", "stole", "stoul", "ukrást", "Do not steal.", "He stole money.", "stolen"],
  ["swim", "swim", "swam", "swem", "plavat", "I swim every week.", "I swam yesterday.", "swum"],
  ["take", "tejk", "took", "tuk", "vzít", "He takes photos.", "He took a photo.", "taken"],
  ["teach", "tíč", "taught", "tót", "učit", "I teach English.", "I taught English.", "taught"],
  ["tell", "tel", "told", "tould", "říct, vyprávět", "Tell me the truth.", "He told me the truth.", "told"],
  ["think", "think", "thought", "thót", "myslet", "I think about it.", "I thought about it.", "thought"],
  ["throw", "throu", "threw", "thrú", "hodit", "Throw the ball.", "He threw the ball.", "thrown"],
  ["understand", "anderstend", "understood", "anderstúd", "rozumět", "I understand you.", "I understood you.", "understood"],
  ["wake", "wejk", "woke", "wouk", "probudit se", "I wake up early.", "I woke up early.", "woken"],
  ["wear", "wér", "wore", "wór", "nosit oblečení", "I wear a jacket.", "I wore a jacket.", "worn"],
  ["win", "win", "won", "won", "vyhrát", "We win games.", "We won the game.", "won"],
  ["write", "rajt", "wrote", "rout", "psát", "I write short notes.", "I wrote a note.", "written"]
];

const app = document.querySelector("#app");

const state = {
  words: loadWords(),
  view: "home",
  params: {},
  importText: "",
  importResult: null,
  practice: null,
  irregularFormsPractice: null,
  customListen: {
    text: loadListenText(),
  },
};

function createId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalize(value) { return String(value ?? "").trim(); }
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function uniqueList(values) {
  const seen = new Set();
  return values.map(normalize).filter(Boolean).filter((value) => {
    const key = value.toLocaleLowerCase("cs-CZ");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function splitTags(value) { return Array.isArray(value) ? value : String(value || "").split(",").map(normalize).filter(Boolean); }
function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeIrregularWord(en, pronounce, cz, example, note, tags) {
  return { id: createId(), deck: "Nepravidelná slovesa", decks: ["Nepravidelná slovesa"], tags, en, pronounce, cz, example, note, mistakes: 0, correct: 0, seenCount: 0, streak: 0, lastPracticedAt: "", lastWrongAt: "", createdAt: new Date().toISOString() };
}

function buildIrregularVerbs() {
  const words = [];
  IRREGULAR_VERBS.forEach(([base, basePronounce, past, pastPronounce, cz, baseExample, pastExample, participle]) => {
    words.push(makeIrregularWord(base, basePronounce, cz, baseExample, `past simple: ${past}, past participle: ${participle}`, ["slovesa", "infinitiv"]));
    words.push(makeIrregularWord(past, pastPronounce, `${cz} - minulý čas`, pastExample, `past simple od slovesa ${base}; past participle: ${participle}`, ["slovesa", "past simple"]));
  });
  return words;
}

function normalizeWords(words) {
  return words.map((word) => {
    const deck = normalize(word.deck || word.decks?.[0] || "Bez lekce");
    const decks = uniqueList([...(Array.isArray(word.decks) ? word.decks : []), deck]);
    return {
      id: word.id || createId(), deck, decks,
      tags: uniqueList(Array.isArray(word.tags) ? word.tags : splitTags(word.tags)),
      en: normalize(word.en), pronounce: normalize(word.pronounce), cz: normalize(word.cz),
      example: normalize(word.example), note: normalize(word.note),
      mistakes: Number(word.mistakes || 0), correct: Number(word.correct || 0),
      seenCount: Number(word.seenCount || 0), streak: Number(word.streak || 0),
      lastPracticedAt: word.lastPracticedAt || "", lastWrongAt: word.lastWrongAt || "",
      createdAt: word.createdAt || new Date().toISOString(),
    };
  }).filter((word) => word.en && word.cz);
}

function identityKey(word) { return `${word.en.toLocaleLowerCase("en-US")}::${word.cz.toLocaleLowerCase("cs-CZ")}`; }
function mergeWords(existingWords, incomingWords) {
  const words = normalizeWords(existingWords);
  const index = new Map(words.map((word) => [identityKey(word), word]));
  let added = 0, merged = 0;
  normalizeWords(incomingWords).forEach((incoming) => {
    const current = index.get(identityKey(incoming));
    if (!current) { words.push(incoming); index.set(identityKey(incoming), incoming); added += 1; return; }
    current.decks = uniqueList([...current.decks, ...incoming.decks]);
    current.deck = current.decks[0];
    current.tags = uniqueList([...current.tags, ...incoming.tags]);
    current.pronounce = current.pronounce || incoming.pronounce;
    current.example = current.example || incoming.example;
    current.note = uniqueList([current.note, incoming.note]).join(" | ");
    merged += 1;
  });
  return { words, added, merged };
}

function loadWords() {
  let words = [];
  let presetVersion = 0;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      words = Array.isArray(parsed.words) ? parsed.words : [];
      presetVersion = Number(parsed.presetVersion || 0);
    }
  } catch (error) { console.warn("Uložená data se nepodařilo načíst.", error); }
  words = normalizeWords(words);
  if (presetVersion < PRESET_VERSION) words = mergeWords(words, buildIrregularVerbs()).words;
  saveWords(words);
  return words;
}
function saveWords(words = state.words) { localStorage.setItem(STORAGE_KEY, JSON.stringify({ presetVersion: PRESET_VERSION, words: normalizeWords(words) })); }
function loadListenText() { try { return localStorage.getItem(LISTEN_STORAGE_KEY) || LISTEN_TEMPLATE; } catch { return LISTEN_TEMPLATE; } }
function saveListenText(text) { try { localStorage.setItem(LISTEN_STORAGE_KEY, text); } catch {} }

function getDeckNames(word) { return uniqueList(Array.isArray(word.decks) && word.decks.length ? word.decks : [word.deck]); }
function getDecks(words = state.words) {
  const decks = new Map();
  words.forEach((word) => getDeckNames(word).forEach((name) => {
    if (!decks.has(name)) decks.set(name, { name, count: 0, problemCount: 0 });
    const deck = decks.get(name); deck.count += 1; if (word.mistakes > 0) deck.problemCount += 1;
  }));
  return Array.from(decks.values()).sort((a, b) => a.name.localeCompare(b.name, "cs"));
}
function getTags(words = state.words) {
  const tags = new Map();
  words.forEach((word) => word.tags.forEach((name) => {
    if (!tags.has(name)) tags.set(name, { name, count: 0, problemCount: 0 });
    const tag = tags.get(name); tag.count += 1; if (word.mistakes > 0) tag.problemCount += 1;
  }));
  return Array.from(tags.values()).sort((a, b) => a.name.localeCompare(b.name, "cs"));
}
function getWordsForDeck(deck) { return state.words.filter((word) => getDeckNames(word).includes(deck)); }
function getWordsForTag(tag) { return state.words.filter((word) => word.tags.includes(tag)); }
function getProblemWords() { return state.words.filter((word) => Number(word.mistakes) > 0).sort((a, b) => b.mistakes - a.mistakes || a.en.localeCompare(b.en)); }
function daysSince(isoDate) { if (!isoDate) return 999; const time = new Date(isoDate).getTime(); if (Number.isNaN(time)) return 999; return Math.max(0, Math.floor((Date.now() - time) / 86400000)); }
function smartScore(word) {
  let score = 0;
  if (!word.seenCount) score += 120;
  score += Number(word.mistakes || 0) * 14;
  score -= Number(word.correct || 0) * 2;
  score -= Number(word.streak || 0) * 8;
  score += Math.min(daysSince(word.lastPracticedAt || word.createdAt), 30);
  if (word.lastWrongAt) score += Math.max(0, 18 - daysSince(word.lastWrongAt));
  return score;
}
function selectSmartWords(words, limit = SMART_LIMIT) { return [...words].sort((a, b) => smartScore(b) - smartScore(a) || a.en.localeCompare(b.en, "en")).slice(0, limit); }

function navigate(view, params = {}) { state.view = view; state.params = params; state.importResult = view === "import" ? state.importResult : null; render(); }
function goBack() {
  if (state.view === "home") return;
  if (state.view === "irregularForms") return navigate("home");
  if (state.view === "wordList") return navigate(state.params.type === "tag" ? "tags" : "decks");
  if (state.view === "practice") return navigate("home");
  if (state.view === "listenPrompt") return navigate("customListen");
  navigate("home");
}
function header(title, back = true) { return `<div class="topbar">${back ? `<button class="back-button" type="button" data-action="back" aria-label="Zpět">‹</button>` : ""}<h1>${escapeHtml(title)}</h1></div>`; }
function render() {
  const views = { home: renderHome, decks: renderDecks, tags: renderTags, import: renderImport, wordList: renderWordList, practice: renderPractice, problems: renderProblems, export: renderExport, audio: renderAudio, gptPrompt: renderGptPrompt, customListen: renderCustomListen, listenPrompt: renderListenPrompt, irregularForms: renderIrregularForms };
  app.innerHTML = (views[state.view] || renderHome)();
}

function renderHome() {
  const allCount = state.words.length, deckCount = getDecks().length, tagCount = getTags().length, problemCount = getProblemWords().length;
  return `${header("Moje slovíčka", false)}<section class="stack"><div class="stats-grid" aria-label="Souhrn slovíček"><div class="stat"><strong>${allCount}</strong><span>slovíček</span></div><div class="stat"><strong>${deckCount}</strong><span>lekcí</span></div><div class="stat"><strong>${tagCount}</strong><span>štítků</span></div><div class="stat"><strong>${problemCount}</strong><span>problémových</span></div></div><div class="notice">Výchozí aplikace obsahuje nepravidelná slovesa. Ostatní lekce si můžeš přidávat importem.</div><div class="button-grid"><button class="btn wide" type="button" data-action="smart-practice">Chytrý trénink</button><button class="btn wide" type="button" data-action="practice-irregular">Nepravidelná slovesa</button><button class="btn" type="button" data-action="decks">Lekce</button><button class="btn secondary" type="button" data-action="tags">Štítky</button><button class="btn secondary" type="button" data-action="import">Import</button><button class="btn secondary" type="button" data-action="gpt-prompt">Prompt pro GPT</button><button class="btn secondary" type="button" data-action="audio">Poslech</button><button class="btn secondary" type="button" data-action="custom-listen">Vlastní poslech</button><button class="btn secondary" type="button" data-action="problems">Problémová slovíčka</button><button class="btn secondary" type="button" data-action="export">Export/Záloha</button><button class="btn danger wide" type="button" data-action="delete-all">Smazat všechna data</button></div></section>`;
}
function renderDecks() { const decks = getDecks(); return `${header("Lekce")}<section class="stack">${decks.length ? decks.map((deck) => renderCollectionRow(deck, "deck")).join("") : `<div class="empty-state">Zatím tu nejsou žádné lekce.</div>`}</section>`; }
function renderTags() { const tags = getTags(); return `${header("Štítky")}<section class="stack">${tags.length ? tags.map((tag) => renderCollectionRow(tag, "tag")).join("") : `<div class="empty-state">Zatím tu nejsou žádné štítky.</div>`}</section>`; }
function renderCollectionRow(item, type) {
  const actionPrefix = type === "tag" ? "tag" : "deck";
  return `<article class="deck-row"><div><h2>${escapeHtml(item.name)}</h2><div class="row-meta"><span class="pill">${item.count} slovíček</span><span class="pill">${item.problemCount} problémových</span></div></div><div class="row-actions"><button class="btn" type="button" data-action="practice-${actionPrefix}-short" data-name="${escapeHtml(item.name)}">Krátký trénink</button><button class="btn secondary" type="button" data-action="practice-${actionPrefix}" data-name="${escapeHtml(item.name)}">Všechna</button><button class="btn secondary" type="button" data-action="word-list" data-type="${type}" data-name="${escapeHtml(item.name)}">Seznam</button></div></article>`;
}
function renderWordList() { const name = state.params.name, type = state.params.type || "deck", words = type === "tag" ? getWordsForTag(name) : getWordsForDeck(name); return `${header(name || "Seznam")}<section class="stack">${words.map(renderWordRow).join("") || `<div class="empty-state">Tady zatím nejsou žádná slovíčka.</div>`}</section>`; }
function renderWordRow(word) {
  return `<article class="word-row"><div><h2>${escapeHtml(word.en)}</h2><p><strong>${escapeHtml(word.cz)}</strong> ${word.pronounce ? `<span class="muted">[${escapeHtml(word.pronounce)}]</span>` : ""}</p>${word.example ? `<p class="muted">${escapeHtml(word.example)}</p>` : ""}${word.note ? `<p class="muted">${escapeHtml(word.note)}</p>` : ""}<div class="row-meta">${getDeckNames(word).map((deck) => `<span class="pill">Lekce: ${escapeHtml(deck)}</span>`).join("")}${word.tags.map((tag) => `<span class="pill">#${escapeHtml(tag)}</span>`).join("")}<span class="pill">${word.mistakes} chyb</span><span class="pill">${word.correct} správně</span></div></div><button class="btn danger" type="button" data-action="delete-word" data-id="${escapeHtml(word.id)}">Smazat slovíčko</button></article>`;
}

function createPractice(words, label, source, mode = "en-cz", restart = {}) { return { label, source, mode, queue: shuffle(words.map((word) => word.id)), total: words.length, roundMistakes: 0, flipped: false, done: false, restart }; }
function getCurrentPracticeWord() { return state.words.find((word) => word.id === state.practice?.queue[0]); }
function startPractice(words, label, source, restart) { if (!words.length) { alert("Tady zatím nejsou žádná slovíčka k procvičování."); return; } state.practice = createPractice(words, label, source, state.practice?.mode || "en-cz", restart); navigate("practice"); }
function startSmartPractice() { const words = selectSmartWords(state.words, SMART_LIMIT); startPractice(words, `Chytrý trénink (${words.length})`, "smart", { type: "smart" }); }
function startDeckPractice(deck, limit = null) { const allWords = getWordsForDeck(deck); const words = limit ? selectSmartWords(allWords, limit) : allWords; const label = limit ? `${deck} · ${words.length} slovíček` : deck; startPractice(words, label, limit ? "deck-short" : "deck", { type: "deck", name: deck, limit }); }
function startTagPractice(tag, limit = null) { const allWords = getWordsForTag(tag); const words = limit ? selectSmartWords(allWords, limit) : allWords; const label = limit ? `#${tag} · ${words.length} slovíček` : tag; startPractice(words, label, limit ? "tag-short" : "tag", { type: "tag", name: tag, limit }); }
function startProblemPractice() { startPractice(getProblemWords(), "Problémová slovíčka", "problems", { type: "problems" }); }
function restartPractice() { const restart = state.practice?.restart || {}; if (restart.type === "smart") return startSmartPractice(); if (restart.type === "tag") return startTagPractice(restart.name, restart.limit || null); if (restart.type === "problems") return startProblemPractice(); if (restart.type === "deck") return startDeckPractice(restart.name, restart.limit || null); startSmartPractice(); }
function renderPractice() {
  const practice = state.practice;
  if (!practice) return `${header("Procvičování")}<div class="empty-state">Procvičování není spuštěné.</div>`;
  if (practice.done) return `${header("Hotovo")}<section class="stack"><div class="summary-card"><h2>Hotovo</h2><p>Procvičeno slovíček: <strong>${practice.total}</strong></p><p>Chyb v tomto kole: <strong>${practice.roundMistakes}</strong></p></div><button class="btn" type="button" data-action="restart-practice">Spustit znovu</button></section>`;
  const word = getCurrentPracticeWord();
  if (!word) return `${header("Procvičování")}<div class="empty-state">Slovíčko se nepodařilo najít.</div>`;
  const isReverse = practice.mode === "cz-en";
  const frontMain = isReverse ? word.cz : word.en;
  const backMain = isReverse ? word.en : word.cz;
  const backSub = isReverse ? (word.pronounce ? `[${word.pronounce}]` : "") : word.example;
  return `${header(practice.label)}<section class="practice-head"><div class="progress-line"><span>Zbývá ${practice.queue.length} z ${practice.total}</span><span>Chyby v kole: ${practice.roundMistakes}</span></div><div class="mode-toggle"><button type="button" class="${practice.mode === "en-cz" ? "active" : ""}" data-action="set-mode" data-mode="en-cz">EN → CZ</button><button type="button" class="${practice.mode === "cz-en" ? "active" : ""}" data-action="set-mode" data-mode="cz-en">CZ → EN</button></div></section><button class="flashcard" type="button" data-action="flip-card"><p class="card-main">${escapeHtml(practice.flipped ? backMain : frontMain)}</p>${practice.flipped && backSub ? `<p class="card-sub">${escapeHtml(backSub)}</p>` : ""}${practice.flipped && word.note ? `<p class="card-detail">${escapeHtml(word.note)}</p>` : ""}</button><div class="practice-actions"><button class="btn secondary" type="button" data-action="speak-word">🔊 Slovo</button><button class="btn secondary" type="button" data-action="speak-example" ${word.example ? "" : "disabled"}>🔊 Věta</button><button class="btn danger" type="button" data-action="mark-wrong">❌ Neumím</button><button class="btn success" type="button" data-action="mark-right">✅ Umím</button></div>`;
}
function markCurrent(isCorrect) {
  const practice = state.practice, word = getCurrentPracticeWord();
  if (!practice || !word) return;
  const now = new Date().toISOString();
  word.seenCount += 1; word.lastPracticedAt = now;
  if (isCorrect) { word.correct += 1; word.streak += 1; practice.queue.shift(); }
  else { word.mistakes += 1; word.streak = 0; word.lastWrongAt = now; practice.roundMistakes += 1; practice.queue.push(practice.queue.shift()); }
  practice.flipped = false; practice.done = practice.queue.length === 0; saveWords(); render();
}

function cleanFormAnswer(value) { return normalize(value).toLocaleLowerCase("en-US").replace(/[^a-z]/g, ""); }
function formAnswerMatches(userAnswer, correctAnswer) { return cleanFormAnswer(userAnswer) === cleanFormAnswer(correctAnswer); }
function startIrregularFormsPractice() {
  state.irregularFormsPractice = { queue: shuffle(IRREGULAR_VERBS.map((verb) => ({ base: verb[0], past: verb[2], cz: verb[4], participle: verb[7] }))), index: 0, checked: false, result: null, correctCount: 0, wrongCount: 0, activeField: "base", answers: { base: "", past: "", participle: "" }, letters: [] };
  navigate("irregularForms");
}
function getCurrentIrregularFormVerb() { const practice = state.irregularFormsPractice; if (!practice || !practice.queue.length) return null; return practice.queue[practice.index]; }
function createLetterButtonsForVerb(verb) {
  const answerLetters = `${verb.base}${verb.past}${verb.participle}`.toLocaleLowerCase("en-US").replace(/[^a-z]/g, "").split("");
  const repeated = answerLetters;
  const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
  const extras = shuffle(alphabet).slice(0, 7);
  return shuffle([...repeated, ...extras]);
}
function getIrregularLetters() {
  const practice = state.irregularFormsPractice, verb = getCurrentIrregularFormVerb();
  if (!practice || !verb) return [];
  if (!practice.letters || !practice.letters.length) practice.letters = createLetterButtonsForVerb(verb);
  return practice.letters;
}
function getActiveIrregularField() { return state.irregularFormsPractice?.activeField || "base"; }
function setActiveIrregularField(field) { const practice = state.irregularFormsPractice; if (!practice || practice.checked) return; if (!["base", "past", "participle"].includes(field)) return; practice.activeField = field; }
function addIrregularLetter(letter) { const practice = state.irregularFormsPractice; if (!practice || practice.checked) return; const field = getActiveIrregularField(); practice.answers[field] = `${practice.answers[field] || ""}${letter}`; render(); }
function backspaceIrregularLetter() { const practice = state.irregularFormsPractice; if (!practice || practice.checked) return; const field = getActiveIrregularField(); practice.answers[field] = String(practice.answers[field] || "").slice(0, -1); render(); }
function clearIrregularField() { const practice = state.irregularFormsPractice; if (!practice || practice.checked) return; const field = getActiveIrregularField(); practice.answers[field] = ""; render(); }
function switchIrregularField(field) { setActiveIrregularField(field); render(); }
function syncIrregularAnswersFromInputs() { /* herní režim používá letters/button state */ }
function renderIrregularForms() {
  const practice = state.irregularFormsPractice, verb = getCurrentIrregularFormVerb();
  if (!practice || !verb) return `${header("Nepravidelná slovesa")}<section class="stack"><div class="empty-state">Trénink není spuštěný.</div><button class="btn" type="button" data-action="start-irregular-forms">Spustit trénink</button></section>`;
  const result = practice.result, finished = practice.index >= practice.queue.length - 1, active = getActiveIrregularField(), letters = getIrregularLetters();
  const answerResult = (ok, text) => !result ? "" : `<div class="answer-result ${ok ? "answer-ok" : "answer-bad"}">${ok ? "OK" : "Špatně"}: ${escapeHtml(text)}</div>`;
  const slotLine = (field, label, correctText) => {
    const correctLength = cleanFormAnswer(correctText).length;
    const answer = cleanFormAnswer(practice.answers[field] || "");
    const chars = answer.toUpperCase().split("");
    return `<button class="slot-row ${active === field ? "active-slot" : ""}" type="button" data-action="switch-irregular-field" data-field="${field}" ${practice.checked ? "disabled" : ""}><span class="slot-label">${label}</span><span class="slot-boxes">${Array.from({ length: correctLength }).map((_, index) => `<span class="slot-box">${escapeHtml(chars[index] || "")}</span>`).join("")}</span></button>`;
  };
  return `${header("Nepravidelná slovesa")}<section class="game-screen"><div class="game-top"><div class="game-stat">✅ ${practice.correctCount}</div><div class="game-stat big">${practice.index + 1}</div><div class="game-stat">❌ ${practice.wrongCount}</div></div><div class="game-progress"><div class="game-progress-fill" style="width: ${Math.round(((practice.index + 1) / practice.queue.length) * 100)}%"></div></div><div class="game-question"><p>Všechny tři tvary slovesa:</p><h2>${escapeHtml(verb.cz)}</h2></div><div class="slot-area">${slotLine("base", "Infinitiv", verb.base)}<div class="slot-separator">-</div>${slotLine("past", "Past simple", verb.past)}<div class="slot-separator">-</div>${slotLine("participle", "Past participle", verb.participle)}</div>${result ? `<div class="notice ${result.allCorrect ? "success" : "danger"}"><strong>${result.allCorrect ? "Správně ✅" : "Něco je špatně ❌"}</strong><p>Správné tvary: <strong>${escapeHtml(verb.base)}</strong> — <strong>${escapeHtml(verb.past)}</strong> — <strong>${escapeHtml(verb.participle)}</strong></p>${answerResult(result.baseCorrect, verb.base)}${answerResult(result.pastCorrect, verb.past)}${answerResult(result.participleCorrect, verb.participle)}</div>` : ""}<div class="game-letters" aria-label="Písmena pro odpověď">${letters.map((letter) => `<button class="game-letter" type="button" data-action="add-irregular-letter" data-letter="${escapeHtml(letter)}" ${practice.checked ? "disabled" : ""}>${escapeHtml(letter.toUpperCase())}</button>`).join("")}</div><div class="game-actions"><button class="btn secondary" type="button" data-action="backspace-irregular-letter" ${practice.checked ? "disabled" : ""}>⌫</button><button class="btn secondary" type="button" data-action="clear-irregular-field" ${practice.checked ? "disabled" : ""}>Vymazat</button><button class="btn success" type="button" data-action="check-irregular-forms" ${practice.checked ? "disabled" : ""}>Zkontrolovat</button><button class="btn secondary" type="button" data-action="next-irregular-form" ${practice.checked ? "" : "disabled"}>${finished ? "Dokončit" : "Další"}</button></div><button class="btn danger" type="button" data-action="restart-irregular-forms">Od začátku</button></section>`;
}
function checkIrregularForms() {
  const practice = state.irregularFormsPractice, verb = getCurrentIrregularFormVerb();
  if (!practice || !verb || practice.checked) return;
  const baseCorrect = formAnswerMatches(practice.answers.base, verb.base);
  const pastCorrect = formAnswerMatches(practice.answers.past, verb.past);
  const participleCorrect = formAnswerMatches(practice.answers.participle, verb.participle);
  const allCorrect = baseCorrect && pastCorrect && participleCorrect;
  practice.checked = true; practice.result = { baseCorrect, pastCorrect, participleCorrect, allCorrect };
  if (allCorrect) practice.correctCount += 1; else practice.wrongCount += 1;
  render();
}
function nextIrregularForm() {
  const practice = state.irregularFormsPractice;
  if (!practice) return;
  if (practice.index >= practice.queue.length - 1) { navigate("home"); return; }
  practice.index += 1; practice.checked = false; practice.result = null; practice.activeField = "base"; practice.answers = { base: "", past: "", participle: "" }; practice.letters = [];
  render();
}
function restartIrregularForms() { startIrregularFormsPractice(); }

function parseImport(text) { const lines = String(text || "").split(/\r?\n/); const first = lines.find((line) => line.trim())?.trim().toLowerCase() || ""; return first.startsWith("deck;") ? parseCsvImport(lines) : parseSmartImport(lines); }
function splitCsvLine(line) {
  const cells = []; let cell = ""; let quoted = false;
  for (let i = 0; i < line.length; i += 1) { const char = line[i], next = line[i + 1]; if (char === '"' && quoted && next === '"') { cell += '"'; i += 1; } else if (char === '"') quoted = !quoted; else if (char === ";" && !quoted) { cells.push(cell); cell = ""; } else cell += char; }
  cells.push(cell); return cells.map(normalize);
}
function addImportError(errors, index, text, message) { errors.push({ line: index + 1, text, message }); }
function parseCsvImport(lines) {
  const words = [], errors = [], now = new Date().toISOString(); const headers = splitCsvLine(lines[0]).map((header) => header.toLowerCase());
  lines.slice(1).forEach((line, offset) => {
    if (!line.trim()) return; const columns = splitCsvLine(line); const value = (name, fallbackIndex) => { const headerIndex = headers.indexOf(name); return normalize(columns[headerIndex >= 0 ? headerIndex : fallbackIndex]); };
    const deckValue = value("deck", 0), decks = splitTags(deckValue), deck = decks[0] || deckValue, tags = splitTags(value("tags", 1)), en = value("en", 2), pronounce = value("pronounce", 3), cz = value("cz", 4), example = value("example", 5), note = value("note", 6);
    if (!deck || !en || !cz) { addImportError(errors, offset + 1, line, "Chybí deck, en nebo cz."); return; }
    words.push({ id: createId(), deck, decks: decks.length ? decks : [deck], tags, en, pronounce, cz, example, note, mistakes: 0, correct: 0, createdAt: now });
  });
  return { words, errors };
}
function parseSmartImport(lines) {
  const words = [], errors = [], now = new Date().toISOString(); let currentDeck = `Import ${TODAY_LABEL}`, currentTags = [], lastWord = null;
  lines.forEach((rawLine, index) => {
    const original = rawLine; let line = normalize(rawLine).replace(/^[•*-]\s*/, ""); if (!line || /^slovíčka:?$/i.test(line)) return;
    const deckMatch = line.match(/^deck\s*:\s*(.+)$/i); if (deckMatch) { currentDeck = normalize(deckMatch[1]); lastWord = null; return; }
    const tagsMatch = line.match(/^tags\s*:\s*(.+)$/i); if (tagsMatch) { currentTags = splitTags(tagsMatch[1]); lastWord = null; return; }
    const sentenceMatch = line.match(/^(sentence|věta)\s*:\s*(.+)$/i); if (sentenceMatch) { if (!lastWord) return addImportError(errors, index, original, "Věta nemá slovíčko nad sebou."); lastWord.example = normalize(sentenceMatch[2]); return; }
    const noteMatch = line.match(/^(note|poznámka)\s*:\s*(.+)$/i); if (noteMatch) { if (!lastWord) return addImportError(errors, index, original, "Poznámka nemá slovíčko nad sebou."); lastWord.note = normalize(noteMatch[2]); return; }
    const wordMatch = line.match(/^(.+?)\s*(?:\[([^\]]*)\])?\s*=\s*(.+)$/); if (!wordMatch) { addImportError(errors, index, original, "Řádek není ve formátu slovíčko [výslovnost] = překlad."); return; }
    lastWord = { id: createId(), deck: currentDeck, decks: [currentDeck], tags: currentTags, en: normalize(wordMatch[1]), pronounce: normalize(wordMatch[2] || ""), cz: normalize(wordMatch[3]), example: "", note: "", mistakes: 0, correct: 0, createdAt: now };
    words.push(lastWord);
  });
  return { words, errors };
}
function importWords() { const textarea = document.querySelector("#importText"); state.importText = textarea ? textarea.value : state.importText; const parsed = parseImport(state.importText); const merged = mergeWords(state.words, parsed.words); state.words = merged.words; saveWords(); state.importResult = { added: merged.added, merged: merged.merged, errors: parsed.errors }; if (merged.added || merged.merged) state.importText = ""; render(); }
function renderImport() { const result = state.importResult; return `${header("Import")}<section class="stack"><div class="panel stack"><div><strong>Import na tomto zařízení</strong><p class="muted">Vložená slovíčka se uloží jen tady.</p></div><textarea class="textarea" id="importText" spellcheck="false" placeholder="${escapeHtml(IMPORT_TEMPLATE)}">${escapeHtml(state.importText)}</textarea></div><button class="btn" type="button" data-action="do-import">Importovat</button><button class="btn secondary" type="button" data-action="gpt-prompt">Zobrazit prompt pro GPT</button>${result ? renderImportResult(result) : ""}</section>`; }
function renderImportResult(result) { const errors = result.errors || []; return `<div class="notice ${errors.length ? "danger" : "success"}"><strong>Přidáno: ${result.added} · Sloučeno: ${result.merged}</strong>${errors.length ? `<p>Chybné řádky:</p><ul class="error-list">${errors.map((error) => `<li>Řádek ${error.line}: ${escapeHtml(error.message)} <span class="muted">${escapeHtml(error.text)}</span></li>`).join("")}</ul>` : `<p>Import proběhl v pořádku.</p>`}</div>`; }
function toCsv(words) { const rows = ["deck;tags;en;pronounce;cz;example;note"]; words.forEach((word) => rows.push([getDeckNames(word).join(", "), word.tags.join(", "), word.en, word.pronounce, word.cz, word.example, word.note].map(csvCell).join(";"))); return rows.join("\n"); }
function csvCell(value) { const text = String(value ?? ""); return /[;\n"]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }
function renderExport() { return `${header("Export/Záloha")}<section class="stack"><div class="notice">Tohle je záloha slovíček z tohoto zařízení.</div><textarea class="textarea export-box" id="exportText" readonly>${escapeHtml(toCsv(state.words))}</textarea><button class="btn" type="button" data-action="copy-export">Kopírovat do schránky</button><button class="btn secondary" type="button" data-action="download-export">Stáhnout zálohu</button></section>`; }
async function copyExport() { const text = toCsv(state.words); try { await navigator.clipboard.writeText(text); alert("Záloha je zkopírovaná do schránky."); } catch { const box = document.querySelector("#exportText"); if (box) { box.focus(); box.select(); } alert("Kopírování se nepovedlo. Text je označený."); } }
function downloadExport() { const blob = new Blob([toCsv(state.words)], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `slovicka-zaloha-${new Date().toISOString().slice(0, 10)}.csv`; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url); }
function renderGptPrompt() { return `${header("Prompt pro GPT")}<section class="stack"><div class="notice">Tenhle text vlož do GPT spolu se svými poznámkami.</div><textarea class="textarea prompt-box" id="gptPromptText" readonly>${escapeHtml(GPT_IMPORT_PROMPT)}</textarea><button class="btn" type="button" data-action="copy-gpt-prompt">Kopírovat prompt</button><button class="btn secondary" type="button" data-action="import">Přejít na Import</button></section>`; }
function renderListenPrompt() { return `${header("Prompt pro poslech")}<section class="stack"><div class="notice">Tenhle prompt použij v GPT pro věty k poslechu.</div><textarea class="textarea prompt-box" id="listenPromptText" readonly>${escapeHtml(GPT_LISTEN_PROMPT)}</textarea><button class="btn" type="button" data-action="copy-listen-prompt">Kopírovat prompt</button><button class="btn secondary" type="button" data-action="custom-listen">Přejít na Vlastní poslech</button></section>`; }
function renderProblems() { const words = getProblemWords(); return `${header("Problémová slovíčka")}<section class="stack"><button class="btn" type="button" data-action="practice-problems" ${words.length ? "" : "disabled"}>Procvičovat problémová</button>${words.map(renderWordRow).join("") || `<div class="empty-state">Žádná problémová slovíčka.</div>`}</section>`; }
function renderAudio() { return `${header("Poslech")}<section class="stack"><div class="notice">Dvě poslechové stopy pro past simple. Pokud soubory WAV nemáš, tlačítka jen nebudou mít co přehrát.</div><button class="btn" type="button" data-action="custom-listen">Vlastní poslech z textu</button><article class="audio-card"><h2>Nepravidelná slovesa 1</h2><p class="muted">be až find</p><audio controls preload="metadata" src="audio/nepravidelna-slovesa-1.wav"></audio></article><article class="audio-card"><h2>Nepravidelná slovesa 2</h2><p class="muted">get až write</p><audio controls preload="metadata" src="audio/nepravidelna-slovesa-2.wav"></audio></article></section>`; }
function renderCustomListen() { return `${header("Vlastní poslech")}<section class="stack"><div class="notice">Vlož text z GPT ve formátu EN/CZ. Tady se text zatím ukládá pro použití.</div><textarea class="textarea listen-box" id="customListenText" spellcheck="false">${escapeHtml(state.customListen.text)}</textarea><div class="button-grid"><button class="btn" type="button" data-action="load-custom-listen">Uložit text</button><button class="btn secondary" type="button" data-action="listen-prompt">Prompt pro GPT</button></div></section>`; }
function loadCustomListen() { const textarea = document.querySelector("#customListenText"); state.customListen.text = textarea ? textarea.value : state.customListen.text; saveListenText(state.customListen.text); alert("Text poslechu je uložený."); render(); }
function speak(text) { if (!("speechSynthesis" in window) || !text) return; speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = "en-US"; speechSynthesis.speak(utterance); }
function deleteAll() { if (!confirm("Opravdu smazat všechna uložená slovíčka? Pevná nepravidelná slovesa se znovu připraví při dalším načtení.")) return; state.words = mergeWords([], buildIrregularVerbs()).words; state.practice = null; saveWords(); navigate("home"); }
function deleteWord(id) { if (!confirm("Smazat toto slovíčko?")) return; state.words = state.words.filter((word) => word.id !== id); saveWords(); render(); }
async function copyTextFrom(selector, message) { try { await navigator.clipboard.writeText(document.querySelector(selector).value); alert(message); } catch { document.querySelector(selector)?.select(); alert("Kopírování se nepovedlo. Text je označený."); } }

app.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  const name = target.dataset.name || target.dataset.deck;
  const id = target.dataset.id;

  if (action === "back") goBack();
  if (action === "decks") navigate("decks");
  if (action === "tags") navigate("tags");
  if (action === "import") navigate("import");
  if (action === "gpt-prompt") navigate("gptPrompt");
  if (action === "audio") navigate("audio");
  if (action === "custom-listen") navigate("customListen");
  if (action === "listen-prompt") navigate("listenPrompt");
  if (action === "smart-practice") startSmartPractice();
  if (action === "practice-irregular") startIrregularFormsPractice();
  if (action === "start-irregular-forms") startIrregularFormsPractice();
  if (action === "check-irregular-forms") checkIrregularForms();
  if (action === "next-irregular-form") nextIrregularForm();
  if (action === "restart-irregular-forms") restartIrregularForms();
  if (action === "add-irregular-letter") addIrregularLetter(target.dataset.letter || "");
  if (action === "backspace-irregular-letter") backspaceIrregularLetter();
  if (action === "clear-irregular-field") clearIrregularField();
  if (action === "switch-irregular-field") switchIrregularField(target.dataset.field || "base");
  if (action === "problems") navigate("problems");
  if (action === "export") navigate("export");
  if (action === "delete-all") deleteAll();
  if (action === "do-import") importWords();
  if (action === "load-custom-listen") loadCustomListen();
  if (action === "word-list") navigate("wordList", { type: target.dataset.type || "deck", name });
  if (action === "delete-word") deleteWord(id);
  if (action === "practice-deck") startDeckPractice(name);
  if (action === "practice-deck-short") startDeckPractice(name, SMART_LIMIT);
  if (action === "practice-tag") startTagPractice(name);
  if (action === "practice-tag-short") startTagPractice(name, SMART_LIMIT);
  if (action === "practice-problems") startProblemPractice();
  if (action === "restart-practice") restartPractice();
  if (action === "flip-card") { state.practice.flipped = !state.practice.flipped; render(); }
  if (action === "set-mode") { state.practice.mode = target.dataset.mode; state.practice.flipped = false; render(); }
  if (action === "speak-word") speak(getCurrentPracticeWord()?.en);
  if (action === "speak-example") speak(getCurrentPracticeWord()?.example);
  if (action === "mark-wrong") markCurrent(false);
  if (action === "mark-right") markCurrent(true);
  if (action === "copy-export") copyExport();
  if (action === "copy-gpt-prompt") copyTextFrom("#gptPromptText", "Prompt pro GPT je zkopírovaný.");
  if (action === "copy-listen-prompt") copyTextFrom("#listenPromptText", "Prompt pro poslech je zkopírovaný.");
  if (action === "download-export") downloadExport();
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch((error) => {
      console.warn("Offline režim se nepodařilo připravit.", error);
    });
  });
}

render();
