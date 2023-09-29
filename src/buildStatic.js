const start = Date.now();

import fs from 'node:fs/promises';
import { join, relative, dirname } from 'path';
import walk from './utils/walk.js';
import { JSDOM } from 'jsdom';

const config = await Bun.file(join(import.meta.dir, '../config.json')).json();
const publicFiles = await walk(join(import.meta.dir, '../public'));

if (await fs.exists(join(import.meta.dir, '../build'))) await fs.rm(join(import.meta.dir, '../build'), { recursive: true, force: true });
await fs.mkdir(join(import.meta.dir, '../build'));

for await (const publicFile of publicFiles) {
    let cleanPath = relative(import.meta.dir, publicFile);
    cleanPath = cleanPath.replaceAll('\\', '/').replace('../public/', '');

    if ((await fs.lstat(publicFile)).isDirectory()) continue;

    await fs.mkdir(dirname(join(import.meta.dir, `../build/${cleanPath}`)), { recursive: true });

    let fileContents = await Bun.file(join(import.meta.dir, `../public/${cleanPath}`)).text();
    if (cleanPath.match(/^(.(.*\.html))*$/)?.length)
        fileContents = fileContents
            .replaceAll('{{ siteName }}', config.siteName)
            .replaceAll('{{ siteDescription }}', config.siteDescription)
            .replaceAll('{{ siteURL }}', config.siteURL)

    const { document } = new JSDOM(fileContents).window;
    const links = document.querySelectorAll('a[href]');

    links.forEach(link => {
        const href = link.getAttribute('href');
        if (!href.startsWith('http://') && !href.startsWith('https://') && !href.match(/^.*\.[^\\]+$/)?.length && href !== '/') link.setAttribute('href', href + '.html');
    });

    fileContents = document.documentElement.outerHTML;
    await Bun.write(join(import.meta.dir, `../build/${cleanPath}`), fileContents || '');
}

const end = Date.now();
console.log(`Success! Built the static site in ${end - start} ms`)