"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space
 */
// tslint:disable:no-bitwise
// tslint:disable:no-console
// tslint:disable:max-line-length
const chalk_1 = require("chalk");
const node_opcua_assert_1 = require("node-opcua-assert");
const _ = require("underscore");
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_data_model_2 = require("node-opcua-data-model");
const node_opcua_data_model_3 = require("node-opcua-data-model");
const node_opcua_data_model_4 = require("node-opcua-data-model");
const node_opcua_data_model_5 = require("node-opcua-data-model");
const node_opcua_data_model_6 = require("node-opcua-data-model");
const node_opcua_data_model_7 = require("node-opcua-data-model");
const node_opcua_data_value_1 = require("node-opcua-data-value");
const node_opcua_data_value_2 = require("node-opcua-data-value");
const node_opcua_date_time_1 = require("node-opcua-date-time");
const node_opcua_debug_1 = require("node-opcua-debug");
const node_opcua_factory_1 = require("node-opcua-factory");
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const node_opcua_numeric_range_1 = require("node-opcua-numeric-range");
const node_opcua_service_write_1 = require("node-opcua-service-write");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const node_opcua_types_1 = require("node-opcua-types");
const utils = require("node-opcua-utils");
const node_opcua_utils_1 = require("node-opcua-utils");
const node_opcua_variant_1 = require("node-opcua-variant");
const node_opcua_variant_2 = require("node-opcua-variant");
const node_opcua_variant_3 = require("node-opcua-variant");
const base_node_1 = require("./base_node");
const base_node_private_1 = require("./base_node_private");
const session_context_1 = require("./session_context");
const ua_data_type_1 = require("./ua_data_type");
const debugLog = node_opcua_debug_1.make_debugLog(__filename);
const doDebug = node_opcua_debug_1.checkDebugFlag(__filename);
function isGoodish(statusCode) {
    return statusCode.value < 0x10000000;
}
function adjust_accessLevel(accessLevel) {
    accessLevel = utils.isNullOrUndefined(accessLevel) ? "CurrentRead | CurrentWrite" : accessLevel;
    accessLevel = node_opcua_data_model_5.makeAccessLevelFlag(accessLevel);
    node_opcua_assert_1.assert(_.isFinite(accessLevel));
    return accessLevel;
}
function adjust_userAccessLevel(userAccessLevel, accessLevel) {
    userAccessLevel = utils.isNullOrUndefined(userAccessLevel) ? "CurrentRead | CurrentWrite" : userAccessLevel;
    userAccessLevel = node_opcua_data_model_5.makeAccessLevelFlag(userAccessLevel);
    accessLevel = utils.isNullOrUndefined(accessLevel) ? "CurrentRead | CurrentWrite" : accessLevel;
    accessLevel = node_opcua_data_model_5.makeAccessLevelFlag(accessLevel);
    return node_opcua_data_model_5.makeAccessLevelFlag(accessLevel & userAccessLevel);
}
function adjust_samplingInterval(minimumSamplingInterval) {
    node_opcua_assert_1.assert(_.isFinite(minimumSamplingInterval));
    return minimumSamplingInterval;
}
function is_Variant(v) {
    return v instanceof node_opcua_variant_1.Variant;
}
function is_StatusCode(v) {
    return v && v.constructor &&
        (v.constructor.name === "ConstantStatusCode" ||
            v.constructor.name === "StatusCode" ||
            v.constructor.name === "ModifiableStatusCode");
}
function is_Variant_or_StatusCode(v) {
    if (is_Variant(v)) {
        // /@@assert(v.isValid());
    }
    return is_Variant(v) || is_StatusCode(v);
}
function _dataType_toUADataType(addressSpace, dataType) {
    node_opcua_assert_1.assert(addressSpace);
    node_opcua_assert_1.assert(dataType !== node_opcua_variant_2.DataType.Null);
    const dataTypeNode = addressSpace.findDataType(node_opcua_variant_2.DataType[dataType]);
    /* istanbul ignore next */
    if (!dataTypeNode) {
        throw new Error(" Cannot find DataType " + node_opcua_variant_2.DataType[dataType] + " in address Space");
    }
    return dataTypeNode;
}
/*=
 *
 * @param addressSpace
 * @param dataTypeNodeId : the nodeId matching the dataType of the destination variable.
 * @param variantDataType: the dataType of the variant to write to the destination variable
 * @param nodeId
 * @return {boolean} true if the variant dataType is compatible with the Variable DataType
 */
