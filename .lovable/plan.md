## Color Picker Pro — Freemium Chrome Extension

A minimalist Chrome extension built around the native EyeDropper API, with a free tier and a one-time **$10 Pro** unlock handled through Lovable's built-in Stripe payments. A small companion web app (this Lovable project) handles the landing page, checkout, and license issuance.

### Extension UX (small square popup, ~300×380px)

Clean, light theme, generous whitespace, rounded corners, subtle shadows.

**Free tier**
- Large **Pick Color** button → `new EyeDropper().open()`
- Current color: large swatch + uppercase hex (click to re-copy)
- Auto-copy hex to clipboard on pick; subtle "Copied!" confirmation
- Recent picks: row of last 5 swatches (click any to copy its hex)
- Affiliate strip near the bottom: 3 small text links (Unsplash, Envato Elements, Creative Market — placeholders the user can swap for real referral URLs)
- Footer: **Upgrade to Pro — $10** button → opens the upgrade page in a new tab

**Pro tier (unlocked after purchase)**
- **Saved palettes**: name a palette, add current/recent colors, view/edit/delete (stored in `chrome.storage.local`)
- **CSS code export**: copy the active palette as CSS custom properties, SCSS variables, Tailwind config snippet, or JSON (format dropdown)
- Recent picks history expanded from 5 → 50, with search
- Affiliate strip hidden
- "Pro" badge in header

### Monetization flow

1. On first run, extension generates a UUID **install-id** in `chrome.storage.local`.
2. **Upgrade to Pro** opens `https://<app>/upgrade?ext=<install-id>` in a new tab.
3. Upgrade page calls a `create-checkout` edge function → Stripe Checkout (one-time $10 USD).
4. Stripe webhook (`stripe-webhook` edge function) records `{ install_id, license_key, stripe_session_id }` in a `licenses` table and marks it paid.
5. Success page displays the license key + a **Copy key** button and clear instructions to paste it into the popup's "Enter license key" field.
6. Extension calls a public `verify-license` edge function with `{ licenseKey, installId }`; on success it caches `pro: true` locally and unlocks Pro UI immediately.

No account or login required — anonymous install-id + license key.

### Companion web app (this Lovable project)

Pages:
- **/** — Landing: hero, screenshots, free vs Pro comparison, **Download Extension** (fetch+blob from `/color-picker.zip`), 4-step install instructions, **Buy Pro** CTA
- **/upgrade** — Reads `?ext=` query, kicks off Stripe Checkout
- **/success** — Post-checkout: shows license key + activation steps

### Files

```
extension/
├── manifest.json        MV3, permissions: ["storage","clipboardWrite"]
├── popup.html
├── popup.js             EyeDropper, clipboard, storage, license check, render
├── pro.js               Palette + export logic (gated)
├── affiliates.json      Editable link list
└── icon.png
public/
└── color-picker.zip     Built via nix zip from extension/
src/pages/
├── Index.tsx            Landing
├── Upgrade.tsx          Checkout entry
└── Success.tsx          License delivery
supabase/functions/
├── create-checkout/     Stripe Checkout session ($10 one-time)
├── stripe-webhook/      checkout.session.completed → write license row
└── verify-license/      Public POST { licenseKey, installId } → { valid }
```

DB (Lovable Cloud): `licenses { id, install_id, license_key, stripe_session_id, created_at }`. Edge functions use the service role; no public RLS access needed.

### Build order

1. Enable **Lovable Cloud** (required for Stripe + DB + edge functions)
2. Run `recommend_payment_provider`, then enable **Stripe** via built-in payments
3. Create the **Color Picker Pro – $10 one-time** product
4. Build extension files, package the zip
5. Build landing/upgrade/success pages and wire checkout + webhook + verify-license
6. QA: pick + auto-copy, Stripe test-mode purchase, license activation round-trip

### Defaults chosen for you

- **Unlock flow:** license key paste (simplest, no login, works offline-first)
- **Pro features:** all four — saved palettes, CSS/SCSS/Tailwind/JSON export, expanded 50-pick history, format toggle + WCAG contrast checker
- **Provider:** Stripe (built-in)
- **Affiliate links:** ship with placeholders; easy to swap later in `affiliates.json`
