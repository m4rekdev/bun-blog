import { join } from 'path';
import replaceTemplates from "./utils/replaceTemplates.js";
import { templates, loadTemplates } from "./utils/templates.js";
import parseData from "./utils/parseData.js";

await loadTemplates();
setInterval(async () => await loadTemplates(), templates.templateRefreshInterval * 1000);

setInterval(async () => {
    const parsedData = await parseData.parse();
    console.log(`Refreshed ${parsedData.posts} posts, ${parsedData.authors} authors and ${parsedData.tags} tags.`);
}, templates.postRefreshInterval * 1000);

const server = Bun.serve({
    port: templates.server.port,
    hostname: templates.server.host,
    async fetch(req) {
        let filePath = "public" + new URL(req.url).pathname;

        //returns 404 if the user requests index.html specifically
        if (filePath === "public/index.html") return await returnError(404);

        //return index if the path is /
        if (filePath === "public/") filePath = "public/index";

        //if the file doesn't have an extension, add .html 
        if (!filePath.match(/(\w+\.\w+)$/i)?.length) filePath = filePath + ".html";

        const file = Bun.file(join(import.meta.dir, `../${filePath}`));
        if (!(await file.exists())) return await returnError(404);

        let fileData;

        if (filePath.match(/(\.html|\.json|)$/i)?.length) fileData = replaceTemplates(await file.text());
        else fileData = file;

        const headers = new Headers();
        headers.set('Content-Type', file.type);

        return new Response(fileData, { headers });
    },
});

const parsedData = await parseData.parse();
console.log(`Parsed ${parsedData.posts} posts, ${parsedData.authors} authors and ${parsedData.tags} tags.`);

console.log(`Listening on ${server.hostname}:${server.port}`);

async function returnError(code) {
    const errorPage = replaceTemplates(templates.pages.error[code]);

    const headers = new Headers();
    headers.set('Content-Type', 'text/html; charset=utf-8');

    return new Response(
        errorPage,
        { headers: headers, status: code }
    );
}