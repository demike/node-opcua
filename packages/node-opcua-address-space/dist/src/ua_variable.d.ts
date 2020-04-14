import { QualifiedNameLike } from "node-opcua-data-model";
import { NodeClass } from "node-opcua-data-model";
import { AttributeIds } from "node-opcua-data-model";
import { DataValue } from "node-opcua-data-value";
import { PreciseClock } from "node-opcua-date-time";
import { ExtensionObject } from "node-opcua-extension-object";
import { NodeId } from "node-opcua-nodeid";
import { NumericRange } from "node-opcua-numeric-range";
import { WriteValue, WriteValueOptions } from "node-opcua-service-write";
import { StatusCode } from "node-opcua-status-code";
import { HistoryReadResult, ReadAtTimeDetails, ReadEventDetails, ReadProcessedDetails, ReadRawModifiedDetails } from "node-opcua-types";
import { Variant, VariantLike } from "node-opcua-variant";
import { BindVariableOptions, Callback, ContinuationPoint, HistoricalDataConfiguration, IVariableHistorian, Permissions, UAVariable as UAVariablePublic, UAVariableType } from "../source";
import { BaseNode } from "./base_node";
import { SessionContext } from "./session_context";
import { UADataType } from "./ua_data_type";
/**
 * A OPCUA Variable Node
 *
 * @class UAVariable
 * @constructor
 * @extends  BaseNode
 * @param options  {Object}
 * @param options.value
 * @param options.browseName {string}
 * @param options.dataType   {NodeId|String}
 * @param options.valueRank  {Int32}
 * @param options.arrayDimensions {null|Array<Integer>}
 * @param options.accessLevel {AccessLevel}
 * @param options.userAccessLevel {AccessLevel}
 * @param [options.minimumSamplingInterval = -1]
 * @param [options.historizing = false] {Boolean}
 * @param [options.permissions] {Permissions}
 * @param options.parentNodeId {NodeId}
 *
 *  The AccessLevel Attribute is used to indicate how the Value of a Variable can be accessed (read/write) and if it
 *  contains current and/or historic data. The AccessLevel does not take any user access rights into account,
 *  i.e. although the Variable is writable this may be restricted to a certain user / user group.
 *  The AccessLevel is an 8-bit unsigned integer with the structure defined in the following table:
 *
 *  Field            Bit    Description
 *  CurrentRead      0      Indicates if the current value is readable
 *                          (0 means not readable, 1 means readable).
 *  CurrentWrite     1      Indicates if the current value is writable
 *                          (0 means not writable, 1 means writable).
 *  HistoryRead      2      Indicates if the history of the value is readable
 *                          (0 means not readable, 1 means readable).
 *  HistoryWrite     3      Indicates if the history of the value is writable (0 means not writable, 1 means writable).
 *  SemanticChange   4      Indicates if the Variable used as Property generates SemanticChangeEvents (see 9.31).
 *  Reserved         5:7    Reserved for future use. Shall always be zero.
 *
 *  The first two bits also indicate if a current value of this Variable is available and the second two bits
 *  indicates if the history of the Variable is available via the OPC UA server.
 *
 */
