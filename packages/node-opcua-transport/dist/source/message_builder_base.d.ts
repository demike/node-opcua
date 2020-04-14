/// <reference types="node" />
/**
 * @module node-opcua-transport
 */
import { EventEmitter } from "events";
import { BinaryStream } from "node-opcua-binary-stream";
import { SequenceHeader } from "node-opcua-chunkmanager";
import { PacketAssembler, PacketInfo } from "node-opcua-packet-assembler";
export declare function readRawMessageHeader(data: Buffer): PacketInfo;
/**
 * @class MessageBuilderBase
 * @extends EventEmitter
 * @uses PacketAssembler
 * @constructor
 * @param options {Object}
 * @param [options.signatureLength=0] {number}
 *
 */
export declare class MessageBuilderBase extends EventEmitter {
    readonly signatureLength: number;
    readonly options: {
        signatureLength?: number;
    };
    readonly _packetAssembler: PacketAssembler;
    channelId: number;
    totalMessageSize: number;
    sequenceHeader: SequenceHeader | null;
    _tick0: number;
    _tick1: number;
    protected id: string;
    protected totalBodySize: number;
    protected messageChunks: Buffer[];
    protected messageHeader: any;
    private _securityDefeated;
    private _hasReceivedError;
    private blocks;
    private readonly _expectedChannelId;
    private offsetBodyStart;
    constructor(options?: {
        signatureLength?: number;
    });
    dispose(): void;
    /**
     * Feed message builder with some data
     * @method feed
     * @param data
     */
    feed(data: Buffer): void;
    protected _decodeMessageBody(fullMessageBody: Buffer): boolean;
    protected _read_headers(binaryStream: BinaryStream): boolean;
    protected _report_error(errorMessage: string): false;
    private _init_new;
    /**
     * append a message chunk
     * @method _append
     * @param chunk
     * @private
     */
    private _append;
    private _feed_messageChunk;
}
