# ForcaNieve - Aragonese Pyrenees Mountain Intelligence Platform

## Requirements Specification

**Version**: 1.0 — Discovery Phase
**Date**: 2026-04-09
**Status**: Draft — Pending stakeholder review

---

## 1. Product Vision

Transform the static, manually-curated "La Meteo del Pirineo Aragones" site into a **modern, automated mountain intelligence platform** for mountaineers and experienced tourists exploring the Aragonese Pyrenees.

**Core value proposition**: A single, beautiful, always-fresh source of weather, snow, avalanche, and route conditions — with personalized email reports powered by AI.

**Language**: Spanish (single-language MVP)

---

## 2. Target Users

| Persona | Description | Key Needs |
|---------|-------------|-----------|
| **Ski tourer** | Experienced backcountry skier planning multi-day trips | Avalanche risk, snow depth by altitude, route conditions |
| **Mountaineer** | Summer/winter peak bagger | Weather windows, wind at altitude, visibility forecasts |
| **Experienced tourist** | Regular Pyrenees visitor, not expert | Zone overview, "is it a good weekend?" summary, resort status |

---

## 3. Functional Requirements

### 3.1 Zone Selector & Interactive Map

**FR-MAP-01**: Interactive map of the Aragonese Pyrenees divided into selectable zones.

**Zones** (initial set, expandable):
- Valle de Ansó / Hecho
- Canfranc / Astún / Candanchú
- Valle de Tena / Formigal-Panticosa
- Ordesa / Monte Perdido / Bujaruelo
- Bielsa / Pineta
- Benasque / Maladeta / Aneto
- Posets / Eriste
- Cerler / Ampriu

**FR-MAP-02**: Clicking a zone opens a detail panel showing all available data for that zone.

**FR-MAP-03**: Map displays color-coded overlays:
- Avalanche risk level (1-5 European scale, color-coded)
- Snow depth gradient
- Weather severity warnings

**FR-MAP-04**: Zone selector also available as a dropdown/list for accessibility and mobile.

### 3.2 Weather Data (Automated)

**FR-WX-01**: 4-day detailed forecast per zone:
- Temperature (min/max at valley + altitude)
- Precipitation (rain/snow line, accumulation)
- Wind speed & direction at altitude
- Cloud cover / visibility
- Freezing level (isoterma 0°C)

**FR-WX-02**: 7-day trend overview (less detail, directional).

**FR-WX-03**: Current conditions from nearest weather stations.

**FR-WX-04**: Severe weather alerts from AEMET warnings system.

**Data sources**:
- **AEMET OpenData API** (primary — Spanish national data, free with API key)
- **Open-Meteo API** (secondary — ECMWF/Meteo-France models, no key needed)

### 3.3 Snow & Avalanche

**FR-SNOW-01**: Snow depth at multiple altitude bands per zone (e.g., 1800m, 2200m, 2600m, 3000m).

**FR-SNOW-02**: Snowfall last 24h / 48h / 7 days.

**FR-SNOW-03**: Avalanche risk level per zone (European 1-5 scale) with:
- Risk level + trend (rising/stable/falling)
- Summary of the bulletin (LLM-generated Spanish summary from Meteo-France BRA)
- Link to full official bulletin

**FR-SNOW-04**: Snow coverage map overlay on the interactive map.

**Data sources**:
- **Meteo-France BRA** (avalanche bulletins, XML — Nov to June)
- **Open-Meteo** (snow depth variable, modeled)
- **AEMET** (snow observations at stations)
- **A Lurte** (regional avalanche bulletins, scraping with permission)

### 3.4 Route Conditions (Light — MVP)

**FR-ROUTE-01**: Curated list of **15-20 popular ski touring / mountaineering routes** per zone.

**FR-ROUTE-02**: Each route displays:
- Name, difficulty grade, altitude range
- Current conditions overlay (snow depth, avalanche risk at that altitude)
- Status badge: "Good conditions" / "Caution" / "Not recommended"
- Brief description

