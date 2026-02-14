-- Function to calculate age from a date (birthday)
-- Returns the age in years.
CREATE OR REPLACE FUNCTION public.get_age(birthday date)
RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
  IF birthday IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN date_part('year', age(birthday));
END;
$$;
