import { NodeIdLike } from "node-opcua-nodeid";
import { BrowseDescriptionOptions, ReferenceDescription } from "node-opcua-types";
import { AddressSpace, BaseNode, UAReference } from "../address_space_ts";
export declare function referenceTypeToString(addressSpace: AddressSpace, referenceTypeId: NodeIdLike | null): string;
export declare function dumpReferenceDescription(addressSpace: AddressSpace, referenceDescription: ReferenceDescription): void;
export declare function dumpReferenceDescriptions(addressSpace: AddressSpace, referenceDescriptions: ReferenceDescription[]): void;
export declare function dumpBrowseDescription(node: BaseNode, _browseDescription: BrowseDescriptionOptions): void;
/**
 * @method dumpReferences
 * @param addressSpace    {AddressSpace}
 * @param references  {Array<Reference>|null}
 * @static
 */
export declare function dumpReferences(addressSpace: AddressSpace, references: UAReference[]): void;
