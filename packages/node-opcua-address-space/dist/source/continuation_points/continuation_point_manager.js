"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-server
 */
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_status_code_1 = require("node-opcua-status-code");
let counter = 0;
function make_key() {
    // return crypto.randomBytes(32);
    counter += 1;
    return Buffer.from(counter.toString(), "ascii");
}
class ContinuationPointManager {
    constructor() {
        this._map = {};
    }
    register(maxElements, values) {
        maxElements = maxElements || values.length;
        if (maxElements >= values.length) {
            return {
                continuationPoint: undefined,
                references: values,
                statusCode: node_opcua_status_code_1.StatusCodes.Good
            };
        }
        const key = make_key();
        const keyHash = key.toString("ascii");
        // split the array in two ( values)
        const current_block = values.splice(0, maxElements);
        const result = {
            continuationPoint: key,
            references: current_block,
            statusCode: node_opcua_status_code_1.StatusCodes.Good
        };
        // create
        const data = {
            maxElements,
            remainingElements: values
        };
        this._map[keyHash] = data;
        return result;
    }
    getNext(continuationPoint) {
        if (!continuationPoint) {
            return { statusCode: node_opcua_status_code_1.StatusCodes.BadContinuationPointInvalid };
        }
        const keyHash = continuationPoint.toString("ascii");
        const data = this._map[keyHash];
        if (!data) {
            return { statusCode: node_opcua_status_code_1.StatusCodes.BadContinuationPointInvalid };
        }
        node_opcua_assert_1.assert(data.maxElements > 0);
        // split the array in two ( values)
        const current_block = data.remainingElements.splice(0, data.maxElements);
        const result = {
            continuationPoint: data.remainingElements.length ? continuationPoint : undefined,
            references: current_block,
            statusCode: node_opcua_status_code_1.StatusCodes.Good
        };
        if (data.remainingElements.length === 0) {
            // we are done
            delete this._map[keyHash];
        }
        return result;
    }
    cancel(continuationPoint) {
        if (!continuationPoint) {
            return { statusCode: node_opcua_status_code_1.StatusCodes.BadContinuationPointInvalid };
        }
        const keyHash = continuationPoint.toString("ascii");
        const data = this._map[keyHash];
        if (!data) {
            return {
                continuationPoint: undefined,
                references: [],
                statusCode: node_opcua_status_code_1.StatusCodes.BadContinuationPointInvalid
            };
        }
        delete this._map[keyHash];
        return {
            statusCode: node_opcua_status_code_1.StatusCodes.Good
        };
    }
}
exports.ContinuationPointManager = ContinuationPointManager;
//# sourceMappingURL=continuation_point_manager.js.map