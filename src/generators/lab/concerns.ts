import { CompositeGeneratorNode } from "langium";
import { Concern } from "../../language/generated/ast.js";
import { formattedStringToHTML } from "./util.js";


function generateConcernHtml(concern: Concern): string {
    return `<details><summary>⚠ ${concern.summary}</summary>
    ${formattedStringToHTML(concern.description)}
    </details>`;
}

export function generateConcerns(concerns: Concern[], node: CompositeGeneratorNode) {
    // Create JS-Object with concerns as members and string/html values (see original lab)
    node.append(`const concerns = {\n`);

    concerns.forEach(concern => {
        node.append(`\t${concern.name}: html\`${generateConcernHtml(concern)}\`,\n`);
        //node.append(`\t${concern.name}DescriptionUnprocessed: \`${concern.description.contents}\`,\n`);
        //node.append(`\t${concern.name}DescriptionPreprocessed: \`${dedent(concern.description.contents)}\`,\n`);
        //node.append(`\t${concern.name}DescriptionProcessed: \`${formattedStringToHTML(concern.description)}\`,\n`);
    });

    node.append(`};\n`);
}