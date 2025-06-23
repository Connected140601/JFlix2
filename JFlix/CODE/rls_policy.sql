-- Allow anon and authenticated roles to insert into vouchers table
CREATE POLICY "Allow voucher inserts for anon and authenticated" 
ON vouchers 
FOR INSERT 
TO anon, authenticated 
WITH CHECK (true);

-- Grant execute permission to both authenticated and anon roles
GRANT EXECUTE ON FUNCTION generate_voucher TO authenticated, anon;
GRANT EXECUTE ON FUNCTION generate_voucher_code TO authenticated, anon;
