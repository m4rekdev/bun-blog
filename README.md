# bun-blog

A customizable, extendable and easy-to-use markdown blogging website written in Bun! 🔥

## Table Of Contents
- [Usage 🔧](#usage-🔧)
- [Themes ✨](#themes-✨)
- [Static Building 📦](#static-building-📦)

# Usage 🔧

You need [Bun](https://bun.sh) for this project.

1. Install packages:
    ```bash
    bun install
    ```

2. Make a `config.json`. You can start by copying or renaming `config.json.example` to `config.json`.

3. Run bun-blog listening on the address and port configured in the config:
    ```bash
    bun start
    ```
4. Write your posts inside the `posts` posts directory using [Markdown](https://www.markdownguide.org/basic-syntax/) and [Frontmatter](https://jekyllrb.com/docs/front-matter/) following the examples in that folder. You can also use subdirectories to organize your posts.

5. Parse posts, so the HTML files for them are generated in the `public/posts` folder. You can customize the `post.html` in the `templates/posts`. It also populates the {{ posts.list }} template variable, so you can list your posts inside any HTML file inside the `public` folder (this uses the `templates/posts/card.html` template), the list of the post cards will be located inside the `templates/posts/list.html` file. You need to do this each time you edit your existing posts or write new ones.

6. Enjoy your blog! 🔥

7. (Optional) If you only have access to a static environment, you can check the [Static Building 📦](#static-building-📦) section out.



```bash
bun run buildStatic
```

Now you can use the build folder as the site root.


8. Customize your blog with [Themes ✨](#themes-✨)! 


# Themes ✨

You can make themes by adding css files to `public/assets/css`, using the `:root[theme="your-theme"]` (or `html[theme="your-theme"]`) selectors, where "your-theme" is the name of your theme and importing it inside `public/assets/css/styles.css`. To change your theme, use the defaultTheme option in `config.json`. There will be a client-specific theme selector implemented soon.

# Static Building 📦

To build your project to static files, use:
```bash
bun run buildStatic
```

Now you can upload the contents of the `build` folder to your host. You need to build your site each time you change it (edit or create a post, change a template, change the theme etc.), in addition to `parsePosts` (if you edit or create a post).