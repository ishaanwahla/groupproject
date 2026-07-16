document.addEventListener('DOMContentLoaded', () => {
    const dialog = document.getElementById('newBookDialog');
    const button = document.getElementById('newBookButton');

    button.addEventListener('click', event => {
        event.preventDefault();
        dialog.showModal();
    });
});
