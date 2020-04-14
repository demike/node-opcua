/// <reference types="node" />
import { BaseUAObject } from "node-opcua-factory";
interface AnalyzePacketOptions {
}
export declare function analyzePacket(buffer: Buffer, objMessage: any, padding: number, offset?: number, customOptions?: AnalyzePacketOptions): void;
export declare function analyseExtensionObject(buffer: Buffer, padding: number, offset: number, customOptions?: AnalyzePacketOptions): void;
export declare function analyze_object_binary_encoding(obj: BaseUAObject): void;
export {};
