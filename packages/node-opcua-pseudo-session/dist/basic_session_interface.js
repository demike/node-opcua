"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-pseudo-session
 */
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const node_opcua_service_browse_1 = require("node-opcua-service-browse");
function getArgumentDefinitionHelper(session, methodId, callback) {
    const browseDescription = new node_opcua_service_browse_1.BrowseDescription({
        browseDirection: node_opcua_data_model_1.BrowseDirection.Forward,
        includeSubtypes: true,
        nodeClassMask: 0,
        nodeId: methodId,
        referenceTypeId: node_opcua_nodeid_1.resolveNodeId("HasProperty"),
        resultMask: node_opcua_data_model_1.makeResultMask("BrowseName")
    });
    session.browse(browseDescription, (err, browseResult) => {
        /* istanbul ignore next */
        if (err) {
            return callback(err);
        }
        if (!browseResult) {
            return callback(new Error("Invalid"));
        }
        browseResult.references = browseResult.references || [];
        // xx console.log("xxxx results", util.inspect(results, {colors: true, depth: 10}));
        const inputArgumentRefArray = browseResult.references.filter((r) => r.browseName.name === "InputArguments");
        // note : InputArguments property is optional thus may be missing
        const inputArgumentRef = (inputArgumentRefArray.length === 1) ? inputArgumentRefArray[0] : null;
        const outputArgumentRefArray = browseResult.references.filter((r) => r.browseName.name === "OutputArguments");
        // note : OutputArguments property is optional thus may be missing
        const outputArgumentRef = (outputArgumentRefArray.length === 1) ? outputArgumentRefArray[0] : null;
        let inputArguments = [];
        let outputArguments = [];
        const nodesToRead = [];
        const actions = [];
        if (inputArgumentRef) {
            nodesToRead.push({
                attributeId: node_opcua_data_model_1.AttributeIds.Value,
                nodeId: inputArgumentRef.nodeId
            });
            actions.push((result) => {
                inputArguments = result.value.value;
            });
        }
        if (outputArgumentRef) {
            nodesToRead.push({
                attributeId: node_opcua_data_model_1.AttributeIds.Value,
                nodeId: outputArgumentRef.nodeId
            });
            actions.push((result) => {
                outputArguments = result.value.value;
            });
        }
        if (nodesToRead.length === 0) {
            return callback(null, { inputArguments, outputArguments });
        }
        // now read the variable
        session.read(nodesToRead, (err1, dataValues) => {
            /* istanbul ignore next */
            if (err1) {
                return callback(err1);
            }
            if (!dataValues) {
                return callback(new Error("Internal Error"));
            }
            dataValues.forEach((dataValue, index) => {
                actions[index].call(null, dataValue);
            });
            callback(null, { inputArguments, outputArguments });
        });
    });
}
exports.getArgumentDefinitionHelper = getArgumentDefinitionHelper;
//# sourceMappingURL=basic_session_interface.js.map