CREATE TABLE weather_data (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id       UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    fetched_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    valid_from    TIMESTAMPTZ NOT NULL,
    valid_to      TIMESTAMPTZ NOT NULL,
    source        TEXT NOT NULL CHECK (source IN ('aemet', 'open_meteo')),
    forecast_data JSONB NOT NULL,
    alerts_json   JSONB,
    expires_at    TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_weather_zone_valid ON weather_data (zone_id, valid_from DESC);
CREATE INDEX idx_weather_expires ON weather_data (expires_at);
