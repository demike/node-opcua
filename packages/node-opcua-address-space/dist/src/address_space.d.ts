/**
 * @module node-opcua-address-space
 */
import { ExtraDataTypeManager } from "node-opcua-client-dynamic-extension-object";
import { NodeClass } from "node-opcua-data-model";
import { ExtensionObject } from "node-opcua-extension-object";
import { NodeId, NodeIdLike } from "node-opcua-nodeid";
import { BrowseResult } from "node-opcua-service-browse";
import { BrowseDescription, BrowsePath, BrowsePathResult } from "node-opcua-types";
import { DataType } from "node-opcua-variant";
import { AddReferenceOpts, AddressSpace as AddressSpacePublic, EventData as EventDataPublic, IHistoricalDataNodeOptions, RootFolder, SessionContext, UAEventType, UAEventType as UAEventTypePublic, UAObjectType as UAObjectTypePublic, UAVariableType as UAVariableTypePublic, VariantT } from "../source";
import { AddressSpacePrivate } from "./address_space_private";
import { BaseNode } from "./base_node";
import { isNonEmptyQualifiedName } from "./namespace";
import { NamespacePrivate } from "./namespace_private";
import { Reference } from "./reference";
import { UADataType } from "./ua_data_type";
import { UAMethod } from "./ua_method";
import { UAObject } from "./ua_object";
import { UAReferenceType } from "./ua_reference_type";
import { UAVariable } from "./ua_variable";
import { UAView } from "./ua_view";
/**
 * returns true if str matches a nodeID, e.g i=123 or ns=...
 * @method isNodeIdString
 * @param str
 * @type {boolean}
 */
declare function isNodeIdString(str: any): boolean;
/**
 * `AddressSpace` is a collection of UA nodes.
 *
 *     const addressSpace = AddressSpace.create();
 */
