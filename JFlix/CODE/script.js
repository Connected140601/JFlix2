// Function to update the 'Back to Account' link based on user's premium status
async function updateAccountLink() {
    const backButton = document.querySelector('.back-to-account-button');
    if (!backButton) {
        console.error('Back to account button not found.');
        return;
    }

    // Default link
    let accountPageUrl = '../account.html';

    try {
        const supabase = window.supabaseClient;
        if (!supabase) {
            console.error('Supabase client not ready for account link update.');
            backButton.href = accountPageUrl;
            return;
        }

        const { data: { session } } = await supabase.auth.getSession();

        if (session && session.user) {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('is_premium')
                .eq('id', session.user.id)
                .single();

            if (error) {
                console.error('Error fetching profile for account link update:', error.message);
            } else if (profile && profile.is_premium) {
                console.log('Premium user detected. Setting account link to NOADS version.');
                accountPageUrl = '../NOADS/account.html';
            }
        }
    } catch (e) {
        console.error('An unexpected error occurred while updating account link:', e);
    } finally {
        backButton.href = accountPageUrl;
        console.log(`Account link set to: ${accountPageUrl}`);
    }
}

// Supabase Client Setup
try {
    console.log('Initializing Supabase client...');
    const supabaseUrl = 'https://ftzeqaazgvgfcamjojbr.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0emVxYWF6Z3ZnZmNhbWpvamJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NzYyMTQsImV4cCI6MjA2NDM1MjIxNH0.jh5SCIifqeKTxAMNFZkI8DnE-8OTvxwKbWBLX-hxORU';
    
    // Check if supabase is defined
    if (!window.supabase) {
        console.error('Supabase client not loaded! Check if the Supabase script is loading correctly.');
        document.body.innerHTML += '<div style="color: red; padding: 20px; background: #ffeeee; border: 1px solid #ff0000; margin: 20px;">Error: Supabase client not loaded. Check console for details.</div>';
    } else {
        console.log('Creating Supabase client...');
        const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
        console.log('Supabase client created successfully:', supabaseClient);
        window.supabaseClient = supabaseClient; // Make it globally available
    }
} catch (error) {
    console.error('Error setting up Supabase client:', error);
    document.body.innerHTML += `<div style="color: red; padding: 20px; background: #ffeeee; border: 1px solid #ff0000; margin: 20px;">Error initializing application: ${error.message}</div>`;
}

