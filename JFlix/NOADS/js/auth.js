// js/auth.js

// IMPORTANT: For production, use environment variables for Supabase URL and Anon Key.
// Do not hardcode them directly in your client-side JavaScript like this for a live application.
const SUPABASE_URL = 'https://ftzeqaazgvgfcamjojbr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0emVxYWF6Z3ZnZmNhbWpvamJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NzYyMTQsImV4cCI6MjA2NDM1MjIxNH0.jh5SCIifqeKTxAMNFZkI8DnE-8OTvxwKbWBLX-hxORU';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Make the Supabase client available globally
window.supabaseClient = supabase;
console.log('Supabase client initialized and exposed globally as window.supabaseClient');

document.addEventListener('DOMContentLoaded', () => {
    checkUserSession();
    setupAuthEventListeners();
    
    // Check for login_required parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('login') && urlParams.get('login') === 'required') {
        openModal('login-modal');
        showAuthMessage('login-modal', 'Please log in to access your account page.', false);
    }
});

async function checkUserSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
        console.error('Error getting session:', error.message);
        updateUIForLoggedOutUser();
        return;
    }

    if (session && session.user) {
        updateUIForLoggedInUser(session.user);
    } else {
        updateUIForLoggedOutUser();
    }

    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
            // This event is triggered when the user clicks the password recovery link in their email.
            // You might want to show a specific modal or view for them to enter their new password.
            // For now, we'll assume Supabase handles the UI for setting the new password on their end or via a redirect.
            console.log('Password recovery event triggered. User should be prompted to set a new password.');
            closeAuthModals(); // Close any open auth modals
            // Optionally, open a dedicated 'reset password confirmation' or 'new password' modal if you build one.
        }
        else if (event === 'SIGNED_IN' && session && session.user) {
            updateUIForLoggedInUser(session.user);
            closeAuthModals();
        } else if (event === 'SIGNED_OUT') {
            updateUIForLoggedOutUser();
        }
    });
}

function showAuthMessage(modalId, message, isError = false) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    let messageElement = modal.querySelector('.auth-message');
    if (!messageElement) {
        messageElement = document.createElement('p');
        messageElement.className = 'auth-message';
        // Insert after the form or at a suitable place
        const form = modal.querySelector('form');
        if (form && form.nextSibling) {
            form.parentNode.insertBefore(messageElement, form.nextSibling);
        } else if (form) {
            form.parentNode.appendChild(messageElement);
        } else { // Fallback if no form, append to modal content
            const modalContent = modal.querySelector('.auth-modal-content');
            if (modalContent) modalContent.appendChild(messageElement);
            else modal.appendChild(messageElement); // Last resort
        }
    }

    messageElement.textContent = message;
    messageElement.style.color = isError ? 'var(--danger-color, #dc3545)' : 'var(--success-color, #28a745)';
    messageElement.style.display = 'block';
}

function clearAuthMessage(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    const messageElement = modal.querySelector('.auth-message');
    if (messageElement) {
        messageElement.textContent = '';
        messageElement.style.display = 'none';
    }
}

function setupAuthEventListeners() {
    // Login Form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAuthMessage('login-modal');
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });
            if (error) {
                showAuthMessage('login-modal', `Login failed: ${error.message}`, true);
            } else {
                showAuthMessage('login-modal', 'Login successful! Please wait...', false);
                // UI update and modal close handled by onAuthStateChange
            }
        });
    }

    // Signup Form
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAuthMessage('signup-modal');
            const firstName = document.getElementById('signup-first-name').value;
            const lastName = document.getElementById('signup-last-name').value;
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        first_name: firstName,
                        last_name: lastName
                    }
                }
            });
            if (error) {
                showAuthMessage('signup-modal', `Signup failed: ${error.message}`, true);
            } else {
                showAuthMessage('signup-modal', 'Signup successful! Please check your email to confirm your account.', false);
                // Optionally close modal or wait for user action
                // closeAuthModals(); // Keep open to show message
            }
        });
    }

    // Password Reset Form
    const passwordResetForm = document.getElementById('password-reset-form');
    if (passwordResetForm) {
        passwordResetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAuthMessage('password-reset-modal');
            const email = document.getElementById('password-reset-email').value;
            const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin, // URL to redirect to after email link click
            });
            if (error) {
                showAuthMessage('password-reset-modal', `Password reset request failed: ${error.message}`, true);
            } else {
                showAuthMessage('password-reset-modal', 'Password reset email sent! Please check your inbox.', false);
            }
        });
    }

    // Main Login/Signup button in Navbar (assuming it's always in the HTML and shown/hidden)
    const mainLoginNavButton = document.getElementById('login-button-nav');
    if (mainLoginNavButton) {
        mainLoginNavButton.addEventListener('click', () => {
            openModal('login-modal');
        });
    }

    // Links to switch between modals
    const goToSignupLink = document.getElementById('go-to-signup');
    if (goToSignupLink) {
        goToSignupLink.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('signup-modal');
        });
    }

    const goToLoginLink = document.getElementById('go-to-login');
    if (goToLoginLink) {
        goToLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('login-modal');
        });
    }

    const forgotPasswordLink = document.getElementById('forgot-password-link');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('password-reset-modal');
        });
    }

    // Close modal buttons (for all modals with class .auth-modal)
    document.querySelectorAll('.auth-modal .close-button').forEach(button => {
        button.addEventListener('click', () => {
            button.closest('.auth-modal').style.display = 'none';
            clearAuthMessage(button.closest('.auth-modal').id); // Clear message on close
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        document.querySelectorAll('.auth-modal').forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
                clearAuthMessage(modal.id); // Clear message on close
            }
        });
    });
}

