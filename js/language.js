/* =========================================================
   Language handling
   - Detects language (localStorage → <html lang> → navigator)
   - Fetches JSON from /locales/{lang}.json
   - Swaps textContent / attributes for [data-i18n] nodes
   - Updates <html lang> and <html dir>
   - Persists choice in localStorage
   - Never changes the URL
   ========================================================= */

(function () {
  "use strict";

  const SUPPORTED = ["en", "fa", "id"];
  const RTL_LANGS = ["fa", "ar", "he", "ur"];
  const STORAGE_KEY = "mt_lang";
  const DEFAULT_LANG = "en";

  let currentLang = DEFAULT_LANG;
  let dictionary = {};

  /* ---------- helpers ---------- */

  function normalize(lang) {
    if (!lang) return null;
    const short = String(lang).toLowerCase().split("-")[0];
    return SUPPORTED.includes(short) ? short : null;
  }

  function detectInitialLang() {
    try {
      const stored = normalize(localStorage.getItem(STORAGE_KEY));
      if (stored) return stored;
    } catch (_) { /* storage may be blocked */ }

    const htmlLang = normalize(document.documentElement.lang);
    if (htmlLang) return htmlLang;

    return normalize(navigator.language) || DEFAULT_LANG;
  }

  function getByPath(obj, path) {
    return path.split(".").reduce((acc, key) => (acc && acc[key] != null ? acc[key] : undefined), obj);
  }

  function applyDirection(lang) {
    const dir = RTL_LANGS.includes(lang) ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }

  function applyTranslations() {
    // Text nodes
    const textNodes = document.querySelectorAll("[data-i18n]");
    textNodes.forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const value = getByPath(dictionary, key);
      if (typeof value === "string") {
        el.textContent = value;
      }
    });

    // Attribute nodes: data-i18n-attr="content" data-i18n="meta.title"
    const attrNodes = document.querySelectorAll("[data-i18n-attr]");
    attrNodes.forEach((el) => {
      const attr = el.getAttribute("data-i18n-attr");
      const key = el.getAttribute("data-i18n");
      const value = getByPath(dictionary, key);
      if (attr && typeof value === "string") {
        el.setAttribute(attr, value);
      }
    });

    // Update document title from meta.title if present in dictionary
    const title = getByPath(dictionary, "meta.title");
    if (title) document.title = title;
  }

  function updateSwitcherUI(lang) {
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      const isActive = btn.dataset.lang === lang;
      btn.setAttribute("aria-pressed", String(isActive));
    });
  }

  function dispatchReady() {
    document.dispatchEvent(new CustomEvent("i18n:ready", { detail: { lang: currentLang } }));
  }

  /* ---------- loading ---------- */

  async function loadDictionary(lang) {
    const res = await fetch(`/locales/${lang}.json`, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${lang}.json (${res.status})`);
    return res.json();
  }

  async function setLanguage(lang) {
    const normalized = normalize(lang) || DEFAULT_LANG;

    let next;
    try {
      next = await loadDictionary(normalized);
    } catch (err) {
      // Graceful fallback: keep English dictionary if we already have one.
      console.warn("[i18n] Falling back — could not load", normalized, err);
      if (normalized !== DEFAULT_LANG) {
        try {
          next = await loadDictionary(DEFAULT_LANG);
          normalized = DEFAULT_LANG;
        } catch (_) {
          return; // nothing we can do
        }
      } else {
        return;
      }
    }

    currentLang = normalized;
    dictionary = next;

    applyDirection(currentLang);
    applyTranslations();
    updateSwitcherUI(currentLang);

    try { localStorage.setItem(STORAGE_KEY, currentLang); } catch (_) {}

    dispatchReady();
  }

  /* ---------- wiring ---------- */

  function bindSwitcher() {
    document.querySelectorAll(".lang-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const next = btn.dataset.lang;
        if (next && next !== currentLang) setLanguage(next);
      });
    });
  }

  function init() {
    // Set direction ASAP to avoid flash
    const initial = detectInitialLang();
    applyDirection(initial);

    bindSwitcher();
    setLanguage(initial);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();