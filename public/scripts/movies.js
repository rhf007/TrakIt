document.addEventListener('DOMContentLoaded', () => {
    //handle search input
    const searchInput = document.querySelector('.search-input');
    const searchButton = document.querySelector('.search-submit');
    const handleSearch = (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (!query) return;

        // Redirect to search results page with query parameter
        window.location.href = `/search?query=${encodeURIComponent(query)}`;
    };

    // when search buttton is clicked 
    searchButton.addEventListener('click', handleSearch);

    // when enter button is pressed
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch(e);
        }
    });
    
    //years filter
    const min_year = 1870;
    const max_year = new Date().getFullYear();
    const decade_dropdown = document.getElementById('decade-dropdown');
    
    for (let i = min_year; i <= max_year; i += 10) {
        const decade = document.createElement('li');
        decade.innerHTML = `<a class="dropdown-item" href="#" data-year="${i}">${i}s</a>`;
        decade_dropdown.appendChild(decade);
    }

    //handle filter logic
    let activeFilters = {
        year: null,
        genre: null,
        country: null,
        runtime: null
    };

    //whenever a filter option is selected
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            const button = e.target.closest('.dropdown-center').querySelector('button');
            
            //get filter value and put it in active filters object to update url with it
            //  and change button content to the selected filter value
            if (e.target.dataset.year) {
                activeFilters.year = e.target.dataset.year;
                button.textContent = `${e.target.dataset.year}s`;
            } else if (e.target.dataset.genreId) {
                activeFilters.genre = e.target.dataset.genreId;
                button.textContent = e.target.textContent;
            } else if (e.target.dataset.countryCode) {
                activeFilters.country = e.target.dataset.countryCode;
                button.textContent = e.target.textContent;
            } else if (e.target.textContent.includes('minutes')) {
                activeFilters.runtime = e.target.textContent.includes('90 minutes or less') ? 'short' :
                                        e.target.textContent.includes('120 minutes or more') ? 'long' : 'medium';
                button.textContent = e.target.textContent;
            }
            
            updateURL();
        });
    });
    
    //update url with selected filters
    const updateURL = () => {
        const params = new URLSearchParams(window.location.search);
        
        Object.entries(activeFilters).forEach(([key, value]) => {
            if (value) {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        });
        
        const newURL = `${window.location.pathname}?${params.toString()}`;
        window.history.pushState({}, '', newURL);
        
        fetchFilteredMovies(params);
    };

    //fetch movies based on selected filters
    const fetchFilteredMovies = async (params) => {
        try {
            //convert to json
            const response = await fetch(`/api/movies?${params.toString()}`);
            const data = await response.json();
            
            // display data
            const contentDiv = document.querySelector('.content');
            contentDiv.innerHTML = data.movies.map(movie => `
                <div class="card">
                    <a class="movie-poster" href="/movie/details/${movie.id}">
                        <img src="https://image.tmdb.org/t/p/w500${movie.poster_path}" alt="${movie.title}">
                    </a>
                </div>
            `).join('');

            updatePagination(data.currentPage, data.totalPages);
        } catch (error) {
            console.error('Error fetching filtered movies:', error);
        }
    };

    //update pagination after filtering
    const updatePagination = (currentPage, totalPages) => {
        const paginationDiv = document.querySelector('.pagination');
        paginationDiv.innerHTML = `
            ${currentPage > 1 ? `<a href="?page=${currentPage - 1}" class="btn btn-secondary btn-sm">Previous</a>` : ''}
            <span>Page ${currentPage} of ${totalPages}</span>
            ${currentPage < totalPages ? `<a href="?page=${currentPage + 1}" class="btn btn-secondary btn-sm">Next</a>` : ''}
        `;
    };
});