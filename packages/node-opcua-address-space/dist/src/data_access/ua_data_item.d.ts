/**
 * @module node-opcua-address-space.DataAccess
 */
import { AddDataItemOptions } from "../../source";
import { UADataItem as UADataItemPublic } from "../../source";
import { UAVariable } from "../ua_variable";
/**
 * @method add_dataItem_stuff
 * @param variable
 * @param options  {Object}
 * @param options.definition [Optional]
 * @param options.valuePrecision [Optional]
 * @param options.modellingRule [Optional]
 * @private
 */
export declare function add_dataItem_stuff(variable: UAVariable, options: AddDataItemOptions): void;
export declare class UADataItem extends UAVariable implements UADataItemPublic {
}
export interface UADataItem {
}
