# ForcaNieve - Implementation Workflow

**Version**: 1.0
**Date**: 2026-04-09
**Based on**: [REQUIREMENTS.md](REQUIREMENTS.md) | [ARCHITECTURE.md](ARCHITECTURE.md)

---

## Overview

6 phases, 34 tasks, estimated 4-5 focused work sessions per phase.
Each phase has a **checkpoint** — a concrete "it works" milestone before moving on.

```
Phase 0: Project Bootstrap          ██░░░░░░░░░░  Setup
Phase 1: Data Layer                 ████░░░░░░░░  Backend core
Phase 2: Data Pipeline              ██████░░░░░░  Automation
Phase 3: Frontend Core              ████████░░░░  UI
Phase 4: Subscriptions & Email      ██████████░░  Feature
Phase 5: Polish & Deploy            ████████████  Ship
```

---

## Dependency Graph

```
Phase 0 ──► Phase 1 ──► Phase 2 ──┐
                                    ├──► Phase 5
             Phase 1 ──► Phase 3 ──┤
                                    │
                         Phase 4 ◄──┘
                           │
                           ▼
                        Phase 5
```

- Phase 1 (DB) must complete before Phase 2 (pipeline) or Phase 3 (frontend)
- Phase 2 and Phase 3 can run **in parallel** (great for collaborating with your friend)
- Phase 4 (subscriptions) needs Phase 3 (frontend forms) + Phase 2 (data to send)
- Phase 5 (polish) is the final pass

---

## Phase 0: Project Bootstrap

**Goal**: Repo created, dev environment running, all services connected.

| # | Task | Details | Depends On |
|---|------|---------|------------|
| 0.1 | Create GitHub repo | `forcanieve` — public repo, MIT license, `.gitignore` for Node/Next.js | — |
| 0.2 | Initialize Next.js 15 project | `npx create-next-app@latest` with TypeScript, Tailwind, App Router, ESLint | 0.1 |
| 0.3 | Install core dependencies | `shadcn/ui`, `zod`, `@supabase/supabase-js`, `@supabase/ssr`, `lucide-react` | 0.2 |
| 0.4 | Create Supabase project | Free tier, region EU (Frankfurt). Save project URL + anon key + service role key | — |
| 0.5 | Configure environment variables | `.env.local` with all keys, `.env.example` with placeholders, verify `.gitignore` | 0.2, 0.4 |
| 0.6 | Register for external API keys | AEMET OpenData (instant), Anthropic API, Resend, Mapbox (if chosen) | — |
| 0.7 | Set up Supabase clients | `lib/supabase/client.ts`, `server.ts`, `admin.ts` per architecture doc | 0.4, 0.5 |
| 0.8 | Deploy to Vercel | Connect GitHub repo, set env vars in Vercel dashboard, confirm deployment works | 0.2, 0.5 |

### Checkpoint 0
- [ ] `npm run dev` runs locally
- [ ] Vercel deployment shows the default Next.js page
- [ ] Supabase dashboard accessible
- [ ] `.env.example` committed, `.env.local` gitignored
- [ ] **No secrets in the repo** (verify with `git log --diff-filter=A -- .env*`)

---

## Phase 1: Data Layer (Database + Seed Data)

**Goal**: All tables created, seed data loaded, RLS active, API routes return data.

