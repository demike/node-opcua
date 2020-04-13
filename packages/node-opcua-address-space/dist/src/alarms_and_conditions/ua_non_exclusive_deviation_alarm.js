"use strict";
/**
 * @module node-opcua-address-space.AlarmsAndConditions
 */
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("underscore");
const node_opcua_assert_1 = require("node-opcua-assert");
const deviation_alarm_helper_1 = require("./deviation_alarm_helper");
const ua_limit_alarm_1 = require("./ua_limit_alarm");
const ua_non_exclusive_limit_alarm_1 = require("./ua_non_exclusive_limit_alarm");
/**
 * @class UANonExclusiveDeviationAlarm
 * @extends UANonExclusiveLimitAlarm
 * @constructor
 */
class UANonExclusiveDeviationAlarm extends ua_non_exclusive_limit_alarm_1.UANonExclusiveLimitAlarm {
    static instantiate(namespace, type, options, data) {
        const addressSpace = namespace.addressSpace;
        const nonExclusiveDeviationAlarmType = addressSpace.findEventType("NonExclusiveDeviationAlarmType");
        /* istanbul ignore next */
        if (!nonExclusiveDeviationAlarmType) {
            throw new Error("cannot find ExclusiveDeviationAlarmType");
        }
        node_opcua_assert_1.assert(type === nonExclusiveDeviationAlarmType.browseName.toString());
        const alarm = ua_non_exclusive_limit_alarm_1.UANonExclusiveLimitAlarm.instantiate(namespace, type, options, data);
        Object.setPrototypeOf(alarm, UANonExclusiveDeviationAlarm.prototype);
        node_opcua_assert_1.assert(alarm instanceof UANonExclusiveDeviationAlarm);
        node_opcua_assert_1.assert(alarm instanceof ua_non_exclusive_limit_alarm_1.UANonExclusiveLimitAlarm);
        node_opcua_assert_1.assert(alarm instanceof ua_limit_alarm_1.UALimitAlarm);
        alarm._install_setpoint(options);
        return alarm;
    }
    _setStateBasedOnInputValue(value) {
        const setpointValue = this.getSetpointValue();
        if (setpointValue === null) {
            throw new Error("Cannot access setpoint Value");
        }
        node_opcua_assert_1.assert(_.isFinite(setpointValue), "expecting a valid setpoint value");
        // call base class implementation
        super._setStateBasedOnInputValue(value - setpointValue);
    }
    getSetpointNodeNode() {
        return deviation_alarm_helper_1.DeviationAlarmHelper_getSetpointNodeNode.call(this);
    }
    getSetpointValue() {
        return deviation_alarm_helper_1.DeviationAlarmHelper_getSetpointValue.call(this);
    }
    _onSetpointDataValueChange(dataValue) {
        deviation_alarm_helper_1.DeviationAlarmHelper_onSetpointDataValueChange.call(this, dataValue);
    }
    _install_setpoint(options) {
        return deviation_alarm_helper_1.DeviationAlarmHelper_install_setpoint.call(this, options);
    }
}
exports.UANonExclusiveDeviationAlarm = UANonExclusiveDeviationAlarm;
/*
UANonExclusiveDeviationAlarm.prototype.getSetpointNodeNode = DeviationAlarmHelper.getSetpointNodeNode;
UANonExclusiveDeviationAlarm.prototype.getSetpointValue = DeviationAlarmHelper.getSetpointValue;
UANonExclusiveDeviationAlarm.prototype._onSetpointDataValueChange = DeviationAlarmHelper._onSetpointDataValueChange;
UANonExclusiveDeviationAlarm.prototype._install_setpoint = DeviationAlarmHelper._install_setpoint;
*/
//# sourceMappingURL=ua_non_exclusive_deviation_alarm.js.map