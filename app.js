
"use strict";

const STORAGE_KEY = "vocabTrainerData";

function createId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const app = document.querySelector("#app");

function render() {
  app.innerHTML = `
    <h1>Moje slovíčka ✅</h1>
    <p>Aplikace běží správně 🎉</p>
  `;
}

render();