| # | Task | Details | Depends On |
|---|------|---------|------------|
| 1.1 | Create Supabase migrations | All 8 tables from ARCHITECTURE.md Section 3 — zones, weather_data, snow_data, avalanche_data, routes, llm_summaries, subscribers, webcams | 0.4 |
| 1.2 | Enable RLS + create policies | Public read on data tables, zero public access on subscribers | 1.1 |
| 1.3 | Create `zone_latest_data` view | Convenience view joining latest data per zone | 1.1 |
| 1.4 | Create cleanup function | `cleanup_expired_data()` SQL function | 1.1 |
| 1.5 | Seed zones table | 8 zones with name, slug, lat/lng, GeoJSON polygons, Unsplash image URLs | 1.1 |
| 1.6 | Seed routes table | 15-20 curated routes (placeholder data, friend fills in real data later) | 1.1 |
| 1.7 | Seed webcams table | Known webcam URLs per zone (Renclusa, resort cams, etc.) | 1.1 |
| 1.8 | Create TypeScript types | `types/zone.ts`, `weather.ts`, `snow.ts`, `avalanche.ts`, `route.ts`, `subscription.ts`, `api.ts` | 0.2 |
| 1.9 | Build API route: `GET /api/zones` | Returns all zones with latest summary data from view | 1.3, 1.8 |
| 1.10 | Build API route: `GET /api/weather/[zoneId]` | Returns 4-day forecast + 7-day trend + alerts | 1.1, 1.8 |
| 1.11 | Build API route: `GET /api/snow/[zoneId]` | Returns snow depth + avalanche + routes with condition badges | 1.1, 1.8 |
| 1.12 | Build route condition engine | `lib/routes/condition-engine.ts` — auto-calculate good/caution/not_recommended | 1.8 |
| 1.13 | Build input validators | `lib/validators/subscription.ts` + `common.ts` with Zod schemas | 0.3 |

### Checkpoint 1
- [ ] All tables visible in Supabase dashboard
- [ ] 8 zones seeded with real coordinates and GeoJSON
- [ ] `curl localhost:3000/api/zones` returns zone data
- [ ] `curl localhost:3000/api/weather/<id>` returns (empty for now, structure correct)
- [ ] `curl localhost:3000/api/snow/<id>` returns routes with condition badges
- [ ] RLS verified: anon client cannot read `subscribers` table

---

## Phase 2: Data Pipeline (Automated Fetching + LLM)

**Goal**: External data flowing in automatically, LLM summaries generating.

| # | Task | Details | Depends On |
|---|------|---------|------------|
| 2.1 | Build AEMET client | `lib/data-sources/aemet.ts` — fetch forecasts + alerts per zone. Handle AEMET's two-step API (request URL → fetch data URL). | 0.6, 1.8 |
| 2.2 | Build Open-Meteo client | `lib/data-sources/open-meteo.ts` — fetch hourly forecast, snow depth, wind. No API key needed. Map coordinates to zones. | 1.8 |
| 2.3 | Build Meteo-France BRA parser | `lib/data-sources/meteo-france.ts` — download BRA XML bulletins, parse XML, extract risk level + aspects + altitude bands. Map French massif names to our zones. | 1.8 |
| 2.4 | Build data normalizer | Merge data from multiple sources using priority matrix (ARCHITECTURE.md §5.2). Resolve conflicts. | 2.1, 2.2, 2.3 |
| 2.5 | Build Claude Haiku client | `lib/llm/client.ts` — wrapper with retry, token counting, error handling. | 0.6 |
| 2.6 | Create LLM prompt templates | `lib/llm/prompts.ts` — system prompt + homepage/zone/email/BRA prompts per ARCHITECTURE.md §7.1 | 2.5 |
| 2.7 | Build LLM output sanitizer | `lib/llm/sanitize.ts` — strip HTML, remove links, cap length | 2.5 |
| 2.8 | Build orchestrator script | `scripts/fetch-all-data.ts` — runs all fetchers in parallel, normalizes, stores in Supabase, then generates LLM summaries | 2.4, 2.6, 2.7 |
| 2.9 | Create GitHub Actions workflow | `.github/workflows/data-fetch.yml` — cron every 6h, calls orchestrator script | 2.8 |
| 2.10 | Create cleanup workflow | `.github/workflows/cleanup.yml` — daily, calls `cleanup_expired_data()` | 1.4 |
| 2.11 | Test pipeline end-to-end | Run `fetch-all-data.ts` manually, verify data appears in Supabase, verify LLM summaries generated | 2.8 |

### Checkpoint 2
- [ ] `npx tsx scripts/fetch-all-data.ts` completes without errors
- [ ] Supabase `weather_data` table has records for all 8 zones
- [ ] Supabase `snow_data` table has depth data
- [ ] Supabase `avalanche_data` table has risk levels (during winter season)
- [ ] Supabase `llm_summaries` has 1 homepage + 8 zone summaries
- [ ] LLM summaries are in Spanish, sensible, and include real data points
- [ ] GitHub Actions workflow runs on schedule (verify in Actions tab)
- [ ] API routes now return real data

