"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space.Private
 */
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const node_opcua_service_translate_browse_path_1 = require("node-opcua-service-translate-browse-path");
const node_opcua_types_1 = require("node-opcua-types");
const node_opcua_variant_1 = require("node-opcua-variant");
/**
 * @class EventData
 * @param eventTypeNode {BaseNode}
 * @constructor
 */
class EventData {
    constructor(eventTypeNode) {
        this.__nodes = {};
        this.eventId = node_opcua_nodeid_1.NodeId.nullNodeId;
        this.$eventDataSource = eventTypeNode;
    }
    /**
     * @method resolveSelectClause
     * @param selectClause {SimpleAttributeOperand}
     * @return {NodeId|null}
     */
    resolveSelectClause(selectClause) {
        const self = this;
        node_opcua_assert_1.assert(selectClause instanceof node_opcua_types_1.SimpleAttributeOperand);
        const addressSpace = self.$eventDataSource.addressSpace;
        if (selectClause.browsePath.length === 0 && selectClause.attributeId === node_opcua_data_model_1.AttributeIds.NodeId) {
            node_opcua_assert_1.assert(!"Cannot use resolveSelectClause on this selectClause as it has no browsePath");
        }
        // navigate to the innerNode specified by the browsePath [ QualifiedName]
        const browsePath = node_opcua_service_translate_browse_path_1.constructBrowsePathFromQualifiedName(self.$eventDataSource, selectClause.browsePath);
        // xx console.log(self.$eventDataSource.browseName.toString());
        // xx console.log("xx browse Path", browsePath.toString());
        const browsePathResult = addressSpace.browsePath(browsePath);
        // xx console.log(" br",
        //    self.$eventDataSource.nodeId.toString(),
        //    selectClause.browsePath.toString(),
        //    browsePathResult.targets[0] ? browsePathResult.targets[0].targetId.toString() : "!!!NOT FOUND!!!"é)
        if (browsePathResult.statusCode !== node_opcua_status_code_1.StatusCodes.Good) {
            return null;
        }
        if (!browsePathResult.targets) {
            return null;
        }
        // istanbul ignore next
        if (browsePathResult.targets.length !== 1) {
            // xx console.log("selectClause ",selectClause.toString());
            // xx console.log("browsePathResult ",browsePathResult.toString());
            // xx throw new Error("browsePathResult.targets.length !== 1"  + browsePathResult.targets.length);
        }
        return browsePathResult.targets[0].targetId;
    }
    setValue(lowerName, node, variant) {
        const eventData = this;
        eventData[lowerName] = node_opcua_variant_1.Variant.coerce(variant); /// _coerceVariant(variant);
        eventData.__nodes[node.nodeId.toString()] = eventData[lowerName];
    }
    /**
     * @method readValue
     * @param nodeId {NodeId}
     * @param selectClause {SimpleAttributeOperand}
     * @return {Variant}
     */
    readValue(nodeId, selectClause) {
        node_opcua_assert_1.assert(nodeId instanceof node_opcua_nodeid_1.NodeId);
        node_opcua_assert_1.assert(selectClause instanceof node_opcua_types_1.SimpleAttributeOperand);
        const self = this;
        node_opcua_assert_1.assert(nodeId instanceof node_opcua_nodeid_1.NodeId);
        const addressSpace = this.$eventDataSource.addressSpace;
        const node = addressSpace.findNode(nodeId);
        const key = node.nodeId.toString();
        // if the value exists in cache ... we read it from cache...
        const cached_value = self.__nodes[key];
        if (cached_value) {
            return cached_value;
        }
        if (node.nodeClass === node_opcua_data_model_1.NodeClass.Variable && selectClause.attributeId === node_opcua_data_model_1.AttributeIds.Value) {
            const nodeVariable = node;
            return prepare(nodeVariable.readValue(null, selectClause.indexRange));
        }
        return prepare(node.readAttribute(null, selectClause.attributeId));
    }
}
exports.EventData = EventData;
function prepare(dataValue) {
    if (dataValue.statusCode === node_opcua_status_code_1.StatusCodes.Good) {
        return dataValue.value;
    }
    return new node_opcua_variant_1.Variant({ dataType: node_opcua_variant_1.DataType.StatusCode, value: dataValue.statusCode });
}
//# sourceMappingURL=event_data.js.map