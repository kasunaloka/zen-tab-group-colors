// ==UserScript==
// @name           Zen Tab Group Colors
// @description    Pick a custom color for each Zen sidebar folder.
// @include        main
// ==/UserScript==

(() => {
  "use strict";

  const PREF = "extensions.zentabgroupcolors.map";
  const MENU_ID = "ztgc-change-color";
  const PANEL_ID = "ztgc-picker-panel";
  const POPUP_ID = "zenFolderActions";
  const PRESETS = [
    "#A8BCFF", "#FFB078", "#CC96FC", "#8AEB82", "#F38BD1",
    "#FF8989", "#FFDC72", "#80DDE2", "#D5D8DF", "#9B8CFF",
    "#70B7FF", "#FFA6C9", "#A7DCA0", "#E6B7FF", "#F5C58B"
  ];

  const readMap = () => {
    try { return JSON.parse(Services.prefs.getStringPref(PREF, "{}")); }
    catch (_) { return {}; }
  };
  const writeMap = (map) => Services.prefs.setStringPref(PREF, JSON.stringify(map));
  const folderId = (folder) => {
    if (!folder.id) folder.id = `ztgc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return folder.id;
  };
  const validColor = (value) => /^#[0-9a-f]{6}$/i.test(value || "");

  function apply(folder, color) {
    if (!folder) return;
    if (!validColor(color)) {
      folder.style.removeProperty("--zen-primary-color");
      folder.style.removeProperty("--ztgc-folder-color");
      folder.removeAttribute("ztgc-colored");
      return;
    }
    folder.style.setProperty("--zen-primary-color", color);
    folder.style.setProperty("--ztgc-folder-color", color);
    folder.setAttribute("ztgc-colored", "true");
  }

  function applySaved(root = document) {
    const map = readMap();
    root.querySelectorAll("zen-folder").forEach((folder) => {
      if (folder.id && map[folder.id]) apply(folder, map[folder.id]);
    });
  }

  let panel, activeFolder, colorInput, hexInput, preview;

  function make(tag, attrs = {}) {
    const node = document.createElementNS("http://www.w3.org/1999/xhtml", tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (key === "text") node.textContent = value;
      else node.setAttribute(key, value);
    }
    return node;
  }

  function setSelectedColor(color) {
    if (!validColor(color)) return;
    colorInput.value = color;
    hexInput.value = color.toUpperCase();
    preview.style.background = color;
    panel.querySelectorAll(".ztgc-swatch").forEach((swatch) => {
      swatch.classList.toggle("selected", swatch.dataset.color.toLowerCase() === color.toLowerCase());
    });
  }

  function buildPicker() {
    panel = document.createXULElement("panel");
    panel.id = PANEL_ID;
    panel.setAttribute("type", "arrow");
    panel.setAttribute("noautofocus", "true");
    panel.setAttribute("flip", "both");

    const wrap = make("div", { class: "ztgc-wrap" });
    const heading = make("div", { class: "ztgc-heading", text: "Choose group color" });
    const subtitle = make("div", { class: "ztgc-subtitle", text: "Pick a preset or choose any custom color." });
    const palette = make("div", { class: "ztgc-palette" });
    PRESETS.forEach((color) => {
      const swatch = make("button", { class: "ztgc-swatch", type: "button", title: color });
      swatch.dataset.color = color;
      swatch.style.background = color;
      swatch.addEventListener("click", () => setSelectedColor(color));
      palette.append(swatch);
    });

    const customRow = make("div", { class: "ztgc-custom-row" });
    colorInput = make("input", { type: "color", class: "ztgc-color-input", value: PRESETS[0], "aria-label": "Choose custom color" });
    hexInput = make("input", { type: "text", class: "ztgc-hex-input", value: PRESETS[0], maxlength: "7", spellcheck: "false" });
    preview = make("span", { class: "ztgc-preview" });
    preview.style.background = PRESETS[0];
    colorInput.addEventListener("input", () => setSelectedColor(colorInput.value));
    hexInput.addEventListener("change", () => {
      const value = hexInput.value.trim();
      if (validColor(value)) setSelectedColor(value);
      else hexInput.value = colorInput.value.toUpperCase();
    });
    customRow.append(preview, colorInput, hexInput);

    const actions = make("div", { class: "ztgc-actions" });
    const applyBtn = make("button", { class: "ztgc-button primary", type: "button", text: "Apply color" });
    const resetBtn = make("button", { class: "ztgc-button", type: "button", text: "Reset" });
    const cancelBtn = make("button", { class: "ztgc-button", type: "button", text: "Cancel" });
    applyBtn.addEventListener("click", () => {
      if (!activeFolder) return;
      const color = colorInput.value.toUpperCase();
      const map = readMap();
      map[folderId(activeFolder)] = color;
      writeMap(map);
      apply(activeFolder, color);
      panel.hidePopup();
    });
    resetBtn.addEventListener("click", () => {
      if (!activeFolder) return;
      const map = readMap();
      delete map[folderId(activeFolder)];
      writeMap(map);
      apply(activeFolder, null);
      panel.hidePopup();
    });
    cancelBtn.addEventListener("click", () => panel.hidePopup());
    actions.append(applyBtn, resetBtn, cancelBtn);

    wrap.append(heading, subtitle, palette, customRow, actions);
    panel.append(wrap);
    (document.getElementById("mainPopupSet") || document.documentElement).append(panel);
  }

  function openPicker(folder, anchor = folder) {
    if (!folder) return;
    if (!panel) buildPicker();
    activeFolder = folder;
    const saved = readMap()[folderId(folder)] || PRESETS[0];
    setSelectedColor(saved);
    panel.openPopup(anchor || folder, "bottomcenter topleft", 0, 6, false, false);
  }

  // Add a color action to Zen's folder context menu.
  document.addEventListener("popupshowing", (event) => {
    const popup = event.target;
    if (!popup || popup.id !== POPUP_ID) return;
    const trigger = popup.triggerNode;
    const folder = trigger?.closest?.("zen-folder");
    if (!folder) return;
    let item = document.getElementById(MENU_ID);
    if (!item) {
      item = document.createXULElement("menuitem");
      item.id = MENU_ID;
      item.setAttribute("label", "Choose Group Color…");
      item.addEventListener("command", () => openPicker(folder, trigger));
      popup.append(document.createXULElement("menuseparator"), item);
    } else {
      item.oncommand = () => openPicker(folder, trigger);
    }
  }, true);

  // When Zen inserts a new folder into the sidebar, open the picker once.
  // This runs after creation (the native create-folder dialog remains untouched).
  const recentlyPrompted = new WeakSet();
  function watchNewFolders() {
    const root = document.getElementById("tabbrowser-tabs") || document.documentElement;
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes || []) {
          if (!(node instanceof Element)) continue;
          const folders = [];
          if (node.matches?.("zen-folder")) folders.push(node);
          node.querySelectorAll?.("zen-folder").forEach((folder) => folders.push(folder));
          for (const folder of folders) {
            if (recentlyPrompted.has(folder) || readMap()[folder.id]) continue;
            recentlyPrompted.add(folder);
            folderId(folder);
            window.setTimeout(() => {
              if (folder.isConnected) openPicker(folder, folder);
            }, 450);
          }
        }
      }
      applySaved();
    });
    observer.observe(root, { childList: true, subtree: true });
  }

  function init() {
    applySaved();
    watchNewFolders();
    window.addEventListener("SSWindowStateReady", () => applySaved());
  }

  if (document.readyState === "complete") init();
  else window.addEventListener("load", init, { once: true });
})();
