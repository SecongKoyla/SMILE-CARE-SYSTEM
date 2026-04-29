-- Rename full_name column to first_name and last_name 
-- Or split it if there's data

ALTER TABLE users ADD COLUMN first_name VARCHAR(100);
ALTER TABLE users ADD COLUMN last_name VARCHAR(100);

-- Migrate existing data (split by first space)
UPDATE users 
SET first_name = SPLIT_PART(full_name, ' ', 1),
    last_name = CASE 
                  WHEN POSITION(' ' IN full_name) > 0 THEN SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1)
                  ELSE '' 
                END
WHERE full_name IS NOT NULL AND first_name IS NULL;

-- Make them NOT NULL 
ALTER TABLE users ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE users ALTER COLUMN last_name SET NOT NULL;

-- Finally drop the full_name column
ALTER TABLE users DROP COLUMN full_name;
