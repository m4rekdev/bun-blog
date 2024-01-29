let theme = localStorage.getItem('theme');
if (!theme) {
    const themeResponse = await fetch('/assets/defaultTheme.json');
    const data = await themeResponse.json();
    theme = data.theme;
};

document.documentElement.setAttribute('theme', theme);