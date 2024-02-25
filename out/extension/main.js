import * as vscode from 'vscode';
import * as path from 'node:path';
import { LanguageClient, TransportKind } from 'vscode-languageclient/node.js';
import { generateGraphvizAction, generateLaboratoryAction } from '../cli/actions.js';
let client;
const GENERATE_WEB_PAGE_COMMAND_IDENTIFIER = "jspl.generate-webpage";
const GENERATE_GRAPHVIZ_COMMAND_IDENTIFIER = "jspl.generate-graphviz";
const GENERATE_JSON_COMMAND_IDENTIFIER = "jspl.generate-json";
const DIRECTORY_PICKER_DIALOG_OPTIONS = {
    canSelectMany: false,
    title: 'Select Output Directory',
    openLabel: 'Select',
    canSelectFiles: false,
    canSelectFolders: true
};
// This function is called when the extension is activated.
export function activate(context) {
    client = startLanguageClient(context);
    vscode.commands.registerCommand(GENERATE_WEB_PAGE_COMMAND_IDENTIFIER, () => { generateWebpageCommand(context); });
    vscode.commands.registerCommand(GENERATE_GRAPHVIZ_COMMAND_IDENTIFIER, () => { generateGraphvizCommand(context); });
    vscode.commands.registerCommand(GENERATE_JSON_COMMAND_IDENTIFIER, () => { generateJSONCommand(context); });
}
// This function is called when the extension is deactivated.
export function deactivate() {
    if (client) {
        return client.stop();
    }
    return undefined;
}
async function generateWebpageCommand(context) {
    var _a;
    const currentFilePath = (_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document.uri.fsPath;
    const laboratoryTemplatePath = context.asAbsolutePath(path.join("templates", "laboratory-template"));
    // Let user pick directory
    const selectedUris = await vscode.window.showOpenDialog(DIRECTORY_PICKER_DIALOG_OPTIONS);
    if (selectedUris === undefined) {
        vscode.window.showErrorMessage("No Directory selected.");
        return;
    }
    const outputDirectoryPath = selectedUris[0].fsPath;
    generateLaboratoryAction(currentFilePath, outputDirectoryPath, laboratoryTemplatePath).then((value) => {
        // message user that the lab was created successfully
        vscode.window.showInformationMessage("Successfully created Laboratory at: " + value);
    }).catch((reason) => {
        // message user about error
        vscode.window.showErrorMessage("Couldn't create laboratory. Reason: " + reason);
    });
}
async function generateGraphvizCommand(context) {
    var _a;
    const currentFilePath = (_a = vscode.window.activeTextEditor) === null || _a === void 0 ? void 0 : _a.document.uri.fsPath;
    const outputFilePath = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, "graphviz.dot");
    generateGraphvizAction(currentFilePath, outputFilePath); // TODO: messages
}
async function generateJSONCommand(context) {
    //const currentFilePath = vscode.window.activeTextEditor?.document.uri.fsPath!;
    // TODO: 
}
function startLanguageClient(context) {
    const serverModule = context.asAbsolutePath(path.join('out', 'language', 'main.cjs'));
    // The debug options for the server
    // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging.
    // By setting `process.env.DEBUG_BREAK` to a truthy value, the language server will wait until a debugger is attached.
    const debugOptions = { execArgv: ['--nolazy', `--inspect${process.env.DEBUG_BREAK ? '-brk' : ''}=${process.env.DEBUG_SOCKET || '6009'}`] };
    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    const serverOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
    };
    const fileSystemWatcher = vscode.workspace.createFileSystemWatcher('**/*.jspl');
    context.subscriptions.push(fileSystemWatcher);
    // Options to control the language client
    const clientOptions = {
        documentSelector: [{ scheme: 'file', language: 'java-script-propositional-laboratory-format' }],
        synchronize: {
            // Notify the server about file changes to files contained in the workspace
            fileEvents: fileSystemWatcher
        }
    };
    // Create the language client and start the client.
    const client = new LanguageClient('java-script-propositional-laboratory-format', 'JavaScript Propositional Laboratory Format', serverOptions, clientOptions);
    // Start the client. This will also launch the server
    client.start();
    return client;
}
//# sourceMappingURL=main.js.map