document.addEventListener('DOMContentLoaded', () => {
    updateAccountLink(); // Call the function to set the correct link
    console.log('Voucher Generator script loaded.');

    // --- PayPal Button Configuration --- 
    // You will need to replace 'YOUR_PAYPAL_CLIENT_ID' in index.html
    // and configure these buttons with your PayPal logic.

    const voucherPlans = [
        { id: '15', price: '15.00', validity: 7, description: '7 Days Voucher' },
        { id: '30', price: '30.00', validity: 15, description: '15 Days Voucher' },
        { id: '50', price: '50.00', validity: 30, description: '30 Days Voucher' }
    ];

    voucherPlans.forEach(plan => {
        if (typeof paypal !== 'undefined') {
            paypal.Buttons({
                createOrder: function(data, actions) {
                    // Set up the transaction
                    return actions.order.create({
                        purchase_units: [{
                            description: plan.description,
                            amount: {
                                value: plan.price,
                                currency_code: 'PHP'
                            }
                        }]
                    });
                },
                onApprove: function(data, actions) {
                    // This function captures the funds from the transaction.
                    return actions.order.capture().then(function(details) {
                        // Show a success message to your buyer
                        console.log('Transaction completed by ' + details.payer.name.given_name);
                        console.log('Payment Details:', details);
                        
                        // Call Supabase function to generate voucher
                        generateVoucher(plan, details);
                    }).catch(function(err) {
                        console.error('PayPal onApprove error:', err);
                        alert('An error occurred during payment approval. Please try again.');
                    });
                },
                onError: function(err) {
                    // For example, redirect to a specific error page
                    console.error('PayPal Button SDK error:', err);
                    alert('An error occurred with the PayPal payment. Please try again or contact support.');
                }
            }).render(`#paypal-button-container-${plan.id}`).catch(err => {
                console.error(`Failed to render PayPal button for plan ${plan.id}:`, err);
                const buttonContainer = document.getElementById(`paypal-button-container-${plan.id}`);
                if (buttonContainer) {
                    buttonContainer.innerHTML = '<p style="color: red;">Error loading PayPal button. Ensure your Client ID is correct and you are online.</p>';
                }
            });
        } else {
            console.error('PayPal SDK not loaded. Ensure the script tag in index.html is correct and you have an internet connection.');
            voucherPlans.forEach(p => {
                const btnContainer = document.getElementById(`paypal-button-container-${p.id}`);
                if(btnContainer) btnContainer.innerHTML = '<p style="color: red;">PayPal not available.</p>';
            });
        }
    });

    // Utility function to show/hide loading indicator
    function showLoading(show = true) {
        // Create loading element if it doesn't exist
        let loadingElement = document.getElementById('loading-indicator');
        if (!loadingElement) {
            loadingElement = document.createElement('div');
            loadingElement.id = 'loading-indicator';
            loadingElement.innerHTML = `
                <div class="loading-overlay">
                    <div class="loading-spinner"></div>
                    <p>Processing your payment and generating voucher...</p>
                </div>
            `;
            document.body.appendChild(loadingElement);
        }
        
        loadingElement.style.display = show ? 'block' : 'none';
    }
    
    // Function to display the voucher code to the user
    function displayVoucherCode(code, validityDays) {
        // Hide loading indicator
        showLoading(false);
        
        // Get the voucher result div and its elements
        const voucherResultDiv = document.getElementById('voucher-result');
        const generatedVoucherCodeP = document.getElementById('generated-voucher-code');
        const voucherValidityDurationSpan = document.getElementById('voucher-validity-duration');
        
        // Set the voucher code and validity
        generatedVoucherCodeP.textContent = code;
        voucherValidityDurationSpan.textContent = validityDays;
        
        // Display the voucher result div
        voucherResultDiv.style.display = 'block';
    }
    
    // Track payments we've already processed to prevent duplicates
    const processedPayments = new Set();
    
    async function generateVoucher(plan, paymentDetails) {
        console.log(`Attempting to generate voucher for plan: ${plan.description}, Payment ID: ${paymentDetails.id}`);
        console.log('Plan data:', plan);
        console.log('PayPal details:', paymentDetails);
        
        // Prevent duplicate processing of the same payment
        if (processedPayments.has(paymentDetails.id)) {
            console.warn(`Payment ID ${paymentDetails.id} already processed. Ignoring duplicate request.`);
            alert('This payment has already been processed. Please check for your voucher code.');
            return;
        }
        
        // Add this payment to our processed set
        processedPayments.add(paymentDetails.id);
        
        // Show loading indicator
        showLoading(true);
        
        try {
            console.log('Using direct Supabase database function instead of Edge Function');
            
            // Extract payer email from PayPal payment details
            const payerEmail = paymentDetails.payer?.email_address || '';
            
            // Call the Supabase database function directly via RPC
            console.log('Calling Supabase RPC function: generate_voucher');

            // Log the exact parameters being sent
            const params = {
                payment_id: paymentDetails.id,
                plan_id: plan.id,
                price: parseFloat(plan.price),
                validity_days: plan.validity,
                payer_email: payerEmail
            };
            console.log('Parameters being sent to generate_voucher:', params);

            const { data: voucherData, error } = await window.supabaseClient.rpc('generate_voucher', params);
            
            console.log('Supabase RPC response:', voucherData);
            
            // Check for errors first
            if (error) {
                console.error('Error from Supabase RPC:', error);
                throw new Error(`Database function error: ${error.message}`);
            }
            
            if (!voucherData) {
                console.error('No data returned from Supabase function');
                throw new Error('No data returned from database function');
            }
            
            // After call, check for actual database insertion success
            if (voucherData && voucherData.db_success === false) {
                console.warn('Voucher code generated but not saved to database:', voucherData.db_error);
                // You could still continue since we have the voucher code
                // But alert the user or log for admin attention
            }
            
            if (voucherData.success && voucherData.voucher_code) {
                console.log('Successfully generated voucher:', voucherData.voucher_code);
                
                // Display the voucher code to the user
                displayVoucherCode(voucherData.voucher_code, voucherData.validity_days);
                
                // Check if there's a warning to log
                if (voucherData.warning) {
                    console.warn('Warning from voucher generation:', voucherData.warning);
                }
                
                alert(`Payment successful! Your voucher code is ${voucherData.voucher_code}`);
            } else {
                throw new Error('Voucher code not received from database function.');
            }
        } catch (error) {
            console.error('Error generating voucher:', error);
            
            // Hide loading indicator even in case of error
            showLoading(false);
            
            alert('Payment was successful, but there was an error generating your voucher code. Please contact support with Payment ID: ' + paymentDetails.id);
            // Optionally, display an error message in the UI
            const voucherResultDiv = document.getElementById('voucher-result');
            voucherResultDiv.innerHTML = `<p style="color:red;">Error generating voucher. Please contact support. Payment ID: ${paymentDetails.id}</p>`;
            voucherResultDiv.style.display = 'block';
        }
    }
});
