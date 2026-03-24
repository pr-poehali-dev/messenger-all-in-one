CREATE TABLE IF NOT EXISTS t_p83659847_messenger_all_in_one.sms_codes (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(6) NOT NULL,
    purpose VARCHAR(20) NOT NULL DEFAULT 'register',
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '10 minutes',
    used BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_sms_codes_phone ON t_p83659847_messenger_all_in_one.sms_codes(phone);
