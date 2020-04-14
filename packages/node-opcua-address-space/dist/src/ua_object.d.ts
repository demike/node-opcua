import { NodeClass } from "node-opcua-data-model";
import { AttributeIds } from "node-opcua-data-model";
import { DataValue } from "node-opcua-data-value";
import { EventTypeLike, RaiseEventData, SessionContext, UAMethod as UAMethodPublic, UAObject as UAObjectPublic, UAObjectType as UAObjectTypePublic } from "../source";
import { BaseNode } from "./base_node";
export declare class UAObject extends BaseNode implements UAObjectPublic {
    readonly nodeClass = NodeClass.Object;
    readonly eventNotifier: number;
    readonly symbolicName: string;
    readonly typeDefinitionObj: UAObjectTypePublic;
    constructor(options: any);
    readAttribute(context: SessionContext, attributeId: AttributeIds): DataValue;
    clone(options: any, optionalFilter: any, extraInfo: any): BaseNode;
    /**
     * returns true if the object has some opcua methods
     */
    readonly hasMethods: boolean;
    getMethodByName(methodName: string): UAMethodPublic | null;
    getMethods(): UAMethodPublic[];
    /**
     * Raise a transient Event
     */
    raiseEvent(eventType: EventTypeLike | BaseNode, data: RaiseEventData): void;
    _bubble_up_event(eventData: any): void;
    _conditionRefresh(_cache?: any): void;
    toString(): string;
}
