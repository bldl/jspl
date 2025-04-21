import { existsSync, mkdirSync, copyFileSync, writeFileSync, appendFileSync } from 'node:fs';
//import { workspace, Uri } from 'vscode'; // TODO: replace node:fs with workspace.fs
import { CompositeGeneratorNode, toString } from 'langium';
import path from 'node:path';
import { Model } from '../../language/generated/ast.js';
import { generateConcerns } from './concerns.js';
import { generateConditions } from './conditions.js';
import { generateGivens, generateTweakables } from './propositions.js';
import { extractLaboratoryInformationForWebWithDefaults, ExtractedWebLaboratoryInformation, readTemplatedFile } from './util.js';
import { generateRaiseConditions } from './raiseConditions.js';

type TemplateMarker = {
    START: string,
    END: string
}

const DATA_TEMPLATE_MARKER: TemplateMarker = {
    START: "//???TEMPLATE-MARKER-START???",
    END: "//???TEMPLATE-MARKER-END???"
};

const INDEX_TEMPLATE_MARKER: TemplateMarker = {
    START: "<!--???TEMPLATE-MARKER-START???-->",
    END: "<!--???TEMPLATE-MARKER-END???-->"
}

const ROOT_FILES_TO_COPY: Array<string> = [
    //"README.md",
    //"LICENSE",
    "lab.js",
    "optimization.js"
];
const RESOURCES_TO_COPY: Array<string> = [
    "favicon.svg",
    "github.png",
    "htm_preact_standalone.js"
];

export function generateOptimizer(model: Model, outputDirectory: string, templateDirectory: string): string {
    const outputResourcesPath = path.join(outputDirectory, "res");

    // make sure Resources Folder exists
    if (!existsSync(outputResourcesPath))
        mkdirSync(outputResourcesPath);

    // Copy static files to output (index.html, LICENSE, README.md, res/favicon.svg, res/github.png)
    ROOT_FILES_TO_COPY.forEach(fileName => {
        copyFileSync(
            path.join(templateDirectory, fileName), 
            path.join(outputDirectory, fileName)
        );
    });
    RESOURCES_TO_COPY.forEach(fileName => {
        copyFileSync(
            path.join(templateDirectory, fileName), 
            path.join(outputResourcesPath, fileName)
        );
    });

    // extract laboratory information from model
    const laboratoryInformation = extractLaboratoryInformationForWebWithDefaults(model.laboratory);

    generateIndex(
        model,
        laboratoryInformation,
        path.join(templateDirectory, "index.html"),
        path.join(outputDirectory, "index.html")
    );

    generateDataJS(
        model, 
        laboratoryInformation,
        path.join(templateDirectory, "data.js"), 
        path.join(outputDirectory, "data.js")
    );

    return outputDirectory;
}

function generateIndex(model: Model, laboratoryInformation: ExtractedWebLaboratoryInformation, indexTemplatePath: string, outputIndexPath: string): void {
    const indexTemplate = readTemplatedFile(indexTemplatePath, INDEX_TEMPLATE_MARKER);

    // Clear index.html file
    writeFileSync(outputIndexPath, "");

    // 1. Write Prefix
    appendFileSync(outputIndexPath, indexTemplate.prefix);

    // 2. Write Header Data
    const iconString = (laboratoryInformation.icon == undefined) ? "undefined" : laboratoryInformation.icon;
    const headerData: string = `<title>${laboratoryInformation.title}</title>\n\t<link rel="icon" href="${iconString}"/>`;
    appendFileSync(outputIndexPath, headerData);

    // 3. Write Postfix
    appendFileSync(outputIndexPath, indexTemplate.postfix);
}

function generateDataJS(model: Model, laboratoryInformation: ExtractedWebLaboratoryInformation, labTemplatePath: string, outputJavaScript: string): void {
    const labTemplate = readTemplatedFile(labTemplatePath, DATA_TEMPLATE_MARKER);

    // Clear lab.js file
    writeFileSync(outputJavaScript, "");

    // Create lab.js (by appending to file?)
    // 1. Write Prefix
    appendFileSync(outputJavaScript, labTemplate.prefix);

    // 2. Write Laboratory Information
    const laboratoryInformationNode = new CompositeGeneratorNode();
    generateLaboratoryInformation(laboratoryInformation, laboratoryInformationNode)
    appendFileSync(outputJavaScript, toString(laboratoryInformationNode));

    // 3. Write Concerns
    const concernsNode = new CompositeGeneratorNode();
    generateConcerns(model.concerns, concernsNode, laboratoryInformation);
    appendFileSync(outputJavaScript, toString(concernsNode))

    // 4. Write Conditions
    const conditionsNode = new CompositeGeneratorNode();
    generateConditions(model.conditions, conditionsNode);
    appendFileSync(outputJavaScript, toString(conditionsNode));

    // 5. Write Givens
    const givensNode = new CompositeGeneratorNode();
    generateGivens(model.propositions, givensNode);
    appendFileSync(outputJavaScript, toString(givensNode));

    // 6. Write Tweakables
    const tweakablesNode = new CompositeGeneratorNode();
    generateTweakables(model.propositions, tweakablesNode);
    appendFileSync(outputJavaScript, toString(tweakablesNode));

    const raiseConditionsNode = new CompositeGeneratorNode();
    generateRaiseConditions(model, raiseConditionsNode);
    appendFileSync(outputJavaScript, toString(raiseConditionsNode));


    // 7. Write Postfix
    appendFileSync(outputJavaScript, labTemplate.postfix);
}

function generateLaboratoryInformation(laboratoryInformation: ExtractedWebLaboratoryInformation, node: CompositeGeneratorNode) {
    node.append("export const metaData = {\n");

    const titleString = (laboratoryInformation.title == undefined) ? "undefined" : `"${laboratoryInformation.title}"`;
    node.append(`\ttitle: ${titleString},\n`);

    const descriptionString = (laboratoryInformation.description == undefined) ? "undefined" : `${laboratoryInformation.description}`;
    node.append(`\tdescriptionHtml: html\`${descriptionString}\`,\n`);

    const authorString = (laboratoryInformation.author == undefined) ? "undefined" : `"${laboratoryInformation.author}"`;
    node.append(`\tauthor: ${authorString},\n`);

    const versionString = (laboratoryInformation.version == undefined) ? "undefined" : `"${laboratoryInformation.version}"`;
    node.append(`\tversion: ${versionString},\n`);

    // TODO: extract from laboratory information (also add to laboratory information...)
    const scipUrlString = "http://localhost:5000/optimize";
    node.append(`\tscipUrl: "${scipUrlString}",\n`);

    node.append("};\n");
}