---

## Phase 3: Frontend Core (UI + Map + Pages)

**Goal**: Beautiful, functional website displaying all data. No subscription yet.

**Strategy**: Generate component shells in v0 first, then wire them to real data.

| # | Task | Details | Depends On |
|---|------|---------|------------|
| 3.1 | Generate layout in v0 | Header + Footer + MobileNav. Apple Weather style, white/gray, Inter font. Prompt v0 with design tokens from ARCHITECTURE.md §10.3 | 0.3 |
| 3.2 | Generate HeroSummary in v0 | Full-bleed Pyrenees photo, glass-morphism overlay, daily summary text, timestamp. | 3.1 |
| 3.3 | Generate ZoneCard + grid in v0 | Card with thumbnail, zone name, avalanche badge, snow bar, temp range. Responsive 2-col mobile / 4-col desktop grid. | 3.1 |
| 3.4 | Generate WeatherForecast in v0 | Horizontal scroll 4-day cards (icon, temp, snow line, wind). 7-day sparkline trend. | 3.1 |
| 3.5 | Generate SnowPanel + AvalanchePanel in v0 | Snow depth altitude chart (horizontal bars). Avalanche risk badge (large) + trend + summary text. | 3.1 |
| 3.6 | Generate RouteList in v0 | Route cards with name, difficulty, altitude, condition badge (color-coded). | 3.1 |
| 3.7 | Create shared components | `AvalancheRiskBadge`, `ConditionBadge`, `LastUpdated`, `AiDisclaimer`, `CookieBanner` — small utility components | 3.1 |
| 3.8 | Build interactive map | `PyreneeMap.tsx` with Mapbox GL or Leaflet. Load `pyrenees-zones.geojson`. Clickable zone polygons, color overlays, tooltips. `ZoneSelector` dropdown for mobile. | 0.6, 1.5 |
| 3.9 | Create GeoJSON file | `public/geojson/pyrenees-zones.geojson` — polygon boundaries for 8 zones. Source from OpenStreetMap / manual drawing. | 1.5 |
| 3.10 | Wire homepage | Assemble: HeroSummary → Map → ZoneCardGrid → WebcamPreview. Fetch data from `/api/zones` with ISR (revalidate 1800s). | 3.2-3.8, 1.9 |
| 3.11 | Wire zone detail page | `/zona/[slug]` — ZoneHeader + WeatherForecast + SnowPanel + AvalanchePanel + RouteList + WebcamGallery. Fetch from `/api/weather/[id]` + `/api/snow/[id]`. | 3.4-3.6, 1.10, 1.11 |
| 3.12 | Build webcams page | `/webcams` — grid of all webcams grouped by zone. Embed iframes or image refreshes. | 1.7 |
| 3.13 | Create privacy page | `/privacidad` — static GDPR privacy policy in Spanish | — |
| 3.14 | Configure security headers | `next.config.ts` — CSP, X-Frame-Options, X-Content-Type-Options per ARCHITECTURE.md §9.2 | 3.10 |
| 3.15 | Add analytics | GoatCounter or Vercel Analytics — privacy-friendly, no cookies | 3.10 |

### Checkpoint 3
- [ ] Homepage loads with hero summary, map, zone cards
- [ ] Clicking a zone on the map navigates to `/zona/[slug]`
- [ ] Zone detail page shows weather forecast, snow data, avalanche risk, routes
- [ ] Route condition badges auto-calculate correctly
- [ ] LLM summaries display with AI disclaimer
- [ ] Webcams page shows embedded feeds
- [ ] Mobile responsive (test on phone or DevTools)
- [ ] Lighthouse score: Performance > 85, Accessibility > 90
- [ ] Security headers present (check with securityheaders.com)

---

## Phase 4: Subscriptions & Email

**Goal**: Users can subscribe, verify, receive reports, and unsubscribe.

