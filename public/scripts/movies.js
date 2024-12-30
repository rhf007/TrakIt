document.addEventListener('DOMContentLoaded', () => {
    //TODO: FIX THIS SINCE THERE'S NO MAIN SECTION IN THE MOVIES PAGE
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

    const min_year = 1870;
    const max_year = new Date().getFullYear();
    const decade_dropdown = document.getElementById('decade-dropdown')

    for (let i = min_year; i <= max_year; i += 10) {
        const decade = document.createElement('li');
        decade.innerHTML = `<a class="dropdown-item" href="#">${i}s</a>`;
        decade_dropdown.appendChild(decade)
    }

    
})