(() => {
    let enabled = false;
    let indicator = null;
    let ticking = false;

    function createIndicator() {
        if (indicator) return indicator;

        indicator = document.createElement("div");
        indicator.id = "__scroll_position_indicator__";
        indicator.style.position = "fixed";
        indicator.style.top = "12px";
        indicator.style.right = "12px";
        indicator.style.zIndex = "2147483647";
        indicator.style.padding = "8px 12px";
        indicator.style.borderRadius = "10px";
        indicator.style.background = "rgba(0, 0, 0, 0.75)";
        indicator.style.color = "#fff";
        indicator.style.fontSize = "14px";
        indicator.style.fontWeight = "600";
        indicator.style.fontFamily = "system-ui, sans-serif";
        indicator.style.boxShadow = "0 4px 12px rgba(0,0,0,0.25)";
        indicator.style.pointerEvents = "none";
        indicator.textContent = "0%";

        document.documentElement.appendChild(indicator);
        return indicator;
    }

    function removeIndicator() {
        if (indicator) {
        indicator.remove();
        indicator = null;
        }
    }

    function getScrollPercent() {
        const doc = document.documentElement;
        const scrollTop = window.scrollY || doc.scrollTop || 0;

        const scrollable = Math.max(doc.scrollHeight - window.innerHeight, 0);
        if (scrollable === 0) {
        return 0;
        }

        const percent = (scrollTop / scrollable) * 100;
        return Math.min(100, Math.max(0, Math.round(percent)));
    }

    function updateIndicator() {
        if (!enabled || !indicator) return;
        indicator.textContent = `${getScrollPercent()}%`;
    }

    function onScrollOrResize() {
        if (!enabled) return;

        if (!ticking) {
        window.requestAnimationFrame(() => {
            updateIndicator();
            ticking = false;
        });
        ticking = true;
        }
    }

    function setEnabled(next) {
        enabled = next;

        if (enabled) {
            createIndicator();
            updateIndicator();
            window.addEventListener("scroll", onScrollOrResize, { passive: true });
            window.addEventListener("resize", onScrollOrResize);
        } else {
            window.removeEventListener("scroll", onScrollOrResize);
            window.removeEventListener("resize", onScrollOrResize);
            removeIndicator();
        }
    }

    chrome.runtime.onMessage.addListener((message) => {
        if (message?.type === "TOGGLE_SCROLL_INDICATOR") {
            setEnabled(Boolean(message.enabled));
        }
    });
})();
