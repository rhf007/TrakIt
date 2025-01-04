document.addEventListener('DOMContentLoaded', () => {
    const min_year = 1870;
    const max_year = new Date().getFullYear();
    const decade_dropdown = document.getElementById('decade-dropdown');

    for (let i = min_year; i <= max_year; i += 10) {
        const decade = document.createElement('li');
        decade.innerHTML = `<a class="dropdown-item" href="#" data-year="${i}">${i}s</a>`;
        decade_dropdown.appendChild(decade);
    }

    let activeFilters = {
        year: null,
        genre: null,
        country: null
    };

    const updateURL = () => {
        const params = new URLSearchParams(window.location.search);

        Object.entries(activeFilters).forEach(([key, value]) => {
            if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        });

        const newURL = `${window.location.pathname}>${params.toString()}`;
        window.history.pushState({}, '', newURL);

        fetchFilteredSeries(params);
    };

    const fetchFilteredSeries = async (params) => {
        try {
            const response = await fetch(`/api/series?${params.toString()}`);
            const data = await response.json();
            const contentDiv = document.querySelector('.content');
            contentDiv.innerHTML = data.series.map(show => `
                <div class="card">
                    <a class="movie-poster" href="/series/details/${show.id}">
                        <img src="https://image.tmdb.org/t/p/w500${show.poster_path}" alt="${show.name}">
                    </a>
                </div>`
            ).join('');

            updatePagination(data.currentPage, data.totalPages);
        } catch (error) {
            console.error('Error fetching filtered series:', error);
        }
    };

    const updatePagination = (currentPage, totalPages) => {
        const paginationDiv = document.querySelector('.pagination');
        paginationDiv.innerHTML = `
            ${currentPage > 1 ? `<a href="?page=${currentPage - 1}" class="btn btn-secondary btn-sm">Previous</a>` : ''}
            <span>Page ${currentPage} of ${totalPages}</span>
            ${currentPage < totalPages ? `<a href="?page=${currentPage + 1}" class="btn btn-secondary btn-sm">Next</a>` : ''}
        `;
    };

    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            const button = e.target.closest('.dropdown-center').querySelector('button');

            if (e.target.dataset.year) {
                activeFilters.year = e.target.dataset.year;
                button.textContent = `${e.target.dataset.year}s`;
            } else if (e.target.dataset.genreId) {
                activeFilters.genre = e.target.dataset.genreId;
                button.textContent = e.target.textContent;
            } else if (e.target.dataset.countryCode) {
                activeFilters.country = e.target.dataset.countryCode;
                button.textContent = e.target.textContent;
            }

            updateURL();
        });
    });
});