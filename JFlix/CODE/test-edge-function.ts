// Simple Deno script to test our Edge Function locally

// Import the Deno standard library HTTP server
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate a voucher code
function generateVoucherCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'VC-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Main handler function
serve(async (req) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  
  // Log request headers
  console.log("Request headers:");
  for (const [key, value] of req.headers.entries()) {
    console.log(`  ${key}: ${value}`);
  }
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Try to read and log the request body
    const bodyText = await req.text();
    console.log(`Request body (${bodyText.length} bytes):`, bodyText);
    
    // Try to parse the body as JSON if it's not empty
    if (bodyText.trim()) {
      try {
        const data = JSON.parse(bodyText);
        console.log("Parsed JSON data:", data);
      } catch (e) {
        console.log("Failed to parse body as JSON:", e.message);
      }
    }
    
    // Generate a voucher code
    const voucherCode = generateVoucherCode();
    console.log(`Generated voucher code: ${voucherCode}`);
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        voucher_code: voucherCode,
        message: "Voucher generated successfully"
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (e) {
    console.error("Error handling request:", e);
    return new Response(
      JSON.stringify({ error: "Server error", details: e.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
}, { port: 9000 });

console.log("Edge Function test server running at http://localhost:9000");
