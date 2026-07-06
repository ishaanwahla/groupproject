document.addEventListener('DOMContentLoaded', () => {
    const logoutLink = document.querySelector('[data-logout-link]');

    if (logoutLink) {
        logoutLink.addEventListener('click', async (event) => {
            event.preventDefault();
            await fetch('/api/auth/logout', {
                method: 'POST',
            });
            window.location.href = '/login';
        });
    }
});