export declare class AddressSpace implements AddressSpacePrivate {
    readonly rootFolder: RootFolder;
    static isNonEmptyQualifiedName: typeof isNonEmptyQualifiedName;
    static historizerFactory?: any;
    static create(): AddressSpacePublic;
    private static registry;
    /***
     * @internal
     * @private
     */
    suspendBackReference: boolean;
    isFrugal: boolean;
    historizingNodes?: any;
    _condition_refresh_in_progress: boolean;
    readonly isNodeIdString: typeof isNodeIdString;
    private readonly _private_namespaceIndex;
    private readonly _namespaceArray;
    private _shutdownTask;
    private _modelChangeTransactionCounter;
    private _modelChanges;
    constructor();
    /**
     * @internal
     */
    getDataTypeManager(): ExtraDataTypeManager;
    getNamespaceUri(namespaceIndex: number): string;
    /***
     * @method getNamespace
     * @param {string|number} namespace index or namespace uri.
     * @return {NameSpace} the namespace
     */
    getNamespace(namespaceIndexOrName: string | number): NamespacePrivate;
    /***
     * @method getDefaultNamespace
     * @return  the  default namespace (standard OPCUA namespace)
     */
    getDefaultNamespace(): NamespacePrivate;
    /***
     * @method getOwnNamespace
     *
     * objects instances managed by the server will be created in this namespace.
     *
     * @return  address space own namespace
     */
    getOwnNamespace(): NamespacePrivate;
    /**
     * @method getNamespaceIndex
     * @param namespaceUri
     * @return the namespace index of a namespace given by its namespace uri
     *
     */
    getNamespaceIndex(namespaceUri: string): number;
    /**
     * @method registerNamespace
     *
     * register a new namespace
     *
     * @param namespaceUri {string}
     * @returns {Namespace}
     */
    registerNamespace(namespaceUri: string): NamespacePrivate;
    /***
     * @method getNamespaceArray
     * @return {Namespace[]} the namespace array
     */
    getNamespaceArray(): NamespacePrivate[];
    /**
     *
     * @method addAlias
     * @param alias {String} the alias name
     * @param nodeId {NodeId}
     * @internal
     */
    addAlias(alias: string, nodeId: NodeId): void;
    /**
     * find an node by node Id
     * @method findNode
     * @param nodeId   a nodeId or a string coerce-able to nodeID, representing the object to find.
     * @return {BaseNode|null}
     */
    findNode(nodeId: NodeIdLike): BaseNode | null;
    findMethod(nodeId: NodeId | string): UAMethod | null;
    /**
     * resolved a string or a nodeId to a nodeID
     */
    resolveNodeId(nodeId: NodeIdLike): NodeId;
    /**
     *
     * @method findObjectType
     * @param objectType  {String|NodeId|QualifiedName}
     * @param [namespaceIndex=0 {Number}] an optional namespace index
     * @return {UAObjectType|null}
     *
     * @example
     *
     *     const objectType = addressSpace.findObjectType("ns=0;i=58");
     *     objectType.browseName.toString().should.eql("BaseObjectType");
     *
     *     const objectType = addressSpace.findObjectType("BaseObjectType");
     *     objectType.browseName.toString().should.eql("BaseObjectType");
     *
     *     const objectType = addressSpace.findObjectType(resolveNodeId("ns=0;i=58"));
     *     objectType.browseName.toString().should.eql("BaseObjectType");
     *
     *     const objectType = addressSpace.findObjectType("CustomObjectType",36);
     *     objectType.nodeId.namespace.should.eql(36);
     *     objectType.browseName.toString().should.eql("BaseObjectType");
     *
     *     const objectType = addressSpace.findObjectType("36:CustomObjectType");
     *     objectType.nodeId.namespace.should.eql(36);
     *     objectType.browseName.toString().should.eql("BaseObjectType");
     */
    findObjectType(objectType: NodeIdLike, namespaceIndex?: number): UAObjectTypePublic | null;
    /**
     * @method findVariableType
     * @param variableType  {String|NodeId}
     * @param [namespaceIndex=0 {Number}] an optional namespace index
     * @return {UAObjectType|null}
     *
     * @example
     *
     *     const objectType = addressSpace.findVariableType("ns=0;i=62");
     *     objectType.browseName.toString().should.eql("BaseVariableType");
     *
     *     const objectType = addressSpace.findVariableType("BaseVariableType");
     *     objectType.browseName.toString().should.eql("BaseVariableType");
     *
     *     const objectType = addressSpace.findVariableType(resolveNodeId("ns=0;i=62"));
     *     objectType.browseName.toString().should.eql("BaseVariableType");
     */
    findVariableType(variableType: string | NodeId, namespaceIndex?: number): UAVariableTypePublic | null;
    /**
     * Find the DataType node from a NodeId or a browseName
     * @method findDataType
     * @param dataType {String|NodeId}
     * @param [namespaceIndex=0 {Number}] an optional namespace index
     * @return {DataType|null}
     *
     *
     * @example
     *
     *      const dataDouble = addressSpace.findDataType("Double");
     *
     *      const dataDouble = addressSpace.findDataType(resolveNodeId("ns=0;i=3"));
     */
    findDataType(dataType: number | string | NodeId | DataType, namespaceIndex?: number): UADataType | null;
    /**
     * @method findCorrespondingBasicDataType
     *
     * @example
     *
     *     const dataType = addressSpace.findDataType("ns=0;i=12");
     *     addressSpace.findCorrespondingBasicDataType(dataType).should.eql(DataType.String);
     *
     *     const dataType = addressSpace.findDataType("ServerStatusDataType"); // ServerStatus
     *     addressSpace.findCorrespondingBasicDataType(dataType).should.eql(DataType.ExtensionObject);
     *
     */
    findCorrespondingBasicDataType(dataTypeNode: NodeIdLike | UADataType): DataType;
    /**
     * find a ReferenceType by its inverse name.
     * @method findReferenceTypeFromInverseName
     * @param inverseName  the inverse name of the ReferenceType to find
     * @deprecated
     */
    findReferenceTypeFromInverseName(inverseName: string): UAReferenceType | null;
    /**
     * @method findReferenceType
     * @param refType {String|NodeId}
     * @param [namespaceIndex=0 {Number}] an optional namespace index
     * @return {ReferenceType|null}
     *
     * refType could be
     *    a string representing a nodeid       : e.g.    'i=9004' or ns=1;i=6030
     *    a string representing a browse name  : e.g     'HasTypeDefinition'
     *      in this case it should be in the alias list
     *
     */
    findReferenceType(refType: NodeIdLike, namespaceIndex?: number): UAReferenceType | null;
    /**
     * returns the inverse name of the referenceType.
     *
     * @method inverseReferenceType
     * @param referenceType {String} : the reference type name
     * @return {String} the name of the inverse reference type.
     *
     * @example
     *
     *    ```javascript
     *    addressSpace.inverseReferenceType("OrganizedBy").should.eql("Organizes");
     *    addressSpace.inverseReferenceType("Organizes").should.eql("OrganizedBy");
     *    ```
     *
     */
    inverseReferenceType(referenceType: string): string;
    /**
     * find an EventType node in the address space
     * @method findEventType
     * @param eventTypeId {String|NodeId|UAObjectType} the eventType to find
     * @param namespaceIndex the namespace index of the event to find
     * @return {UAObjectType|null} the EventType found or null.
     *
     * note:
     *    - the method with throw an exception if a node is found
     *      that is not a BaseEventType or a subtype of it.
     *
     * @example
     *
     *     var evtType = addressSpace.findEventType("AuditEventType");
     *
     */
    findEventType(eventTypeId: NodeIdLike | UAEventType, namespaceIndex?: number): UAEventType | null;
    /**
     * EventId is generated by the Server to uniquely identify a particular Event Notification.
     * @method generateEventId
     * @return {Variant}  dataType: "ByteString"
     */
    generateEventId(): VariantT<DataType.ByteString>;
    constructEventData(eventTypeId: UAEventTypePublic, data: any): EventDataPublic;
    /**
     * browse some path.
     *
     * @method browsePath
     * @param  {BrowsePath} browsePath
     * @return {BrowsePathResult}
     *
     * This service can be used translates one or more browse paths into NodeIds.
     * A browse path is constructed of a starting Node and a RelativePath. The specified starting Node
     * identifies the Node from which the RelativePath is based. The RelativePath contains a sequence of
     * ReferenceTypes and BrowseNames.
     *
     *   |StatusCode                    |                                                            |
     *   |------------------------------|:-----------------------------------------------------------|
     *   |BadNodeIdUnknown              |                                                            |
     *   |BadNodeIdInvalid              |                                                            |
     *   |BadNothingToDo                | - the relative path contains an empty list )               |
     *   |BadBrowseNameInvalid          | - target name is missing in relative path                  |
     *   |UncertainReferenceOutOfServer | - The path element has targets which are in another server.|
     *   |BadTooManyMatches             |                                                            |
     *   |BadQueryTooComplex            |                                                            |
     *   |BadNoMatch                    |                                                            |
     *
     *
     *
     */
    browsePath(browsePath: BrowsePath): BrowsePathResult;
    getExtensionObjectConstructor(dataType: NodeId | UADataType): any;
    /**
     * @param dataType
     * @param [options]
     * @return the constructed extension object
     *
     *
     * @example
     *
     *             // example 1
     *             var extObj = addressSpace.constructExtensionObject("BuildInfo",{ productName: "PRODUCTNAME"});
     *
     *             // example 2
     *             serverStatusDataType.nodeClass.should.eql(NodeClass.DataType);
     *             serverStatusDataType.browseName.toString().should.eql("ServerStatusDataType");
     *             var serverStatus  = addressSpace.constructExtensionObject(serverStatusDataType);
     *             serverStatus.constructor.name.should.eql("ServerStatusDataType");
     */
    constructExtensionObject(dataType: UADataType | NodeId, options: any): ExtensionObject;
    /**
     * cleanup all resources maintained by this addressSpace.
     * @method dispose
     */
    dispose(): void;
    /**
     * register a function that will be called when the server will perform its shut down.
     * @method registerShutdownTask
     */
    registerShutdownTask(task: (this: AddressSpace) => void): void;
    shutdown(): void;
    /**
     *
     * @method browseSingleNode
     * @param nodeId {NodeId|String} : the nodeid of the element to browse
     * @param browseDescription
     * @param browseDescription.browseDirection {BrowseDirection} :
     * @param browseDescription.referenceTypeId {String|NodeId}
     * @param [session]
     * @return {BrowseResult}
     */
    browseSingleNode(nodeId: NodeIdLike, browseDescription: BrowseDescription, context?: SessionContext): BrowseResult;
    /**
     * @param folder
     * @private
     */
    _coerceFolder(folder: UAObject): BaseNode | null;
    /**
     *
     * @param view
     * @param modelChange
     * @private
     */
    _collectModelChange(view: UAView | null, modelChange: any): void;
    /**
     *
     * walk up the hierarchy of objects until a view is found
     * objects may belong to multiples views.
     * Note: this method doesn't return the main view => Server object.
     * @method extractRootViews
     * @param node {BaseNode}
     * @return {BaseNode[]}
     */
    /**
     *
     * @param node
     * @private
     */
    extractRootViews(node: UAObject | UAVariable): UAView[];
    /**
     *
     * @param func
     * @private
     */
    modelChangeTransaction(func: any): void;
    /**
     * normalize the ReferenceType field of the Reference Object
     * @param params.referenceType  {String|nodeId}
     * @param params.isForward  {Boolean} default value: true;
     * @return {Object} a new reference object  with the normalized name { referenceType: <value>, isForward: <flag>}
     */
    normalizeReferenceType(params: AddReferenceOpts | Reference): Reference;
    /**
     *
     * @param references
     */
    normalizeReferenceTypes(references: AddReferenceOpts[] | Reference[] | null): Reference[];
    /**
     *
     * @param node
     * @param options
     */
    installHistoricalDataNode(node: UAVariable, options?: IHistoricalDataNodeOptions): void;
    /**
     *
     */
    installAlarmsAndConditionsService(): void;
    _coerceNode(node: string | BaseNode | NodeId): BaseNode | null;
    _coerce_DataType(dataType: NodeId | string | BaseNode): NodeId;
    _coerceTypeDefinition(typeDefinition: string | NodeId): NodeId;
    _coerceType<T extends BaseNode>(baseType: string | NodeId | BaseNode, topMostBaseType: string, nodeClass: NodeClass): T;
    _coerce_VariableTypeIds(dataType: NodeId | string | BaseNode): NodeId;
    _register(node: BaseNode): void;
    deleteNode(nodeOrNodeId: NodeId | BaseNode): void;
    private _coerce_Type;
    private _constructNamespaceArray;
    private _findReferenceType;
    private _build_new_NodeId;
    private _resolveRequestedNamespace;
}
export {};
