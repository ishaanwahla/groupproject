document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('[data-auth-form]');
    const message = document.querySelector('[data-auth-message]');
    const logoutLink = document.querySelector('[data-logout-link]');

    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            message.textContent = '';

            const mode = form.dataset.authForm;
            const payload = Object.fromEntries(new FormData(form));

            const response = await fetch(`/api/auth/${mode}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                window.location.href = '/app';
            } else {
                if (mode === 'login') {
                    message.textContent = 'Incorrect email or password.';
                } else {
                    message.textContent = 'Unable to create account at the moment.';
                }
            }
        });
    }

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
