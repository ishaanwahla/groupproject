function setup() {
    let users = [];

    function renderList(rows) {
        const list = document.getElementById('userList');
        list.innerHTML = '';
        for (const user of rows) {
            const item = document.createElement('li');
            const link = document.createElement('a');
            link.href = '#';
            link.className = 'user-list-item';

            const wpm = user.lastWpm === null || user.lastWpm === undefined ? '—' : user.lastWpm;
            const accuracy = user.lastAccuracy === null || user.lastAccuracy === undefined ? '—' : `${user.lastAccuracy}%`;
            const books = user.bookTitles && user.bookTitles.length > 0 ? user.bookTitles.join(', ') : 'No books yet';
            link.textContent = `${user.name} (WPM: ${wpm}, Accuracy: ${accuracy}) — Books: ${books}`;

            item.appendChild(link);
            list.appendChild(item);
        }
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
