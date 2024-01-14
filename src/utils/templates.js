import { join, relative, dirname, basename } from 'path';
import walk from './walk.js';

const templates = {};
const externalTemplates = {};

const pkg = await Bun.file(join(import.meta.dir, '../../package.json')).json();
templates.version = pkg.version;

async function loadTemplates() {
    const configFile = Bun.file(join(import.meta.dir, '../../config.json'));

    if (!await configFile.exists()) {
        console.log('You need to make a config.json to use bun-blog. You can start by copying or renaming config.json.example to config.json');
        process.exit();
    }

    const config = await configFile.json();
    const templateFiles = await walk(join(import.meta.dir, '../../templates'));

    if (externalTemplates)
        for (const externalTemplateType of Object.keys(externalTemplates)) templates[externalTemplateType] = externalTemplates[externalTemplateType];

    for (const configKey of Object.keys(config)) {
        templates[configKey] = config[configKey];
    }

    for await (const templateFile of templateFiles) {
        let templateName = relative(join(import.meta.dir, '../../templates'), templateFile);
        if (!templateName.endsWith('.html')) continue;

        templateName = templateName.substring(0, templateName.length - 5);

        let templateContent = await Bun.file(templateFile).text();

        // Create a nested structure based on the directory hierarchy
        const templatePathParts = dirname(templateName).split(/[\\/]/);
        let currentLevel = templates;
        
        for (let i = 0; i < templatePathParts.length; i++) {
            const part = templatePathParts[i];
            if (part === '.') continue;

            currentLevel[part] = currentLevel[part] || {};
            currentLevel = currentLevel[part];
        }

        currentLevel[basename(templateName)] = templateContent;
    }
}

async function addExternalTemplate(type, name, content) {
    if (!externalTemplates?.[type]) externalTemplates[type] = {};
    externalTemplates[type][name] = content;

    await loadTemplates();
}

await loadTemplates();
setInterval(async () => await loadTemplates(), 5000);

export default templates;
export { addExternalTemplate };