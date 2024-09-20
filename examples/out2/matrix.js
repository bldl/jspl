export class SparseMatrix {
    width = 0;
    height = 0;

    /**
     * The state of currently selected weights for every concern
     * @type {Map<number, Map<number, number>>}
     */
    #data = new Map();

    constructor(width, height) {
        this.width = width;
        this.height = height;
    }

    /**
     * Method to get the value of the matrix at certain coordinates. 
     * The function will not throw an error if values outside of the width and height are accessed, instead 0 is returned.
     * 
     * @param {number} x the x coordinate of the value to get
     * @param {number} y the y coordinate of the value to get
     * @returns {number} the value at coordinates x,y. 0 if no value was set.
     */
    at(x, y) {
        if (!this.#data.has(x)) return 0;
        if (!this.#data.get(x).has(y)) return 0;
        return this.#data.get(x).get(y);
    }

    set(x, y, value) {
        if (!this.#data.has(x))
            this.#data.set(x, new Map());
        
        this.#data.get(x).set(y, value);
    }

    toHTMLTable(html) {
        return html`
            <table style="display: inline-block">
                <tr>
                <td></td>
                ${[...Array(this.width).keys()].map((i) => {
                    return html`<td><b>${i}</b></td>`;
                })}
                </tr>
                ${[...Array(this.height).keys()].map((y) => {
                    return html`
                        <tr>
                            <td><b>${y}</b></td>
                            ${[...Array(this.width).keys()].map((x) => {
                                return html`<td>${this.at(x,y)}</td>`;
                            })}
                        </tr>
                    `
                })}
            </table>
        `
    }
}

export class SparseVector {
    length = 0;

    /**
     * 
     * @type {Map<number, number>}
     */
    #data = new Map();

    constructor(length) {
        this.length = length;
    }

    /**
     * Method to get the value of the matrix at certain coordinates. 
     * The function will not throw an error if values outside of the width and height are accessed, instead 0 is returned.
     * 
     * @param {number} i the coordinate of the value to get
     * @returns {number} the value at coordinates x,y. 0 if no value was set.
     */
    at(i) {
        if (!this.#data.has(i)) return 0;
        return this.#data.get(i);
    }

    set(i, value) {
        this.#data.set(i, value);
    }

    toHTMLTable(html) {
        return html`
            <table style="display: inline-block">
                <tr>
                <td></td>
                </tr>
                ${[...Array(this.length).keys()].map((i) => {
                    return html`
                        <tr>
                            <td>${this.at(i)}</td>
                        </tr>
                    `
                })}
            </table>
        `
    }
}

/**
 * 
 * @param {*} tweakables 
 * @param {*} raiseConditions 
 * @returns {{A: SparseMatrix, b: SparseVector}}
 */
export function constructBLPWithoutC(tweakables, raiseConditions) {
    return {
        A: new SparseMatrix(0, 0),
        b: new SparseVector(0)
    }
}

/**
 * 
 * @param {*} tweakables 
 * @param {*} raiseConditions 
 * @param {*} weightsMap 
 * @returns {{A: SparseMatrix, b: SparseVector, c: SparseVector}}
 */
export function constructBLP(tweakables, raiseConditions, weightsMap) {
    let base = constructBLPWithoutC(tweakables, raiseConditions);

    // TODO: construct c

    return {
        A: base.A,
        b: base.b,
        c: new SparseVector(0)
    }
}