"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space.AlarmsAndConditions
 */
const _ = require("underscore");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_data_model_1 = require("node-opcua-data-model");
/**
 * @class ConditionInfo
 * @param options  {Object}
 * @param options.message   {String|LocalizedText} the event message
 * @param options.severity  {UInt16} severity
 * @param options.quality   {StatusCode} quality
 * @param options.retain   {Boolean} retain flag
 * @constructor
 */
class ConditionInfo {
    constructor(options) {
        this.message = null;
        this.quality = null;
        this.severity = 0;
        this.retain = false;
        this.severity = null;
        this.quality = null;
        this.message = null;
        this.retain = null;
        if (options.hasOwnProperty("message") && options.message) {
            this.message = node_opcua_data_model_1.LocalizedText.coerce(options.message);
        }
        if (options.hasOwnProperty("quality") && options.quality !== null) {
            this.quality = options.quality;
        }
        if (options.hasOwnProperty("severity") && options.severity !== null) {
            node_opcua_assert_1.assert(_.isNumber(options.severity));
            this.severity = options.severity;
        }
        if (options.hasOwnProperty("retain") && options.retain !== null) {
            node_opcua_assert_1.assert(_.isBoolean(options.retain));
            this.retain = options.retain;
        }
    }
    /**
     * @method isDifferentFrom
     * @param otherConditionInfo {ConditionInfo}
     * @return {Boolean}
     */
    isDifferentFrom(otherConditionInfo) {
        return (this.severity !== otherConditionInfo.severity ||
            this.quality !== otherConditionInfo.quality ||
            this.message !== otherConditionInfo.message);
    }
}
exports.ConditionInfo = ConditionInfo;
//# sourceMappingURL=condition_info.js.map