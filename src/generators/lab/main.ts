import { existsSync, mkdirSync, copyFileSync, writeFileSync, appendFileSync } from 'node:fs';
//import { workspace, Uri } from 'vscode'; // TODO: replace node:fs with workspace.fs
import { CompositeGeneratorNode, toString } from 'langium';
import path from 'node:path';
import { LaboratoryInformation, Model } from '../../language/generated/ast.js';
import { generateConcerns } from './concerns.js';
import { generateConditions } from './conditions.js';
import { generateGivens, generateTweakables } from './propositions.js';
import { extractLaboratoryInformation, readTemplatedFile } from './util.js';

type TemplateMarker = {
    START: string,
    END: string
}

const LAB_TEMPLATE_MARKER: TemplateMarker = {
    START: "//???TEMPLATE-MARKER-START???",
    END: "//???TEMPLATE-MARKER-END???"
};

const INDEX_TEMPLATE_MARKER: TemplateMarker = {
    START: "<!--???TEMPLATE-MARKER-START???-->",
    END: "<!--???TEMPLATE-MARKER-END???-->"
}

const ROOT_FILES_TO_COPY: Array<string> = [
    "README.md",
    "LICENSE"
];
const RESOURCES_TO_COPY: Array<string> = [
    "favicon.svg",
    "github.png"
];

export function generateLaboratory(model: Model, outputDirectory: string, templateDirectory: string): string {
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

    generateIndex(
        model,
        path.join(templateDirectory, "index.html"),
        path.join(outputDirectory, "index.html")
    );

    generateLabJS(
        model, 
        path.join(templateDirectory, "lab.js"), 
        path.join(outputDirectory, "lab.js")
    );

    return outputDirectory;
}

function generateIndex(model: Model, indexTemplatePath: string, outputIndexPath: string): void {
    const indexTemplate = readTemplatedFile(indexTemplatePath, INDEX_TEMPLATE_MARKER);

    // Clear index.html file
    writeFileSync(outputIndexPath, "");

    // 1. Write Prefix
    appendFileSync(outputIndexPath, indexTemplate.prefix);

    // 2. Write Header Data
    const extracted = extractLaboratoryInformation(model.laboratory);
    const headerData: string = `<title>${extracted.title}</title>\n\t<link rel="icon" href="${extracted.icon}"/>`;
    appendFileSync(outputIndexPath, headerData);

    // 3. Write Postfix
    appendFileSync(outputIndexPath, indexTemplate.postfix);
}

function generateLabJS(model: Model, labTemplatePath: string, outputJavaScript: string): void {
    const labTemplate = readTemplatedFile(labTemplatePath, LAB_TEMPLATE_MARKER);

    // Clear lab.js file
    writeFileSync(outputJavaScript, "");

    // Create lab.js (by appending to file?)
    // 1. Write Prefix
    appendFileSync(outputJavaScript, labTemplate.prefix);

    // 2. Write Laboratory Information
    const laboratoryInformationNode = new CompositeGeneratorNode();
    generateLaboratoryInformation(model.laboratory, laboratoryInformationNode)
    appendFileSync(outputJavaScript, toString(laboratoryInformationNode));

    // 3. Write Concerns
    const concernsNode = new CompositeGeneratorNode();
    generateConcerns(model.concerns, concernsNode);
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

    // 7. Write Postfix
    appendFileSync(outputJavaScript, labTemplate.postfix);
}

function generateLaboratoryInformation(information: LaboratoryInformation | undefined, node: CompositeGeneratorNode) {
    const extracted = extractLaboratoryInformation(information);
    node.append(`const appTitle = "${extracted.title}";\n`);
    node.append(`const appDescriptionHtml = html\`${extracted.description}\`;\n`);
}