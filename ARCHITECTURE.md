# ForcaNieve - Technical Architecture Document

**Version**: 1.0
**Date**: 2026-04-09
**Status**: Design Phase
**Based on**: [REQUIREMENTS.md](REQUIREMENTS.md)

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                         │
│  │ Desktop  │  │  Mobile  │  │  Email   │                         │
│  │ Browser  │  │  Browser │  │  Client  │                         │
│  └────┬─────┘  └────┬─────┘  └──────────┘                         │
│       │              │              ▲                               │
└───────┼──────────────┼──────────────┼───────────────────────────────┘
        │              │              │
        ▼              ▼              │
┌───────────────────────────┐        │
│      VERCEL (Edge)        │        │
│  ┌─────────────────────┐  │        │
│  │   Next.js 15 App    │  │        │
│  │   (App Router)      │  │        │
│  │                     │  │        │
│  │  ┌───────────────┐  │  │        │
│  │  │  Pages (SSR)  │  │  │        │
│  │  │  /            │  │  │        │
│  │  │  /zona/[slug] │  │  │        │
│  │  │  /suscripcion │  │  │        │
│  │  │  /webcams     │  │  │        │
│  │  └───────────────┘  │  │        │
│  │                     │  │        │
│  │  ┌───────────────┐  │  │        │
│  │  │  API Routes   │  │  │        │
│  │  │  (Serverless) │──┼──┼────────┘ (triggers Resend)
│  │  └──────┬────────┘  │  │
│  └─────────┼───────────┘  │
│            │              │
└────────────┼──────────────┘
             │
             ▼
┌────────────────────────────┐     ┌──────────────────────────────┐
│      SUPABASE              │     │     EXTERNAL SERVICES        │
│  ┌──────────────────────┐  │     │                              │
│  │  PostgreSQL (500MB)  │  │     │  ┌────────┐ ┌────────────┐  │
│  │  + Row Level Security│  │     │  │ AEMET  │ │ Open-Meteo │  │
│  └──────────────────────┘  │     │  │OpenData│ │    API     │  │
│  ┌──────────────────────┐  │     │  └────────┘ └────────────┘  │
│  │  Auth (Magic Link)   │  │     │  ┌────────────┐ ┌────────┐ │
│  └──────────────────────┘  │     │  │Meteo-France│ │ Claude │ │
│  ┌──────────────────────┐  │     │  │  BRA XML   │ │ Haiku  │ │
│  │  Storage (images)    │  │     │  └────────────┘ └────────┘ │
│  └──────────────────────┘  │     │  ┌────────┐ ┌────────────┐ │
└────────────────────────────┘     │  │ Resend │ │  Unsplash  │ │
             ▲                     │  │ Email  │ │    API     │ │
             │                     │  └────────┘ └────────────┘ │
