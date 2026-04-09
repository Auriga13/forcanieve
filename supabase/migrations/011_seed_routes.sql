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
