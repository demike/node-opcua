"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opca-aggregates
 */
const node_opcua_data_value_1 = require("node-opcua-data-value");
const node_opcua_status_code_1 = require("node-opcua-status-code");
function isGoodish(statusCode) {
    return statusCode.value < 0x40000000;
}
exports.isGoodish = isGoodish;
function isBad(statusCode) {
    return statusCode.value >= 0x80000000;
}
exports.isBad = isBad;
function isGood(statusCode) {
    return statusCode.value === 0x0;
}
exports.isGood = isGood;
function _findGoodDataValueBefore(dataValues, index, bTreatUncertainAsBad) {
    index--;
    while (index >= 0) {
        const dataValue1 = dataValues[index];
        if (!bTreatUncertainAsBad && !isBad(dataValue1.statusCode)) {
            return { index, dataValue: dataValue1 };
        }
        if (bTreatUncertainAsBad && isGood(dataValue1.statusCode)) {
            return { index, dataValue: dataValue1 };
        }
        index -= 1;
    }
    // not found
    return {
        dataValue: new node_opcua_data_value_1.DataValue({ statusCode: node_opcua_status_code_1.StatusCodes.BadNoData }),
        index: -1
    };
}
exports._findGoodDataValueBefore = _findGoodDataValueBefore;
function _findGoodDataValueAfter(dataValues, index, bTreatUncertainAsBad) {
    while (index < dataValues.length) {
        const dataValue1 = dataValues[index];
        if (!bTreatUncertainAsBad && !isBad(dataValue1.statusCode)) {
            return {
                dataValue: dataValue1,
                index
            };
        }
        if (bTreatUncertainAsBad && isGood(dataValue1.statusCode)) {
            return {
                dataValue: dataValue1,
                index
            };
        }
        index += 1;
    }
    // not found
    return {
        dataValue: new node_opcua_data_value_1.DataValue({ statusCode: node_opcua_status_code_1.StatusCodes.BadNoData }),
        index: -1
    };
}
exports._findGoodDataValueAfter = _findGoodDataValueAfter;
function adjustProcessingOptions(options) {
    options = options || {};
    options.treatUncertainAsBad = options.treatUncertainAsBad || false;
    options.useSlopedExtrapolation = options.useSlopedExtrapolation || false;
    options.stepped = options.stepped || false;
    options.percentDataBad = parseInt(options.percentDataBad, 10);
    options.percentDataGood = parseInt(options.percentDataGood, 10);
    return options;
}
exports.adjustProcessingOptions = adjustProcessingOptions;
class Interval {
    // startTime
    // dataValues
    // index:       index of first dataValue inside the interval
    // count:       number of dataValue inside the interval
    constructor(options) {
        this.startTime = options.startTime;
        this.dataValues = options.dataValues;
        this.index = options.index;
        this.count = options.count;
        this.isPartial = options.isPartial;
    }
    getPercentBad() {
        return 100;
    }
    /**
     * returns true if a raw data exists at start
     */
    hasRawDataAsStart() {
        const index = this.index;
        if (index < 0) {
            return false;
        }
        const dataValue1 = this.dataValues[index];
        return this.startTime.getTime() === dataValue1.sourceTimestamp.getTime();
    }
    /**
     * Find the first good or uncertain dataValue
     * just preceding this interval
     * @returns {*}
     */
    beforeStartDataValue(bTreatUncertainAsBad) {
        return _findGoodDataValueBefore(this.dataValues, this.index, bTreatUncertainAsBad);
    }
    nextStartDataValue(bTreatUncertainAsBad) {
        return _findGoodDataValueAfter(this.dataValues, this.index, bTreatUncertainAsBad);
    }
    toString() {
        let str = "";
        str += "startTime " + this.startTime.toUTCString() + "\n";
        str += "start     " + this.index + "  ";
        str += "count     " + this.count + " ";
        str += "isPartial " + this.isPartial + "\n";
        if (this.index >= 0) {
            for (let i = this.index; i < this.index + this.count; i++) {
                const dataValue = this.dataValues[i];
                str += " " + dataValue.sourceTimestamp.toUTCString() + dataValue.statusCode.toString();
                str += dataValue.value ? dataValue.value.toString() : "";
                str += "\n";
            }
        }
        return str;
    }
}
exports.Interval = Interval;
function getInterval(startTime, duration, indexHint, dataValues) {
    let count = 0;
    let index = -1;
    for (let i = indexHint; i < dataValues.length; i++) {
        if (dataValues[i].sourceTimestamp.getTime() < startTime.getTime()) {
            continue;
        }
        index = i;
        break;
    }
    if (index >= 0) {
        for (let i = index; i < dataValues.length; i++) {
            if (dataValues[i].sourceTimestamp.getTime() >= startTime.getTime() + duration) {
                break;
            }
            count++;
        }
    }
    // check if interval is complete or partial (end or start)
    let isPartial = false;
    if (index + count >= dataValues.length &&
        dataValues[dataValues.length - 1].sourceTimestamp.getTime() < (startTime.getTime() + duration)) {
        isPartial = true;
    }
    if (index <= 0 && dataValues[0].sourceTimestamp.getTime() > startTime.getTime()) {
        isPartial = true;
    }
    return new Interval({
        count,
        dataValues,
        index,
        isPartial,
        startTime
    });
}
exports.getInterval = getInterval;
//# sourceMappingURL=interval.js.map