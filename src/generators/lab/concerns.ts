import { CompositeGeneratorNode } from "langium";
import { Concern } from "../../language/generated/ast.js";
import { ExtractedLaboratoryInformation, formattedStringToHTML } from "../../util/modelUtil.js";


function generateConcernHtml(concern: Concern, default_format: string): string {
    return `<details><summary>⚠ ${concern.summary}</summary>
    ${formattedStringToHTML(concern.description, default_format)}
    </details>`;
}

export function generateConcerns(concerns: Concern[], node: CompositeGeneratorNode, laboratoryInformation: ExtractedLaboratoryInformation) {
    // Create JS-Object with concerns as members and string/html values (see original lab)
    node.append(`const concerns = {\n`);

    concerns.forEach(concern => {
        node.append(`\t${concern.name}: html\`${generateConcernHtml(concern, laboratoryInformation.format)}\`,\n`);
    });

    node.append(`};\n`);
}