function updateUIForLoggedInUser(user) {
    const loginNavButton = document.getElementById('login-button-nav');
    if (loginNavButton) {
        loginNavButton.style.display = 'none'; // Hide static login button
    }

    const authContainer = document.getElementById('auth-button-container');
    if (authContainer) {
        // New dropdown HTML structure
        authContainer.innerHTML = `
            <div class="user-dropdown">
                <button class="dropdown-toggle auth-nav-btn" aria-expanded="false" aria-controls="user-dropdown-menu">
                    ${user.email} <i class="fas fa-caret-down" style="margin-left: 5px;"></i>
                </button>
                <div class="dropdown-menu" id="user-dropdown-menu">
                    <a href="account.html" class="dropdown-item">My Account</a>
                    <button id="logout-button-dropdown" class="dropdown-item">Logout</button>
                </div>
            </div>
        `;

        // Event listener for the new logout button within the dropdown
        const logoutButtonDropdown = document.getElementById('logout-button-dropdown');
        if (logoutButtonDropdown) {
            logoutButtonDropdown.addEventListener('click', async () => {
                const { error } = await supabase.auth.signOut();
                if (error) {
                    console.error('Logout failed:', error.message);
                }
                // onAuthStateChange will handle UI update to logged-out state
            });
        }

        // Basic toggle functionality for the dropdown
        const dropdownToggle = authContainer.querySelector('.dropdown-toggle');
        const dropdownMenu = authContainer.querySelector('.dropdown-menu');
        if (dropdownToggle && dropdownMenu) {
            dropdownToggle.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent click from closing menu immediately if it bubbles up
                const isExpanded = dropdownToggle.getAttribute('aria-expanded') === 'true' || false;
                dropdownToggle.setAttribute('aria-expanded', !isExpanded);
                dropdownMenu.style.display = !isExpanded ? 'block' : 'none';
            });

            // Close dropdown if clicking outside
            document.addEventListener('click', (event) => {
                if (dropdownToggle && dropdownMenu && !dropdownToggle.contains(event.target) && !dropdownMenu.contains(event.target)) {
                    dropdownMenu.style.display = 'none';
                    dropdownToggle.setAttribute('aria-expanded', 'false');
                }
            });
        }
        authContainer.style.display = 'block'; // Use block or inline-block for dropdown container
    }
}

function updateUIForLoggedOutUser() {
    const loginNavButton = document.getElementById('login-button-nav');
    if (loginNavButton) {
        loginNavButton.style.display = 'flex'; // Show static login button
    }

    const authContainer = document.getElementById('auth-button-container');
    if (authContainer) {
        authContainer.innerHTML = ''; // Clear user profile info
        authContainer.style.display = 'none'; // Hide this container, as login button is separate
    }
}

function openModal(modalId) {
    closeAuthModals(); // Close any currently open auth modals first
    clearAuthMessage(modalId); // Clear any previous messages in the target modal
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeAuthModals() {
    document.querySelectorAll('.auth-modal').forEach(modal => {
        modal.style.display = 'none';
        clearAuthMessage(modal.id); // Clear messages when closing all modals
    });
}

// Supabase client is already exposed globally at the top of this file as window.supabaseClient
// This is necessary for our account.html page to access the same client instance

