function formatDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString();
}

function setup() {
    let users = [];

    function renderList(rows) {
        const list = document.getElementById('userList');
        list.innerHTML = '';
        for (const user of rows) {
            const row = document.createElement('li');
            row.className = 'user-list-row';

            const link = document.createElement('a');
            link.href = '#';
            link.className = 'user-list-item';

            const wpm = user.lastWpm === null || user.lastWpm === undefined ? '—' : user.lastWpm;
            const accuracy = user.lastAccuracy === null || user.lastAccuracy === undefined ? '—' : `${user.lastAccuracy}%`;
            const books = user.bookTitles && user.bookTitles.length > 0 ? user.bookTitles.join(', ') : 'No books yet';
            const memberSince = formatDate(user.createdAt);
            const lastActive = formatDate(user.updatedAt);
            link.textContent = `${user.name} (WPM: ${wpm}, Accuracy: ${accuracy}) — Books: ${books} — Member since: ${memberSince}, Last active: ${lastActive}`;

            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'btn-secondary user-delete-btn';
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => deleteUser(user));

            row.appendChild(link);
            row.appendChild(deleteButton);
            list.appendChild(row);
        }
    }

    function deleteUser(user) {
        if (!confirm(`Delete ${user.name}'s account? This cannot be undone.`)) {
            return;
        }

        fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
            .then(async response => {
                if (!response.ok) {
                    const body = await response.json().catch(() => null);
                    throw new Error(body && body.message ? body.message : 'Failed to delete user.');
                }
                users = users.filter(candidate => candidate.id !== user.id);
                renderList(users);
            })
            .catch(error => {
                document.getElementById('statusMessage').textContent = error.message;
            });
    }

    fetch('/api/admin/users')
        .then(response => {
            if (!response.ok) {
                throw new Error('You must be logged in as an admin to view this page.');
            }
            return response.json();
        })
        .then(data => {
            users = data;
            renderList(users);
        })
        .catch(error => {
            document.getElementById('statusMessage').textContent = error.message;
        });

    document.getElementById('searchBox').addEventListener('input', function() {
        const query = this.value.toLowerCase();
        const filtered = users.filter(user =>
            user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
        );
        renderList(filtered);
    });
}

document.addEventListener('DOMContentLoaded', setup);
