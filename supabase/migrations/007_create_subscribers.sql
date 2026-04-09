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
