# bun-blog

A customizable, extendable and easy-to-use markdown blogging website written in Bun! 🔥

*Theme support coming soon...*

To install dependencies:

```bash
bun install
```

You need to make a `config.json` to use bun-blog. You can start by copying or renaming `config.json.example` to `config.json`.

To run:

```bash
bun start
```

**Nice, now you have a new empty blog.**

You can write your posts using markdown in the posts directory. To make them viewable, you need to parse them, so they are added to the public directory.

To parse posts:

```bash
bun run parsePosts
```

**If you only have access to a static environment (GitHub Pages, CloudFlare Pages, etc.) you can build your static site.**

```bash
bun run buildStatic
```

Now you can use the build folder as the site root.
