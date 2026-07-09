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

// footer newsletter subscribe. Bundled here (not inline) because the prod CSP
// blocks inline scripts.
const subForm = document.querySelector("[data-subscribe-form]");
if (subForm) {
  const subscribeButton = subForm.querySelector("[data-subscribe-btn]");
  const subscribeEmail = subForm.querySelector("[data-subscribe-email]");

  const setSubscribeSuccess = () => {
    if (subscribeButton) {
      subscribeButton.classList.add("is-subscribed");
      subscribeButton.textContent = "subscribed";
      subscribeButton.disabled = true;
    }
    if (subscribeEmail) subscribeEmail.readOnly = true;
  };

  const setSubscribeFailure = () => {
    if (subscribeButton) {
      subscribeButton.classList.remove("is-subscribed");
      subscribeButton.textContent = "try again";
      subscribeButton.disabled = false;
    }
    if (subscribeEmail) subscribeEmail.readOnly = false;
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
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return `sns-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
  };

  const submitSubscriber = async (email) => {
    const token = subForm.dataset.sfToken?.trim();
    const endpoint = getShopifyEndpoint();
    if (!endpoint || !token) {
      setSubscribeSuccess();
      return true;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({
        query: `
          mutation FooterNewsletterSubscribe($input: CustomerCreateInput!) {
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
            password: createThrowawayPassword(),
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

  subForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!subscribeEmail || !subscribeEmail.value || !subscribeEmail.checkValidity()) {
      subscribeEmail?.reportValidity?.();
      return;
    }

    if (subscribeButton) {
      subscribeButton.classList.remove("is-subscribed");
      subscribeButton.textContent = "subscribing";
      subscribeButton.disabled = true;
    }

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
}
