/**
 * @module node-opcua-secure-channel
 */
/// <reference types="node" />
import { DerivedKeys } from "node-opcua-crypto";
import { BaseUAObject } from "node-opcua-factory";
import { SecureMessageChunkManagerOptions, SecurityHeader } from "./secure_message_chunk_manager";
export interface MessageChunkerOptions {
    securityHeader?: SecurityHeader;
    derivedKeys?: DerivedKeys | null;
}
export declare type MessageCallbackFunc = (chunk: Buffer | null) => void;
export interface ChunkMessageOptions extends SecureMessageChunkManagerOptions {
    tokenId: number;
}
/**
 * @class MessageChunker
 * @param options {Object}
 * @param options.securityHeader  {Object} SecurityHeader
 * @param [options.derivedKeys] {Object} derivedKeys
 * @constructor
 */
export declare class MessageChunker {
    securityHeader?: any;
    private readonly sequenceNumberGenerator;
    private _stream?;
    private derivedKeys?;
    constructor(options: MessageChunkerOptions);
    dispose(): void;
    /***
     * update security information
     */
    update(options?: MessageChunkerOptions): void;
    chunkSecureMessage(msgType: string, options: ChunkMessageOptions, message: BaseUAObject, messageChunkCallback: MessageCallbackFunc): void;
}
