import { BinaryStream, OutputBinaryStream } from "node-opcua-binary-stream";
import { ExpandedNodeId, NodeId } from "node-opcua-nodeid";
export declare function isValidNodeId(nodeId: any): boolean;
export declare function randomNodeId(): NodeId;
export declare function encodeNodeId(nodeId: NodeId, stream: OutputBinaryStream): void;
export declare function encodeExpandedNodeId(expandedNodeId: ExpandedNodeId, stream: OutputBinaryStream): void;
export declare function decodeNodeId(stream: BinaryStream): NodeId;
export declare function decodeExpandedNodeId(stream: BinaryStream): ExpandedNodeId;
export { coerceNodeId, coerceExpandedNodeId } from "node-opcua-nodeid";
