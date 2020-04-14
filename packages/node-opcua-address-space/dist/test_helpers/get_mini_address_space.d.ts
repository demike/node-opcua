import { AddressSpace } from "../source";
export declare const mini_nodeset = "mini.Node.Set2.xml";
export declare const empty_nodeset = "fixture_empty_nodeset2.xml";
export declare const get_mini_nodeset_filename: () => string;
export declare const get_empty_nodeset_filename: () => string;
export declare function getMiniAddressSpace(callback: (err: Error | null, addressSpace?: AddressSpace) => void): void;
export declare function getMiniAddressSpace(): Promise<AddressSpace>;
