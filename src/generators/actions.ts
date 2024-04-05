import type { Model } from '../language/generated/ast.js';
import { createJavaScriptPropositionalLaboratoryFormatServices } from '../language/java-script-propositional-laboratory-format-module.js';
import { extractAstNode, getInputExtensionsAsSet, getInputExtensionsAsString } from '../util/cli-util.js';
import { generateLaboratory } from './lab/main.js';
import { generateGraphviz } from './graphviz/main.js';
import { NodeFileSystem } from 'langium/node';
import { statSync, existsSync, mkdirSync } from 'node:fs';
import { FileSystemError } from 'vscode';
import { extname as pathExtname } from 'node:path'
import { generateJSON } from './json/main.js';
//import { workspace, Uri } from 'vscode'; // TODO: replace node:fs with workspace.fs

const TEMPLATES_DIRECTORY: string = "./templates/laboratory-template";

function getModel(inputFile: string): Promise<Model> {
    const services = createJavaScriptPropositionalLaboratoryFormatServices(NodeFileSystem).JavaScriptPropositionalLaboratoryFormat;
    return extractAstNode<Model>(inputFile, services);
}

function checkJSPLInput(inputFile: string): void {
    const fileExtensions: Set<string> = getInputExtensionsAsSet();
    const inputStats = statSync(inputFile);

    if (!inputStats.isFile())
        throw new FileSystemError(`The specified input file (${inputFile}) is not a file.`);
    if (!fileExtensions.has(pathExtname(inputFile)))
        throw new FileSystemError(`The specified input file (${inputFile}) does not have one of the allowed file extensions (${getInputExtensionsAsString()}).`);
}

function checkLaboratoryOutputDirectory(outputDirectoryPath: string): void {
    if (!existsSync(outputDirectoryPath))
        mkdirSync(outputDirectoryPath);

    const outputStats = statSync(outputDirectoryPath);
    if (!outputStats.isDirectory())
        throw new FileSystemError(`The specified output directory (${outputDirectoryPath}) is not a directory.`);
}

export const generateLaboratoryAction = async (inputFile: string, destination: string, templatePath: string = TEMPLATES_DIRECTORY): Promise<string> => {
    // check input file
    try {
        checkJSPLInput(inputFile);
    } catch (error) {
        return Promise.reject(`Something went wrong while checking the input file. (Error: ${error})`)
    }

    // check output directory
    try {
        checkLaboratoryOutputDirectory(destination);
    } catch (error) {
        return Promise.reject(`Something went wrong while checking the output directory. (Error: ${error})`);
    }

    const model = await getModel(inputFile);
    const generatedLabPath = generateLaboratory(model, destination, templatePath);
    return Promise.resolve(generatedLabPath);
};

export const generateGraphvizAction = async (inputFile: string, destination: string): Promise<string> => {
    // check input file
    try {
        checkJSPLInput(inputFile);
    } catch (error) {
        return Promise.reject(`Something went wrong while reading the input file. (Error: ${error})`)
    }

    const model = await getModel(inputFile);
    const generatedFilePath = generateGraphviz(model, destination);
    return Promise.resolve(generatedFilePath);
};

export const generateJSONAction = async (inputFile: string, destination: string): Promise<string> => {
    // check input file
    try {
        checkJSPLInput(inputFile);
    } catch (error) {
        return Promise.reject(`Something went wrong while reading the input file. (Error: ${error})`)
    }

    const model = await getModel(inputFile);
    const generatedFilePath = generateJSON(model, destination);
    return Promise.resolve(generatedFilePath);
}