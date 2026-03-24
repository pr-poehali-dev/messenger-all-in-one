CREATE TABLE IF NOT EXISTS t_p83659847_messenger_all_in_one.chats (
  id SERIAL PRIMARY KEY,
  type VARCHAR(16) NOT NULL DEFAULT 'chat',
  name VARCHAR(128),
  created_by INTEGER REFERENCES t_p83659847_messenger_all_in_one.users(id),
  created_at TIMESTAMP DEFAULT NOW()
);