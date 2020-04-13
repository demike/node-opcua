"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-client-dynamic-extension-object
 */
const _ = require("underscore");
const util_1 = require("util");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_debug_1 = require("node-opcua-debug");
const node_opcua_factory_1 = require("node-opcua-factory");
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const node_opcua_schemas_1 = require("node-opcua-schemas");
const node_opcua_service_browse_1 = require("node-opcua-service-browse");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const extra_data_type_manager_1 = require("./extra_data_type_manager");
const doDebug = node_opcua_debug_1.checkDebugFlag(__filename);
const debugLog = node_opcua_debug_1.make_debugLog(__filename);
const extraDataTypeManager = new extra_data_type_manager_1.ExtraDataTypeManager();
function extractSchema(session, nodeId) {
    return __awaiter(this, void 0, void 0, function* () {
        const rawSchemaDataValue = yield session.read({ nodeId, attributeId: node_opcua_data_model_1.AttributeIds.Value });
        const rawSchema = rawSchemaDataValue.value.value.toString();
        /* istanbul ignore next */
        if (doDebug) {
            debugLog("---------------------------------------------");
            debugLog(rawSchema.toString());
            debugLog("---------------------------------------------");
        }
        const typeDictionary = yield util_1.promisify(node_opcua_schemas_1.parseBinaryXSD)(rawSchema, [node_opcua_factory_1.getStandartDataTypeFactory()]);
        return typeDictionary;
    });
}
function exploreDataTypeDefinition(session, dataTypeDictionaryTypeNode, typeDictionary, namespaces) {
    return __awaiter(this, void 0, void 0, function* () {
        const nodeToBrowse = {
            browseDirection: node_opcua_service_browse_1.BrowseDirection.Forward,
            includeSubtypes: false,
            nodeClassMask: node_opcua_data_model_1.makeNodeClassMask("Variable"),
            nodeId: dataTypeDictionaryTypeNode,
            referenceTypeId: node_opcua_nodeid_1.resolveNodeId("HasComponent"),
            resultMask: node_opcua_data_model_1.makeResultMask("ReferenceType | IsForward | BrowseName | NodeClass | TypeDefinition")
        };
        const result = yield session.browse(nodeToBrowse);
        const references = result.references || [];
        /* istanbul ignore next */
        if (references.length === 0) {
            return;
        }
        // request the Definition of each nodes
        const nodesToBrowse2 = references.map((ref) => {
            return {
                browseDirection: node_opcua_service_browse_1.BrowseDirection.Inverse,
                includeSubtypes: false,
                nodeClassMask: node_opcua_data_model_1.makeNodeClassMask("Object | Variable"),
                nodeId: ref.nodeId,
                referenceTypeId: node_opcua_nodeid_1.resolveNodeId("HasDescription"),
                resultMask: node_opcua_data_model_1.makeResultMask("NodeId | ReferenceType | BrowseName | NodeClass | TypeDefinition")
            };
        });
        const results2 = yield session.browse(nodesToBrowse2);
        const binaryEncodingNodeIds = results2.map((br) => {
            const defaultBin = br.references.filter((r) => r.browseName.toString() === "Default Binary");
            /* istanbul ignore next */
            if (defaultBin.length < 1) {
                return node_opcua_nodeid_1.ExpandedNodeId;
            }
            return node_opcua_nodeid_1.ExpandedNodeId.fromNodeId(defaultBin[0].nodeId, namespaces[defaultBin[0].nodeId.namespace]);
        });
        const tuples = _.zip(references, binaryEncodingNodeIds);
        for (const [ref, defaultBinary] of tuples) {
            const name = ref.browseName.name.toString();
            const constructor = node_opcua_schemas_1.getOrCreateConstructor(name, typeDictionary, defaultBinary);
            /* istanbul ignore next */
            if (doDebug) {
                // let's verify that constructor is operational
                try {
                    const testObject = new constructor();
                    debugLog(testObject.toString());
                }
                catch (err) {
                    debugLog(err.message);
                }
            }
        }
    });
}
exports.exploreDataTypeDefinition = exploreDataTypeDefinition;
/**
 * Extract all custom dataType
 * @param session
 * @param dataTypeManager
 * @async
 */
