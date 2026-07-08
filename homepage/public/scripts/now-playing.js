const nowPlayingRoot = document.querySelector("[data-now-playing]");

if (nowPlayingRoot) {
  const nowPlayingUrl = nowPlayingRoot.dataset.nowPlayingUrl?.trim();
  let nowPlayingEndpoint = "";
  if (nowPlayingUrl) {
    try {
      nowPlayingEndpoint = `${new URL(nowPlayingUrl).origin}/now`;
    } catch {
      nowPlayingEndpoint = "";
    }
  }
  const hero = nowPlayingRoot.closest(".hero-video");
  const dj = hero?.querySelector(".hero__dj");
  const link = nowPlayingRoot.querySelector("[data-now-playing-link]");
  const menuLink = hero?.querySelector("[data-now-playing-menu-item]");
  const art = nowPlayingRoot.querySelector("[data-now-playing-art]");
  const title = nowPlayingRoot.querySelector("[data-now-playing-title]");
  const separator = nowPlayingRoot.querySelector("[data-now-playing-separator]");
  const artist = nowPlayingRoot.querySelector("[data-now-playing-artist]");
  const album = nowPlayingRoot.querySelector("[data-now-playing-album]");
  const progress = nowPlayingRoot.querySelector("[data-now-playing-progress]");
  const progressBar = nowPlayingRoot.querySelector(".hero__now-playing-progress");
  const pulse = nowPlayingRoot.querySelector(".hero__now-playing-pulse");
  const spotify = nowPlayingRoot.querySelector(".hero__now-playing-spotify");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const staleAfterMs = 45_000;
  const heartbeatMs = 25_000;
  const trackEndPadMs = 1_500;
  let heartbeatTimer;
  let trackEndTimer;
  let progressFrame;
  let abortController;
  let isRunning = false;
  let isFetching = false;
  let renderedProgress;
  const desktopQuery = window.matchMedia("(min-width: 761px)");

  const setMenuLinkState = (trackUrl) => {
    if (!menuLink) return;

    if (trackUrl) {
      menuLink.href = trackUrl;
      menuLink.dataset.nowPlayingLive = "true";
      menuLink.setAttribute("aria-disabled", "false");
      return;
    }

    menuLink.removeAttribute("href");
    menuLink.dataset.nowPlayingLive = "false";
    menuLink.setAttribute("aria-disabled", "true");
  };

  const clearHeartbeat = () => {
    if (!heartbeatTimer) return;
    window.clearTimeout(heartbeatTimer);
    heartbeatTimer = undefined;
  };

  const clearTrackEndTimer = () => {
    if (!trackEndTimer) return;
    window.clearTimeout(trackEndTimer);
    trackEndTimer = undefined;
  };

  const stopProgress = () => {
    if (!progressFrame) return;
    window.cancelAnimationFrame(progressFrame);
    progressFrame = undefined;
  };

  const hideNowPlaying = () => {
    nowPlayingRoot.hidden = true;
    setMenuLinkState();
    renderedProgress = undefined;
    clearTrackEndTimer();
    stopProgress();
  };

  const getEasternHour = () => {
    const easternTime = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
    return easternTime.getHours();
  };

  const isStoreOpen = () => {
    const openHour = Number(document.body.dataset.openHour ?? "12");
    const closeHour = Number(document.body.dataset.closeHour ?? "18");
    if (!Number.isFinite(openHour) || !Number.isFinite(closeHour)) return false;

    const hour = getEasternHour();
    return hour >= openHour && hour < closeHour;
  };

  const isMusicStageOpen = () =>
    Boolean(hero?.classList.contains("is-music") && dj?.getAttribute("aria-hidden") !== "true");

  const shouldRun = () => Boolean(nowPlayingEndpoint && isMusicStageOpen() && document.visibilityState === "visible");

  const getFetchedAtMs = (value) => {
    if (typeof value === "number") return value < 1_000_000_000_000 ? value * 1000 : value;
    if (typeof value !== "string") return Number.NaN;

    return Date.parse(value);
  };

  const isFresh = (fetchedAtMs) => Number.isFinite(fetchedAtMs) && Date.now() - fetchedAtMs <= staleAfterMs;

  const getArtistText = (artistsValue) => {
    if (Array.isArray(artistsValue)) return artistsValue.filter(Boolean).join(", ");
    return typeof artistsValue === "string" ? artistsValue : "";
  };

  const getProgressRatio = () => {
    if (!renderedProgress || renderedProgress.durationMs <= 0) return 0;

    const elapsedMs = Math.max(0, Date.now() - renderedProgress.fetchedAtMs);
    const currentMs = Math.min(renderedProgress.durationMs, renderedProgress.progressMs + elapsedMs);
    return Math.max(0, Math.min(1, currentMs / renderedProgress.durationMs));
  };

  const updateProgress = () => {
    if (!progress) return;

    progress.style.transform = `scaleX(${getProgressRatio()})`;
  };

  const tickProgress = () => {
    updateProgress();
    if (reduceMotion.matches || !renderedProgress || nowPlayingRoot.hidden || !shouldRun()) {
      progressFrame = undefined;
      return;
    }

    progressFrame = window.requestAnimationFrame(tickProgress);
  };

  const startProgress = () => {
    stopProgress();
    updateProgress();
    if (reduceMotion.matches) return;

    progressFrame = window.requestAnimationFrame(tickProgress);
  };

  const scheduleHeartbeat = () => {
    clearHeartbeat();
    if (!isRunning || !shouldRun()) return;

    heartbeatTimer = window.setTimeout(fetchNowPlaying, heartbeatMs);
  };

  const scheduleTrackEndCheck = () => {
    clearTrackEndTimer();
    if (!renderedProgress || renderedProgress.durationMs <= 0 || !shouldRun()) return;

    const elapsedMs = Math.max(0, Date.now() - renderedProgress.fetchedAtMs);
    const currentMs = Math.min(renderedProgress.durationMs, renderedProgress.progressMs + elapsedMs);
    const delayMs = Math.max(trackEndPadMs, renderedProgress.durationMs - currentMs + trackEndPadMs);
    trackEndTimer = window.setTimeout(fetchNowPlaying, Math.min(delayMs, 2_147_483_647));
  };

  const renderEmptyState = () => {
    clearTrackEndTimer();
    stopProgress();
    renderedProgress = undefined;
    nowPlayingRoot.dataset.nowPlayingState = "empty";
    setMenuLinkState();
    link?.removeAttribute("href");
    title.textContent = "nothing playing right now";
    separator.hidden = true;
    artist.textContent = "";
    artist.hidden = true;
    album.textContent = "";
    album.hidden = true;
    art.removeAttribute("src");
    art.hidden = true;
    progress.style.transform = "scaleX(0)";
    progressBar.hidden = true;
    pulse.hidden = true;
    spotify.hidden = true;
    nowPlayingRoot.hidden = false;
  };

  const renderNowPlaying = (payload) => {
    const track = payload?.track;
    const fetchedAtMs = getFetchedAtMs(payload?.fetchedAt);
    const trackUrl = typeof track?.url === "string" ? track.url : "";
    const trackName = typeof track?.name === "string" ? track.name : "";
    const artistText = getArtistText(track?.artists);
    const durationMs = Number(payload?.durationMs);
    const progressMs = Number(payload?.progressMs);

    if (
      payload?.show !== true ||
      !isFresh(fetchedAtMs) ||
      !trackUrl ||
      !trackName ||
      !artistText ||
      !Number.isFinite(durationMs) ||
      durationMs <= 0 ||
      !Number.isFinite(progressMs)
    ) {
      renderEmptyState();
      return;
    }

    try {
      const spotifyUrl = new URL(trackUrl).href;
      link.href = spotifyUrl;
      setMenuLinkState(spotifyUrl);
    } catch {
      renderEmptyState();
      return;
    }

    nowPlayingRoot.dataset.nowPlayingState = "live";
    separator.hidden = false;
    artist.hidden = false;
    album.hidden = false;
    progressBar.hidden = false;
    pulse.hidden = false;
    spotify.hidden = false;
    title.textContent = trackName;
    artist.textContent = artistText;
    album.textContent = typeof track.album === "string" ? track.album : "";

    if (typeof track.art === "string" && track.art) {
      art.src = track.art;
      art.hidden = false;
    } else {
      art.removeAttribute("src");
      art.hidden = true;
    }

    renderedProgress = {
      durationMs,
      fetchedAtMs,
      progressMs: Math.max(0, Math.min(durationMs, progressMs)),
    };
    nowPlayingRoot.hidden = false;
    startProgress();
    scheduleTrackEndCheck();
  };

  async function fetchNowPlaying() {
    clearHeartbeat();
    clearTrackEndTimer();
    if (!shouldRun()) return;

    if (!isStoreOpen()) {
      renderEmptyState();
      scheduleHeartbeat();
      return;
    }

    if (isFetching) return;
    isFetching = true;
    abortController = new AbortController();

    try {
      const response = await fetch(nowPlayingUrl, {
        cache: "no-store",
        signal: abortController.signal,
      });
      const payload = response.ok ? await response.json() : { show: false };
      if (shouldRun() && isStoreOpen()) renderNowPlaying(payload);
      else hideNowPlaying();
    } catch (error) {
      if (error?.name !== "AbortError") renderEmptyState();
    } finally {
      isFetching = false;
      abortController = undefined;
      scheduleHeartbeat();
    }
  }

  const start = () => {
    if (isRunning) return;

    isRunning = true;
    void fetchNowPlaying();
  };

  const stop = () => {
    isRunning = false;
    clearHeartbeat();
    clearTrackEndTimer();
    stopProgress();
    abortController?.abort();
    abortController = undefined;
    hideNowPlaying();
  };

  const sync = () => {
    if (shouldRun()) {
      start();
      return;
    }

    stop();
  };

  const observer = new MutationObserver(sync);
  if (hero) observer.observe(hero, { attributes: true, attributeFilter: ["class"] });
  if (dj) observer.observe(dj, { attributes: true, attributeFilter: ["aria-hidden"] });

  document.addEventListener("visibilitychange", sync);
  reduceMotion.addEventListener("change", () => {
    if (!renderedProgress || nowPlayingRoot.hidden) return;
    startProgress();
  });
  menuLink?.addEventListener("click", (event) => {
    if (!desktopQuery.matches || menuLink.dataset.nowPlayingLive !== "true" || !menuLink.href) {
      event.preventDefault();
    }
  });
  setMenuLinkState();
  sync();
}
