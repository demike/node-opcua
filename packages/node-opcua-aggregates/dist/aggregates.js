"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const utils = require("node-opcua-utils");
const node_opcua_variant_1 = require("node-opcua-variant");
// import { HistoryServerCapabilities } from "node-opcua-server";
/*
HasProperty Variable AccessHistoryDataCapability Boolean PropertyType Mandatory
HasProperty Variable AccessHistoryEventsCapability Boolean PropertyType Mandatory
HasProperty Variable MaxReturnDataValues UInt32 PropertyType Mandatory
HasProperty Variable MaxReturnEventValues UInt32 PropertyType Mandatory
HasProperty Variable InsertDataCapability Boolean PropertyType Mandatory
HasProperty Variable ReplaceDataCapability Boolean PropertyType Mandatory
HasProperty Variable UpdateDataCapability Boolean PropertyType Mandatory
HasProperty Variable DeleteRawCapability Boolean PropertyType Mandatory
HasProperty Variable DeleteAtTimeCapability Boolean PropertyType Mandatory
HasProperty Variable InsertEventCapability Boolean PropertyType Mandatory
HasProperty Variable ReplaceEventCapability Boolean PropertyType Mandatory
HasProperty Variable UpdateEventCapability Boolean PropertyType Mandatory
HasProperty Variable DeleteEventCapability Boolean PropertyType Mandatory
HasProperty Variable InsertAnnotationsCapability Boolean PropertyType Mandatory
 */
