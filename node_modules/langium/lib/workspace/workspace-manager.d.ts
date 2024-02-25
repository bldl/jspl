/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import { CancellationToken } from 'vscode-languageserver';
import { URI } from '../utils/uri-util.js';
import type { WorkspaceFolder } from 'vscode-languageserver';
import type { ServiceRegistry } from '../service-registry.js';
import type { LangiumSharedServices } from '../services.js';
import type { MutexLock } from '../utils/promise-util.js';
import type { BuildOptions, DocumentBuilder } from './document-builder.js';
import type { LangiumDocument, LangiumDocuments } from './documents.js';
import type { FileSystemNode, FileSystemProvider } from './file-system-provider.js';
/**
 * The workspace manager is responsible for finding source files in the workspace.
 * This service is shared between all languages of a language server.
 */
export interface WorkspaceManager {
    /** The options used for the initial workspace build. */
    initialBuildOptions: BuildOptions | undefined;
    /**
     * Does the initial indexing of workspace folders.
     * Collects information about exported and referenced AstNodes in
     * each language file and stores it locally.
     *
     * @param folders The set of workspace folders to be indexed.
     */
    initializeWorkspace(folders: WorkspaceFolder[], cancelToken?: CancellationToken): Promise<void>;
}
export declare class DefaultWorkspaceManager implements WorkspaceManager {
    initialBuildOptions: BuildOptions;
    protected readonly serviceRegistry: ServiceRegistry;
    protected readonly langiumDocuments: LangiumDocuments;
    protected readonly documentBuilder: DocumentBuilder;
    protected readonly fileSystemProvider: FileSystemProvider;
    protected readonly mutex: MutexLock;
    protected folders?: WorkspaceFolder[];
    constructor(services: LangiumSharedServices);
    initializeWorkspace(folders: WorkspaceFolder[], cancelToken?: CancellationToken): Promise<void>;
    /**
     * Load all additional documents that shall be visible in the context of the given workspace
     * folders and add them to the collector. This can be used to include built-in libraries of
     * your language, which can be either loaded from provided files or constructed in memory.
     */
    protected loadAdditionalDocuments(_folders: WorkspaceFolder[], _collector: (document: LangiumDocument) => void): Promise<void>;
    /**
     * Determine the root folder of the source documents in the given workspace folder.
     * The default implementation returns the URI of the workspace folder, but you can override
     * this to return a subfolder like `src` instead.
     */
    protected getRootFolder(workspaceFolder: WorkspaceFolder): URI;
    /**
     * Traverse the file system folder identified by the given URI and its subfolders. All
     * contained files that match the file extensions are added to the collector.
     */
    protected traverseFolder(workspaceFolder: WorkspaceFolder, folderPath: URI, fileExtensions: string[], collector: (document: LangiumDocument) => void): Promise<void>;
    /**
     * Determine whether the given folder entry shall be included while indexing the workspace.
     */
    protected includeEntry(workspaceFolder: WorkspaceFolder, entry: FileSystemNode, fileExtensions: string[]): boolean;
}
//# sourceMappingURL=workspace-manager.d.ts.map