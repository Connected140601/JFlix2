// Full implementation of the Edge Function with PayPal verification and database storage

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// PayPal API URLs (Sandbox)
const PAYPAL_API_BASE_URL = 'https://api-m.paypal.com';

// Helper function to get PayPal Access Token
async function getPayPalAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const auth = btoa(`${clientId}:${clientSecret}`);
  const response = await fetch(`${PAYPAL_API_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('PayPal Auth Error Response:', errorBody);
    throw new Error(`Failed to get PayPal access token: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Helper function to verify PayPal Order
async function verifyPayPalOrder(orderId: string, accessToken: string): Promise<any> {
  const response = await fetch(`${PAYPAL_API_BASE_URL}/v2/checkout/orders/${orderId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('PayPal Verify Order Response:', errorBody);
    throw new Error(`Failed to verify PayPal order: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

// Helper function to generate a unique voucher code
function generateVoucherCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'VC-'; // Prefix
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

// Log function with timestamp
function log(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}] ${message}`, data);
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
}

// Main handler function
Deno.serve(async (req) => {
  log(`Request received: ${req.method}`);
  
  // Log all headers
  try {
    let headersText = '';
    for (const [key, value] of req.headers.entries()) {
      headersText += `${key}: ${value}\n`;
    }
    log('Request Headers:', headersText);
  } catch (e) {
    log('Error logging headers', e);
  }
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // First, try to read the raw request body as text
    log('Reading request body as text...');
    const bodyText = await req.text();
    log(`Raw body received (${bodyText.length} bytes):`, bodyText);
    
    // Try to parse the body as JSON if it's not empty
    let data: any = {};
    if (bodyText && bodyText.trim() !== '') {
      try {
        data = JSON.parse(bodyText);
        log('Successfully parsed JSON payload:', data);
      } catch (e) {
        log(`JSON parse error: ${e.message}`, bodyText);
        // Continue anyway - we'll generate a voucher code regardless
      }
    }
    
    // Extract payment ID from the request if available
    const paymentId = data.paymentDetails?.id;
    if (!paymentId) {
      log('No payment ID found in request');
      return new Response(
        JSON.stringify({ error: 'Missing payment ID' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Verify PayPal payment
    const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID');
    const PAYPAL_CLIENT_SECRET = Deno.env.get('PAYPAL_CLIENT_SECRET');
    
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      log('PayPal API credentials not set');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    try {
      log('Getting PayPal access token...');
      const accessToken = await getPayPalAccessToken(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET);
      
      log(`Verifying PayPal order ${paymentId}...`);
      const orderDetails = await verifyPayPalOrder(paymentId, accessToken);
      
      if (orderDetails.status !== 'COMPLETED') {
        log(`PayPal order not completed. Status: ${orderDetails.status}`);
        return new Response(
          JSON.stringify({ error: 'Payment not completed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      log('PayPal order verified successfully');
      
      // Generate a unique voucher code
      const voucherCode = generateVoucherCode();
      log(`Generated voucher code: ${voucherCode}`);
      
      // Connect to Supabase
      const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        log('Supabase credentials not set');
        return new Response(
          JSON.stringify({ error: 'Server configuration error' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
      // Import Supabase client dynamically to avoid issues
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      // Get payer email from PayPal order
      const payerEmail = orderDetails.payer?.email_address || '';
      
      // Extract plan details
      const planId = data.plan?.id || 'unknown';
      const planPrice = data.plan?.price || 0;
      const validityDays = data.plan?.validity || 30;
      
      // Insert voucher into database
      log('Inserting voucher into database...');
      const { data: insertData, error: insertError } = await supabase
        .from('vouchers')
        .insert({
          voucher_code: voucherCode,
          plan_id: planId,
          price: planPrice,
          validity_days: validityDays,
          paypal_payment_id: paymentId,
          payer_email: payerEmail
        });
      
      if (insertError) {
        log('Error inserting voucher into database:', insertError);
        // Still return the voucher code to the user even if DB insert fails
        // This way they at least get their code
        return new Response(
          JSON.stringify({ 
            success: true, 
            voucher_code: voucherCode,
            plan_id: planId,
            validity_days: validityDays,
            warning: 'Voucher was generated but there was an issue saving it to the database.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
      
      // Return successful response with voucher code
      log('Successfully generated and stored voucher code');
      return new Response(
        JSON.stringify({ 
          success: true, 
          voucher_code: voucherCode,
          plan_id: planId,
          validity_days: validityDays
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
      
    } catch (error) {
      log('Error verifying payment:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to verify payment', details: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
  } catch (e) {
    log('Unhandled error in Edge Function', e);
    return new Response(
      JSON.stringify({ error: 'Server error', details: e.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
