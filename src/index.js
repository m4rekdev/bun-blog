import { parse } from "url";
import { join } from 'path';
import replaceTemplates from "./utils/replaceTemplates";
import templates from "./utils/templates";
import parsePosts from "./parsePosts";

const htmlHeaders = new Headers();
htmlHeaders.set('Content-Type', 'text/html;charset=utf-8');

setInterval(async () => {
    console.log('Refreshed posts!');
    await parsePosts.parse();
}, 300000);

const server = Bun.serve({
    port: templates.server.port,
    hostname: templates.server.host,
    async fetch(req) {
        let filePath = "public" + parse(req.url).pathname;

        //returns 404 if the user requests index.html specifically
        if (filePath === "public/index.html") return await returnError(404);

        //return index if the path is /
        if (filePath === "public/") filePath = "public/index";

        //if the file doesn't have an extension, add .html 
        if (!filePath.match(/(\w+\.\w+)$/i)?.length) filePath = filePath + ".html";

        const file = Bun.file(join(import.meta.dir, `../${filePath}`));
        if (!(await file.exists())) return await returnError(404);

        //if it's an html file, replace the variables with templates
        if (filePath.match(/^(.(.*\.html))*$/)?.length)
            return new Response(
                replaceTemplates(await file.text()),
                { headers: htmlHeaders }
            );

        return new Response(file);
    },
});

console.log(`Listening on ${server.hostname}:${server.port}`);


async function returnError(code) {
    const errorPage = replaceTemplates(templates.errorPages[code]);

    return new Response(
        errorPage,
        { headers: htmlHeaders, status: code }
    );
}