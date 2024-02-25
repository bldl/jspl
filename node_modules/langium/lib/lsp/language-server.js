/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import { Emitter, FileChangeType, LSPErrorCodes, ResponseError, TextDocumentSyncKind } from 'vscode-languageserver';
import { eagerLoad } from '../dependency-injection.js';
import { isOperationCancelled } from '../utils/promise-util.js';
import { DocumentState } from '../workspace/documents.js';
import { mergeCompletionProviderOptions } from './completion/completion-provider.js';
import { DefaultSemanticTokenOptions } from './semantic-token-provider.js';
import { mergeSignatureHelpOptions } from './signature-help-provider.js';
import { URI } from '../utils/uri-util.js';
export class DefaultLanguageServer {
    constructor(services) {
        this.onInitializeEmitter = new Emitter();
        this.onInitializedEmitter = new Emitter();
        this.services = services;
    }
    get onInitialize() {
        return this.onInitializeEmitter.event;
    }
    get onInitialized() {
        return this.onInitializedEmitter.event;
    }
    async initialize(params) {
        this.eagerLoadServices();
        this.onInitializeEmitter.fire(params);
        this.onInitializeEmitter.dispose();
        return this.buildInitializeResult(params);
    }
    /**
     * Eagerly loads all services before emitting the `onInitialize` event.
     * Ensures that all services are able to catch the event.
     */
    eagerLoadServices() {
        eagerLoad(this.services);
        this.services.ServiceRegistry.all.forEach(language => eagerLoad(language));
    }
    hasService(callback) {
        return this.services.ServiceRegistry.all.some(language => callback(language) !== undefined);
    }
    buildInitializeResult(_params) {
        var _a;
        const languages = this.services.ServiceRegistry.all;
        const hasFormattingService = this.hasService(e => e.lsp.Formatter);
        const formattingOnTypeOptions = languages.map(e => { var _a; return (_a = e.lsp.Formatter) === null || _a === void 0 ? void 0 : _a.formatOnTypeOptions; }).find(e => Boolean(e));
        const hasCodeActionProvider = this.hasService(e => e.lsp.CodeActionProvider);
        const hasSemanticTokensProvider = this.hasService(e => e.lsp.SemanticTokenProvider);
        const commandNames = (_a = this.services.lsp.ExecuteCommandHandler) === null || _a === void 0 ? void 0 : _a.commands;
        const hasDocumentLinkProvider = this.hasService(e => e.lsp.DocumentLinkProvider);
        const signatureHelpOptions = mergeSignatureHelpOptions(languages.map(e => { var _a; return (_a = e.lsp.SignatureHelp) === null || _a === void 0 ? void 0 : _a.signatureHelpOptions; }));
        const hasGoToTypeProvider = this.hasService(e => e.lsp.TypeProvider);
        const hasGoToImplementationProvider = this.hasService(e => e.lsp.ImplementationProvider);
        const hasCompletionProvider = this.hasService(e => e.lsp.CompletionProvider);
        const completionOptions = mergeCompletionProviderOptions(languages.map(e => { var _a; return (_a = e.lsp.CompletionProvider) === null || _a === void 0 ? void 0 : _a.completionOptions; }));
        const hasReferencesProvider = this.hasService(e => e.lsp.ReferencesProvider);
        const hasDocumentSymbolProvider = this.hasService(e => e.lsp.DocumentSymbolProvider);
        const hasDefinitionProvider = this.hasService(e => e.lsp.DefinitionProvider);
        const hasDocumentHighlightProvider = this.hasService(e => e.lsp.DocumentHighlightProvider);
        const hasFoldingRangeProvider = this.hasService(e => e.lsp.FoldingRangeProvider);
        const hasHoverProvider = this.hasService(e => e.lsp.HoverProvider);
        const hasRenameProvider = this.hasService(e => e.lsp.RenameProvider);
        const hasCallHierarchyProvider = this.hasService(e => e.lsp.CallHierarchyProvider);
        const hasCodeLensProvider = this.hasService(e => e.lsp.CodeLensProvider);
        const hasDeclarationProvider = this.hasService(e => e.lsp.DeclarationProvider);
        const hasInlayHintProvider = this.hasService(e => e.lsp.InlayHintProvider);
        const workspaceSymbolProvider = this.services.lsp.WorkspaceSymbolProvider;
        const result = {
            capabilities: {
                workspace: {
                    workspaceFolders: {
                        supported: true
                    }
                },
                executeCommandProvider: commandNames && {
                    commands: commandNames
                },
                textDocumentSync: TextDocumentSyncKind.Incremental,
                completionProvider: hasCompletionProvider ? completionOptions : undefined,
                referencesProvider: hasReferencesProvider,
                documentSymbolProvider: hasDocumentSymbolProvider,
                definitionProvider: hasDefinitionProvider,
                typeDefinitionProvider: hasGoToTypeProvider,
                documentHighlightProvider: hasDocumentHighlightProvider,
                codeActionProvider: hasCodeActionProvider,
                documentFormattingProvider: hasFormattingService,
                documentRangeFormattingProvider: hasFormattingService,
                documentOnTypeFormattingProvider: formattingOnTypeOptions,
                foldingRangeProvider: hasFoldingRangeProvider,
                hoverProvider: hasHoverProvider,
                renameProvider: hasRenameProvider ? {
                    prepareProvider: true
                } : undefined,
                semanticTokensProvider: hasSemanticTokensProvider
                    ? DefaultSemanticTokenOptions
                    : undefined,
                signatureHelpProvider: signatureHelpOptions,
                implementationProvider: hasGoToImplementationProvider,
                callHierarchyProvider: hasCallHierarchyProvider
                    ? {}
                    : undefined,
                documentLinkProvider: hasDocumentLinkProvider
                    ? { resolveProvider: false }
                    : undefined,
                codeLensProvider: hasCodeLensProvider
                    ? { resolveProvider: false }
                    : undefined,
                declarationProvider: hasDeclarationProvider,
                inlayHintProvider: hasInlayHintProvider
                    ? { resolveProvider: false }
                    : undefined,
                workspaceSymbolProvider: workspaceSymbolProvider
                    ? { resolveProvider: Boolean(workspaceSymbolProvider.resolveSymbol) }
                    : undefined
            }
        };
        return result;
    }
    async initialized(params) {
        this.onInitializedEmitter.fire(params);
        this.onInitializedEmitter.dispose();
    }
}
export function startLanguageServer(services) {
    const connection = services.lsp.Connection;
    if (!connection) {
        throw new Error('Starting a language server requires the languageServer.Connection service to be set.');
    }
    addDocumentsHandler(connection, services);
    addDiagnosticsHandler(connection, services);
    addCompletionHandler(connection, services);
    addFindReferencesHandler(connection, services);
    addDocumentSymbolHandler(connection, services);
    addGotoDefinitionHandler(connection, services);
    addGoToTypeDefinitionHandler(connection, services);
    addGoToImplementationHandler(connection, services);
    addDocumentHighlightsHandler(connection, services);
    addFoldingRangeHandler(connection, services);
    addFormattingHandler(connection, services);
    addCodeActionHandler(connection, services);
    addRenameHandler(connection, services);
    addHoverHandler(connection, services);
    addInlayHintHandler(connection, services);
    addSemanticTokenHandler(connection, services);
    addExecuteCommandHandler(connection, services);
    addSignatureHelpHandler(connection, services);
    addCallHierarchyHandler(connection, services);
    addCodeLensHandler(connection, services);
    addDocumentLinkHandler(connection, services);
    addConfigurationChangeHandler(connection, services);
    addGoToDeclarationHandler(connection, services);
    addWorkspaceSymbolHandler(connection, services);
    connection.onInitialize(params => {
        return services.lsp.LanguageServer.initialize(params);
    });
    connection.onInitialized(params => {
        return services.lsp.LanguageServer.initialized(params);
    });
    // Make the text document manager listen on the connection for open, change and close text document events.
    const documents = services.workspace.TextDocuments;
    documents.listen(connection);
    // Start listening for incoming messages from the client.
    connection.listen();
}
export function addDocumentsHandler(connection, services) {
    const documentBuilder = services.workspace.DocumentBuilder;
    const mutex = services.workspace.MutexLock;
    function onDidChange(changed, deleted) {
        mutex.lock(token => documentBuilder.update(changed, deleted, token));
    }
    const documents = services.workspace.TextDocuments;
    documents.onDidChangeContent(change => {
        onDidChange([URI.parse(change.document.uri)], []);
    });
    connection.onDidChangeWatchedFiles(params => {
        const changedUris = [];
        const deletedUris = [];
        for (const change of params.changes) {
            const uri = URI.parse(change.uri);
            if (change.type === FileChangeType.Deleted) {
                deletedUris.push(uri);
            }
            else {
                changedUris.push(uri);
            }
        }
        onDidChange(changedUris, deletedUris);
    });
}
export function addDiagnosticsHandler(connection, services) {
    const documentBuilder = services.workspace.DocumentBuilder;
    documentBuilder.onBuildPhase(DocumentState.Validated, async (documents, cancelToken) => {
        for (const document of documents) {
            if (document.diagnostics) {
                connection.sendDiagnostics({
                    uri: document.uri.toString(),
                    diagnostics: document.diagnostics
                });
            }
            if (cancelToken.isCancellationRequested) {
                return;
            }
        }
    });
}
export function addCompletionHandler(connection, services) {
    connection.onCompletion(createRequestHandler((services, document, params, cancelToken) => {
        var _a;
        return (_a = services.lsp.CompletionProvider) === null || _a === void 0 ? void 0 : _a.getCompletion(document, params, cancelToken);
    }, services));
}
export function addFindReferencesHandler(connection, services) {
    connection.onReferences(createRequestHandler((services, document, params, cancelToken) => { var _a; return (_a = services.lsp.ReferencesProvider) === null || _a === void 0 ? void 0 : _a.findReferences(document, params, cancelToken); }, services));
}
export function addCodeActionHandler(connection, services) {
    connection.onCodeAction(createRequestHandler((services, document, params, cancelToken) => { var _a; return (_a = services.lsp.CodeActionProvider) === null || _a === void 0 ? void 0 : _a.getCodeActions(document, params, cancelToken); }, services));
}
export function addDocumentSymbolHandler(connection, services) {
    connection.onDocumentSymbol(createRequestHandler((services, document, params, cancelToken) => { var _a; return (_a = services.lsp.DocumentSymbolProvider) === null || _a === void 0 ? void 0 : _a.getSymbols(document, params, cancelToken); }, services));
}
export function addGotoDefinitionHandler(connection, services) {
    connection.onDefinition(createRequestHandler((services, document, params, cancelToken) => { var _a; return (_a = services.lsp.DefinitionProvider) === null || _a === void 0 ? void 0 : _a.getDefinition(document, params, cancelToken); }, services));
}
export function addGoToTypeDefinitionHandler(connection, services) {
    connection.onTypeDefinition(createRequestHandler((services, document, params, cancelToken) => { var _a; return (_a = services.lsp.TypeProvider) === null || _a === void 0 ? void 0 : _a.getTypeDefinition(document, params, cancelToken); }, services));
}
export function addGoToImplementationHandler(connection, services) {
    connection.onImplementation(createRequestHandler((services, document, params, cancelToken) => { var _a; return (_a = services.lsp.ImplementationProvider) === null || _a === void 0 ? void 0 : _a.getImplementation(document, params, cancelToken); }, services));
}
export function addGoToDeclarationHandler(connection, services) {
    connection.onDeclaration(createRequestHandler((services, document, params, cancelToken) => { var _a; return (_a = services.lsp.DeclarationProvider) === null || _a === void 0 ? void 0 : _a.getDeclaration(document, params, cancelToken); }, services));
}
export function addDocumentHighlightsHandler(connection, services) {
    connection.onDocumentHighlight(createRequestHandler((services, document, params, cancelToken) => { var _a; return (_a = services.lsp.DocumentHighlightProvider) === null || _a === void 0 ? void 0 : _a.getDocumentHighlight(document, params, cancelToken); }, services));
}
export function addHoverHandler(connection, services) {
    connection.onHover(createRequestHandler((services, document, params, cancelToken) => { var _a; return (_a = services.lsp.HoverProvider) === null || _a === void 0 ? void 0 : _a.getHoverContent(document, params, cancelToken); }, services));
}
export function addFoldingRangeHandler(connection, services) {
    connection.onFoldingRanges(createRequestHandler((services, document, params, cancelToken) => { var _a; return (_a = services.lsp.FoldingRangeProvider) === null || _a === void 0 ? void 0 : _a.getFoldingRanges(document, params, cancelToken); }, services));
}
export function addFormattingHandler(connection, services) {
    connection.onDocumentFormatting(createRequestHandler((services, document, params, cancelToken) => { var _a; return (_a = services.lsp.Formatter) === null || _a === void 0 ? void 0 : _a.formatDocument(document, params, cancelToken); }, services));
    connection.onDocumentRangeFormatting(createRequestHandler((services, document, params, cancelToken) => { var _a; return (_a = services.lsp.Formatter) === null || _a === void 0 ? void 0 : _a.formatDocumentRange(document, params, cancelToken); }, services));
    connection.onDocumentOnTypeFormatting(createRequestHandler((services, document, params, cancelToken) => { var _a; return (_a = services.lsp.Formatter) === null || _a === void 0 ? void 0 : _a.formatDocumentOnType(document, params, cancelToken); }, services));
}
export function addRenameHandler(connection, services) {
    connection.onRenameRequest(createRequestHandler((services, document, params, cancelToken) => { var _a; return (_a = services.lsp.RenameProvider) === null || _a === void 0 ? void 0 : _a.rename(document, params, cancelToken); }, services));
    connection.onPrepareRename(createRequestHandler((services, document, params, cancelToken) => { var _a; return (_a = services.lsp.RenameProvider) === null || _a === void 0 ? void 0 : _a.prepareRename(document, params, cancelToken); }, services));
}
export function addInlayHintHandler(connection, services) {
    connection.languages.inlayHint.on(createServerRequestHandler((services, document, params, cancelToken) => { var _a; return (_a = services.lsp.InlayHintProvider) === null || _a === void 0 ? void 0 : _a.getInlayHints(document, params, cancelToken); }, services));
}
export function addSemanticTokenHandler(connection, services) {
    // If no semantic token provider is registered that's fine. Just return an empty result
    const emptyResult = { data: [] };
    connection.languages.semanticTokens.on(createServerRequestHandler((services, document, params, cancelToken) => {
        if (services.lsp.SemanticTokenProvider) {
            return services.lsp.SemanticTokenProvider.semanticHighlight(document, params, cancelToken);
        }
        return emptyResult;
    }, services));
    connection.languages.semanticTokens.onDelta(createServerRequestHandler((services, document, params, cancelToken) => {
        if (services.lsp.SemanticTokenProvider) {
            return services.lsp.SemanticTokenProvider.semanticHighlightDelta(document, params, cancelToken);
        }
        return emptyResult;
    }, services));
    connection.languages.semanticTokens.onRange(createServerRequestHandler((services, document, params, cancelToken) => {
        if (services.lsp.SemanticTokenProvider) {
            return services.lsp.SemanticTokenProvider.semanticHighlightRange(document, params, cancelToken);
        }
        return emptyResult;
    }, services));
}
export function addConfigurationChangeHandler(connection, services) {
    connection.onDidChangeConfiguration(change => {
        if (change.settings) {
            services.workspace.ConfigurationProvider.updateConfiguration(change);
        }
    });
}
export function addExecuteCommandHandler(connection, services) {
    const commandHandler = services.lsp.ExecuteCommandHandler;
    if (commandHandler) {
        connection.onExecuteCommand(async (params, token) => {
            var _a;
            try {
                return await commandHandler.executeCommand(params.command, (_a = params.arguments) !== null && _a !== void 0 ? _a : [], token);
            }
            catch (err) {
                return responseError(err);
            }
        });
    }
}
export function addDocumentLinkHandler(connection, services) {
    connection.onDocumentLinks(createServerRequestHandler((services, document, params, cancelToken) => { var _a; return (_a = services.lsp.DocumentLinkProvider) === null || _a === void 0 ? void 0 : _a.getDocumentLinks(document, params, cancelToken); }, services));
}
export function addSignatureHelpHandler(connection, services) {
    connection.onSignatureHelp(createServerRequestHandler((services, document, params, cancelToken) => { var _a; return (_a = services.lsp.SignatureHelp) === null || _a === void 0 ? void 0 : _a.provideSignatureHelp(document, params, cancelToken); }, services));
}
export function addCodeLensHandler(connection, services) {
    connection.onCodeLens(createServerRequestHandler((services, document, params, cancelToken) => { var _a; return (_a = services.lsp.CodeLensProvider) === null || _a === void 0 ? void 0 : _a.provideCodeLens(document, params, cancelToken); }, services));
}
export function addWorkspaceSymbolHandler(connection, services) {
    var _a;
    const workspaceSymbolProvider = services.lsp.WorkspaceSymbolProvider;
    if (workspaceSymbolProvider) {
        connection.onWorkspaceSymbol(async (params, token) => {
            try {
                return await workspaceSymbolProvider.getSymbols(params, token);
            }
            catch (err) {
                return responseError(err);
            }
        });
        const resolveWorkspaceSymbol = (_a = workspaceSymbolProvider.resolveSymbol) === null || _a === void 0 ? void 0 : _a.bind(workspaceSymbolProvider);
        if (resolveWorkspaceSymbol) {
            connection.onWorkspaceSymbolResolve(async (workspaceSymbol, token) => {
                try {
                    return await resolveWorkspaceSymbol(workspaceSymbol, token);
                }
                catch (err) {
                    return responseError(err);
                }
            });
        }
    }
}
export function addCallHierarchyHandler(connection, services) {
    connection.languages.callHierarchy.onPrepare(createServerRequestHandler((services, document, params, cancelToken) => {
        var _a;
        if (services.lsp.CallHierarchyProvider) {
            return (_a = services.lsp.CallHierarchyProvider.prepareCallHierarchy(document, params, cancelToken)) !== null && _a !== void 0 ? _a : null;
        }
        return null;
    }, services));
    connection.languages.callHierarchy.onIncomingCalls(createCallHierarchyRequestHandler((services, params, cancelToken) => {
        var _a;
        if (services.lsp.CallHierarchyProvider) {
            return (_a = services.lsp.CallHierarchyProvider.incomingCalls(params, cancelToken)) !== null && _a !== void 0 ? _a : null;
        }
        return null;
    }, services));
    connection.languages.callHierarchy.onOutgoingCalls(createCallHierarchyRequestHandler((services, params, cancelToken) => {
        var _a;
        if (services.lsp.CallHierarchyProvider) {
            return (_a = services.lsp.CallHierarchyProvider.outgoingCalls(params, cancelToken)) !== null && _a !== void 0 ? _a : null;
        }
        return null;
    }, services));
}
export function createCallHierarchyRequestHandler(serviceCall, sharedServices) {
    const serviceRegistry = sharedServices.ServiceRegistry;
    return async (params, cancelToken) => {
        const uri = URI.parse(params.item.uri);
        const language = serviceRegistry.getServices(uri);
        if (!language) {
            const message = `Could not find service instance for uri: '${uri.toString()}'`;
            console.error(message);
            throw new Error(message);
        }
        try {
            return await serviceCall(language, params, cancelToken);
        }
        catch (err) {
            return responseError(err);
        }
    };
}
export function createServerRequestHandler(serviceCall, sharedServices) {
    const documents = sharedServices.workspace.LangiumDocuments;
    const serviceRegistry = sharedServices.ServiceRegistry;
    return async (params, cancelToken) => {
        const uri = URI.parse(params.textDocument.uri);
        const language = serviceRegistry.getServices(uri);
        if (!language) {
            console.error(`Could not find service instance for uri: '${uri.toString()}'`);
            throw new Error();
        }
        const document = documents.getOrCreateDocument(uri);
        if (!document) {
            throw new Error();
        }
        try {
            return await serviceCall(language, document, params, cancelToken);
        }
        catch (err) {
            return responseError(err);
        }
    };
}
export function createRequestHandler(serviceCall, sharedServices) {
    const documents = sharedServices.workspace.LangiumDocuments;
    const serviceRegistry = sharedServices.ServiceRegistry;
    return async (params, cancelToken) => {
        const uri = URI.parse(params.textDocument.uri);
        const language = serviceRegistry.getServices(uri);
        if (!language) {
            console.error(`Could not find service instance for uri: '${uri.toString()}'`);
            return null;
        }
        const document = documents.getOrCreateDocument(uri);
        if (!document) {
            return null;
        }
        try {
            return await serviceCall(language, document, params, cancelToken);
        }
        catch (err) {
            return responseError(err);
        }
    };
}
function responseError(err) {
    if (isOperationCancelled(err)) {
        return new ResponseError(LSPErrorCodes.RequestCancelled, 'The request has been cancelled.');
    }
    if (err instanceof ResponseError) {
        return err;
    }
    throw err;
}
//# sourceMappingURL=language-server.js.map