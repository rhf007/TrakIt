document.addEventListener('DOMContentLoaded', () => {
    //change color of header from transparent to red after scrolling through the main section
    document.addEventListener('scroll', () => {
        const header = document.querySelector('.home-nav');
        const firstSection = document.querySelector('.main');
        const sectionHeight = firstSection.offsetHeight;
        const scrollY = window.scrollY;
    
        const progress = Math.min(scrollY / sectionHeight, 1);
    
        const red = 220;
        const green = 49;
        const blue = 41;
        const opacity = progress;
    
        header.style.backgroundColor = `rgba(${red}, ${green}, ${blue}, ${opacity})`;
        header.style.backdropFilter = `blur(${5 - opacity * 5}px)`;
    });

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
})
