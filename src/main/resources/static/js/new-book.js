document.addEventListener('DOMContentLoaded', () => {
    const dialog = document.getElementById('newBookDialog');

    document.querySelectorAll('.new-book-trigger').forEach(button => {
        button.addEventListener('click', event => {
            event.preventDefault();
            dialog.showModal();
        });
    });
});
