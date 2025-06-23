-- SQL to add used_by column to vouchers table
ALTER TABLE vouchers
ADD COLUMN IF NOT EXISTS used_by TEXT;

-- Update existing vouchers to have NULL in used_by column
UPDATE vouchers
SET used_by = NULL
WHERE used_by IS NULL;
