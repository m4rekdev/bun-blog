const start = Date.now();

import fs from 'node:fs/promises';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { marked } from 'marked';
import { join, relative, basename } from 'path';
import walk from './utils/walk.js';
import replaceTemplates from './utils/replaceTemplates.js';
import templates from './utils/templates.js';
const fm = require('front-matter');
const rss = require('rss');

const configFile = Bun.file(join(import.meta.dir, '../config.json'));

if (!await configFile.exists()) {
    console.log('You need to make a config.json to use bun-blog. You can start by copying or renaming config.json.sample to config.json');
    process.exit();
}

const mdPosts = await walk(join(import.meta.dir, '../posts'));

if (await fs.exists(join(import.meta.dir, '../public/posts'))) await fs.rm(join(import.meta.dir, '../public/posts'), { recursive: true, force: true });
await fs.mkdir(join(import.meta.dir, '../public/posts'));

const posts = [],
      list = [];

for await (const mdPost of mdPosts) {
    let cleanPath = relative(import.meta.dir, mdPost);
    cleanPath = cleanPath.replaceAll('\\', '/').replace('../public/', '');

    if ((await fs.lstat(mdPost)).isDirectory()) continue;
    if (!basename(mdPost).endsWith('.md')) continue;

    let postFileName = basename(await Bun.file(join(import.meta.dir, `../posts/${cleanPath}`)).name);
    let post = await Bun.file(join(import.meta.dir, `../posts/${cleanPath}`)).text();

    const postMetadata = fm(post);
    if (postMetadata.attributes.draft) continue;

    const { window } = new JSDOM('');
    const purify = DOMPurify(window);
    const postParsed = purify.sanitize(marked.parse(postMetadata.body));

    const postData = { ...postMetadata.attributes, fileName: postFileName, content: postParsed };
    posts.push(postData);
}

const feed = new rss(JSON.parse(replaceTemplates(JSON.stringify(templates.rss))));

for (const post of posts) {
    const template = templates.posts.page;

    post.id = post.fileName.toLowerCase().replace(/([^a-z0-9_-])\W?/gi, '-').substring(0, post.fileName.length - 3);
    post.date = new Date(post.editedDate || post.pubDate).toLocaleString('en-US') + ' GMT';

    const variablesTemplate = { post };

    const postHtml = replaceTemplates(template, variablesTemplate);
    await Bun.write(join(import.meta.dir, `../public/posts/${post.id}.html`), postHtml);

    const cardHtml = replaceTemplates(templates.posts.card, variablesTemplate);
    list.push(cardHtml);

    feed.item({
        title: post.title,
        description: post.description,
        url: replaceTemplates(`{{ baseURL }}/posts/${post.id}`),
        guid: post.id,
        categories: post.tags,
        author: post.author,
        date: post.date
    });
}

await Bun.write(join(import.meta.dir, `../templates/posts/list.html`), list.join('\n'));
await Bun.write(join(import.meta.dir, `../public/rss.xml`), feed.xml());

const end = Date.now();
console.log(`Success! Parsed ${posts.length} post(s) in ${end - start} ms`)