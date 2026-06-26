"use strict";

const SMART_LIMIT = 20;

const IRREGULAR_VERBS = [
  ["make", "", "made", "", "udělat", "", "", "made"],
  ["go", "", "went", "", "jít", "", "", "gone"],
  ["see", "", "saw", "", "vidět", "", "", "seen"],
  ["take", "", "took", "", "vzít", "", "", "taken"],
  ["write", "", "wrote", "", "psát", "", "", "written"],
];

const app = document.querySelector("#app");

const state = {
  view: "home",
  irregularFormsPractice: null,
};

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function cleanFormAnswer(v) {
  return String(v).toLowerCase().replace(/[^a-z]/g, "");
}

// ✅ FIXED kontrola
function formAnswerMatches(user, correct) {
  const u = cleanFormAnswer(user);
  const c = cleanFormAnswer(correct);
  return u === c;
}

function startIrregularFormsPractice() {
  state.irregularFormsPractice = {
    queue: shuffle(
      IRREGULAR_VERBS.map((v) => ({
        base: v[0],
        past: v[2],
        cz: v[4],
        participle: v[7],
      }))
    ),
    index: 0,
    checked: false,
    result: null,
    correctCount: 0,
    wrongCount: 0,
    activeField: "base",
    answers: { base: "", past: "", participle: "" },
    letters: [],
  };
  render();
}

function getCurrentVerb() {
  return state.irregularFormsPractice.queue[state.irregularFormsPractice.index];
}

// ✅ FIXED – nedovolí zadat víc písmen než je potřeba
function addLetter(letter) {
  const p = state.irregularFormsPractice;
  const v = getCurrentVerb();

  const map = {
    base: v.base,
    past: v.past,
    participle: v.participle,
  };

  const maxLen = cleanFormAnswer(map[p.activeField]).length;
  const current = cleanFormAnswer(p.answers[p.activeField]);

  if (current.length >= maxLen) return;

  p.answers[p.activeField] += letter;
  render();
}

function removeLetter() {
  const p = state.irregularFormsPractice;
  p.answers[p.activeField] = p.answers[p.activeField].slice(0, -1);
  render();
}

function clearField() {
  const p = state.irregularFormsPractice;
  p.answers[p.activeField] = "";
  render();
}

function check() {
  const p = state.irregularFormsPractice;
  const v = getCurrentVerb();

  const baseOk = formAnswerMatches(p.answers.base, v.base);
  const pastOk = formAnswerMatches(p.answers.past, v.past);
  const partOk = formAnswerMatches(p.answers.participle, v.participle);

  const ok = baseOk && pastOk && partOk;

  p.result = { ok, baseOk, pastOk, partOk };
  p.checked = true;

  if (ok) p.correctCount++;
  else p.wrongCount++;

  render();
}

function next() {
  const p = state.irregularFormsPractice;

  p.index++;
  p.checked = false;
  p.result = null;
  p.answers = { base: "", past: "", participle: "" };

  render();
}

function createLetters(v) {
  const letters = cleanFormAnswer(v.base + v.past + v.participle).split("");
  const extra = shuffle("abcdefghijklmnopqrstuvwxyz".split("")).slice(0, 6);
  return shuffle([...letters, ...extra]);
}

function render() {
  if (!state.irregularFormsPractice) {
    app.innerHTML = `
      <button onclick="startIrregularFormsPractice()">Nepravidelná slovesa</button>
    `;
    return;
  }

  const p = state.irregularFormsPractice;
  const v = getCurrentVerb();

  if (!p.letters.length) p.letters = createLetters(v);

  function draw(field, correct) {
    const len = cleanFormAnswer(correct).length;
    const val = cleanFormAnswer(p.answers[field]);

    return `
      <div onclick="state.irregularFormsPractice.activeField='${field}';render()"
           style="border:2px solid ${p.activeField===field?"green":"gray"};padding:10px;margin:5px">
        ${Array(len).fill(0).map((_,i)=>
          `<span style="display:inline-block;width:25px">${val[i]||"_"}</span>`
        ).join("")}
      </div>
    `;
  }

  app.innerHTML = `
    <h2>${v.cz}</h2>

    ${draw("base", v.base)}
    ${draw("past", v.past)}
    ${draw("participle", v.participle)}

    <div>
      ${p.letters.map(l =>
        `<button onclick="addLetter('${l}')">${l}</button>`
      ).join("")}
    </div>

    <button onclick="removeLetter()">⌫</button>
    <button onclick="clearField()">C</button>

    <br><br>

    <button onclick="check()">Kontrola</button>
    <button onclick="next()">Další</button>

    ${
      p.result
        ? `<h3>${p.result.ok ? "✅ OK" : "❌ Špatně"}</h3>`
        : ""
    }
  `;
}
