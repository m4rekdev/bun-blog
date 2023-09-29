import { parse } from "url";
import { join } from 'path';

const htmlHeaders = new Headers();
htmlHeaders.set('Content-Type', 'text/html;charset=utf-8');

const config = await Bun.file(join(import.meta.dir, '../config.json')).json();

const server = Bun.serve({
    port: config.server.port,
    hostname: config.server.host,
    async fetch(req) {
        let filePath = "public" + parse(req.url).pathname;

        //returns 404 if the user requests index.html specifically
        if (filePath === "public/index.html") return await returnError(404);

        //return index if the path is /
        if (filePath === "public/") filePath = "public/index";

        //if the file doesn't have an extension, add .html 
        if (!filePath.match(/^.*\.[^\\]+$/)?.length) filePath = filePath + ".html";

        if (filePath.startsWith("public/errors/")) return await returnError(404);

        const file = Bun.file(join(import.meta.dir, `../${filePath}`));
        if (!(await file.exists())) return await returnError(404);

        //if it's an html file, replace the variables with the values in config.json
        if (filePath.match(/^(.(.*\.html))*$/)?.length)
            return new Response(
                (
                    await file.text())
                        .replaceAll('{{ siteName }}', config.siteName)
                        .replaceAll('{{ siteDescription }}', config.siteDescription)
                        .replaceAll('{{ siteURL }}', config.siteURL),
                { headers: htmlHeaders }
            );

        return new Response(file);
    },
});

console.log(`Listening on ${server.hostname}:${server.port}`);


async function returnError(code) {
    const errorPage = Bun.file(join(import.meta.dir, `../public/errors/${code}.html`));
    if (!(await errorPage.exists()))
        return new Response(`Couldn't find the error page. You shouldn't be here. (☉_☉) Anyways, the status code is ${code}.`, { status: code });

    return new Response(
        (
            await errorPage.text())
                .replaceAll('{{ siteName }}', config.siteName)
                .replaceAll('{{ siteDescription }}', config.siteDescription)
                .replaceAll('{{ siteHostname }}', config.siteHostname),
        { headers: htmlHeaders, status: code });
}