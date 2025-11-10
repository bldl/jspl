import { CstNode, DefaultValueConverter } from "langium";

export class SpecAltValueConverter extends DefaultValueConverter
{
    convert(input: string, cstNode: CstNode)
    {
        const rtn = super.convert(input, cstNode);

        // Trim (multiline) strings to ensure proper Markdown formatting
        if (typeof rtn === "string")
        {
            return rtn.split("\n").map(item => item.trimStart()).join("\n");
        }

        return rtn;
    }
}
