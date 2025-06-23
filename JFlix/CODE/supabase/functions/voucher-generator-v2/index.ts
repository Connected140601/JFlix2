// Ultra-minimal Edge Function with no dependencies

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate a simple voucher code
function generateVoucherCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'VC-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Main handler function
Deno.serve(async (req) => {
  // Log request method
  console.log(`Request method: ${req.method}`);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // For any request type, just generate a voucher code
    // No parsing of request body at all
    const voucherCode = generateVoucherCode();
    console.log(`Generated voucher code: ${voucherCode}`);
    
    // Return success with voucher code
    return new Response(
      JSON.stringify({
        success: true,
        voucher_code: voucherCode,
        message: 'Voucher generated successfully'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }, 
        status: 200 
      }
    );
  } catch (e) {
    console.error('Error:', e);
    return new Response(
      JSON.stringify({ 
        error: 'Server error', 
        details: e.message 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }, 
        status: 500 
      }
    );
  }
});
