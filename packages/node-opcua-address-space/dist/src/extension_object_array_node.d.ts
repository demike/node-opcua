import { NodeId } from "node-opcua-nodeid";
import { ExtensionObject } from "node-opcua-extension-object";
import { AddressSpace, UADynamicVariableArray, UAObject, UAVariable as UAVariablePublic } from "../source/address_space_ts";
import { UADataType } from "./ua_data_type";
import { UAVariable } from "./ua_variable";
/**
 * @method prepareDataType
 * @private
 * @param dataType
 */
export declare function prepareDataType(addressSpace: AddressSpace, dataType: UADataType): void;
/**
 *
 * create a node Variable that contains a array of ExtensionObject of a given type
 * @method createExtObjArrayNode
 * @param parentFolder
 * @param options
 * @param options.browseName
 * @param options.complexVariableType
 * @param options.variableType        the type of Extension objects stored in the array.
 * @param options.indexPropertyName
 * @return {Object|UAVariable}
 */
export declare function createExtObjArrayNode<T extends ExtensionObject>(parentFolder: UAObject, options: any): UADynamicVariableArray<T>;
/**
 * @method bindExtObjArrayNode
 * @param uaArrayVariableNode
 * @param variableTypeNodeId
 * @param indexPropertyName
 * @return
 */
export declare function bindExtObjArrayNode<T extends ExtensionObject>(uaArrayVariableNode: UADynamicVariableArray<T>, variableTypeNodeId: string | NodeId, indexPropertyName: string): UAVariablePublic;
/**
 * @method addElement
 * add a new element in a ExtensionObject Array variable
 * @param options {Object}   data used to construct the underlying ExtensionObject
 * @param uaArrayVariableNode {UAVariable}
 * @return {UAVariable}
 *
 * @method addElement
 * add a new element in a ExtensionObject Array variable
 * @param nodeVariable a variable already exposing an extension objects
 * @param uaArrayVariableNode {UAVariable}
 * @return {UAVariable}
 *
 * @method addElement
 * add a new element in a ExtensionObject Array variable
 * @param constructor  constructor of the extension object to create
 * @param uaArrayVariableNode {UAVariable}
 * @return {UAVariable}
 */
export declare function addElement<T extends ExtensionObject>(options: any, uaArrayVariableNode: UADynamicVariableArray<T>): UAVariable;
/**
 *
 * @method removeElement
 * @param uaArrayVariableNode {UAVariable}
 * @param element {number}   index of element to remove in array
 *
 *
 * @method removeElement
 * @param uaArrayVariableNode {UAVariable}
 * @param element {UAVariable}   node of element to remove in array
 *
 * @method removeElement
 * @param uaArrayVariableNode {UAVariable}
 * @param element {ExtensionObject}   extension object of the node of element to remove in array
 *
 */
export declare function removeElement<T extends ExtensionObject>(uaArrayVariableNode: UADynamicVariableArray<T>, element: any): void;