**FR-ROUTE-03**: Routes shown on the map as clickable markers.

**FR-ROUTE-04**: "Route planning" section shows a **"Coming soon"** banner for:
- GPX track upload & display
- User-contributed condition reports
- Detailed route planning with elevation profiles

**Data source**: Manually curated route database (JSON/DB) — your friend's expertise. Conditions auto-calculated from weather + snow data.

### 3.5 LLM-Powered Content & Reports

**FR-LLM-01**: **Homepage daily summary** — LLM generates a natural-language Spanish summary of today's conditions across all zones. Updated every 6-12 hours. Displayed as a hero section.

Example output:
> *"Jornada estable en el Pirineo aragonés con cielos despejados hasta media tarde. Cota de nieve en torno a los 2.400m. Riesgo de aludes notable (3) en orientaciones norte del macizo de la Maladeta. Excelente ventana para ascensiones por vertientes sur."*

**FR-LLM-02**: **Zone detail summaries** — Each zone's detail panel includes an LLM-generated summary specific to that zone.

**FR-LLM-03**: **Subscription email reports** — Personalized summaries (see 3.6).

**LLM provider**: Claude API (Haiku model — cheapest tier, ~$0.25/1M tokens).

**FR-LLM-04**: All LLM-generated content must include a small disclaimer: *"Resumen generado por IA. Consulta siempre las fuentes oficiales antes de salir a la montaña."*

### 3.6 Subscription & Email Reports

**FR-SUB-01**: Users can subscribe by providing:
- Email address
- Selected zones (multi-select from zone list)
- Report frequency: daily / weekly (Monday morning) / on-demand

**FR-SUB-02**: Subscription is **free** (no payment). This is a notification system, not a paywall.

**FR-SUB-03**: Email report contains:
- LLM-generated summary for selected zones
- Key data points (temps, snow, avalanche level)
- Link back to the full zone detail on the website
- Unsubscribe link in every email

**FR-SUB-04**: Users can manage their subscription (change zones, frequency, unsubscribe) via a link in each email or a simple settings page.

**FR-SUB-05**: Magic link authentication (email-only, no password). User receives a login link to manage preferences.

### 3.7 Webcams

**FR-CAM-01**: Webcam gallery organized by zone.

**FR-CAM-02**: Embed existing public webcam feeds (camareando.com, resort cams, refugio cams).

**FR-CAM-03**: Webcam thumbnails visible in zone detail panels.

---

## 4. Non-Functional Requirements

### 4.1 Performance

- **NFR-PERF-01**: Page load under 2 seconds on 4G connection.
- **NFR-PERF-02**: Map interaction responsive (< 200ms for zone click).
- **NFR-PERF-03**: Data cached aggressively — weather updates every 6 hours, not on every page load.

### 4.2 Availability

- **NFR-AVAIL-01**: Target 99% uptime (acceptable for free-tier MVP).
- **NFR-AVAIL-02**: Graceful degradation — if a data source is down, show last cached data with a "last updated" timestamp.

### 4.3 Security

- **NFR-SEC-01**: **No API keys in client-side code**. All secrets in environment variables, accessed only server-side.
- **NFR-SEC-02**: **No hardcoded credentials in the repo**. Use `.env.local` (gitignored) + Vercel/Supabase environment variable management.
- **NFR-SEC-03**: All API calls to external services made server-side (Vercel serverless functions), never from the browser.
- **NFR-SEC-04**: Supabase Row Level Security (RLS) enabled on all tables.
- **NFR-SEC-05**: Rate limiting on subscription endpoints to prevent abuse.
- **NFR-SEC-06**: Input validation and sanitization on all user inputs (email, zone selections).
- **NFR-SEC-07**: HTTPS enforced (Vercel default).
- **NFR-SEC-08**: Content Security Policy headers configured.
- **NFR-SEC-09**: LLM outputs sanitized before rendering (prevent XSS via injected content).
- **NFR-SEC-10**: `.env.example` file with placeholder values committed to repo. Real `.env` files in `.gitignore`.

