from pyscipopt import Model, Variable
from src.constraints import constructConstraint
from src.expressions import constructExpression

class Solver:
    _model: Model
    _variables: dict[str, Variable]

    def __init__(self, variables: list[str], constraints: list[str], objective: str):
        self._model = Model()

        self._variables = dict()
        for v in variables:
            self._variables[v] = self._model.addVar(v, vtype="B")
    
        self._model.setObjective(constructExpression(objective, self._variables))

        for cons in constraints:
            self._model.addCons(constructConstraint(cons, self._variables))
    
    def solve(self) -> dict[str, int]:
        self._model.optimize()
        solution = self._model.getBestSol()
        return {variable:int(solution[self._variables[variable]]) for variable in self._variables }