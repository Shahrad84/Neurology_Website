/* =========================================================
   Home page interactions
   - Mobile menu toggle
   - Header scroll state
   - Scroll-triggered reveals
   - Footer year
   ========================================================= */

(function () {
  "use strict";

  /* ---------- Mobile menu ---------- */
  function initMobileMenu() {
    const toggle = document.getElementById("menuToggle");
    const menu = document.getElementById("mobileMenu");
    if (!toggle || !menu) return;

    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      if (open) {
        menu.hidden = false;
        // next frame so transition/measurement works
        requestAnimationFrame(() => menu.classList.add("is-open"));
      } else {
        menu.classList.remove("is-open");
        menu.hidden = true;
      }
    };

    toggle.addEventListener("click", () => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      setOpen(!isOpen);
    });

    // Close when a link is tapped (navigation feel)
    menu.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => setOpen(false));
    });

    // Close on escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });

    // Auto-close when resizing up to desktop
    const mq = window.matchMedia("(min-width: 900px)");
    const handleMq = (e) => { if (e.matches) setOpen(false); };
    if (mq.addEventListener) mq.addEventListener("change", handleMq);
    else mq.addListener(handleMq);
  }

  /* ---------- Header scroll state ---------- */
  function initHeaderScroll() {
    const header = document.getElementById("siteHeader");
    if (!header) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        header.classList.toggle("is-scrolled", window.scrollY > 8);
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Scroll reveals ---------- */
  function initReveals() {
    const els = document.querySelectorAll(".reveal");
    if (!els.length) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );

    els.forEach((el) => io.observe(el));
  }

  /* ---------- Footer year ---------- */
  function initYear() {
    const el = document.getElementById("year");
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* ---------- Init ---------- */
  function init() {
    initMobileMenu();
    initHeaderScroll();
    initReveals();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();