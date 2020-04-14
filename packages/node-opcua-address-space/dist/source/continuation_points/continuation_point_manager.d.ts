import { StatusCode } from "node-opcua-status-code";
import { BrowseResultOptions, ReferenceDescription } from "node-opcua-types";
import { ContinuationPoint } from "../address_space_ts";
export interface ContinuationPointInfo extends BrowseResultOptions {
    continuationPoint?: ContinuationPoint;
    references?: ReferenceDescription[];
    statusCode: StatusCode;
}
export declare class ContinuationPointManager {
    private readonly _map;
    constructor();
    register(maxElements: number, values: ReferenceDescription[]): ContinuationPointInfo;
    getNext(continuationPoint: ContinuationPoint): ContinuationPointInfo;
    cancel(continuationPoint: ContinuationPoint): ContinuationPointInfo;
}
