document.addEventListener('DOMContentLoaded', () => {
    const dialog = document.getElementById('newBookDialog');
    const button = document.getElementById('newBookButton');
    const form = document.getElementById('newBookSearchForm');
    const input = document.getElementById('newBookSearchInput');
    const status = document.getElementById('newBookSearchStatus');
    const results = document.getElementById('newBookSearchResults');

    button?.addEventListener('click', event => {
        event.preventDefault();
        dialog.showModal();
        input.focus();
    });

    form?.addEventListener('submit', async event => {
        event.preventDefault();
        status.textContent = 'Searching...';
        results.replaceChildren();
        try {
            const response = await fetch(`/api/books/search?q=${encodeURIComponent(input.value.trim())}`);
            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }
            if (!response.ok) {
                throw new Error(await response.text());
            }
            const books = await response.json();
            status.textContent = books.length ? '' : 'No matching books were found.';
            books.forEach(book => results.appendChild(renderResult(book)));
        } catch (error) {
            status.textContent = 'Please try the search again.';
        }
    });

    function renderResult(book) {
        const item = document.createElement('article');
        item.className = 'book-search-result';
        const cover = document.createElement('img');
        cover.src = book.coverUrl || '';
        cover.alt = book.coverUrl ? `Cover of ${book.title}` : '';
        const details = document.createElement('div');
        const title = document.createElement('h3');
        title.textContent = book.title;


        const author = document.createElement('p');
        author.textContent = book.authors.length ? book.authors.join(', ') : 'Unknown author';

        const addButton = document.createElement('button');
        addButton.type = 'button';
        addButton.className = 'btn-primary';
        addButton.textContent = 'Add to collection';

        addButton.addEventListener('click', () => addBook(book.gutenbergId, addButton));
        details.append(title, author, addButton);
        item.append(cover, details);
        return item;
    }

    async function addBook(gutenbergId, addButton) {
        addButton.disabled = true;
        addButton.textContent = 'Adding...';
        try {
            const response = await fetch('/api/collection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gutenbergId })
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            const collectionBook = await response.json();
            window.location.href = `/app?book=${collectionBook.id}`;
        } catch (error) {
            addButton.disabled = false;
            addButton.textContent = 'Try again';
            status.textContent = 'Failed to add book.';
        }
    }
});
