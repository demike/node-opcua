/// <reference types="node" />
import { EventEmitter } from "events";
import { AttributeIds, BrowseDirection, LocalizedText, LocalizedTextLike, NodeClass, QualifiedName, QualifiedNameLike } from "node-opcua-data-model";
import { DataValue } from "node-opcua-data-value";
import { NodeId, NodeIdLike } from "node-opcua-nodeid";
import { NumericRange } from "node-opcua-numeric-range";
import { ReferenceDescription } from "node-opcua-service-browse";
import { StatusCode } from "node-opcua-status-code";
import { BrowseDescription, RelativePathElement } from "node-opcua-types";
import { AddReferenceOpts, BaseNode as BaseNodePublic, ModellingRuleType, Namespace, SessionContext, UAMethod as UAMethodPublic, UAObject as UAObjectPublic, UAObjectType as UAObjectTypePublic, UAReference, UAReference as UAReferencePublic, UAReferenceType as UAReferenceTypePublic, UAVariable as UAVariablePublic, UAVariableType as UAVariableTypePublic, XmlWriter } from "../source";
import { AddressSpacePrivate } from "./address_space_private";
import { Reference } from "./reference";
export interface InternalBaseNodeOptions {
    /**
     * the parent address space
     */
    addressSpace: AddressSpacePrivate;
    browseName: QualifiedName;
    nodeId: NodeId;
    references?: Reference[];
    displayName?: LocalizedTextLike | LocalizedTextLike[];
    description?: LocalizedTextLike | null;
    browseFilter?: (this: BaseNode, context?: SessionContext) => boolean;
}
export interface BaseNode {
    nodeVersion?: number;
}
export declare function makeAttributeEventName(attributeId: AttributeIds): string;
/**
 * Base class for all Node classes
 *
 * BaseNode is the base class for all the OPCUA objects in the address space
 * It provides attributes and a set of references to other nodes.
 * see:
 * {{#crossLink "UAObject"}}{{/crossLink}},
 * {{#crossLink "UAVariable"}}{{/crossLink}},
 * {{#crossLink "Reference"}}{{/crossLink}},
 * {{#crossLink "UAMethod"}}{{/crossLink}},
 * {{#crossLink "UAView"}}{{/crossLink}},
 * {{#crossLink "UAObjecType"}}{{/crossLink}},
 * {{#crossLink "UADataType"}}{{/crossLink}},
 * {{#crossLink "UAVariableType"}}{{/crossLink}},
 *
 *
 */
