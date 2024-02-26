import { createJavaScriptPropositionalLaboratoryFormatServices } from '../language/java-script-propositional-laboratory-format-module.js';
import { extractAstNode, extractFileExtension, getInputExtensionsAsSet, getInputExtensionsAsString } from './cli-util.js';
import { generateLaboratory } from './labGenerator.js';
import { generateGraphviz } from './graphvizGenerator.js';
import { NodeFileSystem } from 'langium/node';
import { statSync, existsSync, mkdirSync } from 'node:fs';
import { FileSystemError } from 'vscode';
//import { workspace, Uri } from 'vscode'; // TODO: replace node:fs with workspace.fs
const TEMPLATES_DIRECTORY = "./templates/laboratory-template";
function getModel(inputFile) {
    const services = createJavaScriptPropositionalLaboratoryFormatServices(NodeFileSystem).JavaScriptPropositionalLaboratoryFormat;
    return extractAstNode(inputFile, services);
}
function checkJSPLInput(inputFile) {
    const fileExtensions = getInputExtensionsAsSet();
    const inputStats = statSync(inputFile);
    if (!inputStats.isFile())
        throw new FileSystemError(`The specified input file (${inputFile}) is not a file.`);
    if (!fileExtensions.has("." + extractFileExtension(inputFile)))
        throw new FileSystemError(`The specified input file (${inputFile}) does not have one of the allowed file extensions (${getInputExtensionsAsString()}).`);
}
function checkLaboratoryOutputDirectory(outputDirectoryPath) {
    if (!existsSync(outputDirectoryPath))
        mkdirSync(outputDirectoryPath);
    const outputStats = statSync(outputDirectoryPath);
    if (!outputStats.isDirectory())
        throw new FileSystemError(`The specified output directory (${outputDirectoryPath}) is not a directory.`);
}
export const generateLaboratoryAction = async (inputFile, destination, templatePath = TEMPLATES_DIRECTORY) => {
    // check input file
    try {
        checkJSPLInput(inputFile);
    }
    catch (error) {
        return Promise.reject(`Something went wrong while checking the input file. (Error: ${error})`);
    }
    // check output directory
    try {
        checkLaboratoryOutputDirectory(destination);
    }
    catch (error) {
        return Promise.reject(`Something went wrong while checking the output directory. (Error: ${error})`);
    }
    const model = await getModel(inputFile);
    const generatedLabPath = generateLaboratory(model, destination, templatePath);
    return Promise.resolve(generatedLabPath);
};
export const generateGraphvizAction = async (inputFile, destination) => {
    // check input file
    try {
        checkJSPLInput(inputFile);
    }
    catch (error) {
        return Promise.reject(`Something went wrong while reading the input file. (Error: ${error})`);
    }
    const model = await getModel(inputFile);
    const generatedFilePath = generateGraphviz(model, destination);
    return Promise.resolve(generatedFilePath);
};
//# sourceMappingURL=actions.js.map