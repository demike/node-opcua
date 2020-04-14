/// <reference types="node" />
import { SecureMessageChunkManagerOptions } from "../source";
export declare const makeMessageChunkSignatureForTest: (chunk: Buffer) => Buffer;
export declare function construct_verifyMessageChunkSignatureForTest(): (chunk: Buffer) => boolean;
export declare const verifyMessageChunkSignatureForTest: (chunk: Buffer) => boolean;
export declare function performMessageChunkManagerTest(options: SecureMessageChunkManagerOptions): void;
