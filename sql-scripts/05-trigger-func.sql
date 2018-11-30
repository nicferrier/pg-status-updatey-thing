CREATE OR REPLACE FUNCTION create_or_replace_trigger(
    table_name text,
    trigger_name text,
    function_name text
)
RETURNS void AS $$
begin
  PERFORM tgname FROM pg_trigger WHERE tgname = trigger_name;
  if NOT FOUND then
    EXECUTE 'CREATE TRIGGER ' || quote_ident(trigger_name) || ' '
      || 'AFTER INSERT OR UPDATE OR DELETE ON ' || quote_ident(table_name) || ' '
      || 'FOR EACH ROW EXECUTE PROCEDURE ' || quote_ident(function_name) || '();';
  end if;
end;
$$ LANGUAGE plpgsql;

-- End

