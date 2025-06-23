-- Debugging version of the generate_voucher function with better error handling
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
  err_context TEXT;
BEGIN
  -- Generate a unique voucher code
  LOOP
    voucher_code := generate_voucher_code();
    
    -- Check if the voucher code already exists
    IF NOT EXISTS (SELECT 1 FROM vouchers WHERE voucher_code = voucher_code) THEN
      EXIT;
    END IF;
  END LOOP;
  
  -- Log the attempt to insert
  RAISE NOTICE 'Attempting to insert voucher: %, payment_id: %, plan: %, price: %, validity: %', 
    voucher_code, payment_id, plan_id, price, validity_days;
  
  -- Insert the voucher into the database
  BEGIN
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
    
    -- Return success result
    result := jsonb_build_object(
      'success', true,
      'voucher_code', voucher_code,
      'plan_id', plan_id,
      'validity_days', validity_days,
      'db_success', true
    );
    
    RETURN result;
    
  EXCEPTION WHEN OTHERS THEN
    -- Capture detailed error information
    GET STACKED DIAGNOSTICS err_context = PG_EXCEPTION_CONTEXT;
    
    -- Log detailed error
    RAISE WARNING 'Database error inserting voucher: %, Context: %', 
      SQLERRM, err_context;
    
    -- Return with error details but still provide the voucher code
    RETURN jsonb_build_object(
      'success', true,
      'voucher_code', voucher_code,
      'plan_id', plan_id,
      'validity_days', validity_days,
      'db_success', false,
      'db_error', SQLERRM,
      'warning', 'Voucher was generated but there was an issue saving it to the database.'
    );
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
