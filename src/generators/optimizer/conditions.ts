import { CompositeGeneratorNode } from "langium";
import { Condition } from "../../language/generated/ast.js";
import { extractJSCondition } from "./util.js";

export function generateConditions(conditions: Condition[], node: CompositeGeneratorNode) {
    node.append(`const conditions = {\n`);

    conditions.forEach(condition => {
        node.append(`\t${condition.name}: (get) => {\n`);
        node.append(`\t\treturn ${extractJSCondition.fromExpression(condition.condition.expression)};\n`);
        node.append(`\t},\n`);
    });

    node.append(`};\n`);
}
