import { parse } from "url";

const htmlHeaders = new Headers();
htmlHeaders.set('Content-Type', 'text/html;charset=utf-8');

const config = await Bun.file("./config.json").json();

const server = Bun.serve({
    port: config.server.port,
    hostname: config.server.host,
    async fetch(req) {
        let filePath = "./public" + parse(req.url).pathname;

        //returns 404 if the user requests index.html specifically
        if (filePath === "./public/index.html") return await returnError(404);

        //return index if the path is /
        if (filePath === "./public/") filePath = "./public/index";

        //if the file doesn't have an extension, add .html 
        if (!filePath.substring(1).match(/^.*\.[^\\]+$/)?.length) filePath = filePath + ".html";

        if (filePath.startsWith("./public/errors/")) return await returnError(404);

        const file = Bun.file(filePath);
        if (!(await file.exists())) return await returnError(404);

        //if it's an html file, replace the variables with the values in config.json
        if (filePath.match(/^(.(.*\.html))*$/)?.length)
            return new Response(
                (await file.text()).replaceAll('{{ siteName }}', config.siteName),
                { headers: htmlHeaders }
            );

        return new Response(file);
    },
});

console.log(`Listening on ${server.hostname}:${server.port}`);


async function returnError(code) {
    const errorPage = Bun.file(`./public/errors/${code}.html`);
    if (!(await errorPage.exists()))
        return new Response(`Couldn't find the error page. You shouldn't be here. (☉_☉) Anyways, the status code is ${code}.`, { status: 404 });

    return new Response(
        (await errorPage.text()).replaceAll('{{ siteName }}', config.siteName),
        { headers: htmlHeaders, status: code });
}