### 4.4 Privacy & Legal

- **NFR-PRIV-01**: GDPR-compliant cookie banner and privacy policy.
- **NFR-PRIV-02**: Email addresses stored encrypted at rest (Supabase default).
- **NFR-PRIV-03**: Clear data retention policy — unsubscribed users' data deleted after 30 days.
- **NFR-PRIV-04**: Every email includes one-click unsubscribe (CAN-SPAM / GDPR requirement).

### 4.5 Accessibility

- **NFR-A11Y-01**: WCAG 2.1 AA compliance for core content.
- **NFR-A11Y-02**: Keyboard-navigable map alternative (zone list).
- **NFR-A11Y-03**: Color-coded avalanche levels also have text labels (not color-only).

### 4.6 Mobile

- **NFR-MOB-01**: Fully responsive, mobile-first design.
- **NFR-MOB-02**: PWA-ready manifest (installable on home screen) — future enhancement.

---

## 5. Technical Architecture (Recommended)

### 5.1 Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui | v0 generates this stack. SSR for SEO. App Router. |
| **UI generation** | v0 by Vercel | Rapid component prototyping with Apple Weather-style aesthetic |
| **Map** | Mapbox GL JS (free tier: 50K loads/mo) or Leaflet (fully free) | Interactive vector maps with custom zone overlays |
| **Backend / API** | Next.js API Routes (serverless functions) | No separate backend needed. Runs on Vercel. |
| **Database** | Supabase (PostgreSQL) | Free tier: 500MB, auth built-in, RLS, real-time |
| **Auth** | Supabase Auth (magic link) | Email-only auth, no passwords to manage |
| **LLM** | Claude API (Haiku) | Cheapest tier. Spanish language quality is excellent. |
| **Email** | Resend | Free tier: 3,000 emails/mo. Simple API. |
| **Cron / Scheduler** | GitHub Actions | Free for public repos. Triggers data fetch + LLM generation. |
| **Images** | Unsplash API | Free stock photos of Pyrenees for hero/zone backgrounds |
| **Analytics** | GoatCounter (privacy-friendly) or Vercel Analytics | Free, no cookies, GDPR-friendly |

### 5.2 Data Pipeline

```
GitHub Actions (cron: every 6h)
  │
  ├── Fetch AEMET OpenData → Parse → Store in Supabase
  ├── Fetch Open-Meteo → Parse → Store in Supabase
  ├── Fetch Meteo-France BRA XMLs → Parse → Store in Supabase
  └── After all fetches complete:
        └── Call Claude Haiku API → Generate summaries → Store in Supabase
                                                              │
                                                    Next.js reads from Supabase
                                                    (ISR / on-demand revalidation)
```

### 5.3 Email Pipeline

```
GitHub Actions (cron: 7:00 AM daily)
  │
  ├── Query Supabase: users with daily frequency
  ├── For each user:
  │     ├── Gather data for their selected zones
  │     ├── Call Claude Haiku → Generate personalized summary
  │     └── Send via Resend API
  │
  └── Weekly: same flow, Monday 7:00 AM only
```

### 5.4 Hosting — $0/month MVP

| Service | Free Tier Limit | Our Usage (estimated) |
|---------|----------------|----------------------|
| Vercel Hobby | 100GB bandwidth, 1M fn invocations | Well within limits |
| Supabase Free | 500MB DB, 50K MAUs | ~50MB data, <1K users |
| Resend Free | 3,000 emails/mo (100/day) | ~100 daily subscribers max |
| GitHub Actions | Unlimited min (public repo) | ~4 runs/day × 2 min = 8 min |
| Claude Haiku | Pay-per-use (~$0.25/1M tokens) | ~$1-5/month at MVP scale |
| Mapbox Free | 50K map loads/mo | Sufficient for MVP |

**Note**: Claude API is the only non-zero cost (~$1-5/mo). Everything else is genuinely free.

