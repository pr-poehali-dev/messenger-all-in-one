CREATE TABLE IF NOT EXISTS t_p83659847_messenger_all_in_one.sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES t_p83659847_messenger_all_in_one.users(id),
  token VARCHAR(128) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days'
);