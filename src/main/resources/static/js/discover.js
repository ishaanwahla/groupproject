document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.api-book').forEach(loadBook);
    document.querySelectorAll('.recommendation-books').forEach(loadRecommendations);

    async function loadBook(card) {
        const gutenbergId = Number(card.dataset.gutenbergId);
        card.setAttribute('aria-busy', 'true');

        try {
            const response = await fetch(`/api/books/${gutenbergId}`);
            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }
            if (!response.ok) {
                throw new Error(await response.text());
            }
            renderBook(card, await response.json());
        } catch (error) {
            card.textContent = 'Unable to load this book.';
        } finally {
            card.removeAttribute('aria-busy');
        }
    }

    async function loadRecommendations(container) {
        const status = container.previousElementSibling;
        try {
            const response = await fetch('/api/collection/recommendations');
            if (!response.ok) {
                throw new Error(await response.text());
            }
            const books = await response.json();
            status.textContent = books.length ? '' : 'Add a book to get recommendations.';
            books.forEach(book => {
                const card = document.createElement('article');
                card.className = 'book';
                container.appendChild(card);
                renderBook(card, book);
            });
        } catch (error) {
            status.textContent = 'Unable to load recommendations.';
        }
    }

    function renderBook(card, book) {
        const info = document.createElement('div');
        info.className = 'book-info';

        const title = document.createElement(card.classList.contains('book-week-card') ? 'h2' : 'h4');
        title.textContent = book.title;

        const author = document.createElement('p');
        author.textContent = book.authors.length ? book.authors.join(', ') : 'Unknown author';

        const play = document.createElement('button');
        play.className = 'book-play';
        play.type = 'button';
        play.title = `Start typing ${book.title}`;
        play.setAttribute('aria-label', play.title);
        play.innerHTML = '<i class="fa-solid fa-play"></i>';
        play.addEventListener('click', () => addBook(book.gutenbergId, play));

        const cover = document.createElement('img');
        cover.className = card.classList.contains('book-week-card')
            ? 'book-week-cover-image'
            : 'book-cover-image';
        cover.src = book.coverUrl || '';
        cover.alt = book.coverUrl ? `Cover of ${book.title}` : '';

        info.append(title, author, play);
        if (card.classList.contains('book-week-card')) {
            card.append(title, author, cover, play);
        } else {
            card.append(info, cover);
        }
    }

    async function addBook(gutenbergId, button) {
        button.disabled = true;
        try {
            const response = await fetch('/api/collection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gutenbergId })
            });
            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }
            if (!response.ok) {
                throw new Error(await response.text());
            }
            const collectionBook = await response.json();
            window.location.href = `/app?book=${collectionBook.id}`;
        } catch (error) {
            button.disabled = false;
            button.title = 'Could not add book. Try again.';
        }
    }

});
