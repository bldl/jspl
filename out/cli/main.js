import { Command } from 'commander';
import * as url from 'node:url';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { getInputExtensionsAsString } from './cli-util.js';
import { generateLaboratoryAction, generateGraphvizAction } from './actions.js';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const packagePath = path.resolve(__dirname, '..', '..', 'package.json');
const packageContent = await fs.readFile(packagePath, 'utf-8');
export default function () {
    const program = new Command();
    program.version(JSON.parse(packageContent).version);
    const fileExtensions = getInputExtensionsAsString();
    program
        .command('generate')
        .argument('<input-file>', `source file (possible file extensions: ${fileExtensions})`)
        .argument('<output-directory>', `destination directory`)
        .description('generates the laboratory backend from the source code')
        .action((...args) => {
        generateLaboratoryAction(args[0], args[1]);
    });
    program
        .command('graphviz')
        .argument('<input-file>', `source file (possible file extensions: ${fileExtensions})`)
        .argument('<output-file>', `destination file (possible file extensions: .dot)`)
        .description('generates a ".dot" file, that can be used to display a graph of the laboratory structure.')
        .action(generateGraphvizAction);
    program.parse(process.argv);
}
//# sourceMappingURL=main.js.map