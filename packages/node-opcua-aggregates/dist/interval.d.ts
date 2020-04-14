/**
 * @module node-opca-aggregates
 */
import { DataValue } from "node-opcua-data-value";
import { StatusCode } from "node-opcua-status-code";
import { AggregateConfigurationOptions } from "node-opcua-types";
export { AggregateConfigurationOptions } from "node-opcua-types";
export interface AggregateConfigurationOptionsEx extends AggregateConfigurationOptions {
    stepped?: boolean;
}
export declare function isGoodish(statusCode: StatusCode): boolean;
export declare function isBad(statusCode: StatusCode): boolean;
export declare function isGood(statusCode: StatusCode): boolean;
export interface IntervalOptions {
    startTime: Date;
    dataValues: DataValue[];
    index: number;
    count: number;
    isPartial: boolean;
}
interface DataValueWithIndex {
    index: number;
    dataValue: DataValue;
}
export declare function _findGoodDataValueBefore(dataValues: DataValue[], index: number, bTreatUncertainAsBad: boolean): DataValueWithIndex;
export declare function _findGoodDataValueAfter(dataValues: DataValue[], index: number, bTreatUncertainAsBad: boolean): DataValueWithIndex;
export declare function adjustProcessingOptions(options: AggregateConfigurationOptionsEx | null): AggregateConfigurationOptionsEx;
export declare class Interval {
    startTime: Date;
    dataValues: DataValue[];
    index: number;
    count: number;
    isPartial: boolean;
    constructor(options: IntervalOptions);
    getPercentBad(): number;
    /**
     * returns true if a raw data exists at start
     */
    hasRawDataAsStart(): boolean;
    /**
     * Find the first good or uncertain dataValue
     * just preceding this interval
     * @returns {*}
     */
    beforeStartDataValue(bTreatUncertainAsBad: boolean): DataValueWithIndex;
    nextStartDataValue(bTreatUncertainAsBad: boolean): DataValueWithIndex;
    toString(): string;
}
export declare function getInterval(startTime: Date, duration: number, indexHint: number, dataValues: DataValue[]): Interval;
