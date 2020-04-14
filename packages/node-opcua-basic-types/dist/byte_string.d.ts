/// <reference types="node" />
import { BinaryStream, OutputBinaryStream } from "node-opcua-binary-stream";
export declare function isValidByteString(value: any): boolean;
export declare type ByteString = Buffer;
export declare function randomByteString(value: any, len: number): ByteString;
export declare function encodeByteString(byteString: ByteString, stream: OutputBinaryStream): void;
export declare function decodeByteString(stream: BinaryStream): ByteString;
export declare function coerceByteString(value: any): ByteString;
