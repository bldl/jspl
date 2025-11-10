import * as vscode from "vscode";

import { LanguageClientConfig } from "monaco-languageclient/lcwrapper";
import { MonacoVscodeApiConfig } from "monaco-languageclient/vscodeApiWrapper";
import { configureDefaultWorkerFactory } from "monaco-languageclient/workerFactory";
import { BrowserMessageReader, BrowserMessageWriter } from "vscode-languageserver/browser";

import {
    type IFileWriteOptions,
    InMemoryFileSystemProvider,
    registerFileSystemOverlay,
} from "@codingame/monaco-vscode-files-service-override";

import workerUrl from "../worker/specalt-server?worker&url";
import langiumConfig from "../../config/langium.json?raw";
import langiumGrammar from "../../syntaxes/specalt-format.tmLanguage.json?raw";

const extensionFilesOrContents = new Map<string, string>(
    [
        ["/workspace/langium-grammar.json", langiumGrammar],
        ["/workspace/langium-configuration.json", langiumConfig],
    ],
);

export const vscodeConfig: MonacoVscodeApiConfig = {
    $type: "extended",
    viewsConfig: {
        $type: "EditorService",
    },
    userConfiguration: {
        json: JSON.stringify({
            "workbench.colorTheme": "Default Dark Modern",
            "editor.minimap.enabled": false,
        }),
    },
    extensions: [{
        config: {
            name: "SpecAlt",
            publisher: "bldl",
            version: "1.0.0",
            engines: {
                vscode: "*",
            },
            contributes: {
                languages: [{
                    id: "specalt",
                    extensions: [".spa"],
                    configuration: "/workspace/langium-configuration.json",
                }],
                grammars: [{
                    language: "specalt",
                    scopeName: "source.specalt",
                    path: "/workspace/langium-grammar.json",
                }],
            },
        },
        filesOrContents: extensionFilesOrContents,
    }],
    monacoWorkerFactory: configureDefaultWorkerFactory,
};

export async function initMonaco()
{
    const fs = new InMemoryFileSystemProvider();
    const encoder = new TextEncoder();

    const options: IFileWriteOptions = {
        atomic: false,
        unlock: false,
        create: true,
        overwrite: true,
    };

    await fs.mkdir(vscode.Uri.file("/workspace"));

    for (const [path, content] of extensionFilesOrContents.entries())
    {
        await fs.writeFile(vscode.Uri.file(path), encoder.encode(content), options);
    }

    registerFileSystemOverlay(1, fs);

    const worker = new Worker(workerUrl, { type: "module", name: "spals" });

    const languageClientConfig: LanguageClientConfig = {
        languageId: "specalt",
        clientOptions: {
            documentSelector: ["specalt"],
        },
        connection: {
            options: {
                $type: "WorkerDirect",
                worker,
            },
            messageTransports: {
                reader: new BrowserMessageReader(worker),
                writer: new BrowserMessageWriter(worker),
            },
        },
    };

    return languageClientConfig;
}
