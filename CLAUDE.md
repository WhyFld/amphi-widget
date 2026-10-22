# amphi — Storefront widget

The embeddable widget merchants add to their store. Shoppers tap a floating
**coin** to open a popup and respond to a campaign (text / poll / audio / video /
image) in exchange for a reward. Static HTML/JS on Vercel; production domain
**widget.getamphi.com**. Deploy flow: `staging` → `main`.

## Files
- `embed.js` — the script merchants paste
  (`<script src="https://widget.getamphi.com/embed.js?brand_id=..."></script>`).
  Renders the floating **coin launcher** (Three.js r128), fetches the brand's coin
  config, and creates the popup iframe. Honours `window.AMPHI_FORCE_SHOW` (always
  show the coin) and `window.AMPHI_WIDGET_URL` (point at a different widget.html).
- `widget.html` — the popup/response flow (loaded in an iframe). Tailwind (CDN) +
  lamejs. Uploads media to Supabase storage; finalises submissions via the
  dashboard API. Uses Unica77.
- `demo.html` — staging coin **sandbox** (hardcoded test brand, forces the coin).
- `preview.html` — reusable **test storefront**. Loads `/embed.js` *relative* to
  the page, so the same file reflects whichever deployment serves it. Brand from
  `?brand_id=`; coin forced to show (`&force=0` to opt out); `noindex`.
  - LIVE: `https://widget.getamphi.com/preview.html?brand_id=<ID>`
  - STAGING: `https://amphi-widget-git-staging-yannis-projects-79bac4d4.vercel.app/preview.html?brand_id=<ID>`

## Coin personalisation (merchant sets it in the dashboard Personalise tab)
Read from the Supabase anon view `brand_coin_config` (exposes only `coin_theme`,
`coin_copy`, `coin_position` — no PII).
- **Themes** — 10 presets, each a `{face, ink}` pair (face = fill, ink = legible
  contrast text): tuxedo, darth, lime, latte, cheddar, spritz, ribena, greece,
  dollar, donut. ⚠️ The SAME ids + hex values are duplicated in THREE places —
  `embed.js` (`COIN_THEMES`), `widget.html` (`WIDGET_THEMES`), and the dashboard
  presets. Keep all three in sync; adding a colour = one line in each.
- **Position** — `br` (default) / `bm` / `bl` / `brr` (bottom-right raised, `bottom:100px`, to stack above an existing chat/help widget).
- **Copy** — up to 8 chars per line (face top/bottom, back top/bottom).

## Coin → CTA theming (popup matches the coin the shopper tapped)
`embed.js` passes the coin theme into the iframe (`&theme=`). `widget.html`'s
`applyCoinTheme()` resolves it to CSS variables (`--amphi-cta-*`, `--amphi-accent-*`)
and colours the **primary CTA + the accents** (play button, progress fill,
selected-poll ring, waveform).
- **Default + tuxedo + darth = black button / white text / white accents** (a white
  button would vanish on the dark glass; tuxedo is black-and-white, so black fits).
  Coloured themes use their own face/ink.
- The reward subtitle ("Get X% off…") inherits the CTA ink colour (not hardcoded).
- **Scope = only what was lime.** The **red Stop** control and the neutral
  **Retake / back / close** are intentionally left alone.
- Falls back to the black default if `theme` is missing/unknown.
- Caveat: browsers cache `embed.js`, so colour/behaviour changes reach *returning*
  visitors on their next cache refresh; new page loads get it immediately.

## Data / security
One Supabase project, shared by production AND staging. The anon key is public:
shoppers only INSERT submissions (no read). Submissions are finalised server-side
via `dashboard.getamphi.com/api/finalize-submission` (service-role key). The
`brand_coin_config` view exposes only non-sensitive branding.

## Deploy
Commit to `staging` → verify on the staging URLs above → promote to prod: apply the
changed files to `main`, push, then `git branch -f staging main` + force-push
`staging` so the two stay in sync.

## Local preview / testing
Egress to widget.getamphi.com and Supabase is blocked inside the cloud session, so
validate by rendering `widget.html` headless (`playwright-core` + Chromium at
`/opt/pw-browsers/...`) with `?theme=<name>`; the theming runs on load and sets the
CSS vars even without network. Real end-to-end testing happens on the staging/live
URLs in a browser.
