/// <reference types="node" />
import { DataValue } from "node-opcua-data-value";
import { ArgumentDefinition, BrowseDescriptionLike, CallMethodRequestLike, IBasicSession, MethodId, ReadValueIdLike, ResponseCallback } from "node-opcua-pseudo-session";
import { BrowseResult } from "node-opcua-service-browse";
import { CallMethodResult } from "node-opcua-service-call";
import { BrowsePath, BrowsePathResult } from "node-opcua-service-translate-browse-path";
import { AddressSpace } from "./address_space_ts";
import { IServerBase, ISessionBase } from "./session_context";
/**
 * Pseudo session is an helper object that exposes the same async methods
 * than the ClientSession. It can be used on a server address space.
 *
 * Code reused !
 * The primary benefit of this object  is that its makes advanced OPCUA
 * operations that uses browse, translate, read, write etc similar
 * whether we work inside a server or through a client session.
 *
 * @param addressSpace {AddressSpace}
 * @constructor
 */
export declare class PseudoSession implements IBasicSession {
    server: IServerBase;
    session: ISessionBase;
    requestedMaxReferencesPerNode: number;
    private readonly addressSpace;
    private readonly continuationPointManager;
    constructor(addressSpace: AddressSpace, server?: IServerBase, session?: ISessionBase);
    browse(nodeToBrowse: BrowseDescriptionLike, callback: ResponseCallback<BrowseResult>): void;
    browse(nodesToBrowse: BrowseDescriptionLike[], callback: ResponseCallback<BrowseResult[]>): void;
    browse(nodeToBrowse: BrowseDescriptionLike): Promise<BrowseResult>;
    browse(nodesToBrowse: BrowseDescriptionLike[]): Promise<BrowseResult[]>;
    read(nodeToRead: ReadValueIdLike, callback: ResponseCallback<DataValue>): void;
    read(nodesToRead: ReadValueIdLike[], callback: ResponseCallback<DataValue[]>): void;
    read(nodeToRead: ReadValueIdLike): Promise<DataValue>;
    read(nodesToRead: ReadValueIdLike[]): Promise<DataValue[]>;
    browseNext(continuationPoint: Buffer, releaseContinuationPoints: boolean, callback: ResponseCallback<BrowseResult>): void;
    browseNext(continuationPoints: Buffer[], releaseContinuationPoints: boolean, callback: ResponseCallback<BrowseResult[]>): void;
    browseNext(continuationPoint: Buffer, releaseContinuationPoints: boolean): Promise<BrowseResult>;
    browseNext(continuationPoints: Buffer[], releaseContinuationPoints: boolean): Promise<BrowseResult[]>;
    call(methodToCall: CallMethodRequestLike, callback: ResponseCallback<CallMethodResult>): void;
    call(methodsToCall: CallMethodRequestLike[], callback: ResponseCallback<CallMethodResult[]>): void;
    call(methodToCall: CallMethodRequestLike): Promise<CallMethodResult>;
    call(methodsToCall: CallMethodRequestLike[]): Promise<CallMethodResult[]>;
    getArgumentDefinition(methodId: MethodId): Promise<ArgumentDefinition>;
    getArgumentDefinition(methodId: MethodId, callback: ResponseCallback<ArgumentDefinition>): void;
    translateBrowsePath(browsePaths: BrowsePath[], callback: ResponseCallback<BrowsePathResult[]>): void;
    translateBrowsePath(browsePath: BrowsePath, callback: ResponseCallback<BrowsePathResult>): void;
    translateBrowsePath(browsePath: BrowsePath): Promise<BrowsePathResult>;
    translateBrowsePath(browsePaths: BrowsePath[]): Promise<BrowsePathResult[]>;
}
