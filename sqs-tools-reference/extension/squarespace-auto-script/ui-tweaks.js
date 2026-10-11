console.log("A", location.href);

(function () {
  setTimeout(function () {
    if (!location.pathname.startsWith("/config")) return;
    
(function () {
  // ── Guards ───────────────────────────────────────────────────────────────────
  if (window.top !== window.self) return;
  if (!(window.top.Static && window.top.Static.IN_BACKEND)) return;
  if (window.top.document.getElementById("ou-toolbar-buttons")) return;

  const log = (...args) => window.top.console.log("[OU]", ...args);
  const err = (...args) => window.top.console.error("[OU]", ...args);

  // ── Router ───────────────────────────────────────────────────────────────────
  function getRouterHistory() {
    if (window.top.CONFIG_PANEL && window.top.CONFIG_PANEL.get) {
      const router = window.top.CONFIG_PANEL.get("router");
      if (router && router.history) {
        log("Got history via CONFIG_PANEL");
        return router.history;
      }
    }

    const rootEl = window.top.document.querySelector(".sqs-damask > div");
    if (!rootEl) return null;

    let fiberKey = null;
    for (const key in rootEl) {
      if (key.startsWith("__reactFiber$") || key.startsWith("__reactInternalInstance$")) {
        fiberKey = key;
        break;
      }
    }
    if (!fiberKey) return null;

    let node = rootEl[fiberKey];
    let attempts = 0;
    while (node && attempts < 150) {
      attempts++;
      const props =
        node.memoizedProps ||
        node.pendingProps ||
        (node._currentElement && node._currentElement.props);

      if (props) {
        if (props.router && props.router.history && typeof props.router.history.push === "function") {
          log("Got history via fiber (router.history.push)");
          return props.router.history;
        }
        if (props.history && typeof props.history.push === "function") {
          log("Got history via fiber (props.history.push)");
          return props.history;
        }
      }
      node = node.return || null;
    }

    err("Could not find router history after", attempts, "attempts");
    return null;
  }

  let _history = null;

  function navigate(path, event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }

    _history = _history || getRouterHistory();

    if (!_history) {
      err("No history — falling back to location.assign");
      window.top.location.assign("/config" + path);
      return;
    }

    try {
      _history.push(path);
      log("Navigated to", path);
    } catch (e) {
      err("history.push failed", e);
      window.top.location.assign("/config" + path);
    }
  }

  // ── Links config ─────────────────────────────────────────────────────────────
  const LINKS = [
    { label: "CSS",   path: "/design/custom-css" },
    { label: "JS",    path: "/settings/advanced/code-injection" },
    { label: "Pages", path: "/pages" },
  ];

  // ── Device config ─────────────────────────────────────────────────────────────
  // All dimensions are CSS logical pixels — NOT physical/retina pixels.
  // iPhones report logical points (e.g. iPhone 17 Pro = 393×852, not 1179×2556).
  // MacBooks: browser viewport at 100% zoom (not display resolution).
  const DEVICES = [
    { value: "desktop",           label: "Desktop",             w: null, h: null },
    // ── MacBooks ──────────────────────────────────────────────────────────────
    // Viewport at default 100% browser zoom
    { value: "MacBook-13",        label: "MacBook 13″",         w: 1280, h: 800,  noRotate: true },
    { value: "MacBook-14",        label: "MacBook 14″",         w: 1512, h: 982,  noRotate: true },
    { value: "MacBook-15",        label: "MacBook 15″",         w: 1440, h: 900,  noRotate: true },
    { value: "MacBook-16",        label: "MacBook 16″",         w: 1728, h: 1117, noRotate: true },
    // ── iPads (logical points = CSS pixels) ───────────────────────────────────
    { value: "iPad-10.2",         label: "iPad 10.2″",          w: 810,  h: 1080 },
    { value: "iPad-10.9",         label: "iPad 10.9″ (A16)",    w: 820,  h: 1180 },
    { value: "iPad-mini-6",       label: "iPad mini 6″",        w: 744,  h: 1133 },
    { value: "iPad-Pro-11",       label: "iPad Pro 11″",        w: 834,  h: 1194 },
    { value: "iPad-Pro-12.9",     label: "iPad Pro 12.9″",      w: 1024, h: 1366 },
    { value: "iPad-Pro-13",       label: "iPad Pro 13″ (M4)",   w: 1032, h: 1376 },
    // ── iPhones (logical points — 2× or 3× physical, irrelevant for CSS) ─────
    { value: "iPhone-13-mini",    label: "iPhone 13 Mini",      w: 375,  h: 812,  isMobile: true },
    { value: "iPhone-17e",        label: "iPhone 17e",          w: 375,  h: 667,  isMobile: true },
    { value: "iPhone-17",         label: "iPhone 17",           w: 393,  h: 852,  isMobile: true },
    { value: "iPhone-17-air",     label: "iPhone 17 Air",       w: 402,  h: 874,  isMobile: true },
    { value: "iPhone-17-pro",     label: "iPhone 17 Pro",       w: 393,  h: 852,  isMobile: true },
    { value: "iPhone-17-pro-max", label: "iPhone 17 Pro Max",   w: 430,  h: 932,  isMobile: true },
  ];

  // Safari iOS chrome: ~50px address bar + ~83px tab bar = 133px total
  const SAFARI_UI_HEIGHT = 133;

  // ── Styles ───────────────────────────────────────────────────────────────────
  function injectStyles() {
    if (window.top.document.getElementById("ou-toolbar-style")) return;
    const style = window.top.document.createElement("style");
    style.id = "ou-toolbar-style";
    style.textContent = `
      /* Device selects — sized to feel at home in the toolbar */
      .ou-device-select {
        height: 100%;
        padding: 0 6px;
        border: none;
        border-radius: 4px;
        font-size: 12px;
        font-family: inherit;
        background: transparent;
        cursor: pointer;
        color: inherit;
        outline: none;
      }

      /* Safari UI checkbox */
      .ou-safari-label {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        font-family: inherit;
        color: inherit;
        cursor: pointer;
        opacity: 0.7;
        white-space: nowrap;
      }

      .ou-safari-label:hover { opacity: 1; }
      .ou-safari-label input { margin: 0; cursor: pointer; }

      /* Info icon + tooltip */
      .ou-device-info {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        font-size: 11px;
        line-height: 1;
        cursor: default;
        opacity: 0.5;
        position: relative;
        flex-shrink: 0;
        overflow: visible;
      }

      .ou-device-info:hover {
        opacity: 1;
      }

      .ou-device-info::after {
        content: attr(data-tooltip);
        position: fixed;
        bottom: 52px;
        left: auto;
        transform: none;
        background: rgba(20, 20, 20, 0.92);
        color: #fff;
        font-size: 11px;
        font-family: inherit;
        white-space: nowrap;
        padding: 5px 9px;
        border-radius: 5px;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.12s;
        z-index: 99999;
      }

      .ou-device-info:hover::after {
        opacity: 1;
      }

      /* Safari UI checkbox */
      .ou-safari-label {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 11px;
        font-family: inherit;
        color: inherit;
        opacity: 0.7;
        cursor: pointer;
        white-space: nowrap;
        flex-shrink: 0;
        padding: 0 10px;
      }

      .ou-safari-label:hover { opacity: 1; }
      .ou-safari-label input { margin: 0; cursor: pointer; }
    `;
  }

  // ── Inject nav buttons (CSS / JS) ─────────────────────────────────────────────
  function injectButtons(editBtn) {
    const flexParent = editBtn.closest(".fs-unmask");
    if (!flexParent) { err("Could not find .fs-unmask for buttons"); return; }

    const inheritedClasses = editBtn.className + " ou-toolbar-btn";

    LINKS.forEach((link) => {
      const btn = window.top.document.createElement("button");
      btn.className = inheritedClasses;
      btn.textContent = link.label;
      btn.dataset.ouPath = link.path;
      btn.setAttribute("aria-label", link.label);
      flexParent.appendChild(btn);
    });

    flexParent.id = "ou-toolbar-buttons";
    log("Nav buttons appended into .fs-unmask");
  }

  // ── Inject device switcher ────────────────────────────────────────────────────
  function injectDeviceSwitcher() {
    const deviceContainer = window.top.document.querySelector(
      '[data-guidance-engine="guidance-engine-device-view-button-container"]'
    );
    if (!deviceContainer) { err("Device container not found"); return; }
    if (deviceContainer.querySelector(".ou-device-select")) return; // already injected

    // Walk up to the .fs-unmask flex parent that holds the whole right toolbar section
    const flexParent = deviceContainer.closest(".fs-unmask");
    if (!flexParent) { err("Could not find .fs-unmask for device switcher"); return; }

    // Remove Squarespace's desktop/mobile toggle — we're replacing it entirely
    const sqsDeviceCell = deviceContainer.closest("li") || deviceContainer.parentElement;
    sqsDeviceCell.remove();
    log("Removed SQS device toggle");

    // ── Device select ─────────────────────────────────────────────────────────
    const deviceSelect = window.top.document.createElement("select");
    deviceSelect.className = "ou-device-select";
    deviceSelect.setAttribute("aria-label", "Device size");
    deviceSelect.id = "ou-device-select";

    DEVICES.forEach((d) => {
      const opt = window.top.document.createElement("option");
      opt.value = d.value;
      opt.textContent = d.label;
      deviceSelect.appendChild(opt);
    });

    // ── Orientation select ────────────────────────────────────────────────────
    const orientSelect = window.top.document.createElement("select");
    orientSelect.className = "ou-device-select";
    orientSelect.setAttribute("aria-label", "Orientation");
    orientSelect.id = "ou-orient-select";
    orientSelect.innerHTML = `
      <option value="portrait">Portrait</option>
      <option value="landscape">Landscape</option>
    `;

    // ── Safari UI checkbox ────────────────────────────────────────────────────
    const safariLabel = window.top.document.createElement("label");
    safariLabel.className = "ou-safari-label";
    safariLabel.id = "ou-safari-label";
    const safariCheckbox = window.top.document.createElement("input");
    safariCheckbox.type = "checkbox";
    safariCheckbox.id = "ou-safari-checkbox";
    safariLabel.appendChild(safariCheckbox);
    safariLabel.appendChild(window.top.document.createTextNode("Safari UI"));

    function syncSafariVisibility() {
      const device = DEVICES.find((d) => d.value === deviceSelect.value);
      safariLabel.style.display = (device && device.isMobile) ? "" : "none";
      if (!device || !device.isMobile) safariCheckbox.checked = false;
    }

    // ── Info icon ─────────────────────────────────────────────────────────────
    const infoIcon = window.top.document.createElement("span");
    infoIcon.className = "ou-device-info";
    infoIcon.textContent = "ⓘ";
    infoIcon.id = "ou-device-info";

    function updateInfoTooltip() {
      const device = DEVICES.find((d) => d.value === deviceSelect.value);
      if (!device || !device.w) {
        infoIcon.style.display = "none";
        return;
      }
      const isLandscape = !device.noRotate && orientSelect.value === "landscape";
      const w = isLandscape ? device.h : device.w;
      const safariOffset = (device.isMobile && safariCheckbox.checked) ? SAFARI_UI_HEIGHT : 0;
      const h = (isLandscape ? device.w : device.h) - safariOffset;
      infoIcon.dataset.tooltip = `${device.label} · ${w} × ${h} px${safariOffset ? " (Safari UI)" : ""}`;
      infoIcon.style.display = "";
    }

    // Hide orientation when Desktop or a MacBook is selected — doesn't apply
    function syncOrientVisibility() {
      const device = DEVICES.find((d) => d.value === deviceSelect.value);
      orientSelect.style.display =
        (!device || !device.w || device.noRotate) ? "none" : "";
    }

    // ── Apply viewport dimensions ─────────────────────────────────────────────
    function applyViewport() {
      const doc = window.top.document;
      const viewport = doc.querySelector(".preview-viewport");
      if (!viewport) { err("preview-viewport not found"); return; }
      const wrap = viewport.parentNode;

      const device = DEVICES.find((d) => d.value === deviceSelect.value);
      if (!device) return;

      if (!device.w) {
        // Desktop — restore natural sizing
        ["width","height","maxWidth","maxHeight","minWidth","minHeight"].forEach((p) => {
          wrap.style[p] = "";
        });
      } else {
        const isLandscape = !device.noRotate && orientSelect.value === "landscape";
        const w = isLandscape ? device.h : device.w;
        const safariOffset = (device.isMobile && safariCheckbox.checked) ? SAFARI_UI_HEIGHT : 0;
        const h = (isLandscape ? device.w : device.h) - safariOffset;
        wrap.style.width    = w + "px";
        wrap.style.height   = h + "px";
        wrap.style.maxWidth = w + "px";
        wrap.style.maxHeight = h + "px";
        wrap.style.minWidth = w + "px";
        wrap.style.minHeight = h + "px";
      }

      window.top.dispatchEvent(new Event("resize"));
      log("Viewport set →", deviceSelect.value, orientSelect.value);
    }

    deviceSelect.addEventListener("change", () => {
      const device = DEVICES.find((d) => d.value === deviceSelect.value);
      if (device && device.w && !device.noRotate) {
        orientSelect.value = "portrait";
      }
      syncOrientVisibility();
      syncSafariVisibility();
      applyViewport();
      updateInfoTooltip();
    });
    orientSelect.addEventListener("change", () => {
      applyViewport();
      updateInfoTooltip();
    });
    safariCheckbox.addEventListener("change", () => {
      applyViewport();
      updateInfoTooltip();
    });

    // Insert selects, safari label and info icon before the ul so the ul stays last
    const ul = flexParent.querySelector("ul");
    if (ul) {
      flexParent.insertBefore(deviceSelect, ul);
      flexParent.insertBefore(orientSelect, ul);
      flexParent.insertBefore(safariLabel, ul);
      flexParent.insertBefore(infoIcon, ul);
    } else {
      flexParent.appendChild(deviceSelect);
      flexParent.appendChild(orientSelect);
      flexParent.appendChild(safariLabel);
      flexParent.appendChild(infoIcon);
    }
    syncOrientVisibility();
    syncSafariVisibility();
    updateInfoTooltip();

    log("Device switcher injected");
  }

  // ── Click handler ─────────────────────────────────────────────────────────────
  function bindClicks() {
    window.top.document.addEventListener(
      "click",
      function (event) {
        const btn = event.target.closest(".ou-toolbar-btn");
        if (!btn) return;
        navigate(btn.dataset.ouPath, event);
      },
      true
    );
  }

  // ── Poll for Edit button then init ────────────────────────────────────────────
  function waitForEditButton(callback, maxMs) {
    const start = Date.now();
    const id = window.setInterval(function () {
      const btn = window.top.document.querySelector('[data-test="frameToolbarEdit"]');
      if (btn) {
        window.clearInterval(id);
        callback(btn);
      } else if (Date.now() - start > (maxMs || 8000)) {
        window.clearInterval(id);
        err("Edit button never appeared — giving up after 8s");
      }
    }, 120);
  }

  // ── Init ──────────────────────────────────────────────────────────────────────
  bindClicks();

  waitForEditButton(function (editBtn) {
    injectStyles();
    injectButtons(editBtn);
    injectDeviceSwitcher();
  });

})();

  }, 2000)


})();