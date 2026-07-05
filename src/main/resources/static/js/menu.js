document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('accountBtn');
    const menu = document.getElementById('dropdownMenu');

    btn.onclick = (e) => {
        e.stopPropagation();
        menu.classList.toggle('show');
    };

    document.onclick = () => menu.classList.remove('show');
});