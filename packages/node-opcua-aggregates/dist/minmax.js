"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_opcua_data_value_1 = require("node-opcua-data-value");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const common_1 = require("./common");
const interval_1 = require("./interval");
function calculateIntervalMinOrMaxValue(interval, options, predicate) {
    //   console.log(interval.toString());
    const indexStart = interval.index;
    let selectedValue = null;
    let counter = 0;
    let statusCode;
    let isPartial = interval.isPartial;
    let isRaw = false;
    let hasBad = false;
    for (let i = indexStart; i < indexStart + interval.count; i++) {
        const dataValue = interval.dataValues[i];
        if (dataValue.statusCode === node_opcua_status_code_1.StatusCodes.BadNoData) {
            isPartial = true;
            continue;
        }
        if (!interval_1.isGood(dataValue.statusCode)) {
            hasBad = true;
            continue;
        }
        if (!selectedValue) {
            selectedValue = dataValue.value;
            counter = 1;
            if (i === indexStart && dataValue.sourceTimestamp.getTime() === interval.startTime.getTime()) {
                isRaw = true;
            }
            continue;
        }
        const compare = predicate(selectedValue, dataValue.value);
        if (compare === "equal") {
            counter = 1;
            continue;
        }
        if (compare === "select") {
            selectedValue = dataValue.value;
            counter = 1;
        }
    }
    if (!selectedValue) {
        return new node_opcua_data_value_1.DataValue({
            sourceTimestamp: interval.startTime,
            statusCode: node_opcua_status_code_1.StatusCodes.BadNoData
        });
    }
    if (isRaw) {
        if (hasBad) {
            statusCode = node_opcua_status_code_1.StatusCodes.UncertainDataSubNormal;
        }
        else {
            statusCode = node_opcua_status_code_1.StatusCodes.Good;
        }
    }
    else if (hasBad) {
        statusCode = node_opcua_status_code_1.StatusCode.makeStatusCode(node_opcua_status_code_1.StatusCodes.UncertainDataSubNormal, "HistorianCalculated");
    }
    else {
        statusCode = node_opcua_status_code_1.StatusCode.makeStatusCode(node_opcua_status_code_1.StatusCodes.Good, "HistorianCalculated");
    }
    if (counter > 1) {
        statusCode = node_opcua_status_code_1.StatusCode.makeStatusCode(statusCode, "HistorianMultiValue");
    }
    if (isPartial || interval.isPartial) {
        statusCode = node_opcua_status_code_1.StatusCode.makeStatusCode(statusCode, "HistorianPartial");
    }
    return new node_opcua_data_value_1.DataValue({
        sourceTimestamp: interval.startTime,
        statusCode: statusCode,
        value: selectedValue
    });
}
function calculateIntervalMinValue(interval, options) {
    return calculateIntervalMinOrMaxValue(interval, options, (a, b) => a.value > b.value ? "select" : (a.value === b.value ? "equal" : "reject"));
}
exports.calculateIntervalMinValue = calculateIntervalMinValue;
function calculateIntervalMaxValue(interval, options) {
    return calculateIntervalMinOrMaxValue(interval, options, (a, b) => a.value < b.value ? "select" : (a.value === b.value ? "equal" : "reject"));
}
exports.calculateIntervalMaxValue = calculateIntervalMaxValue;
// From OPC Unified Architecture, Part 13 26 Release 1.04
// 5.4.3.11 Maximum
// The Maximum Aggregate defined in Table 22 retrieves the maximum Good raw value within
// the interval, and returns that value with the timestamp at the start of the interval. Note that if
// the same maximum exists at more than one timestamp the MultipleValues bit is set.
// Unless otherwise indicated, StatusCodes are Good, Calculated. If the minimum value is on
// the interval start time the status code will be Good, Raw. If only Bad quality values are
// available then the status is returned as Bad_NoData.
// The timestamp of the Aggregate will always be the start of the interval for every
//
// ProcessingInterval.
//
// Table 22 – Maximum Aggregate summary
// Maximum Aggregate Characteristics
//
// Type                     Calculated
// Data Type                Same as Source
// Use Bounds               None
// Timestamp                StartTime
//
// Status Code Calculations
// Calculation              Method Custom
// If no Bad values then the Status is Good. If Bad values exist then
// the Status is Uncertain_SubNormal. If an Uncertain value is greater
// than the maximum Good value the Status is Uncertain_SubNormal
//
// Partial                  Set Sometimes
// If an interval is not a complete interval
//
// Calculated               Set Sometimes
// If the Maximum value is not on the startTime of the interval or if the
// Status was set to Uncertain_SubNormal because of non-Good
// values in the interval
//
// Interpolated             Not Set
//
// Raw                      Set Sometimes
// If Maximum value is on the startTime of the interval
// Multi Value Set Sometimes
// If multiple Good values exist with the Maximum value
//
// Status Code Common Special Cases
// Before Start of Data     Bad_NoData
// After End of Data        Bad_NoData
// No Start Bound           Not Applicable
// No End Bound             Not Applicable
// Bound Bad                Not Applicable
// Bound Uncertain             Not Applicable
/**
 *
 * @param node
 * @param processingInterval
 * @param startDate
 * @param endDate
 * @param callback
 */
function getMinData(node, processingInterval, startDate, endDate, callback) {
    return common_1.getAggregateData(node, processingInterval, startDate, endDate, calculateIntervalMinValue, callback);
}
exports.getMinData = getMinData;
function getMaxData(node, processingInterval, startDate, endDate, callback) {
    return common_1.getAggregateData(node, processingInterval, startDate, endDate, calculateIntervalMaxValue, callback);
}
exports.getMaxData = getMaxData;
//# sourceMappingURL=minmax.js.map