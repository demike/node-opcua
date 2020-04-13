"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space.AlarmsAndConditions
 */
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const node_opcua_variant_1 = require("node-opcua-variant");
function DeviationAlarmHelper_getSetpointNodeNode() {
    node_opcua_assert_1.assert(this.setpointNode.readValue().value.dataType === node_opcua_variant_1.DataType.NodeId);
    const nodeId = this.setpointNode.readValue().value.value;
    const node = this.addressSpace.findNode(nodeId);
    node_opcua_assert_1.assert(node === this.setpointNodeNode);
    return this.setpointNodeNode;
}
exports.DeviationAlarmHelper_getSetpointNodeNode = DeviationAlarmHelper_getSetpointNodeNode;
function DeviationAlarmHelper_getSetpointValue() {
    node_opcua_assert_1.assert(this.hasOwnProperty("setpointNode"));
    node_opcua_assert_1.assert(this.hasOwnProperty("setpointNodeNode"));
    const setpointDataValue = this.setpointNodeNode.readValue();
    if (setpointDataValue.statusCode !== node_opcua_status_code_1.StatusCodes.Good) {
        return null;
    }
    return this.getSetpointNodeNode().readValue().value.value;
}
exports.DeviationAlarmHelper_getSetpointValue = DeviationAlarmHelper_getSetpointValue;
function DeviationAlarmHelper_onSetpointDataValueChange(dataValue) {
    this._setStateBasedOnInputValue(this.getInputNodeValue());
}
exports.DeviationAlarmHelper_onSetpointDataValueChange = DeviationAlarmHelper_onSetpointDataValueChange;
function DeviationAlarmHelper_install_setpoint(options) {
    // must provide a set point property
    node_opcua_assert_1.assert(options.hasOwnProperty("setpointNode"), "must provide a setpointNode");
    const addressSpace = this.addressSpace;
    const setpointNodeNode = addressSpace._coerceNode(options.setpointNode);
    node_opcua_assert_1.assert(setpointNodeNode, "Expecting a valid setpoint node");
    node_opcua_assert_1.assert(this.setpointNode.browseName.toString() === "SetpointNode");
    this.setpointNodeNode = addressSpace._coerceNode(options.setpointNode);
    this.setpointNode.setValueFromSource({ dataType: "NodeId", value: this.setpointNodeNode.nodeId });
    // install inputNode monitoring for change
    this.setpointNodeNode.on("value_changed", (newDataValue) => {
        this._onSetpointDataValueChange(newDataValue);
    });
}
exports.DeviationAlarmHelper_install_setpoint = DeviationAlarmHelper_install_setpoint;
//# sourceMappingURL=deviation_alarm_helper.js.map