"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space.AlarmsAndConditions
 */
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const utils = require("node-opcua-utils");
const node_opcua_variant_1 = require("node-opcua-variant");
const ua_discrete_alarm_1 = require("./ua_discrete_alarm");
function isEqual(value1, value2) {
    return value1 === value2;
}
/**
 * The OffNormalAlarmType is a specialization of the DiscreteAlarmType intended to represent a
 * discrete Condition that is considered to be not normal.
 * This sub type is usually used to indicate that a discrete value is in an Alarm state, it is active as
 * long as a non-normal value is present.
 *
 * @class UAOffNormalAlarm
 * @extends UADiscreteAlarm
 * @constructor
 *
 *
 */
class UAOffNormalAlarm extends ua_discrete_alarm_1.UADiscreteAlarm {
    /**
     * @method (static)UAOffNormalAlarm.instantiate
     * @param namespace {Namespace}
     * @param limitAlarmTypeId
     * @param options
     * @param options.inputNode   {NodeId|UAVariable} the input node
     * @param options.normalState {NodeId|UAVariable} the normalStateNode node
     * @param data
     *
     * When the value of inputNode doesn't match the normalState node value, then the alarm is raised.
     *
     */
    static instantiate(namespace, limitAlarmTypeId, options, data) {
        const addressSpace = namespace.addressSpace;
        const offNormalAlarmType = addressSpace.findEventType("OffNormalAlarmType");
        /* istanbul ignore next */
        if (!offNormalAlarmType) {
            throw new Error("cannot find offNormalAlarmType");
        }
        node_opcua_assert_1.assert(options.hasOwnProperty("inputNode"), "must provide inputNode"); // must provide a inputNode
        node_opcua_assert_1.assert(options.hasOwnProperty("normalState"), "must provide a normalState Node"); // must provide a inputNode
        options.optionals = options.optionals || [];
        node_opcua_assert_1.assert(options.hasOwnProperty("inputNode"), "must provide inputNode"); // must provide a inputNode
        const alarmNode = ua_discrete_alarm_1.UADiscreteAlarm.instantiate(namespace, limitAlarmTypeId, options, data);
        Object.setPrototypeOf(alarmNode, UAOffNormalAlarm.prototype);
        const inputNode = addressSpace._coerceNode(options.inputNode);
        //       assert(inputNode, "Expecting a valid input node");
        const normalState = addressSpace._coerceNode(options.normalState);
        //       assert(normalState, "Expecting a valid normalState node");
        const normalStateNodeId = normalState ? normalState.nodeId : node_opcua_nodeid_1.NodeId.nullNodeId;
        alarmNode.normalState.setValueFromSource({ dataType: node_opcua_variant_1.DataType.NodeId, value: normalStateNodeId });
        if (inputNode) {
            // install inputNode Node monitoring for change
            alarmNode._installInputNodeMonitoring(options.inputNode);
        }
        alarmNode.normalState.on("value_changed", (newDataValue /*, oldDataValue: DataValue*/) => {
            // The node that contains the normalState value has changed.
            //   we must remove the listener on current normalState and replace
            //   normalState with the new one and set listener again
            //   to do:
        });
        if (normalState) {
            // install normalState monitoring for change
            normalState.on("value_changed", (newDataValue /*, oldDataValue: DataValue*/) => {
                alarmNode._onNormalStateDataValueChange(newDataValue);
            });
        }
        alarmNode._updateAlarmState();
        return alarmNode;
    }
    // HasProperty Variable NormalState NodeId PropertyType Mandatory
    // The NormalState Property is a Property that points to a Variable which has a value that
    // corresponds to one of the possible values of the Variable pointed to by the InputNode
    // Property where the NormalState Property Variable value is the value that is considered to be
    // the normal state of the Variable pointed to by the InputNode Property. When the value of the
    // Variable referenced by the InputNode Property is not equal to the value of the NormalState
    // Property the Alarm is Active. If this Variable is not in the AddressSpace, a Null NodeId shall
    // be provided.
    getNormalStateNode() {
        const nodeId = this.normalState.readValue().value.value;
        const node = this.addressSpace.findNode(nodeId);
        node_opcua_assert_1.assert(node, "getNormalStateNode ");
        return node;
    }
    /**
     * @method getNormalStateValue
     */
    getNormalStateValue() {
        const normalStateNode = this.getNormalStateNode();
        return normalStateNode.readValue().value.value;
    }
    /**
     * @method setNormalStateValue
     * @param value
     */
    setNormalStateValue(value) {
        const normalStateNode = this.getNormalStateNode();
        throw new Error("Not Implemented yet");
    }
    _updateAlarmState(normalStateValue, inputValue) {
        const alarm = this;
        if (utils.isNullOrUndefined(normalStateValue) || utils.isNullOrUndefined(inputValue)) {
            this.activeState.setValue(false);
            return;
        }
        const isActive = !isEqual(normalStateValue, inputValue);
        if (isActive === alarm.activeState.getValue()) {
            // no change => ignore !
            return;
        }
        const stateName = isActive ? "Active" : "Inactive";
        // also raise the event
        alarm._signalNewCondition(stateName, isActive, "");
    }
    _onInputDataValueChange(dataValue) {
        if (dataValue.statusCode !== node_opcua_status_code_1.StatusCodes.Good) {
            // what shall we do ?
            return;
        }
        if (dataValue.value.dataType === node_opcua_variant_1.DataType.Null) {
            // what shall we do ?
            return;
        }
        const inputValue = dataValue.value.value;
        const normalStateValue = this.getNormalStateValue();
        this._updateAlarmState(normalStateValue, inputValue);
    }
    _onNormalStateDataValueChange(dataValue) {
        if (dataValue.statusCode !== node_opcua_status_code_1.StatusCodes.Good) {
            // what shall we do ?
            return;
        }
        if (dataValue.value.dataType === node_opcua_variant_1.DataType.Null) {
            // what shall we do ?
            return;
        }
        const normalStateValue = dataValue.value.value;
        const inputValue = this.getInputNodeValue();
        this._updateAlarmState(normalStateValue, inputValue);
    }
}
exports.UAOffNormalAlarm = UAOffNormalAlarm;
//# sourceMappingURL=ua_off_normal_alarm.js.map