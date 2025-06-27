document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
        // Not logged in, redirect to main homepage
        window.location.href = '/index.html';
        return;
    }

    const user = session.user;
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_premium')
        .eq('id', user.id)
        .single();

    if (profileError || !profile || !profile.is_premium) {
        // Not a premium user, redirect to main homepage
        window.location.href = '/index.html';
    }
});
