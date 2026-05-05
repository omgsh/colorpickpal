// Color Picker Pro — popup logic
// Free: pick + auto-copy + 5 recents + HEX/RGB + affiliate links + upgrade CTA
// Pro: HSL & CMYK, complementary palette, saved palettes, code export, 50 recents

// IMPORTANT: keep this id in sync with background.js (your ExtensionPay extension id)
const EXT_ID = "color-pick-pal";
const extpay = ExtPay(EXT_ID);

const FREE_HISTORY = 5;
const PRO_HISTORY = 50;
const FREE_FORMATS = new Set(["hex", "rgb"]);
const ALL_FORMATS = ["hex", "rgb", "hsl", "cmyk"];

const $ = (id) => document.getElementById(id);

const storage = {
  get: (keys) => new Promise((r) => chrome.storage.local.get(keys, r)),
  set: (obj) => new Promise((r) => chrome.storage.local.set(obj, r)),
};

let state = {
  hex: "#FFFFFF",
  format: "hex",
  pro: false,
};

// ---------- color conversion ----------
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}
function rgbToHex({ r, g, b }) {
  const c = (n) => Math.round(n).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}
function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}
function hslToRgb({ h, s, l }) {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r1 = 0, g1 = 0, b1 = 0;
  if (hp < 1) [r1, g1, b1] = [c, x, 0];
  else if (hp < 2) [r1, g1, b1] = [x, c, 0];
  else if (hp < 3) [r1, g1, b1] = [0, c, x];
  else if (hp < 4) [r1, g1, b1] = [0, x, c];
  else if (hp < 5) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  const m = l - c / 2;
  return { r: (r1 + m) * 255, g: (g1 + m) * 255, b: (b1 + m) * 255 };
}
function rgbToCmyk({ r, g, b }) {
  const rf = r / 255, gf = g / 255, bf = b / 255;
  const k = 1 - Math.max(rf, gf, bf);
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
  return {
    c: ((1 - rf - k) / (1 - k)) * 100,
    m: ((1 - gf - k) / (1 - k)) * 100,
    y: ((1 - bf - k) / (1 - k)) * 100,
    k: k * 100,
  };
}
function formatValue(hex, fmt) {
  const rgb = hexToRgb(hex);
  if (fmt === "hex") return hex.toUpperCase();
  if (fmt === "rgb") return `rgb(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)})`;
  if (fmt === "hsl") {
    const { h, s, l } = rgbToHsl(rgb);
    return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
  }
  if (fmt === "cmyk") {
    const { c, m, y, k } = rgbToCmyk(rgb);
    return `cmyk(${Math.round(c)}%, ${Math.round(m)}%, ${Math.round(y)}%, ${Math.round(k)}%)`;
  }
  return hex;
}

// ---------- complementary generation ----------
function generateComplementary(hex) {
  const rgb = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(rgb);
  const variants = [
    { label: "Comp", h: (h + 180) % 360, s, l },
    { label: "Tri 1", h: (h + 120) % 360, s, l },
    { label: "Tri 2", h: (h + 240) % 360, s, l },
    { label: "Analog", h: (h + 30) % 360, s, l },
    { label: "Shade", h, s, l: Math.max(10, l - 20) },
  ];
  return variants.map((v) => ({ label: v.label, hex: rgbToHex(hslToRgb(v)) }));
}

