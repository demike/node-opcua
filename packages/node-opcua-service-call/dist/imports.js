"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-service-browse
 */
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const node_opcua_types_1 = require("node-opcua-types");
const node_opcua_variant_1 = require("node-opcua-variant");
var node_opcua_types_2 = require("node-opcua-types");
exports.Argument = node_opcua_types_2.Argument;
exports.CallMethodRequest = node_opcua_types_2.CallMethodRequest;
exports.CallRequest = node_opcua_types_2.CallRequest;
exports.CallMethodResult = node_opcua_types_2.CallMethodResult;
exports.CallResponse = node_opcua_types_2.CallResponse;
///
function constructHookArgument(options) {
    options = options || { dataType: node_opcua_variant_1.DataType.Null };
    let dataType = options.dataType;
    if (dataType) {
        if (typeof dataType === "string") {
            dataType = node_opcua_nodeid_1.resolveNodeId(dataType);
        }
        else if (dataType instanceof node_opcua_nodeid_1.NodeId) {
            // nothing
        }
        else if (dataType.value) {
            node_opcua_assert_1.assert(dataType.hasOwnProperty("namespace"));
            dataType = node_opcua_nodeid_1.coerceNodeId(dataType.value, dataType.namespace);
        }
        else {
            node_opcua_assert_1.assert(typeof dataType === "number");
        }
        options.dataType = dataType;
    }
    if (options.valueRank === undefined) {
        options.valueRank = -1;
    }
    // fix missing ArrayDimension (The value is an array with one dimension.)
    if (options.valueRank !== 1 || !options.arrayDimensions) {
        options.arrayDimensions = [0];
    }
    return options;
}
node_opcua_types_1.Argument.schema.constructHook = constructHookArgument;
//# sourceMappingURL=imports.js.map