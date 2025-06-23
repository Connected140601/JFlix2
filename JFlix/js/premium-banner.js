// This script relies on the global Supabase client initialized in auth.js
// It is accessed via `window.supabaseClient`.
const supabase = window.supabaseClient;

// Currency conversion rates (PHP to other currencies)
const CURRENCY_RATES = {
    'USD': 0.019, 'EUR': 0.017, 'GBP': 0.015, 'JPY': 2.6, 'AUD': 0.028, 'CAD': 0.025, 'SGD': 0.026, 'MYR': 0.082, 'THB': 0.63, 'IDR': 275.00, 'VND': 450.00, 'HKD': 0.15, 'TWD': 0.058, 'KRW': 24.5, 'NZD': 0.029, 'INR': 1.50, 'CNY': 0.13, 'DKK': 0.12, 'SEK': 0.18, 'NOK': 0.19, 'CHF': 0.018,
};

// Currency symbols
const CURRENCY_SYMBOLS = {
    'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'AUD': '$', 'CAD': '$', 'SGD': '$', 'MYR': 'RM', 'THB': '฿', 'IDR': 'Rp', 'VND': '₫', 'HKD': 'HK$', 'TWD': 'NT$', 'KRW': '₩', 'NZD': '$', 'INR': '₹', 'CNY': '¥', 'DKK': 'kr', 'SEK': 'kr', 'NOK': 'kr', 'CHF': 'CHF', 'PHP': '₱',
};

// Map country codes to currencies
const COUNTRY_CURRENCIES = {
    'US': 'USD', 'CA': 'CAD', 'AU': 'AUD', 'GB': 'GBP', 'JP': 'JPY', 'SG': 'SGD', 'MY': 'MYR', 'TH': 'THB', 'ID': 'IDR', 'VN': 'VND', 'HK': 'HKD', 'TW': 'TWD', 'KR': 'KRW', 'NZ': 'NZD', 'IN': 'INR', 'CN': 'CNY', 'DK': 'DKK', 'SEK': 'SEK', 'NO': 'NOK', 'CH': 'CHF', 'PH': 'PHP'
};

// Base prices in PHP
const BASE_PRICES = {
    '7': 15,  // 7 days
    '15': 30, // 15 days
    '30': 50  // 30 days
};

// Helper to determine the correct base path for resources
function getBasePath() {
    if (window.location.pathname.includes('/NOADS/')) {
        return '../';
    }
    return '';
}

// Helper: dynamically load CSS if not already present
function ensurePremiumBannerCSS() {
    if (!document.querySelector('link[href*="premium-banner.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        const basePath = getBasePath();
        link.href = `${basePath}css/premium-banner.css?v=1.8`;
        document.head.appendChild(link);
    }
}

// Helper: inject premium banner HTML from template if not already present
async function injectPremiumBannerHTML() {
    if (!document.querySelector('.premium-banner')) {
        try {
            const basePath = getBasePath();
            const res = await fetch(`${basePath}templates/premium-banner.html`);
            const html = await res.text();
            const navbar = document.querySelector('.navbar');
            if (navbar && navbar.parentNode) {
                navbar.insertAdjacentHTML('beforebegin', html);
            } else {
                document.body.insertAdjacentHTML('afterbegin', html);
            }
        } catch (e) {
            console.error('Failed to inject premium banner HTML:', e);
        }
    }
}

// Get user's country from IP
async function getUserCountry() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const { ip } = await response.json();
        const countryResponse = await fetch(`https://ipapi.co/${ip}/json/`);
        const countryData = await countryResponse.json();
        return countryData.country_code;
    } catch (error) {
        console.error('Error getting user country:', error);
        return 'PH'; // Default to Philippines if error
    }
}

// Convert price to user's local currency
async function convertPrice(price, baseCurrency = 'PHP') {
    const country = await getUserCountry();
    const currencyCode = COUNTRY_CURRENCIES[country] || 'PHP';
    
    if (baseCurrency === currencyCode) {
        return `${CURRENCY_SYMBOLS[currencyCode]}${price.toFixed(2)}`;
    }
    
    const rate = CURRENCY_RATES[currencyCode];
    const convertedPrice = price * rate;
    return `${CURRENCY_SYMBOLS[currencyCode]}${convertedPrice.toFixed(2)}`;
}

// Update all prices in the banner
async function updatePrices() {
    const priceElements = document.querySelectorAll('.premium-banner .price');
    for (const priceElement of priceElements) {
        const basePrice = parseInt(priceElement.dataset.basePrice, 10);
        if (!isNaN(basePrice)) {
            priceElement.textContent = await convertPrice(basePrice);
        }
    }
}

