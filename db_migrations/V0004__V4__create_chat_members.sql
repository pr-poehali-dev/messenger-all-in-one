CREATE TABLE IF NOT EXISTS t_p83659847_messenger_all_in_one.chat_members (
  chat_id INTEGER REFERENCES t_p83659847_messenger_all_in_one.chats(id),
  user_id INTEGER REFERENCES t_p83659847_messenger_all_in_one.users(id),
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (chat_id, user_id)
);