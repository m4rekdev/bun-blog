if (typeof Bun === 'undefined') throw new Error('You need Bun to run this!');

import posts from "./utils/posts.js";

const start = Date.now();
const postsCount = await posts.parse();
const end = Date.now();

console.log(`Success! Parsed ${postsCount} posts in ${end - start} ms`);
process.exit();