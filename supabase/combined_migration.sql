-- === 001_create_zones.sql ===
CREATE TABLE zones (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL UNIQUE,
    slug        TEXT NOT NULL UNIQUE,
    description TEXT,
    lat         DOUBLE PRECISION NOT NULL,
    lng         DOUBLE PRECISION NOT NULL,
    polygon     JSONB NOT NULL,
    image_url   TEXT,
    sort_order  INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);


-- === 002_create_weather_data.sql ===
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


-- === 003_create_snow_data.sql ===
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


-- === 004_create_avalanche_data.sql ===
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


-- === 005_create_routes.sql ===
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


-- === 006_create_llm_summaries.sql ===
CREATE TABLE llm_summaries (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id       UUID REFERENCES zones(id) ON DELETE CASCADE,
    summary_type  TEXT NOT NULL CHECK (summary_type IN ('homepage', 'zone', 'email')),
    content       TEXT NOT NULL,
    data_snapshot JSONB,
    model_id      TEXT NOT NULL DEFAULT 'claude-haiku-4-5-20251001',
    generated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at    TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_summaries_type ON llm_summaries (summary_type, generated_at DESC);
CREATE INDEX idx_summaries_zone ON llm_summaries (zone_id, summary_type, generated_at DESC);


-- === 007_create_subscribers.sql ===
CREATE TABLE subscribers (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email             TEXT NOT NULL UNIQUE,
    zones             UUID[] NOT NULL,
    frequency         TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly')),
    is_verified       BOOLEAN DEFAULT false,
    is_active         BOOLEAN DEFAULT true,
    verify_token      TEXT UNIQUE,
    verify_expires_at TIMESTAMPTZ,
    unsubscribe_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    last_sent_at      TIMESTAMPTZ,
    created_at        TIMESTAMPTZ DEFAULT now(),
    updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subscribers_active ON subscribers (is_active, is_verified, frequency);


-- === 008_create_webcams.sql ===
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


-- === 009_enable_rls.sql ===
-- Enable RLS on all tables
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE snow_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE avalanche_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE webcams ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "public_read_zones" ON zones FOR SELECT USING (true);
CREATE POLICY "public_read_weather" ON weather_data FOR SELECT USING (true);
CREATE POLICY "public_read_snow" ON snow_data FOR SELECT USING (true);
CREATE POLICY "public_read_avalanche" ON avalanche_data FOR SELECT USING (true);
CREATE POLICY "public_read_routes" ON routes FOR SELECT USING (is_active = true);
CREATE POLICY "public_read_summaries" ON llm_summaries FOR SELECT USING (true);
CREATE POLICY "public_read_webcams" ON webcams FOR SELECT USING (is_active = true);

-- Subscribers: NO public access. Service role bypasses RLS.
CREATE POLICY "no_public_subscriber_access" ON subscribers FOR SELECT USING (false);

-- Convenience view for latest data per zone
CREATE OR REPLACE VIEW zone_latest_data AS
SELECT
    z.id AS zone_id,
    z.name,
    z.slug,
    z.image_url,
    z.sort_order,
    z.lat,
    z.lng,
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

-- Cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
    DELETE FROM weather_data WHERE expires_at < now() - INTERVAL '24 hours';
    DELETE FROM snow_data WHERE expires_at < now() - INTERVAL '24 hours';
    DELETE FROM avalanche_data WHERE expires_at < now() - INTERVAL '24 hours';
    DELETE FROM llm_summaries WHERE expires_at < now() - INTERVAL '24 hours';
    DELETE FROM subscribers WHERE is_verified = false AND created_at < now() - INTERVAL '48 hours';
    DELETE FROM subscribers WHERE is_active = false AND updated_at < now() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- === 010_seed_zones.sql ===
INSERT INTO zones (name, slug, description, lat, lng, polygon, image_url, sort_order) VALUES
(
    'Valle de Ansó / Hecho',
    'anso-hecho',
    'Valles occidentales del Pirineo aragonés. Territorio de montaña media con bosques extensos y cumbres como la Mesa de los Tres Reyes (2.428m).',
    42.78, -0.82,
    '{"type":"Polygon","coordinates":[[[-0.95,42.70],[-0.68,42.70],[-0.68,42.88],[-0.95,42.88],[-0.95,42.70]]]}',
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    1
),
(
    'Canfranc / Astún / Candanchú',
    'canfranc',
    'Valle del Aragón con dos estaciones de esquí alpino. Acceso al Puerto del Somport y al Pico de Aspe (2.645m).',
    42.75, -0.52,
    '{"type":"Polygon","coordinates":[[[-0.62,42.68],[-0.42,42.68],[-0.42,42.82],[-0.62,42.82],[-0.62,42.68]]]}',
    'https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=800',
    2
),
(
    'Valle de Tena / Formigal-Panticosa',
    'tena',
    'Valle amplio con la mayor estación de esquí del Pirineo (Formigal-Panticosa). Cumbres como Balaitus (3.144m) y Vignemale en la frontera.',
    42.77, -0.32,
    '{"type":"Polygon","coordinates":[[[-0.45,42.68],[-0.18,42.68],[-0.18,42.85],[-0.45,42.85],[-0.45,42.68]]]}',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
    3
),
(
    'Ordesa / Monte Perdido / Bujaruelo',
    'ordesa',
    'Parque Nacional de Ordesa y Monte Perdido. Cañones espectaculares y el Monte Perdido (3.355m), Patrimonio de la Humanidad.',
    42.66, -0.05,
    '{"type":"Polygon","coordinates":[[[-0.18,42.58],[ 0.08,42.58],[ 0.08,42.74],[-0.18,42.74],[-0.18,42.58]]]}',
    'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800',
    4
),
(
    'Bielsa / Pineta',
    'bielsa',
    'Valle de Pineta, uno de los más bellos del Pirineo. Circo glaciar con paredes de 3.000m y acceso al Monte Perdido por su cara norte.',
    42.63, 0.13,
    '{"type":"Polygon","coordinates":[[[0.03,42.55],[0.25,42.55],[0.25,42.72],[0.03,42.72],[0.03,42.55]]]}',
    'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800',
    5
),
(
    'Benasque / Maladeta / Aneto',
    'benasque',
    'Valle de Benasque con el techo del Pirineo: Aneto (3.404m). Macizo de la Maladeta con glaciares y rutas de alta montaña.',
    42.60, 0.52,
    '{"type":"Polygon","coordinates":[[[0.38,42.52],[0.65,42.52],[0.65,42.70],[0.38,42.70],[0.38,42.52]]]}',
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
    6
),
(
    'Posets / Eriste',
    'posets',
    'Macizo de Posets, segunda cumbre del Pirineo (3.375m). Territorio de alta montaña con lagos glaciares y rutas exigentes.',
    42.65, 0.43,
    '{"type":"Polygon","coordinates":[[[0.33,42.58],[0.52,42.58],[0.52,42.72],[0.33,42.72],[0.33,42.58]]]}',
    'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=800',
    7
),
(
    'Cerler / Ampriu',
    'cerler',
    'Estación de esquí de Cerler-Ampriu y acceso al macizo de Castanesa. Excelente esquí de montaña y fuera de pista.',
    42.56, 0.53,
    '{"type":"Polygon","coordinates":[[[0.43,42.48],[0.62,42.48],[0.62,42.62],[0.43,42.62],[0.43,42.48]]]}',
    'https://images.unsplash.com/photo-1551524559-8af4e6624178?w=800',
    8
);


-- === 011_seed_routes.sql ===
-- Seed routes — placeholder routes based on popular Pyrenees objectives.
-- Your friend should review and expand this list with real local knowledge.

-- Routes reference zone IDs dynamically
INSERT INTO routes (zone_id, name, difficulty, activity_type, altitude_min, altitude_max, altitude_gain, description, aspects, season)
SELECT z.id, r.name, r.difficulty, r.activity_type::text, r.altitude_min, r.altitude_max, r.altitude_gain, r.description, r.aspects, r.season
FROM zones z
JOIN (VALUES
    -- Canfranc / Astún / Candanchú
    ('canfranc', 'Canal Roya', 'PD', 'ski_touring', 1700, 2886, 1186,
     'Clásica del esquí de montaña aragonés. Subida por el valle y descenso por canal.', ARRAY['N','NE'], ARRAY['winter','spring']),
    ('canfranc', 'Pico de Aspe', 'PD+', 'both', 1640, 2645, 1005,
     'Ascensión desde Candanchú por el circo. Buenas condiciones de nieve en invierno.', ARRAY['N','NW'], ARRAY['winter','spring']),
    -- Valle de Tena
    ('tena', 'Pico de Arriel', 'AD-', 'mountaineering', 1800, 2824, 1024,
     'Ascensión al Arriel desde el embalse de Respomuso. Vistas espectaculares sobre Balaitus.', ARRAY['S','SE'], ARRAY['summer','spring']),
    ('tena', 'Garmo Negro', 'PD', 'ski_touring', 1800, 3051, 1251,
     'Travesía desde Balneario de Panticosa. Uno de los tresmiles más accesibles.', ARRAY['N','NE'], ARRAY['winter','spring']),
    ('tena', 'Gran Facha', 'PD+', 'both', 1800, 3005, 1205,
     'Ascensión fronteriza desde el ibón de Respomuso. Esquí de montaña y alpinismo.', ARRAY['N','E'], ARRAY['winter','spring','summer']),
    -- Ordesa / Monte Perdido
    ('ordesa', 'Monte Perdido por Góriz', 'PD+', 'mountaineering', 1300, 3355, 2055,
     'Ruta clásica al Monte Perdido por el Refugio de Góriz. Larga y exigente.', ARRAY['S','SW'], ARRAY['summer']),
    ('ordesa', 'Brecha de Rolando', 'F+', 'both', 1300, 2807, 1507,
     'Ruta histórica hasta la famosa brecha. Accesible como iniciación al alta montaña.', ARRAY['N','NW'], ARRAY['summer','spring']),
    -- Bielsa / Pineta
    ('bielsa', 'Balcón de Pineta', 'PD', 'mountaineering', 1270, 2775, 1505,
     'Ascensión por el circo de Pineta. Vistas únicas del Monte Perdido por su cara norte.', ARRAY['S','SE'], ARRAY['summer']),
    ('bielsa', 'La Munia', 'PD+', 'both', 1800, 3134, 1334,
     'Ascensión a La Munia desde el puerto de Bielsa. Esquí de montaña en primavera.', ARRAY['N','NE'], ARRAY['winter','spring','summer']),
    -- Benasque / Maladeta / Aneto
    ('benasque', 'Aneto por La Renclusa', 'PD', 'mountaineering', 2140, 3404, 1264,
     'Ruta normal al techo del Pirineo. Glaciar de Aneto con paso del Puente de Mahoma.', ARRAY['S','SW'], ARRAY['summer']),
    ('benasque', 'Maladeta Occidental', 'AD', 'mountaineering', 2140, 3308, 1168,
     'Ascensión técnica a la Maladeta. Corredor y aristas con tramos de escalada.', ARRAY['N','NE'], ARRAY['summer']),
    ('benasque', 'Corredor Estasen', 'MD-', 'ski_touring', 2140, 3308, 1168,
     'Corredor de nieve/hielo clásico del Pirineo. Solo para expertos con material adecuado.', ARRAY['N'], ARRAY['winter','spring']),
    ('benasque', 'Pico de Alba', 'PD', 'ski_touring', 2140, 3118, 978,
     'Esquí de montaña desde La Renclusa. Canal norte con buena nieve hasta primavera.', ARRAY['N','NW'], ARRAY['winter','spring']),
    -- Posets / Eriste
    ('posets', 'Posets por Ángel Orús', 'PD+', 'mountaineering', 1800, 3375, 1575,
     'Ascensión al segundo techo del Pirineo desde el Refugio Ángel Orús. Largo y exigente.', ARRAY['S','SE'], ARRAY['summer']),
    ('posets', 'Canal de Eriste', 'AD', 'ski_touring', 1400, 3375, 1975,
     'Gran desnivel para esquí de montaña. Canal norte del Posets. Solo en buenas condiciones.', ARRAY['N'], ARRAY['spring']),
    -- Cerler / Ampriu
    ('cerler', 'Pico Gallinero', 'F+', 'ski_touring', 1800, 2728, 928,
     'Iniciación al esquí de montaña desde Cerler. Pendientes moderadas y buena orientación.', ARRAY['N','NE'], ARRAY['winter','spring']),
    ('cerler', 'Castanesa', 'PD', 'both', 1700, 2858, 1158,
     'Ascensión al pico Castanesa. Esquí de montaña con canales en cara norte.', ARRAY['N','NW'], ARRAY['winter','spring','summer']),
    -- Ansó / Hecho
    ('anso-hecho', 'Mesa de los Tres Reyes', 'F+', 'mountaineering', 1400, 2428, 1028,
     'Punto más alto de Navarra y frontera triple. Ruta desde el refugio de Linza.', ARRAY['S','SW'], ARRAY['summer']),
    ('anso-hecho', 'Peña Forca', 'PD', 'both', 1400, 2390, 990,
     'Ascensión en los valles occidentales. Bonitas vistas sobre el valle de Ansó.', ARRAY['N','NE'], ARRAY['winter','spring','summer'])
) AS r(zone_slug, name, difficulty, activity_type, altitude_min, altitude_max, altitude_gain, description, aspects, season)
ON z.slug = r.zone_slug;


-- === 012_seed_webcams.sql ===
-- Seed webcams — known public webcam feeds for Pyrenees zones.
-- URLs should be verified for availability and embed permissions.

INSERT INTO webcams (zone_id, name, embed_url, thumbnail_url, source, sort_order)
SELECT z.id, w.name, w.embed_url, w.thumbnail_url, w.source, w.sort_order
FROM zones z
JOIN (VALUES
    ('canfranc', 'Astún - Base', 'https://www.astun.com/webcams/base.jpg', NULL, 'astun.com', 1),
    ('canfranc', 'Candanchú - Tobazo', 'https://www.candanchu.com/webcams/tobazo.jpg', NULL, 'candanchu.com', 2),
    ('tena', 'Formigal - Sextas', 'https://www.formigal-panticosa.com/webcams/sextas.jpg', NULL, 'formigal-panticosa.com', 1),
    ('tena', 'Panticosa - Petrosos', 'https://www.formigal-panticosa.com/webcams/petrosos.jpg', NULL, 'formigal-panticosa.com', 2),
    ('ordesa', 'Torla - Entrada Ordesa', 'https://www.torla-ordesa.es/webcam/ordesa.jpg', NULL, 'torla-ordesa.es', 1),
    ('benasque', 'Refugio de la Renclusa', 'https://www.camareando.com/renclusa/renclusa.jpg', NULL, 'camareando.com', 1),
    ('benasque', 'Benasque pueblo', 'https://www.benasque.com/webcam/pueblo.jpg', NULL, 'benasque.com', 2),
    ('cerler', 'Cerler - Ampriu', 'https://www.cerler.com/webcams/ampriu.jpg', NULL, 'cerler.com', 1),
    ('bielsa', 'Pineta - Parador', 'https://www.bielsa.com/webcam/pineta.jpg', NULL, 'bielsa.com', 1),
    ('posets', 'Refugio Ángel Orús', 'https://www.camareando.com/angelorus/angelorus.jpg', NULL, 'camareando.com', 1),
    ('anso-hecho', 'Refugio de Linza', 'https://www.camareando.com/linza/linza.jpg', NULL, 'camareando.com', 1)
) AS w(zone_slug, name, embed_url, thumbnail_url, source, sort_order)
ON z.slug = w.zone_slug;


