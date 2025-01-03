document.addEventListener('DOMContentLoaded', () => {
    const min_year = 1870;
    const max_year = new Date().getFullYear();
    const decade_dropdown = document.getElementById('decade-dropdown')
    
    for (let i = min_year; i <= max_year; i += 10) {
        const decade = document.createElement('li');
        decade.innerHTML = `<a class="dropdown-item" href="#">${i}s</a>`;
        decade_dropdown.appendChild(decade)
    }
    
})