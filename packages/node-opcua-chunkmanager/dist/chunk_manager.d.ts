/// <reference types="node" />
/***
 * @module node-opcua-chunkmanager
 */
import { EventEmitter } from "events";
export declare function verify_message_chunk(messageChunk: Buffer): void;
export declare type WriteHeaderFunc = (chunk: Buffer, isLast: boolean, expectedLength: number) => void;
export declare type WriteSequenceHeaderFunc = (chunk: Buffer) => void;
export declare type SignBufferFunc = (buffer: Buffer) => Buffer;
export declare type EncryptBufferFunc = (buffer: Buffer) => Buffer;
export interface IChunkManagerOptions {
    chunkSize: number;
    signatureLength: number;
    sequenceHeaderSize: number;
    cipherBlockSize: number;
    plainBlockSize: number;
    signBufferFunc?: SignBufferFunc;
    encryptBufferFunc?: EncryptBufferFunc;
    writeSequenceHeaderFunc?: WriteSequenceHeaderFunc;
    headerSize: number;
    writeHeaderFunc?: WriteHeaderFunc;
}
export declare class ChunkManager extends EventEmitter {
    signBufferFunc?: SignBufferFunc;
    encryptBufferFunc?: EncryptBufferFunc;
    writeSequenceHeaderFunc?: WriteSequenceHeaderFunc;
    writeHeaderFunc?: WriteHeaderFunc;
    private readonly chunkSize;
    private readonly headerSize;
    private readonly signatureLength;
    private readonly sequenceHeaderSize;
    private readonly cipherBlockSize;
    private readonly plainBlockSize;
    private readonly maxBodySize;
    private readonly maxBlock?;
    private readonly dataOffset;
    private chunk;
    private cursor;
    private pendingChunk;
    private dataEnd;
    constructor(options: IChunkManagerOptions);
    write(buffer: Buffer, length?: number): void;
    end(): void;
    /**
     * compute the signature of the chunk and append it at the end
     * of the data block.
     *
     * @method _write_signature
     * @private
     */
    private _write_signature;
    private _encrypt;
    private _push_pending_chunk;
    private _write_padding_bytes;
    private _post_process_current_chunk;
}
