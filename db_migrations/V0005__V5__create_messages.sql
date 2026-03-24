CREATE TABLE IF NOT EXISTS t_p83659847_messenger_all_in_one.messages (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER REFERENCES t_p83659847_messenger_all_in_one.chats(id),
  sender_id INTEGER REFERENCES t_p83659847_messenger_all_in_one.users(id),
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON t_p83659847_messenger_all_in_one.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON t_p83659847_messenger_all_in_one.sessions(token);
CREATE INDEX IF NOT EXISTS idx_chat_members_user ON t_p83659847_messenger_all_in_one.chat_members(user_id);