// ---------- helpers ----------
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); }
  catch {
    const ta = document.createElement("textarea");
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand("copy"); ta.remove();
  }
  flashCopied();
}
function flashCopied() {
  const el = $("copied");
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 1200);
}
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ---------- recents ----------
async function getRecents() {
  const { recents = [] } = await storage.get(["recents"]);
  return recents;
}
async function addRecent(hex) {
  const cap = state.pro ? PRO_HISTORY : FREE_HISTORY;
  let recents = await getRecents();
  recents = [hex, ...recents.filter((c) => c !== hex)].slice(0, cap);
  await storage.set({ recents });
  renderRecents(recents);
}
function renderRecents(recents) {
  const wrap = $("recents");
  wrap.innerHTML = "";
  const cap = state.pro ? Math.max(FREE_HISTORY, recents.length) : FREE_HISTORY;
  $("historyHint").textContent = state.pro ? `${recents.length} / ${PRO_HISTORY}` : `${recents.length} / ${FREE_HISTORY}`;
  for (let i = 0; i < cap; i++) {
    const c = recents[i];
    const el = document.createElement("div");
    el.className = "recent-swatch" + (c ? "" : " empty");
    if (c) {
      el.style.background = c;
      el.title = c;
      el.addEventListener("click", () => { setCurrent(c); copyText(formatValue(c, state.format)); });
    }
    wrap.appendChild(el);
  }
}

// ---------- current ----------
function setCurrent(hex) {
  state.hex = hex.toUpperCase();
  $("swatch").style.background = state.hex;
  $("value").textContent = formatValue(state.hex, state.format);
  storage.set({ current: state.hex });
  if (state.pro) renderComplementary();
}

function renderComplementary() {
  const wrap = $("complementary");
  wrap.innerHTML = "";
  generateComplementary(state.hex).forEach((c) => {
    const el = document.createElement("div");
    el.className = "comp-swatch";
    el.style.background = c.hex;
    el.title = `${c.label}: ${c.hex}`;
    const lbl = document.createElement("span");
    lbl.className = "comp-label";
    lbl.textContent = c.label;
    el.appendChild(lbl);
    el.addEventListener("click", () => {
      setCurrent(c.hex);
      copyText(formatValue(c.hex, state.format));
      addRecent(c.hex);
    });
    wrap.appendChild(el);
  });
}

// ---------- pick ----------
async function pickColor() {
  if (!("EyeDropper" in window)) {
    $("error").textContent = "EyeDropper not supported in this browser.";
    return;
  }
  $("error").textContent = "";
  try {
    const ed = new EyeDropper();
    const { sRGBHex } = await ed.open();
    const hex = sRGBHex.toUpperCase();
    setCurrent(hex);
    await copyText(formatValue(hex, state.format));
    await addRecent(hex);
  } catch { /* cancelled */ }
}

// ---------- format toggle ----------
function setFormat(fmt) {
  if (!state.pro && !FREE_FORMATS.has(fmt)) {
    extpay.openPaymentPage();
    return;
  }
  state.format = fmt;
  $("formatToggle").querySelectorAll("button").forEach((b) => {
    b.classList.toggle("active", b.dataset.fmt === fmt);
  });
  $("value").textContent = formatValue(state.hex, fmt);
  storage.set({ format: fmt });
}

