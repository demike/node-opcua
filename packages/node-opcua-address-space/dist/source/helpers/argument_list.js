"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space
 */
const chalk_1 = require("chalk");
const _ = require("underscore");
const node_opcua_assert_1 = require("node-opcua-assert");
const ec = require("node-opcua-basic-types");
const node_opcua_binary_stream_1 = require("node-opcua-binary-stream");
const node_opcua_debug_1 = require("node-opcua-debug");
const factories = require("node-opcua-factory");
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const node_opcua_service_call_1 = require("node-opcua-service-call");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const node_opcua_variant_1 = require("node-opcua-variant");
const node_opcua_variant_2 = require("node-opcua-variant");
const node_opcua_variant_3 = require("node-opcua-variant");
const node_opcua_data_model_1 = require("node-opcua-data-model");
const debugLog = node_opcua_debug_1.make_debugLog(__filename);
const doDebug = node_opcua_debug_1.checkDebugFlag(__filename);
function myfindBuiltInType(dataType) {
    return factories.findBuiltInType(node_opcua_variant_2.DataType[dataType]);
}
function encode_ArgumentList(definition, args, stream) {
    node_opcua_assert_1.assert(definition.length === args.length);
    node_opcua_assert_1.assert(_.isArray(definition));
    node_opcua_assert_1.assert(_.isArray(args));
    node_opcua_assert_1.assert(definition.length === args.length);
    node_opcua_assert_1.assert(definition.length >= 0);
    // we only encode arguments by following the definition
    for (let i = 0; i < definition.length; i++) {
        const def = definition[i];
        const value = args[i];
        const encodeFunc = myfindBuiltInType(def.dataType).encode;
        // assert((def.valueRank === -1) || (def.valueRank === 0));
        // todo : handle -3 -2
        const isArray = (def.valueRank && (def.valueRank === 1 || def.valueRank !== -1));
        if (isArray) {
            ec.encodeArray(value, stream, encodeFunc);
        }
        else {
            encodeFunc(value, stream);
        }
    }
}
exports.encode_ArgumentList = encode_ArgumentList;
function decode_ArgumentList(definition, stream) {
    if (!_.isArray(definition)) {
        throw new Error("This BaseDataType cannot be decoded because it has no definition.\n" +
            "Please construct a BaseDataType({definition : [{dataType: DataType.UInt32 }]});");
    }
    const args = [];
    let value;
    for (const def of definition) {
        const decodeFunc = myfindBuiltInType(def.dataType).decode;
        // xx assert(def.valueRank === -1 || def.valueRank==0);
        const isArray = (def.valueRank === 1 || def.valueRank === -1);
        if (isArray) {
            value = ec.decodeArray(stream, decodeFunc);
        }
        else {
            value = decodeFunc(stream);
        }
        args.push(value);
    }
    return args;
}
exports.decode_ArgumentList = decode_ArgumentList;
function binaryStoreSize_ArgumentList(description, args) {
    node_opcua_assert_1.assert(_.isArray(description));
    node_opcua_assert_1.assert(_.isArray(args));
    node_opcua_assert_1.assert(args.length === description.length);
    const stream = new node_opcua_binary_stream_1.BinaryStreamSizeCalculator();
    encode_ArgumentList(description, args, stream);
    return stream.length;
}
exports.binaryStoreSize_ArgumentList = binaryStoreSize_ArgumentList;
function getMethodDeclaration_ArgumentList(addressSpace, objectId, methodId) {
    node_opcua_assert_1.assert(objectId instanceof node_opcua_nodeid_1.NodeId);
    node_opcua_assert_1.assert(methodId instanceof node_opcua_nodeid_1.NodeId);
    // find object in address space
    const obj = addressSpace.findNode(objectId);
    if (!obj) {
        // istanbul ignore next
        if (doDebug) {
            debugLog("cannot find node ", objectId.toString());
        }
        return { statusCode: node_opcua_status_code_1.StatusCodes.BadNodeIdUnknown };
    }
    let objectMethod = obj.getMethodById(methodId);
    if (!objectMethod) {
        // the method doesn't belong to the object, nevertheless
        // the method can be called
        objectMethod = addressSpace.findNode(methodId);
        if (!objectMethod || objectMethod.nodeClass !== node_opcua_data_model_1.NodeClass.Method) {
            return { statusCode: node_opcua_status_code_1.StatusCodes.BadMethodInvalid };
        }
    }
    const methodDeclarationId = objectMethod.methodDeclarationId;
    const methodDeclaration = addressSpace.findNode(methodDeclarationId);
    if (!methodDeclaration) {
        //  return {statusCode: StatusCodes.BadMethodInvalid};
        return { statusCode: node_opcua_status_code_1.StatusCodes.Good, methodDeclaration: objectMethod };
    }
    return { statusCode: node_opcua_status_code_1.StatusCodes.Good, methodDeclaration };
}
exports.getMethodDeclaration_ArgumentList = getMethodDeclaration_ArgumentList;
/**
 * @private
 */