// Check if user is premium
async function checkPremiumStatus() {
    try {
        if (!supabase) {
            console.error('Supabase client not available. Cannot check premium status.');
            return;
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: userData, error: fetchError } = await supabase
                .from('users')
                .select('is_premium')
                .eq('id', user.id)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') { // Ignore 'exact one row' error if no user found
                throw fetchError;
            }
            
            if (userData?.is_premium) {
                document.body.classList.add('premium-user');
            }
        }
    } catch (error) {
        console.error('Error checking premium status:', error);
    }
}

// Add the "Buy Voucher" button and notice
function addVoucherButtonAndNotice() {
    const bannerActions = document.querySelector('.premium-banner .banner-actions');
    if (bannerActions && !document.getElementById('buy-voucher-btn')) {
        const voucherButton = document.createElement('button');
        voucherButton.id = 'buy-voucher-btn';
        voucherButton.className = 'btn btn-voucher';
        voucherButton.textContent = 'Buy Voucher on the Facebook Page (Maya, Gcash and Paypal)';
        voucherButton.onclick = () => window.open('https://www.facebook.com/jannelflix', '_blank');

        const voucherNotice = document.createElement('p');
        voucherNotice.className = 'voucher-notice';
        voucherNotice.textContent = 'After purchasing, you will receive a voucher code to activate your premium plan.';

        bannerActions.appendChild(voucherButton);
        bannerActions.appendChild(voucherNotice);
    }
}

// Determine if banner should be shown on this page
function shouldShowPremiumBanner() {
    const path = window.location.pathname.toLowerCase();
    // Show on the main site, or specifically on the NOADS account page.
    if (path.includes('/noads/')) {
        return path.includes('/account.html');
    }
    return true; // Show on all main site pages where the banner is relevant.
}

// Main initialization logic
async function initPremiumBanner() {
    ensurePremiumBannerCSS();
    await injectPremiumBannerHTML();
    await checkPremiumStatus();

    const isPremium = document.body.classList.contains('premium-user');
    const banner = document.querySelector('.premium-banner');

    if (isPremium) {
        if (banner) banner.style.display = 'none';
        return;
    }

    if (banner) {
        await updatePrices();
    }
}

// Run initialization when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // A small delay to ensure auth.js has initialized the Supabase client
    setTimeout(async () => {
        if (shouldShowPremiumBanner()) {
            await initPremiumBanner();

            // Add voucher button only on main site and if user is not premium
            if (!window.location.pathname.includes('/noads/') && !document.body.classList.contains('premium-user')) {
                addVoucherButtonAndNotice();
            }
        }
    }, 100); // 100ms delay
});
async function initPremiumBanner() {
    ensurePremiumBannerCSS();
    await injectPremiumBannerHTML();

    // Update prices based on user's location
    await updatePrices();
    
    // Add click handler for upgrade button
    const upgradeBtn = document.getElementById('premium-upgrade-btn');
    if (upgradeBtn) {
        upgradeBtn.addEventListener('click', () => {
            window.location.href = '/account.html';
        });
    }

    // Dynamically add the voucher button and notice for the main site
    const actionsContainer = document.querySelector('.premium-banner-actions');
    if (actionsContainer) {
        const voucherBtn = document.createElement('button');
        voucherBtn.id = 'buy-voucher-btn';
        voucherBtn.className = 'premium-upgrade-btn voucher-btn';
        voucherBtn.textContent = 'Buy Voucher on the Facebook Page (Maya, Gcash and Paypal)';
        voucherBtn.onclick = () => {
            window.open('https://www.facebook.com/profile.php?id=61576333379034', '_blank');
        };

        const notice = document.createElement('p');
        notice.className = 'voucher-notice';
        notice.textContent = 'Send us a message on our Facebook Page to complete your purchase.';

        actionsContainer.appendChild(voucherBtn);
        actionsContainer.appendChild(notice);
    }
}

// This function checks if the premium banner should be displayed based on user status and page context.
function shouldShowPremiumBanner() {
    const path = window.location.pathname.toLowerCase();
    // Show on the main site, or specifically on the NOADS account page.
    if (path.includes('/noads/')) {
        return path.includes('/account.html');
    }
    return true; // Show on all main site pages where the banner is relevant.
}

// Run initialization when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    if (shouldShowPremiumBanner()) {
        await initPremiumBanner();

        // Show banner immediately for non-premium users (after injection)
        if (!document.body.classList.contains('premium-user')) {
            const bannerElement = document.querySelector('.premium-banner');
            if (bannerElement) bannerElement.style.display = 'block';
        }
    }
    // Always check premium status (may hide banner if user premium)
    checkPremiumStatus();
});
