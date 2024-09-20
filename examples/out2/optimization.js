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

    // TODO: construct constraints from raise conditions

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
    let index = 1;

    weights.forEach((value, key) => {
        let variableName = `r${index}`;
        index += 1;

        input.variables.push(variableName);
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
    let index = 1;

    tweakables.forEach((tweakable) => {
        let valueVariables = {};
        tweakable.output.forEach((value) => {
            let variableName = `x${index}`;
            index += 1;

            input.variables.push(variableName);
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