┌────────────┴───────────────┐     └──────────────────────────────┘
│    GITHUB ACTIONS (Cron)   │                ▲
│  ┌──────────────────────┐  │                │
│  │ data-fetch.yml       │──┼────────────────┘
│  │  (every 6 hours)     │  │
│  ├──────────────────────┤  │
│  │ email-daily.yml      │  │
│  │  (7:00 AM CET)       │  │
│  ├──────────────────────┤  │
│  │ email-weekly.yml     │  │
│  │  (Mon 7:00 AM CET)   │  │
│  ├──────────────────────┤  │
│  │ cleanup.yml          │  │
│  │  (daily, stale data) │  │
│  └──────────────────────┘  │
└────────────────────────────┘
```

---

## 2. Project Structure

```
forcanieve/
├── .github/
│   └── workflows/
│       ├── data-fetch.yml          # Cron: fetch all external data sources
│       ├── email-daily.yml         # Cron: send daily subscriber reports
│       ├── email-weekly.yml        # Cron: send weekly subscriber reports
│       └── cleanup.yml             # Cron: purge stale data + unsubscribed users
│
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout (fonts, metadata, analytics)
│   │   ├── page.tsx                # Homepage (hero + map + zone cards)
│   │   ├── zona/
│   │   │   └── [slug]/
│   │   │       └── page.tsx        # Zone detail page
│   │   ├── suscripcion/
│   │   │   ├── page.tsx            # Subscription signup form
│   │   │   └── gestionar/
│   │   │       └── page.tsx        # Manage subscription (via magic link)
│   │   ├── webcams/
│   │   │   └── page.tsx            # Full webcam gallery
│   │   ├── privacidad/
│   │   │   └── page.tsx            # Privacy policy
│   │   └── api/                    # API Routes (serverless)
│   │       ├── weather/
│   │       │   └── [zoneId]/
│   │       │       └── route.ts    # GET weather data for zone
│   │       ├── snow/
│   │       │   └── [zoneId]/
│   │       │       └── route.ts    # GET snow + avalanche data
│   │       ├── zones/
│   │       │   └── route.ts        # GET all zones with summary data
│   │       ├── subscribe/
│   │       │   ├── route.ts        # POST create subscription
│   │       │   └── verify/
│   │       │       └── route.ts    # GET verify magic link
│   │       ├── unsubscribe/
│   │       │   └── route.ts        # GET one-click unsubscribe
│   │       ├── subscription/
│   │       │   └── route.ts        # PUT update subscription prefs
│   │       └── cron/               # Endpoints triggered by GitHub Actions
│   │           ├── fetch-data/
│   │           │   └── route.ts    # POST trigger data pipeline
│   │           └── send-emails/
│   │               └── route.ts    # POST trigger email pipeline
│   │
│   ├── components/                 # React components (v0-generated + custom)
│   │   ├── ui/                     # shadcn/ui base components
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── home/
│   │   │   ├── HeroSummary.tsx     # LLM daily summary + hero image
│   │   │   ├── ZoneCardGrid.tsx    # Zone summary cards
│   │   │   └── WebcamPreview.tsx   # Homepage webcam thumbnails
│   │   ├── map/
│   │   │   ├── PyreneeMap.tsx      # Main interactive map (Mapbox/Leaflet)
│   │   │   ├── ZonePolygon.tsx     # Clickable zone overlay
│   │   │   ├── ZoneTooltip.tsx     # Hover tooltip on zones
│   │   │   ├── MapLegend.tsx       # Color legend (avalanche/snow)
│   │   │   └── ZoneSelector.tsx    # Dropdown alternative for mobile
│   │   ├── zone/
│   │   │   ├── ZoneHeader.tsx      # Hero image + LLM summary
│   │   │   ├── WeatherForecast.tsx # 4-day forecast + 7-day trend
│   │   │   ├── SnowPanel.tsx       # Snow depth by altitude
│   │   │   ├── AvalanchePanel.tsx  # Risk level + bulletin summary
│   │   │   ├── RouteList.tsx       # Routes with condition badges
│   │   │   └── WebcamGallery.tsx   # Zone webcam feeds
│   │   ├── subscription/
│   │   │   ├── SubscribeForm.tsx   # Email + zone select + frequency
│   │   │   ├── ManagePrefs.tsx     # Edit subscription after magic link
│   │   │   └── UnsubscribeConfirm.tsx
│   │   └── shared/
│   │       ├── AvalancheRiskBadge.tsx  # Color + text badge (1-5)
│   │       ├── SnowDepthBar.tsx        # Visual depth indicator
│   │       ├── WeatherIcon.tsx         # Condition icons
│   │       ├── ConditionBadge.tsx      # Route condition badge
│   │       ├── LastUpdated.tsx         # "Última actualización" timestamp
│   │       ├── AiDisclaimer.tsx        # LLM content disclaimer
│   │       └── CookieBanner.tsx        # GDPR cookie consent
│   │
│   ├── lib/                        # Shared utilities and clients
│   │   ├── supabase/
│   │   │   ├── client.ts           # Browser Supabase client
│   │   │   ├── server.ts           # Server-side Supabase client
│   │   │   └── admin.ts            # Service role client (cron jobs only)
│   │   ├── data-sources/
│   │   │   ├── aemet.ts            # AEMET OpenData API client
│   │   │   ├── open-meteo.ts       # Open-Meteo API client
│   │   │   ├── meteo-france.ts     # Meteo-France BRA XML parser
│   │   │   └── types.ts            # Shared data source types
│   │   ├── llm/
│   │   │   ├── client.ts           # Claude API client wrapper
│   │   │   ├── prompts.ts          # System/user prompts for summaries
│   │   │   └── sanitize.ts         # Sanitize LLM output before render
│   │   ├── email/
│   │   │   ├── resend.ts           # Resend client wrapper
│   │   │   └── templates.ts        # Email HTML templates (React Email)
│   │   ├── routes/
│   │   │   └── condition-engine.ts # Auto-calculate route conditions
│   │   ├── validators/
│   │   │   ├── subscription.ts     # Zod schemas for subscription input
│   │   │   └── common.ts           # Shared validation schemas
│   │   └── utils/
│   │       ├── constants.ts        # Zone definitions, altitude bands, etc.
│   │       ├── date.ts             # Date formatting (Spanish locale)
│   │       └── rate-limit.ts       # Simple in-memory rate limiter
│   │
│   ├── hooks/                      # React hooks
│   │   ├── useZoneData.ts          # Fetch and cache zone data
│   │   ├── useMapInteraction.ts    # Map click/hover state
│   │   └── useSubscription.ts      # Subscription form state
│   │
│   └── types/                      # TypeScript type definitions
│       ├── zone.ts
│       ├── weather.ts
│       ├── snow.ts
│       ├── avalanche.ts
│       ├── route.ts
│       ├── subscription.ts
│       └── api.ts                  # API response types
│
├── supabase/
│   └── migrations/
│       ├── 001_create_zones.sql
│       ├── 002_create_weather_data.sql
│       ├── 003_create_snow_data.sql
│       ├── 004_create_avalanche_data.sql
│       ├── 005_create_routes.sql
│       ├── 006_create_llm_summaries.sql
│       ├── 007_create_subscribers.sql
│       ├── 008_create_webcams.sql
│       ├── 009_seed_zones.sql
│       ├── 010_seed_routes.sql
│       ├── 011_seed_webcams.sql
│       └── 012_enable_rls.sql
│
├── scripts/                        # Standalone scripts for GitHub Actions
│   ├── fetch-all-data.ts           # Orchestrates all data fetching
│   ├── generate-summaries.ts       # Calls Claude Haiku for LLM summaries
│   ├── send-daily-emails.ts        # Sends daily subscriber reports
│   ├── send-weekly-emails.ts       # Sends weekly subscriber reports
│   └── cleanup-stale-data.ts       # Purge old data + expired subscriptions
│
├── public/
│   ├── images/
│   │   └── zones/                  # Zone hero images (from Unsplash)
│   ├── icons/                      # Weather + avalanche icons
│   └── geojson/
│       └── pyrenees-zones.geojson  # Zone boundary polygons
│
├── emails/                         # React Email templates
│   ├── DailyReport.tsx
│   ├── WeeklyReport.tsx
│   ├── MagicLink.tsx
│   └── Welcome.tsx
│
├── .env.example                    # Template with placeholder values
├── .env.local                      # Real secrets (GITIGNORED)
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── REQUIREMENTS.md
├── ARCHITECTURE.md
└── README.md
```

---

## 3. Database Schema (Detailed SQL)

### 3.1 Core Tables

```sql
-- =============================================================
-- ZONES: Geographic areas of the Aragonese Pyrenees
-- =============================================================
CREATE TABLE zones (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL UNIQUE,              -- "Valle de Benasque"
    slug        TEXT NOT NULL UNIQUE,              -- "benasque"
    description TEXT,                              -- Short zone description
    lat         DOUBLE PRECISION NOT NULL,         -- Center latitude
    lng         DOUBLE PRECISION NOT NULL,         -- Center longitude
    polygon     JSONB NOT NULL,                    -- GeoJSON polygon boundary
    image_url   TEXT,                              -- Hero image URL (Unsplash)
    sort_order  INT NOT NULL DEFAULT 0,            -- Display order
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

-- =============================================================
-- WEATHER DATA: Forecasts and current conditions per zone
-- =============================================================
CREATE TABLE weather_data (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id       UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    fetched_at    TIMESTAMPTZ NOT NULL DEFAULT now(),  -- When we fetched
    valid_from    TIMESTAMPTZ NOT NULL,                -- Forecast start time
    valid_to      TIMESTAMPTZ NOT NULL,                -- Forecast end time
    source        TEXT NOT NULL CHECK (source IN ('aemet', 'open_meteo')),
    forecast_data JSONB NOT NULL,
    -- forecast_data structure:
    -- {
    --   "temp_min": -2, "temp_max": 8,
    --   "temp_altitude_min": -12, "temp_altitude_max": -4,
    --   "altitude_reference": 2500,
    --   "precipitation_mm": 5, "snow_line_m": 2400,
    --   "wind_speed_kmh": 30, "wind_direction": "NW",
    --   "cloud_cover_pct": 40, "visibility": "good",
    --   "freezing_level_m": 2600
    -- }
    alerts_json   JSONB,                               -- AEMET warnings if any
    expires_at    TIMESTAMPTZ NOT NULL                  -- When to consider stale
);

CREATE INDEX idx_weather_zone_valid ON weather_data (zone_id, valid_from DESC);
CREATE INDEX idx_weather_expires ON weather_data (expires_at);

-- =============================================================
-- SNOW DATA: Depth and snowfall per zone
-- =============================================================
CREATE TABLE snow_data (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id           UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    fetched_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    observation_date  DATE NOT NULL,
    source            TEXT NOT NULL CHECK (source IN ('open_meteo', 'aemet', 'manual')),
    depth_by_altitude JSONB NOT NULL,
    -- depth_by_altitude structure:
    -- {
    --   "1800": 45, "2200": 120, "2600": 185, "3000": 210
    -- }
    snowfall_24h_cm   REAL,
    snowfall_48h_cm   REAL,
    snowfall_7d_cm    REAL,
    expires_at        TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_snow_zone_date ON snow_data (zone_id, observation_date DESC);

-- =============================================================
-- AVALANCHE DATA: Risk levels and bulletin summaries
-- =============================================================
CREATE TABLE avalanche_data (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id          UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    fetched_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    valid_date       DATE NOT NULL,
    source           TEXT NOT NULL CHECK (source IN ('meteo_france_bra', 'a_lurte', 'manual')),
    risk_level       INT NOT NULL CHECK (risk_level BETWEEN 1 AND 5),
    trend            TEXT CHECK (trend IN ('rising', 'stable', 'falling')),
    bulletin_summary TEXT,                             -- LLM-generated Spanish summary
    bulletin_url     TEXT,                             -- Link to official source
    raw_bulletin     JSONB,                            -- Original parsed bulletin data
    expires_at       TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_avalanche_zone_date ON avalanche_data (zone_id, valid_date DESC);

-- =============================================================
-- ROUTES: Curated mountain routes
-- =============================================================
CREATE TABLE routes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id         UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,                      -- "Canal de Izas"
    difficulty      TEXT NOT NULL,                      -- "PD+" / "AD" / etc.
    activity_type   TEXT NOT NULL CHECK (activity_type IN ('ski_touring', 'mountaineering', 'both')),
    altitude_min    INT NOT NULL,                       -- Start altitude (m)
    altitude_max    INT NOT NULL,                       -- Summit altitude (m)
    altitude_gain   INT,                                -- Total vertical gain (m)
    description     TEXT NOT NULL,                      -- Brief route description
    coordinates     JSONB,                              -- Start point [lat, lng]
    aspects         TEXT[],                              -- ['N', 'NE'] — relevant aspects
    season          TEXT[] DEFAULT ARRAY['winter'],     -- ['winter', 'spring', 'summer']
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_routes_zone ON routes (zone_id);

-- =============================================================
-- LLM SUMMARIES: Cached AI-generated content
-- =============================================================
CREATE TABLE llm_summaries (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id       UUID REFERENCES zones(id) ON DELETE CASCADE,  -- NULL = homepage
    summary_type  TEXT NOT NULL CHECK (summary_type IN ('homepage', 'zone', 'email')),
    content       TEXT NOT NULL,                        -- The generated text
    data_snapshot JSONB,                                -- Input data used for generation
    model_id      TEXT NOT NULL DEFAULT 'claude-haiku-4-5-20251001',
    generated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at    TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_summaries_type ON llm_summaries (summary_type, generated_at DESC);
CREATE INDEX idx_summaries_zone ON llm_summaries (zone_id, summary_type, generated_at DESC);

-- =============================================================
-- SUBSCRIBERS: Email subscription management
-- =============================================================
CREATE TABLE subscribers (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email             TEXT NOT NULL UNIQUE,              -- User email
    zones             UUID[] NOT NULL,                   -- Array of zone IDs
    frequency         TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly')),
    is_verified       BOOLEAN DEFAULT false,             -- Email confirmed via magic link
    is_active         BOOLEAN DEFAULT true,              -- Can be deactivated
    verify_token      TEXT UNIQUE,                       -- Magic link token
    verify_expires_at TIMESTAMPTZ,                       -- Token expiry
    unsubscribe_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    last_sent_at      TIMESTAMPTZ,
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subscribers_active ON subscribers (is_active, is_verified, frequency);

-- =============================================================
-- WEBCAMS: Camera feeds organized by zone
-- =============================================================
CREATE TABLE webcams (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id       UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,                        -- "Refugio de la Renclusa"
    embed_url     TEXT NOT NULL,                        -- Embed or image URL
    thumbnail_url TEXT,                                 -- Static thumbnail
    source        TEXT,                                 -- "camareando.com"
    is_active     BOOLEAN DEFAULT true,
    sort_order    INT DEFAULT 0
);

CREATE INDEX idx_webcams_zone ON webcams (zone_id);
```

### 3.2 Row Level Security Policies

```sql
-- ============================================================
-- RLS: All tables protected. Public read, service-role write.
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE snow_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE avalanche_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE webcams ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ: anyone can read zone/weather/snow/avalanche/routes/summaries/webcams
CREATE POLICY "public_read_zones" ON zones FOR SELECT USING (true);
CREATE POLICY "public_read_weather" ON weather_data FOR SELECT USING (true);
CREATE POLICY "public_read_snow" ON snow_data FOR SELECT USING (true);
CREATE POLICY "public_read_avalanche" ON avalanche_data FOR SELECT USING (true);
CREATE POLICY "public_read_routes" ON routes FOR SELECT USING (is_active = true);
CREATE POLICY "public_read_summaries" ON llm_summaries FOR SELECT USING (true);
CREATE POLICY "public_read_webcams" ON webcams FOR SELECT USING (is_active = true);

-- SUBSCRIBERS: NO public read. Only service role can access.
-- Subscribers manage their own data via API routes (server-side).
-- No direct Supabase client access to subscriber data from browser.
CREATE POLICY "no_public_subscriber_access" ON subscribers FOR SELECT USING (false);
-- Service role bypasses RLS, so cron jobs and API routes can read/write.

-- WRITE: Only service role (used by cron jobs and API routes)
-- No INSERT/UPDATE/DELETE policies for anon role = writes blocked for public.
```

### 3.3 Utility Functions

```sql
-- Cleanup function: delete expired data
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
    DELETE FROM weather_data WHERE expires_at < now() - INTERVAL '24 hours';
    DELETE FROM snow_data WHERE expires_at < now() - INTERVAL '24 hours';
    DELETE FROM avalanche_data WHERE expires_at < now() - INTERVAL '24 hours';
    DELETE FROM llm_summaries WHERE expires_at < now() - INTERVAL '24 hours';
    -- Remove unverified subscriptions older than 48h
    DELETE FROM subscribers WHERE is_verified = false AND created_at < now() - INTERVAL '48 hours';
    -- Remove unsubscribed users after 30 days (GDPR)
    DELETE FROM subscribers WHERE is_active = false AND updated_at < now() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get latest data for a zone (convenience view)
CREATE OR REPLACE VIEW zone_latest_data AS
SELECT
    z.id AS zone_id,
    z.name,
    z.slug,
    z.image_url,
    z.sort_order,
    (SELECT forecast_data FROM weather_data WHERE zone_id = z.id ORDER BY valid_from DESC LIMIT 1) AS weather,
    (SELECT alerts_json FROM weather_data WHERE zone_id = z.id AND alerts_json IS NOT NULL ORDER BY fetched_at DESC LIMIT 1) AS alerts,
    (SELECT depth_by_altitude FROM snow_data WHERE zone_id = z.id ORDER BY observation_date DESC LIMIT 1) AS snow_depth,
    (SELECT snowfall_24h_cm FROM snow_data WHERE zone_id = z.id ORDER BY observation_date DESC LIMIT 1) AS snowfall_24h,
    (SELECT risk_level FROM avalanche_data WHERE zone_id = z.id ORDER BY valid_date DESC LIMIT 1) AS avalanche_risk,
    (SELECT trend FROM avalanche_data WHERE zone_id = z.id ORDER BY valid_date DESC LIMIT 1) AS avalanche_trend,
    (SELECT bulletin_summary FROM avalanche_data WHERE zone_id = z.id ORDER BY valid_date DESC LIMIT 1) AS avalanche_summary,
    (SELECT content FROM llm_summaries WHERE zone_id = z.id AND summary_type = 'zone' ORDER BY generated_at DESC LIMIT 1) AS llm_summary,
    (SELECT generated_at FROM llm_summaries WHERE zone_id = z.id AND summary_type = 'zone' ORDER BY generated_at DESC LIMIT 1) AS summary_updated_at
FROM zones z
ORDER BY z.sort_order;
```

---

## 4. API Specifications

### 4.1 Public API Routes (Read-Only)

All public routes return JSON. No authentication required.

#### `GET /api/zones`
Returns all zones with latest summary data.

```typescript
// Response: 200 OK
{
  zones: Array<{
    id: string;
    name: string;
    slug: string;
    imageUrl: string;
    lat: number;
    lng: number;
    weather: {
      tempMin: number;
      tempMax: number;
      snowLineMeter: number;
      condition: string;       // "sunny" | "cloudy" | "rain" | "snow"
    };
    avalancheRisk: number;     // 1-5
    avalancheTrend: string;    // "rising" | "stable" | "falling"
    snowDepth2200: number;     // cm at 2200m reference
    llmSummary: string | null;
    lastUpdated: string;       // ISO 8601
  }>;
}
```

**Cache**: ISR revalidate every 30 minutes. Stale-while-revalidate.

#### `GET /api/weather/:zoneId`
Returns full forecast for a zone.

```typescript
// Response: 200 OK
{
  zone: { id: string; name: string; slug: string };
  forecast: Array<{            // 4 days
    date: string;              // "2026-04-09"
    tempMin: number;
    tempMax: number;
    tempAltitudeMin: number;
    tempAltitudeMax: number;
    altitudeReference: number;
    precipitationMm: number;
    snowLineMeter: number;
    windSpeedKmh: number;
    windDirection: string;
    cloudCoverPct: number;
    freezingLevelMeter: number;
  }>;
  trend7d: Array<{             // 7-day simplified
    date: string;
    tendency: "improving" | "stable" | "worsening";
    tempRange: string;         // "-5°/3°"
  }>;
  alerts: Array<{
    type: string;              // "wind" | "snow" | "rain" | "cold"
    severity: string;          // "yellow" | "orange" | "red"
    message: string;
    validUntil: string;
  }> | null;
  lastUpdated: string;
}
```

#### `GET /api/snow/:zoneId`
Returns snow and avalanche data for a zone.

```typescript
// Response: 200 OK
{
  zone: { id: string; name: string; slug: string };
  snow: {
    depthByAltitude: Record<string, number>;  // { "1800": 45, "2200": 120, ... }
    snowfall24h: number | null;
    snowfall48h: number | null;
    snowfall7d: number | null;
    lastUpdated: string;
  };
  avalanche: {
    riskLevel: number;         // 1-5
    trend: string;
    bulletinSummary: string;   // LLM-generated Spanish
    bulletinUrl: string;
    validDate: string;
    lastUpdated: string;
  } | null;                    // null in summer (no bulletin)
  routes: Array<{
    id: string;
    name: string;
    difficulty: string;
    altitudeMin: number;
    altitudeMax: number;
    description: string;
    conditionBadge: "good" | "caution" | "not_recommended";
    conditionReason: string;   // "Riesgo de aludes 3 en orientación N"
  }>;
}
```

### 4.2 Subscription API Routes

#### `POST /api/subscribe`
Create a new subscription. Sends magic link to verify.

```typescript
// Request body
{
  email: string;               // Validated: email format
  zones: string[];             // Array of zone UUIDs (1-8)
  frequency: "daily" | "weekly";
}

// Response: 201 Created
{ message: "Te hemos enviado un enlace de verificación a tu correo." }

// Response: 400 Bad Request
{ error: "Email inválido" | "Selecciona al menos una zona" }

// Response: 429 Too Many Requests
{ error: "Demasiadas solicitudes. Inténtalo más tarde." }
```

**Security**:
- Rate limited: 5 requests per email per hour
- Rate limited: 20 requests per IP per hour
- Email validated with Zod
- Zone IDs validated against existing zones

#### `GET /api/subscribe/verify?token=xxx`
Verify email via magic link.

```typescript
// Response: 302 Redirect → /suscripcion/gestionar?verified=true
// (sets httpOnly cookie with session)

// Response: 400 Bad Request
{ error: "Enlace de verificación inválido o expirado." }
```

#### `PUT /api/subscription`
Update subscription preferences (requires verified session).

```typescript
// Request body
{
  zones: string[];
  frequency: "daily" | "weekly";
}

// Response: 200 OK
{ message: "Preferencias actualizadas." }
```

#### `GET /api/unsubscribe?token=xxx`
One-click unsubscribe (no auth needed, token-based).

```typescript
// Response: 302 Redirect → /suscripcion?unsubscribed=true
```

### 4.3 Cron API Routes (Protected)

These endpoints are called only by GitHub Actions. Protected by a shared secret.

#### `POST /api/cron/fetch-data`
```typescript
// Header: Authorization: Bearer CRON_SECRET
// Response: 200 OK
{
  fetched: {
    aemet: { zones: 8, records: 32 },
    openMeteo: { zones: 8, records: 56 },
    meteoFrance: { zones: 6, bulletins: 6 },
  },
  summariesGenerated: 9,      // 1 homepage + 8 zones
  duration_ms: 12340
}

// Response: 401 Unauthorized
{ error: "Invalid cron secret" }
```

#### `POST /api/cron/send-emails`
```typescript
// Header: Authorization: Bearer CRON_SECRET
// Query: ?frequency=daily|weekly
// Response: 200 OK
{
  sent: 47,
  failed: 2,
  skipped: 3,                  // Unverified subscribers
  duration_ms: 8500
}
```

---

## 5. Data Pipeline Architecture

### 5.1 Fetch Pipeline (every 6 hours)

```
GitHub Actions workflow triggers at: 00:00, 06:00, 12:00, 18:00 UTC

Step 1: FETCH (parallel)
┌────────────────────────────────────────────────────────┐
│                                                        │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────┐  │
│  │ AEMET API   │  │ Open-Meteo  │  │ Meteo-France  │  │
│  │             │  │   API       │  │   BRA XML     │  │
│  │ For each    │  │ For each    │  │ For each      │  │
│  │ zone:       │  │ zone:       │  │ massif:       │  │
│  │ - forecast  │  │ - hourly    │  │ - Download    │  │
│  │ - alerts    │  │ - snow_depth│  │ - Parse XML   │  │
│  │ - stations  │  │ - wind      │  │ - Map to zone │  │
│  └──────┬──────┘  └──────┬──────┘  └───────┬───────┘  │
│         │                │                  │          │
│         ▼                ▼                  ▼          │
│  ┌────────────────────────────────────────────────┐    │
│  │            NORMALIZE & MERGE                    │    │
│  │  - Prefer AEMET for Spanish territory           │    │
│  │  - Prefer Open-Meteo for altitude models        │    │
│  │  - Prefer Meteo-France for avalanche            │    │
│  │  - Merge into unified zone data structure       │    │
│  └────────────────────┬───────────────────────────┘    │
│                       │                                │
│                       ▼                                │
│  ┌────────────────────────────────────────────────┐    │
│  │           STORE IN SUPABASE                     │    │
│  │  - Upsert weather_data per zone                 │    │
│  │  - Upsert snow_data per zone                    │    │
│  │  - Upsert avalanche_data per zone               │    │
│  │  - Set expires_at = now + 12h                   │    │
│  └────────────────────┬───────────────────────────┘    │
│                       │                                │
└───────────────────────┼────────────────────────────────┘
                        │
Step 2: GENERATE SUMMARIES (sequential)
┌───────────────────────┼────────────────────────────────┐
│                       ▼                                │
│  ┌────────────────────────────────────────────────┐    │
│  │          CLAUDE HAIKU API                       │    │
│  │                                                 │    │
│  │  For homepage:                                  │    │
│  │    Input: all zones' latest data                │    │
│  │    Prompt: "Generate a concise Spanish          │    │
│  │     summary of today's Pyrenees conditions..."  │    │
│  │    Output → llm_summaries (type: homepage)      │    │
│  │                                                 │    │
│  │  For each zone:                                 │    │
│  │    Input: zone-specific weather+snow+avalanche  │    │
│  │    Prompt: "Summarize conditions for {zone}..." │    │
│  │    Output → llm_summaries (type: zone)          │    │
│  │                                                 │    │
│  │  For avalanche bulletins:                       │    │
│  │    Input: raw Meteo-France BRA XML              │    │
│  │    Prompt: "Translate and summarize this         │    │
│  │     avalanche bulletin into Spanish..."         │    │
│  │    Output → avalanche_data.bulletin_summary     │    │
│  └────────────────────────────────────────────────┘    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 5.2 Source Priority Matrix

| Data Point | Primary Source | Fallback Source | Notes |
|-----------|---------------|-----------------|-------|
| Temperature (valley) | AEMET | Open-Meteo | AEMET has real station data |
| Temperature (altitude) | Open-Meteo | AEMET model | Open-Meteo has better altitude resolution |
| Precipitation | AEMET | Open-Meteo | |
| Wind at altitude | Open-Meteo | AEMET | Open-Meteo's ECMWF model excels here |
| Snow line | Open-Meteo | Calculated from AEMET freezing level | |
| Snow depth | Open-Meteo (modeled) | — | No real-time sensors available for free |
| Avalanche risk | Meteo-France BRA | A Lurte (future) | BRA is the gold standard |
| Weather alerts | AEMET | — | Only official Spanish source |

### 5.3 Error Handling & Resilience

```
If a data source fails:
  1. Log the error
  2. Retry once after 30 seconds
  3. If still failing, keep the previous data (don't delete)
  4. Set a "degraded" flag on the zone
  5. Frontend shows: "Datos de [source] no disponibles.
     Última actualización: [timestamp]"
  6. Continue processing other sources

If Claude API fails:
  1. Retry once
  2. If still failing, keep the previous LLM summary
  3. Set summary.is_stale = true
  4. Frontend shows previous summary with
     "Resumen no actualizado" warning

If ALL sources fail:
  1. The website still works with cached data
  2. "Última actualización" timestamps show staleness
  3. GitHub Actions sends a failure notification
```

---

## 6. Route Condition Engine

Automatically calculates route condition badges based on available data.

```typescript
// lib/routes/condition-engine.ts — Logic specification

interface RouteConditionInput {
  route: {
    altitudeMin: number;
    altitudeMax: number;
    aspects: string[];          // ['N', 'NE']
    activityType: 'ski_touring' | 'mountaineering' | 'both';
  };
  avalanche: {
    riskLevel: number;          // 1-5
    trend: string;
  } | null;
  snow: {
    depthAtRouteAltitude: number;  // cm at route's midpoint altitude
  };
  weather: {
    windSpeedKmh: number;
    precipitationMm: number;
    alertSeverity: string | null;  // 'yellow' | 'orange' | 'red'
  };
}

// Decision matrix:
//
// NOT RECOMMENDED if ANY of:
//   - Avalanche risk >= 4 (fuerte)
//   - Avalanche risk == 3 AND route aspects match dangerous aspects
//   - Weather alert severity == 'red'
//   - Wind > 80 km/h at altitude
//
// CAUTION if ANY of:
//   - Avalanche risk == 3
//   - Avalanche risk == 2 AND trend == 'rising'
//   - Weather alert severity == 'orange' or 'yellow'
//   - Wind 50-80 km/h at altitude
//   - Snow depth < 50cm for ski touring route
//
// GOOD otherwise

type ConditionBadge = 'good' | 'caution' | 'not_recommended';
```

---

## 7. LLM Integration Design

### 7.1 Prompt Architecture

```typescript
// lib/llm/prompts.ts

const SYSTEM_PROMPT = `Eres un meteorólogo de montaña experto en el Pirineo aragonés.
Tu trabajo es generar resúmenes claros, concisos y útiles de las condiciones
meteorológicas y nivológicas para montañeros experimentados.

Reglas:
- Escribe siempre en español
- Usa terminología técnica de montaña (cota de nieve, isoterma, aludes, etc.)
- Sé conciso: máximo 3-4 frases para resúmenes de zona, 5-6 para homepage
- Prioriza información de seguridad (aludes, viento fuerte, alertas)
- Menciona las mejores ventanas meteorológicas cuando las haya
- Nunca inventes datos: usa SOLO los datos proporcionados
- Si faltan datos, dilo explícitamente
- No uses emojis`;

const HOMEPAGE_PROMPT = (data: AllZonesData) => `
Genera un resumen general de las condiciones de hoy en el Pirineo aragonés.
Datos actuales:
${JSON.stringify(data, null, 2)}

Incluye: condiciones generales, cota de nieve, riesgo de aludes destacable,
y si hay ventanas favorables para actividades de montaña.`;

const ZONE_PROMPT = (zone: string, data: ZoneData) => `
Genera un resumen de las condiciones en ${zone}.
Datos actuales:
${JSON.stringify(data, null, 2)}

Incluye: tiempo previsto, nieve, riesgo de aludes y orientaciones afectadas.`;

const EMAIL_PROMPT = (zones: ZoneData[]) => `
Genera un informe personalizado para un suscriptor interesado en las
siguientes zonas. Formato: un párrafo introductorio general, luego
un bloque corto por cada zona.

Zonas y datos:
${JSON.stringify(zones, null, 2)}`;

const BRA_TRANSLATE_PROMPT = (xmlContent: string) => `
Traduce y resume este boletín de riesgo de avalanchas del Meteo-France BRA
al español. Extrae: nivel de riesgo, orientaciones peligrosas,
altitudes afectadas y evolución prevista. Máximo 3 frases.

Boletín:
${xmlContent}`;
```

### 7.2 Token Budget Estimation

| Generation | Frequency | Input tokens | Output tokens | Daily cost |
|-----------|-----------|-------------|---------------|------------|
| Homepage summary | 4x/day | ~2,000 | ~200 | ~$0.002 |
| Zone summaries (8) | 4x/day | ~1,500 each | ~150 each | ~$0.012 |
| BRA translations (6) | 4x/day | ~1,000 each | ~100 each | ~$0.006 |
| Daily emails (100) | 1x/day | ~2,000 each | ~300 each | ~$0.06 |
| **Total** | | | | **~$0.08/day ≈ $2.40/month** |

### 7.3 LLM Output Sanitization

```typescript
// lib/llm/sanitize.ts

function sanitizeLlmOutput(raw: string): string {
  // 1. Strip any HTML tags (LLM should not produce them, but defense-in-depth)
  const noHtml = raw.replace(/<[^>]*>/g, '');

  // 2. Strip any markdown links with URLs (prevent link injection)
  const noLinks = noHtml.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');

  // 3. Limit length (prevent runaway generation)
  const trimmed = noLinks.slice(0, 2000);

  // 4. Normalize whitespace
  return trimmed.replace(/\n{3,}/g, '\n\n').trim();
}
```

---

## 8. Email Architecture

### 8.1 Templates (React Email)

```
emails/
├── DailyReport.tsx      # Daily subscriber report
├── WeeklyReport.tsx     # Weekly subscriber report (same structure, longer)
├── MagicLink.tsx        # Verification / login link
└── Welcome.tsx          # Post-verification welcome
```

### 8.2 Email Flow

```
Subscribe:
  User submits email → POST /api/subscribe
    → Validate input (Zod)
    → Check rate limit
    → Insert subscriber (is_verified: false)
    → Generate verify_token (32 bytes, hex)
    → Send MagicLink email via Resend
    → Token expires in 24h

Verify:
  User clicks link → GET /api/subscribe/verify?token=xxx
    → Lookup subscriber by token
    → Check not expired
    → Set is_verified: true, clear token
    → Send Welcome email
    → Redirect to /suscripcion/gestionar

Daily Report:
  GitHub Actions (7:00 AM CET) → POST /api/cron/send-emails?frequency=daily
    → Query subscribers WHERE is_verified AND is_active AND frequency='daily'
    → For each subscriber (batch of 10, respecting 100/day Resend limit):
        → Gather latest data for subscriber's zones
        → Call Claude Haiku → generate personalized summary
        → Send DailyReport email via Resend
        → Update last_sent_at

Unsubscribe:
  User clicks link → GET /api/unsubscribe?token=xxx
    → Lookup by unsubscribe_token
    → Set is_active: false
    → Redirect to confirmation page
    → Data deleted after 30 days (GDPR cleanup job)
```

### 8.3 Resend Rate Limit Strategy

Free tier: 100 emails/day, 3,000/month.

```
Daily subscribers: process up to 90 (leave 10 buffer for magic links)
Weekly subscribers: process on Monday, up to 90
If > 90 daily subscribers: batch across 2 sends (7:00 AM + 7:30 AM)

Growth plan: when approaching limit, migrate to Resend paid ($20/mo for 50K)
or switch to Amazon SES ($0.10/1K emails).
```

---

## 9. Security Architecture

### 9.1 Secret Management

```
Environment Variables (NEVER in code):

# .env.example (committed to repo)
AEMET_API_KEY=your_aemet_api_key_here
ANTHROPIC_API_KEY=your_claude_api_key_here
RESEND_API_KEY=your_resend_api_key_here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
CRON_SECRET=your_cron_secret_here
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here  # Public token (restricted)

# Where secrets live:
# - Local dev: .env.local (gitignored)
# - Production: Vercel Environment Variables (encrypted)
# - GitHub Actions: Repository Secrets
```

### 9.2 Security Headers

```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://api.mapbox.com",
      "style-src 'self' 'unsafe-inline' https://api.mapbox.com",
      "img-src 'self' data: https://images.unsplash.com https://*.supabase.co https://*.mapbox.com",
      "connect-src 'self' https://*.supabase.co https://api.mapbox.com https://events.mapbox.com",
      "frame-src https://camareando.com",  // Webcam embeds
      "font-src 'self'",
    ].join('; '),
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];
```

### 9.3 Rate Limiting

```typescript
// lib/utils/rate-limit.ts
// Simple in-memory rate limiter for serverless (per-invocation reset)
// For MVP this is sufficient. For production, use Upstash Redis.

const LIMITS = {
  subscribe: { windowMs: 3600000, max: 5 },       // 5 per hour per email
  subscribeIp: { windowMs: 3600000, max: 20 },    // 20 per hour per IP
  apiGeneral: { windowMs: 60000, max: 60 },        // 60 per minute per IP
};
```

### 9.4 Input Validation

```typescript
// lib/validators/subscription.ts
import { z } from 'zod';

export const subscribeSchema = z.object({
  email: z.string().email('Email inválido').max(254),
  zones: z.array(z.string().uuid('ID de zona inválido')).min(1).max(8),
  frequency: z.enum(['daily', 'weekly']),
});

// All API route handlers validate with this schema before processing.
```

### 9.5 Threat Model Summary

| Threat | Mitigation |
|--------|-----------|
| API key exposure | Server-side only, env vars, .gitignore |
| XSS via LLM output | HTML stripping, link removal, length limiting |
| Email spam via subscription | Rate limiting, email verification required |
| DDoS on API routes | Vercel edge rate limiting + per-route limits |
| SQL injection | Supabase parameterized queries (never raw SQL from input) |
| CSRF on subscription | SameSite cookies, origin checking |
| Subscriber data leak | RLS blocks all public access, service role only |
| Stale/wrong LLM content | Disclaimer on all AI content, source links |

---

## 10. Frontend Component Architecture

### 10.1 Component Tree

```
RootLayout
├── Header
│   ├── Logo
│   ├── Navigation (Zonas | Webcams | Suscripción)
│   └── MobileNav (hamburger)
│
├── HomePage
│   ├── HeroSummary
│   │   ├── Background image (Unsplash, zone rotation)
│   │   ├── LLM daily summary text
│   │   ├── AiDisclaimer
│   │   └── LastUpdated
│   ├── PyreneeMap
│   │   ├── ZonePolygon × 8 (clickable GeoJSON overlays)
│   │   ├── ZoneTooltip (hover: name + avalanche level)
│   │   ├── MapLegend (avalanche colors + snow depth)
│   │   └── ZoneSelector (mobile dropdown alternative)
│   ├── ZoneCardGrid
│   │   └── ZoneCard × 8
│   │       ├── Zone image thumbnail
│   │       ├── Zone name
│   │       ├── AvalancheRiskBadge
│   │       ├── SnowDepthBar
│   │       ├── Temperature range
│   │       └── Link → /zona/[slug]
│   └── WebcamPreview (3-4 featured cams)
│
├── ZoneDetailPage (/zona/[slug])
│   ├── ZoneHeader
│   │   ├── Hero image
│   │   ├── Zone name + breadcrumb
│   │   ├── LLM zone summary
│   │   └── AiDisclaimer
│   ├── WeatherForecast
│   │   ├── DayForecastCard × 4
│   │   │   ├── Date
│   │   │   ├── WeatherIcon
│   │   │   ├── Temp range (valley + altitude)
│   │   │   ├── Snow line
│   │   │   ├── Wind
│   │   │   └── Freezing level
│   │   └── TrendChart (7-day sparkline)
│   ├── SnowPanel
│   │   ├── AltitudeDepthChart (bar chart: depth × altitude)
│   │   └── SnowfallSummary (24h / 48h / 7d)
│   ├── AvalanchePanel
│   │   ├── AvalancheRiskBadge (large)
│   │   ├── Trend indicator
│   │   ├── Bulletin summary (LLM-translated)
│   │   └── Link to official bulletin
│   ├── RouteList
│   │   └── RouteCard × N
│   │       ├── Route name + difficulty
│   │       ├── Altitude range
│   │       ├── ConditionBadge
│   │       └── Condition reason text
│   └── WebcamGallery
│       └── WebcamEmbed × N
│
├── SubscriptionPage (/suscripcion)
│   ├── SubscribeForm
│   │   ├── Email input
│   │   ├── Zone multi-select (checkboxes)
│   │   ├── Frequency radio (daily/weekly)
│   │   └── Submit button
│   └── SuccessMessage / ErrorMessage
│
├── ManagePrefsPage (/suscripcion/gestionar)
│   ├── ManagePrefs
│   │   ├── Current zones (editable)
│   │   ├── Frequency selector
│   │   ├── Save button
│   │   └── Unsubscribe link
│   └── UnsubscribeConfirm
│
├── WebcamsPage (/webcams)
│   └── WebcamGrid (all webcams, grouped by zone)
│
├── PrivacyPage (/privacidad)
│
├── CookieBanner (global, persistent)
└── Footer
    ├── Data source attributions
    ├── Privacy policy link
    └── AI disclaimer
```

### 10.2 v0 Generation Strategy

Generate these component groups in v0, in order:

1. **Layout shell**: Header + Footer + MobileNav — Apple Weather style, clean white/gray, minimal
2. **HeroSummary**: Full-bleed image with glass-morphism text overlay
3. **ZoneCard + ZoneCardGrid**: Card design with weather snapshot
4. **WeatherForecast + DayForecastCard**: Horizontal scroll forecast (Apple Weather feel)
5. **SnowPanel + AvalanchePanel**: Data visualization cards
6. **SubscribeForm**: Clean form with multi-select zones
7. **Map components**: Integrate Mapbox/Leaflet separately (v0 can't generate map logic)

### 10.3 Design Tokens (for v0 prompts)

```
Style: Apple Weather inspired, clean, minimal
Background: White (#FFFFFF) with subtle gray sections (#F9FAFB)
Text: Dark gray (#111827) primary, medium gray (#6B7280) secondary
Accent: Mountain blue (#2563EB) for interactive elements
Danger: Avalanche red (#DC2626) for high risk
Warning: Amber (#F59E0B) for caution
Success: Emerald (#059669) for good conditions
Cards: White with subtle shadow, rounded-xl corners
Typography: Inter or system font stack, clean hierarchy
Spacing: Generous padding, breathable layout
Animations: Subtle transitions, no flashy effects
Icons: Lucide icons (built into shadcn/ui)
```

---

## 11. GitHub Actions Workflows

### 11.1 Data Fetch Workflow

```yaml
# .github/workflows/data-fetch.yml
name: Fetch Weather Data
on:
  schedule:
    - cron: '0 0,6,12,18 * * *'  # Every 6 hours UTC
  workflow_dispatch:                # Manual trigger

jobs:
  fetch:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx tsx scripts/fetch-all-data.ts
        env:
          AEMET_API_KEY: ${{ secrets.AEMET_API_KEY }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

### 11.2 Email Workflows

```yaml
# .github/workflows/email-daily.yml
name: Send Daily Reports
on:
  schedule:
    - cron: '0 6 * * *'  # 06:00 UTC = 07:00 CET / 08:00 CEST
  workflow_dispatch:

jobs:
  send:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx tsx scripts/send-daily-emails.ts
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
```

---

## 12. Deployment Pipeline

```
Developer pushes to main
    │
    ▼
Vercel auto-deploys
    ├── Build: next build
    ├── Preview: on PR branches
    └── Production: on main merge

Supabase migrations
    ├── Local: supabase db push (dev)
    └── Production: supabase db push --linked (manual, reviewed)

GitHub Actions secrets
    └── Set once via GitHub Settings → Secrets and variables → Actions
```

---

## 13. Monitoring & Observability (MVP-Level)

| What | How | Cost |
|------|-----|------|
| Frontend errors | Vercel Error Tracking (built-in) | Free |
| API route performance | Vercel Function Logs | Free |
| Cron job failures | GitHub Actions email notifications | Free |
| Uptime | UptimeRobot (free tier: 50 monitors) | Free |
| Analytics | GoatCounter (privacy-friendly) | Free |
| Data freshness | Custom: check `lastUpdated` timestamps | Built-in |

---

## 14. Decision Log

| Decision | Choice | Rationale | Alternatives Considered |
|----------|--------|-----------|------------------------|
| Frontend framework | Next.js 15 (App Router) | v0 generates this stack, SSR for SEO, serverless API routes | Astro, Remix |
| Database | Supabase PostgreSQL | Free tier includes auth + DB + RLS, excellent DX | Neon + separate auth |
| Map library | **TBD (Mapbox or Leaflet)** | Pending user decision. Mapbox prettier but capped. | OpenLayers |
| LLM | Claude Haiku | Cheapest quality option, excellent Spanish | GPT-4o-mini, templates |
| Email | Resend | Simple API, React Email support, free tier | SendGrid, Mailgun |
| Cron | GitHub Actions | Free for public repos, built-in secrets | Vercel Cron (limited free) |
| Auth | Supabase Magic Link | No passwords to manage, simple UX | Passwords, OAuth |
| CSS | Tailwind + shadcn/ui | v0 default, excellent DX, accessible components | CSS Modules, Styled |

---

*This architecture document should be reviewed alongside [REQUIREMENTS.md](REQUIREMENTS.md). Proceed to `/sc:sc-workflow` for the implementation task breakdown.*
