ALTER TABLE t_p83659847_messenger_all_in_one.users
  ADD COLUMN IF NOT EXISTS phone character varying(20) UNIQUE;