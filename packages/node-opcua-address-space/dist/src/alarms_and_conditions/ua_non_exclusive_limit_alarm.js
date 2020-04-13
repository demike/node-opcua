"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space.AlarmsAndConditions
 */
const _ = require("underscore");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const ua_two_state_variable_1 = require("../ua_two_state_variable");
const condition_info_1 = require("./condition_info");
const ua_limit_alarm_1 = require("./ua_limit_alarm");
/***
 * @class  UANonExclusiveLimitAlarm
 * @extends UALimitAlarm
 * @constructor
 */
class UANonExclusiveLimitAlarm extends ua_limit_alarm_1.UALimitAlarm {
    /**
     * @method (static)instantiate
     * @param namespace {Namespace}
     * @param type
     * @param options
     * @param data
     * @return {UANonExclusiveLimitAlarm}
     */
    static instantiate(namespace, type, options, data) {
        const addressSpace = namespace.addressSpace;
        options.optionals = options.optionals || [];
        if (options.hasOwnProperty("lowLowLimit")) {
            options.optionals.push("LowLowLimit");
            options.optionals.push("LowLowState");
        }
        if (options.hasOwnProperty("lowLimit")) {
            options.optionals.push("LowLimit");
            options.optionals.push("LowState");
        }
        if (options.hasOwnProperty("highLimit")) {
            options.optionals.push("HighLimit");
            options.optionals.push("HighState");
        }
        if (options.hasOwnProperty("highHighLimit")) {
            options.optionals.push("HighHighLimit");
            options.optionals.push("HighHighState");
        }
        const nonExclusiveAlarmType = addressSpace.findEventType(type);
        /* istanbul ignore next */
        if (!nonExclusiveAlarmType) {
            throw new Error(" cannot find Alarm Condition Type for " + type);
        }
        const nonExclusiveLimitAlarmType = addressSpace.findEventType("NonExclusiveLimitAlarmType");
        /* istanbul ignore next */
        if (!nonExclusiveLimitAlarmType) {
            throw new Error("cannot find NonExclusiveLimitAlarmType");
        }
        // assert(type nonExclusiveLimitAlarmType.browseName.toString());
        const alarm = ua_limit_alarm_1.UALimitAlarm.instantiate(namespace, type, options, data);
        Object.setPrototypeOf(alarm, UANonExclusiveLimitAlarm.prototype);
        node_opcua_assert_1.assert(alarm instanceof ua_limit_alarm_1.UALimitAlarm);
        node_opcua_assert_1.assert(alarm instanceof UANonExclusiveLimitAlarm);
        // ---------------- install States
        if (alarm.lowLowState) {
            ua_two_state_variable_1._install_TwoStateVariable_machinery(alarm.lowLowState, {
                falseState: "LowLow inactive",
                trueState: "LowLow active"
            });
            alarm.lowLowState.setValue(false);
            node_opcua_assert_1.assert(alarm.hasOwnProperty("lowLowLimit"));
        }
        if (alarm.lowState) {
            ua_two_state_variable_1._install_TwoStateVariable_machinery(alarm.lowState, {
                falseState: "Low inactive",
                trueState: "Low active"
            });
            alarm.lowState.setValue(false);
            node_opcua_assert_1.assert(alarm.hasOwnProperty("lowLimit"));
        }
        if (alarm.highState) {
            ua_two_state_variable_1._install_TwoStateVariable_machinery(alarm.highState, {
                falseState: "High inactive",
                trueState: "High active"
            });
            alarm.highState.setValue(false);
            node_opcua_assert_1.assert(alarm.hasOwnProperty("highLimit"));
        }
        if (alarm.highHighState) {
            ua_two_state_variable_1._install_TwoStateVariable_machinery(alarm.highHighState, {
                falseState: "HighHigh inactive",
                trueState: "HighHigh active"
            });
            alarm.highHighState.setValue(false);
            node_opcua_assert_1.assert(alarm.hasOwnProperty("highHighLimit"));
        }
        alarm.activeState.setValue(false);
        alarm.updateState();
        return alarm;
    }
    _calculateConditionInfo(states, isActive, value, oldConditionInfo) {
        if (!isActive) {
            return new condition_info_1.ConditionInfo({
                message: "Back to normal",
                quality: node_opcua_status_code_1.StatusCodes.Good,
                retain: true,
                severity: 0
            });
        }
        else {
            // build-up state string
            let state_str = Object.keys(states).map((s) => {
                return states[s] === true ? s : null;
            }).filter((a) => !!a).join(";"); //
            state_str = JSON.stringify(states);
            return new condition_info_1.ConditionInfo({
                message: "Condition value is " + value + " and state is " + state_str,
                quality: node_opcua_status_code_1.StatusCodes.Good,
                retain: true,
                severity: 150
            });
        }
    }
    _signalNewCondition(states, isActive, value) {
        const alarm = this;
        if (!states) {
            return;
        }
        function _install(name) {
            if (states[name] !== "unset") {
                alarm[name + "State"].setValue(states[name]);
            }
        }
        _install("highHigh");
        _install("high");
        _install("low");
        _install("lowLow");
        ua_limit_alarm_1.UALimitAlarm.prototype._signalNewCondition.call(this, states, isActive, value);
    }
    _setStateBasedOnInputValue(value) {
        node_opcua_assert_1.assert(_.isFinite(value), "expecting a valid value here");
        const alarm = this;
        let isActive = false;
        const states = {
            highHigh: alarm.highHighState ? alarm.highHighState.getValue() : "unset",
            high: alarm.highState ? alarm.highState.getValue() : "unset",
            low: alarm.lowState ? alarm.lowState.getValue() : "unset",
            lowLow: alarm.lowLowState ? alarm.lowLowState.getValue() : "unset"
        };
        let count = 0;
        function ___p(stateName, func_value) {
            if (states[stateName] !== "unset") {
                const val = func_value();
                isActive = isActive || val;
                if (states[stateName] !== val) {
                    states[stateName] = val;
                    count += 1;
                }
            }
        }
        ___p("highHigh", () => {
            return alarm.getHighHighLimit() < value;
        });
        ___p("high", () => {
            return alarm.getHighLimit() < value;
        });
        ___p("low", () => {
            return alarm.getLowLimit() > value;
        });
        ___p("lowLow", () => {
            return alarm.getLowLowLimit() > value;
        });
        if (count > 0) {
            alarm._signalNewCondition(states, isActive, value);
        }
    }
}
exports.UANonExclusiveLimitAlarm = UANonExclusiveLimitAlarm;
//# sourceMappingURL=ua_non_exclusive_limit_alarm.js.map