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
  const suggestionButton = subForm.querySelector("[data-hero-subscribe-suggestion]");
  const placeholderValue = "email..";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const commonEmailDomains = "gmail.com googlemail.com yahoo.com ymail.com hotmail.com outlook.com live.com msn.com icloud.com me.com mac.com aol.com proton.me protonmail.com comcast.net verizon.net att.net sbcglobal.net".split(" ");
  const commonEmailTlds = "com net org edu co io us ca me info".split(" ");
  let placeholderTimer;
  let suggestionTimer;
  let failureTimer;
  let successResetTimer;
  let hasTypedPlaceholder = false;
  let suggestedEmail = "";

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

  const getIsValidEmail = () => Boolean(subscribeEmail?.value.trim() && subscribeEmail.checkValidity());

  const updateSubscribeWidth = () => {
    const valueLength = subscribeEmail?.value.length ?? 0;
    const visibleLength = Math.max(valueLength + 1, placeholderValue.length + 1);
    subForm.style.setProperty("--hero-subscribe-value-ch", String(visibleLength));
  };

  const clearSubmitFailure = () => {
    if (failureTimer) {
      window.clearTimeout(failureTimer);
      failureTimer = undefined;
    }

    subForm.classList.remove("is-submit-failed");
  };

  const clearSuccessReset = () => {
    if (!successResetTimer) return;

    window.clearTimeout(successResetTimer);
    successResetTimer = undefined;
  };

  const hideEmailSuggestion = () => {
    if (suggestionTimer) {
      window.clearTimeout(suggestionTimer);
      suggestionTimer = undefined;
    }

    suggestedEmail = "";
    if (!suggestionButton) return;

    suggestionButton.hidden = true;
    suggestionButton.textContent = "";
  };

  const getLevenshteinDistance = (value, candidate, maxDistance = 2) => {
    if (value === candidate) return 0;
    if (Math.abs(value.length - candidate.length) > maxDistance) return maxDistance + 1;

    let previous = Array.from({ length: candidate.length + 1 }, (_, index) => index);
    for (let valueIndex = 0; valueIndex < value.length; valueIndex += 1) {
      const current = [valueIndex + 1];
      let rowMinimum = current[0];

      for (let candidateIndex = 0; candidateIndex < candidate.length; candidateIndex += 1) {
        const distance = Math.min(
          previous[candidateIndex + 1] + 1,
          current[candidateIndex] + 1,
          previous[candidateIndex] + (value[valueIndex] === candidate[candidateIndex] ? 0 : 1),
        );
        current[candidateIndex + 1] = distance;
        rowMinimum = Math.min(rowMinimum, distance);
      }

      if (rowMinimum > maxDistance) return maxDistance + 1;
      previous = current;
    }

    return previous[candidate.length];
  };

  const findNearMatch = (value, candidates) => {
    let bestMatch = "";
    let bestDistance = 3;

    candidates.forEach((candidate) => {
      if (value === candidate) return;

      const distance = getLevenshteinDistance(value, candidate, 2);
      if (distance > 0 && distance <= 2 && distance < bestDistance) {
        bestDistance = distance;
        bestMatch = candidate;
      }
    });

    return bestMatch;
  };

  const getEmailSuggestion = () => {
    const email = subscribeEmail?.value.trim() ?? "";
    const atIndex = email.lastIndexOf("@");
    if (!email || atIndex <= 0 || atIndex === email.length - 1) return "";

    const localPart = email.slice(0, atIndex);
    const domain = email.slice(atIndex + 1).toLowerCase();
    const dotIndex = domain.lastIndexOf(".");
    if (!localPart || dotIndex <= 0 || dotIndex === domain.length - 1) return "";
    if (commonEmailDomains.includes(domain)) return "";

    const domainMatch = findNearMatch(domain, commonEmailDomains);
    if (domainMatch) return `${localPart}@${domainMatch}`;

    const domainName = domain.slice(0, dotIndex);
    const tld = domain.slice(dotIndex + 1);
    if (commonEmailTlds.includes(tld)) return "";

    const tldMatch = findNearMatch(tld, commonEmailTlds);
    return tldMatch ? `${localPart}@${domainName}.${tldMatch}` : "";
  };

  const updateEmailSuggestion = () => {
    if (!suggestionButton || subForm.classList.contains("is-subscribed")) {
      hideEmailSuggestion();
      return;
    }

    const suggestion = getEmailSuggestion();
    if (!suggestion) {
      hideEmailSuggestion();
      return;
    }

    suggestedEmail = suggestion;
    suggestionButton.textContent = `did you mean ${suggestion}?`;
    suggestionButton.hidden = false;
  };

  const queueEmailSuggestion = () => {
    if (suggestionTimer) window.clearTimeout(suggestionTimer);

    const email = subscribeEmail?.value.trim() ?? "";
    const atIndex = email.lastIndexOf("@");
    const domain = atIndex >= 0 ? email.slice(atIndex + 1) : "";
    if (!email || atIndex <= 0 || !domain.includes(".")) {
      hideEmailSuggestion();
      return;
    }

    suggestionTimer = window.setTimeout(() => {
      suggestionTimer = undefined;
      updateEmailSuggestion();
    }, 260);
  };

  const updateSubscribeState = () => {
    const hasValue = Boolean(subscribeEmail?.value);
    const isValid = getIsValidEmail();
    updateSubscribeWidth();
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
    hideEmailSuggestion();
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
    hideEmailSuggestion();
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
    if (getIsValidEmail()) {
      clearSubmitFailure();
      void subForm.offsetWidth;
      subForm.classList.add("is-submit-failed");
      failureTimer = window.setTimeout(() => {
        failureTimer = undefined;
        subForm.classList.remove("is-submit-failed");
      }, 520);
    }
  };

  const getShopifyEndpoint = () => {
    const rawDomain = subForm.dataset.shopDomain?.trim();
    const version = subForm.dataset.sfVersion?.trim() || "2025-01";
    if (!rawDomain) return "";

    try {
      const url = new URL(rawDomain.startsWith("http") ? rawDomain : `https://${rawDomain}`);
      return `https://${url.hostname}/api/${encodeURIComponent(version)}/graphql.json`;
    } catch (_) {
      return "";
    }
  };

  const createThrowawayPassword = () => {
    if (!globalThis.crypto?.getRandomValues) return "";

    const bytes = new Uint8Array(24);
    globalThis.crypto.getRandomValues(bytes);
    return `sns-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
  };

  const submitSubscriber = async (email) => {
    const token = subForm.dataset.sfToken?.trim();
    const endpoint = getShopifyEndpoint();
    const password = createThrowawayPassword();
    if (!endpoint || !token || !password) return false;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({
        query: `
          mutation HeroNewsletterSubscribe($input: CustomerCreateInput!) {
            customerCreate(input: $input) {
              customer {
                id
              }
              customerUserErrors {
                code
                field
                message
              }
            }
          }
        `,
        variables: {
          input: {
            email,
            password,
            acceptsMarketing: true,
          },
        },
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) return false;

    const result = payload?.data?.customerCreate;
    const customer = result?.customer;
    const userErrors = Array.isArray(result?.customerUserErrors) ? result.customerUserErrors : [];
    const isAlreadyRegistered = userErrors.some((error) => {
      const code = String(error?.code ?? "").toUpperCase();
      return code === "TAKEN" || code === "CUSTOMER_DISABLED";
    });

    return Boolean(customer?.id || isAlreadyRegistered);
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
    queueEmailSuggestion();
  });

  subscribeEmail?.addEventListener("blur", updateEmailSuggestion);

  suggestionButton?.addEventListener("click", () => {
    if (!subscribeEmail || !suggestedEmail) return;

    subscribeEmail.value = suggestedEmail;
    hideEmailSuggestion();
    clearSubmitFailure();
    activateSubscribe();
    updateSubscribeState();
    subscribeEmail.focus({ preventScroll: true });
  });

  subForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    activateSubscribe();

    if (!subscribeEmail || !getIsValidEmail()) {
      updateSubscribeState();
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
        return;
      }
    } catch (_) {
      // A failed or malformed response must not look like a subscription.
    }

    setSubscribeFailure();
  });

  updateSubscribeState();
});
