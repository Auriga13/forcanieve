CREATE TABLE avalanche_data (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id          UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    fetched_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    valid_date       DATE NOT NULL,
    source           TEXT NOT NULL CHECK (source IN ('meteo_france_bra', 'a_lurte', 'manual')),
    risk_level       INT NOT NULL CHECK (risk_level BETWEEN 1 AND 5),
    trend            TEXT CHECK (trend IN ('rising', 'stable', 'falling')),
    bulletin_summary TEXT,
    bulletin_url     TEXT,
    raw_bulletin     JSONB,
    expires_at       TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_avalanche_zone_date ON avalanche_data (zone_id, valid_date DESC);
