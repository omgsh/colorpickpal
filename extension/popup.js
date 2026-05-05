// Color Picker Pro — popup logic
// Free: pick + auto-copy + 5 recents + affiliate links + upgrade CTA
// Pro: saved palettes + CSS/SCSS/Tailwind/JSON export + 50-pick history

const WEB_APP_URL = "__WEB_APP_URL__"; // replaced at package time
const VERIFY_ENDPOINT = "__VERIFY_ENDPOINT__"; // replaced at package time

const FREE_HISTORY = 5;
const PRO_HISTORY = 50;

const $ = (id) => document.getElementById(id);

// ---------- storage helpers ----------
const storage = {
  get: (keys) => new Promise((r) => chrome.storage.local.get(keys, r)),
  set: (obj) => new Promise((r) => chrome.storage.local.set(obj, r)),
};

async function ensureInstallId() {
  const { installId } = await storage.get(["installId"]);
  if (installId) return installId;
  const id = crypto.randomUUID();
  await storage.set({ installId: id });
  return id;
}

async function isPro() {
  const { pro } = await storage.get(["pro"]);
  return !!pro;
}

// ---------- color utils ----------
function normalizeHex(h) {
  return h.toUpperCase();
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    flashCopied();
  } catch {
    // fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    flashCopied();
  }
}

function flashCopied() {
  const el = $("copied");
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 1200);
}

// ---------- recents ----------
async function getRecents() {
  const { recents = [] } = await storage.get(["recents"]);
  return recents;
}
async function addRecent(hex) {
  const cap = (await isPro()) ? PRO_HISTORY : FREE_HISTORY;
  let recents = await getRecents();
  recents = [hex, ...recents.filter((c) => c !== hex)].slice(0, cap);
  await storage.set({ recents });
  renderRecents(recents);
}
function renderRecents(recents) {
  const wrap = $("recents");
  wrap.innerHTML = "";
  const cap = recents.length ? Math.min(recents.length, 10) : FREE_HISTORY;
  const slots = Math.max(FREE_HISTORY, cap);
  for (let i = 0; i < slots; i++) {
    const c = recents[i];
    const el = document.createElement("div");
    el.className = "recent-swatch" + (c ? "" : " empty");
    if (c) {
      el.style.background = c;
      el.title = c;
      el.addEventListener("click", () => {
        setCurrent(c, false);
        copyText(c);
      });
    }
    wrap.appendChild(el);
  }
}

// ---------- current color ----------
function setCurrent(hex, save = true) {
  const h = normalizeHex(hex);
  $("swatch").style.background = h;
  $("hex").textContent = h;
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
    const hex = normalizeHex(sRGBHex);
    setCurrent(hex);
    await copyText(hex);
    await addRecent(hex);
    await storage.set({ current: hex });
  } catch {
    /* user cancelled */
  }
}

// ---------- palettes (PRO) ----------
async function getPalettes() {
  const { palettes = [] } = await storage.get(["palettes"]);
  return palettes;
}
async function savePalettes(palettes) {
  await storage.set({ palettes });
}
async function savePaletteFromCurrent() {
  const name = $("paletteName").value.trim();
  if (!name) return;
  const recents = await getRecents();
  const colors = recents.slice(0, 10);
  if (!colors.length) return;
  const palettes = await getPalettes();
  palettes.unshift({ id: crypto.randomUUID(), name, colors, createdAt: Date.now() });
  await savePalettes(palettes);
  $("paletteName").value = "";
  renderPalettes();
}
let activePaletteId = null;
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
        <span class="palette-count">${p.colors.length} colors</span>
      </div>
      <div class="palette-actions">
        <button class="ghost" data-act="use" data-id="${p.id}">${activePaletteId === p.id ? "✓" : "Use"}</button>
        <button class="ghost" data-act="del" data-id="${p.id}">×</button>
      </div>
    `;
    list.appendChild(row);
  });
  list.querySelectorAll("button").forEach((b) => {
    b.addEventListener("click", async (e) => {
      const id = b.dataset.id;
      const act = b.dataset.act;
      if (act === "del") {
        await savePalettes((await getPalettes()).filter((x) => x.id !== id));
        if (activePaletteId === id) activePaletteId = null;
        renderPalettes();
        toggleExport();
      } else {
        activePaletteId = id;
        renderPalettes();
        toggleExport();
      }
    });
  });
  toggleExport();
}
function toggleExport() {
  $("exportRow").style.display = activePaletteId ? "flex" : "none";
}
async function exportActive() {
  const palettes = await getPalettes();
  const p = palettes.find((x) => x.id === activePaletteId);
  if (!p) return;
  const fmt = $("exportFormat").value;
  let out = "";
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (fmt === "css") {
    out = `:root {\n${p.colors.map((c, i) => `  --color-${i + 1}: ${c};`).join("\n")}\n}`;
  } else if (fmt === "scss") {
    out = p.colors.map((c, i) => `$color-${i + 1}: ${c};`).join("\n");
  } else if (fmt === "tailwind") {
    const obj = p.colors.map((c, i) => `    "${slug(p.name)}-${i + 1}": "${c}"`).join(",\n");
    out = `// tailwind.config.js\nmodule.exports = {\n  theme: { extend: { colors: {\n${obj}\n  } } }\n};`;
  } else {
    out = JSON.stringify({ name: p.name, colors: p.colors }, null, 2);
  }
  await copyText(out);
}
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
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
      a.href = l.url;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = l.label;
      wrap.appendChild(a);
    });
  } catch {}
}

// ---------- upgrade / activation ----------
async function openUpgrade() {
  const installId = await ensureInstallId();
  chrome.tabs.create({ url: `${WEB_APP_URL}/upgrade?ext=${installId}` });
}

async function activateLicense() {
  const key = $("licenseKey").value.trim();
  if (!key) return;
  const installId = await ensureInstallId();
  $("error").textContent = "";
  try {
    const res = await fetch(VERIFY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseKey: key, installId }),
    });
    const data = await res.json();
    if (data.valid) {
      await storage.set({ pro: true, licenseKey: key });
      applyProMode(true);
    } else {
      $("error").textContent = "Invalid or already-used license key.";
    }
  } catch {
    $("error").textContent = "Could not verify. Check your connection.";
  }
}

function applyProMode(pro) {
  $("proBadge").classList.toggle("active", pro);
  document.querySelectorAll(".pro-only").forEach((el) => el.classList.toggle("active", pro));
  document.querySelectorAll(".free-only").forEach((el) => el.classList.toggle("hidden", pro));
  if (pro) renderPalettes();
}

// ---------- init ----------
(async function init() {
  await ensureInstallId();
  const { current } = await storage.get(["current"]);
  if (current) setCurrent(current, false);
  renderRecents(await getRecents());
  await renderAffiliates();
  applyProMode(await isPro());

  $("pickBtn").addEventListener("click", pickColor);
  $("hex").addEventListener("click", () => copyText($("hex").textContent));
  $("upgradeBtn").addEventListener("click", openUpgrade);
  $("haveKeyLink").addEventListener("click", () => $("licenseInput").classList.toggle("show"));
  $("activateBtn").addEventListener("click", activateLicense);
  $("savePaletteBtn").addEventListener("click", savePaletteFromCurrent);
  $("exportBtn").addEventListener("click", exportActive);
})();
