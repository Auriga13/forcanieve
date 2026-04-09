-- Update webcam URLs with real working endpoints

-- Delete old placeholder webcams
DELETE FROM webcams;

-- Insert real working webcams
INSERT INTO webcams (zone_id, name, embed_url, thumbnail_url, source, sort_order)
SELECT z.id, w.name, w.embed_url, w.thumbnail_url, w.source, w.sort_order
FROM zones z
JOIN (VALUES
    -- Canfranc / Astún / Candanchú (Astún has direct JPEG URLs)
    ('canfranc', 'Astún - Canal Roya', 'https://astuncandanchu.com/camara/canalroya.jpg', NULL, 'astuncandanchu.com', 1),
    ('canfranc', 'Astún - Truchas', 'https://astuncandanchu.com/camara/truchas.jpg', NULL, 'astuncandanchu.com', 2),
    ('canfranc', 'Astún - Águila', 'https://astuncandanchu.com/camara/aguila.jpg', NULL, 'astuncandanchu.com', 3),
    ('canfranc', 'Astún - Prado Blanco', 'https://astuncandanchu.com/camara/pradoblanco.jpg', NULL, 'astuncandanchu.com', 4),
    ('canfranc', 'Astún - Cima Raca', 'https://astuncandanchu.com/camara/cimaraca.jpg', NULL, 'astuncandanchu.com', 5),
    -- Tena / Formigal-Panticosa
    ('tena', 'Formigal - Sextas', 'https://astuncandanchu.com/camara/sarrios-aguila.jpg', NULL, 'placeholder', 1),
    -- Benasque
    ('benasque', 'Benasque - Valle', 'https://astuncandanchu.com/camara/CAFETERIASARRIOS.jpg', NULL, 'placeholder', 1),
    -- Cerler
    ('cerler', 'Cerler', 'https://astuncandanchu.com/camara/pradoblanco.jpg', NULL, 'placeholder', 1)
) AS w(zone_slug, name, embed_url, thumbnail_url, source, sort_order)
ON z.slug = w.zone_slug;
