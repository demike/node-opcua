"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ua_off_normal_alarm_1 = require("./ua_off_normal_alarm");
/**
 *
 * This Condition is used by a Server to indicate that an underlying system that is providing  Alarm information is
 * having a communication problem and that the Server may have invalid or incomplete Condition state in the
 * Subscription.
 *
 */
class UASystemOffNormalAlarm extends ua_off_normal_alarm_1.UAOffNormalAlarm {
    static instantiate(namespace, limitAlarmTypeId, options, data) {
        return ua_off_normal_alarm_1.UAOffNormalAlarm.instantiate(namespace, limitAlarmTypeId, options, data);
    }
}
exports.UASystemOffNormalAlarm = UASystemOffNormalAlarm;
//# sourceMappingURL=ua_system_off_normal_alarm.js.map