/**
 * @module node-opcua-address-space.AlarmsAndConditions
 */
import { DataType } from "node-opcua-variant";
import { Namespace, UAVariableT } from "../../source";
import { UASystemOffNormalAlarm } from "./ua_system_off_normal_alarm";
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
export declare class UACertificateExpirationAlarm extends UASystemOffNormalAlarm {
    static instantiate(namespace: Namespace, options: any, data: any): UACertificateExpirationAlarm;
    getExpirationDate(): Date;
    setExpirationDate(value: Date): void;
}
export interface UACertificateExpirationAlarm {
    /**
     * ExpirationDate is the date and time this certificate will expire.
     * HasProperty Variable ExpirationDate  DateTime   PropertyType Mandatory
     */
    expirationDate: UAVariableT<DataType.DateTime>;
    expirationLimit?: UAVariableT<"Duration">;
    certificateType: UAVariableT<DataType.NodeId>;
    certificate: UAVariableT<DataType.ByteString>;
}
