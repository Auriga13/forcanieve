CREATE TABLE snow_data (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id           UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    fetched_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    observation_date  DATE NOT NULL,
    source            TEXT NOT NULL CHECK (source IN ('open_meteo', 'aemet', 'manual')),
    depth_by_altitude JSONB NOT NULL,
    snowfall_24h_cm   REAL,
    snowfall_48h_cm   REAL,
    snowfall_7d_cm    REAL,
    expires_at        TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_snow_zone_date ON snow_data (zone_id, observation_date DESC);
