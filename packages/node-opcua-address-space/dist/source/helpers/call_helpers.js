"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space
 */
const _ = require("underscore");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_client_dynamic_extension_object_1 = require("node-opcua-client-dynamic-extension-object");
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const session_context_1 = require("../session_context");
const argument_list_1 = require("./argument_list");
const load_nodeset2_1 = require("../../source/loader/load_nodeset2");
function callMethodHelper(server, session, addressSpace, callMethodRequest, callback) {
    const objectId = callMethodRequest.objectId;
    const methodId = callMethodRequest.methodId;
    const inputArguments = callMethodRequest.inputArguments || [];
    node_opcua_assert_1.assert(objectId instanceof node_opcua_nodeid_1.NodeId);
    node_opcua_assert_1.assert(methodId instanceof node_opcua_nodeid_1.NodeId);
    let response = argument_list_1.getMethodDeclaration_ArgumentList(addressSpace, objectId, methodId);
    if (response.statusCode !== node_opcua_status_code_1.StatusCodes.Good) {
        return callback(null, { statusCode: response.statusCode });
    }
    const methodDeclaration = response.methodDeclaration;
    // verify input Parameters
    const methodInputArguments = methodDeclaration.getInputArguments();
    response = argument_list_1.verifyArguments_ArgumentList(addressSpace, methodInputArguments, inputArguments);
    if (response.statusCode !== node_opcua_status_code_1.StatusCodes.Good) {
        return callback(null, response);
    }
    const methodObj = addressSpace.findNode(methodId);
    if (methodObj.nodeClass !== node_opcua_data_model_1.NodeClass.Method) {
        return callback(null, { statusCode: node_opcua_status_code_1.StatusCodes.BadNodeIdInvalid });
    }
    // invoke method on object
    const context = new session_context_1.SessionContext({
        object: addressSpace.findNode(objectId),
        server,
        session
    });
    let l_extraDataTypeManager;
    load_nodeset2_1.ensureDatatypeExtractedWithCallback(addressSpace, (err2, extraDataTypeManager) => {
        l_extraDataTypeManager = extraDataTypeManager;
        // resolve opaque data structure from inputArguments
        for (const variant of inputArguments) {
            node_opcua_client_dynamic_extension_object_1.resolveDynamicExtensionObject(variant, l_extraDataTypeManager);
        }
        methodObj.execute(inputArguments, context, (err, callMethodResponse) => {
            /* istanbul ignore next */
            if (err) {
                return callback(err);
            }
            if (!callMethodResponse) {
                return callback(new Error("internal Error"));
            }
            callMethodResponse.inputArgumentResults = response.inputArgumentResults || [];
            node_opcua_assert_1.assert(callMethodResponse.statusCode);
            if (callMethodResponse.statusCode === node_opcua_status_code_1.StatusCodes.Good) {
                node_opcua_assert_1.assert(_.isArray(callMethodResponse.outputArguments));
            }
            node_opcua_assert_1.assert(_.isArray(callMethodResponse.inputArgumentResults));
            node_opcua_assert_1.assert(callMethodResponse.inputArgumentResults.length === methodInputArguments.length);
            if (callMethodResponse.outputArguments) {
                const outputArguments = callMethodResponse.outputArguments || [];
                for (const variant of outputArguments) {
                    node_opcua_client_dynamic_extension_object_1.resolveDynamicExtensionObject(variant, l_extraDataTypeManager);
                }
            }
            return callback(null, callMethodResponse);
        });
    });
}
exports.callMethodHelper = callMethodHelper;
//# sourceMappingURL=call_helpers.js.map