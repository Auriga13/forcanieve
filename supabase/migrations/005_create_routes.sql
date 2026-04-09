CREATE TABLE routes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id         UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    difficulty      TEXT NOT NULL,
    activity_type   TEXT NOT NULL CHECK (activity_type IN ('ski_touring', 'mountaineering', 'both')),
    altitude_min    INT NOT NULL,
    altitude_max    INT NOT NULL,
    altitude_gain   INT,
    description     TEXT NOT NULL,
    coordinates     JSONB,
    aspects         TEXT[],
    season          TEXT[] DEFAULT ARRAY['winter'],
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_routes_zone ON routes (zone_id);
