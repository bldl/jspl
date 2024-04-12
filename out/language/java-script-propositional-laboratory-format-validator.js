import { getAllUsedConcerns, getAllUsedReferenceables, getReferencablesInWhenCondition } from '../util/modelUtil.js';
/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.JavaScriptPropositionalLaboratoryFormatValidator;
    const checks = {
        Model: [
            validator.uniqueConcernIdentifiers,
            validator.uniqueReferenceableIdentifiers,
            validator.checkForUnusedConcerns,
            validator.checkForUnusedConditions
        ],
        Proposition: [
            validator.propositionHasExactlyOneDefaultOrJustOneValue,
        ],
        Condition: [
            validator.noRecursionInConditions,
        ],
        LaboratoryInformation: [
            validator.noDuplicateFieldsInLaboratoryInformation
        ],
        Statement: [
            validator.statementReferencesValidValue
        ]
    };
    registry.register(checks, validator);
}
/**
 * Implementation of custom validations.
 */
export class JavaScriptPropositionalLaboratoryFormatValidator {
    uniqueConcernIdentifiers(model, accept) {
        // create a set of visited functions
        // and report an error when we see one we've already seen
        const reported = new Set();
        model.concerns.forEach(concern => {
            if (reported.has(concern.name)) {
                accept('error', `Concern has non-unique name '${concern.name}'.`, { node: concern, property: 'name' });
            }
            reported.add(concern.name);
        });
    }
    uniqueReferenceableIdentifiers(model, accept) {
        // create a set of visited functions
        // and report an error when we see one we've already seen
        const reported = new Map();
        model.conditions.forEach(condition => {
            if (reported.has(condition.name)) {
                // show error on current conditional
                accept('error', `Condition has non-unique name '${condition.name}'. All names of Propositions and Conditions must be unique, to be properly referenced.`, { node: condition, property: 'name' });
                // show error on original referenceable
                let original = reported.get(condition.name);
                accept('error', `Object has non-unique name '${original.name}'. All names of Propositions and Conditions must be unique, to be properly referenced.`, { node: original, property: 'name' });
            }
            reported.set(condition.name, condition);
        });
        model.propositions.forEach(proposition => {
            if (reported.has(proposition.name)) {
                // show error on current proposition
                accept('error', `Proposition has non-unique name '${proposition.name}'. All names of Propositions and Conditions must be unique, to be properly referenced.`, { node: proposition, property: 'name' });
                // show error on original referenceable
                let original = reported.get(proposition.name);
                accept('error', `Object has non-unique name '${original.name}'. All names of Propositions and Conditions must be unique, to be properly referenced.`, { node: original, property: 'name' });
            }
            reported.set(proposition.name, proposition);
        });
    }
    checkForUnusedConcerns(model, accept) {
        const usedConcerns = getAllUsedConcerns(model);
        model.concerns.forEach(concern => {
            if (usedConcerns.has(concern))
                return;
            accept('warning', 'Concern is defined, but never used.', { node: concern, property: 'name' });
        });
    }
    checkForUnusedConditions(model, accept) {
        const usedReferenceables = getAllUsedReferenceables(model);
        model.conditions.forEach(condition => {
            if (usedReferenceables.has(condition))
                return;
            accept('warning', 'Condition is defined, but never used.', { node: condition, property: 'name' });
        });
    }
    propositionHasExactlyOneDefaultOrJustOneValue(proposition, accept) {
        // allow for singular value, that will be assumed default
        if (proposition.valueClauses.length == 1 && !proposition.valueClauses[0].default) {
            accept('info', `Singleton value ${proposition.valueClauses[0].value} of proposition ${proposition.name} will be assumed to be default value.`, { node: proposition.valueClauses[0], property: 'default' });
            return;
        }
        let foundDefault = false;
        proposition.valueClauses.forEach(valueDescription => {
            // first Default found
            if (!foundDefault && valueDescription.default) {
                foundDefault = true;
                return;
            }
            if (valueDescription.default) {
                accept('error', `Proposition has multiple default values.`, { node: valueDescription, property: 'default' });
                return;
            }
        });
        if (!foundDefault) {
            accept('error', `Proposition has no default value.`, { node: proposition, property: 'name' });
            return;
        }
    }
    noRecursionInConditions(condition, accept) {
        const name = condition.name;
        const referenceablesInCondition = getReferencablesInWhenCondition(condition.condition);
        referenceablesInCondition.forEach(referenceable => {
            if (referenceable.name === name)
                accept('error', `Recursion is not allowed here.`, { node: condition, property: 'name' });
        });
    }
    noDuplicateFieldsInLaboratoryInformation(information, accept) {
        if (information.descriptions.length > 1)
            accept('error', 'Multiple descriptions for one laboratory are not allowed.', { node: information });
        if (information.titles.length > 1)
            accept('error', 'Multiple titles for one laboratory are not allowed.', { node: information });
        if (information.icons.length > 1)
            accept('error', 'Multiple icons for one laboratory are not allowed.', { node: information });
        if (information.formats.length > 1)
            accept('error', 'Multiple default formats for one laboratory are not allowed.', { node: information });
        if (information.authors.length > 1)
            accept('error', 'Multiple authors for one laboratory are not allowed.', { node: information });
        if (information.versions.length > 1)
            accept('error', 'Multiple versions for one laboratory are not allowed.', { node: information });
    }
    statementReferencesValidValue(statement, accept) {
        if (statement === undefined)
            return;
        if (statement.value === undefined)
            return;
        if (statement.reference === undefined)
            return;
        if (statement.reference.ref === undefined)
            return;
        // Extract referenced referenceable
        const referenceable = statement.reference.ref;
        const value = statement.value;
        if (referenceable.$type === "Condition") {
            if (typeof value !== "boolean")
                return;
            accept('error', 'Stated value is not a valid value of the referenced object.', { node: statement, property: 'value' });
            return;
        }
        // referenceable is a Proposition
        const proposition = referenceable;
        if (proposition.valueClauses === undefined)
            return;
        const foundValue = proposition.valueClauses.map(clause => (clause.value)).find(defined => (defined === value));
        if (foundValue !== undefined)
            return;
        accept('error', 'Stated value is not a valid value of the referenced object.', { node: statement, property: 'value' });
    }
}
//# sourceMappingURL=java-script-propositional-laboratory-format-validator.js.map