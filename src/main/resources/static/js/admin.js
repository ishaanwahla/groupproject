function formatDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString();
}

function setup() {
    let users = [];
    let visibleUsers = [];
    let selectedUserId = null;
    let pendingDeleteUser = null;

    function findSelectedUser() {
        return users.find(user => user.id === selectedUserId) || null;
    }

    function renderUserList() {
        const list = document.getElementById('userList');
        list.innerHTML = '';
        for (const user of visibleUsers) {
            const item = document.createElement('li');
            const link = document.createElement('a');
            link.href = '#';
            link.className = 'user-list-item';
            if (user.id === selectedUserId) link.classList.add('active');
            link.textContent = user.name;
            link.addEventListener('click', event => {
                event.preventDefault();
                selectedUserId = user.id;
                renderAll();
            });
            item.appendChild(link);
            list.appendChild(item);
        }
    }

    function renderDetailPanel() {
        const panel = document.getElementById('userDetailPanel');
        panel.innerHTML = '';
        const user = findSelectedUser();

        if (!user) {
            const empty = document.createElement('p');
            empty.className = 'admin-empty-state';
            empty.textContent = 'Select a user to view details';
            panel.appendChild(empty);
            return;
        }

        const heading = document.createElement('h3');
        heading.className = 'admin-detail-heading';
        heading.textContent = user.name;
        panel.appendChild(heading);

        const wpm = user.lastWpm === null || user.lastWpm === undefined ? '—' : user.lastWpm;
        const accuracy = user.lastAccuracy === null || user.lastAccuracy === undefined ? '—' : `${user.lastAccuracy}%`;

        const fields = [
            ['Email', user.email],
            ['Account Created', formatDate(user.createdAt)],
            ['Last Active', formatDate(user.updatedAt)],
            ['Global WPM', wpm],
            ['Global Accuracy', accuracy]
        ];

        const fieldList = document.createElement('div');
        fieldList.className = 'admin-detail-fields';
        for (const [label, value] of fields) {
            const row = document.createElement('p');
            const strong = document.createElement('strong');
            strong.textContent = `${label}: `;
            row.appendChild(strong);
            row.append(String(value));
            fieldList.appendChild(row);
        }
        panel.appendChild(fieldList);

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'btn-danger admin-delete-btn';
        deleteButton.textContent = 'Delete User';
        deleteButton.addEventListener('click', () => requestDelete(user));
        panel.appendChild(deleteButton);
    }

    function renderBooksPanel() {
        const panel = document.getElementById('userBooksPanel');
        panel.innerHTML = '';
        const user = findSelectedUser();
        if (!user) return;

        const heading = document.createElement('h4');
        heading.className = 'admin-books-heading';
        heading.textContent = `${user.name}'s Books`;
        panel.appendChild(heading);

        const list = document.createElement('ul');
        list.className = 'admin-books-list';
        if (user.bookTitles && user.bookTitles.length > 0) {
            for (const title of user.bookTitles) {
                const item = document.createElement('li');
                item.textContent = title;
                list.appendChild(item);
            }
        } else {
            const item = document.createElement('li');
            item.className = 'admin-books-empty';
            item.textContent = 'No books yet';
            list.appendChild(item);
        }
        panel.appendChild(list);
    }

    function renderAll() {
        renderUserList();
        renderDetailPanel();
        renderBooksPanel();
    }

    function requestDelete(user) {
        pendingDeleteUser = user;
        document.getElementById('deleteUserMessage').textContent =
            `Delete ${user.name}'s account? This cannot be undone.`;
        document.getElementById('deleteUserDialog').showModal();
    }

    function performDelete(user) {
        fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
            .then(async response => {
                if (!response.ok) {
                    const body = await response.json().catch(() => null);
                    throw new Error(body && body.message ? body.message : 'Failed to delete user.');
                }
                users = users.filter(candidate => candidate.id !== user.id);
                if (selectedUserId === user.id) {
                    selectedUserId = null;
                }
                applyFilter(document.getElementById('searchBox').value);
            })
            .catch(error => {
                document.getElementById('statusMessage').textContent = error.message;
            });
    }

    function applyFilter(query) {
        const normalized = query.toLowerCase();
        visibleUsers = users.filter(user =>
            user.name.toLowerCase().includes(normalized) || user.email.toLowerCase().includes(normalized)
        );
        renderAll();
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
            applyFilter(document.getElementById('searchBox').value);
        })
        .catch(error => {
            document.getElementById('statusMessage').textContent = error.message;
        });

    document.getElementById('searchBox').addEventListener('input', function() {
        applyFilter(this.value);
    });

    const deleteDialog = document.getElementById('deleteUserDialog');

    document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
        const user = pendingDeleteUser;
        deleteDialog.close();
        if (user) {
            performDelete(user);
        }
    });

    document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
        deleteDialog.close();
    });

    deleteDialog.addEventListener('close', () => {
        pendingDeleteUser = null;
    });
}

document.addEventListener('DOMContentLoaded', setup);