// ---------- palettes (PRO) ----------
let activePaletteId = null;
async function getPalettes() { return (await storage.get(["palettes"])).palettes || []; }
async function savePalettes(p) { await storage.set({ palettes: p }); }
async function savePaletteFromRecents() {
  const name = $("paletteName").value.trim();
  if (!name) return;
  const recents = await getRecents();
  const colors = recents.slice(0, 10);
  if (!colors.length) return;
  const palettes = await getPalettes();
  palettes.unshift({ id: crypto.randomUUID(), name, colors });
  await savePalettes(palettes);
  $("paletteName").value = "";
  renderPalettes();
}
async function renderPalettes() {
  const palettes = await getPalettes();
  const list = $("paletteList");
  list.innerHTML = "";
  palettes.forEach((p) => {
    const row = document.createElement("div");
    row.className = "palette-item";
    row.innerHTML = `
      <div>
        <span class="palette-name">${escapeHtml(p.name)}</span>
        <span class="palette-count">${p.colors.length}</span>
      </div>
      <div class="palette-actions">
        <button class="ghost" data-act="use" data-id="${p.id}">${activePaletteId === p.id ? "✓" : "Use"}</button>
        <button class="ghost" data-act="del" data-id="${p.id}">×</button>
      </div>`;
    list.appendChild(row);
  });
  list.querySelectorAll("button").forEach((b) => {
    b.addEventListener("click", async () => {
      const id = b.dataset.id, act = b.dataset.act;
      if (act === "del") {
        await savePalettes((await getPalettes()).filter((x) => x.id !== id));
        if (activePaletteId === id) activePaletteId = null;
      } else {
        activePaletteId = id;
      }
      renderPalettes();
      $("exportRow").style.display = activePaletteId ? "flex" : "none";
    });
  });
}
async function exportActive() {
  const palettes = await getPalettes();
  const p = palettes.find((x) => x.id === activePaletteId);
  if (!p) return;
  const fmt = $("exportFormat").value;
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  let out = "";
  if (fmt === "css") out = `:root {\n${p.colors.map((c, i) => `  --color-${i + 1}: ${c};`).join("\n")}\n}`;
  else if (fmt === "scss") out = p.colors.map((c, i) => `$color-${i + 1}: ${c};`).join("\n");
  else if (fmt === "tailwind") {
    const obj = p.colors.map((c, i) => `      "${slug(p.name)}-${i + 1}": "${c}"`).join(",\n");
    out = `// tailwind.config.js\nmodule.exports = {\n  theme: { extend: { colors: {\n${obj}\n  } } }\n};`;
  } else out = JSON.stringify({ name: p.name, colors: p.colors }, null, 2);
  await copyText(out);
}

// ---------- affiliates ----------
async function renderAffiliates() {
  try {
    const res = await fetch(chrome.runtime.getURL("affiliates.json"));
    const links = await res.json();
    const wrap = $("affiliates");
    wrap.innerHTML = "";
    links.forEach((l) => {
      const a = document.createElement("a");
      a.href = l.url; a.target = "_blank"; a.rel = "noopener";
      a.textContent = l.label; wrap.appendChild(a);
    });
  } catch { }
}

// ---------- pro mode ----------
function applyProMode(pro) {
  state.pro = pro;
  $("proBadge").classList.toggle("active", pro);
  document.querySelectorAll(".pro-only").forEach((el) => el.classList.toggle("active", pro));
  document.querySelectorAll(".free-only").forEach((el) => el.classList.toggle("hidden", pro));
  $("manageLink").style.display = pro ? "block" : "none";
  // unlock format buttons
  $("formatToggle").querySelectorAll("button").forEach((b) => {
    b.classList.toggle("locked", !pro && !FREE_FORMATS.has(b.dataset.fmt));
  });
  if (pro) {
    renderPalettes();
    renderComplementary();
  }
  // adjust history
  getRecents().then(renderRecents);
}

// ---------- ExtensionPay integration ----------
async function checkPro() {
  try {
    const user = await extpay.getUser();
    return !!user.paid;
  } catch (e) {
    console.warn("ExtPay error", e);
    return false;
  }
}

// ---------- init ----------
(async function init() {
  const { current, format } = await storage.get(["current", "format"]);
  if (current) state.hex = current;
  if (format) state.format = format;

  setCurrent(state.hex);
  setFormat(state.format && (state.pro || FREE_FORMATS.has(state.format)) ? state.format : "hex");
  await renderAffiliates();

  // Initial render assuming free; flip to pro once ExtPay responds.
  applyProMode(false);
  const isPro = await checkPro();
  if (isPro) applyProMode(true);

  $("pickBtn").addEventListener("click", pickColor);
  $("value").addEventListener("click", () => copyText($("value").textContent));
  $("upgradeBtn").addEventListener("click", () => extpay.openPaymentPage());
  $("manageLink").addEventListener("click", () => extpay.openPaymentPage());
  $("savePaletteBtn").addEventListener("click", savePaletteFromRecents);
  $("exportBtn").addEventListener("click", exportActive);
  $("formatToggle").querySelectorAll("button").forEach((b) => {
    b.addEventListener("click", () => setFormat(b.dataset.fmt));
  });

  // Listen for payment events while popup is open
  extpay.onPaid.addListener(() => applyProMode(true));
})();
