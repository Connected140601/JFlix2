# Voucher Generator Website

This project is a web application that allows users to purchase voucher codes using PayPal. The backend is integrated with Supabase Edge Functions for secure voucher generation and database storage.

## Features

-   Users can select from different voucher plans (varying price and validity).
-   Payment processing via PayPal.
-   Generation of a unique voucher code upon successful payment.
-   Voucher codes are designed to be single-use.

## Project Structure

-   `index.html`: The main HTML file for the user interface.
-   `style.css`: CSS file for styling the application.
-   `script.js`: JavaScript file for frontend logic, PayPal integration, and communication with Supabase.

## Setup Instructions

### 1. Clone the Repository (if applicable)
   ```bash
   git clone <repository-url>
   cd VoucherGenerator
   ```

### 2. PayPal Setup
   -   Create a PayPal Developer account at [https://developer.paypal.com/](https://developer.paypal.com/).
   -   Create a new REST API app in the PayPal Developer Dashboard to get your **Client ID** and **Secret**.
   -   Open `index.html` and ensure the PayPal SDK script tag has your PayPal Client ID:
     ```html
     <script src="https://www.paypal.com/sdk/js?client-id=YOUR_PAYPAL_CLIENT_ID&currency=PHP"></script>
     ```
   -   For the Supabase Edge Function, you'll need to set your PayPal credentials as environment variables:
     ```bash
     supabase secrets set PAYPAL_CLIENT_ID=your_paypal_client_id
     supabase secrets set PAYPAL_CLIENT_SECRET=your_paypal_client_secret
     ```

### 3. Supabase Setup
   -   Create a Supabase account at [https://supabase.com/](https://supabase.com/).
   -   Create a new project in Supabase.
   -   **Database Table:** Create the `vouchers` table in your Supabase database with the following SQL:

     ```sql
     CREATE TABLE vouchers (
         id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
         created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
         voucher_code TEXT UNIQUE NOT NULL,
         plan_id TEXT NOT NULL,
         price NUMERIC(10, 2) NOT NULL,
         validity_days INTEGER NOT NULL,
         expires_at TIMESTAMPTZ,
         is_used BOOLEAN DEFAULT FALSE NOT NULL,
         used_at TIMESTAMPTZ,
         paypal_payment_id TEXT UNIQUE NOT NULL,
         payer_email TEXT
     );

     -- Add a trigger to automatically set expiration date
     CREATE OR REPLACE FUNCTION set_voucher_expiration()
     RETURNS TRIGGER AS $$
     BEGIN
         NEW.expires_at = NEW.created_at + (NEW.validity_days * INTERVAL '1 day');
         RETURN NEW;
     END;
     $$ LANGUAGE plpgsql;

     CREATE TRIGGER trigger_set_voucher_expiration
     BEFORE INSERT ON vouchers
     FOR EACH ROW
     EXECUTE FUNCTION set_voucher_expiration();

     -- Add RLS policy to control access
     ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;

     CREATE POLICY "Allow full access for service_role"
     ON vouchers
     FOR ALL
     USING (auth.role() = 'service_role')
     WITH CHECK (auth.role() = 'service_role');
     ```

   -   **Supabase Edge Function (`generate-voucher`):**
     -   Create a Supabase Edge Function named `generate-voucher` which handles:
         1.  Parsing the request body containing payment and plan details
         2.  Verifying the PayPal payment through the PayPal API
         3.  Generating a unique voucher code
         4.  Storing the voucher in the Supabase database
         5.  Returning the voucher code to the frontend
     -   Set the necessary environment variables for the Edge Function:

     ```bash
     supabase secrets set SUPABASE_URL=your_supabase_project_url
     supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
     ```

   -   **Frontend Configuration:**
     -   The Supabase client is already initialized in `script.js` with the necessary project URL and anon key
     -   The frontend correctly sends plan and payment details to the Edge Function and displays the returned voucher code

### 4. Running the Application
   -   Open `index.html` in your web browser to view the application.
   -   For local development involving Supabase Edge Functions, you'll typically use the Supabase CLI to serve functions locally.

## How it Works

1.  The user selects a voucher plan on `index.html`.
2.  The user clicks the PayPal button associated with their chosen plan.
3.  The PayPal SDK handles the payment flow.
4.  Upon successful payment approval (`onApprove` in `script.js`):
    a.  The frontend script (`script.js`) collects payment details.
    b.  It calls the `generate-voucher` Supabase Edge Function, passing necessary information (plan details, PayPal payment ID).
5.  The Supabase Edge Function:
    a.  Verifies the PayPal payment.
    b.  Generates a unique voucher code.
    c.  Saves the voucher code and related details to the Supabase `vouchers` table.
    d.  Returns the generated voucher code.
6.  `script.js` receives the voucher code and displays it to the user on the webpage.

## Important Security Note

**Always verify PayPal payments on the server-side (within your Supabase Edge Function) before generating and issuing a voucher.** Do not rely solely on client-side confirmation, as it can be manipulated. The Edge Function should use the PayPal Order ID (or Transaction ID) to make a server-to-server call to PayPal's API to confirm the payment status and amount are correct.