function extractNamespaceDataType(session, dataTypeManager) {
    return __awaiter(this, void 0, void 0, function* () {
        // read namespace array
        const dataValueNamespaceArray = yield session.read({
            attributeId: node_opcua_data_model_1.AttributeIds.Value,
            nodeId: node_opcua_nodeid_1.resolveNodeId("Server_NamespaceArray")
        });
        if (dataValueNamespaceArray.statusCode === node_opcua_status_code_1.StatusCodes.Good) {
            dataTypeManager.setNamespaceArray(dataValueNamespaceArray.value.value);
        }
        // DatType/OPCBinary => i=93 [OPCBinarySchema_TypeSystem]
        const opcBinaryNodeId = node_opcua_nodeid_1.resolveNodeId("OPCBinarySchema_TypeSystem");
        // let find all DataType dictionary node corresponding to a given namespace
        // (have DataTypeDictionaryType)
        const nodeToBrowse = {
            browseDirection: node_opcua_service_browse_1.BrowseDirection.Forward,
            includeSubtypes: false,
            nodeClassMask: node_opcua_data_model_1.makeNodeClassMask("Variable"),
            nodeId: opcBinaryNodeId,
            referenceTypeId: node_opcua_nodeid_1.resolveNodeId("HasComponent"),
            resultMask: node_opcua_data_model_1.makeResultMask("ReferenceType | IsForward | BrowseName | NodeClass | TypeDefinition")
        };
        const result = yield session.browse(nodeToBrowse);
        // filter nodes that have the expected namespace Index
        // ( more specifically we want to filter out DataStructure from namespace 0)
        const references = result.references.filter((e) => e.nodeId.namespace !== 0);
        const promises = [];
        const dataTypeDictionaryType = node_opcua_nodeid_1.resolveNodeId("DataTypeDictionaryType");
        function processReference(ref) {
            return __awaiter(this, void 0, void 0, function* () {
                node_opcua_assert_1.assert(ref.typeDefinition.toString() === dataTypeDictionaryType.toString());
                const typeDictionary = yield extractSchema(session, ref.nodeId);
                yield exploreDataTypeDefinition(session, ref.nodeId, typeDictionary, dataTypeManager.namespaceArray);
                dataTypeManager.registerTypeDictionary(ref.nodeId, typeDictionary);
            });
        }
        for (const ref of references) {
            promises.push(processReference(ref));
        }
        yield Promise.all(promises);
    });
}
exports.extractNamespaceDataType = extractNamespaceDataType;
function getDataTypeDefinition(session, dataTypeNodeId, 
// tslint:disable-next-line: no-shadowed-variable
extraDataTypeManager) {
    return __awaiter(this, void 0, void 0, function* () {
        // DataType
        //    | 1
        //    | n
        //    +- HasEncoding-> "Default Binary"
        //                           |
        //                           +-- HasDescription -> "MyItemType"
        //                                                       +- ComponentOf -> Schema
        //
        // Note that in 1.04 compliant server, DataType definition might be available
        //           in a DataTypeDefinition attributes of the DataType object
        //           However this is a brand new aspect of the specification and is not widely implemented
        //           it is also optional
        //           It will takes time for old opcua server to be refurbished and we may have to
        //           keep the current method to access type definition from embedded xsd.
        //
        const nodeToBrowse1 = {
            browseDirection: node_opcua_service_browse_1.BrowseDirection.Forward,
            includeSubtypes: false,
            nodeClassMask: node_opcua_data_model_1.makeNodeClassMask("Object"),
            nodeId: dataTypeNodeId,
            referenceTypeId: node_opcua_nodeid_1.resolveNodeId("HasEncoding"),
            resultMask: node_opcua_data_model_1.makeResultMask("NodeId | ReferenceType | BrowseName | NodeClass | TypeDefinition")
        };
        const result1 = yield session.browse(nodeToBrowse1);
        if (result1.references && result1.references.length > 1) {
            // we have more than one possible Encoding .... only keep "Default Binary"
            result1.references = result1.references.filter((r) => r.browseName.toString() === "Default Binary");
        }
        /* istanbul ignore next */
        if (!(result1.references && result1.references.length === 1)) {
            const nodeClass = yield session.read({
                attributeId: node_opcua_data_model_1.AttributeIds.NodeClass,
                nodeId: dataTypeNodeId
            });
            const browseName = yield session.read({
                attributeId: node_opcua_data_model_1.AttributeIds.BrowseName,
                nodeId: dataTypeNodeId
            });
            // tslint:disable:no-console
            console.log("node-id    :", dataTypeNodeId.toString());
            console.log("nodeClass  :", node_opcua_data_model_1.NodeClass[nodeClass.value.value]);
            console.log("browseName :", browseName.value.value.toString());
            console.log(result1.toString());
            throw new Error("getDataTypeDefinition invalid HasEncoding reference");
        }
        const encodingReference = result1.references[0];
        node_opcua_assert_1.assert(encodingReference.browseName.toString() === "Default Binary");
        // Xx console.log("Has Encoding ", encodingReference.browseName.toString(), encodingReference.nodeId.toString());
        const nodeToBrowse2 = {
            browseDirection: node_opcua_service_browse_1.BrowseDirection.Forward,
            includeSubtypes: false,
            nodeClassMask: node_opcua_data_model_1.makeNodeClassMask("Variable"),
            nodeId: encodingReference.nodeId,
            referenceTypeId: node_opcua_nodeid_1.resolveNodeId("HasDescription"),
            resultMask: node_opcua_data_model_1.makeResultMask("NodeId | ReferenceType | BrowseName | NodeClass | TypeDefinition")
        };
        const result2 = yield session.browse(nodeToBrowse2);
        node_opcua_assert_1.assert(result2.references && result2.references.length === 1);
        const definitionRef = result2.references[0];
        // xx console.log("HasDefinition ", definitionRef.browseName.toString(), definitionRef.nodeId.toString());
        const nameDataValue = yield session.read({
            attributeId: node_opcua_data_model_1.AttributeIds.Value,
            nodeId: definitionRef.nodeId
        });
        const name = nameDataValue.value.value;
        //  xx console.log("name ", name);
        // find parent node to access the xsd File
        const nodeToBrowse3 = {
            browseDirection: node_opcua_service_browse_1.BrowseDirection.Inverse,
            includeSubtypes: false,
            nodeClassMask: node_opcua_data_model_1.makeNodeClassMask("Variable"),
            nodeId: definitionRef.nodeId,
            referenceTypeId: node_opcua_nodeid_1.resolveNodeId("HasComponent"),
            resultMask: node_opcua_data_model_1.makeResultMask("NodeId | ReferenceType | BrowseName | NodeClass | TypeDefinition")
        };
        const result3 = yield session.browse(nodeToBrowse3);
        node_opcua_assert_1.assert(result3.references && result3.references.length === 1);
        const schemaNode = result3.references[0].nodeId;
        let schema;
        if (extraDataTypeManager) {
            const typeDictionary = extraDataTypeManager.getTypeDictionaryForNamespace(schemaNode.namespace);
            schema = typeDictionary.structuredTypes[name];
        }
        else {
            const typeDictionary = yield extractSchema(session, schemaNode);
            schema = typeDictionary.structuredTypes[name];
        }
        // associate DataTypeId with schema if not already done
        if (schema.id.value === 0) {
            schema.id = dataTypeNodeId;
        }
        return schema;
    });
}
exports.getDataTypeDefinition = getDataTypeDefinition;
//# sourceMappingURL=client_dynamic_extension_object.js.map