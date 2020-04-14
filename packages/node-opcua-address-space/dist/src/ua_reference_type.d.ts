/**
 * @module node-opcua-address-space
 */
import { LocalizedText, NodeClass } from "node-opcua-data-model";
import { AttributeIds } from "node-opcua-data-model";
import { DataValue } from "node-opcua-data-value";
import { NodeId } from "node-opcua-nodeid";
import { SessionContext, UAReferenceType as UAReferenceTypePublic } from "../source";
import { BaseNode } from "./base_node";
export declare class UAReferenceType extends BaseNode implements UAReferenceTypePublic {
    readonly nodeClass = NodeClass.ReferenceType;
    readonly subtypeOfObj: UAReferenceTypePublic | null;
    readonly subtypeOf: NodeId | null;
    isAbstract: boolean;
    symmetric: boolean;
    inverseName: LocalizedText;
    /**
     * returns true if self is  a super type of baseType
     */
    isSupertypeOf: (baseType: UAReferenceType) => boolean;
    _slow_isSupertypeOf: (baseType: UAReferenceType) => boolean;
    constructor(options: any);
    readAttribute(context: SessionContext | null, attributeId: AttributeIds): DataValue;
    toString(): string;
    install_extra_properties(): void;
    /**
     * returns a array of all ReferenceTypes in the addressSpace that are self or a subType of self
     */
    getAllSubtypes(): UAReferenceType[];
    private is;
}
