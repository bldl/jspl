/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import type { NameProvider } from '../references/name-provider.js';
import type { LangiumServices } from '../services.js';
import type { AstNode, GenericAstNode, Reference } from '../syntax-tree.js';
import type { AstNodeLocator } from '../workspace/ast-node-locator.js';
import type { DocumentSegment } from '../workspace/documents.js';
import type { CommentProvider } from '../documentation/comment-provider.js';
export interface JsonSerializeOptions {
    space?: string | number;
    refText?: boolean;
    sourceText?: boolean;
    textRegions?: boolean;
    comments?: boolean;
    replacer?: (key: string, value: unknown, defaultReplacer: (key: string, value: unknown) => unknown) => unknown;
}
/**
 * {@link AstNode}s that may carry information on their definition area within the DSL text.
 */
export interface AstNodeWithTextRegion extends AstNode {
    $sourceText?: string;
    $textRegion?: AstNodeRegionWithAssignments;
}
/**
 * {@link AstNode}s that may carry a semantically relevant comment.
 */
export interface AstNodeWithComment extends AstNode {
    $comment?: string;
}
export declare function isAstNodeWithComment(node: AstNode): node is AstNodeWithComment;
/**
 * A {@DocumentSegment} representing the definition area of an AstNode within the DSL text.
 * Usually contains text region information on all assigned property values of the AstNode,
 * and may contain the defining file's URI as string.
 */
export interface AstNodeRegionWithAssignments extends DocumentSegment {
    /**
     * A record containing an entry for each assignd property of the AstNode.
     * The key is equal to the property name and the value is an array of the property values'
     * text regions, regardless of whether the property is a single value or list property.
     */
    assignments?: Record<string, DocumentSegment[]>;
    /**
     * The AstNode defining file's URI as string
     */
    documentURI?: string;
}
/**
 * Utility service for transforming an `AstNode` into a JSON string and vice versa.
 */
export interface JsonSerializer {
    /**
     * Serialize an `AstNode` into a JSON `string`.
     * @param node The `AstNode` to be serialized.
     * @param space Adds indentation, white space, and line break characters to the return-value JSON text to make it easier to read.
     */
    serialize(node: AstNode, options?: JsonSerializeOptions): string;
    /**
     * Deserialize (parse) a JSON `string` into an `AstNode`.
     */
    deserialize(content: string): AstNode;
}
interface IntermediateReference {
    $refText?: string;
    $ref?: string;
    $error?: string;
}
export declare class DefaultJsonSerializer implements JsonSerializer {
    protected ignoreProperties: Set<string>;
    protected readonly astNodeLocator: AstNodeLocator;
    protected readonly nameProvider: NameProvider;
    protected readonly commentProvider: CommentProvider;
    constructor(services: LangiumServices);
    serialize(node: AstNode, options?: JsonSerializeOptions): string;
    deserialize(content: string): AstNode;
    protected replacer(key: string, value: unknown, { refText, sourceText, textRegions, comments }?: JsonSerializeOptions): unknown;
    protected addAstNodeRegionWithAssignmentsTo(node: AstNodeWithTextRegion): AstNodeWithTextRegion | undefined;
    protected linkNode(node: GenericAstNode, root: AstNode, container?: AstNode, containerProperty?: string, containerIndex?: number): void;
    protected reviveReference(container: AstNode, property: string, root: AstNode, reference: IntermediateReference): Reference | undefined;
    protected getRefNode(root: AstNode, path: string): AstNode;
}
export {};
//# sourceMappingURL=json-serializer.d.ts.map