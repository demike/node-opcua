"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space
 */
const chalk_1 = require("chalk");
const _ = require("underscore");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_data_model_2 = require("node-opcua-data-model");
const node_opcua_data_value_1 = require("node-opcua-data-value");
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const node_opcua_numeric_range_1 = require("node-opcua-numeric-range");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const node_opcua_variant_1 = require("node-opcua-variant");
const source_1 = require("../source");
const base_node_1 = require("./base_node");
const base_node_private_1 = require("./base_node_private");
const tools = require("./tool_isSupertypeOf");
const tool_isSupertypeOf_1 = require("./tool_isSupertypeOf");
const tool_isSupertypeOf_2 = require("./tool_isSupertypeOf");
class UADataType extends base_node_1.BaseNode {
    constructor(options) {
        super(options);
        this.nodeClass = node_opcua_data_model_1.NodeClass.DataType;
        this.definitionName = "";
        this.isSupertypeOf = tools.construct_isSupertypeOf(UADataType);
        this.definition_name = options.definition_name || "<UNKNOWN>";
        this.definition = options.definition || [];
        this.isAbstract = (options.isAbstract === null) ? false : options.isAbstract;
    }
    /**
     * returns true if this is a super type of baseType
     *
     * @example
     *
     *    var dataTypeDouble = addressSpace.findDataType("Double");
     *    var dataTypeNumber = addressSpace.findDataType("Number");
     *    assert(dataTypeDouble.isSupertypeOf(dataTypeNumber));
     *    assert(!dataTypeNumber.isSupertypeOf(dataTypeDouble));
     *
     */
    get subtypeOf() {
        return tool_isSupertypeOf_1.get_subtypeOf.call(this);
    }
    get subtypeOfObj() {
        return tool_isSupertypeOf_2.get_subtypeOfObj.call(this);
    }
    readAttribute(context, attributeId) {
        node_opcua_assert_1.assert(!context || context instanceof source_1.SessionContext);
        const options = {};
        switch (attributeId) {
            case node_opcua_data_model_2.AttributeIds.IsAbstract:
                options.statusCode = node_opcua_status_code_1.StatusCodes.Good;
                options.value = { dataType: node_opcua_variant_1.DataType.Boolean, value: !!this.isAbstract };
                break;
            default:
                return super.readAttribute(context, attributeId);
        }
        return new node_opcua_data_value_1.DataValue(options);
    }
    getEncodingNode(encoding_name) {
        node_opcua_assert_1.assert(encoding_name === "Default Binary" || encoding_name === "Default Xml");
        // could be binary or xml
        const refs = this.findReferences("HasEncoding", true);
        const addressSpace = this.addressSpace;
        const encoding = refs
            .map((ref) => addressSpace.findNode(ref.nodeId))
            .filter((obj) => obj !== null)
            .filter((obj) => obj.browseName.toString() === encoding_name);
        return encoding.length === 0 ? null : encoding[0];
    }
    /**
     * returns the encoding of this node's
     * TODO objects have 2 encodings : XML and Binaries
     */
    get binaryEncodingNodeId() {
        const _cache = base_node_1.BaseNode._getCache(this);
        if (!_cache.binaryEncodingNodeId) {
            const encoding = this.getEncodingNode("Default Binary");
            if (encoding) {
                const namespaceUri = this.addressSpace.getNamespaceUri(encoding.nodeId.namespace);
                _cache.binaryEncodingNodeId = node_opcua_nodeid_1.ExpandedNodeId.fromNodeId(encoding.nodeId, namespaceUri);
            }
            else {
                _cache.binaryEncodingNodeId = null;
            }
        }
        return _cache.binaryEncodingNodeId;
    }
    get binaryEncoding() {
        const _cache = base_node_1.BaseNode._getCache(this);
        if (!_cache.binaryEncodingNode) {
            _cache.binaryEncodingNode = this.__findReferenceWithBrowseName("HasEncoding", "Default Binary");
            // also add namespaceUri
        }
        return _cache.binaryEncodingNode;
    }
    get binaryEncodingDefinition() {
        const indexRange = new node_opcua_numeric_range_1.NumericRange();
        const descriptionNode = this.binaryEncoding.findReferencesAsObject("HasDescription")[0];
        const structureVar = descriptionNode.findReferencesAsObject("HasComponent", false)[0];
        const dataValue = structureVar.readValue(source_1.SessionContext.defaultContext, indexRange);
        // xx if (!dataValue || !dataValue.value || !dataValue.value.value) { return "empty";}
        return dataValue.value.value.toString();
    }
    get xmlEncoding() {
        const _cache = base_node_1.BaseNode._getCache(this);
        if (!_cache.xmlEncodingNode) {
            _cache.xmlEncodingNode = this.__findReferenceWithBrowseName("HasEncoding", "Default XML");
        }
        return _cache.xmlEncodingNode;
    }
    get xmlEncodingNodeId() {
        const _cache = base_node_1.BaseNode._getCache(this);
        if (!_cache.xmlEncodingNodeId) {
            const encoding = this.getEncodingNode("Default Xml");
            if (encoding) {
                const namespaceUri = this.addressSpace.getNamespaceUri(encoding.nodeId.namespace);
                _cache.xmlEncodingNodeId = node_opcua_nodeid_1.ExpandedNodeId.fromNodeId(encoding.nodeId, namespaceUri);
            }
            else {
                _cache.xmlEncodingNodeId = null;
            }
        }
        return _cache.xmlEncodingNodeId;
    }
    get xmlEncodingDefinition() {
        const indexRange = new node_opcua_numeric_range_1.NumericRange();
        const descriptionNode = this.xmlEncoding.findReferencesAsObject("HasDescription")[0];
        const structureVar = descriptionNode.findReferencesAsObject("HasComponent", false)[0];
        const dataValue = structureVar.readValue(source_1.SessionContext.defaultContext, indexRange);
        if (!dataValue || !dataValue.value || !dataValue.value.value) {
            return "empty";
        }
        return dataValue.value.value.toString();
    }
    _getDefinition() {
        let definition = [];
        if (this.enumStrings) {
            const enumStrings = this.enumStrings.readValue().value.value;
            node_opcua_assert_1.assert(_.isArray(enumStrings));
            definition = enumStrings.map((e, index) => {
                return {
                    name: e.text,
                    value: index
                };
            });
        }
        else if (this.enumValues) {
            node_opcua_assert_1.assert(this.enumValues, "must have a enumValues property");
            const enumValues = this.enumValues.readValue().value.value;
            node_opcua_assert_1.assert(_.isArray(enumValues));
            definition = _.map(enumValues, (e) => {
                return {
                    name: e.displayName.text,
                    value: e.value[1]
                };
            });
        }
        // construct nameIndex and valueIndex
        const indexes = {
            nameIndex: {},
            valueIndex: {}
        };
        definition.forEach((e) => {
            indexes.nameIndex[e.name] = e;
            indexes.valueIndex[e.value] = e;
        });
        return indexes;
    }
    install_extra_properties() {
        //
    }
    toString() {
        const options = new base_node_private_1.ToStringBuilder();
        DataType_toString.call(this, options);
        return options.toString();
    }
}
exports.UADataType = UADataType;
function dataTypeDefinition_toString(options) {
    const indexes = this._getDefinition();
    const output = JSON.stringify(indexes, null, " ");
    options.add(options.padding + chalk_1.default.yellow("                              :  definition "));
    for (const str of output.split("\n")) {
        options.add(options.padding + chalk_1.default.yellow("                              :   " + str));
    }
}
function DataType_toString(options) {
    base_node_private_1.BaseNode_toString.call(this, options);
    options.add(options.padding + chalk_1.default.yellow("          isAbstract          : " + this.isAbstract));
    options.add(options.padding + chalk_1.default.yellow("          definitionName      : " + this.definitionName));
    options.add(options.padding + chalk_1.default.yellow("          binaryEncodingNodeId: ") +
        (this.binaryEncodingNodeId ? this.binaryEncodingNodeId.toString() : "<none>"));
    options.add(options.padding + chalk_1.default.yellow("          xmlEncodingNodeId   : ") +
        (this.xmlEncodingNodeId ? this.xmlEncodingNodeId.toString() : "<none>"));
    if (this.subtypeOfObj) {
        options.add(options.padding + chalk_1.default.yellow("          subtypeOfObj        : ") +
            (this.subtypeOfObj ? this.subtypeOfObj.browseName.toString() : ""));
    }
    dataTypeDefinition_toString.call(this, options);
}
exports.DataType_toString = DataType_toString;
//# sourceMappingURL=ua_data_type.js.map