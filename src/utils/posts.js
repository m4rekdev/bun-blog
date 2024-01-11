import fs from 'node:fs/promises';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { marked } from 'marked';
import { join, relative, basename } from 'path';
import walk from './walk.js';
import formatDate from './formatDate.js';
import fm from 'front-matter';
import rss from 'rss';

async function parse() {
    const posts = [],
          rssItems = [],
          categories = [],
          list  = [];

    const replaceTemplates = (await import('./replaceTemplates.js')).default;
    const templates = (await import('./templates.js')).default;

    const mdPosts = await walk(join(import.meta.dir, '../../posts'));

    if (await fs.exists(join(import.meta.dir, '../../public/posts'))) await fs.rm(join(import.meta.dir, '../../public/posts'), { recursive: true, force: true });
    await fs.mkdir(join(import.meta.dir, '../../public/posts'));

    for await (const mdPost of mdPosts) {
        let cleanPath = relative(import.meta.dir, mdPost);
        cleanPath = cleanPath.replaceAll('\\', '/').replace('../../public/', '');

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

    for (const post of posts) {
        const template = templates.posts.page;

        post.id = post.fileName.toLowerCase().replace(/([^a-z0-9_-])\W?/gi, '-').substring(0, post.fileName.length - 3);
        post.date = formatDate(new Date(post.editedDate || post.pubDate));

        if (post.coverImage) post.coverImageHtml = `<img src="${post.coverImage}" alt="${post.title}">`;
        else post.coverImageHtml = '';

        if (post.tags)
            for (const tag of post.tags) {
                if (!categories.includes(tag)) categories.push(tag);
            }

        const variablesTemplate = { post };

        const postHtml = replaceTemplates(template, variablesTemplate);
        await Bun.write(join(import.meta.dir, `../../public/posts/${post.id}.html`), postHtml);

        const cardHtml = replaceTemplates(templates.posts.card, variablesTemplate);
        list.push(cardHtml);

        rssItems.push({
            title: post.title,
            description: post.description,
            url: replaceTemplates(`{{ baseURL }}/posts/${post.id}`),
            guid: post.id,
            categories: post.tags,
            author: post.author,
            date: post.date
        });
    }

    const rssData = JSON.parse(replaceTemplates(JSON.stringify(templates.rss)));
    rssData.categories = categories;

    const feed = new rss(rssData);
    for (const item of rssItems) feed.item(item);

    await Bun.write(join(import.meta.dir, `../../templates/posts/list.html`), list.join('\n'));
    await Bun.write(join(import.meta.dir, `../../public/rss.xml`), feed.xml());

    return posts.length;
}

export default { parse };