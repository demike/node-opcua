"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opca-aggregates
 */
const node_opcua_address_space_1 = require("node-opcua-address-space");
const node_opcua_data_value_1 = require("node-opcua-data-value");
const node_opcua_service_history_1 = require("node-opcua-service-history");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const aggregates_1 = require("./aggregates");
const interval_1 = require("./interval");
/**
 * @internal
 * @param node
 * @param processingInterval
 * @param startDate
 * @param endDate
 * @param dataValues
 * @param lambda
 * @param callback
 */
function processAggregateData(node, processingInterval, startDate, endDate, dataValues, lambda, callback) {
    const aggregateConfiguration = aggregates_1.getAggregateConfiguration(node);
    const results = [];
    const tstart = startDate.getTime();
    const tend = endDate.getTime();
    const indexHint = 0;
    for (let t = tstart; t < tend; t += processingInterval) {
        const sourceTimestamp = new Date();
        sourceTimestamp.setTime(t);
        const interval = interval_1.getInterval(sourceTimestamp, processingInterval, indexHint, dataValues);
        const dataValue = lambda(interval, aggregateConfiguration);
        /* istanbul ignore next */
        if (!dataValue || !dataValue.sourceTimestamp) {
            // const dataValue = interval.interpolatedValue(aggregateConfiguration);
            throw Error("invalid DataValue");
        }
        results.push(dataValue);
    }
    setImmediate(() => {
        callback(null, results);
    });
}
function getAggregateData(node, processingInterval, startDate, endDate, lambda, callback) {
    /* istanbul ignore next */
    if (!(node.constructor.name === "UAVariable")) {
        throw new Error("node must be UAVariable");
    }
    /* istanbul ignore next */
    if (processingInterval <= 0) {
        throw new Error("Invalid processing interval, shall be greater than 0");
    }
    const context = new node_opcua_address_space_1.SessionContext();
    const historyReadDetails = new node_opcua_service_history_1.ReadRawModifiedDetails({
        endTime: endDate,
        startTime: startDate,
    });
    const indexRange = null;
    const dataEncoding = null;
    const continuationPoint = null;
    node.historyRead(context, historyReadDetails, indexRange, dataEncoding, continuationPoint, (err, result) => {
        /* istanbul ignore next */
        if (err) {
            return callback(err);
        }
        const historyData = result.historyData;
        const dataValues = historyData.dataValues || [];
        processAggregateData(node, processingInterval, startDate, endDate, dataValues, lambda, callback);
    });
}
exports.getAggregateData = getAggregateData;
function interpolateValue(dataValue1, dataValue2, date) {
    const t0 = dataValue1.sourceTimestamp.getTime();
    const t = date.getTime();
    const t1 = dataValue2.sourceTimestamp.getTime();
    const coef1 = (t - t0) / (t1 - t0);
    const coef2 = (t1 - t) / (t1 - t0);
    const value = dataValue1.value.clone();
    value.value = coef2 * dataValue1.value.value + coef1 * dataValue2.value.value;
    const statusCode = node_opcua_status_code_1.StatusCode.makeStatusCode(dataValue1.statusCode, "HistorianInterpolated");
    return new node_opcua_data_value_1.DataValue({
        sourceTimestamp: date,
        statusCode,
        value
    });
}
exports.interpolateValue = interpolateValue;
//# sourceMappingURL=common.js.map