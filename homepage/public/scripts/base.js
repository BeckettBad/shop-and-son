const OPEN_HOUR = Number(document.body.dataset.openHour ?? "12");
const CLOSE_HOUR = Number(document.body.dataset.closeHour ?? "18");

// clock + open/closed status, computed from store hours in America/New_York
function tick() {
  const now = new Date();
  const et = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const h = et.getHours();
  const m = et.getMinutes();
  const open = h >= OPEN_HOUR && h < CLOSE_HOUR;
  const hh = ((h + 11) % 12) + 1;
  const ap = h < 12 ? "am" : "pm";
  const t = hh + ":" + String(m).padStart(2, "0") + " " + ap + " est";
  const clock = document.getElementById("clock");
  if (clock) clock.textContent = t;
  const s = document.getElementById("status");
  if (s) s.textContent = (open ? "— open now · " : "— closed · ") + t;
}
setInterval(tick, 1000);
tick();

// index overlay
const ib = document.getElementById("idxBtn");
const ov = document.getElementById("overlay");
ib?.addEventListener("click", () => {
  const o = ov?.classList.toggle("show");
  ib.classList.toggle("on", Boolean(o));
  ib.textContent = o ? "– close" : "+ index";
});

// header: transparent over the full-screen hero, solid white once scrolled past
const header = document.querySelector(".site-header");
const overHero = () => {
  if (header) header.classList.toggle("over-hero", window.scrollY < window.innerHeight - 90);
};
overHero();
window.addEventListener("scroll", overHero, { passive: true });
window.addEventListener("resize", overHero, { passive: true });

// footer newsletter subscribe: optimistic success, fire-and-forget to Shopify.
// Bundled here (not inline) because the prod CSP blocks inline scripts.
const subForm = document.querySelector("[data-subscribe-form]");
if (subForm) {
  subForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const btn = subForm.querySelector("[data-subscribe-btn]");
    const email = subForm.querySelector("[data-subscribe-email]");
    if (!email || !email.value || !email.checkValidity()) {
      email?.reportValidity?.();
      return;
    }
    try {
      fetch(subForm.action, {
        method: "POST",
        body: new FormData(subForm),
        mode: "no-cors",
      }).catch(() => {});
    } catch (_) {}
    if (btn) {
      btn.classList.add("is-subscribed");
      btn.textContent = "subscribed";
      btn.disabled = true;
    }
    email.readOnly = true;
  });
}
