const nav = document.querySelector('nav');

addEventListener('scroll', () => {
    if (scrollY === 0) nav.classList.remove('scrolled');
    else nav.classList.add('scrolled');
})