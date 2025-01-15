from pyscipopt import Variable


def constructFactor(input: str, vars_dict: dict[str, Variable]):
    if len(input) == 0:
        return 0

    #print(f"in: {input}, vars: {vars_dict}")
    negative = input.startswith('-')

    if  negative and input[1: len(input)] in vars_dict:
        return vars_dict[input[1: len(input)]] * -1
    if input in vars_dict:
        return vars_dict[input]

    # factor is not a variable => it must be a number
    if '.' in input:
        return float(input)
    return int(input)


def constructTerm(input: str, vars_dict: dict[str, Variable]):
    factors = input.split('*')

    if len(factors) <= 0:
        raise Exception("Term is empty.")

    result = constructFactor(factors[0], vars_dict)

    for i in range(1, len(factors)):
        result = result * constructFactor(factors[i], vars_dict)
    
    return result

    

def constructExpression(input: str, vars_dict: dict[str, Variable]):
    # remove whitespaces
    input = input.replace(' ', '')

    if len(input) <= 0:
        raise Exception("Expression is empty.")

    # prefix every - with a +. This moves the minus into the term and lets us split by just +
    input = input.replace('-', '+-')

    terms = input.split('+')   
    #print(terms) 

    return sum(constructTerm(term, vars_dict) for term in terms)
