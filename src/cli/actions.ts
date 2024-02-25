import type { Model } from '../language/generated/ast.js';
import chalk from 'chalk';
import { createJavaScriptPropositionalLaboratoryFormatServices } from '../language/java-script-propositional-laboratory-format-module.js';
import { extractAstNode, extractFileExtension, getInputExtensionsAsSet, getInputExtensionsAsString } from './cli-util.js';
import { generateLaboratory } from './labGenerator.js';
import { generateGraphviz } from './graphvizGenerator.js';
import { NodeFileSystem } from 'langium/node';
import * as fs from 'node:fs';
//import { workspace } from 'vscode'; // TODO: replace node:fs with workspace.fs

const TEMPLATES_DIRECTORY: string = "./templates/laboratory-template";

export const generateLaboratoryAction = async (inputFile: string, destination: string, templatePath: string = TEMPLATES_DIRECTORY): Promise<string> => {
    const fileExtensions: Set<string> = getInputExtensionsAsSet();

    // workspace.fs.stat(destination).then((value) => {
    //     value.type
    // });

    // make sure input is a jspl file
    fs.stat(inputFile, (err, stats) => {
        if (err)
            throw new Error(err.message);

        if (!stats.isFile())
            throw new Error(`The specified input file (${inputFile}) is not a file.`);
    });
    if (!fileExtensions.has("." + extractFileExtension(inputFile)) )
        throw new Error(`The specified input file (${inputFile}) does not have one of the allowed file extensions (${getInputExtensionsAsString()}).`);

    // make sure destination exists and is a directory
    if (!fs.existsSync(destination))
        fs.mkdirSync(destination);

    fs.stat(destination, (err, stats) => {
        if (err)
            throw new Error(err.message);

        if (!stats.isDirectory())
            throw new Error(`The specified output directory (${destination}) is not a directory.`);
    });

    const services = createJavaScriptPropositionalLaboratoryFormatServices(NodeFileSystem).JavaScriptPropositionalLaboratoryFormat;
    const model = await extractAstNode<Model>(inputFile, services);
    const generatedLabPath = generateLaboratory(model, destination, templatePath);
    console.log(chalk.green(`JavaScript code generated successfully: ${generatedLabPath}`));

    return generatedLabPath;
};

export const generateGraphvizAction = async (fileName: string, destination: string): Promise<void> => {
    const services = createJavaScriptPropositionalLaboratoryFormatServices(NodeFileSystem).JavaScriptPropositionalLaboratoryFormat;
    const model = await extractAstNode<Model>(fileName, services);
    const generatedFilePath = generateGraphviz(model, fileName, destination);
    console.log(chalk.green(`Graphviz Visualization generated successfully: ${generatedFilePath}`));
};