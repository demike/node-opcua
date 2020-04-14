/**
 * @module node-opcua-address-space
 * @class AddressSpace
 */
import { DataValue } from "node-opcua-data-value";
import { Callback, IVariableHistorian, IVariableHistorianOptions } from "../../source";
import { AddressSpace } from "../address_space";
import { UAVariable } from "../ua_variable";
export declare class VariableHistorian implements IVariableHistorian {
    readonly node: UAVariable;
    private readonly _timeline;
    private readonly _maxOnlineValues;
    private lastDate;
    private lastDatePicoSeconds;
    constructor(node: UAVariable, options: IVariableHistorianOptions);
    push(newDataValue: DataValue): any;
    extractDataValues(historyReadRawModifiedDetails: any, maxNumberToExtract: number, isReversed: boolean, reverseDataValue: boolean, callback: Callback<DataValue[]>): void;
}
/**
 * @method installHistoricalDataNode
 * @param node      UAVariable
 * @param [options] {Object}
 * @param [options.maxOnlineValues = 1000]
 */
export declare function AddressSpace_installHistoricalDataNode(this: AddressSpace, node: UAVariable, options?: IVariableHistorianOptions): void;
