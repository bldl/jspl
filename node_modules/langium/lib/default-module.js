/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
******************************************************************************/
import { TextDocuments } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { createGrammarConfig } from './grammar/grammar-config.js';
import { createCompletionParser } from './parser/completion-parser-builder.js';
import { DefaultCompletionProvider } from './lsp/completion/completion-provider.js';
import { DefaultDocumentHighlightProvider } from './lsp/document-highlight-provider.js';
import { DefaultDocumentSymbolProvider } from './lsp/document-symbol-provider.js';
import { DefaultFoldingRangeProvider } from './lsp/folding-range-provider.js';
import { DefaultFuzzyMatcher } from './lsp/fuzzy-matcher.js';
import { DefaultDefinitionProvider } from './lsp/definition-provider.js';
import { MultilineCommentHoverProvider } from './lsp/hover-provider.js';
import { DefaultLanguageServer } from './lsp/language-server.js';
import { DefaultNodeKindProvider } from './lsp/node-kind-provider.js';
import { DefaultReferencesProvider } from './lsp/references-provider.js';
import { DefaultRenameProvider } from './lsp/rename-provider.js';
import { DefaultWorkspaceSymbolProvider } from './lsp/workspace-symbol-provider.js';
import { createLangiumParser } from './parser/langium-parser-builder.js';
import { DefaultTokenBuilder } from './parser/token-builder.js';
import { DefaultValueConverter } from './parser/value-converter.js';
import { DefaultLinker } from './references/linker.js';
import { DefaultNameProvider } from './references/name-provider.js';
import { DefaultReferences } from './references/references.js';
import { DefaultScopeComputation } from './references/scope-computation.js';
import { DefaultScopeProvider } from './references/scope-provider.js';
import { DefaultJsonSerializer } from './serializer/json-serializer.js';
import { DefaultServiceRegistry } from './service-registry.js';
import { MutexLock } from './utils/promise-util.js';
import { DefaultDocumentValidator } from './validation/document-validator.js';
import { ValidationRegistry } from './validation/validation-registry.js';
import { DefaultAstNodeDescriptionProvider, DefaultReferenceDescriptionProvider } from './workspace/ast-descriptions.js';
import { DefaultAstNodeLocator } from './workspace/ast-node-locator.js';
import { DefaultConfigurationProvider } from './workspace/configuration.js';
import { DefaultDocumentBuilder } from './workspace/document-builder.js';
import { DefaultLangiumDocumentFactory, DefaultLangiumDocuments } from './workspace/documents.js';
import { DefaultIndexManager } from './workspace/index-manager.js';
import { DefaultWorkspaceManager } from './workspace/workspace-manager.js';
import { DefaultLexer } from './parser/lexer.js';
import { JSDocDocumentationProvider } from './documentation/documentation-provider.js';
import { DefaultCommentProvider } from './documentation/comment-provider.js';
import { LangiumParserErrorMessageProvider } from './parser/langium-parser.js';
/**
 * Create a dependency injection module for the default language-specific services. This is a
 * set of services that are used by exactly one language.
 */
export function createDefaultModule(context) {
    return {
        documentation: {
            CommentProvider: (services) => new DefaultCommentProvider(services),
            DocumentationProvider: (services) => new JSDocDocumentationProvider(services)
        },
        parser: {
            GrammarConfig: (services) => createGrammarConfig(services),
            LangiumParser: (services) => createLangiumParser(services),
            CompletionParser: (services) => createCompletionParser(services),
            ValueConverter: () => new DefaultValueConverter(),
            TokenBuilder: () => new DefaultTokenBuilder(),
            Lexer: (services) => new DefaultLexer(services),
            ParserErrorMessageProvider: () => new LangiumParserErrorMessageProvider()
        },
        lsp: {
            CompletionProvider: (services) => new DefaultCompletionProvider(services),
            DocumentSymbolProvider: (services) => new DefaultDocumentSymbolProvider(services),
            HoverProvider: (services) => new MultilineCommentHoverProvider(services),
            FoldingRangeProvider: (services) => new DefaultFoldingRangeProvider(services),
            ReferencesProvider: (services) => new DefaultReferencesProvider(services),
            DefinitionProvider: (services) => new DefaultDefinitionProvider(services),
            DocumentHighlightProvider: (services) => new DefaultDocumentHighlightProvider(services),
            RenameProvider: (services) => new DefaultRenameProvider(services)
        },
        workspace: {
            AstNodeLocator: () => new DefaultAstNodeLocator(),
            AstNodeDescriptionProvider: (services) => new DefaultAstNodeDescriptionProvider(services),
            ReferenceDescriptionProvider: (services) => new DefaultReferenceDescriptionProvider(services)
        },
        references: {
            Linker: (services) => new DefaultLinker(services),
            NameProvider: () => new DefaultNameProvider(),
            ScopeProvider: (services) => new DefaultScopeProvider(services),
            ScopeComputation: (services) => new DefaultScopeComputation(services),
            References: (services) => new DefaultReferences(services)
        },
        serializer: {
            JsonSerializer: (services) => new DefaultJsonSerializer(services)
        },
        validation: {
            DocumentValidator: (services) => new DefaultDocumentValidator(services),
            ValidationRegistry: (services) => new ValidationRegistry(services)
        },
        shared: () => context.shared
    };
}
/**
 * Create a dependency injection module for the default shared services. This is the set of
 * services that are shared between multiple languages.
 */
export function createDefaultSharedModule(context) {
    return {
        ServiceRegistry: () => new DefaultServiceRegistry(),
        lsp: {
            Connection: () => context.connection,
            LanguageServer: (services) => new DefaultLanguageServer(services),
            WorkspaceSymbolProvider: (services) => new DefaultWorkspaceSymbolProvider(services),
            NodeKindProvider: () => new DefaultNodeKindProvider(),
            FuzzyMatcher: () => new DefaultFuzzyMatcher()
        },
        workspace: {
            LangiumDocuments: (services) => new DefaultLangiumDocuments(services),
            LangiumDocumentFactory: (services) => new DefaultLangiumDocumentFactory(services),
            DocumentBuilder: (services) => new DefaultDocumentBuilder(services),
            TextDocuments: () => new TextDocuments(TextDocument),
            IndexManager: (services) => new DefaultIndexManager(services),
            WorkspaceManager: (services) => new DefaultWorkspaceManager(services),
            FileSystemProvider: (services) => context.fileSystemProvider(services),
            MutexLock: () => new MutexLock(),
            ConfigurationProvider: (services) => new DefaultConfigurationProvider(services)
        }
    };
}
//# sourceMappingURL=default-module.js.map