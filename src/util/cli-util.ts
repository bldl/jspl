import type { AstNode, LangiumDocument, LangiumServices } from 'langium';
import chalk from 'chalk';
import {basename as pathBasename, extname as pathExtname, resolve as pathResolve, join as pathJoin, dirname as pathDirname} from 'node:path';
import * as fs from 'node:fs';
import { URI } from 'langium';
import { JavaScriptPropositionalLaboratoryFormatLanguageMetaData } from '../language/generated/module.js';

export function getInputExtensionsAsSet(): Set<string> {
    return new Set(JavaScriptPropositionalLaboratoryFormatLanguageMetaData.fileExtensions);
}

export function getInputExtensionsAsString(): string {
    return JavaScriptPropositionalLaboratoryFormatLanguageMetaData.fileExtensions.join(', ');
}

export async function extractDocument(fileName: string, services: LangiumServices): Promise<LangiumDocument> {
    const extensions = services.LanguageMetaData.fileExtensions;
    if (!extensions.includes(pathExtname(fileName))) {
        console.error(chalk.yellow(`Please choose a file with one of these extensions: ${extensions}.`));
        process.exit(1);
    }

    if (!fs.existsSync(fileName)) {
        console.error(chalk.red(`File ${fileName} does not exist.`));
        process.exit(1);
    }

    const document = services.shared.workspace.LangiumDocuments.getOrCreateDocument(URI.file(pathResolve(fileName)));
    await services.shared.workspace.DocumentBuilder.build([document], { validation: true });

    const validationErrors = (document.diagnostics ?? []).filter(e => e.severity === 1);
    if (validationErrors.length > 0) {
        console.error(chalk.red('There are validation errors:'));
        for (const validationError of validationErrors) {
            console.error(chalk.red(
                `line ${validationError.range.start.line + 1}: ${validationError.message} [${document.textDocument.getText(validationError.range)}]`
            ));
        }
        process.exit(1);
    }

    return document;
}

export async function extractAstNode<T extends AstNode>(fileName: string, services: LangiumServices): Promise<T> {
    return (await extractDocument(fileName, services)).parseResult?.value as T;
}

interface FilePathData {
    destination: string,
    name: string
}

export function extractDestinationAndName(filePath: string, destination: string | undefined): FilePathData {
    filePath = pathBasename(filePath, pathExtname(filePath)).replace(/[.-]/g, '');
    return {
        destination: destination ?? pathJoin(pathDirname(filePath), 'generated'),
        name: pathBasename(filePath)
    };
}