const historicalCapabilitiesDefaultProperties /*: HistoryServerCapabilities */ = {
    accessHistoryDataCapability: true,
    accessHistoryEventsCapability: true,
    deleteAtTimeCapability: false,
    deleteEventCapability: false,
    deleteRawCapability: false,
    insertAnnotationCapability: false,
    insertDataCapability: false,
    insertEventCapability: false,
    maxReturnDataValues: 0,
    maxReturnEventValues: 0,
    replaceDataCapability: false,
    replaceEventCapability: false,
    updateDataCapability: false,
    updateEventCapability: false // Boolean PropertyType Mandatory
};
function createHistoryServerCapabilities(addressSpace, serverCapabilities) {
    /* istanbul ignore next */
    if (serverCapabilities.browseName.toString() !== "ServerCapabilities") {
        throw new Error("Expecting server Capabilities");
    }
    const historyServerCapabilitiesType = addressSpace.getNamespace(0).findObjectType("HistoryServerCapabilitiesType");
    /* istanbul ignore next */
    if (!historyServerCapabilitiesType) {
        throw new Error("Cannot find HistoryServerCapabilitiesType");
    }
    return historyServerCapabilitiesType.instantiate({
        browseName: "HistoryServerCapabilities",
        componentOf: serverCapabilities
    });
}
exports.createHistoryServerCapabilities = createHistoryServerCapabilities;
function setHistoricalServerCapabilities(historyServerCapabilities, defaultProperties) {
    function setBoolean(propName) {
        const lowerCase = utils.lowerFirstLetter(propName);
        /* istanbul ignore next */
        if (!defaultProperties.hasOwnProperty(lowerCase)) {
            throw new Error("cannot find " + lowerCase);
        }
        const value = defaultProperties[lowerCase];
        const prop = historyServerCapabilities.getChildByName(propName);
        /* istanbul ignore next */
        if (!prop) {
            throw new Error(" Cannot find property " + propName);
        }
        prop.setValueFromSource({ dataType: node_opcua_variant_1.DataType.Boolean, value });
    }
    function setUInt32(propName) {
        const lowerCase = utils.lowerFirstLetter(propName);
        /* istanbul ignore next */
        if (!historyServerCapabilities.hasOwnProperty(lowerCase)) {
            throw new Error("cannot find " + lowerCase);
        }
        const value = defaultProperties[lowerCase];
        const prop = historyServerCapabilities.getChildByName(propName);
        prop.setValueFromSource({ dataType: node_opcua_variant_1.DataType.UInt32, value });
    }
    setBoolean("AccessHistoryDataCapability");
    setBoolean("AccessHistoryEventsCapability");
    setUInt32("MaxReturnDataValues");
    setUInt32("MaxReturnEventValues");
    setBoolean("InsertDataCapability");
    setBoolean("ReplaceDataCapability");
    setBoolean("UpdateDataCapability");
    setBoolean("DeleteRawCapability");
    setBoolean("DeleteAtTimeCapability");
    setBoolean("InsertEventCapability");
    setBoolean("ReplaceEventCapability");
    setBoolean("UpdateEventCapability");
    setBoolean("DeleteEventCapability");
    /// FOUND A BUG HERE spec says InsertAnnotationsCapability
    /// Standard dnodeset2 says InsertAnnotationCapability ( without s )
    // xx setBoolean("InsertAnnotationsCapability");
}
function addAggregateFunctionSupport(addressSpace, functionName) {
    /* istanbul ignore next */
    if (!functionName) {
        throw new Error("Invalid function name");
    }
    const serverCapabilities = addressSpace.rootFolder.objects.server.serverCapabilities;
    /* istanbul ignore next */
    if (!serverCapabilities.historyServerCapabilities) {
        throw new Error("missing serverCapabilities.historyServerCapabilities");
    }
    const aggregateFunctions = serverCapabilities.aggregateFunctions;
    const aggregateFunctionsInHist = serverCapabilities.historyServerCapabilities.aggregateFunctions;
    const functionNodeId = node_opcua_nodeid_1.makeNodeId(functionName);
    const functionNode = addressSpace.getNamespace(0).findNode(functionNodeId);
    /* istanbul ignore next */
    if (!functionNode) {
        throw new Error("Cannot find node " + functionName + " in addressSpace");
    }
    aggregateFunctions.addReference({
        nodeId: functionNode.nodeId,
        referenceType: "Organizes"
    });
    aggregateFunctionsInHist.addReference({
        nodeId: functionNode.nodeId,
        referenceType: "Organizes"
    });
}
function addAggregateSupport(addressSpace) {
    const aggregateConfigurationType = addressSpace.getNamespace(0).findObjectType("AggregateConfigurationType");
    /* istanbul ignore next */
    if (!aggregateConfigurationType) {
        throw new Error("addressSpace do not expose AggregateConfigurationType");
    }
    const aggregateFunctionType = addressSpace.getNamespace(0).findObjectType("AggregateFunctionType");
    /* istanbul ignore next */
    if (!aggregateFunctionType) {
        throw new Error("addressSpace do not expose AggregateFunctionType");
    }
    const serverObject = addressSpace.rootFolder.objects.getFolderElementByName("Server");
    /* istanbul ignore next */
    if (!serverObject) {
        throw new Error("addressSpace do not expose a ServerObject");
    }
    // xx serverObject.
    const serverCapabilities = serverObject.getChildByName("ServerCapabilities");
    // Let see if HistoryServer Capabilities object exists
    let historyServerCapabilities = serverCapabilities.getChildByName("HistoryServerCapabilities");
    /* istanbul ignore next */
    if (!historyServerCapabilities) {
        historyServerCapabilities = createHistoryServerCapabilities(addressSpace, serverCapabilities);
    }
    setHistoricalServerCapabilities(historyServerCapabilities, historicalCapabilitiesDefaultProperties);
    addAggregateFunctionSupport(addressSpace, 2341 /* Interpolative */);
    addAggregateFunctionSupport(addressSpace, 2346 /* Minimum */);
    addAggregateFunctionSupport(addressSpace, 2347 /* Maximum */);
}
exports.addAggregateSupport = addAggregateSupport;
function installAggregateConfigurationOptions(node, options) {
    const nodePriv = node;
    const aggregateConfiguration = nodePriv.$historicalDataConfiguration.aggregateConfiguration;
    aggregateConfiguration.percentDataBad.setValueFromSource({ dataType: "Byte", value: options.percentDataBad });
    aggregateConfiguration.percentDataGood.setValueFromSource({ dataType: "Byte", value: options.percentDataGood });
    aggregateConfiguration.treatUncertainAsBad.setValueFromSource({
        dataType: "Boolean",
        value: options.treatUncertainAsBad
    });
    aggregateConfiguration.useSlopedExtrapolation.setValueFromSource({
        dataType: "Boolean",
        value: options.useSlopedExtrapolation
    });
    nodePriv.$historicalDataConfiguration.stepped.setValueFromSource({
        dataType: "Boolean",
        value: options.stepped
    });
}
exports.installAggregateConfigurationOptions = installAggregateConfigurationOptions;
function getAggregateConfiguration(node) {
    const nodePriv = node;
    /* istanbul ignore next */
    if (!nodePriv.$historicalDataConfiguration) {
        throw new Error("internal error");
    }
    const aggregateConfiguration = nodePriv.$historicalDataConfiguration.aggregateConfiguration;
    // Beware ! Stepped value comes from Historical Configuration !
    const stepped = nodePriv.$historicalDataConfiguration.stepped.readValue().value.value;
    return {
        percentDataBad: aggregateConfiguration.percentDataBad.readValue().value.value,
        percentDataGood: aggregateConfiguration.percentDataGood.readValue().value.value,
        stepped,
        treatUncertainAsBad: aggregateConfiguration.treatUncertainAsBad.readValue().value.value,
        // xx stepped:                aggregateConfiguration.stepped.readValue().value,
        useSlopedExtrapolation: aggregateConfiguration.useSlopedExtrapolation.readValue().value.value
    };
}
exports.getAggregateConfiguration = getAggregateConfiguration;
//# sourceMappingURL=aggregates.js.map