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
