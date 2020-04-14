import { QualifiedName } from "node-opcua-data-model";
import { NodeId } from "node-opcua-nodeid";
import { BrowsePath } from "./imports";
export { stringToQualifiedName } from "node-opcua-data-model";
/**
 * @method constructBrowsePathFromQualifiedName
 * @param startingNode
 * @param targetNames
 * @return {BrowsePath}
 */
export declare function constructBrowsePathFromQualifiedName(startingNode: {
    nodeId: NodeId;
}, targetNames: QualifiedName[] | null): BrowsePath;
