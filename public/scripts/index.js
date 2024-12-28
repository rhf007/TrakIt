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