export declare class BaseNode extends EventEmitter implements BaseNodePublic {
    readonly addressSpace: AddressSpacePrivate;
    displayName: LocalizedText[];
    description: LocalizedText;
    /**
     * returns the nodeId of this node's Type Definition
     */
    readonly typeDefinition: NodeId;
    /**
     * returns the nodeId of this node's Type Definition
     */
    readonly typeDefinitionObj: UAObjectTypePublic | UAVariableTypePublic;
    readonly parentNodeId: NodeId | undefined;
    /**
     * namespace index
     */
    readonly namespaceIndex: number;
    /**
     * namespace uri
     */
    readonly namespaceUri: string;
    /**
     * the parent node
     */
    readonly parent: BaseNodePublic | null;
    /**
     * @property modellingRule
     * @type {String|undefined}
     */
    readonly modellingRule: ModellingRuleType;
    static makeAttributeEventName(attributeId: AttributeIds): string;
    protected static _getCache(baseNode: BaseNode): any;
    nodeClass: NodeClass;
    readonly nodeId: NodeId;
    readonly browseName: QualifiedName;
    protected _postInstantiateFunc?: any;
    /**
     * @internal
     * @param options
     */
    constructor(options: InternalBaseNodeOptions);
    getDisplayName(locale?: string): string;
    readonly namespace: Namespace;
    findReferencesEx(strReference: string, browseDirection?: BrowseDirection): UAReferencePublic[];
    /**
     * @method findReferences
     * @param   referenceType {String|NodeId|ReferenceType} the referenceType as a string.
     * @param  [isForward]  default=true
     * @return an array with references
     */
    findReferences(referenceType: string | NodeId | UAReferenceTypePublic, isForward?: boolean): UAReferencePublic[];
    /**
     * @method findReference
     * @param strReference the referenceType as a string.
     * @param [isForward]
     * @return {Reference}
     */
    findReference(strReference: string, isForward?: boolean): UAReferencePublic | null;
    findReferencesExAsObject(strReference: string, browseDirection?: BrowseDirection): BaseNode[];
    findReferencesAsObject(strReference: string, isForward?: boolean): BaseNode[];
    /**
     * return an array with the Aggregates of this object.
     */
    getAggregates(): BaseNode[];
    /**
     * return an array with the components of this object.
     */
    getComponents(): BaseNode[];
    /**
     *  return a array with the properties of this object.
     */
    getProperties(): BaseNode[];
    /**
     * return a array with the notifiers of this object.
     */
    getNotifiers(): BaseNode[];
    /**
     * return a array with the event source of this object.
     */
    getEventSources(): BaseNode[];
    /**
     * return a array of the objects for which this node is an EventSource
     */
    getEventSourceOfs(): BaseNode[];
    /**
     * retrieve a component by name
     */
    getComponentByName(browseName: QualifiedNameLike, namespaceIndex?: number): UAVariablePublic | UAObjectPublic | null;
    /**
     * retrieve a property by name
     */
    getPropertyByName(browseName: string, namespaceIndex?: number): UAVariablePublic | null;
    /**
     * retrieve a folder by name
     */
    getFolderElementByName(browseName: string, namespaceIndex?: number): BaseNode | null;
    /**
     * returns the list of nodes that this folder object organizes
     */
    getFolderElements(): BaseNode[];
    /**
     * returns the list of methods that this object provides
     * @method getMethods
     * @return an array with Method objects.
     *
     *
     * Note: internally, methods are special types of components
     */
    getMethods(): UAMethodPublic[];
    /**
     * returns the method exposed by this object and with the given nodeId
     */
    getMethodById(nodeId: NodeId): UAMethodPublic | null;
    getMethodByName(browseName: string, namespaceIndex?: number): UAMethodPublic | null;
    getWriteMask(): number;
    getUserWriteMask(): number;
    readAttribute(context: SessionContext | null, attributeId: AttributeIds, indexRange?: NumericRange, dataEncoding?: string): DataValue;
    writeAttribute(context: SessionContext, writeValue: any, callback: (err: Error | null, statusCode?: StatusCode) => void): void;
    fullName(): string;
    ownReferences(): Reference[];
    /**
     * @method browseNodeByTargetName
     *
     * @param relativePathElement
     * @param isLast
     * @return {NodeId[]}
     */
    browseNodeByTargetName(relativePathElement: RelativePathElement, isLast: boolean): NodeId[];
    /**
     * browse the node to extract information requested in browseDescription
     * @method browseNode
     * @param browseDescription
     * @param context
     * @return an array with reference descriptions
     */
    browseNode(browseDescription: BrowseDescription, context?: SessionContext): ReferenceDescription[];
    allReferences(): Reference[];
    /**
     * @method addReference
     * @param reference
     * @param reference.referenceType {String}
     * @param [reference.isForward = true] {Boolean}
     * @param reference.nodeId {Node|NodeId|String}
     *
     * @example
     *
     *     view.addReference({ referenceType: "Organizes", nodeId: myDevice });
     *
     * or
     *
     *     myDevice1.addReference({ referenceType: "OrganizedBy", nodeId: view });
     */
    addReference(reference: AddReferenceOpts): void;
    removeReference(referencOpts: AddReferenceOpts): void;
    /**
     *
     */
    resolveNodeId(nodeId: NodeIdLike): NodeId;
    install_extra_properties(): void;
    uninstall_extra_properties(reference: Reference): void;
    toString(): string;
    /**
     * @property isFalseSubStateOf
     * @type {BaseNode|null}
     */
    readonly isFalseSubStateOf: BaseNodePublic | null;
    /**
     * @property isTrueSubStateOf
     * @type {BaseNode|null}
     */
    readonly isTrueSubStateOf: BaseNodePublic | null;
    /**
     * @method getFalseSubStates
     * @return {BaseNode[]} return an array with the SubStates of this object.
     */
    getFalseSubStates(): BaseNode[];
    /**
     * @method getTrueSubStates
     * @return {BaseNode[]} return an array with the SubStates of this object.
     */
    getTrueSubStates(): BaseNode[];
    findHierarchicalReferences(): UAReference[];
    getChildByName(browseName: string | QualifiedName): BaseNode | null;
    readonly toStateNode: BaseNode | null;
    readonly fromStateNode: BaseNode | null;
    /**
     * this methods propagates the forward references to the pointed node
     * by inserting backward references to the counter part node
     */
    propagate_back_references(): void;
    /**
     * the dispose method should be called when the node is no longer used, to release
     * back pointer to the address space and clear caches.
     *
     * @method dispose
     *
     */
    dispose(): void;
    dumpXML(xmlWriter: XmlWriter): void;
    /**
     * Undo the effect of propagate_back_references
     */
    unpropagate_back_references(): void;
    installPostInstallFunc(f: any): void;
    _on_child_added(): void;
    _on_child_removed(obj: BaseNode): void;
    protected _add_backward_reference(reference: Reference): void;
    protected _coerceReferenceType(referenceType: string | NodeId | UAReferenceTypePublic): UAReferenceTypePublic;
    protected __findReferenceWithBrowseName(referenceType: any, browseName: any): BaseNode;
    private __addReference;
    private _setDisplayName;
    private _setDescription;
    private _notifyAttributeChange;
    private _clear_caches;
}
