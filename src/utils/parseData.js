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
          authors = [],
          rssItems = [],
          categories = [],
          postsList  = [],
          authorsList = [];

    const replaceTemplates = (await import('./replaceTemplates.js')).default;
    const templates = (await import('./templates.js')).default;
    const addExternalTemplate = (await import('./templates.js')).addExternalTemplate;

    const mdAuthors = await walk(join(import.meta.dir, '../../authors'));

    if (await fs.exists(join(import.meta.dir, '../../public/authors'))) await fs.rm(join(import.meta.dir, '../../public/authors'), { recursive: true, force: true });
    await fs.mkdir(join(import.meta.dir, '../../public/authors'));

    for await (const mdAuthor of mdAuthors) {
        let cleanPath = relative(import.meta.dir, mdAuthor);
        cleanPath = cleanPath.replaceAll('\\', '/').replace('../../public/', '');

        if ((await fs.lstat(mdAuthor)).isDirectory()) continue;
        if (!basename(mdAuthor).endsWith('.md')) continue;

        let authorFileName = basename(await Bun.file(join(import.meta.dir, `../authors/${cleanPath}`)).name);
        let author = await Bun.file(join(import.meta.dir, `../authors/${cleanPath}`)).text();

        const authorMetadata = fm(author);
        if (authorMetadata.attributes.draft) continue;

        const { window } = new JSDOM('');
        const purify = DOMPurify(window);
        const authorParsed = purify.sanitize(marked.parse(authorMetadata.body));

        const authorData = { ...authorMetadata.attributes, fileName: authorFileName, content: authorParsed };
        authorData.id = authorFileName.toLowerCase().replace(/([^a-z0-9_-])\W?/gi, '-').substring(0, authorFileName.length - 3);

        await addExternalTemplate('authors', authorData.id, authorData);
        if (!authors.map(author => author.id).includes(authorData.id)) authors.push(authorData);
    }

    const mdTags = await walk(join(import.meta.dir, '../../tags'));

    if (await fs.exists(join(import.meta.dir, '../../public/tags'))) await fs.rm(join(import.meta.dir, '../../public/tags'), { recursive: true, force: true });
    await fs.mkdir(join(import.meta.dir, '../../public/tags'));

    for await (const mdTag of mdTags) {
        let cleanPath = relative(import.meta.dir, mdTag);
        cleanPath = cleanPath.replaceAll('\\', '/').replace('../../public/', '');

        if ((await fs.lstat(mdTag)).isDirectory()) continue;
        if (!basename(mdTag).endsWith('.md')) continue;

        let tagFileName = basename(await Bun.file(join(import.meta.dir, `../tags/${cleanPath}`)).name);
        let tag = await Bun.file(join(import.meta.dir, `../tags/${cleanPath}`)).text();

        const tagMetadata = fm(tag);
        if (tagMetadata.attributes.draft) continue;

        const { window } = new JSDOM('');
        const purify = DOMPurify(window);
        const tagParsed = purify.sanitize(marked.parse(tagMetadata.body));

        const tagData = { ...tagMetadata.attributes, fileName: tagFileName, content: tagParsed };
        tagData.id = tagFileName.toLowerCase().replace(/([^a-z0-9_-])\W?/gi, '-').substring(0, tagFileName.length - 3);

        await addExternalTemplate('tags', tagData.id, tagData);
        if (!categories.includes(tagData.id)) categories.push(tagData);
    }

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

        if (templates.authors?.[postMetadata.attributes.author]) postMetadata.attributes.author = templates.authors[postMetadata.attributes.author];
        else postMetadata.attributes.author = { displayName: postMetadata.attributes.author, id: postMetadata.attributes.author.toLowerCase().replace(/([^a-z0-9_-])\W?/gi, '-'), avatar: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg', content: '' };
        
        if (templates.tags)
            for (const tag of postMetadata.attributes.tags) {                
                if (templates.tags[tag]) postMetadata.attributes.tags[postMetadata.attributes.tags.indexOf(tag)] = templates.tags[tag];
                else postMetadata.attributes.tags[postMetadata.attributes.tags.indexOf(tag)] = { displayName: tag, id: tag.toLowerCase().replace(/([^a-z0-9_-])\W?/gi, '-'), image: '', content: '' };
            }

        const postData = { ...postMetadata.attributes, fileName: postFileName, content: postParsed };
        posts.push(postData);
    }

    for (const post of posts) {
        const template = templates.pages.post;

        post.id = post.fileName.toLowerCase().replace(/([^a-z0-9_-])\W?/gi, '-').substring(0, post.fileName.length - 3);
        post.date = formatDate(new Date(post.editedDate || post.pubDate));

        if (post.coverImage) post.coverImageHtml = `<img src="${post.coverImage}" alt="${post.title}">`;
        else post.coverImageHtml = '';

        post.tagsHtml = '';

        if (post.tags) {
            for (const tagItem of post.tags) {
                const tag = post.tags[post.tags.indexOf(tagItem)];
                if (!categories.map(tag => tag.id).includes(tag.id)) categories.push(tag);

                if (tag.image) tag.imageHtml = `<img src="${tag.image}" alt="${tag.displayName}" class="tagImage">`;
                else tag.imageHtml = '';

                tag.posts = posts.filter(post => post.tags.map(tag => tag.id).includes(tag.id)).map(post => post = { title: post.title, author: post.author.displayName, tags: post.tags.map(tag => tag = { displayName: tag.displayName }) }).map(post => JSON.stringify(post)).join(',');
                post.tagsHtml += `<a href="{{ baseURL }}/tags/${tag.id}" class="tag">${tag.displayName}</a>`;
            }

            post.tagsFormatted = post.tags.map(tag => tag = tag.displayName);
        }

        post.author.posts = posts.filter(p => p.author.id === post.author.id).map(post => post = { title: post.title, author: post.author.displayName, tags: post.tags.map(tag => tag = { displayName: tag.displayName }) }).map(post => JSON.stringify(post)).join(',');

        if (post.author.avatar) post.author.avatarHtml = `<img src="${post.author.avatar}" alt="${post.author.displayName}" class="authorAvatar">`;
        if (!authors.map(author => author.id).includes(post.author.id)) authors.push(post.author);

        const variablesTemplate = { post };

        const postHtml = replaceTemplates(template, variablesTemplate);
        await Bun.write(join(import.meta.dir, `../../public/posts/${post.id}.html`), postHtml);

        const cardHtml = replaceTemplates(templates.components.cards.post, variablesTemplate);
        postsList.push(cardHtml);

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
    rssData.categories = categories.map(category => category.id);

    const feed = new rss(rssData);
    for (const item of rssItems) feed.item(item);
    await Bun.write(join(import.meta.dir, `../../public/rss.xml`), feed.xml());

    for (const author of authors) {
        const template = templates.pages.author;
        const variablesTemplate = { author };

        const authorHtml = replaceTemplates(template, variablesTemplate);
        await Bun.write(join(import.meta.dir, `../../public/authors/${author.id}.html`), authorHtml);

        const cardHtml = replaceTemplates(templates.components.cards.author, variablesTemplate);
        authorsList.push(cardHtml);
    }

    for (const tag of categories) {
        const template = templates.pages.tag;
        const variablesTemplate = { tag };

        const tagHtml = replaceTemplates(template, variablesTemplate);
        await Bun.write(join(import.meta.dir, `../../public/tags/${tag.id}.html`), tagHtml);
    }

    await Bun.write(join(import.meta.dir, `../../templates/components/lists/posts.html`), postsList?.join('\n'));
    await Bun.write(join(import.meta.dir, `../../templates/components/lists/authors.html`), authorsList?.join('\n'));

    return { posts: posts.length, authors: authors.length, tags: categories.length };
}

export default { parse };