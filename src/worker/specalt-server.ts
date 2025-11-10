/// <reference lib="WebWorker" />

import { EmptyFileSystem } from "langium";
import { type DefaultSharedModuleContext, startLanguageServer } from "langium";
import { BrowserMessageReader, BrowserMessageWriter, createConnection } from "vscode-languageserver/browser.js";

import { createSpecAltFormatServices } from "../../lib/language/specalt-format-module";

const messageReader = new BrowserMessageReader(self as DedicatedWorkerGlobalScope);
const messageWriter = new BrowserMessageWriter(self as DedicatedWorkerGlobalScope);

const context = {
    connection: createConnection(messageReader, messageWriter),
    ...EmptyFileSystem,
} as unknown as DefaultSharedModuleContext;

const { shared } = createSpecAltFormatServices(context);

startLanguageServer(shared);
