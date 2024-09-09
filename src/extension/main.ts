import type { LanguageClientOptions, ServerOptions} from 'vscode-languageclient/node.js';
import { ExtensionContext, commands, window, workspace, Uri } from 'vscode';
import { join as pathJoin, dirname as pathDirname } from 'node:path';
import { LanguageClient, TransportKind } from 'vscode-languageclient/node.js';
import { generateGraphvizAction, generateJSONAction, generateLaboratoryAction, generateOptimizerAction } from '../generators/actions.js';

let client: LanguageClient;

const GENERATE_WEB_PAGE_COMMAND_IDENTIFIER: string = "jspl.generate-webpage";
const GENERATE_GRAPHVIZ_COMMAND_IDENTIFIER: string = "jspl.generate-graphviz";
const GENERATE_JSON_COMMAND_IDENTIFIER: string = "jspl.generate-json";
const GENERATE_OPTIMIZER_COMMAND_IDENTIFIER: string = "jspl.generate-optimizer"

// This function is called when the extension is activated.
export function activate(context: ExtensionContext): void {
    client = startLanguageClient(context);

    commands.registerCommand(
        GENERATE_WEB_PAGE_COMMAND_IDENTIFIER, 
        () => {generateWebpageCommand(context);}
    );

    commands.registerCommand(
        GENERATE_GRAPHVIZ_COMMAND_IDENTIFIER,
        () => {generateGraphvizCommand(context);}
    );

    commands.registerCommand(
        GENERATE_JSON_COMMAND_IDENTIFIER,
        () => {generateJSONCommand(context);}
    );

    commands.registerCommand(
        GENERATE_OPTIMIZER_COMMAND_IDENTIFIER,
        () => {generateOptimizerCommand(context);}
    );
}

// This function is called when the extension is deactivated.
export function deactivate(): Thenable<void> | undefined {
    if (client) {
        return client.stop();
    }
    return undefined;
}

async function generateWebpageCommand(context: ExtensionContext) {
    const currentFilePath: string = window.activeTextEditor?.document.uri.fsPath!;
    const defaultOutputDirectory: string = pathDirname(currentFilePath);
    const laboratoryTemplatePath = context.asAbsolutePath(pathJoin("templates", "laboratory-template"));

    // Let user pick directory
    const selectedUris = await window.showOpenDialog({
        canSelectMany: false,
        title: 'Select Output Directory',
        openLabel: 'Select',
        canSelectFiles: false,
        canSelectFolders: true,
        defaultUri: Uri.file(defaultOutputDirectory)
    });
    if (selectedUris === undefined) {
        window.showErrorMessage("No Directory selected.");
        return;
    }
    const outputDirectoryPath: string = selectedUris[0].fsPath;

    generateLaboratoryAction(
        currentFilePath,
        outputDirectoryPath,
        laboratoryTemplatePath
    ).then((value: string) => {
        // message user that the lab was created successfully
        window.showInformationMessage("Successfully created Laboratory at: " + value);
    }).catch((reason: any) => {
        // message user about error
        window.showErrorMessage("Couldn't create laboratory. " + reason);
    });
}

async function generateGraphvizCommand(context: ExtensionContext) {
    const currentFilePath: string = window.activeTextEditor?.document.uri.fsPath!;
    const defaultOutputFile: string = pathDirname(currentFilePath) + "/graphviz.dot";

    // Let user pick output file
    const selectedUri = await window.showSaveDialog({
        title: 'Save DOT Output',
        saveLabel: 'Save',
        filters: {"DOT": ["dot"]},
        defaultUri: Uri.file(defaultOutputFile)
    });
    if (selectedUri === undefined) {
        window.showErrorMessage("No output file selected.");
        return;
    }
    const outputFilePath = selectedUri.fsPath;

    generateGraphvizAction(
        currentFilePath, 
        outputFilePath
    ).then((value: string) => {
        window.showInformationMessage("Successfully created Graphviz file at: " + value);
    }).catch((reason: any) => {
        // message user about error
        window.showErrorMessage("Couldn't create Graphviz file. " + reason);
    })
}

async function generateJSONCommand(context: ExtensionContext) {
    const currentFilePath: string = window.activeTextEditor?.document.uri.fsPath!;
    const defaultOutputFile: string = pathDirname(currentFilePath) + "/laboratory.json";

    // Let user pick output file
    const selectedUri = await window.showSaveDialog({
        title: 'Select JSON Output',
        saveLabel: 'Save',
        filters: {"JSON": ["json"]},
        defaultUri: Uri.file(defaultOutputFile)
    });
    if (selectedUri === undefined) {
        window.showErrorMessage("No output file selected.");
        return;
    }
    const outputFilePath = selectedUri.fsPath;

    generateJSONAction(
        currentFilePath, 
        outputFilePath
    ).then((value: string) => {
        window.showInformationMessage("Successfully created JSON file at: " + value);
    }).catch((reason: any) => {
        // message user about error
        window.showErrorMessage("Couldn't create JSON file. " + reason);
    })
}

async function generateOptimizerCommand(context: ExtensionContext) {
    const currentFilePath: string = window.activeTextEditor?.document.uri.fsPath!;
    const defaultOutputDirectory: string = pathDirname(currentFilePath);
    const laboratoryTemplatePath = context.asAbsolutePath(pathJoin("templates", "optimizer-template"));

    // Let user pick directory
    const selectedUris = await window.showOpenDialog({
        canSelectMany: false,
        title: 'Select Output Directory',
        openLabel: 'Select',
        canSelectFiles: false,
        canSelectFolders: true,
        defaultUri: Uri.file(defaultOutputDirectory)
    });
    if (selectedUris === undefined) {
        window.showErrorMessage("No Directory selected.");
        return;
    }
    const outputDirectoryPath: string = selectedUris[0].fsPath;

    generateOptimizerAction(
        currentFilePath,
        outputDirectoryPath,
        laboratoryTemplatePath
    ).then((value: string) => {
        // message user that the lab was created successfully
        window.showInformationMessage("Successfully created Laboratory at: " + value);
    }).catch((reason: any) => {
        // message user about error
        window.showErrorMessage("Couldn't create laboratory. " + reason);
    });
}

function startLanguageClient(context: ExtensionContext): LanguageClient {
    const serverModule = context.asAbsolutePath(pathJoin('out', 'language', 'main.cjs'));
    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging.
    // By setting `process.env.DEBUG_BREAK` to a truthy value, the language server will wait until a debugger is attached.
    const debugOptions = { execArgv: ['--nolazy', `--inspect${process.env.DEBUG_BREAK ? '-brk' : ''}=${process.env.DEBUG_SOCKET || '6009'}`] };

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
    };

    const fileSystemWatcher = workspace.createFileSystemWatcher('**/*.jspl');
    context.subscriptions.push(fileSystemWatcher);

    // Options to control the language client
    const clientOptions: LanguageClientOptions = {
        documentSelector: [{ scheme: 'file', language: 'java-script-propositional-laboratory-format' }],
        synchronize: {
            // Notify the server about file changes to files contained in the workspace
            fileEvents: fileSystemWatcher
        }
    };

    // Create the language client and start the client.
    const client = new LanguageClient(
        'java-script-propositional-laboratory-format',
        'JavaScript Propositional Laboratory Format',
        serverOptions,
        clientOptions
    );

    // Start the client. This will also launch the server
    client.start();
    return client;
}



