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
    const templates = (await import('./templates.js')).templates;
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

        if (authorMetadata.attributes?.avatar) authorMetadata.attributes.avatarHtml = `<img class="authorAvatar" src="${authorMetadata.attributes.avatar}" alt="${authorMetadata.attributes.displayName}">`;
        else authorMetadata.attributes.avatarHtml = '';

        const { window } = new JSDOM('');
        const purify = DOMPurify(window);
        const authorParsed = purify.sanitize(marked.parse(authorMetadata.body));

        const authorData = { ...authorMetadata.attributes, fileName: authorFileName, content: authorParsed };
        authorData.id = authorFileName.toLowerCase().replace(/([^a-z0-9_-])\W?/gi, '-').substring(0, authorFileName.length - 3);

        await addExternalTemplate('authors', authorData.id, authorData);

        if (authors.map(author => author.id).includes(authorData.id)) console.log('WARNING | You have more than one user with the same id. Only the first one was registered,')
        else authors.push(authorData);
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

        if (tagMetadata.attributes?.image)
            tagMetadata.attributes.imageHtml = `<img src="${tagMetadata.attributes.image}" alt="${tagMetadata.attributes.displayName}">`;

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

        postMetadata.attributes.id = postFileName.toLowerCase().replace(/([^a-z0-9_-])\W?/gi, '-').substring(0, postFileName.length - 3);
        postMetadata.attributes.formattedDate = formatDate(new Date(postMetadata.attributes.editedDate || postMetadata.attributes.pubDate));
        postMetadata.attributes.date = new Date(postMetadata.attributes.editedDate || postMetadata.attributes.pubDate);

        const postData = { ...postMetadata.attributes, fileName: postFileName, content: postParsed };
        posts.push(postData);
    }

    posts.sort((a, b) => new Date(a.date) - new Date(b.date)).reverse();

    for (const post of posts) {
        const template = templates.pages.post;

        if (post.coverImage) post.coverImageHtml = `<img src="${post.coverImage}" alt="${post.title}">`;
        else post.coverImageHtml = '';

        if (post.author) {
            const postAuthor = post.author.toLowerCase().replace(/([^a-z0-9_-])\W?/gi, '-');

            if (Object.values(templates.authors).filter(author => author.id === postAuthor).length)
                post.author = Object.values(templates.authors).filter(author => author.id === postAuthor)[0];
            else {
                post.author = { displayName: postAuthor, id: postAuthor, avatar: '', avatarHtml: '', content: '' };
                console.log(`WARNING | Author ${postAuthor} doesn't have a configuration file. Using a blank template for it.`)
            }
        
            if (!authors.includes(post.author)) authors.push(post.author);
        }

        post.tagsHtml = '';

        if (post.tags) {
            for (const tagItem of post.tags) {
                let tag;

                if (Object.values(templates.tags).filter(tag => tag.id === tagItem.toLowerCase().replace(/([^a-z0-9_-])\W?/gi, '-')).length)
                    tag = Object.values(templates.tags).filter(tag => tag.id === tagItem.toLowerCase().replace(/([^a-z0-9_-])\W?/gi, '-'))[0];
                else {
                    tag = { displayName: tagItem.toLowerCase().replace(/([^a-z0-9_-])\W?/gi, '-'), id: tagItem.toLowerCase().replace(/([^a-z0-9_-])\W?/gi, '-'), image: '', imageHtml: '', content: '' };
                    console.log(`WARNING | Tag ${tagItem} doesn't have a configuration file. Using a blank template for it.`)
                }

                if (!categories.map(tag => tag.id).includes(tag.id)) categories.push(tag);

                post.tagsHtml += `<a href="{{ baseURL }}/tags/${tag.id}" class="tag">${tag.displayName}</a>`;
            }
        }

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
            author: post.author.displayName,
            date: post.date
        });
    }

    const rssData = JSON.parse(replaceTemplates(JSON.stringify(templates.rss)));
    rssData.categories = categories.map(category => category.id);

    const feed = new rss(rssData);
    for (const item of rssItems) feed.item(item);
    await Bun.write(join(import.meta.dir, `../../public/rss.xml`), feed.xml());

    for (const author of authors) {
        const postCardTemplate = templates.components.cards.post;
        const authorPosts = posts.filter(post => post.author.id === author.id);
        
        author.posts = [];

        if (authorPosts.length)
            for (const post of authorPosts) {
                const variablesTemplate = { post };
                const postHtml = replaceTemplates(postCardTemplate, variablesTemplate);
                author.posts.push(postHtml);
            }

        author.posts.sort((a, b) => new Date(a.date) - new Date(b.date)).reverse();
        author.postsHtml = author.posts.join('\n');
        author.postsCount = author.posts.length;

        const template = templates.pages.author;
        const variablesTemplate = { author };

        const authorHtml = replaceTemplates(template, variablesTemplate);
        await Bun.write(join(import.meta.dir, `../../public/authors/${author.id}.html`), authorHtml);

        const cardHtml = replaceTemplates(templates.components.cards.author, variablesTemplate);
        authorsList.push(cardHtml);
    }

    for (const tag of categories) {
        const postCardTemplate = templates.components.cards.post;
        const tagPosts = posts.filter(post => post.tags?.includes(tag.id));
        
        tag.posts = [];

        if (tagPosts.length)
            for (const post of tagPosts) {
                const variablesTemplate = { post };
                const postHtml = replaceTemplates(postCardTemplate, variablesTemplate);
                tag.posts.push(postHtml);
            }

        tag.posts.sort((a, b) => new Date(a.date) - new Date(b.date)).reverse().join('\n');
        tag.postsHtml = tag.posts.join('\n');
        tag.postsCount = tag.posts.length;
            
        const template = templates.pages.tag;
        const variablesTemplate = { tag };

        const tagHtml = replaceTemplates(template, variablesTemplate);
        await Bun.write(join(import.meta.dir, `../../public/tags/${tag.id}.html`), tagHtml);
    }

    const indexTemplate = templates.pages.index;
    const indexHtml = replaceTemplates(indexTemplate);

    await Bun.write(join(import.meta.dir, `../../public/index.html`), indexHtml);
    await Bun.write(join(import.meta.dir, `../../templates/components/lists/posts.html`), postsList?.join('\n'));
    await Bun.write(join(import.meta.dir, `../../templates/components/lists/authors.html`), authorsList?.join('\n'));

    return { posts: posts.length, authors: authors.length, tags: categories.length };
}

export default { parse };