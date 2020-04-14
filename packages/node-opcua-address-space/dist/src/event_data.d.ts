import { NodeId } from "node-opcua-nodeid";
import { SimpleAttributeOperand } from "node-opcua-types";
import { Variant, VariantLike } from "node-opcua-variant";
import { BaseNode as BaseNodePublic, EventData as EventDataPublic } from "../source/address_space_ts";
/**
 * @class EventData
 * @param eventTypeNode {BaseNode}
 * @constructor
 */
export declare class EventData implements EventDataPublic {
    eventId: NodeId;
    $eventDataSource: BaseNodePublic;
    private __nodes;
    constructor(eventTypeNode: BaseNodePublic);
    /**
     * @method resolveSelectClause
     * @param selectClause {SimpleAttributeOperand}
     * @return {NodeId|null}
     */
    resolveSelectClause(selectClause: SimpleAttributeOperand): import("node-opcua-nodeid").ExpandedNodeId | null;
    setValue(lowerName: string, node: BaseNodePublic, variant: VariantLike): void;
    /**
     * @method readValue
     * @param nodeId {NodeId}
     * @param selectClause {SimpleAttributeOperand}
     * @return {Variant}
     */
    readValue(nodeId: NodeId, selectClause: SimpleAttributeOperand): Variant;
}
