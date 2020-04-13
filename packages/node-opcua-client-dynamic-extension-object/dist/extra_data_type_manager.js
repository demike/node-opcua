"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-client-dynamic-extension-object
 */
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_factory_1 = require("node-opcua-factory");
const node_opcua_schemas_1 = require("node-opcua-schemas");
class ExtraDataTypeManager {
    constructor() {
        this.namespaceArray = [];
        this.typeDictionaries = {};
        this.typeDictionariesByNamespace = {};
        /* */
    }
    setNamespaceArray(namespaceArray) {
        this.namespaceArray = namespaceArray;
    }
    hasDataTypeDictionary(nodeId) {
        return !!this.typeDictionaries.hasOwnProperty(this.makeKey(nodeId));
    }
    registerTypeDictionary(nodeId, typeDictionary) {
        /* istanbul ignore next */
        if (this.hasDataTypeDictionary(nodeId)) {
            throw new Error("Dictionary already registered");
        }
        this.typeDictionaries[this.makeKey(nodeId)] = typeDictionary;
        node_opcua_assert_1.default(nodeId.namespace !== 0, "registerTypeDictionary cannot be used for namespace 0");
        node_opcua_assert_1.default(!this.typeDictionariesByNamespace.hasOwnProperty(nodeId.namespace), "already registered");
        this.typeDictionariesByNamespace[nodeId.namespace] = typeDictionary;
    }
    getTypeDictionaryForNamespace(namespaceIndex) {
        node_opcua_assert_1.default(namespaceIndex !== 0, "getTypeDictionaryForNamespace cannot be used for namespace 0");
        return this.typeDictionariesByNamespace[namespaceIndex];
    }
    getDataTypeFactory(namespaceIndex) {
        if (namespaceIndex === 0) {
            return node_opcua_factory_1.getStandartDataTypeFactory();
        }
        return this.typeDictionariesByNamespace[namespaceIndex];
    }
    getExtensionObjectConstructorFromDataType(dataTypeNodeId) {
        const typeDictionary = this.getTypeDictionaryForNamespace(dataTypeNodeId.namespace);
        // find schema corresponding to dataTypeNodeId in typeDictionary
        const schema = findSchemaForDataType(typeDictionary, dataTypeNodeId);
        const Constructor = node_opcua_schemas_1.createDynamicObjectConstructor(schema, typeDictionary);
        return Constructor;
    }
    getExtensionObjectConstructorFromBinaryEncoding(binaryEncodingNodeId) {
        const typeDictionary = this.getTypeDictionaryForNamespace(binaryEncodingNodeId.namespace);
        // find schema corresponding to binaryEncodingNodeId in typeDictionary
        const schema = findSchemaForBinaryEncoding(typeDictionary, binaryEncodingNodeId);
        const Constructor = node_opcua_schemas_1.createDynamicObjectConstructor(schema, typeDictionary);
        return Constructor;
    }
    makeKey(nodeId) {
        return this.namespaceArray[nodeId.namespace] + "@" + nodeId.value.toString();
    }
}
exports.ExtraDataTypeManager = ExtraDataTypeManager;
function findSchemaForDataType(typeDictionary, dataTypeNodeId) {
    for (const k of Object.keys(typeDictionary.structuredTypes)) {
        const schema = typeDictionary.structuredTypes[k];
        if (schema.id.value === dataTypeNodeId.value) {
            node_opcua_assert_1.default(schema.id.namespace === dataTypeNodeId.namespace);
            return schema;
        }
    }
    throw new Error("findSchemaForDataType: Cannot find schema for " + dataTypeNodeId.toString()
        + " in " +
        Object.keys(typeDictionary.structuredTypes).map((a) => a + ":" +
            typeDictionary.structuredTypes[a].id.toString()).join("\n"));
}
function findSchemaForBinaryEncoding(typeDictionary, binaryEncodingNodeId) {
    for (const k of Object.keys(typeDictionary.structuredTypes)) {
        const schema = typeDictionary.structuredTypes[k];
        if (schema.encodingDefaultBinary &&
            schema.encodingDefaultBinary.value === binaryEncodingNodeId.value) {
            node_opcua_assert_1.default(schema.encodingDefaultBinary.namespace === binaryEncodingNodeId.namespace);
            return schema;
        }
    }
    throw new Error("findSchemaForBinaryEncoding: Cannot find schema for " + binaryEncodingNodeId.toString()
        + " in " +
        Object.keys(typeDictionary.structuredTypes).map((a) => a + " " +
            (typeDictionary.structuredTypes[a].encodingDefaultBinary ?
                typeDictionary.structuredTypes[a].encodingDefaultBinary.toString() : "None")).join("\n"));
}
//# sourceMappingURL=extra_data_type_manager.js.map