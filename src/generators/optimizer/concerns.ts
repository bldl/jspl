import { CompositeGeneratorNode } from "langium";
import { Concern } from "../../language/generated/ast.js";
import { formattedStringToHTML } from "../../util/modelUtil.js";
import { ExtractedWebLaboratoryInformation } from "./util.js";


function generateConcernHtml(concern: Concern, default_format: string): string {
    return `<details><summary>⚠ ${concern.summary}</summary>
    ${formattedStringToHTML(concern.description, default_format)}
    </details>`;
}

export function generateConcerns(concerns: Concern[], node: CompositeGeneratorNode, laboratoryInformation: ExtractedWebLaboratoryInformation) {
    // Create JS-Object with concerns as members and string/html values (see original lab)
    node.append(`export const concerns = {\n`);

    concerns.forEach(concern => {
        node.append(`\t${concern.name}: \`${generateConcernHtml(concern, laboratoryInformation.format)}\`,\n`);
    });

    node.append(`};\n`);
}