--  log trigger to serialize status data into other structures  -*- mode: sql -*-

CREATE OR REPLACE FUNCTION log_trigger() RETURNS trigger AS $log_trigger$
begin
    -- normalize user statuses
    CREATE SEQUENCE IF NOT EXISTS user_status_id;
    CREATE TABLE IF NOT EXISTS user_status (
      id SERIAL,
      d TIMESTAMP WITH TIME ZONE,
      username TEXT,
      log_id SERIAL
    );
    INSERT INTO user_status (id, d, username, log_id)
    VALUES (
      nextval('user_status_id'),
      NEW.d,
      NEW.data->>'user',
      NEW.id
    );
    -- notify the user
    PERFORM pg_notify('log', NEW.data::TEXT);
    RETURN NULL;
end;
$log_trigger$ LANGUAGE plpgsql;

-- End
