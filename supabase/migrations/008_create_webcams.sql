CREATE TABLE webcams (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id       UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    embed_url     TEXT NOT NULL,
    thumbnail_url TEXT,
    source        TEXT,
    is_active     BOOLEAN DEFAULT true,
    sort_order    INT DEFAULT 0
);

CREATE INDEX idx_webcams_zone ON webcams (zone_id);
