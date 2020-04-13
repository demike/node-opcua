"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ua_exclusive_limit_alarm_1 = require("./ua_exclusive_limit_alarm");
/**
 * @class UAExclusiveLevelAlarm
 * @extends UAExclusiveLimitAlarm
 * @constructor
 */
class UAExclusiveLevelAlarm extends ua_exclusive_limit_alarm_1.UAExclusiveLimitAlarm {
    static instantiate(namespace, type, option, data) {
        const addressSpace = namespace.addressSpace;
        return ua_exclusive_limit_alarm_1.UAExclusiveLimitAlarm.instantiate(namespace, type, option, data);
    }
}
exports.UAExclusiveLevelAlarm = UAExclusiveLevelAlarm;
//# sourceMappingURL=ua_exclusive_level_alarm.js.map