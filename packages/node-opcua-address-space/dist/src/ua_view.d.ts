import { NodeClass } from "node-opcua-data-model";
import { AttributeIds } from "node-opcua-data-model";
import { DataValue } from "node-opcua-data-value";
import { UAView as UAViewPublic } from "../source";
import { BaseNode, InternalBaseNodeOptions } from "./base_node";
import { SessionContext } from "./session_context";
export interface InternalViewOptions extends InternalBaseNodeOptions {
    containsNoLoops?: boolean;
}
export declare class UAView extends BaseNode implements UAViewPublic {
    readonly nodeClass = NodeClass.View;
    readonly containsNoLoops: boolean;
    readonly eventNotifier: number;
    constructor(options: InternalViewOptions);
    readAttribute(context: SessionContext, attributeId: AttributeIds): DataValue;
}
