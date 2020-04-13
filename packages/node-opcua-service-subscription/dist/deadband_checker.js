"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-service-subscription
 */
const node_opcua_assert_1 = require("node-opcua-assert");
const _ = require("underscore");
const node_opcua_variant_1 = require("node-opcua-variant");
var DeadbandType;
(function (DeadbandType) {
    DeadbandType[DeadbandType["None"] = 0] = "None";
    DeadbandType[DeadbandType["Absolute"] = 1] = "Absolute";
    DeadbandType[DeadbandType["Percent"] = 2] = "Percent";
    DeadbandType[DeadbandType["Invalid"] = 4096] = "Invalid";
})(DeadbandType = exports.DeadbandType || (exports.DeadbandType = {}));
function _differenceScalar(value1, value2, dataType, absoluteDeadband) {
    let diff;
    if (dataType === node_opcua_variant_1.DataType.UInt64 || dataType === node_opcua_variant_1.DataType.Int64) {
        if (!(value1 instanceof Array && value2 instanceof Array)) {
            throw new Error("Invalid");
        }
        const h1 = value1[0]; // high
        const h2 = value2[0];
        if (h1 !== h2) {
            diff = (h1 - h2) * 4294967295;
            if (Math.abs(diff) > absoluteDeadband) {
                return true;
            }
        }
        diff = value1[1] - value2[1];
        node_opcua_assert_1.assert(_.isNumber(diff) && _.isFinite(diff));
        return Math.abs(diff) > absoluteDeadband;
    }
    if (!(typeof value1 === "number" && typeof value2 === "number")) {
        throw new Error("Invalid");
    }
    diff = value2 - value1;
    node_opcua_assert_1.assert(_.isNumber(diff) && _.isFinite(diff));
    return Math.abs(diff) > absoluteDeadband;
}
function difference(v1, v2, absoluteDeadBand) {
    node_opcua_assert_1.assert(_.isFinite(absoluteDeadBand));
    if (v1.arrayType === node_opcua_variant_1.VariantArrayType.Array) {
        if (v1.dataType !== v2.dataType) {
            return true;
        }
        if (v1.value.length !== v2.value.length) {
            return true;
        }
        const n = v1.value.length;
        let i = 0;
        for (i = 0; i < n; i++) {
            if (_differenceScalar(v1.value[i], v2.value[i], v1.dataType, absoluteDeadBand)) {
                return true;
            }
        }
        return false;
    }
    else {
        node_opcua_assert_1.assert(v1.arrayType === node_opcua_variant_1.VariantArrayType.Scalar);
        node_opcua_assert_1.assert(v1.dataType === v2.dataType);
        return _differenceScalar(v1.value, v2.value, v1.dataType, absoluteDeadBand);
    }
}
/**
 * @method checkDeadBand
 * @param variant1 {Variant}
 * @param variant2 {Variant}
 * @param deadbandType  {DeadbandType}
 * @param deadbandValue {Float}
 * @param valueRange    {Float}
 * @return {boolean}
 */
function checkDeadBand(variant1, variant2, deadbandType, deadbandValue, valueRange) {
    switch (deadbandType) {
        case DeadbandType.None:
            // No Deadband calculation should be applied.
            return difference(variant1, variant2, 0);
        case DeadbandType.Absolute:
            if (deadbandValue === undefined) {
                throw new Error("Invalid deadbandValue");
            }
            // AbsoluteDeadband
            return difference(variant1, variant2, deadbandValue);
        default:
            if (deadbandValue === undefined) {
                throw new Error("Invalid deadbandValue");
            }
            // Percent_2    PercentDeadband (This type is specified in Part 8).
            node_opcua_assert_1.assert(deadbandType === DeadbandType.Percent);
            // The range of the deadbandValue is from 0.0 to 100.0 Percent.
            node_opcua_assert_1.assert(deadbandValue >= 0 && deadbandValue <= 100);
            // DeadbandType = PercentDeadband
            // For this type of deadband the deadbandValue is defined as the percentage of the EURange. That is,
            // it applies only to AnalogItems with an EURange Property that defines the typical value range for the
            // item. This range shall be multiplied with the deadbandValue and then compared to the actual value change
            // to determine the need for a data change notification. The following pseudo code shows how the deadband
            // is calculated:
            //      DataChange if (absolute value of (last cached value - current value) >
            //                                          (deadbandValue/100.0) * ((high-low) of EURange)))
            //
            // Specifying a deadbandValue outside of this range will be rejected and reported with the
            // StatusCode BadDeadbandFilterInvalid (see Table 27).
            // If the Value of the MonitoredItem is an array, then the deadband calculation logic shall be applied to
            // each element of the array. If an element that requires a DataChange is found, then no further
            // deadband checking is necessary and the entire array shall be returned.
            // assert(false, "Not implemented yet");
            node_opcua_assert_1.assert(_.isNumber(valueRange));
            if (valueRange === undefined) {
                throw new Error("Internal Error");
            }
            return checkDeadBand(variant1, variant2, DeadbandType.Absolute, valueRange * deadbandValue / 100);
    }
}
exports.checkDeadBand = checkDeadBand;
//# sourceMappingURL=deadband_checker.js.map