function isArgumentValid(addressSpace, argDefinition, arg) {
    node_opcua_assert_1.assert(argDefinition instanceof node_opcua_service_call_1.Argument);
    node_opcua_assert_1.assert(argDefinition.hasOwnProperty("dataType"));
    node_opcua_assert_1.assert(argDefinition.hasOwnProperty("valueRank"));
    node_opcua_assert_1.assert(arg instanceof node_opcua_variant_1.Variant);
    const argDefDataType = addressSpace.findDataType(argDefinition.dataType);
    const argDataType = addressSpace.findDataType(node_opcua_nodeid_1.resolveNodeId(arg.dataType));
    // istanbul ignore next
    if (!argDefDataType) {
        return false;
    }
    // istanbul ignore next
    if (!argDataType) {
        debugLog(" cannot find dataType ", arg.dataType, node_opcua_nodeid_1.resolveNodeId(arg.dataType));
        debugLog(" arg = ", arg.toString());
        debugLog(" def =", argDefinition.toString());
        return false;
    }
    // istanbul ignore next
    if (doDebug) {
        debugLog(" checking argDefDataType ", argDefDataType.toString());
        debugLog(" checking argDataType ", argDataType.toString());
    }
    const isArray = (arg.arrayType === node_opcua_variant_3.VariantArrayType.Array);
    if (argDefinition.valueRank > 0) {
        return isArray;
    }
    else if (argDefinition.valueRank === -1) { // SCALAR
        if (isArray) {
            return false;
        }
    }
    if (argDataType.nodeId.value === argDefDataType.nodeId.value) {
        return true;
    }
    // check that dataType is of the same type (derived )
    return argDefDataType.isSupertypeOf(argDataType);
}
/**
 * @method verifyArguments_ArgumentList
 * @param addressSpace
 * @param methodInputArguments
 * @param inputArguments
 * @return statusCode,inputArgumentResults
 */
function verifyArguments_ArgumentList(addressSpace, methodInputArguments, inputArguments) {
    const inputArgumentResults = [];
    if (methodInputArguments.length === 0 && !inputArguments) {
        // it is possible to not provide inputArguments when method  has no arguments
        return { statusCode: node_opcua_status_code_1.StatusCodes.Good };
    }
    if (methodInputArguments.length > 0 && !inputArguments) {
        return { statusCode: node_opcua_status_code_1.StatusCodes.BadArgumentsMissing };
    }
    inputArguments = inputArguments || [];
    if (methodInputArguments.length > inputArguments.length) {
        // istanbul ignore next
        if (doDebug) {
            debugLog("verifyArguments_ArgumentList " +
                "\n       The client did  specify too many input arguments for the method.  " +
                "\n        expected : " + methodInputArguments.length + "" +
                "\n        actual   : " + inputArguments.length);
        }
        return { statusCode: node_opcua_status_code_1.StatusCodes.BadArgumentsMissing };
    }
    if (methodInputArguments.length < inputArguments.length) {
        // istanbul ignore next
        if (doDebug) {
            debugLog(" verifyArguments_ArgumentList " +
                "\n        The client did not specify all of the input arguments for the method. " +
                "\n        expected : " + methodInputArguments.length + "" +
                "\n        actual   : " + inputArguments.length);
        }
        return { statusCode: node_opcua_status_code_1.StatusCodes.BadTooManyArguments };
    }
    let errorCount = 0;
    for (let i = 0; i < methodInputArguments.length; i++) {
        const argDefinition = methodInputArguments[i];
        const arg = inputArguments[i];
        // istanbul ignore next
        if (doDebug) {
            debugLog("verifyArguments_ArgumentList checking argument " + i +
                "\n        argDefinition is    : " + JSON.stringify(argDefinition) +
                "\n        corresponding arg is: " + JSON.stringify(arg));
        }
        if (!isArgumentValid(addressSpace, argDefinition, arg)) {
            // istanbul ignore next
            if (doDebug) {
                debugLog("verifyArguments_ArgumentList \n" +
                    "         The client did specify a argument with the wrong data type.\n" +
                    chalk_1.default.white("          expected : ") + argDefinition.dataType + "\n" +
                    chalk_1.default.cyan("          actual   :") + arg.dataType);
            }
            inputArgumentResults.push(node_opcua_status_code_1.StatusCodes.BadTypeMismatch);
            errorCount += 1;
        }
        else {
            inputArgumentResults.push(node_opcua_status_code_1.StatusCodes.Good);
        }
    }
    node_opcua_assert_1.assert(inputArgumentResults.length === methodInputArguments.length);
    const ret = {
        inputArgumentResults,
        statusCode: errorCount === 0 ? node_opcua_status_code_1.StatusCodes.Good : node_opcua_status_code_1.StatusCodes.BadInvalidArgument
    };
    return ret;
}
exports.verifyArguments_ArgumentList = verifyArguments_ArgumentList;
function build_retrieveInputArgumentsDefinition(addressSpace) {
    const the_address_space = addressSpace;
    return (objectId, methodId) => {
        const response = getMethodDeclaration_ArgumentList(the_address_space, objectId, methodId);
        /* istanbul ignore next */
        if (response.statusCode !== node_opcua_status_code_1.StatusCodes.Good) {
            debugLog(" StatusCode  = " + response.statusCode.toString());
            throw new Error("Invalid Method " + response.statusCode.toString() +
                " ObjectId= " + objectId.toString() + "Method Id =" + methodId.toString());
        }
        const methodDeclaration = response.methodDeclaration;
        // verify input Parameters
        const methodInputArguments = methodDeclaration.getInputArguments();
        node_opcua_assert_1.assert(_.isArray(methodInputArguments));
        return methodInputArguments;
    };
}
exports.build_retrieveInputArgumentsDefinition = build_retrieveInputArgumentsDefinition;
function convertJavaScriptToVariant(argumentDefinition, values) {
    node_opcua_assert_1.assert(argumentDefinition.length === values.length);
    node_opcua_assert_1.assert(_.isArray(argumentDefinition));
    node_opcua_assert_1.assert(_.isArray(values));
    return _.zip(values, argumentDefinition).map((pair) => {
        pair = pair;
        const value = pair[0];
        const arg = pair[1];
        const variant = _.extend({}, arg);
        variant.value = value;
        return new node_opcua_variant_1.Variant(variant);
    });
}
exports.convertJavaScriptToVariant = convertJavaScriptToVariant;
//# sourceMappingURL=argument_list.js.map