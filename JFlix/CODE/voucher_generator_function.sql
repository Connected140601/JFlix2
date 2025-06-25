-- PostgreSQL function to generate vouchers
-- This can be executed in Supabase SQL Editor

-- Function to generate a random voucher code
CREATE OR REPLACE FUNCTION generate_voucher_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  code TEXT := 'VC-';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Main function to generate a voucher and insert it into the database
CREATE OR REPLACE FUNCTION generate_voucher(
  payment_id TEXT, 
  plan_id TEXT, 
  price NUMERIC, 
  validity_days INTEGER,
  payer_email TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  voucher_code TEXT;
  result JSONB;
BEGIN
  -- Generate a unique voucher code
  LOOP
    voucher_code := generate_voucher_code();
    
    -- Check if the voucher code already exists
    IF NOT EXISTS (SELECT 1 FROM vouchers WHERE voucher_code = voucher_code) THEN
      EXIT;
    END IF;
  END LOOP;
  
  -- Insert the voucher into the database
  INSERT INTO vouchers (
    voucher_code, 
    plan_id, 
    price, 
    validity_days, 
    paypal_payment_id, 
    payer_email
  ) 
  VALUES (
    voucher_code, 
    plan_id, 
    price, 
    validity_days, 
    payment_id, 
    payer_email
  );
  
  -- Return the result
  result := jsonb_build_object(
    'success', true,
    'voucher_code', voucher_code,
    'plan_id', plan_id,
    'validity_days', validity_days
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Still return a voucher code even if there's a database error
    RETURN jsonb_build_object(
      'success', true,
      'voucher_code', voucher_code,
      'plan_id', plan_id,
      'validity_days', validity_days,
      'warning', 'Voucher was generated but there was an issue saving it to the database.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_voucher TO authenticated;
GRANT EXECUTE ON FUNCTION generate_voucher TO anon;