| # | Task | Details | Depends On |
|---|------|---------|------------|
| 4.1 | Build subscribe API | `POST /api/subscribe` — validate with Zod, rate limit, insert subscriber, generate verify token, send magic link email | 1.2, 1.13 |
| 4.2 | Build verify API | `GET /api/subscribe/verify?token=xxx` — verify token, activate subscriber, redirect | 4.1 |
| 4.3 | Build unsubscribe API | `GET /api/unsubscribe?token=xxx` — deactivate subscriber, redirect | 1.2 |
| 4.4 | Build subscription update API | `PUT /api/subscription` — update zones + frequency (requires verified session) | 4.2 |
| 4.5 | Build rate limiter | `lib/utils/rate-limit.ts` — per-email + per-IP rate limiting for subscribe endpoint | — |
| 4.6 | Create email templates | React Email: `MagicLink.tsx`, `Welcome.tsx`, `DailyReport.tsx`, `WeeklyReport.tsx` — branded, mobile-responsive, with unsubscribe link | — |
| 4.7 | Build email sending logic | `scripts/send-daily-emails.ts` + `send-weekly-emails.ts` — query subscribers, generate LLM summaries per user, send via Resend, respect 100/day limit | 2.5, 2.6, 4.6 |
| 4.8 | Create email GitHub Actions | `.github/workflows/email-daily.yml` (07:00 CET) + `email-weekly.yml` (Mon 07:00 CET) | 4.7 |
| 4.9 | Generate subscription form in v0 | Email input + zone multi-select checkboxes + frequency radio + submit. Clean, minimal. | 3.1 |
| 4.10 | Build subscription page | `/suscripcion` — wire form to `POST /api/subscribe`, show success/error states | 4.1, 4.9 |
| 4.11 | Build manage preferences page | `/suscripcion/gestionar` — load current prefs via verified session, allow edits, save via `PUT /api/subscription` | 4.4, 4.9 |
| 4.12 | Add subscribe CTA to header/hero | "Suscribirse" button in header, optional CTA in hero section | 3.1, 4.10 |

### Checkpoint 4
- [ ] Can fill in subscription form and submit
- [ ] Receive magic link email within 30 seconds
- [ ] Clicking magic link verifies and redirects to manage page
- [ ] Can edit zones and frequency on manage page
- [ ] Manually trigger `send-daily-emails.ts` — receive personalized report
- [ ] Report contains correct data for selected zones
- [ ] Unsubscribe link works in one click
- [ ] Rate limiting blocks repeated subscribe attempts
- [ ] Unverified subscriptions cleaned up after 48h (test cleanup function)

---

## Phase 5: Polish & Ship

**Goal**: Production-ready MVP. Everything tested, documented, deployed.

| # | Task | Details | Depends On |
|---|------|---------|------------|
| 5.1 | Error handling pass | Ensure graceful degradation on all pages when data is missing/stale. Add "last updated" warnings. Loading skeletons. | 3.10, 3.11 |
| 5.2 | Mobile QA | Test every page on real mobile device. Fix layout issues. Test zone selector (mobile map alternative). | 3.10 |
| 5.3 | Accessibility audit | Run axe-core or Lighthouse accessibility. Fix color contrast, ARIA labels, keyboard navigation. Ensure avalanche badges have text labels. | 3.10 |
| 5.4 | GDPR compliance | Cookie banner functional + saves preference. Privacy policy complete. Unsubscribe deletes data after 30d (verify cleanup job). | 3.13, 4.3 |
| 5.5 | SEO optimization | Meta tags, Open Graph images, structured data (JSON-LD for weather), sitemap.xml, robots.txt | 3.10 |
| 5.6 | Performance optimization | Image optimization (next/image, WebP), code splitting, ISR tuning, Lighthouse performance > 90 | 3.10 |
| 5.7 | Set up monitoring | UptimeRobot for homepage. Verify GitHub Actions failure notifications work. | 0.8 |
| 5.8 | Write README | Setup instructions, env vars list, architecture overview, contribution guide, data source attributions | All |
| 5.9 | Final security review | Verify: no secrets in repo, CSP headers correct, RLS active, rate limits working, LLM output sanitized | All |
| 5.10 | Production deploy | Merge to main, verify Vercel production deployment, run data pipeline once, confirm everything works live | All |

