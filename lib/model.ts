import { AstNode, EmptyFileSystem, LangiumDocument, LangiumServices, URI } from "langium";

import { type Model } from "./language/generated/ast";
import { createSpecAltFormatServices } from "./language/specalt-format-module";

import { Res } from "./utils";
import { err, ok } from "neverthrow";

export async function extractDocument(
    input: string,
    services: LangiumServices,
): Promise<Res<LangiumDocument<AstNode>>>
{
    const document = services.shared.workspace.LangiumDocumentFactory.fromString(input, URI.file("/tmp/input.spa"));
    await services.shared.workspace.DocumentBuilder.build([document], { validation: true });
    const validationErrors = (document.diagnostics ?? []).filter(e => e.severity === 1);

    if (validationErrors.length > 0)
    {
        return err(validationErrors);
    }

    return ok(document);
}

export async function extractAstNode<T extends AstNode>(input: string, services: LangiumServices): Promise<Res<T>>
{
    const document = await extractDocument(input, services);

    if (document.isErr())
    {
        return err(document.error);
    }

    const { parseResult } = document.value;

    if (!parseResult)
    {
        return err([]);
    }

    return ok(parseResult.value as T);
}

export function extractModel(input: string): Promise<Res<Model>>
{
    return extractAstNode<Model>(input, createSpecAltFormatServices(EmptyFileSystem).SpecAltFormat);
}
