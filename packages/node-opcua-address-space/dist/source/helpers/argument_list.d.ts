import { BinaryStream, OutputBinaryStream } from "node-opcua-binary-stream";
import { NodeId } from "node-opcua-nodeid";
import { Argument } from "node-opcua-service-call";
import { StatusCode } from "node-opcua-status-code";
import { Variant } from "node-opcua-variant";
import { ArgumentOptions } from "node-opcua-types";
import { AddressSpace } from "../address_space_ts";
export declare function encode_ArgumentList(definition: any[], args: any, stream: OutputBinaryStream): void;
export declare function decode_ArgumentList(definition: any[], stream: BinaryStream): any[];
export declare function binaryStoreSize_ArgumentList(description: any, args: any): number;
export declare function getMethodDeclaration_ArgumentList(addressSpace: AddressSpace, objectId: NodeId, methodId: NodeId): any;
/**
 * @method verifyArguments_ArgumentList
 * @param addressSpace
 * @param methodInputArguments
 * @param inputArguments
 * @return statusCode,inputArgumentResults
 */
export declare function verifyArguments_ArgumentList(addressSpace: AddressSpace, methodInputArguments: Argument[], inputArguments?: Variant[]): {
    inputArgumentResults?: StatusCode[];
    statusCode: StatusCode;
};
export declare function build_retrieveInputArgumentsDefinition(addressSpace: AddressSpace): (objectId: NodeId, methodId: NodeId) => any;
export declare function convertJavaScriptToVariant(argumentDefinition: ArgumentOptions[], values: any[]): Variant[];
