/// <reference types="node" />
/**
 * @module node-opcua-secure-channel
 */
import { EventEmitter } from "events";
import { EncryptBufferFunc, SignBufferFunc } from "node-opcua-chunkmanager";
import { AsymmetricAlgorithmSecurityHeader, SymmetricAlgorithmSecurityHeader } from "node-opcua-service-secure-channel";
import { SequenceNumberGenerator } from "./sequence_number_generator";
export declare type SecurityHeader = AsymmetricAlgorithmSecurityHeader | SymmetricAlgorithmSecurityHeader;
export declare function chooseSecurityHeader(msgType: string): SecurityHeader;
export declare type VerifyBufferFunc = (chunk: Buffer) => boolean;
export interface SecureMessageChunkManagerOptions {
    chunkSize?: number;
    channelId?: number;
    requestId: number;
    signatureLength: number;
    sequenceHeaderSize: number;
    plainBlockSize: number;
    cipherBlockSize: number;
    encryptBufferFunc?: EncryptBufferFunc;
    signBufferFunc?: SignBufferFunc;
    verifyBufferFunc?: VerifyBufferFunc;
}
export declare class SecureMessageChunkManager extends EventEmitter {
    private aborted;
    private readonly chunkSize;
    private readonly msgType;
    private readonly channelId;
    private readonly sequenceNumberGenerator;
    private readonly securityHeader;
    private sequenceHeader;
    private readonly headerSize;
    private readonly chunkManager;
    private readonly sequenceHeaderSize;
    constructor(msgType: string, options: SecureMessageChunkManagerOptions, securityHeader: SecurityHeader | null, sequenceNumberGenerator: SequenceNumberGenerator);
    write_header(finalC: string, buffer: Buffer, length: number): void;
    writeSequenceHeader(buffer: Buffer): void;
    write(buffer: Buffer, length?: number): void;
    abort(): void;
    end(): void;
}
