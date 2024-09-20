from pyscipopt import Variable
from src.expressions import constructExpression


def getConstraintType(input: str) -> str:
    # check for "=="
    parts = input.split("==")
    if len(parts) > 2:
        raise Exception("Given constraint contains multiple \"==\".")
    if len(parts) == 2:
        return "=="
    
    # check for "<="
    parts = input.split("<=")
    if len(parts) > 2:
        raise Exception("Given constraint contains multiple \"<=\".")
    if len(parts) == 2:
        return "<="

    # check for ">="
    parts = input.split(">=")
    if len(parts) > 2:
        raise Exception("Given constraint contains multiple \">=\".")
    if len(parts) == 2:
        return ">="

    # Error 
    raise Exception("Given constraint contains no \"==\", \"<=\" or \">=\"")
    

def constructConstraint(input: str, vars_dict: dict[str, Variable]):
    type = getConstraintType(input)
    
    parts = input.split(type)

    match type:
        case "==":
            return constructExpression(parts[0], vars_dict) == constructExpression(parts[1], vars_dict)
        case "<=":
            return constructExpression(parts[0], vars_dict) <= constructExpression(parts[1], vars_dict)
        case ">=":
            return constructExpression(parts[0], vars_dict) >= constructExpression(parts[1], vars_dict)
    