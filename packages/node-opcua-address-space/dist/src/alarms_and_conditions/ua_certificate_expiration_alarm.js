"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space.AlarmsAndConditions
 */
const node_opcua_variant_1 = require("node-opcua-variant");
const ua_system_off_normal_alarm_1 = require("./ua_system_off_normal_alarm");
/**
 * This UACertificateExpirationAlarm (SystemOffNormalAlarmType) is raised by the Server when the Server’s
 * Certificate is within the ExpirationLimit
 * of expiration. This alarm automatically returns to normal when the certificate is updated.
 *
 * @class UACertificateExpirationAlarm
 * @extends UASystemOffNormalAlarm
 * @constructor
 *
 *
 */
class UACertificateExpirationAlarm extends ua_system_off_normal_alarm_1.UASystemOffNormalAlarm {
    static instantiate(namespace, options, data) {
        return ua_system_off_normal_alarm_1.UASystemOffNormalAlarm.instantiate(namespace, "CertificateExpirationAlarmType", options, data);
    }
    getExpirationDate() {
        return this.expirationDate.readValue().value.value;
    }
    setExpirationDate(value) {
        return this.expirationDate.setValueFromSource({
            dataType: node_opcua_variant_1.DataType.DateTime,
            value
        });
    }
}
exports.UACertificateExpirationAlarm = UACertificateExpirationAlarm;
//# sourceMappingURL=ua_certificate_expiration_alarm.js.map