"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space.AlarmsAndConditions
 */
const node_opcua_assert_1 = require("node-opcua-assert");
const _ = require("underscore");
const finite_state_machine_1 = require("../state_machine/finite_state_machine");
const ua_limit_alarm_1 = require("./ua_limit_alarm");
const validState = ["HighHigh", "High", "Low", "LowLow", null];
class UAExclusiveLimitAlarm extends ua_limit_alarm_1.UALimitAlarm {
    /***
     *
     * @method (static)instantiate
     * @param namespace {Namespace}
     * @param type
     * @param options
     * @param data
     * @return {UAExclusiveLimitAlarm}
     */
    static instantiate(namespace, type, options, data) {
        const addressSpace = namespace.addressSpace;
        const exclusiveAlarmType = addressSpace.findEventType(type);
        /* istanbul ignore next */
        if (!exclusiveAlarmType) {
            throw new Error(" cannot find Alarm Condition Type for " + type);
        }
        const exclusiveLimitAlarmType = addressSpace.findEventType("ExclusiveLimitAlarmType");
        /* istanbul ignore next */
        if (!exclusiveLimitAlarmType) {
            throw new Error("cannot find ExclusiveLimitAlarmType");
        }
        const node = ua_limit_alarm_1.UALimitAlarm.instantiate(namespace, type, options, data);
        Object.setPrototypeOf(node, UAExclusiveLimitAlarm.prototype);
        const alarm = node;
        node_opcua_assert_1.assert(alarm instanceof UAExclusiveLimitAlarm);
        node_opcua_assert_1.assert(alarm instanceof ua_limit_alarm_1.UALimitAlarm);
        // ---------------- install LimitState StateMachine
        node_opcua_assert_1.assert(alarm.limitState, "limitState is mandatory");
        finite_state_machine_1.promoteToStateMachine(alarm.limitState);
        // start with a inactive state
        alarm.activeState.setValue(false);
        alarm.updateState();
        return alarm;
    }
    _signalNewCondition(stateName, isActive, value) {
        node_opcua_assert_1.assert(stateName === null || typeof isActive === "boolean");
        node_opcua_assert_1.assert(validState.indexOf(stateName) >= 0, "must have a valid state : " + stateName);
        const oldState = this.limitState.getCurrentState();
        const oldActive = this.activeState.getValue();
        if (stateName) {
            this.limitState.setState(stateName);
        }
        else {
            node_opcua_assert_1.assert(stateName === null);
            this.limitState.setState(stateName);
        }
        super._signalNewCondition(stateName, isActive, value);
    }
    _setStateBasedOnInputValue(value) {
        node_opcua_assert_1.assert(_.isFinite(value));
        let isActive = false;
        let state = null;
        const oldState = this.limitState.getCurrentState();
        if (this.highHighLimit && this.getHighHighLimit() < value) {
            state = "HighHigh";
            isActive = true;
        }
        else if (this.highLimit && this.getHighLimit() < value) {
            state = "High";
            isActive = true;
        }
        else if (this.lowLowLimit && this.getLowLowLimit() > value) {
            state = "LowLow";
            isActive = true;
        }
        else if (this.lowLimit && this.getLowLimit() > value) {
            state = "Low";
            isActive = true;
        }
        if (state !== oldState) {
            this._signalNewCondition(state, isActive, value);
        }
    }
}
exports.UAExclusiveLimitAlarm = UAExclusiveLimitAlarm;
//# sourceMappingURL=ua_exclusive_limit_alarm.js.map