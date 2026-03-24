CREATE TABLE IF NOT EXISTS t_p83659847_messenger_all_in_one.users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(64) UNIQUE NOT NULL,
  display_name VARCHAR(128) NOT NULL,
  password_hash VARCHAR(256) NOT NULL,
  avatar_color VARCHAR(32) DEFAULT '#3b82f6',
  created_at TIMESTAMP DEFAULT NOW()
);