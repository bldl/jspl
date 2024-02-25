/******************************************************************************
 * Copyright 2022 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
export class EmptyFileSystemProvider {
    readFile() {
        throw new Error('Method not implemented.');
    }
    readFileSync() {
        throw new Error('Method not implemented.');
    }
    async readDirectory() {
        return [];
    }
}
export const EmptyFileSystem = {
    fileSystemProvider: () => new EmptyFileSystemProvider()
};
//# sourceMappingURL=file-system-provider.js.map