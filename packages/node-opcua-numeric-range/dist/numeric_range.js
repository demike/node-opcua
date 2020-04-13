"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-numeric-range
 */
const node_opcua_assert_1 = require("node-opcua-assert");
const _ = require("underscore");
const node_opcua_basic_types_1 = require("node-opcua-basic-types");
const node_opcua_factory_1 = require("node-opcua-factory");
const node_opcua_status_code_1 = require("node-opcua-status-code");
// OPC.UA Part 4 7.21 Numerical Range
// The syntax for the string contains one of the following two constructs. The first construct is the string
// representation of an individual integer. For example, '6' is   valid, but '6.0' and '3.2' are not. The
// minimum and maximum values that can be expressed are defined by the use of this parameter and
// not by this parameter type definition. The second construct is a range represented by two integers
// separated by the colon   (':') character. The first integer shall always have a lower value than the
// second. For example, '5:7' is valid, while '7:5' and '5:5' are not. The minimum and maximum values
// that can be expressed by these integers are defined by the use of this parameter , and not by this
// parameter type definition. No other characters, including white - space characters, are permitted.
// Multi- dimensional arrays can be indexed by specifying a range for each dimension separated by a ','.
//
// For example, a 2x2 block in a 4x4 matrix   could be selected with the range '1:2,0:1'. A single element
// in a multi - dimensional array can be selected by specifying a single number instead of a range.
// For example, '1,1' specifies selects the [1,1] element in a two dimensional array.
// Dimensions are specified in the order that they appear in the  ArrayDimensions Attribute.
// All dimensions shall be specified for a  NumericRange  to be valid.
//
// All indexes start with 0. The maximum value for any index is one less than the length of the
// dimension.
const NUMERIC_RANGE_EMPTY_STRING = "NumericRange:<Empty>";
// BNF of NumericRange
// The following BNF describes the syntax of the NumericRange parameter type.
// <numeric-range>    ::= <dimension> [',' <dimension>]
//     <dimension>    ::= <index> [':' <index>]
//         <index>    ::= <digit> [<digit>]
//         <digit>    ::= '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' |9'
//
// tslint:disable:object-literal-shorthand
// tslint:disable:only-arrow-functions
exports.schemaNumericRange = {
    name: "NumericRange",
    subType: "UAString",
    defaultValue: () => {
        return new NumericRange();
    },
    encode: (value, stream) => {
        node_opcua_assert_1.assert(value === null || value instanceof NumericRange);
        const strValue = (value === null) ? null : value.toEncodeableString();
        node_opcua_basic_types_1.encodeString(strValue, stream);
    },
    decode: (stream) => {
        const str = node_opcua_basic_types_1.decodeString(stream);
        return new NumericRange(str);
    },
    random: () => {
        function r() {
            return Math.ceil(Math.random() * 100);
        }
        const start = r();
        const end = start + r();
        return new NumericRange(start, end);
    },
    coerce: coerceNumericRange
};
node_opcua_factory_1.registerBasicType(exports.schemaNumericRange);
var NumericRangeType;
(function (NumericRangeType) {
    NumericRangeType[NumericRangeType["Empty"] = 0] = "Empty";
    NumericRangeType[NumericRangeType["SingleValue"] = 1] = "SingleValue";
    NumericRangeType[NumericRangeType["ArrayRange"] = 2] = "ArrayRange";
    NumericRangeType[NumericRangeType["MatrixRange"] = 3] = "MatrixRange";
    NumericRangeType[NumericRangeType["InvalidRange"] = 4] = "InvalidRange";
})(NumericRangeType = exports.NumericRangeType || (exports.NumericRangeType = {}));
// new Enum(["Empty", "SingleValue", "ArrayRange", "MatrixRange", "InvalidRange"]);
const regexNumericRange = /^[0-9:,]*$/;
function _valid_range(low, high) {
    return !((low >= high) || (low < 0 || high < 0));
}
function construct_numeric_range_bit_from_string(str) {
    const values = str.split(":");
    if (values.length === 1) {
        return {
            type: NumericRangeType.SingleValue,
            value: parseInt(values[0], 10)
        };
    }
    else if (values.length === 2) {
        const array = values.map((a) => parseInt(a, 10));
        if (!_valid_range(array[0], array[1])) {
            return {
                type: NumericRangeType.InvalidRange,
                value: str
            };
        }
        return {
            type: NumericRangeType.ArrayRange,
            value: array
        };
    }
    else {
        return {
            type: NumericRangeType.InvalidRange,
            value: str
        };
    }
}
function _normalize(e) {
    if (e.type === NumericRangeType.SingleValue) {
        const ee = e;
        return [ee.value, ee.value];
    }
    return e.value;
}
function construct_numeric_range_from_string(str) {
    if (!regexNumericRange.test(str)) {
        return {
            type: NumericRangeType.InvalidRange,
            value: str
        };
    }
    /* detect multi dim range*/
    const values = str.split(",");
    if (values.length === 1) {
        return construct_numeric_range_bit_from_string(values[0]);
    }
    else if (values.length === 2) {
        const elements = values.map(construct_numeric_range_bit_from_string);
        let rowRange = elements[0];
        let colRange = elements[1];
        if (rowRange.type === NumericRangeType.InvalidRange || colRange.type === NumericRangeType.InvalidRange) {
            return { type: NumericRangeType.InvalidRange, value: str };
        }
        rowRange = _normalize(rowRange);
        colRange = _normalize(colRange);
        return {
            type: NumericRangeType.MatrixRange,
            value: [rowRange, colRange]
        };
    }
    else {
        // not supported yet
        return { type: NumericRangeType.InvalidRange, value: str };
    }
}
function construct_from_string(value) {
    return construct_numeric_range_from_string(value);
}
function _set_single_value(value) {
    node_opcua_assert_1.assert(_.isFinite(value));
    if (value === null || value < 0) {
        return {
            type: NumericRangeType.InvalidRange,
            value: "" + value.toString()
        };
    }
    else {
        return {
            type: NumericRangeType.SingleValue,
            value: value
        };
    }
}
function _check_range(numericalRange) {
    switch (numericalRange.type) {
        case NumericRangeType.MatrixRange:
            if (numericalRange.value === null) {
                throw new Error("Internal Error");
            }
            node_opcua_assert_1.assert(_.isNumber(numericalRange.value[0][0]));
            node_opcua_assert_1.assert(_.isNumber(numericalRange.value[0][1]));
            node_opcua_assert_1.assert(_.isNumber(numericalRange.value[1][0]));
            node_opcua_assert_1.assert(_.isNumber(numericalRange.value[1][1]));
            return _valid_range(numericalRange.value[0][0], numericalRange.value[0][1]) &&
                _valid_range(numericalRange.value[1][0], numericalRange.value[1][1]);
        case NumericRangeType.ArrayRange:
            return _valid_range(numericalRange.value[0], numericalRange.value[1]);
        case NumericRangeType.SingleValue:
            return numericalRange.value >= 0;
        default:
            return true;
    }
}
function _set_range_value(low, high) {
    const numericalRange = {
        type: NumericRangeType.ArrayRange,
        value: [low, high]
    };
    if (!_check_range(numericalRange)) {
        return {
            type: NumericRangeType.InvalidRange,
            value: ""
        };
    }
    return numericalRange;
}
function construct_from_values(value, secondValue) {
    if (secondValue === undefined) {
        return _set_single_value(value);
    }
    else {
        if (!_.isFinite(secondValue)) {
            throw new Error(" invalid second argument, expecting a number");
        }
        return _set_range_value(value, secondValue);
    }
}
function _construct_from_array(value) {
    node_opcua_assert_1.assert(value.length === 2);
    if (_.isFinite(value[0])) {
        if (!_.isFinite(value[1])) {
            throw new Error(" invalid range in " + value);
        }
        return _set_range_value(value[0], value[1]);
    }
    return { type: NumericRangeType.InvalidRange, value: "" + value };
}
function _construct_from_NumericRange(nr) {
    const nrToClone = nr;
    switch (nrToClone.type) {
        case NumericRangeType.InvalidRange:
            return { type: NumericRangeType.InvalidRange, value: nrToClone.value };
        case NumericRangeType.MatrixRange:
            return { type: NumericRangeType.MatrixRange, value: _.clone(nr.value) };
        case NumericRangeType.ArrayRange:
            return { type: NumericRangeType.ArrayRange, value: _.clone(nr.value) };
        case NumericRangeType.SingleValue:
            return { type: NumericRangeType.SingleValue, value: nrToClone.value };
        case NumericRangeType.Empty:
            return { type: NumericRangeType.Empty, value: null };
    }
}
class NumericRange {
    constructor(value, secondValue) {
        this.type = NumericRangeType.InvalidRange;
        this.value = null;
        node_opcua_assert_1.assert(!value || !(value instanceof NumericRange), "use coerce to create a NumericRange");
        if (typeof value === "string") {
            const a = construct_from_string(value);
            this.type = a.type;
            this.value = a.value;
        }
        else if (_.isFinite(value) && !_.isUndefined(value)) {
            const a = construct_from_values(value, secondValue);
            this.type = a.type;
            this.value = a.value;
        }
        else if (_.isArray(value)) {
            const a = _construct_from_array(value);
            this.type = a.type;
            this.value = a.value;
        }
        else if (value instanceof NumericRange) {
            const a = _construct_from_NumericRange(value);
            this.type = a.type;
            this.value = a.value;
        }
        else {
            this.value = "<invalid>";
            this.type = NumericRangeType.Empty;
        }
        // xx assert((this.type !== NumericRangeType.ArrayRange) || _.isArray(this.value));
    }
    static overlap(nr1, nr2) {
        nr1 = nr1 || NumericRange.empty;
        nr2 = nr2 || NumericRange.empty;
        if (NumericRangeType.Empty === nr1.type || NumericRangeType.Empty === nr2.type) {
            return true;
        }
        if (NumericRangeType.SingleValue === nr1.type && NumericRangeType.SingleValue === nr2.type) {
            return nr1.value === nr2.value;
        }
        if (NumericRangeType.ArrayRange === nr1.type && NumericRangeType.ArrayRange === nr2.type) {
            // +-----+        +------+     +---+       +------+
            //     +----+       +---+    +--------+  +---+
            const l1 = nr1.value[0];
            const h1 = nr1.value[1];
            const l2 = nr2.value[0];
            const h2 = nr2.value[1];
            return _overlap(l1, h1, l2, h2);
        }
        // console.log(" NR1 = ", nr1.toEncodeableString());
        // console.log(" NR2 = ", nr2.toEncodeableString());
        node_opcua_assert_1.assert(false, "NumericalRange#overlap : case not implemented yet "); // TODO
        return false;
    }
    isValid() {
        return this.type !== NumericRangeType.InvalidRange;
    }
    isEmpty() {
        return this.type === NumericRangeType.Empty;
    }
    isDefined() {
        return this.type !== NumericRangeType.Empty && this.type !== NumericRangeType.InvalidRange;
    }
    toString() {
        function array_range_to_string(values) {
            node_opcua_assert_1.assert(_.isArray(values));
            if (values.length === 2 && values[0] === values[1]) {
                return values[0].toString();
            }
            return values.map((value) => value.toString(10)).join(":");
        }
        function matrix_range_to_string(values) {
            return values.map((value) => {
                return (_.isArray(value)) ? array_range_to_string(value) : value.toString(10);
            }).join(",");
        }
        switch (this.type) {
            case NumericRangeType.SingleValue:
                return this.value.toString(10);
            case NumericRangeType.ArrayRange:
                return array_range_to_string(this.value);
            case NumericRangeType.Empty:
                return NUMERIC_RANGE_EMPTY_STRING;
            case NumericRangeType.MatrixRange:
                return matrix_range_to_string(this.value);
            default:
                node_opcua_assert_1.assert(this.type === NumericRangeType.InvalidRange);
                return "NumericRange:<Invalid>";
        }
    }
    toJSON() {
        return this.toString();
    }
    toEncodeableString() {
        switch (this.type) {
            case NumericRangeType.SingleValue:
            case NumericRangeType.ArrayRange:
            case NumericRangeType.MatrixRange:
                return this.toString();
            case NumericRangeType.InvalidRange:
                if (!(typeof this.value === "string")) {
                    throw new Error("Internal Error");
                }
                return this.value; // value contains the original strings which was detected invalid
            default:
                return null;
        }
    }
    /**
     * @method extract_values
     * @param array   flat array containing values or string
     * @param dimensions: of the matrix if data is a matrix
     * @return {*}
     */
    extract_values(array, dimensions) {
        const self = this;
        if (!array) {
            return {
                array,
                statusCode: this.type === NumericRangeType.Empty ? node_opcua_status_code_1.StatusCodes.Good : node_opcua_status_code_1.StatusCodes.BadIndexRangeNoData
            };
        }
        let index;
        let low_index;
        let high_index;
        let rowRange;
        let colRange;
        switch (self.type) {
            case NumericRangeType.Empty:
                return extract_empty(array, dimensions);
            case NumericRangeType.SingleValue:
                index = self.value;
                return extract_single_value(array, index);
            case NumericRangeType.ArrayRange:
                low_index = self.value[0];
                high_index = self.value[1];
                return extract_array_range(array, low_index, high_index);
            case NumericRangeType.MatrixRange:
                rowRange = self.value[0];
                colRange = self.value[1];
                return extract_matrix_range(array, rowRange, colRange, dimensions);
            default:
                return { statusCode: node_opcua_status_code_1.StatusCodes.BadIndexRangeInvalid };
        }
    }
    set_values(arrayToAlter, newValues) {
        assert_array_or_buffer(arrayToAlter);
        assert_array_or_buffer(newValues);
        const self = this;
        let low_index;
        let high_index;
        switch (self.type) {
            case NumericRangeType.Empty:
                low_index = 0;
                high_index = arrayToAlter.length - 1;
                break;
            case NumericRangeType.SingleValue:
                low_index = self.value;
                high_index = self.value;
                break;
            case NumericRangeType.ArrayRange:
                low_index = self.value[0];
                high_index = self.value[1];
                break;
            case NumericRangeType.MatrixRange:
                // for the time being MatrixRange is not supported
                return { array: arrayToAlter, statusCode: node_opcua_status_code_1.StatusCodes.BadIndexRangeNoData };
            default:
                return { array: [], statusCode: node_opcua_status_code_1.StatusCodes.BadIndexRangeInvalid };
        }
        if (high_index >= arrayToAlter.length || low_index >= arrayToAlter.length) {
            return { array: [], statusCode: node_opcua_status_code_1.StatusCodes.BadIndexRangeNoData };
        }
        if ((this.type !== NumericRangeType.Empty) && newValues.length !== (high_index - low_index + 1)) {
            return { array: [], statusCode: node_opcua_status_code_1.StatusCodes.BadIndexRangeInvalid };
        }
        const insertInPlace = (_.isArray(arrayToAlter)
            ? insertInPlaceStandardArray
            : (arrayToAlter instanceof Buffer ? insertInPlaceBuffer : insertInPlaceTypedArray));
        return {
            array: insertInPlace(arrayToAlter, low_index, high_index, newValues),
            statusCode: node_opcua_status_code_1.StatusCodes.Good
        };
    }
    encode(stream) {
        node_opcua_basic_types_1.encodeString(this.toEncodeableString(), stream);
    }
    decode(stream) {
        const str = node_opcua_basic_types_1.decodeString(stream);
    }
}
exports.NumericRange = NumericRange;
NumericRange.coerce = coerceNumericRange;
// tslint:disable:variable-name
NumericRange.NumericRangeType = NumericRangeType;
NumericRange.empty = new NumericRange();
function slice(arr, start, end) {
    if (start === 0 && end === arr.length) {
        return arr;
    }
    let res;
    if (arr.buffer instanceof ArrayBuffer) {
        res = arr.subarray(start, end);
    }
    else {
        node_opcua_assert_1.assert(_.isFunction(arr.slice));
        node_opcua_assert_1.assert(arr instanceof Buffer || arr instanceof Array || typeof arr === "string");
        res = arr.slice(start, end);
    }
    if (res instanceof Uint8Array && arr instanceof Buffer) {
        // note in iojs 3.00 onward standard Buffer are implemented differently and
        // provides a buffer member and a subarray method, in fact in iojs 3.0
        // it seems that Buffer acts as a Uint8Array. in this very special case
        // we need to make sure that we end up with a Buffer object and not a Uint8Array.
        res = Buffer.from(res);
    }
    return res;
}
function extract_empty(array, dimensions) {
    return {
        array: slice(array, 0, array.length),
        dimensions,
        statusCode: node_opcua_status_code_1.StatusCodes.Good
    };
}
function extract_single_value(array, index) {
    if (index >= array.length) {
        if (typeof array === "string") {
            return { array: "", statusCode: node_opcua_status_code_1.StatusCodes.BadIndexRangeNoData };
        }
        return { array: [], statusCode: node_opcua_status_code_1.StatusCodes.BadIndexRangeNoData };
    }
    return {
        array: slice(array, index, index + 1),
        statusCode: node_opcua_status_code_1.StatusCodes.Good
    };
}
function extract_array_range(array, low_index, high_index) {
    node_opcua_assert_1.assert(_.isFinite(low_index) && _.isFinite(high_index));
    node_opcua_assert_1.assert(low_index >= 0);
    node_opcua_assert_1.assert(low_index <= high_index);
    if (low_index >= array.length) {
        if (typeof array === "string") {
            return { array: "", statusCode: node_opcua_status_code_1.StatusCodes.BadIndexRangeNoData };
        }
        return { array: [], statusCode: node_opcua_status_code_1.StatusCodes.BadIndexRangeNoData };
    }
    // clamp high index
    high_index = Math.min(high_index, array.length - 1);
    return {
        array: slice(array, low_index, high_index + 1),
        statusCode: node_opcua_status_code_1.StatusCodes.Good
    };
}
function isArrayLike(value) {
    return _.isNumber(value.length) || value.hasOwnProperty("length");
}
function extract_matrix_range(array, rowRange, colRange, dimension) {
    node_opcua_assert_1.assert(_.isArray(rowRange) && _.isArray(colRange));
    if (array.length === 0) {
        return {
            array: [],
            statusCode: node_opcua_status_code_1.StatusCodes.BadIndexRangeNoData
        };
    }
    if (isArrayLike(array[0]) && !dimension) {
        // like extracting data from a one dimensional array of strings or byteStrings...
        const result = extract_array_range(array, rowRange[0], rowRange[1]);
        for (let i = 0; i < result.array.length; i++) {
            const e = result.array[i];
            result.array[i] = extract_array_range(e, colRange[0], colRange[1]).array;
        }
        return result;
    }
    if (!dimension) {
        return {
            array: [],
            statusCode: node_opcua_status_code_1.StatusCodes.BadIndexRangeNoData
        };
    }
    node_opcua_assert_1.assert(dimension, "expecting dimension to know the shape of the matrix represented by the flat array");
    //
    const rowLow = rowRange[0];
    const rowHigh = rowRange[1];
    const colLow = colRange[0];
    const colHigh = colRange[1];
    const nbRow = dimension[0];
    const nbCol = dimension[1];
    const nbRowDest = rowHigh - rowLow + 1;
    const nbColDest = colHigh - colLow + 1;
    // construct an array of the same type with the appropriate length to
    // store the extracted matrix.
    const tmp = new array.constructor(nbColDest * nbRowDest);
    let row;
    let col;
    let r;
    let c;
    r = 0;
    for (row = rowLow; row <= rowHigh; row++) {
        c = 0;
        for (col = colLow; col <= colHigh; col++) {
            const srcIndex = row * nbCol + col;
            const destIndex = r * nbColDest + c;
            tmp[destIndex] = array[srcIndex];
            c++;
        }
        r += 1;
    }
    return {
        array: tmp,
        dimensions: [nbRowDest, nbColDest],
        statusCode: node_opcua_status_code_1.StatusCodes.Good
    };
}
function assert_array_or_buffer(array) {
    node_opcua_assert_1.assert(_.isArray(array) || (array.buffer instanceof ArrayBuffer) || array instanceof Buffer);
}
function insertInPlaceStandardArray(arrayToAlter, low, high, newValues) {
    const args = [low, high - low + 1].concat(newValues);
    arrayToAlter.splice.apply(arrayToAlter, args);
    return arrayToAlter;
}
function insertInPlaceTypedArray(arrayToAlter, low, high, newValues) {
    if (low === 0 && high === arrayToAlter.length - 1) {
        return new arrayToAlter.constructor(newValues);
    }
    node_opcua_assert_1.assert(newValues.length === high - low + 1);
    arrayToAlter.subarray(low, high + 1).set(newValues);
    return arrayToAlter;
}
function insertInPlaceBuffer(bufferToAlter, low, high, newValues) {
    if (low === 0 && high === bufferToAlter.length - 1) {
        return Buffer.from(newValues);
    }
    node_opcua_assert_1.assert(newValues.length === high - low + 1);
    for (let i = 0; i < newValues.length; i++) {
        bufferToAlter[i + low] = newValues[i];
    }
    return bufferToAlter;
}
function _overlap(l1, h1, l2, h2) {
    return Math.max(l1, l2) <= Math.min(h1, h2);
}
function encodeNumericRange(numericRange, stream) {
    node_opcua_assert_1.assert(numericRange instanceof NumericRange);
    numericRange.encode(stream);
}
exports.encodeNumericRange = encodeNumericRange;
function decodeNumericRange(stream) {
    const str = node_opcua_basic_types_1.decodeString(stream);
    return new NumericRange(str);
}
exports.decodeNumericRange = decodeNumericRange;
function coerceNumericRange(value) {
    if (value instanceof NumericRange) {
        return value;
    }
    if (value === null || value === undefined) {
        return new NumericRange();
    }
    if (value === NUMERIC_RANGE_EMPTY_STRING) {
        return new NumericRange();
    }
    node_opcua_assert_1.assert(typeof value === "string" || _.isArray(value));
    return new NumericRange(value);
}
//# sourceMappingURL=numeric_range.js.map