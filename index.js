import { parse } from "url";

const htmlHeaders = new Headers();
htmlHeaders.set('Content-Type', 'text/html;charset=utf-8');

const server = Bun.serve({
    port: 3000,
    hostname: "*", //listen on all interfaces
    async fetch(req) {
        let filePath = "./public" + parse(req.url).pathname;

        //returns 404 if the user requests index.html specifically
        if (filePath === "./public/index.html") return await returnError(404);

        //return index if the path is /
        if (filePath === "./public/") filePath = "./public/index";

        if (!filePath.substring(1).match(/^.*\.[^\\]+$/)?.length) filePath = filePath + ".html";

        if (filePath.startsWith("./public/errors/")) return await returnError(403);

        const file = Bun.file(filePath);
        if (!(await file.exists())) return await returnError(404);

        if (filePath.match(/^(.(.*\.html))*$/)?.length)
            return new Response(
                (await file.text()).replaceAll('{blogBunSiteName}', "test"),
                { headers: htmlHeaders }
            );

        return new Response(file);
    },
});

console.log(`Listening on localhost:${server.port}`);


async function returnError(code) {
    const errorPage = Bun.file(`./public/errors/${code}.html`);
    if (!(await errorPage.exists()))
        return new Response(`Couldn't find the error page. You shouldn't be here. (☉_☉) Anyways, the status code is ${code}.`, { status: 404 });

    return new Response(
        (await errorPage.text()).replaceAll('{blogBunSiteName}', "test"),
        { headers: htmlHeaders, status: code });
}