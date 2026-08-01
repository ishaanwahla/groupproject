async function setupFavoriteButton() {
    const button = document.querySelector('.favorite-button');
    if (!button) return;

    const response = await fetch('/api/collection');
    if (!response.ok) return;
    const collection = await response.json();
    const requestedId = Number(new URLSearchParams(window.location.search).get('book'));
    const selectedBook = collection.find(book => book.id === requestedId) || collection[0];
    if (!selectedBook) return;

    updateButton(button, selectedBook.favorite);
    button.addEventListener('click', async () => {
        button.disabled = true;
        try {
            const response = await fetch(`/api/collection/${selectedBook.id}/favorite`, {
                method: 'PATCH'
            });
            if (!response.ok) throw new Error('Could not favorite book.');
            updateButton(button, true);
        } catch (error) {
            console.error('Failed to favorite book:', error);
            button.title = 'Could not favorite book. Try again.';
        } finally {
            button.disabled = false;
        }
    });
}

document.addEventListener('DOMContentLoaded', setupFavoriteButton);

function updateButton(button, favorite) {
    button.innerHTML = `<i class="fa-solid fa-star"></i> ${favorite ? 'Favorited' : 'Favorite'}`;
    button.setAttribute('aria-pressed', favorite);
}
