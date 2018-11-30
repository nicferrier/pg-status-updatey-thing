-- mode: sql

INSERT INTO log (id, d, data)
VALUES ( nextval('log_id'), now(), $1)
RETURNING id;

-- end
