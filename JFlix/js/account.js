document.addEventListener('DOMContentLoaded', () => {
    const supabase = window.supabaseClient;
    const authModal = document.getElementById('auth-modal');

    if (supabase && authModal) {
        const user = supabase.auth.user();
        if (!user) {
            // If user is not logged in, show the authentication modal
            authModal.style.display = 'block';
        }
    } else {
        console.error('Supabase client or auth modal not found.');
    }
});