### Checkpoint 5 (SHIP IT)
- [ ] All pages render correctly on desktop + mobile
- [ ] Data pipeline running on schedule (check GitHub Actions history)
- [ ] Subscription flow works end-to-end in production
- [ ] Email reports delivering correctly
- [ ] No secrets in Git history
- [ ] Lighthouse: Performance > 85, Accessibility > 90, SEO > 90
- [ ] UptimeRobot monitoring active
- [ ] README complete
- [ ] **Share the URL!**

---

## Parallel Work Strategy

If you and your friend want to work simultaneously:

```
You (Frontend)                    Friend (Backend/Data)
─────────────────                 ─────────────────────
Phase 0 (together)                Phase 0 (together)
        │                                 │
        ▼                                 ▼
Phase 3: Frontend Core            Phase 1: Data Layer
  - v0 component generation         - Supabase migrations
  - Map integration                  - Zone/route seed data
  - Page assembly                    - API routes
        │                                 │
        │                                 ▼
        │                         Phase 2: Data Pipeline
        │                           - API clients
        │                           - LLM integration
        │                           - GitHub Actions
        │                                 │
        ▼                                 ▼
Phase 4 (together): Subscriptions & Email
        │
        ▼
Phase 5 (together): Polish & Ship
```

**Integration points** (sync up here):
1. After Phase 1: agree on API response shapes (TypeScript types)
2. After Phase 2 + Phase 3: wire real data into frontend components
3. After Phase 4: end-to-end testing of subscription flow

---

## Risk Register

| Risk | Impact | Probability | Mitigation |
|------|--------|------------|------------|
| AEMET API unreliable/slow | Data gaps | Medium | Open-Meteo as primary fallback, aggressive caching |
| Meteo-France BRA format changes | Avalanche data breaks | Low | Monitor with error alerts, keep last-good data |
| Resend 100/day limit too low | Can't send all daily reports | Low (MVP) | Batch across time slots, migrate to SES at scale |
| Supabase free tier pauses | Site goes down | Medium | GitHub Actions cron keeps it active via scheduled API calls |
| GeoJSON zone boundaries inaccurate | Bad UX on map | Medium | Start with approximate boundaries, refine iteratively |
| LLM generates wrong/dangerous info | Safety liability | Low | Disclaimer on ALL AI content, link to official sources |
| Claude API cost spike | Budget overrun | Low | Set Anthropic API spend limit ($10/mo), monitor usage |
| Mapbox 50K load cap hit | Map stops working | Low (MVP) | Monitor usage, switch to Leaflet if needed |

---

## v0 Prompt Templates

Ready-to-paste prompts for v0 component generation.

### Prompt 1: Layout Shell
```
Create a clean, minimal website layout in Next.js App Router with:
- Header: logo text "ForcaNieve" on the left, navigation links
  (Zonas, Webcams, Suscripción) in the center, and a "Suscribirse"
  button on the right
- Footer: three columns - data sources attribution, privacy policy link,
  AI disclaimer text
- Mobile: hamburger menu for navigation
- Style: Apple Weather inspired. White background, subtle gray sections,
  Inter font, rounded corners, generous spacing
- Use shadcn/ui components and Tailwind CSS
- Language: all text in Spanish
```

### Prompt 2: Hero Summary
```
Create a hero section component with:
- Full-width background image (accept imageUrl prop)
- Glass-morphism overlay card centered on the image
- Title "Hoy en el Pirineo Aragonés" in large text
- A paragraph of summary text below (accept text prop)
- Small "Última actualización: 09/04/2026 07:00" timestamp
- Small italic disclaimer text at the bottom
- Responsive: full-bleed on all screens
- Style: Apple Weather feel, clean white text on dark overlay
- Use shadcn/ui Card with backdrop-blur
```