---

## 6. Database Schema (High Level)

```
zones
  - id, name, slug, description, lat, lng, polygon (GeoJSON), image_url

weather_data
  - id, zone_id, timestamp, source, forecast_json, alerts_json

snow_data
  - id, zone_id, timestamp, source, depth_by_altitude_json, snowfall_json

avalanche_data
  - id, zone_id, timestamp, source, risk_level, trend, bulletin_summary, bulletin_url

routes
  - id, zone_id, name, difficulty, altitude_min, altitude_max, description, status_badge, coordinates

llm_summaries
  - id, zone_id (nullable for homepage), type (homepage|zone|email), content, generated_at

subscribers
  - id, email (encrypted), zones (array), frequency, created_at, last_sent_at, unsubscribe_token

webcams
  - id, zone_id, name, embed_url, thumbnail_url
```

---

## 7. UI Wireframe Concepts (for v0 generation)

### Homepage
```
┌──────────────────────────────────────────────┐
│  [Logo: ForcaNieve]          [Suscribirse]   │
├──────────────────────────────────────────────┤
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  Hero: Full-bleed Pyrenees photo       │  │
│  │  "Hoy en el Pirineo Aragonés"          │  │
│  │  [LLM-generated daily summary]         │  │
│  │  Última actualización: 09/04 07:00     │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  Interactive Map                       │  │
│  │  [Zones highlighted with colors]       │  │
│  │  [Click any zone for details]          │  │
│  │                                        │  │
│  │  Zone selector dropdown (mobile alt)   │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│  │Zone 1│ │Zone 2│ │Zone 3│ │Zone 4│  ...   │
│  │Card  │ │Card  │ │Card  │ │Card  │       │
│  │Snow  │ │Snow  │ │Snow  │ │Snow  │       │
│  │Aval. │ │Aval. │ │Aval. │ │Aval. │       │
│  └──────┘ └──────┘ └──────┘ └──────┘       │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │  Webcam Gallery (thumbnails grid)      │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  [Footer: Sources | Privacy | Disclaimer]    │
└──────────────────────────────────────────────┘
```

