const images = document.querySelectorAll('img[src]');

for (const image of images) {
    image.addEventListener('load', () => {
        image.classList.add('loaded');
    });
}