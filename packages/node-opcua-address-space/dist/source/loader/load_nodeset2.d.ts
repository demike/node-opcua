import { ExtraDataTypeManager } from "node-opcua-client-dynamic-extension-object";
import { AddressSpace as AddressSpacePublic } from "../../source";
export declare function ensureDatatypeExtracted(addressSpace: any): Promise<ExtraDataTypeManager>;
export declare const ensureDatatypeExtractedWithCallback: any;
export declare function generateAddressSpace(addressSpace: AddressSpacePublic, xmlFiles: string | string[], callback: (err?: Error) => void): void;
export declare function generateAddressSpace(addressSpace: AddressSpacePublic, xmlFiles: string | string[]): Promise<void>;
