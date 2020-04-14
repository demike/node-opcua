/// <reference types="node" />
import { DataValue } from "node-opcua-data-value";
import { NodeIdLike } from "node-opcua-nodeid";
import { BrowseDescription, BrowseDescriptionOptions, BrowseResult } from "node-opcua-service-browse";
import { CallMethodRequest, CallMethodRequestOptions, CallMethodResult } from "node-opcua-service-call";
import { ReadValueId, ReadValueIdOptions } from "node-opcua-service-read";
import { BrowsePath, BrowsePathResult } from "node-opcua-service-translate-browse-path";
import { Variant } from "node-opcua-variant";
export declare type BrowseDescriptionLike = string | BrowseDescriptionOptions | BrowseDescription;
export declare type ReadValueIdLike = ReadValueId | ReadValueIdOptions;
export declare type CallMethodRequestLike = CallMethodRequestOptions | CallMethodRequest;
export declare type ResponseCallback<T> = (err: Error | null, result?: T) => void;
export interface IBasicSession {
    browse(nodeToBrowse: BrowseDescriptionLike, callback: ResponseCallback<BrowseResult>): void;
    browse(nodesToBrowse: BrowseDescriptionLike[], callback: ResponseCallback<BrowseResult[]>): void;
    browse(nodeToBrowse: BrowseDescriptionLike): Promise<BrowseResult>;
    browse(nodesToBrowse: BrowseDescriptionLike[]): Promise<BrowseResult[]>;
}
export interface IBasicSession {
    /**
     *
     * @param continuationPoint
     * @param releaseContinuationPoints  a Boolean parameter with the following values:
     *      TRUE passed continuationPoints shall be reset to free resources in
     *      the Server. The continuation points are released and the results
     *      and diagnosticInfos arrays are empty.
     *      FALSE passed continuationPoints shall be used to get the next set of
     *      browse information.
     *      A Client shall always use the continuation point returned by a Browse or
     *      BrowseNext response to free the resources for the continuation point in the
     *      Server. If the Client does not want to get the next set of browse information,
     *      BrowseNext shall be called with this parameter set to TRUE.
     * @param callback
     */
    browseNext(continuationPoint: Buffer, releaseContinuationPoints: boolean, callback: ResponseCallback<BrowseResult>): void;
    browseNext(continuationPoints: Buffer[], releaseContinuationPoints: boolean, callback: ResponseCallback<BrowseResult[]>): void;
    browseNext(continuationPoint: Buffer, releaseContinuationPoints: boolean): Promise<BrowseResult>;
    browseNext(continuationPoints: Buffer[], releaseContinuationPoints: boolean): Promise<BrowseResult[]>;
}
export interface IBasicSession {
    read(nodeToRead: ReadValueIdLike, callback: ResponseCallback<DataValue>): void;
    read(nodesToRead: ReadValueIdLike[], callback: ResponseCallback<DataValue[]>): void;
    read(nodeToRead: ReadValueIdLike): Promise<DataValue>;
    read(nodesToRead: ReadValueIdLike[]): Promise<DataValue[]>;
}
export declare type MethodId = NodeIdLike;
export interface ArgumentDefinition {
    inputArguments: Variant[];
    outputArguments: Variant[];
}
export interface IBasicSession {
    call(methodToCall: CallMethodRequestLike, callback: (err: Error | null, result?: CallMethodResult) => void): void;
    call(methodsToCall: CallMethodRequestLike[], callback: (err: Error | null, results?: CallMethodResult[]) => void): void;
    call(methodToCall: CallMethodRequestLike): Promise<CallMethodResult>;
    call(methodsToCall: CallMethodRequestLike[]): Promise<CallMethodResult[]>;
    getArgumentDefinition(methodId: MethodId): Promise<ArgumentDefinition>;
    getArgumentDefinition(methodId: MethodId, callback: (err: Error | null, args?: ArgumentDefinition) => void): void;
}
export interface IBasicSession {
    translateBrowsePath(browsesPath: BrowsePath[], callback: ResponseCallback<BrowsePathResult[]>): void;
    translateBrowsePath(browsePath: BrowsePath, callback: ResponseCallback<BrowsePathResult>): void;
    translateBrowsePath(browsePath: BrowsePath): Promise<BrowsePathResult>;
    translateBrowsePath(browsePaths: BrowsePath[]): Promise<BrowsePathResult[]>;
}
export declare function getArgumentDefinitionHelper(session: IBasicSession, methodId: MethodId, callback: ResponseCallback<ArgumentDefinition>): void;
