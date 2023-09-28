const start = Date.now();

import fs from 'node:fs/promises';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { marked } from 'marked';
import path from "node:path";
const fm = require('front-matter');
const mdPosts = await fs.readdir('./posts');

for (const file of await fs.readdir('./public/posts')) {
  await fs.unlink(`./public/posts/${file}`);
}

const posts = [];

for (const mdPost of mdPosts) {
    let post = await Bun.file(`./posts/${mdPost}`).text();
    const postMetadata = fm(post);

    if (postMetadata.attributes.draft) continue;

    const window = new JSDOM('').window;
    const purify = DOMPurify(window);
    const postParsed = purify.sanitize(marked.parse(postMetadata.body));

    const postData = { ...postMetadata.attributes, content: postParsed };
    posts.push(postData);
}

for (const post of posts) {
    const postId = post.title.toLowerCase().replace(/([^a-z0-9_-])\W?/gi, '-');
    const template = await Bun.file('./templates/post.html').text();

    const postHtml = template
        .replaceAll('{{ postTitle }}', post.title)
        .replaceAll('{{ postCoverImage }}', post?.coverImage || '')
        .replaceAll('{{ postDescription }}', post.description)
        .replaceAll('{{ postAuthor }}', post.author)
        .replaceAll('{{ postDate }}', new Date(post.editedDate || post.pubDate).toLocaleString('en-US') + ' GMT')
        .replaceAll('{{ postTags }}', post.tags)
        .replaceAll('{{ postContent }}', post.content)

    await Bun.write(`./public/posts/${postId}.html`, postHtml);
}

const end = Date.now();
console.log(`Success! Parsed ${posts.length} post(s) in ${end - start} ms`)