import { QualifiedName } from "node-opcua-data-model";
import { NodeId } from "node-opcua-nodeid";
import { AddAnalogDataItemOptions, AddDataItemOptions, AddEnumerationTypeOptions, AddMethodOptions, AddMultiStateDiscreteOptions, AddMultiStateValueDiscreteOptions, AddObjectOptions, AddObjectTypeOptions, AddReferenceOpts, AddReferenceTypeOptions, AddTwoStateVariableOptions, AddVariableOptions, AddVariableTypeOptions, AddViewOptions, AddYArrayItemOptions, CreateDataTypeOptions, CreateNodeOptions, InitialState, Namespace as NamespacePublic, State, StateMachine, Transition, UAEventType, UAMultiStateDiscrete as UAMultiStateDiscretePublic, UAVariable as UAVariablePublic, UAVariableType as UAVariableTypePublic, YArrayItemVariable } from "../source";
import { UATwoStateDiscrete } from "../source/interfaces/data_access/ua_two_state_discrete";
import { AddressSpacePrivate } from "./address_space_private";
import { UAAcknowledgeableConditionBase } from "./alarms_and_conditions/ua_acknowledgeable_condition_base";
import { UAAlarmConditionBase } from "./alarms_and_conditions/ua_alarm_condition_base";
import { UAConditionBase } from "./alarms_and_conditions/ua_condition_base";
import { UADiscreteAlarm } from "./alarms_and_conditions/ua_discrete_alarm";
import { UAExclusiveDeviationAlarm } from "./alarms_and_conditions/ua_exclusive_deviation_alarm";
import { UAExclusiveLimitAlarm } from "./alarms_and_conditions/ua_exclusive_limit_alarm";
import { UALimitAlarm } from "./alarms_and_conditions/ua_limit_alarm";
import { UANonExclusiveDeviationAlarm } from "./alarms_and_conditions/ua_non_exclusive_deviation_alarm";
import { UANonExclusiveLimitAlarm } from "./alarms_and_conditions/ua_non_exclusive_limit_alarm";
import { UAOffNormalAlarm } from "./alarms_and_conditions/ua_off_normal_alarm";
import { BaseNode } from "./base_node";
import { UAAnalogItem } from "./data_access/ua_analog_item";
import { UADataItem } from "./data_access/ua_data_item";
import { UAMultiStateValueDiscrete } from "./data_access/ua_mutlistate_value_discrete";
import { UADataType } from "./ua_data_type";
import { UAMethod } from "./ua_method";
import { UAObject } from "./ua_object";
import { UAObjectType } from "./ua_object_type";
import { UAReferenceType } from "./ua_reference_type";
import { UATwoStateVariable } from "./ua_two_state_variable";
import { UAVariableType } from "./ua_variable_type";
import { UAView } from "./ua_view";
export declare const NamespaceOptions: {
    nodeIdNameSeparator: string;
};
/**
 *
 * @constructor
 * @params options {Object}
 * @params options.namespaceUri {string}
 * @params options.addressSpace {AddressSpace}
 * @params options.index {number}
 * @params options.version="" {string}
 * @params options.publicationDate="" {Date}
 *
 */
