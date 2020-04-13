"use strict";
/**
 * @module node-opcua-factory
 */
// tslint:disable:no-console
Object.defineProperty(exports, "__esModule", { value: true });
const node_opcua_debug_1 = require("node-opcua-debug");
const datatype_factory_1 = require("./datatype_factory");
const debugLog = node_opcua_debug_1.make_debugLog(__filename);
const doDebug = node_opcua_debug_1.checkDebugFlag(__filename);
let globalFactory;
function getStandartDataTypeFactory() {
    if (!globalFactory) {
        globalFactory = new datatype_factory_1.DataTypeFactory([]);
        globalFactory.targetNamespace = "http://opcfoundation.org/UA/";
    }
    return globalFactory;
}
exports.getStandartDataTypeFactory = getStandartDataTypeFactory;
function getStructureTypeConstructor(typeName) {
    return getStandartDataTypeFactory().getStructureTypeConstructor(typeName);
}
exports.getStructureTypeConstructor = getStructureTypeConstructor;
function hasStructuredType(typeName) {
    return getStandartDataTypeFactory().hasStructuredType(typeName);
}
exports.hasStructuredType = hasStructuredType;
function getStructuredTypeSchema(typeName) {
    return getStandartDataTypeFactory().getStructuredTypeSchema(typeName);
}
exports.getStructuredTypeSchema = getStructuredTypeSchema;
function registerFactory(typeName, constructor) {
    return getStandartDataTypeFactory().registerFactory(typeName, constructor);
}
exports.registerFactory = registerFactory;
function getConstructor(expandedNodeId) {
    return getStandartDataTypeFactory().getConstructor(expandedNodeId);
}
exports.getConstructor = getConstructor;
function hasConstructor(expandedNodeId) {
    return getStandartDataTypeFactory().hasConstructor(expandedNodeId);
}
exports.hasConstructor = hasConstructor;
function constructObject(expandedNodeId) {
    return getStandartDataTypeFactory().constructObject(expandedNodeId);
}
exports.constructObject = constructObject;
function registerClassDefinition(className, classConstructor) {
    return getStandartDataTypeFactory().registerClassDefinition(className, classConstructor);
}
exports.registerClassDefinition = registerClassDefinition;
/* istanbul ignore next */
function dump() {
    getStandartDataTypeFactory().dump();
}
exports.dump = dump;
//# sourceMappingURL=factories_factories.js.map