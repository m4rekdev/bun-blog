if (typeof Bun === 'undefined') throw new Error('You need Bun to run this!');

const start = Date.now();

import fs from 'node:fs/promises';
import { join, relative, dirname } from 'path';
import walk from './utils/walk.js';
import { JSDOM } from 'jsdom';
import replaceTemplates from './utils/replaceTemplates.js';
import templates from './utils/templates.js';
import posts from "./utils/parseData.js";

await posts.parse();

const publicFiles = await walk(join(import.meta.dir, '../public'));

if (await fs.exists(join(import.meta.dir, '../build'))) await fs.rm(join(import.meta.dir, '../build'), { recursive: true, force: true });
await fs.mkdir(join(import.meta.dir, '../build'));

for await (const publicFile of publicFiles) {
    let cleanPath = relative(import.meta.dir, publicFile);
    cleanPath = cleanPath.replaceAll('\\', '/').replace('../public/', '');

    if ((await fs.lstat(publicFile)).isDirectory()) continue;

    await fs.mkdir(dirname(join(import.meta.dir, `../build/${cleanPath}`)), { recursive: true });

    let fileContents = await Bun.file(join(import.meta.dir, `../public/${cleanPath}`)).text();
    if (cleanPath.match(/^(.(.*\.html))*$/)?.length) {
        fileContents = replaceTemplates(fileContents);

        const { document } = new JSDOM(fileContents).window;
        const links = document.querySelectorAll('a[href]');

        links.forEach(link => {
            const href = link.getAttribute('href');
            if (!href.startsWith('http://') && !href.startsWith('https://') && !href.match(/^.*\.[^\\]+$/)?.length && href !== '/') link.setAttribute('href', href + '.html');
        });

        fileContents = document.documentElement.outerHTML;
    }

    const linkRegex = /(?:ht|f)tps?:\/\/[-a-zA-Z0-9.]+\.[a-zA-Z]{2,3}(\/[^"<]*)?/g;
    fileContents = fileContents.replace(linkRegex, (url, path) => {
        if (!url.startsWith(templates.baseURL) || !path) return url;

        //if the file doesn't have an extension, add .html 
        if (!path.match(/(\w+\.\w+)$/i)?.length) return url + ".html";

        return url;
    });

    await Bun.write(join(import.meta.dir, `../build/${cleanPath}`), fileContents || '');
}

await fs.mkdir(join(import.meta.dir, `../build/errors`), { recursive: true });

for (const [ key, value ] of Object.entries(templates.errorPages)) {
    let fileContents = value;
    fileContents = replaceTemplates(fileContents);

    const { document } = new JSDOM(fileContents).window;
    const links = document.querySelectorAll('a[href]');

    links.forEach(link => {
        const href = link.getAttribute('href');
        if (!href.startsWith('http://') && !href.startsWith('https://') && !href.match(/^.*\.[^\\]+$/)?.length && href !== '/') link.setAttribute('href', href + '.html');
    });

    fileContents = document.documentElement.outerHTML;
    await Bun.write(join(import.meta.dir, `../build/errors/${key}.html`), fileContents || '');
}

const end = Date.now();

console.log(`Success! Built the static site in ${end - start} ms`);
process.exit();