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
