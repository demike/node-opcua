/// <reference types="node" />
import { DerivedKeys } from "node-opcua-crypto";
export declare type ChunkVisitorFunc = (err: Error | null, chunk?: Buffer) => void;
export declare function iterateOnSignedMessageChunks(buffer: Buffer, callback: ChunkVisitorFunc): void;
export declare function iterateOnSignedAndEncryptedMessageChunks(buffer: Buffer, callback: ChunkVisitorFunc): void;
export declare const derivedKeys: DerivedKeys;
export declare function iterateOnSymmetricEncryptedChunk(buffer: Buffer, callback: ChunkVisitorFunc): void;
