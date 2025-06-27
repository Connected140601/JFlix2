-- Fixed version of the generate_voucher function that resolves the ambiguous column reference
CREATE OR REPLACE FUNCTION generate_voucher(
  payment_id TEXT, 
  plan_id TEXT, 
  price NUMERIC, 
  validity_days INTEGER,
  payer_email TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_voucher_code TEXT;
  result JSONB;
  err_context TEXT;
BEGIN
  -- Generate a unique voucher code
  LOOP
    v_voucher_code := generate_voucher_code();
    
    -- Check if the voucher code already exists
    -- Fixed ambiguity by using a different variable name and referencing the table column explicitly
    IF NOT EXISTS (SELECT 1 FROM vouchers WHERE vouchers.voucher_code = v_voucher_code) THEN
      EXIT;
    END IF;
  END LOOP;
  
  -- Log the attempt to insert
  RAISE NOTICE 'Attempting to insert voucher: %, payment_id: %, plan: %, price: %, validity: %', 
    v_voucher_code, payment_id, plan_id, price, validity_days;
  
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
      v_voucher_code, 
      plan_id, 
      price, 
      validity_days, 
      payment_id, 
      payer_email
    );
    
    -- Return success result
    result := jsonb_build_object(
      'success', true,
      'voucher_code', v_voucher_code,
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
      'voucher_code', v_voucher_code,
      'plan_id', plan_id,
      'validity_days', validity_days,
      'db_success', false,
      'db_error', SQLERRM,
      'warning', 'Voucher was generated but there was an issue saving it to the database.'
    );
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure permissions are granted
GRANT EXECUTE ON FUNCTION generate_voucher TO authenticated, anon;
GRANT EXECUTE ON FUNCTION generate_voucher_code TO authenticated, anon;
