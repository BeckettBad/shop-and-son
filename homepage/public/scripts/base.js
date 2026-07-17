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

// hero newsletter subscribe. Bundled here (not inline) because the prod CSP
// blocks inline scripts.
document.querySelectorAll("[data-hero-subscribe-form]").forEach((subForm) => {
  const subscribeButton = subForm.querySelector("[data-hero-subscribe-submit]");
  const subscribeEmail = subForm.querySelector("[data-hero-subscribe-email]");
  const placeholderText = subForm.querySelector("[data-hero-subscribe-placeholder-text]");
  const placeholderValue = "email";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let placeholderTimer;
  let failureTimer;
  let successResetTimer;
  let hasTypedPlaceholder = false;

  const stopPlaceholderType = () => {
    if (!placeholderTimer) return;

    window.clearTimeout(placeholderTimer);
    placeholderTimer = undefined;
  };

  const typePlaceholder = () => {
    if (!placeholderText || hasTypedPlaceholder) return;

    stopPlaceholderType();
    placeholderText.textContent = "";

    if (reducedMotion.matches) {
      placeholderText.textContent = placeholderValue;
      hasTypedPlaceholder = true;
      return;
    }

    let index = 0;
    const step = () => {
      placeholderText.textContent = placeholderValue.slice(0, index);
      if (index >= placeholderValue.length) {
        hasTypedPlaceholder = true;
        placeholderTimer = undefined;
        return;
      }

      index += 1;
      placeholderTimer = window.setTimeout(step, 26);
    };

    step();
  };

  const getIsValidEmail = () => Boolean(subscribeEmail?.checkValidity());

  const clearSubmitFailure = () => {
    if (failureTimer) {
      window.clearTimeout(failureTimer);
      failureTimer = undefined;
    }

    subForm.classList.remove("is-submit-failed");
  };

  const fireSubmitFailure = () => {
    clearSubmitFailure();
    void subForm.offsetWidth;
    subForm.classList.add("is-submit-failed");
    failureTimer = window.setTimeout(() => {
      failureTimer = undefined;
      subForm.classList.remove("is-submit-failed");
    }, 520);
  };

  const clearSuccessReset = () => {
    if (!successResetTimer) return;

    window.clearTimeout(successResetTimer);
    successResetTimer = undefined;
  };

  const updateSubscribeState = () => {
    const hasValue = Boolean(subscribeEmail?.value);
    const isValid = getIsValidEmail();
    subForm.classList.toggle("has-value", hasValue);
    subForm.classList.toggle("is-valid", isValid);

    if (subscribeButton && !subForm.classList.contains("is-subscribed")) {
      subscribeButton.disabled = !isValid || subForm.classList.contains("is-submitting");
    }
  };

  const activateSubscribe = () => {
    if (subForm.classList.contains("is-subscribed")) {
      resetSubscribeFresh();
      return;
    }

    subForm.classList.add("is-active");
    typePlaceholder();
    updateSubscribeState();
  };

  const resetSubscribeIdle = () => {
    clearSuccessReset();
    clearSubmitFailure();
    stopPlaceholderType();
    hasTypedPlaceholder = false;
    if (placeholderText) placeholderText.textContent = "";
    if (subscribeEmail) {
      subscribeEmail.value = "";
      subscribeEmail.readOnly = false;
    }
    subForm.classList.remove("is-active", "has-value", "is-valid", "is-submitting", "is-subscribed");
    if (subscribeButton) subscribeButton.disabled = true;
    updateSubscribeState();
  };

  function resetSubscribeFresh() {
    resetSubscribeIdle();
    subForm.classList.add("is-active");
    typePlaceholder();
    updateSubscribeState();
  }

  const queueSuccessReset = () => {
    clearSuccessReset();
    successResetTimer = window.setTimeout(() => {
      successResetTimer = undefined;
      resetSubscribeIdle();
    }, 20000);
  };

  const setSubscribeSuccess = () => {
    clearSubmitFailure();
    subForm.classList.remove("is-submitting");
    subForm.classList.add("is-active", "is-valid", "is-subscribed");
    if (subscribeButton) subscribeButton.disabled = true;
    if (subscribeEmail) subscribeEmail.readOnly = true;
    queueSuccessReset();
  };

  const setSubscribeFailure = () => {
    clearSuccessReset();
    subForm.classList.remove("is-submitting", "is-subscribed");
    if (subscribeEmail) subscribeEmail.readOnly = false;
    updateSubscribeState();
    fireSubmitFailure();
  };

  const submitSubscriber = async (email) => {
    const endpoint = subForm.dataset.subscribeUrl?.trim();
    if (!endpoint) return false;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) return false;
    const payload = await response.json().catch(() => null);
    return payload?.ok === true;
  };

  subForm.addEventListener("click", (event) => {
    if (event.target?.closest?.("[data-hero-subscribe-submit]")) return;

    activateSubscribe();
    subscribeEmail?.focus({ preventScroll: true });
  });

  subscribeEmail?.addEventListener("focus", activateSubscribe);
  subscribeEmail?.addEventListener("input", () => {
    if (subForm.classList.contains("is-subscribed")) return;

    clearSubmitFailure();
    activateSubscribe();
    updateSubscribeState();
  });

  subForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    activateSubscribe();

    if (!subscribeEmail || !getIsValidEmail()) {
      updateSubscribeState();
      fireSubmitFailure();
      subscribeEmail?.reportValidity?.();
      return;
    }

    subForm.classList.add("is-submitting");
    clearSubmitFailure();
    clearSuccessReset();
    if (subscribeButton) subscribeButton.disabled = true;

    try {
      const subscribed = await submitSubscriber(subscribeEmail.value.trim());
      if (subscribed) {
        setSubscribeSuccess();
        document.dispatchEvent(new CustomEvent("analytics:newsletter-signup"));
        return;
      }
    } catch (_) {
      // A failed or malformed response must not look like a subscription.
    }

    setSubscribeFailure();
  });

  updateSubscribeState();
});
