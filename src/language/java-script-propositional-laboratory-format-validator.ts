import type { ValidationAcceptor, ValidationChecks } from 'langium';
//import type { JavaScriptPropositionalLaboratoryFormatAstType, Person } from './generated/ast.js';
import { type JavaScriptPropositionalLaboratoryFormatAstType, Proposition, Model} from './generated/ast.js';
import type { JavaScriptPropositionalLaboratoryFormatServices } from './java-script-propositional-laboratory-format-module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: JavaScriptPropositionalLaboratoryFormatServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.JavaScriptPropositionalLaboratoryFormatValidator;
    const checks: ValidationChecks<JavaScriptPropositionalLaboratoryFormatAstType> = {
        Model: [
            validator.uniqueConcernIdentifiers, 
            validator.uniqueReferenceableIdentifiers
        ],
        Proposition: validator.propositionHasExactlyOneDefaultOrJustOneValue
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class JavaScriptPropositionalLaboratoryFormatValidator {

    uniqueConcernIdentifiers(model: Model, accept: ValidationAcceptor): void {
        // create a set of visited functions
        // and report an error when we see one we've already seen
        const reported = new Set();
        model.concerns.forEach(conern => {
            if (reported.has(conern.name)) {
                accept('error',  `Concern has non-unique name '${conern.name}'.`,  {node: conern, property: 'name'});
            }
            reported.add(conern.name);
        });
    }

    uniqueReferenceableIdentifiers(model: Model, accept: ValidationAcceptor): void {
        // create a set of visited functions
        // and report an error when we see one we've already seen
        const reported = new Map();
        model.conditions.forEach(condition => {
            if (reported.has(condition.name)) {
                // show error on current conditional
                accept(
                    'error',  
                    `Condition has non-unique name '${condition.name}'. All names of Propositions and Conditions must be uniqued, to be properly referenced.`,  
                    {node: condition, property: 'name'}
                );
                // show error on original referenceable
                let original = reported.get(condition.name);
                accept(
                    'error',  
                    `Object has non-unique name '${original.name}'. All names of Propositions and Conditions must be uniqued, to be properly referenced.`,  
                    {node: original, property: 'name'}
                );
            }
            reported.set(condition.name, condition);
        });
        model.propositions.forEach(proposition => {
            if (reported.has(proposition.name)) {
                // show error on current proposition
                accept(
                    'error',  
                    `Proposition has non-unique name '${proposition.name}'. All names of Propositions and Conditions must be uniqued, to be properly referenced.`,  
                    {node: proposition, property: 'name'}
                );
                // show error on original referenceable
                let original = reported.get(proposition.name);
                accept(
                    'error',  
                    `Object has non-unique name '${original.name}'. All names of Propositions and Conditions must be uniqued, to be properly referenced.`,  
                    {node: original, property: 'name'}
                );
            }
            reported.set(proposition.name, proposition);
        });
    }

    propositionHasExactlyOneDefaultOrJustOneValue(proposition: Proposition, accept: ValidationAcceptor): void {
        // allow for singular value, that will be assumed default
        if (proposition.valueClauses.length == 1 && !proposition.valueClauses[0].default) {
            accept(
                'info', 
                `Singleton value ${proposition.valueClauses[0].value} of proposition ${proposition.name} will be assumed to be default value.`, 
                {node: proposition.valueClauses[0], property: 'default'}
            );
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
                accept('error', `Proposition has multiple default values.`, {node: valueDescription, property: 'default'});
                return;
            }
        });
        if (!foundDefault) {
            accept('error', `Proposition has no default value.`, {node: proposition, property: 'name'})
            return;
        }
    }
}
