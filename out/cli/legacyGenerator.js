import * as fs from 'node:fs';
import { CompositeGeneratorNode, toString } from 'langium';
export function generateLegacyJavaScript(model, filePath, destination) {
    const generatedFilePath = destination;
    const fileNode = new CompositeGeneratorNode();
    writeConcerns(model.concerns, fileNode);
    writePropositions(model.propositions, fileNode);
    fs.writeFileSync(generatedFilePath, toString(fileNode));
    return generatedFilePath;
}
function writeConcerns(concerns, file) {
    file.append("const concerns = {").appendNewLine();
    concerns.forEach(concern => {
        file.append(`${concern.name}: {`).appendNewLine();
        file.append(`\tsummary: \`${concern.summary}\`,`).appendNewLine();
        file.append(`\tdescription: \`${concern.description}\``).appendNewLine();
        file.append("},").appendNewLine();
    });
    file.append("}").appendNewLine();
}
function writePropositions(propositions, file) {
}
//# sourceMappingURL=legacyGenerator.js.map