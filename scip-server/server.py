from flask import Flask, jsonify, request
from src.solver import Solver
import json
app = Flask(__name__)

@app.route('/optimize', methods=['GET'])
def optimize():
    print("____REQUEST____")
    try:
        input = request.args.get('input')
        data = decodeInput(input)
        print("INPUT: " + str(data))

        solver = Solver(data["variables"], data["constraints"], data["objective"])
        solution = solver.solve()
        
        print("SOLUTION: " + str(solution))
        return jsonify({'status': 'success', 'result': encodeOutput(solution)})
    except Exception as e:
        print(e)
        return jsonify({'status': 'error', 'message': 'An unknown error occurred.'})


def decodeInput(input:str) -> dict:
    # TODO: base 64 decode
    return json.loads(input)

def encodeOutput(input) -> dict:
    # TODO: base 64 encode
    return json.dumps(input)

if __name__ == '__main__':
    app.run(port=5000)