export declare class UAVariable extends BaseNode implements UAVariablePublic {
    readonly nodeClass = NodeClass.Variable;
    dataType: NodeId;
    $historicalDataConfiguration?: HistoricalDataConfiguration;
    varHistorian?: IVariableHistorian;
    /**
     * @internal
     */
    _dataValue: DataValue;
    accessLevel: number;
    userAccessLevel: number;
    valueRank: number;
    minimumSamplingInterval: number;
    historizing: boolean;
    semantic_version: number;
    _permissions: any | null;
    arrayDimensions: any;
    $extensionObject?: any;
    _timestamped_get_func: any;
    _timestamped_set_func: any;
    _get_func: any;
    _set_func: any;
    refreshFunc: any;
    __waiting_callbacks?: any[];
    readonly typeDefinitionObj: UAVariableType;
    constructor(options: any);
    isReadable(context: SessionContext): boolean;
    isUserReadable(context: SessionContext): boolean;
    isWritable(context: SessionContext): boolean;
    isUserWritable(context: SessionContext): boolean;
    /**
     *
     *
     * from OPC.UA.Spec 1.02 part 4
     *  5.10.2.4 StatusCodes
     *  Table 51 defines values for the operation level statusCode contained in the DataValue structure of
     *  each values element. Common StatusCodes are defined in Table 166.
     *
     * Table 51 Read Operation Level Result Codes
     *
     *  Symbolic Id                 Description
     *
     *  BadNodeIdInvalid            The syntax of the node id is not valid.
     *  BadNodeIdUnknown            The node id refers to a node that does not exist in the server address space.
     *  BadAttributeIdInvalid       BadAttributeIdInvalid The attribute is not supported for the specified node.
     *  BadIndexRangeInvalid        The syntax of the index range parameter is invalid.
     *  BadIndexRangeNoData         No data exists within the range of indexes specified.
     *  BadDataEncodingInvalid      The data encoding is invalid.
     *                              This result is used if no dataEncoding can be applied because an Attribute other
     *                              than Value was requested or the DataType of the Value Attribute is not a subtype
     *                              of the Structure DataType.
     *  BadDataEncodingUnsupported  The server does not support the requested data encoding for the node.
     *                              This result is used if a dataEncoding can be applied but the passed data encoding
     *                              is not known to the Server.
     *  BadNotReadable              The access level does not allow reading or subscribing to the Node.
     *  BadUserAccessDenied         User does not have permission to perform the requested operation. (table 165)
     */
    readValue(context?: SessionContext | null, indexRange?: NumericRange, dataEncoding?: string): DataValue;
    _getEnumValues(): any;
    asyncRefresh(...args: any[]): any;
    readEnumValue(): {
        value: any;
        name: any;
    };
    writeEnumValue(value: string | number): void;
    readAttribute(context: SessionContext | null, attributeId: AttributeIds, indexRange?: NumericRange, dataEncoding?: string): DataValue;
    /**
     * setValueFromSource is used to let the device sets the variable values
     * this method also records the current time as sourceTimestamp and serverTimestamp.
     * the method broadcasts an "value_changed" event
     * @method setValueFromSource
     * @param variant  {Variant}
     * @param [statusCode  {StatusCode} = StatusCodes.Good]
     * @param [sourceTimestamp= Now]
     */
    setValueFromSource(variant: VariantLike, statusCode?: StatusCode, sourceTimestamp?: Date): void;
    writeValue(context: SessionContext, dataValue: DataValue, ...args: any[]): any;
    writeAttribute(context: SessionContext, writeValueOptions: WriteValueOptions | WriteValue, callback?: (err: Error | null, statusCode?: StatusCode) => void): any;
    /**
     * @method isValueInRange
     * note:
     *     this method is overridden in address-space-data-access
     * @return {StatusCode}
     */
    isValueInRange(value: Variant): StatusCode;
    /**
     * @method touchValue
     * touch the source timestamp of a Variable and cascade up the change
     * to the parent variable if any.
     *
     * @param [optionalNow=null] {Object}
     * @param optionalNow.timestamp    {Date}
     * @param optionalNow.picoseconds  {Number}
     */
    touchValue(optionalNow?: PreciseClock): void;
    /**
     * setPermissions
     * set the role and permissions
     *
     * @example
     *
     *    const permissions = {
     *        CurrentRead:  [ "*" ], // all users can read
     *        CurrentWrite: [ "!*", "Administrator" ] // no one except administrator can write
     *    };
     *    node.setPermissions(permissions);
     */
    setPermissions(permissions: Permissions): void;
    /**
     * bind a variable with a get and set functions.
     *
     * @method bindVariable
     * @param options
     * @param [options.dataType=null]    the nodeId of the dataType
     * @param [options.accessLevel]      AccessLevelFlagItem
     * @param [options.userAccessLevel]  AccessLevelFlagItem
     * @param [options.set]              the variable setter function
     * @param [options.get]              the variable getter function. the function must return a Variant or a status code
     * @param [options.timestamped_get]  the getter function. this function must return a object with the following
     * @param [options.historyRead]
     *
     *  properties:
     *    - value: a Variant or a status code
     *    - sourceTimestamp
     *    - sourcePicoseconds
     * @param [options.timestamped_set]
     * @param [options.refreshFunc]      the variable asynchronous getter function.
     * @param [overwrite {Boolean} = false] set overwrite to true to overwrite existing binding
     * @return void
     *
     *
     * ### Providing read access to the underlying value
     *
     * #### Variation 1
     *
     * In this variation, the user provides a function that returns a Variant with the current value.
     *
     * The sourceTimestamp will be set automatically.
     *
     * The get function is called synchronously.
     *
     * @example
     *
     *
     * ```javascript
     *     ...
     *     var options =  {
     *       get : () => {
     *          return new Variant({...});
     *       },
     *       set : function(variant) {
     *          // store the variant somewhere
     *          return StatusCodes.Good;
     *       }
     *    };
     *    ...
     *    engine.bindVariable(nodeId,options):
     *    ...
     * ```
     *
     *
     * #### Variation 2:
     *
     * This variation can be used when the user wants to specify a specific '''sourceTimestamp''' associated
     * with the current value of the UAVariable.
     *
     * The provided ```timestamped_get``` function should return an object with three properties:
     * * value: containing the variant value or a error StatusCode,
     * * sourceTimestamp
     * * sourcePicoseconds
     *
     * ```javascript
     * ...
     * var myDataValue = new DataValue({
     *   value: {dataType: DataType.Double , value: 10.0},
     *   sourceTimestamp : new Date(),
     *   sourcePicoseconds: 0
     * });
     * ...
     * var options =  {
     *   timestamped_get : () => { return myDataValue;  }
     * };
     * ...
     * engine.bindVariable(nodeId,options):
     * ...
     * // record a new value
     * myDataValue.value.value = 5.0;
     * myDataValue.sourceTimestamp = new Date();
     * ...
     * ```
     *
     *
     * #### Variation 3:
     *
     * This variation can be used when the value associated with the variables requires a asynchronous function call to be
     * extracted. In this case, the user should provide an async method ```refreshFunc```.
     *
     *
     * The ```refreshFunc``` shall do whatever is necessary to fetch the most up to date version of the variable value, and
     * call the ```callback``` function when the data is ready.
     *
     *
     * The ```callback``` function follow the standard callback function signature:
     * * the first argument shall be **null** or **Error**, depending of the outcome of the fetch operation,
     * * the second argument shall be a DataValue with the new UAVariable Value,  a StatusCode, and time stamps.
     *
     *
     * Optionally, it is possible to pass a sourceTimestamp and a sourcePicoseconds value as a third and fourth arguments
     * of the callback. When sourceTimestamp and sourcePicoseconds are missing, the system will set their default value
     * to the current time..
     *
     *
     * ```javascript
     * ...
     * var options =  {
     *    refreshFunc : function(callback) {
     *      ... do_some_async_stuff_to_get_the_new_variable_value
     *      var dataValue = new DataValue({
     *          value: new Variant({...}),
     *          statusCode: StatusCodes.Good,
     *          sourceTimestamp: new Date()
     *      });
     *      callback(null,dataValue);
     *    }
     * };
     * ...
     * variable.bindVariable(nodeId,options):
     * ...
     * ```
     *
     * ### Providing write access to the underlying value
     *
     * #### Variation1 - provide a simple synchronous set function
     *
     *
     * #### Notes
     *   to do : explain return StatusCodes.GoodCompletesAsynchronously;
     *
     */
    bindVariable(options?: BindVariableOptions, overwrite?: boolean): void;
    /**
     * @method readValueAsync
     * @param context
     * @param callback
     * @param callback.err
     * @param callback.dataValue
     * @async
     */
    readValueAsync(context?: SessionContext | null, callback?: any): any;
    getWriteMask(): number;
    getUserWriteMask(): number;
    clone(options?: any, optionalFilter?: any, extraInfo?: any): UAVariable;
    getDataTypeNode(): UADataType;
    readonly dataTypeObj: UADataType;
    /**
     * @method bindExtensionObject
     * @return {ExtensionObject}
     */
    bindExtensionObject(optionalExtensionObject?: ExtensionObject): ExtensionObject | null;
    updateExtensionObjectPartial(partialExtensionObject: any): any;
    incrementExtensionObjectPartial(path: any): void;
    constructExtensionObjectFromComponents(): any;
    toString(): string;
    historyRead(context: SessionContext, historyReadDetails: ReadRawModifiedDetails | ReadEventDetails | ReadProcessedDetails | ReadAtTimeDetails, indexRange: NumericRange | null, dataEncoding: QualifiedNameLike | null, continuationPoint?: ContinuationPoint | null, callback?: Callback<HistoryReadResult>): any;
    _historyReadRaw(context: SessionContext, historyReadRawModifiedDetails: ReadRawModifiedDetails, indexRange: NumericRange | null, dataEncoding: QualifiedNameLike | null, continuationPoint: ContinuationPoint | null, callback: Callback<HistoryReadResult>): void;
    _historyReadRawModify(context: SessionContext, historyReadRawModifiedDetails: ReadRawModifiedDetails, indexRange: NumericRange | null, dataEncoding: QualifiedNameLike | null, continuationPoint?: ContinuationPoint | null, callback?: Callback<HistoryReadResult>): any;
    _historyRead(context: SessionContext, historyReadDetails: ReadRawModifiedDetails | ReadEventDetails | ReadProcessedDetails | ReadAtTimeDetails, indexRange: NumericRange | null, dataEncoding: QualifiedNameLike | null, continuationPoint: ContinuationPoint | null, callback: Callback<HistoryReadResult>): any;
    _historyPush(newDataValue: DataValue): any;
    _historyReadRawAsync(historyReadRawModifiedDetails: ReadRawModifiedDetails, maxNumberToExtract: number, isReversed: boolean, reverseDataValue: boolean, callback: Callback<DataValue[]>): any;
    _historyReadModify(context: SessionContext, historyReadRawModifiedDetails: any, indexRange: NumericRange | null, dataEncoding: QualifiedNameLike | null, continuationPoint: ContinuationPoint | null, callback: Callback<HistoryReadResult>): any;
    _update_startOfOnlineArchive(newDate: Date): void;
    _update_startOfArchive(newDate: Date): void;
    _validate_DataType(variantDataType: any): any;
    _internal_set_dataValue(dataValue: DataValue, indexRange?: NumericRange | null): void;
    _conditionRefresh(_cache?: any): void;
    handle_semantic_changed(): void;
    private _readDataType;
    private _readValueRank;
    private _readArrayDimensions;
    private _readAccessLevel;
    private _readUserAccessLevel;
    private _readMinimumSamplingInterval;
    private _readHistorizing;
}
export interface UAVariable {
    $$variableType?: any;
    $$dataType?: any;
    $$getElementBrowseName: any;
    $$extensionObjectArray: any;
    $$indexPropertyName: any;
}
