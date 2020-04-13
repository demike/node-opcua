"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_data_value_1 = require("node-opcua-data-value");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const common_1 = require("./common");
const interval_1 = require("./interval");
/*
 For any intervals containing regions where the StatusCodes are Bad,
 the total duration of all Bad regions is calculated and divided by the width of the interval.
 The resulting ratio is multiplied by 100 and compared to the PercentDataBad parameter.
 The StatusCode for the interval is Bad if the ratio is greater than or equal to the PercentDataBad parameter.
 For any interval which is not Bad, the total duration of all Good regions is then calculated and divided by
 the width of the interval. The resulting ratio is multiplied by 100 and compared to the PercentDataGood parameter.
 The StatusCode for the interval is Good if the ratio is greater than or equal to the PercentDataGood parameter.
 If for an interval neither ratio applies then that interval is Uncertain_DataSubNormal.
  */
function interpolatedValue(interval, options) {
    options = interval_1.adjustProcessingOptions(options);
    node_opcua_assert_1.assert(options.hasOwnProperty("useSlopedExtrapolation"));
    node_opcua_assert_1.assert(options.hasOwnProperty("treatUncertainAsBad"));
    const bTreatUncertainAsBad = options.treatUncertainAsBad;
    const steppedValue = (previousDataValue) => {
        if (!previousDataValue.statusCode) {
            throw new Error("Expecting statusCode");
        }
        const interpValue = new node_opcua_data_value_1.DataValue({
            sourceTimestamp: interval.startTime,
            statusCode: node_opcua_status_code_1.StatusCodes.Bad,
            value: previousDataValue.value,
        });
        interpValue.statusCode =
            node_opcua_status_code_1.StatusCode.makeStatusCode(node_opcua_status_code_1.StatusCodes.UncertainDataSubNormal, "HistorianInterpolated");
        return interpValue;
    };
    if (interval.index === -1) {
        // the interval is beyond end Data
        // we need to find previous good value
        // and second previous  good value to extrapolate
        const prev1 = interval_1._findGoodDataValueBefore(interval.dataValues, interval.dataValues.length, bTreatUncertainAsBad);
        if (prev1.index <= 0) {
            return new node_opcua_data_value_1.DataValue({
                sourceTimestamp: interval.startTime,
                statusCode: node_opcua_status_code_1.StatusCodes.BadNoData,
                value: undefined,
            });
        }
        if (!options.useSlopedExtrapolation) {
            return steppedValue(prev1.dataValue);
        }
        const prev2 = interval_1._findGoodDataValueBefore(interval.dataValues, prev1.index, bTreatUncertainAsBad);
        if (prev2.index <= 0) {
            // use step value
            return steppedValue(prev1.dataValue);
        }
        // else interpolate
        const interpVal = common_1.interpolateValue(prev2.dataValue, prev1.dataValue, interval.startTime);
        // tslint:disable:no-bitwise
        if (prev2.index + 1 < prev1.index || prev1.index < interval.dataValues.length - 1) {
            // some bad data exist in between = change status code
            const mask = 0x0000FFFFFF;
            const extraBits = interpVal.statusCode.value & mask;
            interpVal.statusCode = node_opcua_status_code_1.StatusCode.makeStatusCode(node_opcua_status_code_1.StatusCodes.UncertainDataSubNormal, extraBits);
        }
        return interpVal;
    }
    /* istanbul ignore next */
    if (interval.index < 0 && interval.count === 0) {
        return new node_opcua_data_value_1.DataValue({
            sourceTimestamp: interval.startTime,
            statusCode: node_opcua_status_code_1.StatusCodes.BadNoData
        });
    }
    const dataValue1 = interval.dataValues[interval.index];
    // if a non-Bad Raw value exists at the timestamp then it is the bounding value;
    if (!interval_1.isBad(dataValue1.statusCode) && interval.hasRawDataAsStart()) {
        return dataValue1;
    }
    // find the first non-Bad Raw value before the timestamp;
    // find previous good value
    const before = interval.beforeStartDataValue(bTreatUncertainAsBad);
    if (interval_1.isBad(before.dataValue.statusCode)) {
        return new node_opcua_data_value_1.DataValue({
            sourceTimestamp: interval.startTime,
            statusCode: node_opcua_status_code_1.StatusCodes.BadNoData
        });
    }
    if (options.stepped) {
        if (before.index + 1 === interval.index) {
            return new node_opcua_data_value_1.DataValue({
                sourceTimestamp: interval.startTime,
                statusCode: node_opcua_status_code_1.StatusCode.makeStatusCode(before.dataValue.statusCode, "HistorianInterpolated"),
                value: before.dataValue.value
            });
        }
        return steppedValue(before.dataValue);
    }
    // find the first non-Bad Raw value after the timestamp;
    const next = interval.nextStartDataValue(bTreatUncertainAsBad);
    //  draw a line between before value and after value;
    // use point where the line crosses the timestamp as an estimate of the bounding value.
    //   The calculation can be expressed with the following formula:
    //    V bound = (T bound – T before)x( V after – V before)/( T after – T before) + V before
    //    where V
    //   x is a value at ‘x’ and Tx is the timestamp associated with Vx.
    const interpolatedDataValue = common_1.interpolateValue(before.dataValue, next.dataValue, interval.startTime);
    if (before.index + 1 < next.index
        || !interval_1.isGood(next.dataValue.statusCode)
        || !interval_1.isGood(before.dataValue.statusCode)) {
        // tslint:disable:no-bitwise
        // some bad data exist in between = change status code
        const mask = 0x0000FFFFFF;
        const extraBits = interpolatedDataValue.statusCode.value & mask;
        interpolatedDataValue.statusCode =
            node_opcua_status_code_1.StatusCode.makeStatusCode(node_opcua_status_code_1.StatusCodes.UncertainDataSubNormal, extraBits);
    }
    // check if uncertain or bad value exist between before/next
    // todo
    return interpolatedDataValue;
}
exports.interpolatedValue = interpolatedValue;
/**
 *
 * @param node
 * @param processingInterval
 * @param startDate
 * @param endDate
 * @param callback
 */
function getInterpolatedData(node, processingInterval, startDate, endDate, callback) {
    return common_1.getAggregateData(node, processingInterval, startDate, endDate, interpolatedValue, callback);
}
exports.getInterpolatedData = getInterpolatedData;
//# sourceMappingURL=interpolate.js.map