### Prompt 3: Zone Cards
```
Create a zone card grid component:
- Each card shows: zone image thumbnail (top), zone name,
  avalanche risk badge (colored circle with number 1-5),
  snow depth indicator bar, temperature range text
- Grid: 1 column on mobile, 2 on tablet, 4 on desktop
- Cards are clickable (accept href prop)
- Hover effect: subtle lift shadow
- Avalanche colors: 1=green, 2=yellow, 3=orange, 4=red, 5=black
- Style: white cards, rounded-xl, subtle shadow
- Use shadcn/ui Card, Badge components
- All text in Spanish
```

### Prompt 4: Weather Forecast
```
Create a 4-day weather forecast component:
- Horizontal scrollable row of day cards
- Each card: day name, weather icon area, temperature range
  (valley + altitude), snow line in meters, wind speed + direction,
  freezing level
- Below the cards: a 7-day trend section with simple
  up/down/stable indicators
- Style: clean, minimal, Apple Weather inspired
- Use shadcn/ui Card, Tabs for day selection on mobile
- All text and day names in Spanish
```

### Prompt 5: Snow & Avalanche Panels
```
Create two side-by-side panel components:

Snow Panel:
- Horizontal bar chart showing snow depth at 4 altitude bands
  (1800m, 2200m, 2600m, 3000m)
- Below: snowfall summary (last 24h, 48h, 7 days) in cm
- Clean visualization, no external chart library (use Tailwind widths)

Avalanche Panel:
- Large risk level badge (number 1-5 with color background)
- Trend indicator arrow (up/stable/down) with text
- Bulletin summary text (2-3 sentences)
- "Ver boletín oficial" link
- Colors: 1=green #059669, 2=yellow #F59E0B, 3=orange #EA580C,
  4=red #DC2626, 5=black/red

Style: Apple Weather, white cards, rounded-xl
Use shadcn/ui components. Spanish text.
```

### Prompt 6: Subscription Form
```
Create a subscription form component:
- Email input field with validation
- Multi-select zone checkboxes (8 zones with mountain names)
- Radio group for frequency: "Diario" or "Semanal (lunes)"
- Submit button "Suscribirse"
- Success state: green message "Te hemos enviado un enlace
  de verificación"
- Error state: red message with error text
- Style: clean form, generous spacing, Apple Weather minimal feel
- Use shadcn/ui Input, Checkbox, RadioGroup, Button, Alert
- All text in Spanish
```

---

## Quick Reference: Key Commands

```bash
# Local development
npm run dev                              # Start Next.js dev server

# Supabase
npx supabase db push                     # Apply migrations locally
npx supabase db push --linked            # Apply to production

# Data pipeline (manual run)
npx tsx scripts/fetch-all-data.ts        # Fetch data + generate summaries
npx tsx scripts/send-daily-emails.ts     # Send daily reports

# Deployment
git push origin main                     # Auto-deploys to Vercel

# Verify security
git log --diff-filter=A -- '*.env*'      # Check no env files committed
```

---

## Estimated Token/Cost Budget (Monthly)

| Item | Estimated Usage | Cost |
|------|----------------|------|
| Claude Haiku — data summaries | ~300K tokens/day | ~$2.25/mo |
| Claude Haiku — email reports | ~100 emails × 2.3K tokens | ~$0.15/mo |
| Vercel | Well within free tier | $0 |
| Supabase | ~50MB of 500MB | $0 |
| Resend | ~100-200 emails of 3,000/mo | $0 |
| GitHub Actions | ~8 min/day of unlimited | $0 |
| Mapbox | ~1K-5K loads of 50K/mo | $0 |
| **Total** | | **~$2.50/mo** |

---

## Next Steps

1. **Answer open questions** from [REQUIREMENTS.md §9](REQUIREMENTS.md) (especially: routes, webcams, repo ownership)
2. **Start Phase 0** — create repo, initialize project, set up services
3. **Run `/sc:sc-implement`** when ready to begin coding phase by phase

---

*This workflow plan is designed for the requirements and architecture defined in the companion documents. Execute with `/sc:sc-implement` or work through phases manually.*