function validateDataType(addressSpace, dataTypeNodeId, variantDataType, nodeId) {
    if (variantDataType === node_opcua_variant_2.DataType.ExtensionObject) {
        return true;
    }
    if (variantDataType === node_opcua_variant_2.DataType.Null) {
        return true;
    }
    let builtInType;
    let builtInUADataType;
    const destUADataType = addressSpace.findNode(dataTypeNodeId);
    node_opcua_assert_1.assert(destUADataType instanceof ua_data_type_1.UADataType);
    if (destUADataType.isAbstract || destUADataType.nodeId.namespace !== 0) {
        builtInUADataType = destUADataType;
    }
    else {
        builtInType = node_opcua_factory_1.findBuiltInType(destUADataType.browseName).name;
        builtInUADataType = addressSpace.findDataType(builtInType);
    }
    node_opcua_assert_1.assert(builtInUADataType instanceof ua_data_type_1.UADataType);
    const enumerationUADataType = addressSpace.findDataType("Enumeration");
    if (!enumerationUADataType) {
        throw new Error("cannot find Enumeration DataType node in standard address space");
    }
    if (destUADataType.isSupertypeOf(enumerationUADataType)) {
        return true;
    }
    // The value supplied for the attribute is not of the same type as the  value.
    const variantUADataType = _dataType_toUADataType(addressSpace, variantDataType);
    node_opcua_assert_1.assert(variantUADataType instanceof ua_data_type_1.UADataType);
    const dest_isSuperTypeOf_variant = variantUADataType.isSupertypeOf(builtInUADataType);
    /* istanbul ignore next */
    if (doDebug) {
        if (dest_isSuperTypeOf_variant) {
            /* istanbul ignore next*/
            console.log(chalk_1.default.green(" ---------- Type match !!! "), " on ", nodeId.toString());
        }
        else {
            /* istanbul ignore next*/
            console.log(chalk_1.default.red(" ---------- Type mismatch "), " on ", nodeId.toString());
        }
        console.log(chalk_1.default.cyan(" Variable data Type is    = "), destUADataType.browseName.toString());
        console.log(chalk_1.default.cyan(" which matches basic Type = "), builtInUADataType.browseName.toString());
        console.log(chalk_1.default.yellow("        Actual   dataType = "), variantUADataType.browseName.toString());
    }
    return (dest_isSuperTypeOf_variant);
}
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
class UAVariable extends base_node_1.BaseNode {
    constructor(options) {
        super(options);
        this.nodeClass = node_opcua_data_model_3.NodeClass.Variable;
        this.dataType = this.resolveNodeId(options.dataType); // DataType (NodeId)
        node_opcua_assert_1.assert(this.dataType instanceof node_opcua_nodeid_1.NodeId);
        this.valueRank = options.valueRank || 0; // UInt32
        node_opcua_assert_1.assert(typeof this.valueRank === "number");
        this.arrayDimensions = options.arrayDimensions || null;
        node_opcua_assert_1.assert(_.isNull(this.arrayDimensions) || _.isArray(this.arrayDimensions));
        this.accessLevel = adjust_accessLevel(options.accessLevel);
        this.userAccessLevel = adjust_userAccessLevel(options.userAccessLevel, options.accessLevel);
        this.minimumSamplingInterval = adjust_samplingInterval(options.minimumSamplingInterval);
        this.historizing = !!options.historizing; // coerced to boolean
        this._dataValue = new node_opcua_data_value_2.DataValue({ statusCode: node_opcua_status_code_1.StatusCodes.UncertainInitialValue, value: {} });
        // xx options.value = options.value || { dataType: DataType.Null };
        if (options.value) {
            this.bindVariable(options.value);
        }
        this._permissions = null;
        if (options.permissions) {
            this.setPermissions(options.permissions);
        }
        this.setMaxListeners(5000);
        this.semantic_version = 0;
    }
    get typeDefinitionObj() {
        return super.typeDefinitionObj;
    }
    isReadable(context) {
        return (this.accessLevel & node_opcua_data_model_4.AccessLevelFlag.CurrentRead) === node_opcua_data_model_4.AccessLevelFlag.CurrentRead;
    }
    isUserReadable(context) {
        node_opcua_assert_1.assert(context instanceof session_context_1.SessionContext);
        if (context.checkPermission) {
            node_opcua_assert_1.assert(context.checkPermission instanceof Function);
            return context.checkPermission(this, "CurrentRead");
        }
        return (this.userAccessLevel & node_opcua_data_model_4.AccessLevelFlag.CurrentRead) === node_opcua_data_model_4.AccessLevelFlag.CurrentRead;
    }
    isWritable(context) {
        node_opcua_assert_1.assert(context instanceof session_context_1.SessionContext);
        return ((this.accessLevel & node_opcua_data_model_4.AccessLevelFlag.CurrentWrite) === node_opcua_data_model_4.AccessLevelFlag.CurrentWrite);
    }
    isUserWritable(context) {
        node_opcua_assert_1.assert(context instanceof session_context_1.SessionContext);
        if (context.checkPermission) {
            node_opcua_assert_1.assert(context.checkPermission instanceof Function);
            return context.checkPermission(this, "CurrentWrite");
        }
        return ((this.userAccessLevel & node_opcua_data_model_4.AccessLevelFlag.CurrentWrite) === node_opcua_data_model_4.AccessLevelFlag.CurrentWrite);
    }
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
    readValue(context, indexRange, dataEncoding) {
        if (!context) {
            context = session_context_1.SessionContext.defaultContext;
        }
        if (!this.isReadable(context)) {
            return new node_opcua_data_value_2.DataValue({ statusCode: node_opcua_status_code_1.StatusCodes.BadNotReadable });
        }
        if (!this.isUserReadable(context)) {
            return new node_opcua_data_value_2.DataValue({ statusCode: node_opcua_status_code_1.StatusCodes.BadUserAccessDenied });
        }
        if (!node_opcua_data_model_1.isValidDataEncoding(dataEncoding)) {
            return new node_opcua_data_value_2.DataValue({ statusCode: node_opcua_status_code_1.StatusCodes.BadDataEncodingInvalid });
        }
        if (this._timestamped_get_func) {
            node_opcua_assert_1.assert(this._timestamped_get_func.length === 0);
            this._dataValue = this._timestamped_get_func();
        }
        let dataValue = this._dataValue;
        if (isGoodish(dataValue.statusCode)) {
            // note : extractRange will clone the dataValue
            dataValue = node_opcua_data_value_1.extractRange(dataValue, indexRange);
        }
        /* istanbul ignore next */
        if (dataValue.statusCode.equals(node_opcua_status_code_1.StatusCodes.BadWaitingForInitialData)
            || dataValue.statusCode.equals(node_opcua_status_code_1.StatusCodes.UncertainInitialValue)) {
            debugLog(chalk_1.default.red(" Warning:  UAVariable#readValue ")
                + chalk_1.default.cyan(this.browseName.toString()) +
                " (" + chalk_1.default.yellow(this.nodeId.toString()) + ") exists but dataValue has not been defined");
        }
        return dataValue;
    }
    _getEnumValues() {
        // DataType must be one of Enumeration
        const dataTypeNode = this.addressSpace.findDataType(this.dataType);
        if (!dataTypeNode) {
            throw new Error(" Cannot find  DataType  " + this.dataType.toString() + " in standard address Space");
        }
        const enumerationNode = this.addressSpace.findDataType("Enumeration");
        if (!enumerationNode) {
            throw new Error(" Cannot find 'Enumeration' DataType in standard address Space");
        }
        node_opcua_assert_1.assert(dataTypeNode.isSupertypeOf(enumerationNode));
        return dataTypeNode._getDefinition();
    }
    asyncRefresh(...args) {
        const callback = args[0];
        if (!this.refreshFunc) {
            return callback(null, this.readValue());
        }
        this.refreshFunc.call(this, (err, dataValue) => {
            if (err || !dataValue) {
                dataValue = { statusCode: node_opcua_status_code_1.StatusCodes.BadNoDataAvailable };
            }
            if (dataValue !== this._dataValue) {
                this._internal_set_dataValue(coerceDataValue(dataValue), null);
            }
            callback(err, this._dataValue);
        });
    }
    readEnumValue() {
        const indexes = this._getEnumValues();
        const value = this.readValue().value.value;
        return { value, name: indexes.valueIndex[value].name };
    }
    writeEnumValue(value) {
        const indexes = this._getEnumValues();
        if (_.isString(value)) {
            if (!indexes.nameIndex.hasOwnProperty(value)) {
                throw new Error("UAVariable#writeEnumValue: cannot find value " + value);
            }
            const valueIndex = indexes.nameIndex[value].value;
            value = valueIndex;
        }
        if (_.isFinite(value)) {
            if (!indexes.valueIndex[value]) {
                throw new Error("UAVariable#writeEnumValue : value out of range " + value);
            }
            this.setValueFromSource({
                dataType: node_opcua_variant_2.DataType.Int32,
                value
            });
        }
        else {
            throw new Error("UAVariable#writeEnumValue:  value type mismatch");
        }
    }
    readAttribute(context, attributeId, indexRange, dataEncoding) {
        if (!context) {
            context = session_context_1.SessionContext.defaultContext;
        }
        node_opcua_assert_1.assert(context instanceof session_context_1.SessionContext);
        const options = {};
        if (attributeId !== node_opcua_data_model_6.AttributeIds.Value) {
            if (indexRange && indexRange.isDefined()) {
                options.statusCode = node_opcua_status_code_1.StatusCodes.BadIndexRangeNoData;
                return new node_opcua_data_value_2.DataValue(options);
            }
            if (node_opcua_data_model_7.isDataEncoding(dataEncoding)) {
                options.statusCode = node_opcua_status_code_1.StatusCodes.BadDataEncodingInvalid;
                return new node_opcua_data_value_2.DataValue(options);
            }
        }
        switch (attributeId) {
            case node_opcua_data_model_6.AttributeIds.Value:
                return this.readValue(context, indexRange, dataEncoding);
            case node_opcua_data_model_6.AttributeIds.DataType:
                return this._readDataType();
            case node_opcua_data_model_6.AttributeIds.ValueRank:
                return this._readValueRank();
            case node_opcua_data_model_6.AttributeIds.ArrayDimensions:
                return this._readArrayDimensions();
            case node_opcua_data_model_6.AttributeIds.AccessLevel:
                return this._readAccessLevel(context);
            case node_opcua_data_model_6.AttributeIds.UserAccessLevel:
                return this._readUserAccessLevel(context);
            case node_opcua_data_model_6.AttributeIds.MinimumSamplingInterval:
                return this._readMinimumSamplingInterval();
            case node_opcua_data_model_6.AttributeIds.Historizing:
                return this._readHistorizing();
            default:
                return base_node_1.BaseNode.prototype.readAttribute.call(this, context, attributeId);
        }
    }
    /**
     * setValueFromSource is used to let the device sets the variable values
     * this method also records the current time as sourceTimestamp and serverTimestamp.
     * the method broadcasts an "value_changed" event
     * @method setValueFromSource
     * @param variant  {Variant}
     * @param [statusCode  {StatusCode} = StatusCodes.Good]
     * @param [sourceTimestamp= Now]
     */
    setValueFromSource(variant, statusCode, sourceTimestamp) {
        // istanbul ignore next
        if (variant.hasOwnProperty("value")) {
            if (variant.dataType === null || variant.dataType === undefined) {
                throw new Error("Variant must provide a valid dataType" + variant.toString());
            }
        }
        // if (variant.hasOwnProperty("value")) {
        //     if (variant.dataType === DataType.UInt32) {
        //         if (!_.isFinite(variant.value)) {
        //             throw new Error("Expecting an number");
        //         }
        //     }
        // }
        variant = node_opcua_variant_1.Variant.coerce(variant);
        const now = node_opcua_date_time_1.coerceClock(sourceTimestamp, 0);
        const dataValue = new node_opcua_data_value_2.DataValue({
            serverPicoseconds: now.picoseconds,
            serverTimestamp: now.timestamp,
            sourcePicoseconds: now.picoseconds,
            sourceTimestamp: now.timestamp,
            statusCode: statusCode || node_opcua_status_code_1.StatusCodes.Good
        });
        dataValue.value = variant;
        this._internal_set_dataValue(dataValue);
    }
    writeValue(context, dataValue, ...args) {
        if (!context) {
            context = session_context_1.SessionContext.defaultContext;
        }
        if (!dataValue.sourceTimestamp) {
            dataValue.sourceTimestamp = this._dataValue.sourceTimestamp;
            dataValue.sourcePicoseconds = this._dataValue.sourcePicoseconds;
            /*
                        if (false) {
                            if (context.currentTime) {
                                dataValue.sourceTimestamp = context.currentTime;
                                dataValue.sourcePicoseconds = 0;
                            } else {
                                const clock = getCurrentClock();
                                dataValue.sourceTimestamp = clock.timestamp;
                                dataValue.sourcePicoseconds = clock.picoseconds;
                            }
                        }
                        */
        }
        if (context.currentTime && !dataValue.serverTimestamp) {
            dataValue.serverTimestamp = context.currentTime;
            dataValue.serverPicoseconds = 0;
        }
        node_opcua_assert_1.assert(context instanceof session_context_1.SessionContext);
        // adjust arguments if optional indexRange Parameter is not given
        let indexRange = null;
        let callback;
        if (args.length === 1) {
            indexRange = new node_opcua_numeric_range_1.NumericRange();
            callback = args[0];
        }
        else if (args.length === 2) {
            indexRange = args[0];
            callback = args[1];
        }
        else {
            throw new Error("Invalid Number of args");
        }
        node_opcua_assert_1.assert(_.isFunction(callback));
        node_opcua_assert_1.assert(dataValue instanceof node_opcua_data_value_2.DataValue);
        // index range could be string
        indexRange = node_opcua_numeric_range_1.NumericRange.coerce(indexRange);
        // test write permission
        if (!this.isWritable(context)) {
            return callback(null, node_opcua_status_code_1.StatusCodes.BadNotWritable);
        }
        if (!this.isUserWritable(context)) {
            return callback(null, node_opcua_status_code_1.StatusCodes.BadUserAccessDenied);
        }
        // adjust special case
        const variant = adjustVariant.call(this, dataValue.value);
        const statusCode = this.isValueInRange(variant);
        if (statusCode.isNot(node_opcua_status_code_1.StatusCodes.Good)) {
            return callback(null, statusCode);
        }
        const write_func = this._timestamped_set_func || ((dataValue1, indexRange1, callback1) => {
            // xx assert(!indexRange,"indexRange Not Implemented");
            return _default_writable_timestamped_set_func.call(this, dataValue1, callback1);
        });
        if (!write_func) {
            console.log(" warning " + this.nodeId.toString() + " " + this.browseName.toString() + " has no setter. \n");
            console.log("Please make sure to bind the variable or to pass a valid value: new Variant({}) during construction time");
            return callback(null, node_opcua_status_code_1.StatusCodes.BadNotWritable);
        }
        node_opcua_assert_1.assert(write_func);
        write_func.call(this, dataValue, indexRange, (err, statusCode1, correctedDataValue) => {
            if (!err) {
                correctedDataValue = correctedDataValue || dataValue;
                node_opcua_assert_1.assert(correctedDataValue instanceof node_opcua_data_value_2.DataValue);
                // xx assert(correctedDataValue.serverTimestamp);
                if (indexRange && !indexRange.isEmpty()) {
                    if (!indexRange.isValid()) {
                        return callback(null, node_opcua_status_code_1.StatusCodes.BadIndexRangeInvalid);
                    }
                    const newArr = correctedDataValue.value.value;
                    // check that source data is an array
                    if (correctedDataValue.value.arrayType !== node_opcua_variant_3.VariantArrayType.Array) {
                        return callback(null, node_opcua_status_code_1.StatusCodes.BadTypeMismatch);
                    }
                    // check that destination data is also an array
                    node_opcua_assert_1.assert(check_valid_array(this._dataValue.value.dataType, this._dataValue.value.value));
                    const destArr = this._dataValue.value.value;
                    const result = indexRange.set_values(destArr, newArr);
                    if (result.statusCode.isNot(node_opcua_status_code_1.StatusCodes.Good)) {
                        return callback(null, result.statusCode);
                    }
                    correctedDataValue.value.value = result.array;
                    // scrap original array so we detect range
                    this._dataValue.value.value = null;
                }
                this._internal_set_dataValue(correctedDataValue, indexRange);
                // xx this._dataValue = correctedDataValue;
            }
            callback(err, statusCode1);
        });
    }
    writeAttribute(context, writeValueOptions, callback) {
        if (!callback) {
            throw new Error("Internal error");
        }
        const writeValue = writeValueOptions instanceof node_opcua_service_write_1.WriteValue
            ? writeValueOptions
            : new node_opcua_service_write_1.WriteValue(writeValueOptions);
        node_opcua_assert_1.assert(context instanceof session_context_1.SessionContext);
        node_opcua_assert_1.assert(writeValue instanceof node_opcua_service_write_1.WriteValue);
        node_opcua_assert_1.assert(writeValue.value instanceof node_opcua_data_value_2.DataValue);
        node_opcua_assert_1.assert(writeValue.value.value instanceof node_opcua_variant_1.Variant);
        node_opcua_assert_1.assert(_.isFunction(callback));
        // Spec 1.0.2 Part 4 page 58
        // If the SourceTimestamp or the ServerTimestamp is specified, the Server shall
        // use these values.
        // xx _apply_default_timestamps(writeValue.value);
        switch (writeValue.attributeId) {
            case node_opcua_data_model_6.AttributeIds.Value:
                this.writeValue(context, writeValue.value, writeValue.indexRange, callback);
                break;
            case node_opcua_data_model_6.AttributeIds.Historizing:
                if (writeValue.value.value.dataType !== node_opcua_variant_2.DataType.Boolean) {
                    return callback(null, node_opcua_status_code_1.StatusCodes.BadNotSupported);
                }
                // if the variable has no historizing in place reject
                if (!this["hA Configuration"]) {
                    return callback(null, node_opcua_status_code_1.StatusCodes.BadNotSupported);
                }
                // check if user is allowed to do that !
                // TODO
                this.historizing = !!writeValue.value.value.value; // yes ! indeed !
                return callback(null, node_opcua_status_code_1.StatusCodes.Good);
            default:
                super.writeAttribute(context, writeValue, callback);
                break;
        }
    }
    /**
     * @method isValueInRange
     * note:
     *     this method is overridden in address-space-data-access
     * @return {StatusCode}
     */
    isValueInRange(value) {
        node_opcua_assert_1.assert(value instanceof node_opcua_variant_1.Variant);
        const self = this;
        // test dataType
        if (!self._validate_DataType(value.dataType)) {
            return node_opcua_status_code_1.StatusCodes.BadTypeMismatch;
        }
        return node_opcua_status_code_1.StatusCodes.Good;
    }
    /**
     * @method touchValue
     * touch the source timestamp of a Variable and cascade up the change
     * to the parent variable if any.
     *
     * @param [optionalNow=null] {Object}
     * @param optionalNow.timestamp    {Date}
     * @param optionalNow.picoseconds  {Number}
     */
    touchValue(optionalNow) {
        const variable = this;
        const now = optionalNow || node_opcua_date_time_1.getCurrentClock();
        variable._dataValue.sourceTimestamp = now.timestamp;
        variable._dataValue.sourcePicoseconds = now.picoseconds;
        variable._dataValue.serverTimestamp = now.timestamp;
        variable._dataValue.serverPicoseconds = now.picoseconds;
        variable._dataValue.statusCode = node_opcua_status_code_1.StatusCodes.Good;
        if (variable.minimumSamplingInterval === 0) {
            // xx console.log("xxx touchValue = ",variable.browseName.toString(),variable._dataValue.value.value);
            if (variable.listenerCount("value_changed") > 0) {
                const clonedDataValue = variable.readValue();
                variable.emit("value_changed", clonedDataValue);
            }
        }
        if (variable.parent && variable.parent.nodeClass === node_opcua_data_model_3.NodeClass.Variable) {
            variable.parent.touchValue(now);
        }
    }
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
    setPermissions(permissions) {
        this._permissions = permissions;
    }
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
    bindVariable(options, overwrite) {
        if (overwrite) {
            this._timestamped_set_func = null;
            this._timestamped_get_func = null;
            this._get_func = null;
            this._set_func = null;
            this.refreshFunc = null;
            this._historyRead = UAVariable.prototype._historyRead;
        }
        options = options || {};
        node_opcua_assert_1.assert(!_.isFunction(this._timestamped_set_func), "UAVariable already bound");
        node_opcua_assert_1.assert(!_.isFunction(this._timestamped_get_func), "UAVariable already bound");
        bind_getter.call(this, options);
        bind_setter.call(this, options);
        if (options.historyRead) {
            node_opcua_assert_1.assert(!_.isFunction(this._historyRead) ||
                this._historyRead === UAVariable.prototype._historyRead);
            node_opcua_assert_1.assert(_.isFunction(options.historyRead));
            this._historyRead = options.historyRead;
            node_opcua_assert_1.assert(this._historyRead.length === 6);
        }
        node_opcua_assert_1.assert(_.isFunction(this._timestamped_set_func));
        node_opcua_assert_1.assert(this._timestamped_set_func.length === 3);
    }
    /**
     * @method readValueAsync
     * @param context
     * @param callback
     * @param callback.err
     * @param callback.dataValue
     * @async
     */
    readValueAsync(context, callback) {
        if (!context) {
            context = session_context_1.SessionContext.defaultContext;
        }
        node_opcua_assert_1.assert(context instanceof session_context_1.SessionContext);
        node_opcua_assert_1.assert(callback instanceof Function);
        this.__waiting_callbacks = this.__waiting_callbacks || [];
        this.__waiting_callbacks.push(callback);
        const _readValueAsync_in_progress = this.__waiting_callbacks.length >= 2;
        if (_readValueAsync_in_progress) {
            return;
        }
        const readImmediate = (innerCallback) => {
            node_opcua_assert_1.assert(this._dataValue instanceof node_opcua_data_value_2.DataValue);
            const dataValue = this.readValue();
            innerCallback(null, dataValue);
        };
        let func = null;
        if (!this.isReadable(context)) {
            func = (innerCallback) => {
                const dataValue = new node_opcua_data_value_2.DataValue({ statusCode: node_opcua_status_code_1.StatusCodes.BadNotReadable });
                innerCallback(null, dataValue);
            };
        }
        else if (!this.isUserReadable(context)) {
            func = (innerCallback) => {
                const dataValue = new node_opcua_data_value_2.DataValue({ statusCode: node_opcua_status_code_1.StatusCodes.BadUserAccessDenied });
                innerCallback(null, dataValue);
            };
        }
        else {
            func = _.isFunction(this.refreshFunc) ? this.asyncRefresh : readImmediate;
        }
        const satisfy_callbacks = (err, dataValue) => {
            // now call all pending callbacks
            const callbacks = this.__waiting_callbacks || [];
            this.__waiting_callbacks = [];
            const n = callbacks.length;
            for (const callback1 of callbacks) {
                callback1.call(this, err, dataValue);
            }
        };
        try {
            func.call(this, satisfy_callbacks);
        }
        catch (err) {
            // istanbul ignore next
            if (doDebug) {
                debugLog(chalk_1.default.red("func readValueAsync has failed "));
                debugLog(" stack", err.stack);
            }
            satisfy_callbacks(err);
        }
    }
    getWriteMask() {
        return super.getWriteMask();
    }
    getUserWriteMask() {
        return super.getUserWriteMask();
    }
    clone(options, optionalFilter, extraInfo) {
        options = options || {};
        options = _.extend(_.clone(options), {
            // check this eventNotifier: this.eventNotifier,
            // check this symbolicName: this.symbolicName,
            accessLevel: this.accessLevel,
            arrayDimensions: this.arrayDimensions,
            dataType: this.dataType,
            historizing: this.historizing,
            minimumSamplingInterval: this.minimumSamplingInterval,
            userAccessLevel: this.userAccessLevel,
            valueRank: this.valueRank
        });
        const newVariable = base_node_private_1._clone.call(this, UAVariable, options, optionalFilter, extraInfo);
        newVariable.bindVariable();
        node_opcua_assert_1.assert(_.isFunction(newVariable._timestamped_set_func));
        node_opcua_assert_1.assert(newVariable.dataType === this.dataType);
        newVariable._dataValue = this._dataValue.clone();
        return newVariable;
    }
    getDataTypeNode() {
        const addressSpace = this.addressSpace;
        const dt = addressSpace.findNode(this.dataType);
        // istanbul ignore next
        if (!dt) {
            throw new Error("cannot find dataType " + this.dataType.toString());
        }
        return dt;
    }
    get dataTypeObj() {
        return this.getDataTypeNode();
    }
    /**
     * @method bindExtensionObject
     * @return {ExtensionObject}
     */
    bindExtensionObject(optionalExtensionObject) {
        const addressSpace = this.addressSpace;
        const structure = addressSpace.findDataType("Structure");
        let Constructor;
        let extensionObject_;
        if (!structure) {
            // the addressSpace is limited and doesn't provide extension object
            // bindExtensionObject cannot be performed and shall finish here.
            return null;
        }
        if (doDebug) {
            console.log(" ------------------------------ binding ", this.browseName.toString(), this.nodeId.toString());
        }
        node_opcua_assert_1.assert(structure && structure.browseName.toString() === "Structure", "expecting DataType Structure to be in AddressSpace");
        const dt = this.getDataTypeNode();
        if (!dt.isSupertypeOf(structure)) {
            return null;
        }
        // the namespace for the structure browse name elements
        const structureNamespace = dt.nodeId.namespace;
        // -------------------- make sure we do not bind a variable twice ....
        if (this.$extensionObject) {
            node_opcua_assert_1.assert(utils.isNullOrUndefined(optionalExtensionObject), "unsupported case");
            Constructor = addressSpace.getExtensionObjectConstructor(this.dataType);
            extensionObject_ = this.readValue().value.value;
            node_opcua_assert_1.assert(extensionObject_.constructor.name === Constructor.name);
            node_opcua_assert_1.assert(this.$extensionObject.constructor.name === Constructor.name);
            return this.$extensionObject;
            // throw new Error("Variable already bound");
        }
        this.$extensionObject = optionalExtensionObject;
        // ------------------------------------------------------------------
        function prepareVariantValue(dataType, value) {
            if (typeof dataType === "string") {
                dataType = node_opcua_variant_2.DataType[dataType];
            }
            if ((dataType === node_opcua_variant_2.DataType.Int32 || dataType === node_opcua_variant_2.DataType.UInt32) && value && value.key) {
                value = value.value;
            }
            return value;
        }
        const bindProperty = (propertyNode, name, extensionObject, dataTypeNodeId) => {
            const dataTypeAsString = node_opcua_variant_2.DataType[dataTypeNodeId];
            /*
            property.setValueFromSource(new Variant({
                dataType: dataType,
                value: prepareVariantValue(dataType, this.$extensionObject[name])
            }));
             */
            node_opcua_assert_1.assert(propertyNode.readValue().statusCode.equals(node_opcua_status_code_1.StatusCodes.Good));
            const self = this;
            propertyNode.bindVariable({
                timestamped_get() {
                    const value = prepareVariantValue(dataTypeNodeId, self.$extensionObject[name]);
                    propertyNode._dataValue.statusCode = node_opcua_status_code_1.StatusCodes.Good;
                    propertyNode._dataValue.value.value = value;
                    return new node_opcua_data_value_2.DataValue(propertyNode._dataValue);
                },
                timestamped_set(dataValue, callback) {
                    callback(null, node_opcua_status_code_1.StatusCodes.BadNotWritable);
                }
            }, true);
        };
        const components = this.getComponents();
        // ------------------------------------------------------
        // make sure we have a structure
        // ------------------------------------------------------
        const s = this.readValue();
        if (s.value && s.value.dataType === node_opcua_variant_2.DataType.Null) {
            // create a structure and bind it
            extensionObject_ = this.$extensionObject || addressSpace.constructExtensionObject(this.dataType);
            extensionObject_ = new Proxy(extensionObject_, makeHandler(this));
            this.$extensionObject = extensionObject_;
            const theValue = new node_opcua_variant_1.Variant({
                dataType: node_opcua_variant_2.DataType.ExtensionObject,
                value: this.$extensionObject
            });
            this.setValueFromSource(theValue, node_opcua_status_code_1.StatusCodes.Good);
            const self = this;
            this.bindVariable({
                timestamped_get() {
                    self._dataValue.value.value = self.$extensionObject;
                    const d = new node_opcua_data_value_2.DataValue(self._dataValue);
                    d.value = new node_opcua_variant_1.Variant(d.value);
                    return d;
                },
                timestamped_set(dataValue, callback) {
                    callback(null, node_opcua_status_code_1.StatusCodes.BadNotWritable);
                }
            }, true);
        }
        else {
            // verify that variant has the correct type
            node_opcua_assert_1.assert(s.value.dataType === node_opcua_variant_2.DataType.ExtensionObject);
            this.$extensionObject = s.value.value;
            node_opcua_assert_1.assert(this.$extensionObject && this.$extensionObject.constructor, "expecting an valid extension object");
            node_opcua_assert_1.assert(s.statusCode.equals(node_opcua_status_code_1.StatusCodes.Good));
            Constructor = addressSpace.getExtensionObjectConstructor(this.dataType);
            node_opcua_assert_1.assert(Constructor);
            node_opcua_assert_1.assert(this.$extensionObject.constructor.name === Constructor.name);
        }
        let property;
        let camelCaseName;
        // ------------------------------------------------------
        // now bind each member
        // ------------------------------------------------------
        for (const field of dt.definition) {
            camelCaseName = node_opcua_utils_1.lowerFirstLetter(field.name);
            const component = components.filter((f) => f.browseName.name.toString() === field.name);
            if (component.length === 1) {
                property = component[0];
                /* istanbul ignore next */
            }
            else {
                node_opcua_assert_1.assert(component.length === 0);
                // create a variable (Note we may use ns=1;s=parentName/0:PropertyName)
                property = this.namespace.addVariable({
                    browseName: { namespaceIndex: structureNamespace, name: field.name.toString() },
                    componentOf: this,
                    dataType: field.dataType,
                    minimumSamplingInterval: this.minimumSamplingInterval
                });
                node_opcua_assert_1.assert(property.minimumSamplingInterval === this.minimumSamplingInterval);
            }
            property._dataValue.statusCode = node_opcua_status_code_1.StatusCodes.Good;
            property.touchValue();
            const dataTypeNodeId = addressSpace.findCorrespondingBasicDataType(field.dataType);
            node_opcua_assert_1.assert(this.$extensionObject.hasOwnProperty(camelCaseName));
            if (doDebug) {
                const x = addressSpace.findNode(field.dataType).browseName.toString();
                const basicType = addressSpace.findCorrespondingBasicDataType(field.dataType);
                console.log(chalk_1.default.cyan("xxx"), " dataType", w(field.dataType.toString(), 8), w(field.name, 35), "valueRank", chalk_1.default.cyan(w(field.valueRank, 3)), chalk_1.default.green(w(x, 25)), "basicType = ", chalk_1.default.yellow(w(basicType.toString(), 20)), property.nodeId.toString(), property.readValue().statusCode.toString());
            }
            if (dataTypeNodeId === node_opcua_variant_2.DataType.ExtensionObject) {
                node_opcua_assert_1.assert(this.$extensionObject[camelCaseName] instanceof Object);
                this.$extensionObject[camelCaseName] = new Proxy(this.$extensionObject[camelCaseName], makeHandler(property));
                property._dataValue.value = new node_opcua_variant_1.Variant({
                    dataType: node_opcua_variant_2.DataType.ExtensionObject,
                    value: this.$extensionObject[camelCaseName]
                });
                property.bindExtensionObject();
                property.$extensionObject = this.$extensionObject[camelCaseName];
            }
            else {
                const dataTypeAsString = node_opcua_variant_2.DataType[dataTypeNodeId];
                node_opcua_assert_1.assert(typeof dataTypeAsString === "string");
                const preparedValue = prepareVariantValue(dataTypeNodeId, this.$extensionObject[camelCaseName]);
                property._dataValue.value = new node_opcua_variant_1.Variant({
                    dataType: dataTypeAsString,
                    value: preparedValue
                });
                const self = this;
                property.camelCaseName = camelCaseName;
                property.setValueFromSource = function (variant) {
                    const inner_this = this;
                    variant = node_opcua_variant_1.Variant.coerce(variant);
                    // xx console.log("PropertySetValueFromSource this", inner_this.nodeId.toString(), inner_this.browseName.toString(), variant.toString(), inner_this.dataType.toString());
                    // xx assert(variant.dataType === this.dataType);
                    self.$extensionObject[inner_this.camelCaseName] = variant.value;
                };
            }
            node_opcua_assert_1.assert(property.readValue().statusCode.equals(node_opcua_status_code_1.StatusCodes.Good));
            bindProperty(property, camelCaseName, this.$extensionObject, dataTypeNodeId);
        }
        node_opcua_assert_1.assert(this.$extensionObject instanceof Object);
        return this.$extensionObject;
    }
    updateExtensionObjectPartial(partialExtensionObject) {
        setExtensionObjectValue(this, partialExtensionObject);
        return this.$extensionObject;
    }
    incrementExtensionObjectPartial(path) {
        let name;
        if (typeof path === "string") {
            path = path.split(".");
        }
        node_opcua_assert_1.assert(path instanceof Array);
        const extensionObject = this.constructExtensionObjectFromComponents();
        let i;
        // read partial value
        const partialData = {};
        let p = partialData;
        for (i = 0; i < path.length - 1; i++) {
            name = path[i];
            p[name] = {};
            p = p[name];
        }
        name = path[path.length - 1];
        p[name] = 0;
        let c1 = partialData;
        let c2 = extensionObject;
        for (i = 0; i < path.length - 1; i++) {
            name = path[i];
            c1 = partialData[name];
            c2 = extensionObject[name];
        }
        name = path[path.length - 1];
        c1[name] = c2[name];
        c1[name] += 1;
        // xx console.log(partialData);
        setExtensionObjectValue(this, partialData);
    }
    constructExtensionObjectFromComponents() {
        return this.readValue().value.value;
    }
    toString() {
        const options = new base_node_private_1.ToStringBuilder();
        base_node_private_1.UAVariable_toString.call(this, options);
        return options.toString();
    }
    // ---------------------------------------------------------------------------------------------------
    // History
    // ---------------------------------------------------------------------------------------------------
    historyRead(context, historyReadDetails, indexRange, dataEncoding, continuationPoint, callback) {
        if (!callback) {
            callback = continuationPoint;
            continuationPoint = undefined;
        }
        node_opcua_assert_1.assert(context instanceof session_context_1.SessionContext);
        node_opcua_assert_1.assert(callback instanceof Function);
        if (typeof this._historyRead !== "function") {
            return callback(null, new node_opcua_types_1.HistoryReadResult({ statusCode: node_opcua_status_code_1.StatusCodes.BadNotReadable }));
        }
        this._historyRead(context, historyReadDetails, indexRange, dataEncoding, continuationPoint || null, callback);
    }
    _historyReadRaw(context, historyReadRawModifiedDetails, indexRange, dataEncoding, continuationPoint, callback) {
        throw new Error("");
    }
    _historyReadRawModify(context, historyReadRawModifiedDetails, indexRange, dataEncoding, continuationPoint, callback) {
        throw new Error("");
    }
    _historyRead(context, historyReadDetails, indexRange, dataEncoding, continuationPoint, callback) {
        const result = new node_opcua_types_1.HistoryReadResult({
            statusCode: node_opcua_status_code_1.StatusCodes.BadNotImplemented
        });
        callback(null, result);
    }
    _historyPush(newDataValue) {
        throw new Error("");
    }
    _historyReadRawAsync(historyReadRawModifiedDetails, maxNumberToExtract, isReversed, reverseDataValue, callback) {
        throw new Error("");
    }
    _historyReadModify(context, historyReadRawModifiedDetails, indexRange, dataEncoding, continuationPoint, callback) {
        throw new Error("");
    }
    _update_startOfOnlineArchive(newDate) {
        // please install
        throw new Error("");
    }
    _update_startOfArchive(newDate) {
        throw new Error("");
    }
    _validate_DataType(variantDataType) {
        return validateDataType(this.addressSpace, this.dataType, variantDataType, this.nodeId);
    }
    _internal_set_dataValue(dataValue, indexRange) {
        node_opcua_assert_1.assert(dataValue, "expecting a dataValue");
        node_opcua_assert_1.assert(dataValue instanceof node_opcua_data_value_2.DataValue, "expecting dataValue to be a DataValue");
        node_opcua_assert_1.assert(dataValue !== this._dataValue, "expecting dataValue to be different from previous DataValue instance");
        const old_dataValue = this._dataValue;
        this._dataValue = dataValue;
        this._dataValue.statusCode = this._dataValue.statusCode || node_opcua_status_code_1.StatusCodes.Good;
        // repair missing timestamps
        if (!dataValue.serverTimestamp) {
            this._dataValue.serverTimestamp = old_dataValue.serverTimestamp;
            this._dataValue.serverPicoseconds = old_dataValue.serverPicoseconds;
        }
        if (!dataValue.sourceTimestamp) {
            this._dataValue.sourceTimestamp = old_dataValue.sourceTimestamp;
            this._dataValue.sourcePicoseconds = old_dataValue.sourcePicoseconds;
        }
        if (!node_opcua_data_value_1.sameDataValue(old_dataValue, dataValue)) {
            this.emit("value_changed", this._dataValue, indexRange);
        }
    }
    _conditionRefresh(_cache) {
        base_node_private_1.apply_condition_refresh.call(this, _cache);
    }
    handle_semantic_changed() {
        this.semantic_version = this.semantic_version + 1;
        this.emit("semantic_changed");
    }
    _readDataType() {
        node_opcua_assert_1.assert(this.dataType instanceof node_opcua_nodeid_1.NodeId);
        const options = {
            statusCode: node_opcua_status_code_1.StatusCodes.Good,
            value: {
                dataType: node_opcua_variant_2.DataType.NodeId,
                value: this.dataType
            }
        };
        return new node_opcua_data_value_2.DataValue(options);
    }
    _readValueRank() {
        node_opcua_assert_1.assert(typeof this.valueRank === "number");
        const options = {
            statusCode: node_opcua_status_code_1.StatusCodes.Good,
            value: { dataType: node_opcua_variant_2.DataType.Int32, value: this.valueRank }
        };
        return new node_opcua_data_value_2.DataValue(options);
    }
    _readArrayDimensions() {
        node_opcua_assert_1.assert(_.isArray(this.arrayDimensions) || this.arrayDimensions === null);
        const options = {
            statusCode: node_opcua_status_code_1.StatusCodes.Good,
            value: { dataType: node_opcua_variant_2.DataType.UInt32, arrayType: node_opcua_variant_3.VariantArrayType.Array, value: this.arrayDimensions }
        };
        return new node_opcua_data_value_2.DataValue(options);
    }
    _readAccessLevel(context) {
        node_opcua_assert_1.assert(context instanceof session_context_1.SessionContext);
        const options = {
            statusCode: node_opcua_status_code_1.StatusCodes.Good,
            value: { dataType: node_opcua_variant_2.DataType.Byte, value: node_opcua_data_model_2.convertAccessLevelFlagToByte(this.accessLevel) }
        };
        return new node_opcua_data_value_2.DataValue(options);
    }
    _readUserAccessLevel(context) {
        node_opcua_assert_1.assert(context instanceof session_context_1.SessionContext);
        const effectiveUserAccessLevel = _calculateEffectiveUserAccessLevelFromPermission(this, context, this.userAccessLevel);
        const options = {
            value: {
                dataType: node_opcua_variant_2.DataType.Byte,
                statusCode: node_opcua_status_code_1.StatusCodes.Good,
                value: node_opcua_data_model_2.convertAccessLevelFlagToByte(effectiveUserAccessLevel)
            }
        };
        return new node_opcua_data_value_2.DataValue(options);
    }
    _readMinimumSamplingInterval() {
        // expect a Duration => Double
        const options = {};
        if (this.minimumSamplingInterval === undefined) {
            options.statusCode = node_opcua_status_code_1.StatusCodes.BadAttributeIdInvalid;
        }
        else {
            options.value = { dataType: node_opcua_variant_2.DataType.Double, value: this.minimumSamplingInterval };
            options.statusCode = node_opcua_status_code_1.StatusCodes.Good;
        }
        return new node_opcua_data_value_2.DataValue(options);
    }
    _readHistorizing() {
        node_opcua_assert_1.assert(typeof (this.historizing) === "boolean");
        const options = {
            statusCode: node_opcua_status_code_1.StatusCodes.Good,
            value: { dataType: node_opcua_variant_2.DataType.Boolean, value: !!this.historizing }
        };
        return new node_opcua_data_value_2.DataValue(options);
    }
}
exports.UAVariable = UAVariable;
// tslint:disable:no-var-requires
const thenify = require("thenify");
UAVariable.prototype.asyncRefresh = thenify.withCallback(UAVariable.prototype.asyncRefresh);
UAVariable.prototype.writeValue = thenify.withCallback(UAVariable.prototype.writeValue);
UAVariable.prototype.writeAttribute = thenify.withCallback(UAVariable.prototype.writeAttribute);
UAVariable.prototype.historyRead = thenify.withCallback(UAVariable.prototype.historyRead);
UAVariable.prototype.readValueAsync = thenify.withCallback(UAVariable.prototype.readValueAsync);
function check_valid_array(dataType, array) {
    if (_.isArray(array)) {
        return true;
    }
    switch (dataType) {
        case node_opcua_variant_2.DataType.Double:
            return array instanceof Float64Array;
        case node_opcua_variant_2.DataType.Float:
            return array instanceof Float32Array;
        case node_opcua_variant_2.DataType.Int32:
            return array instanceof Int32Array;
        case node_opcua_variant_2.DataType.Int16:
            return array instanceof Int16Array;
        case node_opcua_variant_2.DataType.SByte:
            return array instanceof Int8Array;
        case node_opcua_variant_2.DataType.UInt32:
            return array instanceof Uint32Array;
        case node_opcua_variant_2.DataType.UInt16:
            return array instanceof Uint16Array;
        case node_opcua_variant_2.DataType.Byte:
            return array instanceof Uint8Array || array instanceof Buffer;
    }
    return false;
}
function _apply_default_timestamps(dataValue) {
    const now = node_opcua_date_time_1.getCurrentClock();
    node_opcua_assert_1.assert(dataValue instanceof node_opcua_data_value_2.DataValue);
    if (!dataValue.sourceTimestamp) {
        dataValue.sourceTimestamp = now.timestamp;
        dataValue.sourcePicoseconds = now.picoseconds;
    }
    if (!dataValue.serverTimestamp) {
        dataValue.serverTimestamp = now.timestamp;
        dataValue.serverPicoseconds = now.picoseconds;
    }
}
function _calculateEffectiveUserAccessLevelFromPermission(node, context, userAccessLevel) {
    function __adjustFlag(flagName, userAccessLevel1) {
        node_opcua_assert_1.assert(node_opcua_data_model_4.AccessLevelFlag.hasOwnProperty(flagName));
        // xx if (userAccessLevel & AccessLevelFlag[flagName] === AccessLevelFlag[flagName]) {
        if (context.checkPermission(node, flagName)) {
            userAccessLevel1 = userAccessLevel1 | node_opcua_data_model_4.AccessLevelFlag[flagName];
        }
        // xx }
        return userAccessLevel1;
    }
    if (context.checkPermission) {
        userAccessLevel = 0;
        node_opcua_assert_1.assert(context.checkPermission instanceof Function);
        userAccessLevel = __adjustFlag("CurrentRead", userAccessLevel);
        userAccessLevel = __adjustFlag("CurrentWrite", userAccessLevel);
        userAccessLevel = __adjustFlag("HistoryRead", userAccessLevel);
        userAccessLevel = __adjustFlag("HistoryWrite", userAccessLevel);
        userAccessLevel = __adjustFlag("SemanticChange", userAccessLevel);
        userAccessLevel = __adjustFlag("StatusWrite", userAccessLevel);
        userAccessLevel = __adjustFlag("TimestampWrite", userAccessLevel);
    }
    return userAccessLevel;
}
function adjustVariant(variant) {
    // convert Variant( Scalar|ByteString) =>  Variant(Array|ByteArray)
    const addressSpace = this.addressSpace;
    const basicType = addressSpace.findCorrespondingBasicDataType(this.dataType);
    if (basicType === node_opcua_variant_2.DataType.Byte && this.valueRank === 1) {
        if (variant.arrayType === node_opcua_variant_3.VariantArrayType.Scalar && variant.dataType === node_opcua_variant_2.DataType.ByteString) {
            if ((this.dataType.value === node_opcua_variant_2.DataType.Byte) && (this.dataType.namespace === 0)) { // Byte
                variant.arrayType = node_opcua_variant_3.VariantArrayType.Array;
                variant.dataType = node_opcua_variant_2.DataType.Byte;
                node_opcua_assert_1.assert(variant.dataType === node_opcua_variant_2.DataType.Byte);
                node_opcua_assert_1.assert(!variant.value || variant.value instanceof Buffer);
            }
        }
    }
    if (basicType === node_opcua_variant_2.DataType.ByteString && this.valueRank === -1 /* Scalar*/) {
        if (variant.arrayType === node_opcua_variant_3.VariantArrayType.Array && variant.dataType === node_opcua_variant_2.DataType.Byte) {
            if ((this.dataType.value === node_opcua_variant_2.DataType.ByteString) && (this.dataType.namespace === 0)) { // Byte
                variant.arrayType = node_opcua_variant_3.VariantArrayType.Scalar;
                variant.dataType = node_opcua_variant_2.DataType.ByteString;
                node_opcua_assert_1.assert(variant.dataType === node_opcua_variant_2.DataType.ByteString);
                node_opcua_assert_1.assert(!variant.value || variant.value instanceof Buffer);
            }
        }
    }
    return variant;
}
function _not_writable_timestamped_set_func(dataValue, callback) {
    node_opcua_assert_1.assert(dataValue instanceof node_opcua_data_value_2.DataValue);
    callback(null, node_opcua_status_code_1.StatusCodes.BadNotWritable, null);
}
function _default_writable_timestamped_set_func(dataValue, callback) {
    /* jshint validthis: true */
    node_opcua_assert_1.assert(dataValue instanceof node_opcua_data_value_2.DataValue);
    callback(null, node_opcua_status_code_1.StatusCodes.Good, dataValue);
}
function turn_sync_to_async(f, numberOfArgs) {
    if (f.length <= numberOfArgs) {
        return function (data, callback) {
            const r = f.call(this, data);
            setImmediate(() => {
                return callback(null, r);
            });
        };
    }
    else {
        node_opcua_assert_1.assert(f.length === numberOfArgs + 1);
        return f;
    }
}
const _default_minimumSamplingInterval = 1000;
function coerceDataValue(dataValue) {
    if (dataValue instanceof node_opcua_data_value_2.DataValue) {
        return dataValue;
    }
    return new node_opcua_data_value_2.DataValue(dataValue);
}
// variation #3 :
function _Variable_bind_with_async_refresh(options) {
    /* jshint validthis: true */
    node_opcua_assert_1.assert(this instanceof UAVariable);
    node_opcua_assert_1.assert(_.isFunction(options.refreshFunc));
    node_opcua_assert_1.assert(!options.get, "a getter shall not be specified when refreshFunc is set");
    node_opcua_assert_1.assert(!options.timestamped_get, "a getter shall not be specified when refreshFunc is set");
    node_opcua_assert_1.assert(!this.refreshFunc);
    this.refreshFunc = options.refreshFunc;
    // assert(this.readValue().statusCode === StatusCodes.BadNodeIdUnknown);
    this._dataValue.statusCode = node_opcua_status_code_1.StatusCodes.UncertainInitialValue;
    // TO DO : REVISIT THIS ASSUMPTION
    if (false && this.minimumSamplingInterval === 0) {
        // when a getter /timestamped_getter or async_getter is provided
        // samplingInterval cannot be 0, as the item value must be scanned to be updated.
        this.minimumSamplingInterval = _default_minimumSamplingInterval; // MonitoredItem.minimumSamplingInterval;
        debugLog("adapting minimumSamplingInterval on " + this.browseName.toString() + " to " + this.minimumSamplingInterval);
    }
}
// variation 2
function _Variable_bind_with_timestamped_get(options) {
    /* jshint validthis: true */
    node_opcua_assert_1.assert(this instanceof UAVariable);
    node_opcua_assert_1.assert(_.isFunction(options.timestamped_get));
    node_opcua_assert_1.assert(!options.get, "should not specify 'get' when 'timestamped_get' exists ");
    node_opcua_assert_1.assert(!this._timestamped_get_func);
    const async_refresh_func = (callback) => {
        const dataValue = this._timestamped_get_func();
        callback(null, dataValue);
    };
    if (options.timestamped_get.length === 0) {
        // sync version
        this._timestamped_get_func = options.timestamped_get;
        const dataValue_verify = this._timestamped_get_func();
        /* istanbul ignore next */
        if (!(dataValue_verify instanceof node_opcua_data_value_2.DataValue)) {
            console.log(chalk_1.default.red(" Bind variable error: "), " the timestamped_get function must return a DataValue");
            console.log("value_check.constructor.name ", dataValue_verify ? dataValue_verify.constructor.name : "null");
            throw new Error(" Bind variable error: " +
                " the timestamped_get function must return a DataValue");
        }
        _Variable_bind_with_async_refresh.call(this, { refreshFunc: async_refresh_func });
    }
    else if (options.timestamped_get.length === 1) {
        _Variable_bind_with_async_refresh.call(this, { refreshFunc: options.timestamped_get });
    }
    else {
        throw new Error("timestamped_get has a invalid number of argument , should be 0 or 1  ");
    }
}
// variation 1
function _Variable_bind_with_simple_get(options) {
    /* jshint validthis: true */
    node_opcua_assert_1.assert(this instanceof UAVariable);
    node_opcua_assert_1.assert(_.isFunction(options.get), "should specify get function");
    node_opcua_assert_1.assert(options.get.length === 0, "get function should not have arguments");
    node_opcua_assert_1.assert(!options.timestamped_get, "should not specify a timestamped_get function when get is specified");
    node_opcua_assert_1.assert(!this._timestamped_get_func);
    node_opcua_assert_1.assert(!this._get_func);
    this._get_func = options.get;
    const timestamped_get_func_from__Variable_bind_with_simple_get = () => {
        const value = this._get_func();
        /* istanbul ignore next */
        if (!is_Variant_or_StatusCode(value)) {
            console.log(chalk_1.default.red(" Bind variable error: "), " : the getter must return a Variant or a StatusCode");
            console.log("value_check.constructor.name ", value ? value.constructor.name : "null");
            throw new Error(" bindVariable : the value getter function returns a invalid result ( expecting a Variant or a StatusCode !!!");
        }
        if (is_StatusCode(value)) {
            return new node_opcua_data_value_2.DataValue({ statusCode: value });
        }
        else {
            if (!this._dataValue || !isGoodish(this._dataValue.statusCode) || !node_opcua_variant_3.sameVariant(this._dataValue.value, value)) {
                this.setValueFromSource(value, node_opcua_status_code_1.StatusCodes.Good);
            }
            else {
                // XXXY console.log("YYYYYYYYYYYYYYYYYYYYYYYYYY",this.browseName.toString());
            }
            return this._dataValue;
        }
    };
    _Variable_bind_with_timestamped_get.call(this, { timestamped_get: timestamped_get_func_from__Variable_bind_with_simple_get });
}
function _Variable_bind_with_simple_set(options) {
    node_opcua_assert_1.assert(this instanceof UAVariable);
    node_opcua_assert_1.assert(_.isFunction(options.set), "should specify set function");
    node_opcua_assert_1.assert(!options.timestamped_set, "should not specify a timestamped_set function");
    node_opcua_assert_1.assert(!this._timestamped_set_func);
    node_opcua_assert_1.assert(!this._set_func);
    this._set_func = turn_sync_to_async(options.set, 1);
    node_opcua_assert_1.assert(this._set_func.length === 2, " set function must have 2 arguments ( variant, callback)");
    this._timestamped_set_func = (timestamped_value, indexRange, callback) => {
        node_opcua_assert_1.assert(timestamped_value instanceof node_opcua_data_value_2.DataValue);
        this._set_func(timestamped_value.value, (err, statusCode) => {
            if (!err && !statusCode) {
                console.log(chalk_1.default.red("UAVariable Binding Error _set_func must return a StatusCode, check the bindVariable parameters"));
                console.log(chalk_1.default.yellow("StatusCode.Good is assumed"));
                return callback(err, node_opcua_status_code_1.StatusCodes.Good, timestamped_value);
            }
            callback(err, statusCode, timestamped_value);
        });
    };
}
function _Variable_bind_with_timestamped_set(options) {
    node_opcua_assert_1.assert(this instanceof UAVariable);
    node_opcua_assert_1.assert(_.isFunction(options.timestamped_set));
    node_opcua_assert_1.assert(options.timestamped_set.length === 2, "timestamped_set must have 2 parameters  timestamped_set: function(dataValue,callback){}");
    node_opcua_assert_1.assert(!options.set, "should not specify set when timestamped_set_func exists ");
    this._timestamped_set_func = (dataValue, indexRange, callback) => {
        // xx assert(!indexRange,"indexRange Not Implemented");
        return options.timestamped_set.call(this, dataValue, callback);
    };
}
function bind_setter(options) {
    if (_.isFunction(options.set)) { // variation 1
        _Variable_bind_with_simple_set.call(this, options);
    }
    else if (_.isFunction(options.timestamped_set)) { // variation 2
        node_opcua_assert_1.assert(_.isFunction(options.timestamped_get), "timestamped_set must be used with timestamped_get ");
        _Variable_bind_with_timestamped_set.call(this, options);
    }
    else if (_.isFunction(options.timestamped_get)) {
        // timestamped_get is  specified but timestamped_set is not
        // => Value is read-only
        _Variable_bind_with_timestamped_set.call(this, {
            timestamped_set: _not_writable_timestamped_set_func
        });
    }
    else {
        _Variable_bind_with_timestamped_set.call(this, {
            timestamped_set: _default_writable_timestamped_set_func
        });
    }
}
function bind_getter(options) {
    if (_.isFunction(options.get)) { // variation 1
        _Variable_bind_with_simple_get.call(this, options);
    }
    else if (_.isFunction(options.timestamped_get)) { // variation 2
        _Variable_bind_with_timestamped_get.call(this, options);
    }
    else if (_.isFunction(options.refreshFunc)) { // variation 3
        _Variable_bind_with_async_refresh.call(this, options);
    }
    else {
        node_opcua_assert_1.assert(!options.set, "getter is missing : a getter must be provided if a setter is provided");
        // xx bind_variant.call(this,options);
        if (options.dataType !== undefined) {
            this.setValueFromSource(options);
        }
    }
}
function w(str, n) {
    return (str + "                                                              ").substr(0, n);
}
function _getter(target, key /*, receiver*/) {
    if (target[key] === undefined) {
        return undefined;
    }
    return target[key];
}
function _setter(variable, target, key, value /*, receiver*/) {
    target[key] = value;
    if (variable[key] && variable[key].touchValue) {
        variable[key].touchValue();
    }
    return true; // true means the set operation has succeeded
}
function makeHandler(variable) {
    const handler = {
        get: _getter,
        set: _setter.bind(null, variable)
    };
    return handler;
}
function setExtensionObjectValue(node, partialObject) {
    const extensionObject = node.$extensionObject;
    if (!extensionObject) {
        throw new Error("setExtensionObjectValue node has no extension object " + node.browseName.toString());
    }
    function _update_extension_object(extObject, partialObject1) {
        const keys = Object.keys(partialObject1);
        for (const prop of keys) {
            if (extObject[prop] instanceof Object) {
                _update_extension_object(extObject[prop], partialObject1[prop]);
            }
            else {
                extObject[prop] = partialObject1[prop];
            }
        }
    }
    _update_extension_object(extensionObject, partialObject);
}
// x TO DO
// require("./data_access/ua_variable_data_access");
// require("./historical_access/ua_variable_history");
//# sourceMappingURL=ua_variable.js.map