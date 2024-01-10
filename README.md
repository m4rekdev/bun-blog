# bun-blog

A customizable, extendable and easy-to-use markdown blogging website written in Bun! 🔥

## Table Of Contents 📝
- [Setup](#setup)
- [Themes](#themes)
- [Templates](#templates-variables-and-pages)
- [Static Building](#static-building)

# Setup

You need [Bun](https://bun.sh) for this project. If you don't have it, you can install it using the script on their website.

1. Install packages:
    ```bash
    bun install
    ```

2. Make a `config.json`. You can start by copying or renaming `config.json.example` to `config.json`.

3. Run bun-blog listening on the address and port configured in the config:
    ```bash
    bun start
    ```
    - You can also use [Static Building](#static-building).

4. Write your posts inside the `posts` directory using [Markdown](https://www.markdownguide.org/basic-syntax/) and [Frontmatter](https://jekyllrb.com/docs/front-matter/) following the examples in that folder. You can also use subdirectories to organize your posts.
    - **TIP:** Use `draft: true` to prevent a post from being parsed.

5. Enjoy your blog! 🔥

6. (Optional, as bun-blog parses the posts automatically when starting and then every 5 minutes) To manually parse posts use:
    ```bash
    bun run parsePosts
    ```
    - **TIP**: You can also customize the `post.html` in the `templates/posts`. It also populates the {{ posts.list }} template variable, so you can list your posts inside of any HTML file in the `public` folder (this uses the `templates/posts/card.html` template for each post), After parsing, the list of the post cards will be located inside of the `templates/posts/list.html` file.


7. (Optional) Customize your blog with [Themes](#themes)!
    - **TIP:** You can also modify the `index.html` and other files inside the `public` folder (excluding the `posts` folder and `rss.xml`, as the files are dynamically generated by `parsePosts`. the posts are using the `templates/posts/page.html`) as well as the files inside the `templates` folder (excluding `templates/posts/list.html`, as it is also dynamically generated by `parsePosts` using the `templates/posts/card.html` template for each post). You can also use the **[Templates](#templates-variables-and-pages)**.

**If you only have access to a static environment, you can check out [Static Building](#static-building).**


# Themes

You can make themes by adding css files to `public/assets/css`, using the `:root[theme="your-theme"]` (or `html[theme="your-theme"]`) selectors, where "your-theme" is the name of your theme and importing it inside `public/assets/css/styles.css`. To change your theme, use the defaultTheme option in `config.json`. There will be a client-specific theme selector implemented soon.

# Templates (Variables and Pages)

**List of available global variables:**
- {{ version }} - Version of Bun Blog you're running
- {{ siteName }} - Site Name
- {{ siteDescription }} - Site Description
- {{ siteKeywords }} - Site Keywords
- {{ siteIcon }} - Site Icon
- {{ siteImage }} - Site Image
- {{ baseURL }} - Base URL for the site
- {{ defaultTheme }} - The default theme set in the config
- {{ rss.title }} - RSS Title
- {{ rss.description }} - RSS Description
- {{ rss.generator }} - RSS Generator
- {{ rss.feed_url }} - RSS Feed URL
- {{ rss.site_url }} - RSS Site URL
- {{ rss.copyright }} - RSS Copyright
- {{ rss.categories }} - RSS Categories
- {{ rss.ttl }} - RSS TTL
- {{ errors.403.title }} - Title of the 403 error
- {{ errors.403.text }} - Text of the 403 error
- {{ errors.404.title }} - Title of the 404 error
- {{ errors.404.text }} - Text of the 404 error
- {{ server.host }} - Address the server is listening on
- {{ server.port }} - Port the server is listening on
- {{ errorPages.403 }} - 403 Page
- {{ errorPages.404 }} - 404 Page
- {{ posts.card }} - The card template (what shows up in the list template for each post)
- {{ posts.page }} - Post page
- {{ posts.list }} - List of posts
- {{ navbar }} - Navbar Component

**List of available post variables (available only if the template is for a post):**
- {{ post.title }} - Post Title
- {{ post.coverImage }} - Post Cover Image
- {{ post.coverImageHtml }} - HTML for the Post Cover Image
- {{ post.author }} - Post Author
- {{ post.draft }} - Is it a draft? (true/false)
- {{ post.pubDate }} - Post Publish Date
- {{ post.editedDate }} - Post Last Edit Date
- {{ post.description }} - Post Description
- {{ post.tags }} - Post Tags
- {{ post.content }} - Post Content
- {{ post.id }} - Post ID (Slug)
- {{ post.date }} - Most recent date (can be the Publish Date or the Last Edit Date)
- {{ post.fileName }} - Post File Name

# Static Building

To build your project to static files, use:
```bash
bun run buildStatic
```

Now you can upload the contents of the `build` folder to your host.
