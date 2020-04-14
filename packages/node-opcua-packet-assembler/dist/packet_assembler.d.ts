/// <reference types="node" />
import { EventEmitter } from "events";
/***
 * @class PacketAssembler
 * @constructor
 */
export interface MessageHeader {
    msgType: string;
    isFinal: string;
    length: number;
}
export interface PacketInfo {
    length: number;
    messageHeader: MessageHeader;
    extra: string;
}
export declare type ReadMessageFuncType = (data: Buffer) => PacketInfo;
export interface PacketAssemblerOptions {
    readMessageFunc: ReadMessageFuncType;
    minimumSizeInBytes: number;
}
export declare class PacketAssembler extends EventEmitter {
    private readonly _stack;
    private expectedLength;
    private currentLength;
    private readonly readMessageFunc;
    private readonly minimumSizeInBytes;
    private packetInfo?;
    constructor(options: PacketAssemblerOptions);
    feed(data: Buffer): void;
    private _readPacketInfo;
    private _buildData;
}