### Zone Detail (panel/page)
```
┌──────────────────────────────────────────────┐
│  ← Back        Valle de Benasque             │
├──────────────────────────────────────────────┤
│  [Zone hero photo]                           │
│  [LLM zone summary]                          │
│                                              │
│  ┌─ Weather ─────────────────────────────┐   │
│  │ Today | Mañana | +2d | +3d  │ 7d trend│   │
│  │ 🌡️ -2°/8°  ❄️ 2400m  💨 30km/h NW   │   │
│  └───────────────────────────────────────┘   │
│                                              │
│  ┌─ Snow & Avalanche ────────────────────┐   │
│  │ Depth: 1800m→45cm 2200m→120cm 2600m→ │   │
│  │ Risk: ██ 3 Notable (▲ subiendo)       │   │
│  │ "Placas en orientaciones N y NE..."    │   │
│  └───────────────────────────────────────┘   │
│                                              │
│  ┌─ Routes ──────────────────────────────┐   │
│  │ • Canal Roya — ✅ Buenas condiciones  │   │
│  │ • Corredor Estasen — ⚠️ Precaución   │   │
│  │ • Aneto glaciar — ❌ No recomendado   │   │
│  └───────────────────────────────────────┘   │
│                                              │
│  ┌─ Webcams ─────────────────────────────┐   │
│  │ [Renclusa] [Aneto] [Cerler]           │   │
│  └───────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

---

## 8. User Stories & Acceptance Criteria

### US-01: View zone conditions
> As a mountaineer, I want to select a zone on the map and see current weather, snow, and avalanche data so I can plan my outing.

**Acceptance criteria**:
- [ ] Map displays all 8 zones with clickable regions
- [ ] Clicking a zone shows weather (4-day), snow depth, avalanche risk
- [ ] Data is no older than 12 hours
- [ ] Works on mobile (zone list alternative to map)

### US-02: Read daily summary
> As a visitor, I want to see a natural-language summary of today's conditions so I can quickly assess the overall situation.

**Acceptance criteria**:
- [ ] Homepage shows LLM-generated summary in Spanish
- [ ] Summary updated every 6-12 hours
- [ ] Includes disclaimer about AI generation
- [ ] Cites key data points (snow line, risk levels, weather windows)

### US-03: Subscribe to reports
> As a regular visitor, I want to subscribe to email reports for my preferred zones so I receive updates without visiting the site.

**Acceptance criteria**:
- [ ] Can enter email and select zones
- [ ] Can choose daily or weekly frequency
- [ ] Receives magic link to confirm subscription
- [ ] Report contains LLM summary + key data + link to site
- [ ] Can unsubscribe with one click

### US-04: View route conditions
> As a ski tourer, I want to see popular routes with current condition ratings so I can choose a safe objective.

**Acceptance criteria**:
- [ ] At least 15 curated routes across zones
- [ ] Each route shows condition badge (good/caution/not recommended)
- [ ] Badge auto-calculated from snow + avalanche data
- [ ] "Coming soon" banner for advanced route features

### US-05: Check webcams
> As a user, I want to see live webcam feeds for each zone to visually confirm conditions.

**Acceptance criteria**:
- [ ] At least 1 webcam per zone
- [ ] Webcams organized by zone
- [ ] Graceful fallback if a feed is offline

---

## 9. Open Questions (For You & Your Friend)

1. **Route curation**: Can your friend provide the initial list of 15-20 routes with descriptions and difficulty grades? This is the one piece that can't be automated.

2. **Webcam sources**: Which webcam feeds are reliable and embeddable? Need to verify permissions for each.

3. **AEMET API key**: Someone needs to register at opendata.aemet.es (free, instant). Who will do this?

4. **Repo ownership**: Under whose GitHub account? Joint org?

5. **Domain name**: Ideas? (e.g., `forcanieve.com`, `pirineonieves.es`, `meteopirineo.app`)

6. **A Lurte scraping**: Should we contact them about using their data, or rely solely on Meteo-France BRA?

7. **Mapbox vs Leaflet**: Mapbox is prettier but has a usage cap (50K loads/mo). Leaflet is unlimited but less polished. Preference?

8. **LLM tone**: Should the daily summary be formal/technical or conversational? Example styles to review with your friend.

---

## 10. MVP Scope vs Future Roadmap

### MVP (Phase 1)
- [x] Interactive zone map with selector
- [x] Automated weather data (AEMET + Open-Meteo)
- [x] Snow depth + avalanche risk display
- [x] LLM-generated daily summaries (homepage + zones)
- [x] Email subscription system (magic link auth)
- [x] Curated route list with condition badges
- [x] Webcam gallery
- [x] Mobile-responsive design
- [x] GDPR compliance basics

### Phase 2 (Post-MVP)
- [ ] PWA (offline support with cached data)
- [ ] GPX track display on map
- [ ] User-contributed condition reports
- [ ] Push notifications (web push)
- [ ] Multi-language (English, French)
- [ ] Advanced route planning with elevation profiles
- [ ] Historical data & trend charts
- [ ] Social sharing of conditions

### Phase 3 (Growth)
- [ ] Mobile app (React Native)
- [ ] Paid premium tier (extended forecasts, priority alerts)
- [ ] Community features (forums, photo gallery)
- [ ] Integration with Strava / Garmin
- [ ] Ski resort live status dashboard

---

## 11. Next Steps

1. **Review this spec** with your friend — validate zones, routes, data sources
2. **Answer open questions** (Section 9)
3. **Run `/sc:sc-design`** to produce the technical architecture document
4. **Run `/sc:sc-workflow`** to generate the implementation plan with task breakdown
5. **Start building** with v0 for frontend components

---

*This document was produced during a requirements discovery session. It is a living document — update as decisions are made.*
