document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('collectionBooks');
    const status = document.getElementById('collectionStatus');
    try {
        const response = await fetch('/api/collection');
        if (!response.ok) {
            throw new Error(await response.text());
        }
        const books = await response.json();
        status.textContent = books.length ? '' : 'Your collection is empty.';
        books.forEach(book => container.appendChild(renderBook(book)));
    } catch (error) {
        status.textContent = 'Unable to load your collection.';
    }

    function renderBook(book) {
        const card = document.createElement('article');
        card.className = 'book';
        const info = document.createElement('div');
        info.className = 'book-info';
        const title = document.createElement('h4');
        title.textContent = book.title;
        const author = document.createElement('p');
        author.textContent = book.authors.length ? book.authors.join(', ') : 'Unknown author';
        const progress = document.createElement('div');
        progress.className = 'book-progress';

        const play = document.createElement('a');
        play.className = 'book-play';
        play.href = `/app?book=${book.id}`;
        play.title = 'Continue typing';
        play.innerHTML = '<i class="fa-solid fa-play"></i>';

        const percentage = document.createElement('span');
        percentage.textContent = `${book.progressPercent}%`;
        progress.append(play, percentage);
        info.append(title, author, progress);
        const cover = document.createElement('img');
        cover.className = 'book-cover-image';
        cover.src = book.coverUrl || '';
        cover.alt = book.coverUrl ? `Cover of ${book.title}` : '';
        card.append(info, cover);
        return card;
    }
});
