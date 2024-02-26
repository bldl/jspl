import { AndExpression, OrExpression, PropositionalExpression, Referenceable, Statement, WhenCondition } from '../language/generated/ast.js';


function getReferenceablesInBinaryExpression(expression: OrExpression | AndExpression, output: Set<Referenceable>): void {
    getReferencablesInExpression(expression.left, output);
    getReferencablesInExpression(expression.right, output);
}

function getReferenceablesInStatement(statement: Statement, output: Set<Referenceable>): void {
    let reference = statement.reference.ref;
    if (reference !== undefined) 
        output.add(reference);
}

function getReferencablesInExpression(expression: PropositionalExpression, output: Set<Referenceable>): void {
    switch (expression.$type) {
        case 'OrExpression': 
            getReferenceablesInBinaryExpression(expression as OrExpression, output);
            break;
        case 'AndExpression': 
            getReferenceablesInBinaryExpression(expression as AndExpression, output);
            break;
        case 'Negation': 
        getReferencablesInExpression(expression.inner, output);
            break;
        case 'Group':
            getReferencablesInExpression(expression.inner, output);
        case 'Statement': 
            getReferenceablesInStatement(expression as Statement, output);
            break;
    }
}

export function getReferencablesInWhenCondition(condition: WhenCondition): Set<Referenceable> {
    let result = new Set<Referenceable>();

    getReferencablesInExpression(condition.expression, result);

    return result;
}