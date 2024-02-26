import { Command } from 'commander';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { resolve as pathResolve } from 'node:path';
import { getInputExtensionsAsString } from '../util/cli-util.js';
import { generateLaboratoryAction, generateGraphvizAction } from '../generators/actions.js';
import chalk from 'chalk';
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const packagePath = pathResolve(__dirname, '..', '..', 'package.json');
const packageContent = await readFile(packagePath, 'utf-8');
async function generateLaboratoryCLI(...args) {
    const inputFilePath = args[0];
    const outputDirectoryPath = args[1];
    const generatedLabPath = await generateLaboratoryAction(inputFilePath, outputDirectoryPath);
    console.log(chalk.green(`JavaScript code generated successfully: ${generatedLabPath}`));
}
async function generateGraphvizCLI(...args) {
    const inputFilePath = args[0];
    const outputFilePath = args[1];
    const generatedFilePath = await generateGraphvizAction(inputFilePath, outputFilePath);
    console.log(chalk.green(`Graphviz Visualization generated successfully: ${generatedFilePath}`));
}
export default function () {
    const program = new Command();
    program.version(JSON.parse(packageContent).version);
    const fileExtensions = getInputExtensionsAsString();
    program
        .command('generate')
        .argument('<input-file>', `source file (possible file extensions: ${fileExtensions})`)
        .argument('<output-directory>', `destination directory`)
        .description('generates the laboratory backend from the source code')
        .action(generateLaboratoryCLI);
    program
        .command('graphviz')
        .argument('<input-file>', `source file (possible file extensions: ${fileExtensions})`)
        .argument('<output-file>', `destination file (possible file extensions: .dot)`)
        .description('generates a ".dot" file, that can be used to display a graph of the laboratory structure.')
        .action(generateGraphvizCLI);
    program.parse(process.argv);
}
//# sourceMappingURL=main.js.map