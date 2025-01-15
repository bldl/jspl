/**
 * @typedef {Object} OptimizerInput
 * @property {string} objective 
 * @property {Array<string>} variables
 * @property {Array<string>} constraints
 */


/**
 * @typedef {Object} VariableMeaningMap
 * @property {Map<string, string>} concerns mapping concern ids to variable names
 * @property {Map<string, Object>} propositions maps proposition ids to objects with fields for every possible value with their variable 
 */

/**
 * @typedef {Object} ReversibleOptimizerInput
 * @property {OptimizerInput} optimizerInput
 * @property {VariableMeaningMap} variableMeaningMap
 */

/**
 * 
 * @param {string} variablePrefix 
 * @param {Generator<integer, void, undefined>} indexGenerator 
 * @yields {string} the next variable name
 */
function* indexedVariableNameGenerator(variablePrefix, indexGenerator) {
    for (const index of indexGenerator) {
        yield variablePrefix + index;
    }
    return;
}

/**
 * 
 * @param {integer} start 
 * @param {integer} step 
 * @yields {integer}
 */
function* infiniteRangeGenerator(start, step=1) {
    let index = start;
    while (true) {
        yield index;
        index += step;
    }
}

/**
 * @param {OptimizerInput} input 
 * @param {string} variablePrefix 
 * @yields {string}
 */
function* standardVariableGenerator(input, variablePrefix) {
    let varGen = indexedVariableNameGenerator(variablePrefix, infiniteRangeGenerator(1, 1));

    for (const variable of varGen) {
        input.variables.push(variable);
        yield variable;
    }
}

/**
 * @param {Map<string, number>} weights
 * @param {Array<Object>} tweakables  
 * @param {Object} raiseConditions 
 * @returns {ReversibleOptimizerInput} 
 */
export function constructOptimizerInput(tweakables, raiseConditions, weights) {
    let input = {
        objective: "",
        variables: [],
        constraints: []
    }

    let map = {
        concerns: new Map(),
        propositions: new Map()
    }

    extractBasePropositionValues(input, map, tweakables);
    extractRaiseVariables(input, map, weights);
    constructConstraintsForTweakableValues(input, map, tweakables);
    constructConstraintsForAllRaises(input, map, raiseConditions);
    constructObjectiveFunction(input, map, weights);

    return {
        optimizerInput: input,
        variableMeaningMap: map
    };
}


/**
 * 
 * @param {OptimizerInput} input 
 * @param {VariableMeaningMap} map 
 * @param {Map<string, number>} weights 
 */
function extractRaiseVariables(input, map, weights) {
    let varGen = standardVariableGenerator(input, 'r');

    weights.forEach((value, key) => {
        let variableName = varGen.next().value;

        map.concerns.set(key, variableName);
    })
}

/**
 * 
 * @param {OptimizerInput} input 
 * @param {VariableMeaningMap} map 
 * @param {Map<string, number>} weights 
 */
function constructObjectiveFunction(input, map, weights) {
    input.objective = Array.from(weights.keys()).map((key) => {
        if (weights.get(key) === 1) return map.concerns.get(key);

        return `${weights.get(key)}*${map.concerns.get(key)}`;
    }).join("+");
}

/**
 * 
 * @param {OptimizerInput} input 
 * @param {VariableMeaningMap} map 
 * @param {Array<Object>} tweakables 
 */
function extractBasePropositionValues(input, map, tweakables) {
    let varGen = standardVariableGenerator(input, 'x');

    tweakables.forEach((tweakable) => {
        let valueVariables = {};
        tweakable.output.forEach((value) => {
            let variableName = varGen.next().value;

            valueVariables[value] = variableName;
        });
        map.propositions.set(tweakable.name, valueVariables);
    });
}

/**
 * 
 * @param {OptimizerInput} input 
 * @param {VariableMeaningMap} map 
 * @param {Array<Object>} tweakables 
 */
function constructConstraintsForTweakableValues(input, map, tweakables) {
    tweakables.forEach((tweakable) => {
        let sum = Object.keys(map.propositions.get(tweakable.name))
        .map((value) => map.propositions.get(tweakable.name)[value])
        .join("+");

        input.constraints.push(sum + " == 1");
    });
}

/**
 * 
 * @param {OptimizerInput} input 
 * @param {VariableMeaningMap} map 
 * @param {Object} raiseConditions 
 */
function constructConstraintsForAllRaises(input, map, raiseConditions) {
    let varGen = standardVariableGenerator(input, 'z');

    Object.keys(raiseConditions).forEach((concernName) => {
        let finalVariable = constructRaiseConstraints(input, map, raiseConditions[concernName], varGen);

        // This final constraint connects the raise variable r_i to the final variable z_j
        // TODO: Remove unnecessary final variable and connect directly to raise variable
        let raiseVariable = map.concerns.get(concernName);

        input.constraints.push(`${finalVariable}-${raiseVariable} == 0`);
    });
}

/**
 * 
 * @param {OptimizerInput} input 
 * @param {VariableMeaningMap} map 
 * @param {Object} condition 
 * @param {Generator<string, void, undefined>} varGen 
 * @returns {string} the variable that represents the truth value of the condition
 */
function constructRaiseConstraints(input, map, condition, varGen) {
    switch (condition.type) {
        case "or": {
                let z = varGen.next().value;
                let a = constructRaiseConstraints(input, map, condition.left, varGen);
                let b = constructRaiseConstraints(input, map, condition.right, varGen);

                input.constraints.push(`${z}-${a}-${b} <= 0`);
                input.constraints.push(`${a}-${z} <= 0`);
                input.constraints.push(`${b}-${z} <= 0`);

                return z;
            }
        case "and": {
                let z = varGen.next().value;
                let a = constructRaiseConstraints(input, map, condition.left, varGen);
                let b = constructRaiseConstraints(input, map, condition.right, varGen);

                input.constraints.push(`${a}+${b}-${z} <= 1`);
                input.constraints.push(`${z}-${a} <= 0`);
                input.constraints.push(`${z}-${b} <= 0`);

                return z;
            }
        case "not": {
                let z = varGen.next().value;
                let a = constructRaiseConstraints(input, map, condition.inner, varGen);

                input.constraints.push(`-${a}-${z} <= -1`);
                input.constraints.push(`${a}+${z} <= 1`);

                return z;
            }
        case "statement": {
                return map.propositions.get(condition.proposition)[condition.value];
            }
    }
}