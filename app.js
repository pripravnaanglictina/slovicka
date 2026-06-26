
"use strict";

const STORAGE_KEY = "vocabTrainerData";
const LISTEN_STORAGE_KEY = "vocabTrainerListenText";
const PRESET_VERSION = 21;
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
const state = { words: loadWords(), view: "home", params: {}, importText: "", importResult: null, practice: null, irregularFormsPractice: null, customListen: { text: loadListenText() } };

function createId(){ return window.crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`; }
function normalize(v){ return String(v ?? "").trim(); }
function escapeHtml(v){ return String(v ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
function uniqueList(values){ const seen=new Set(); return values.map(normalize).filter(Boolean).filter(v=>{const k=v.toLocaleLowerCase("cs-CZ"); if(seen.has(k)) return false; seen.add(k); return true;}); }
function splitTags(v){ return Array.isArray(v) ? v : String(v||"").split(",").map(normalize).filter(Boolean); }
function shuffle(items){ const copy=[...items]; for(let i=copy.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [copy[i],copy[j]]=[copy[j],copy[i]]; } return copy; }

function makeIrregularWord(en, pronounce, cz, example, note, tags){ return { id:createId(), deck:"Nepravidelná slovesa", decks:["Nepravidelná slovesa"], tags, en, pronounce, cz, example, note, mistakes:0, correct:0, seenCount:0, streak:0, lastPracticedAt:"", lastWrongAt:"", createdAt:new Date().toISOString() }; }
function buildIrregularVerbs(){ const words=[]; IRREGULAR_VERBS.forEach(([base,basePr,past,pastPr,cz,baseEx,pastEx,part])=>{ words.push(makeIrregularWord(base,basePr,cz,baseEx,`past simple: ${past}, past participle: ${part}`,["slovesa","infinitiv"])); words.push(makeIrregularWord(past,pastPr,`${cz} - minulý čas`,pastEx,`past simple od slovesa ${base}; past participle: ${part}`,["slovesa","past simple"])); }); return words; }
function normalizeWords(words){ return words.map(w=>{ const deck=normalize(w.deck || w.decks?.[0] || "Bez lekce"); const decks=uniqueList([...(Array.isArray(w.decks)?w.decks:[]),deck]); return { id:w.id||createId(), deck, decks, tags:uniqueList(Array.isArray(w.tags)?w.tags:splitTags(w.tags)), en:normalize(w.en), pronounce:normalize(w.pronounce), cz:normalize(w.cz), example:normalize(w.example), note:normalize(w.note), mistakes:Number(w.mistakes||0), correct:Number(w.correct||0), seenCount:Number(w.seenCount||0), streak:Number(w.streak||0), lastPracticedAt:w.lastPracticedAt||"", lastWrongAt:w.lastWrongAt||"", createdAt:w.createdAt||new Date().toISOString() }; }).filter(w=>w.en&&w.cz); }
function identityKey(w){ return `${w.en.toLocaleLowerCase("en-US")}::${w.cz.toLocaleLowerCase("cs-CZ")}`; }
function mergeWords(existing,incoming){ const words=normalizeWords(existing); const index=new Map(words.map(w=>[identityKey(w),w])); let added=0,merged=0; normalizeWords(incoming).forEach(i=>{ const cur=index.get(identityKey(i)); if(!cur){ words.push(i); index.set(identityKey(i),i); added++; return; } cur.decks=uniqueList([...cur.decks,...i.decks]); cur.deck=cur.decks[0]; cur.tags=uniqueList([...cur.tags,...i.tags]); cur.pronounce=cur.pronounce||i.pronounce; cur.example=cur.example||i.example; cur.note=uniqueList([cur.note,i.note]).join(" | "); merged++; }); return {words,added,merged}; }
function loadWords(){ let words=[], presetVersion=0; try{ const saved=localStorage.getItem(STORAGE_KEY); if(saved){ const p=JSON.parse(saved); words=Array.isArray(p.words)?p.words:[]; presetVersion=Number(p.presetVersion||0); } }catch(e){ console.warn("Uložená data se nepodařilo načíst.",e); } words=normalizeWords(words); if(presetVersion<PRESET_VERSION) words=mergeWords(words,buildIrregularVerbs()).words; saveWords(words); return words; }
function saveWords(words=state.words){ localStorage.setItem(STORAGE_KEY, JSON.stringify({presetVersion:PRESET_VERSION, words:normalizeWords(words)})); }
function loadListenText(){ try{return localStorage.getItem(LISTEN_STORAGE_KEY)||LISTEN_TEMPLATE;}catch{return LISTEN_TEMPLATE;} }
function saveListenText(text){ try{localStorage.setItem(LISTEN_STORAGE_KEY,text);}catch{} }

function getDeckNames(w){ return uniqueList(Array.isArray(w.decks)&&w.decks.length?w.decks:[w.deck]); }
function getDecks(words=state.words){ const m=new Map(); words.forEach(w=>getDeckNames(w).forEach(n=>{ if(!m.has(n))m.set(n,{name:n,count:0,problemCount:0}); const d=m.get(n); d.count++; if(w.mistakes>0)d.problemCount++; })); return [...m.values()].sort((a,b)=>a.name.localeCompare(b.name,"cs")); }
function getTags(words=state.words){ const m=new Map(); words.forEach(w=>w.tags.forEach(n=>{ if(!m.has(n))m.set(n,{name:n,count:0,problemCount:0}); const t=m.get(n); t.count++; if(w.mistakes>0)t.problemCount++; })); return [...m.values()].sort((a,b)=>a.name.localeCompare(b.name,"cs")); }
function getWordsForDeck(deck){ return state.words.filter(w=>getDeckNames(w).includes(deck)); }
function getWordsForTag(tag){ return state.words.filter(w=>w.tags.includes(tag)); }
function getProblemWords(){ return state.words.filter(w=>Number(w.mistakes)>0).sort((a,b)=>b.mistakes-a.mistakes||a.en.localeCompare(b.en)); }
function daysSince(iso){ if(!iso)return 999; const t=new Date(iso).getTime(); if(Number.isNaN(t))return 999; return Math.max(0,Math.floor((Date.now()-t)/86400000)); }
function smartScore(w){ let s=0; if(!w.seenCount)s+=120; s+=w.mistakes*14; s-=w.correct*2; s-=w.streak*8; s+=Math.min(daysSince(w.lastPracticedAt||w.createdAt),30); if(w.lastWrongAt)s+=Math.max(0,18-daysSince(w.lastWrongAt)); return s; }
function selectSmartWords(words,limit=SMART_LIMIT){ return [...words].sort((a,b)=>smartScore(b)-smartScore(a)||a.en.localeCompare(b.en,"en")).slice(0,limit); }

function navigate(view,params={}){ state.view=view; state.params=params; state.importResult=view==="import"?state.importResult:null; render(); }
function goBack(){ if(state.view==="home")return; if(state.view==="irregularForms")return navigate("home"); if(state.view==="wordList")return navigate(state.params.type==="tag"?"tags":"decks"); if(state.view==="practice")return navigate("home"); if(state.view==="listenPrompt")return navigate("customListen"); navigate("home"); }
function header(title,back=true){ return `<div class="topbar">${back?`<button class="back-button" type="button" data-action="back" aria-label="Zpět">‹</button>`:""}<h1>${escapeHtml(title)}</h1></div>`; }
function render(){ const views={home:renderHome,decks:renderDecks,tags:renderTags,import:renderImport,wordList:renderWordList,practice:renderPractice,problems:renderProblems,export:renderExport,audio:renderAudio,gptPrompt:renderGptPrompt,customListen:renderCustomListen,listenPrompt:renderListenPrompt,irregularForms:renderIrregularForms}; app.innerHTML=(views[state.view]||renderHome)(); }

function renderHome(){ const all=state.words.length, decks=getDecks().length, tags=getTags().length, problems=getProblemWords().length; return `${header("Moje slovíčka",false)}<section class="stack"><div class="stats-grid" aria-label="Souhrn slovíček"><div class="stat"><strong>${all}</strong><span>slovíček</span></div><div class="stat"><strong>${decks}</strong><span>lekcí</span></div><div class="stat"><strong>${tags}</strong><span>štítků</span></div><div class="stat"><strong>${problems}</strong><span>problémových</span></div></div><div class="notice">Výchozí aplikace obsahuje nepravidelná slovesa. Ostatní lekce si můžeš přidávat importem.</div><div class="button-grid"><button class="btn wide" type="button" data-action="smart-practice">Chytrý trénink</button><button class="btn wide" type="button" data-action="practice-irregular">Nepravidelná slovesa</button><button class="btn" type="button" data-action="decks">Lekce</button><button class="btn secondary" type="button" data-action="tags">Štítky</button><button class="btn secondary" type="button" data-action="import">Import</button><button class="btn secondary" type="button" data-action="gpt-prompt">Prompt pro GPT</button><button class="btn secondary" type="button" data-action="audio">Poslech</button><button class="btn secondary" type="button" data-action="custom-listen">Vlastní poslech</button><button class="btn secondary" type="button" data-action="problems">Problémová slovíčka</button><button class="btn secondary" type="button" data-action="export">Export/Záloha</button><button class="btn danger wide" type="button" data-action="delete-all">Smazat všechna data</button></div></section>`; }
function renderDecks(){ const decks=getDecks(); return `${header("Lekce")}<section class="stack">${decks.length?decks.map(d=>renderCollectionRow(d,"deck")).join(""):`<div class="empty-state">Zatím tu nejsou žádné lekce.</div>`}</section>`; }
function renderTags(){ const tags=getTags(); return `${header("Štítky")}<section class="stack">${tags.length?tags.map(t=>renderCollectionRow(t,"tag")).join(""):`<div class="empty-state">Zatím tu nejsou žádné štítky.</div>`}</section>`; }
function renderCollectionRow(item,type){ const p=type==="tag"?"tag":"deck"; return `<article class="deck-row"><div><h2>${escapeHtml(item.name)}</h2><div class="row-meta"><span class="pill">${item.count} slovíček</span><span class="pill">${item.problemCount} problémových</span></div></div><div class="row-actions"><button class="btn" type="button" data-action="practice-${p}-short" data-name="${escapeHtml(item.name)}">Krátký trénink</button><button class="btn secondary" type="button" data-action="practice-${p}" data-name="${escapeHtml(item.name)}">Všechna</button><button class="btn secondary" type="button" data-action="word-list" data-type="${type}" data-name="${escapeHtml(item.name)}">Seznam</button></div></article>`; }
function renderWordList(){ const name=state.params.name, type=state.params.type||"deck", words=type==="tag"?getWordsForTag(name):getWordsForDeck(name); return `${header(name||"Seznam")}<section class="stack">${words.map(renderWordRow).join("")||`<div class="empty-state">Tady zatím nejsou žádná slovíčka.</div>`}</section>`; }
function renderWordRow(w){ return `<article class="word-row"><div><h2>${escapeHtml(w.en)}</h2><p><strong>${escapeHtml(w.cz)}</strong> ${w.pronounce?`<span class="muted">[${escapeHtml(w.pronounce)}]</span>`:""}</p>${w.example?`<p class="muted">${escapeHtml(w.example)}</p>`:""}${w.note?`<p class="muted">${escapeHtml(w.note)}</p>`:""}<div class="row-meta">${getDeckNames(w).map(d=>`<span class="pill">Lekce: ${escapeHtml(d)}</span>`).join("")}${w.tags.map(t=>`<span class="pill">#${escapeHtml(t)}</span>`).join("")}<span class="pill">${w.mistakes} chyb</span><span class="pill">${w.correct} správně</span></div></div><button class="btn danger" type="button" data-action="delete-word" data-id="${escapeHtml(w.id)}">Smazat slovíčko</button></article>`; }

function createPractice(words,label,source,mode="en-cz",restart={}){ return {label,source,mode,queue:shuffle(words.map(w=>w.id)),total:words.length,roundMistakes:0,flipped:false,done:false,restart}; }
function getCurrentPracticeWord(){ return state.words.find(w=>w.id===state.practice?.queue[0]); }
function startPractice(words,label,source,restart){ if(!words.length){alert("Tady zatím nejsou žádná slovíčka k procvičování."); return;} state.practice=createPractice(words,label,source,state.practice?.mode||"en-cz",restart); navigate("practice"); }
function startSmartPractice(){ const words=selectSmartWords(state.words,SMART_LIMIT); startPractice(words,`Chytrý trénink (${words.length})`,"smart",{type:"smart"}); }
function startDeckPractice(deck,limit=null){ const all=getWordsForDeck(deck), words=limit?selectSmartWords(all,limit):all; startPractice(words,limit?`${deck} · ${words.length} slovíček`:deck,limit?"deck-short":"deck",{type:"deck",name:deck,limit}); }
function startTagPractice(tag,limit=null){ const all=getWordsForTag(tag), words=limit?selectSmartWords(all,limit):all; startPractice(words,limit?`#${tag} · ${words.length} slovíček`:tag,limit?"tag-short":"tag",{type:"tag",name:tag,limit}); }
function startProblemPractice(){ startPractice(getProblemWords(),"Problémová slovíčka","problems",{type:"problems"}); }
function restartPractice(){ const r=state.practice?.restart||{}; if(r.type==="smart")return startSmartPractice(); if(r.type==="tag")return startTagPractice(r.name,r.limit||null); if(r.type==="problems")return startProblemPractice(); if(r.type==="deck")return startDeckPractice(r.name,r.limit||null); startSmartPractice(); }
function renderPractice(){ const p=state.practice; if(!p)return `${header("Procvičování")}<div class="empty-state">Procvičování není spuštěné.</div>`; if(p.done)return `${header("Hotovo")}<section class="stack"><div class="summary-card"><h2>Hotovo</h2><p>Procvičeno slovíček: <strong>${p.total}</strong></p><p>Chyb v tomto kole: <strong>${p.roundMistakes}</strong></p></div><button class="btn" type="button" data-action="restart-practice">Spustit znovu</button></section>`; const w=getCurrentPracticeWord(); if(!w)return `${header("Procvičování")}<div class="empty-state">Slovíčko se nepodařilo najít.</div>`; const rev=p.mode==="cz-en", front=rev?w.cz:w.en, back=rev?w.en:w.cz, sub=rev?(w.pronounce?`[${w.pronounce}]`:""):w.example; return `${header(p.label)}<section class="practice-head"><div class="progress-line"><span>Zbývá ${p.queue.length} z ${p.total}</span><span>Chyby v kole: ${p.roundMistakes}</span></div><div class="mode-toggle"><button type="button" class="${p.mode==="en-cz"?"active":""}" data-action="set-mode" data-mode="en-cz">EN → CZ</button><button type="button" class="${p.mode==="cz-en"?"active":""}" data-action="set-mode" data-mode="cz-en">CZ → EN</button></div></section><button class="flashcard" type="button" data-action="flip-card"><p class="card-main">${escapeHtml(p.flipped?back:front)}</p>${p.flipped&&sub?`<p class="card-sub">${escapeHtml(sub)}</p>`:""}${p.flipped&&w.note?`<p class="card-detail">${escapeHtml(w.note)}</p>`:""}</button><div class="practice-actions"><button class="btn secondary" type="button" data-action="speak-word">🔊 Slovo</button><button class="btn secondary" type="button" data-action="speak-example" ${w.example?"":"disabled"}>🔊 Věta</button><button class="btn danger" type="button" data-action="mark-wrong">❌ Neumím</button><button class="btn success" type="button" data-action="mark-right">✅ Umím</button></div>`; }
function markCurrent(ok){ const p=state.practice,w=getCurrentPracticeWord(); if(!p||!w)return; const now=new Date().toISOString(); w.seenCount++; w.lastPracticedAt=now; if(ok){w.correct++; w.streak++; p.queue.shift();}else{w.mistakes++; w.streak=0; w.lastWrongAt=now; p.roundMistakes++; p.queue.push(p.queue.shift());} p.flipped=false; p.done=p.queue.length===0; saveWords(); render(); }

function cleanFormAnswer(v){ return normalize(v).toLocaleLowerCase("en-US").replace(/[^a-z]/g,""); }
function formAnswerMatches(user,correct){ return cleanFormAnswer(user)===cleanFormAnswer(correct); }
function startIrregularFormsPractice(){ state.irregularFormsPractice={queue:shuffle(IRREGULAR_VERBS.map(v=>({base:v[0],past:v[2],cz:v[4],participle:v[7]}))),index:0,checked:false,result:null,correctCount:0,wrongCount:0,activeField:"base",answers:{base:"",past:"",participle:""},letters:[]}; navigate("irregularForms"); }
function getCurrentIrregularFormVerb(){ const p=state.irregularFormsPractice; return !p||!p.queue.length?null:p.queue[p.index]; }
function createLetterButtonsForVerb(verb){ const answer=cleanFormAnswer(`${verb.base}${verb.past}${verb.participle}`).split(""); const alphabet="abcdefghijklmnopqrstuvwxyz".split(""); const extras=shuffle(alphabet).slice(0,7); return shuffle([...answer,...extras]); }
function getIrregularLetters(){ const p=state.irregularFormsPractice, v=getCurrentIrregularFormVerb(); if(!p||!v)return []; if(!p.letters||!p.letters.length)p.letters=createLetterButtonsForVerb(v); return p.letters; }
function getActiveIrregularField(){ return state.irregularFormsPractice?.activeField||"base"; }
function setActiveIrregularField(field){ const p=state.irregularFormsPractice; if(!p||p.checked)return; if(!["base","past","participle"].includes(field))return; p.activeField=field; }
function addIrregularLetter(letter){ const p=state.irregularFormsPractice, v=getCurrentIrregularFormVerb(); if(!p||!v||p.checked)return; const field=getActiveIrregularField(); const correctMap={base:v.base,past:v.past,participle:v.participle}; const maxLen=cleanFormAnswer(correctMap[field]).length; const current=cleanFormAnswer(p.answers[field]||""); if(current.length>=maxLen)return; p.answers[field]=`${p.answers[field]||""}${letter}`; const newLen=cleanFormAnswer(p.answers[field]).length; if(newLen>=maxLen){ if(field==="base")p.activeField="past"; else if(field==="past")p.activeField="participle"; } render(); }
function backspaceIrregularLetter(){ const p=state.irregularFormsPractice; if(!p||p.checked)return; const field=getActiveIrregularField(); p.answers[field]=String(p.answers[field]||"").slice(0,-1); render(); }
function clearIrregularField(){ const p=state.irregularFormsPractice; if(!p||p.checked)return; const field=getActiveIrregularField(); p.answers[field]=""; render(); }
function switchIrregularField(field){ setActiveIrregularField(field); render(); }
function renderIrregularForms(){ const p=state.irregularFormsPractice,v=getCurrentIrregularFormVerb(); if(!p||!v)return `${header("Nepravidelná slovesa")}<section class="stack"><div class="empty-state">Trénink není spuštěný.</div><button class="btn" type="button" data-action="start-irregular-forms">Spustit trénink</button></section>`; const result=p.result, finished=p.index>=p.queue.length-1, active=getActiveIrregularField(), letters=getIrregularLetters(); const answerResult=(ok,text)=>!result?"":`<div class="answer-result ${ok?"answer-ok":"answer-bad"}">${ok?"OK":"Špatně"}: ${escapeHtml(text)}</div>`; const slotLine=(field,label,correctText)=>{ const len=cleanFormAnswer(correctText).length; const val=cleanFormAnswer(p.answers[field]||"").toUpperCase().split(""); return `<button class="slot-row ${active===field?"active-slot":""}" type="button" data-action="switch-irregular-field" data-field="${field}" ${p.checked?"disabled":""}><span class="slot-label">${label}</span><span class="slot-boxes">${Array.from({length:len}).map((_,i)=>`<span class="slot-box">${escapeHtml(val[i]||"")}</span>`).join("")}</span></button>`; }; return `${header("Nepravidelná slovesa")}<section class="game-screen"><div class="game-top"><div class="game-stat">✅ ${p.correctCount}</div><div class="game-stat big">${p.index+1}</div><div class="game-stat">❌ ${p.wrongCount}</div></div><div class="game-progress"><div class="game-progress-fill" style="width:${Math.round(((p.index+1)/p.queue.length)*100)}%"></div></div><div class="game-question"><p>Všechny tři tvary slovesa:</p><h2>${escapeHtml(v.cz)}</h2></div><div class="slot-area">${slotLine("base","Infinitiv",v.base)}<div class="slot-separator">-</div>${slotLine("past","Past simple",v.past)}<div class="slot-separator">-</div>${slotLine("participle","Past participle",v.participle)}</div>${result?`<div class="notice ${result.allCorrect?"success":"danger"}"><strong>${result.allCorrect?"Správně ✅":"Něco je špatně ❌"}</strong><p>Správné tvary: <strong>${escapeHtml(v.base)}</strong> — <strong>${escapeHtml(v.past)}</strong> — <strong>${escapeHtml(v.participle)}</strong></p>${answerResult(result.baseCorrect,v.base)}${answerResult(result.pastCorrect,v.past)}${answerResult(result.participleCorrect,v.participle)}</div>`:""}<div class="game-letters" aria-label="Písmena pro odpověď">${letters.map(l=>`<button class="game-letter" type="button" data-action="add-irregular-letter" data-letter="${escapeHtml(l)}" ${p.checked?"disabled":""}>${escapeHtml(l.toUpperCase())}</button>`).join("")}</div><div class="game-actions"><button class="btn secondary" type="button" data-action="backspace-irregular-letter" ${p.checked?"disabled":""}>⌫</button><button class="btn secondary" type="button" data-action="clear-irregular-field" ${p.checked?"disabled":""}>Vymazat</button><button class="btn success" type="button" data-action="check-irregular-forms" ${p.checked?"disabled":""}>Zkontrolovat</button><button class="btn secondary" type="button" data-action="next-irregular-form" ${p.checked?"":"disabled"}>${finished?"Dokončit":"Další"}</button></div><button class="btn danger" type="button" data-action="restart-irregular-forms">Od začátku</button></section>`; }
function checkIrregularForms(){ const p=state.irregularFormsPractice,v=getCurrentIrregularFormVerb(); if(!p||!v||p.checked)return; const baseCorrect=formAnswerMatches(p.answers.base,v.base); const pastCorrect=formAnswerMatches(p.answers.past,v.past); const participleCorrect=formAnswerMatches(p.answers.participle,v.participle); const allCorrect=baseCorrect&&pastCorrect&&participleCorrect; p.checked=true; p.result={baseCorrect,pastCorrect,participleCorrect,allCorrect}; if(allCorrect)p.correctCount++; else p.wrongCount++; render(); }
function nextIrregularForm(){ const p=state.irregularFormsPractice; if(!p)return; if(p.index>=p.queue.length-1){navigate("home");return;} p.index++; p.checked=false; p.result=null; p.activeField="base"; p.answers={base:"",past:"",participle:""}; p.letters=[]; render(); }
function restartIrregularForms(){ startIrregularFormsPractice(); }

function parseImport(text){ const lines=String(text||"").split(/\r?\n/); const first=lines.find(l=>l.trim())?.trim().toLowerCase()||""; return first.startsWith("deck;")?parseCsvImport(lines):parseSmartImport(lines); }
function splitCsvLine(line){ const cells=[]; let cell="",q=false; for(let i=0;i<line.length;i++){ const ch=line[i],next=line[i+1]; if(ch==='"'&&q&&next==='"'){cell+='"'; i++;} else if(ch==='"')q=!q; else if(ch===';'&&!q){cells.push(cell); cell="";} else cell+=ch; } cells.push(cell); return cells.map(normalize); }
function addImportError(errors,index,text,message){ errors.push({line:index+1,text,message}); }
function parseCsvImport(lines){ const words=[],errors=[],now=new Date().toISOString(),headers=splitCsvLine(lines[0]).map(h=>h.toLowerCase()); lines.slice(1).forEach((line,offset)=>{ if(!line.trim())return; const c=splitCsvLine(line); const value=(name,fallback)=>{ const hi=headers.indexOf(name); return normalize(c[hi>=0?hi:fallback]); }; const deckValue=value("deck",0), decks=splitTags(deckValue), deck=decks[0]||deckValue, tags=splitTags(value("tags",1)), en=value("en",2), pronounce=value("pronounce",3), cz=value("cz",4), example=value("example",5), note=value("note",6); if(!deck||!en||!cz){ addImportError(errors,offset+1,line,"Chybí deck, en nebo cz."); return; } words.push({id:createId(),deck,decks:decks.length?decks:[deck],tags,en,pronounce,cz,example,note,mistakes:0,correct:0,createdAt:now}); }); return {words,errors}; }
function parseSmartImport(lines){ const words=[],errors=[],now=new Date().toISOString(); let currentDeck=`Import ${TODAY_LABEL}`, currentTags=[], last=null; lines.forEach((raw,index)=>{ const original=raw; let line=normalize(raw).replace(/^[•*-]\s*/,""); if(!line||/^slovíčka:?$/i.test(line))return; const dm=line.match(/^deck\s*:\s*(.+)$/i); if(dm){currentDeck=normalize(dm[1]); last=null; return;} const tm=line.match(/^tags\s*:\s*(.+)$/i); if(tm){currentTags=splitTags(tm[1]); last=null; return;} const sm=line.match(/^(sentence|věta)\s*:\s*(.+)$/i); if(sm){ if(!last)return addImportError(errors,index,original,"Věta nemá slovíčko nad sebou."); last.example=normalize(sm[2]); return;} const nm=line.match(/^(note|poznámka)\s*:\s*(.+)$/i); if(nm){ if(!last)return addImportError(errors,index,original,"Poznámka nemá slovíčko nad sebou."); last.note=normalize(nm[2]); return;} const wm=line.match(/^(.+?)\s*(?:\[([^\]]*)\])?\s*=\s*(.+)$/); if(!wm){addImportError(errors,index,original,"Řádek není ve formátu slovíčko [výslovnost] = překlad."); return;} last={id:createId(),deck:currentDeck,decks:[currentDeck],tags:currentTags,en:normalize(wm[1]),pronounce:normalize(wm[2]||""),cz:normalize(wm[3]),example:"",note:"",mistakes:0,correct:0,createdAt:now}; words.push(last); }); return {words,errors}; }
function importWords(){ const textarea=document.querySelector("#importText"); state.importText=textarea?textarea.value:state.importText; const parsed=parseImport(state.importText); const merged=mergeWords(state.words,parsed.words); state.words=merged.words; saveWords(); state.importResult={added:merged.added,merged:merged.merged,errors:parsed.errors}; if(merged.added||merged.merged)state.importText=""; render(); }
function renderImport(){ const r=state.importResult; return `${header("Import")}<section class="stack"><div class="panel stack"><div><strong>Import na tomto zařízení</strong><p class="muted">Vložená slovíčka se uloží jen tady.</p></div><textarea class="textarea" id="importText" spellcheck="false" placeholder="${escapeHtml(IMPORT_TEMPLATE)}">${escapeHtml(state.importText)}</textarea></div><button class="btn" type="button" data-action="do-import">Importovat</button><button class="btn secondary" type="button" data-action="gpt-prompt">Zobrazit prompt pro GPT</button>${r?renderImportResult(r):""}</section>`; }
function renderImportResult(r){ const e=r.errors||[]; return `<div class="notice ${e.length?"danger":"success"}"><strong>Přidáno: ${r.added} · Sloučeno: ${r.merged}</strong>${e.length?`<p>Chybné řádky:</p><ul class="error-list">${e.map(x=>`<li>Řádek ${x.line}: ${escapeHtml(x.message)} <span class="muted">${escapeHtml(x.text)}</span></li>`).join("")}</ul>`:`<p>Import proběhl v pořádku.</p>`}</div>`; }
function toCsv(words){ const rows=["deck;tags;en;pronounce;cz;example;note"]; words.forEach(w=>rows.push([getDeckNames(w).join(", "),w.tags.join(", "),w.en,w.pronounce,w.cz,w.example,w.note].map(csvCell).join(";"))); return rows.join("\n"); }
function csvCell(v){ const t=String(v??""); return /[;\n"]/.test(t)?`"${t.replaceAll('"','""')}"`:t; }
function renderExport(){ return `${header("Export/Záloha")}<section class="stack"><div class="notice">Tohle je záloha slovíček z tohoto zařízení.</div><textarea class="textarea export-box" id="exportText" readonly>${escapeHtml(toCsv(state.words))}</textarea><button class="btn" type="button" data-action="copy-export">Kopírovat do schránky</button><button class="btn secondary" type="button" data-action="download-export">Stáhnout zálohu</button></section>`; }
async function copyExport(){ const text=toCsv(state.words); try{await navigator.clipboard.writeText(text); alert("Záloha je zkopírovaná do schránky.");}catch{ const box=document.querySelector("#exportText"); if(box){box.focus(); box.select();} alert("Kopírování se nepovedlo. Text je označený.");} }
function downloadExport(){ const blob=new Blob([toCsv(state.words)],{type:"text/csv;charset=utf-8"}); const url=URL.createObjectURL(blob); const link=document.createElement("a"); link.href=url; link.download=`slovicka-zaloha-${new Date().toISOString().slice(0,10)}.csv`; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url); }
function renderGptPrompt(){ return `${header("Prompt pro GPT")}<section class="stack"><div class="notice">Tenhle text vlož do GPT spolu se svými poznámkami.</div><textarea class="textarea prompt-box" id="gptPromptText" readonly>${escapeHtml(GPT_IMPORT_PROMPT)}</textarea><button class="btn" type="button" data-action="copy-gpt-prompt">Kopírovat prompt</button><button class="btn secondary" type="button" data-action="import">Přejít na Import</button></section>`; }
function renderListenPrompt(){ return `${header("Prompt pro poslech")}<section class="stack"><div class="notice">Tenhle prompt použij v GPT pro věty k poslechu.</div><textarea class="textarea prompt-box" id="listenPromptText" readonly>${escapeHtml(GPT_LISTEN_PROMPT)}</textarea><button class="btn" type="button" data-action="copy-listen-prompt">Kopírovat prompt</button><button class="btn secondary" type="button" data-action="custom-listen">Přejít na Vlastní poslech</button></section>`; }
function renderProblems(){ const words=getProblemWords(); return `${header("Problémová slovíčka")}<section class="stack"><button class="btn" type="button" data-action="practice-problems" ${words.length?"":"disabled"}>Procvičovat problémová</button>${words.map(renderWordRow).join("")||`<div class="empty-state">Žádná problémová slovíčka.</div>`}</section>`; }
function renderAudio(){ return `${header("Poslech")}<section class="stack"><div class="notice">Dvě poslechové stopy pro past simple. Pokud soubory WAV nemáš, tlačítka jen nebudou mít co přehrát.</div><button class="btn" type="button" data-action="custom-listen">Vlastní poslech z textu</button><article class="audio-card"><h2>Nepravidelná slovesa 1</h2><p class="muted">be až find</p><audio controls preload="metadata" src="audio/nepravidelna-slovesa-1.wav"></audio></article><article class="audio-card"><h2>Nepravidelná slovesa 2</h2><p class="muted">get až write</p><audio controls preload="metadata" src="audio/nepravidelna-slovesa-2.wav"></audio></article></section>`; }
function renderCustomListen(){ return `${header("Vlastní poslech")}<section class="stack"><div class="notice">Vlož text z GPT ve formátu EN/CZ. Tady se text zatím ukládá pro použití.</div><textarea class="textarea listen-box" id="customListenText" spellcheck="false">${escapeHtml(state.customListen.text)}</textarea><div class="button-grid"><button class="btn" type="button" data-action="load-custom-listen">Uložit text</button><button class="btn secondary" type="button" data-action="listen-prompt">Prompt pro GPT</button></div></section>`; }
function loadCustomListen(){ const textarea=document.querySelector("#customListenText"); state.customListen.text=textarea?textarea.value:state.customListen.text; saveListenText(state.customListen.text); alert("Text poslechu je uložený."); render(); }
function speak(text){ if(!("speechSynthesis" in window)||!text)return; speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.lang="en-US"; speechSynthesis.speak(u); }
function deleteAll(){ if(!confirm("Opravdu smazat všechna uložená slovíčka? Pevná nepravidelná slovesa se znovu připraví při dalším načtení."))return; state.words=mergeWords([],buildIrregularVerbs()).words; state.practice=null; saveWords(); navigate("home"); }
function deleteWord(id){ if(!confirm("Smazat toto slovíčko?"))return; state.words=state.words.filter(w=>w.id!==id); saveWords(); render(); }
async function copyTextFrom(selector,message){ try{await navigator.clipboard.writeText(document.querySelector(selector).value); alert(message);}catch{document.querySelector(selector)?.select(); alert("Kopírování se nepovedlo. Text je označený.");} }

app.addEventListener("click",event=>{ const target=event.target.closest("[data-action]"); if(!target)return; const action=target.dataset.action, name=target.dataset.name||target.dataset.deck, id=target.dataset.id; if(action==="back")goBack(); if(action==="decks")navigate("decks"); if(action==="tags")navigate("tags"); if(action==="import")navigate("import"); if(action==="gpt-prompt")navigate("gptPrompt"); if(action==="audio")navigate("audio"); if(action==="custom-listen")navigate("customListen"); if(action==="listen-prompt")navigate("listenPrompt"); if(action==="smart-practice")startSmartPractice(); if(action==="practice-irregular")startIrregularFormsPractice(); if(action==="start-irregular-forms")startIrregularFormsPractice(); if(action==="check-irregular-forms")checkIrregularForms(); if(action==="next-irregular-form")nextIrregularForm(); if(action==="restart-irregular-forms")restartIrregularForms(); if(action==="add-irregular-letter")addIrregularLetter(target.dataset.letter||""); if(action==="backspace-irregular-letter")backspaceIrregularLetter(); if(action==="clear-irregular-field")clearIrregularField(); if(action==="switch-irregular-field")switchIrregularField(target.dataset.field||"base"); if(action==="problems")navigate("problems"); if(action==="export")navigate("export"); if(action==="delete-all")deleteAll(); if(action==="do-import")importWords(); if(action==="load-custom-listen")loadCustomListen(); if(action==="word-list")navigate("wordList",{type:target.dataset.type||"deck",name}); if(action==="delete-word")deleteWord(id); if(action==="practice-deck")startDeckPractice(name); if(action==="practice-deck-short")startDeckPractice(name,SMART_LIMIT); if(action==="practice-tag")startTagPractice(name); if(action==="practice-tag-short")startTagPractice(name,SMART_LIMIT); if(action==="practice-problems")startProblemPractice(); if(action==="restart-practice")restartPractice(); if(action==="flip-card"){state.practice.flipped=!state.practice.flipped; render();} if(action==="set-mode"){state.practice.mode=target.dataset.mode; state.practice.flipped=false; render();} if(action==="speak-word")speak(getCurrentPracticeWord()?.en); if(action==="speak-example")speak(getCurrentPracticeWord()?.example); if(action==="mark-wrong")markCurrent(false); if(action==="mark-right")markCurrent(true); if(action==="copy-export")copyExport(); if(action==="copy-gpt-prompt")copyTextFrom("#gptPromptText","Prompt pro GPT je zkopírovaný."); if(action==="copy-listen-prompt")copyTextFrom("#listenPromptText","Prompt pro poslech je zkopírovaný."); if(action==="download-export")downloadExport(); });

if("serviceWorker" in navigator){ window.addEventListener("load",()=>{ navigator.serviceWorker.register("service-worker.js").catch(error=>console.warn("Offline režim se nepodařilo připravit.",error)); }); }
render();