export declare class UANamespace implements NamespacePublic {
    static _handle_hierarchy_parent: typeof _handle_hierarchy_parent;
    static isNonEmptyQualifiedName: typeof isNonEmptyQualifiedName;
    readonly namespaceUri: string;
    addressSpace: AddressSpacePrivate;
    readonly index: number;
    version: number;
    publicationDate: Date;
    _nodeid_index: {
        [key: string]: BaseNode;
    };
    _objectTypeMap: {
        [key: string]: UAObjectType;
    };
    _variableTypeMap: {
        [key: string]: UAVariableType;
    };
    _referenceTypeMap: {
        [key: string]: UAReferenceType;
    };
    private _internal_id_counter;
    private _aliases;
    private _referenceTypeMapInv;
    private _dataTypeMap;
    constructor(options: any);
    getDefaultNamespace(): UANamespace;
    dispose(): void;
    findNode(nodeId: string | NodeId): BaseNode | null;
    /**
     *
     * @param objectTypeName {String}
     * @return {UAObjectType|null}
     */
    findObjectType(objectTypeName: string): UAObjectType | null;
    /**
     *
     * @param variableTypeName {String}
     * @returns {UAVariableType|null}
     */
    findVariableType(variableTypeName: string): UAVariableTypePublic | null;
    /**
     *
     * @param dataTypeName {String}
     * @returns {UADataType|null}
     */
    findDataType(dataTypeName: string): UADataType | null;
    /**
     *
     * @param referenceTypeName {String}
     * @returns  {ReferenceType|null}
     */
    findReferenceType(referenceTypeName: string): UAReferenceType | null;
    /**
     * find a ReferenceType by its inverse name.
     * @method findReferenceTypeFromInverseName
     * @param inverseName {String} the inverse name of the ReferenceType to find
     * @return {ReferenceType}
     */
    findReferenceTypeFromInverseName(inverseName: string): UAReferenceType | null;
    /**
     *
     * @method addAlias
     * @param alias_name {String} the alias name
     * @param nodeId {NodeId} NodeId must belong to this namespace
     */
    addAlias(alias_name: string, nodeId: NodeId): void;
    resolveAlias(name: string): NodeId | null;
    /**
     * add a new Object type to the address space
     * @method addObjectType
     * @param options
     * @param options.browseName {String} the object type name
     * @param [options.displayName] {String|LocalizedText} the display name
     * @param [options.subtypeOf="BaseObjectType"] {String|NodeId|BaseNode} the base class
     * @param [options.nodeId] {String|NodeId} an optional nodeId for this objectType,
     *                                         if not provided a new nodeId will be created
     * @param [options.isAbstract = false] {Boolean}
     * @param [options.eventNotifier = 0] {Integer}
     * @param [options.postInstantiateFunc = null] {Function}
     *
     */
    addObjectType(options: AddObjectTypeOptions): UAObjectType;
    /**
     * add a new Variable type to the address space
     * @method addVariableType
     * @param options
     * @param options.browseName {String} the object type name
     * @param [options.displayName] {String|LocalizedText} the display name
     * @param [options.subtypeOf="BaseVariableType"] {String|NodeId|BaseNode} the base class
     * @param [options.nodeId] {String|NodeId} an optional nodeId for this objectType,
     *                                             if not provided a new nodeId will be created
     * @param [options.isAbstract = false] {Boolean}
     * @param options.dataType {String|NodeId} the variable DataType
     * @param [options.valueRank = -1]
     * @param [options.arrayDimensions = null] { Array<Int>>
     *
     */
    addVariableType(options: AddVariableTypeOptions): UAVariableTypePublic;
    /**
     * add a variable as a component of the parent node
     *
     * @method addVariable
     * @param options
     * @param options.browseName       the variable name
     * @param options.dataType        the variable datatype ( "Double", "UInt8" etc...)
     * @param [options.typeDefinition="BaseDataVariableType"]
     * @param [options.modellingRule=null] the Modelling rule : "Optional" , "Mandatory"
     * @param [options.valueRank= -1]    the valueRank
     * @param [options.arrayDimensions]
     * @return UAVariable
     */
    addVariable(options: AddVariableOptions): UAVariablePublic;
    addView(options: AddViewOptions): UAView;
    addObject(options1: AddObjectOptions): UAObject;
    /**
     *
     * @method addFolder
     * @param parentFolder
     * @param options {String|Object}
     * @param options.browseName {String} the name of the folder
     * @param [options.nodeId] {NodeId}. An optional nodeId for this object
     *
     * @return {BaseNode}
     */
    addFolder(parentFolder: UAObject, options: any): UAObject;
    /**
     * @method addReferenceType
     * @param options
     * @param options.isAbstract
     * @param options.browseName
     * @param options.inverseName
     */
    addReferenceType(options: AddReferenceTypeOptions): UAReferenceType;
    /**
     */
    addMultiStateDiscrete(options: AddMultiStateDiscreteOptions): UAMultiStateDiscretePublic;
    /**
     * @method createDataType
     * @param options
     * @param options.isAbstract
     * @param options.browseName {BrowseName}
     * @param options.superType {NodeId}
     * @param [options.nodeId]
     * @param [options.displayName]
     * @param [options.description]
     *
     */
    createDataType(options: CreateDataTypeOptions): UADataType;
    /**
     * @method createNode
     * @param options
     * @param options.nodeClass
     * @param [options.nodeVersion {String} = "0" ] install nodeVersion
     * @param [options.modellingRule {String} = null]
     * @internal
     */
    createNode(options: CreateNodeOptions): BaseNode;
    /**
     * remove the specified Node from the address space
     *
     * @method deleteNode
     * @param  nodeOrNodeId
     *
     *
     */
    deleteNode(nodeOrNodeId: NodeId | BaseNode): void;
    /**
     * @internals
     */
    getStandardsNodeIds(): {
        referenceTypeIds: {
            [key: string]: string;
        };
        objectTypeIds: {
            [key: string]: string;
        };
    };
    /**
     * add a new event type to the address space
     * @method addEventType
     * @param options
     * @param options.browseName {String} the eventType name
     * @param [options.subtypeOf ="BaseEventType"]
     * @param [options.isAbstract = true]
     * @return {UAObjectType} : the object type
     *
     * @example
     *
     *      var evtType = namespace.addEventType({
     *          browseName: "MyAuditEventType",
     *          subtypeOf:  "AuditEventType"
     *      });
     *      var myConditionType = namespace.addEventType({
     *          browseName: "MyConditionType",
     *          subtypeOf:  "ConditionType",
     *          isAbstract: false
     *      });
     *
     */
    addEventType(options: any): UAObjectType;
    /**
     * @method addDataItem
     * @param options
     * @param options.browseName {String}
     * @param options.definition {String}
     * @param [options.valuePrecision {Double |null} =null]
     * @param options.dataType {NodeId} // todo :check
     * @param options.value
     * @param options.componentOf
     * @return {UAVariable}
     */
    addDataItem(options: AddDataItemOptions): UADataItem;
    /**
     *
     * @method addAnalogDataItem
     *
     * AnalogDataItem DataItems that represent continuously-variable physical quantities ( e.g., length, temperature),
     * incontrast to the digital representation of data in discrete  items
     * NOTE Typical examples are the values provided by temperature sensors or pressure sensors. OPC UA defines a
     * specific UAVariableType to identify an AnalogItem. Properties describe the possible ranges of  AnalogItems.
     *
     *
     * @example:
     *
     *
     *   namespace.add_analog_dataItem({
     *      componentOf: parentObject,
     *      browseName: "TemperatureSensor",
     *
     *      definition: "(tempA -25) + tempB",
     *      valuePrecision: 0.5,
     *      //-
     *      instrumentRange: { low: 100 , high: 200}, // optional
     *      engineeringUnitsRange: { low: 100 , high: 200}, // mandatory
     *      engineeringUnits: standardUnits.degree_celsius,, // optional
     *
     *      // access level
     *      accessLevel: 1
     *      minimumSamplingInterval: 10,
     *
     *   });
     *
     * @param options
     * @param options.browseName {String}
     * @param options.definition {String}
     * @param [options.valuePrecision {Double |null} =null]
     * @param options.instrumentRange
     * @param options.instrumentRange.low {Double}
     * @param options.instrumentRange.high {Double}
     * @param options.engineeringUnitsRange.low {Double}
     * @param options.engineeringUnitsRange.high {Double}
     * @param options.engineeringUnits {String}
     * @param options.dataType {NodeId} // todo :check
     * @param [options.accessLevel {AccessLevelFlag} = "CurrentRead | CurrentWrite"]
     * @param [options.userAccessLevel {AccessLevelFlag} = "CurrentRead | CurrentWrite"]
     * @param options.value
     * @param [options.modellingRule]
     * @return {UAVariable}
     */
    addAnalogDataItem(options: AddAnalogDataItemOptions): UAAnalogItem;
    /**
     *
     * @method addMultiStateValueDiscrete
     * @param options {Object}
     * @param options.browseName {String}
     * @param [options.nodeId  {NodeId}]
     * @param [options.value {UInt32} = 0 }
     * @param options.enumValues { EnumValueType[]| {Key,Value} }
     * @return {Object|UAVariable}
     *
     * @example
     *
     *
     *      namespace.addMultiStateValueDiscrete({
     *          componentOf:parentObj,
     *          browseName: "myVar",
     *          enumValues: {
     *              "Red":    0xFF0000,
     *              "Green":  0x00FF00,
     *              "Blue":   0x0000FF
     *          }
     *      });
     *      addMultiStateValueDiscrete(parentObj,{
     *          browseName: "myVar",
     *          enumValues: [
     *              {
     *                 value: 0xFF0000,
     *                 displayName: "Red",
     *                 description: " The color Red"
     *              },
     *              {
     *                 value: 0x00FF000,
     *                 displayName: "Green",
     *                 description: " The color Green"
     *              },
     *              {
     *                 value: 0x0000FF,
     *                 displayName: "Blue",
     *                 description: " The color Blue"
     *              }
     *
     *          ]
     *      });
     */
    addMultiStateValueDiscrete(options: AddMultiStateValueDiscreteOptions): UAMultiStateValueDiscrete;
    /**
     *
     * @method addYArrayItem
     * @param options
     * @param options.componentOf {NodeId}
     * @param options.browseName {String}
     * @param options.title {String}
     * @param [options.instrumentRange]
     * @param [options.instrumentRange.low] {Double}
     * @param [options.instrumentRange.high] {Double}
     * @param options.engineeringUnitsRange.low {Double}
     * @param options.engineeringUnitsRange.high {Double}
     * @param options.engineeringUnits {String}
     * @param [options.nodeId = {NodeId}]
     * @param options.accessLevel
     * @param options.userAccessLevel
     * @param options.title {String}
     * @param options.axisScaleType {AxisScaleEnumeration}
     *
     * @param options.xAxisDefinition {AxisInformation}
     * @param options.xAxisDefinition.engineeringUnits  EURange
     * @param options.xAxisDefinition.range
     * @param options.xAxisDefinition.range.low
     * @param options.xAxisDefinition.range.high
     * @param options.xAxisDefinition.title  {LocalizedText}
     * @param options.xAxisDefinition.axisScaleType {AxisScaleEnumeration}
     * @param options.xAxisDefinition.axisSteps = <null>  {Array<Double>}
     * @param options.value
     */
    addYArrayItem(options: AddYArrayItemOptions): YArrayItemVariable;
    /**
     * @method addMethod
     * @param parentObject {Object}
     * @param options {Object}
     * @param [options.nodeId=null] {NodeId} the object nodeid.
     * @param [options.browseName=""] {String} the object browse name.
     * @param [options.description=""] {String} the object description.
     * @param options.inputArguments  {Array<Argument>}
     * @param options.outputArguments {Array<Argument>}
     * @return {Object}
     */
    addMethod(parentObject: UAObject, options: AddMethodOptions): UAMethod;
    /**
     *
     * @method addEnumerationType
     * @param options
     * @param options.browseName  {String}
     * @param options.enumeration {Array}
     * @param options.enumeration[].displayName {String|LocalizedText}
     * @param options.enumeration[].value       {Number}
     * @param options.enumeration[].description {String|LocalizedText|null}
     */
    addEnumerationType(options: AddEnumerationTypeOptions): UADataType;
    toNodeset2XML(): string;
    /**
     * @class AddressSpace
     * @method addState
     * @param component
     * @param stateName   {string}
     * @param stateNumber {number}
     * @param isInitialState {boolean}
     * @return {UAObject} {StateType|InitialStateType}
     */
    addState(component: StateMachine, stateName: string, stateNumber: number, isInitialState: boolean): State | InitialState;
    /**
     */
    addTransition(component: StateMachine, fromState: string, toState: string, transitionNumber: number): Transition;
    addTwoStateVariable(options: AddTwoStateVariableOptions): UATwoStateVariable;
    /**
     * @method addTwoStateDiscrete
     * @param options {Object}
     * @param options.browseName {String}
     * @param [options.nodeId  {NodeId}]
     * @param [options.value {Boolean} }
     * @param [options.trueState {String} = "ON" }
     * @param [options.falseState {String}= "OFF" }
     * @return {Object|UAVariable}
     */
    addTwoStateDiscrete(options: any): UATwoStateDiscrete;
    instantiateCondition(conditionTypeId: UAEventType | NodeId | string, options: any, data: any): UAConditionBase;
    instantiateAcknowledgeableCondition(conditionTypeId: UAEventType | NodeId | string, options: any, data: any): UAAcknowledgeableConditionBase;
    instantiateAlarmCondition(alarmConditionTypeId: UAEventType | NodeId | string, options: any, data: any): UAAlarmConditionBase;
    instantiateLimitAlarm(limitAlarmTypeId: UAEventType | NodeId | string, options: any, data: any): UALimitAlarm;
    instantiateExclusiveLimitAlarm(exclusiveLimitAlarmTypeId: UAEventType | NodeId | string, options: any, data: any): UAExclusiveLimitAlarm;
    instantiateExclusiveDeviationAlarm(options: any, data: any): UAExclusiveDeviationAlarm;
    instantiateNonExclusiveLimitAlarm(nonExclusiveLimitAlarmTypeId: UAEventType | NodeId | string, options: any, data: any): UANonExclusiveLimitAlarm;
    instantiateNonExclusiveDeviationAlarm(options: any, data: any): UANonExclusiveDeviationAlarm;
    instantiateDiscreteAlarm(discreteAlarmType: UAEventType | NodeId | string, options: any, data: any): UADiscreteAlarm;
    instantiateOffNormalAlarm(options: any, data: any): UAOffNormalAlarm;
    _construct_nodeId(options: any): NodeId;
    _build_new_NodeId(): NodeId;
    _register(node: BaseNode): void;
    /**
     * @method _createNode
     * @internal
     * @param options
     *
     * @param [options.nodeId==null]      {NodeId}
     * @param options.nodeClass  {NodeClass}
     * @param options.browseName {String|QualifiedName} the node browseName
     *    the browseName can be either a string : "Hello"
     *                                 a string with a namespace : "1:Hello"
     *                                 a QualifiedName : new QualifiedName({name:"Hello", namespaceIndex:1});
     * @param [options.displayName] {String|LocalizedText} the node display name
     * @param [options.description] {String|LocalizedText} the node description
     *
     * @return {BaseNode}
     */
    _createNode(options: CreateNodeOptions): BaseNode;
    _deleteNode(node: BaseNode): void;
    private _addObjectOrVariableType;
    private _registerObjectType;
    private _registerVariableType;
    private _registerReferenceType;
    private _registerDataType;
    private _unregisterObjectType;
    /**
     * @private
     */
    private _addVariable;
    /**
     * @private
     */
    private _addMethod;
}
export declare function _handle_hierarchy_parent(addressSpace: AddressSpacePrivate, references: AddReferenceOpts[], options: any): void;
export declare function isNonEmptyQualifiedName(browseName?: null | string | QualifiedName): boolean;
