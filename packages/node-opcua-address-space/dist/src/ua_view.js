"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space
 */
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_data_model_2 = require("node-opcua-data-model");
const node_opcua_data_value_1 = require("node-opcua-data-value");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const node_opcua_variant_1 = require("node-opcua-variant");
const base_node_1 = require("./base_node");
const session_context_1 = require("./session_context");
class UAView extends base_node_1.BaseNode {
    constructor(options) {
        super(options);
        this.nodeClass = node_opcua_data_model_1.NodeClass.View;
        this.containsNoLoops = !!options.containsNoLoops;
        this.eventNotifier = 0;
    }
    readAttribute(context, attributeId) {
        node_opcua_assert_1.assert(context instanceof session_context_1.SessionContext);
        const options = {};
        switch (attributeId) {
            case node_opcua_data_model_2.AttributeIds.EventNotifier:
                options.value = { dataType: node_opcua_variant_1.DataType.UInt32, value: this.eventNotifier };
                options.statusCode = node_opcua_status_code_1.StatusCodes.Good;
                break;
            case node_opcua_data_model_2.AttributeIds.ContainsNoLoops:
                options.value = { dataType: node_opcua_variant_1.DataType.Boolean, value: this.containsNoLoops };
                options.statusCode = node_opcua_status_code_1.StatusCodes.Good;
                break;
            default:
                return super.readAttribute(context, attributeId);
        }
        return new node_opcua_data_value_1.DataValue(options);
    }
}
exports.UAView = UAView;
//# sourceMappingURL=ua_view.js.map