/***
 * @module node-opcua-basic-types
 */
export * from "node-opcua-date-time";
import { DateWithPicoseconds } from "node-opcua-date-time";
export declare type DateTime = Date | DateWithPicoseconds | null;
