"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space.AlarmsAndConditions
 */
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_variant_1 = require("node-opcua-variant");
const ua_object_1 = require("../ua_object");
/**
 * @class BaseEventType
 * @class UAObject
 * @constructor
 */
class BaseEventType extends ua_object_1.UAObject {
    /**
     * @method setSourceName
     * @param name
     */
    setSourceName(name) {
        node_opcua_assert_1.assert(typeof name === "string");
        const self = this;
        self.sourceName.setValueFromSource(new node_opcua_variant_1.Variant({
            dataType: node_opcua_variant_1.DataType.String,
            value: name
        }));
    }
    /**
     * @method setSourceNode
     * @param node {NodeId|UAObject}
     */
    setSourceNode(node) {
        const self = this;
        self.sourceNode.setValueFromSource(new node_opcua_variant_1.Variant({
            dataType: node_opcua_variant_1.DataType.NodeId,
            value: node.nodeId ? node.nodeId : node
        }));
    }
}
exports.BaseEventType = BaseEventType;
//# sourceMappingURL=base_event_type.js.map