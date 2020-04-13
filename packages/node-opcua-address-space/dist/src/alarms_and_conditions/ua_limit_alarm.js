"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space.AlarmsAndConditions
 */
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_data_value_1 = require("node-opcua-data-value");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const node_opcua_variant_1 = require("node-opcua-variant");
const ua_alarm_condition_base_1 = require("./ua_alarm_condition_base");
class UALimitAlarm extends ua_alarm_condition_base_1.UAAlarmConditionBase {
    /**
     * @method (static)UALimitAlarm.instantiate
     * @param namespace {Namespace}
     * @param limitAlarmTypeId
     * @param options
     * @param options.inputNode
     * @param options.optionals
     * @param options.highHighLimit {Double}
     * @param options.highLimit     {Double}
     * @param options.lowLimit      {Double}
     * @param options.lowLowLimit   {Double}
     * @param data
     * @return {UALimitAlarm}
     */
    static instantiate(namespace, limitAlarmTypeId, options, data) {
        const addressSpace = namespace.addressSpace;
        /* eslint max-instructions: off */
        // must provide a inputNode
        // xx assert(options.hasOwnProperty("conditionOf")); // must provide a conditionOf
        node_opcua_assert_1.assert(options.hasOwnProperty("inputNode"), "UALimitAlarm.instantiate: options must provide the inputNode");
        options.optionals = options.optionals || [];
        let count = 0;
        if (options.hasOwnProperty("highHighLimit")) {
            options.optionals.push("HighHighLimit");
            options.optionals.push("HighHighState");
            count++;
        }
        if (options.hasOwnProperty("highLimit")) {
            options.optionals.push("HighLimit");
            options.optionals.push("HighState");
            count++;
        }
        if (options.hasOwnProperty("lowLimit")) {
            options.optionals.push("LowLimit");
            options.optionals.push("LowState");
            count++;
        }
        if (options.hasOwnProperty("lowLowLimit")) {
            options.optionals.push("LowLowLimit");
            options.optionals.push("LowLowState");
            count++;
        }
        // xx assert(options.optionals,"must provide an optionals");
        const alarmNode = ua_alarm_condition_base_1.UAAlarmConditionBase.instantiate(namespace, limitAlarmTypeId, options, data);
        Object.setPrototypeOf(alarmNode, UALimitAlarm.prototype);
        node_opcua_assert_1.assert(alarmNode.conditionOfNode() !== null);
        const inputNode = addressSpace._coerceNode(options.inputNode);
        if (!inputNode) {
            throw new Error("Expecting a valid input node");
        }
        node_opcua_assert_1.assert(inputNode.nodeClass === node_opcua_data_model_1.NodeClass.Variable);
        // ----------------------- Install Limit Alarm specifics
        // from spec 1.03:
        // Four optional limits are defined that configure the states of the derived limit Alarm Types.
        // These Properties shall be set for any Alarm limits that are exposed by the derived limit Alarm
        // Types. These Properties are listed as optional but at least one is required. For cases where
        // an underlying system cannot provide the actual value of a limit, the limit Property shall still be
        // provided, but will have its AccessLevel set to not readable. It is assumed that the limits are
        // described using the same Engineering Unit that is assigned to the variable that is the source
        // of the alarm. For Rate of change limit alarms, it is assumed this rate is units per second
        // unless otherwise specified.
        if (count === 0) {
            throw new Error("at least one limit is required");
        }
        const dataType = addressSpace.findCorrespondingBasicDataType(options.inputNode.dataType);
        alarmNode._dataType = dataType;
        if (options.hasOwnProperty("highHighLimit")) {
            alarmNode.setHighHighLimit(options.highHighLimit);
        }
        if (options.hasOwnProperty("highLimit")) {
            alarmNode.setHighLimit(options.highLimit);
        }
        if (options.hasOwnProperty("lowLimit")) {
            alarmNode.setLowLimit(options.lowLimit);
        }
        if (options.hasOwnProperty("lowLowLimit")) {
            alarmNode.setLowLowLimit(options.lowLowLimit);
        }
        /*
         * The InputNode Property provides the NodeId of the Variable the Value of which is used as
         * primary input in the calculation of the Alarm state. If this Variable is not in the AddressSpace,
         * a Null NodeId shall be provided. In some systems, an Alarm may be calculated based on
         * multiple Variables Values; it is up to the system to determine which Variable’s NodeId is used.
         */
        node_opcua_assert_1.assert(alarmNode.inputNode.nodeClass === node_opcua_data_model_1.NodeClass.Variable);
        alarmNode.inputNode.setValueFromSource({ dataType: "NodeId", value: inputNode.nodeId });
        // install inputNode monitoring for change
        alarmNode._installInputNodeMonitoring(options.inputNode);
        alarmNode._watchLimits();
        return alarmNode;
    }
    /**
     * @method getHighHighLimit
     * @return {Number}
     */
    getHighHighLimit() {
        if (!this.highHighLimit) {
            throw new Error("Alarm do not expose highHighLimit");
        }
        return this.highHighLimit.readValue().value.value;
    }
    /**
     * @method getHighLimit
     * @return {Number}
     */
    getHighLimit() {
        if (!this.highLimit) {
            throw new Error("Alarm do not expose highLimit");
        }
        return this.highLimit.readValue().value.value;
    }
    /**
     * @method getLowLimit
     * @return {Float}
     */
    getLowLimit() {
        if (!this.lowLimit) {
            throw new Error("Alarm do not expose lowLimit");
        }
        return this.lowLimit.readValue().value.value;
    }
    /**
     * @method getLowLowLimit
     * @return {Float}
     */
    getLowLowLimit() {
        if (!this.lowLowLimit) {
            throw new Error("Alarm do not expose lowLowLimit");
        }
        return this.lowLowLimit.readValue().value.value;
    }
    /**
     * @method setHighHighLimit
     * @param value {Float}
     */
    setHighHighLimit(value) {
        if (!this.highHighLimit) {
            throw new Error("LimitAlarm instance must expose the optional HighHighLimit property");
        }
        this.highHighLimit.setValueFromSource({ dataType: this._dataType, value });
    }
    /**
     * @method setHighLimit
     * @param value {Float}
     */
    setHighLimit(value) {
        if (!this.highLimit) {
            throw new Error("LimitAlarm instance must expose the optional HighLimit property");
        }
        this.highLimit.setValueFromSource({ dataType: this._dataType, value });
    }
    /**
     * @method setLowLimit
     * @param value {Float}
     */
    setLowLimit(value) {
        if (!this.lowLimit) {
            throw new Error("LimitAlarm instance must expose the optional LowLimit property");
        }
        this.lowLimit.setValueFromSource({ dataType: this._dataType, value });
    }
    /**
     * @method setLowLowLimit
     * @param value {Float}
     */
    setLowLowLimit(value) {
        if (!this.lowLowLimit) {
            throw new Error("LimitAlarm instance must expose the optional LowLowLimit property");
        }
        this.lowLowLimit.setValueFromSource({ dataType: this._dataType, value });
    }
    _onInputDataValueChange(dataValue) {
        node_opcua_assert_1.assert(dataValue instanceof node_opcua_data_value_1.DataValue);
        if (dataValue.statusCode === node_opcua_status_code_1.StatusCodes.BadWaitingForInitialData
            && dataValue.statusCode === node_opcua_status_code_1.StatusCodes.UncertainInitialValue) {
            // we are not ready yet to use the input node value
            return;
        }
        if (dataValue.statusCode !== node_opcua_status_code_1.StatusCodes.Good) {
            // what shall we do ?
            this._signalNewCondition(null);
            return;
        }
        if (dataValue.value.dataType === node_opcua_variant_1.DataType.Null) {
            // what shall we do ?
            this._signalNewCondition(null);
            return;
        }
        const value = dataValue.value.value;
        this._setStateBasedOnInputValue(value);
    }
    _setStateBasedOnInputValue(value) {
        throw new Error("_setStateBasedOnInputValue must be overriden");
    }
    _watchLimits() {
        /// ----------------------------------------------------------------------
        /// Installing Limits monitored
        const _updateState = () => this.updateState();
        if (this.highHighLimit) {
            this.highHighLimit.on("value_changed", _updateState);
        }
        if (this.highLimit) {
            this.highLimit.on("value_changed", _updateState);
        }
        if (this.lowLimit) {
            this.lowLimit.on("value_changed", _updateState);
        }
        if (this.lowLowLimit) {
            this.lowLowLimit.on("value_changed", _updateState);
        }
    }
    evaluateConditionsAfterEnabled() {
        node_opcua_assert_1.assert(this.getEnabledState() === true);
        // simulate input value event
        const input = this.getInputNodeNode();
        if (!input) {
            return;
        }
        const dataValue = input.readValue();
        this._onInputDataValueChange(dataValue);
    }
}
exports.UALimitAlarm = UALimitAlarm;
//# sourceMappingURL=ua_limit_alarm.js.map