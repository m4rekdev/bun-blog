const start = Date.now();

import fs from 'node:fs/promises';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { marked } from 'marked';
import { join, relative, dirname } from 'path';
import walk from './utils/walk.js';
const fm = require('front-matter');

const mdPosts = await walk(join(import.meta.dir, '../posts'));

if (await fs.exists(join(import.meta.dir, '../public/posts'))) await fs.rm(join(import.meta.dir, '../public/posts'), { recursive: true, force: true });
await fs.mkdir(join(import.meta.dir, '../public/posts'));

const posts = [];

for await (const mdPost of mdPosts) {
    let cleanPath = relative(import.meta.dir, mdPost);
    cleanPath = cleanPath.replaceAll('\\', '/').replace('../public/', '');

    if ((await fs.lstat(mdPost)).isDirectory()) continue;

    let post = await Bun.file(join(import.meta.dir, `../posts/${cleanPath}`)).text();
    const postMetadata = fm(post);

    if (postMetadata.attributes.draft) continue;

    const { window } = new JSDOM('');
    const purify = DOMPurify(window);
    const postParsed = purify.sanitize(marked.parse(postMetadata.body));

    const postData = { ...postMetadata.attributes, content: postParsed };
    posts.push(postData);
}

for (const post of posts) {
    const postId = post.title.toLowerCase().replace(/([^a-z0-9_-])\W?/gi, '-');
    const template = await Bun.file(join(import.meta.dir, '../templates/post.html')).text();

    const postHtml = template
        .replaceAll('{{ postTitle }}', post.title)
        .replaceAll('{{ postId }}', postId)
        .replaceAll('{{ postCoverImage }}', post?.coverImage || '')
        .replaceAll('{{ postDescription }}', post.description)
        .replaceAll('{{ postAuthor }}', post.author)
        .replaceAll('{{ postDate }}', new Date(post.editedDate || post.pubDate).toLocaleString('en-US') + ' GMT')
        .replaceAll('{{ postTags }}', post.tags)
        .replaceAll('{{ postContent }}', post.content)

    await Bun.write(join(import.meta.dir, `../public/posts/${postId}.html`), postHtml);
}

const end = Date.now();
console.log(`Success! Parsed ${posts.length} post(s) in ${end - start} ms`)