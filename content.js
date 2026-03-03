(() => {
  let enabled = false;
  let indicator = null;
  let ticking = false;

  // Drag state
  let dragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  const STORAGE_KEY = "indicatorPosition"; // { left, top }

  // ===== Ring gauge (border progress) =====
  const RING_COLOR = "#22c55e"; // gauge color (change if you like)
  const INNER_BG = "rgba(0, 0, 0, 0.75)";

  function setRingGauge(percent) {
    if (!indicator) return;

    const p = Math.min(100, Math.max(0, percent));
    const deg = (p / 100) * 360;

    // 0% -> same look as before (no colored border)
    const conic =
      p <= 0
        ? "conic-gradient(from 0deg, rgba(0,0,0,0) 0deg 360deg)"
        : `conic-gradient(from 0deg, ${RING_COLOR} 0deg ${deg}deg, rgba(0,0,0,0) ${deg}deg 360deg)`;

    // Two-layer background: inner solid + outer conic ring
    indicator.style.border = "2px solid transparent";
    indicator.style.backgroundImage = `linear-gradient(${INNER_BG}, ${INNER_BG}), ${conic}`;
    indicator.style.backgroundClip = "padding-box, border-box";
    indicator.style.backgroundOrigin = "border-box";
    indicator.style.backgroundRepeat = "no-repeat";
  }

  async function loadPosition() {
    try {
      const res = await chrome.storage.local.get(STORAGE_KEY);
      return res?.[STORAGE_KEY] ?? null;
    } catch {
      return null;
    }
  }

  async function savePosition(left, top) {
    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: { left, top } });
    } catch {
      // ignore
    }
  }

  function applyPosition(left, top) {
    if (!indicator) return;

    const rect = indicator.getBoundingClientRect();
    const maxLeft = Math.max(0, window.innerWidth - rect.width);
    const maxTop = Math.max(0, window.innerHeight - rect.height);

    const clampedLeft = clamp(left, 0, maxLeft);
    const clampedTop = clamp(top, 0, maxTop);

    indicator.style.left = `${clampedLeft}px`;
    indicator.style.top = `${clampedTop}px`;
  }

  function clampCurrentPosition() {
    if (!indicator) return;
    const rect = indicator.getBoundingClientRect();
    applyPosition(rect.left, rect.top);
  }

  function attachDragHandlers() {
    if (!indicator) return;

    const THRESHOLD_PX = 6;

    let pointerId = null;
    let downX = 0;
    let downY = 0;
    let dragStarted = false;

    indicator.addEventListener("pointerdown", (e) => {
      // left-click / primary touch only
      if (e.button !== 0) return;

      pointerId = e.pointerId;
      indicator.setPointerCapture(pointerId);

      downX = e.clientX;
      downY = e.clientY;
      dragStarted = false;

      dragging = true;

      const rect = indicator.getBoundingClientRect();
      dragOffsetX = downX - rect.left;
      dragOffsetY = downY - rect.top;

      indicator.style.cursor = "grab";
    });

    indicator.addEventListener("pointermove", (e) => {
      if (!dragging || !indicator || pointerId !== e.pointerId) return;

      const dx = e.clientX - downX;
      const dy = e.clientY - downY;

      // Start drag only after the pointer has moved enough
      if (!dragStarted) {
        if (Math.hypot(dx, dy) < THRESHOLD_PX) return;
        dragStarted = true;
        indicator.style.cursor = "grabbing";
        e.preventDefault();
      }

      const nextLeft = e.clientX - dragOffsetX;
      const nextTop = e.clientY - dragOffsetY;
      applyPosition(nextLeft, nextTop);
    });

    const endPointer = async (e) => {
      if (!dragging || pointerId !== e.pointerId) return;

      dragging = false;
      pointerId = null;

      if (!indicator) return;

      if (dragStarted) {
        // Drag finished -> persist position
        indicator.style.cursor = "grab";
        const rect = indicator.getBoundingClientRect();
        await savePosition(rect.left, rect.top);
      } else {
        // Click (no drag) -> scroll to top smoothly in this tab
        try {
          window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
        } catch {
          // Fallback for very old pages/environments
          window.scrollTo(0, 0);
        }
      }
    };

    indicator.addEventListener("pointerup", endPointer);
    indicator.addEventListener("pointercancel", endPointer);
  }

  async function createIndicator() {
    if (indicator) return indicator;

    indicator = document.createElement("div");
    indicator.id = "__scroll_position_indicator__";

    // left/top based positioning for dragging
    indicator.style.position = "fixed";
    indicator.style.left = "12px";
    indicator.style.top = "12px";

    indicator.style.zIndex = "2147483647";
    indicator.style.padding = "8px 12px";
    indicator.style.borderRadius = "10px";
    // Background is managed by setRingGauge() so we can draw a progress ring on the border
    setRingGauge(0);
    indicator.style.color = "#fff";
    indicator.style.fontSize = "14px";
    indicator.style.fontWeight = "600";
    indicator.style.fontFamily = "system-ui, sans-serif";
    indicator.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25)";

    // Must be interactive for dragging
    indicator.style.pointerEvents = "auto";
    indicator.style.userSelect = "none";
    indicator.style.touchAction = "none";
    indicator.style.cursor = "grab";

    indicator.textContent = "0%";
    document.documentElement.appendChild(indicator);
    setRingGauge(0);

    // Apply saved position if present, else default to top-right-ish.
    const saved = await loadPosition();
    if (saved && typeof saved.left === "number" && typeof saved.top === "number") {
      applyPosition(saved.left, saved.top);
    } else {
      const rect = indicator.getBoundingClientRect();
      const defaultLeft = Math.max(0, window.innerWidth - rect.width - 12);
      const defaultTop = 12;
      applyPosition(defaultLeft, defaultTop);
    }

    attachDragHandlers();
    return indicator;
  }

  function removeIndicator() {
    if (indicator) {
      indicator.remove();
      indicator = null;
    }
    dragging = false;
  }

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function getScrollPercent() {
    const doc = document.documentElement;
    const scrollTop = window.scrollY || doc.scrollTop || 0;
    const scrollable = Math.max(doc.scrollHeight - window.innerHeight, 0);
    if (scrollable === 0) return 0;

    const percent = (scrollTop / scrollable) * 100;
    return Math.min(100, Math.max(0, Math.round(percent)));
  }

  function updateIndicator() {
    if (!enabled || !indicator) return;
    const p = getScrollPercent();
    indicator.textContent = `${p}%`;
    setRingGauge(p);
  }

  function onScrollOrResize() {
    if (!enabled) return;

    // keep within viewport on resize
    if (indicator) clampCurrentPosition();

    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(() => {
        updateIndicator();
        ticking = false;
      });
    }
  }

  async function setEnabled(next) {
    if (enabled === next) return;
    enabled = next;

    if (enabled) {
      await createIndicator();
      updateIndicator();
      window.addEventListener("scroll", onScrollOrResize, { passive: true });
      window.addEventListener("resize", onScrollOrResize);
    } else {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      removeIndicator();
    }
  }

  // Toggle messages from background
  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "TOGGLE_SCROLL_INDICATOR") {
      setEnabled(Boolean(message.enabled));
    }
  });

  // Initial state query
  chrome.runtime.sendMessage(
    { type: "GET_GLOBAL_SCROLL_INDICATOR_STATE" },
    (response) => {
      if (chrome.runtime.lastError) return;
      setEnabled(Boolean(response?.enabled));
    }
  );

  // Apply saved position immediately across tabs (no reload)
  if (chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local") return;
      const change = changes?.[STORAGE_KEY];
      if (!change) return;
      if (!enabled || !indicator) return;
      const saved = change.newValue;
      if (saved && typeof saved.left === "number" && typeof saved.top === "number") {
        applyPosition(saved.left, saved.top);
      }
    });
  }
})();
