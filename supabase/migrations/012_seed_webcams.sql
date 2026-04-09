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
