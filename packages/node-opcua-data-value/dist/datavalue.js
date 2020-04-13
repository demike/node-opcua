"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-data-value
 */
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_date_time_1 = require("node-opcua-date-time");
const node_opcua_factory_1 = require("node-opcua-factory");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const node_opcua_variant_1 = require("node-opcua-variant");
const _ = require("underscore");
const DataValueEncodingByte_enum_1 = require("./DataValueEncodingByte_enum");
const TimestampsToReturn_enum_1 = require("./TimestampsToReturn_enum");
const node_opcua_basic_types_1 = require("node-opcua-basic-types");
const node_opcua_data_model_1 = require("node-opcua-data-model");
// tslint:disable:no-bitwise
function getDataValue_EncodingByte(dataValue) {
    let encodingMask = 0;
    if (dataValue.value && dataValue.value.dataType !== node_opcua_variant_1.DataType.Null) {
        encodingMask |= DataValueEncodingByte_enum_1.DataValueEncodingByte.Value;
    }
    //  if (dataValue.statusCode !== null ) {
    if (_.isObject(dataValue.statusCode) && dataValue.statusCode.value !== 0) {
        encodingMask |= DataValueEncodingByte_enum_1.DataValueEncodingByte.StatusCode;
    }
    if (dataValue.sourceTimestamp && dataValue.sourceTimestamp !== "null") {
        encodingMask |= DataValueEncodingByte_enum_1.DataValueEncodingByte.SourceTimestamp;
    }
    // the number of picoseconds that can be encoded are
    // 100 nano * 10000;
    // above this the value contains the excess in pico second to make the sourceTimestamp more accurate
    if (dataValue.sourcePicoseconds ? dataValue.sourcePicoseconds % 100000 : false) {
        encodingMask |= DataValueEncodingByte_enum_1.DataValueEncodingByte.SourcePicoseconds;
    }
    if (dataValue.serverTimestamp && dataValue.serverTimestamp !== "null") {
        encodingMask |= DataValueEncodingByte_enum_1.DataValueEncodingByte.ServerTimestamp;
    }
    if (dataValue.serverPicoseconds ? dataValue.serverPicoseconds % 100000 : false) {
        encodingMask |= DataValueEncodingByte_enum_1.DataValueEncodingByte.ServerPicoseconds;
    }
    return encodingMask;
}
function encodeDataValue(dataValue, stream) {
    const encodingMask = getDataValue_EncodingByte(dataValue);
    node_opcua_assert_1.assert(_.isFinite(encodingMask) && encodingMask >= 0 && encodingMask <= 0x3F);
    // write encoding byte
    node_opcua_basic_types_1.encodeUInt8(encodingMask, stream);
    // write value as Variant
    if (encodingMask & DataValueEncodingByte_enum_1.DataValueEncodingByte.Value) {
        if (!dataValue.value) {
            dataValue.value = new node_opcua_variant_1.Variant();
        }
        if (!dataValue.value.encode) {
            // tslint:disable-next-line:no-console
            console.log(" CANNOT FIND ENCODE METHOD ON VARIANT !!! HELP", dataValue.toString());
        }
        dataValue.value.encode(stream);
    }
    // write statusCode
    if (encodingMask & DataValueEncodingByte_enum_1.DataValueEncodingByte.StatusCode) {
        node_opcua_basic_types_1.encodeStatusCode(dataValue.statusCode, stream);
    }
    // write sourceTimestamp
    if ((encodingMask & DataValueEncodingByte_enum_1.DataValueEncodingByte.SourceTimestamp) && (dataValue.sourceTimestamp !== null)) {
        node_opcua_basic_types_1.encodeHighAccuracyDateTime(dataValue.sourceTimestamp, dataValue.sourcePicoseconds, stream);
    }
    // write sourcePicoseconds
    if (encodingMask & DataValueEncodingByte_enum_1.DataValueEncodingByte.SourcePicoseconds) {
        node_opcua_assert_1.assert(dataValue.sourcePicoseconds !== null);
        const sourcePicoseconds = Math.floor((dataValue.sourcePicoseconds % 100000) / 10);
        node_opcua_basic_types_1.encodeUInt16(sourcePicoseconds, stream);
    }
    // write serverTimestamp
    if ((encodingMask & DataValueEncodingByte_enum_1.DataValueEncodingByte.ServerTimestamp) && dataValue.serverTimestamp !== null) {
        node_opcua_basic_types_1.encodeHighAccuracyDateTime(dataValue.serverTimestamp, dataValue.serverPicoseconds, stream);
    }
    // write serverPicoseconds
    if (encodingMask & DataValueEncodingByte_enum_1.DataValueEncodingByte.ServerPicoseconds) {
        node_opcua_assert_1.assert(dataValue.serverPicoseconds !== null);
        const serverPicoseconds = Math.floor((dataValue.serverPicoseconds % 100000) / 10); // we encode 10-pios
        node_opcua_basic_types_1.encodeUInt16(serverPicoseconds, stream);
    }
}
exports.encodeDataValue = encodeDataValue;
function decodeDebugDataValue(dataValue, stream, options) {
    const tracer = options.tracer;
    let cur = stream.length;
    const encodingMask = node_opcua_basic_types_1.decodeUInt8(stream);
    node_opcua_assert_1.assert(encodingMask <= 0x3F);
    tracer.trace("member", "encodingByte", "0x" + encodingMask.toString(16), cur, stream.length, "Mask");
    tracer.encoding_byte(encodingMask, DataValueEncodingByte_enum_1.DataValueEncodingByte, cur, stream.length);
    if (encodingMask & DataValueEncodingByte_enum_1.DataValueEncodingByte.Value) {
        dataValue.value = new node_opcua_variant_1.Variant();
        dataValue.value.decodeDebug(stream, options);
    }
    // read statusCode
    cur = stream.length;
    if (encodingMask & DataValueEncodingByte_enum_1.DataValueEncodingByte.StatusCode) {
        dataValue.statusCode = node_opcua_basic_types_1.decodeStatusCode(stream);
        tracer.trace("member", "statusCode", dataValue.statusCode, cur, stream.length, "StatusCode");
    }
    // read sourceTimestamp
    cur = stream.length;
    if (encodingMask & DataValueEncodingByte_enum_1.DataValueEncodingByte.SourceTimestamp) {
        dataValue.sourceTimestamp = node_opcua_basic_types_1.decodeHighAccuracyDateTime(stream);
        dataValue.sourcePicoseconds = dataValue.sourceTimestamp.picoseconds;
        tracer.trace("member", "sourceTimestamp", dataValue.sourceTimestamp, cur, stream.length, "DateTime");
    }
    // read sourcePicoseconds
    cur = stream.length;
    dataValue.sourcePicoseconds = 0;
    if (encodingMask & DataValueEncodingByte_enum_1.DataValueEncodingByte.SourcePicoseconds) {
        const tenPico = node_opcua_basic_types_1.decodeUInt16(stream);
        dataValue.sourcePicoseconds += tenPico * 10;
        tracer.trace("member", "sourcePicoseconds", dataValue.sourcePicoseconds, cur, stream.length, "UInt16");
    }
    // read serverTimestamp
    cur = stream.length;
    dataValue.serverPicoseconds = 0;
    if (encodingMask & DataValueEncodingByte_enum_1.DataValueEncodingByte.ServerTimestamp) {
        dataValue.serverTimestamp = node_opcua_basic_types_1.decodeHighAccuracyDateTime(stream);
        dataValue.serverPicoseconds = dataValue.serverTimestamp.picoseconds | 0;
        tracer.trace("member", "serverTimestamp", dataValue.serverTimestamp, cur, stream.length, "DateTime");
    }
    // read serverPicoseconds
    cur = stream.length;
    if (encodingMask & DataValueEncodingByte_enum_1.DataValueEncodingByte.ServerPicoseconds) {
        const tenPico = node_opcua_basic_types_1.decodeUInt16(stream);
        dataValue.serverPicoseconds += tenPico * 10;
        tracer.trace("member", "serverPicoseconds", dataValue.serverPicoseconds, cur, stream.length, "UInt16");
    }
}
function decodeDataValueInternal(dataValue, stream) {
    const encodingMask = node_opcua_basic_types_1.decodeUInt8(stream);
    if (encodingMask & DataValueEncodingByte_enum_1.DataValueEncodingByte.Value) {
        dataValue.value = new node_opcua_variant_1.Variant();
        dataValue.value.decode(stream);
    }
    // read statusCode
    if (encodingMask & DataValueEncodingByte_enum_1.DataValueEncodingByte.StatusCode) {
        dataValue.statusCode = node_opcua_basic_types_1.decodeStatusCode(stream);
    }
    else {
        dataValue.statusCode = node_opcua_status_code_1.StatusCodes.Good;
    }
    dataValue.sourcePicoseconds = 0;
    // read sourceTimestamp
    if (encodingMask & DataValueEncodingByte_enum_1.DataValueEncodingByte.SourceTimestamp) {
        dataValue.sourceTimestamp = node_opcua_basic_types_1.decodeHighAccuracyDateTime(stream);
        dataValue.sourcePicoseconds += dataValue.sourceTimestamp.picoseconds | 0;
    }
    // read sourcePicoseconds
    if (encodingMask & DataValueEncodingByte_enum_1.DataValueEncodingByte.SourcePicoseconds) {
        dataValue.sourcePicoseconds += node_opcua_basic_types_1.decodeUInt16(stream) * 10;
    }
    // read serverTimestamp
    dataValue.serverPicoseconds = 0;
    if (encodingMask & DataValueEncodingByte_enum_1.DataValueEncodingByte.ServerTimestamp) {
        dataValue.serverTimestamp = node_opcua_basic_types_1.decodeHighAccuracyDateTime(stream);
        dataValue.serverPicoseconds += dataValue.serverTimestamp.picoseconds | 0;
    }
    // read serverPicoseconds
    if (encodingMask & DataValueEncodingByte_enum_1.DataValueEncodingByte.ServerPicoseconds) {
        dataValue.serverPicoseconds += node_opcua_basic_types_1.decodeUInt16(stream) * 10;
    }
}
function decodeDataValue(stream) {
    const dataValue = new DataValue();
    decodeDataValueInternal(dataValue, stream);
    return dataValue;
}
exports.decodeDataValue = decodeDataValue;
function isValidDataValue(self) {
    if (_.isObject(self.value)) {
        node_opcua_assert_1.assert(self.value);
        return self.value.isValid();
    }
    else {
        node_opcua_assert_1.assert(!self.value);
        // in this case StatusCode shall not be Good
        node_opcua_assert_1.assert(self.statusCode !== node_opcua_status_code_1.StatusCodes.Good);
    }
    return true;
}
// OPC-UA part 4 -  $7.7
const schemaDataValue = node_opcua_factory_1.buildStructuredType({
    baseType: "BaseUAObject",
    name: "DataValue",
    fields: [
        { name: "value", fieldType: "Variant", defaultValue: null },
        { name: "statusCode", fieldType: "StatusCode", defaultValue: node_opcua_status_code_1.StatusCodes.Good },
        { name: "sourceTimestamp", fieldType: "DateTime", defaultValue: null },
        { name: "sourcePicoseconds", fieldType: "UInt16", defaultValue: 0 },
        { name: "serverTimestamp", fieldType: "DateTime", defaultValue: null },
        { name: "serverPicoseconds", fieldType: "UInt16", defaultValue: 0 }
    ]
});
class DataValue extends node_opcua_factory_1.BaseUAObject {
    /**
     *
     * @class DataValue
     * @constructor
     * @extends BaseUAObject
     * @param  options {Object}
     */
    constructor(options) {
        super();
        const schema = schemaDataValue;
        options = options || {};
        /* istanbul ignore next */
        if (node_opcua_factory_1.parameters.debugSchemaHelper) {
            node_opcua_factory_1.check_options_correctness_against_schema(this, schema, options);
        }
        if (options === null) {
            this.value = new node_opcua_variant_1.Variant({ dataType: node_opcua_variant_1.DataType.Null });
        }
        /**
         * @property value
         * @type {Variant}
         * @default  null
         */
        if (options.value === undefined || options.value === null) {
            this.value = new node_opcua_variant_1.Variant({ dataType: node_opcua_variant_1.DataType.Null });
        }
        else {
            this.value = (options.value) ? new node_opcua_variant_1.Variant(options.value) : new node_opcua_variant_1.Variant({ dataType: node_opcua_variant_1.DataType.Null });
        }
        /**
         * @property statusCode
         * @type {StatusCode}
         * @default  Good (0x00000)
         */
        this.statusCode = node_opcua_factory_1.initialize_field(schema.fields[1], options.statusCode);
        /**
         * @property sourceTimestamp
         * @type {DateTime}
         * @default  null
         */
        this.sourceTimestamp = node_opcua_factory_1.initialize_field(schema.fields[2], options.sourceTimestamp);
        /**
         * @property sourcePicoseconds
         * @type {UInt16}
         * @default  0
         */
        this.sourcePicoseconds = node_opcua_factory_1.initialize_field(schema.fields[3], options.sourcePicoseconds);
        /**
         * @property serverTimestamp
         * @type {DateTime}
         * @default  null
         */
        this.serverTimestamp = node_opcua_factory_1.initialize_field(schema.fields[4], options.serverTimestamp);
        /**
         * @property serverPicoseconds
         * @type {UInt16}
         * @default  0
         */
        this.serverPicoseconds = node_opcua_factory_1.initialize_field(schema.fields[5], options.serverPicoseconds);
    }
    encode(stream) {
        encodeDataValue(this, stream);
    }
    decode(stream) {
        decodeDataValueInternal(this, stream);
    }
    decodeDebug(stream, options) {
        decodeDebugDataValue(this, stream, options);
    }
    isValid() {
        return isValidDataValue(this);
    }
    toString() {
        function toMicroNanoPico(picoseconds) {
            return ""
                + w((picoseconds / 1000000) >> 0)
                + "."
                + w(((picoseconds % 1000000) / 1000) >> 0)
                + "."
                + w((picoseconds % 1000) >> 0);
            //    + " (" + picoseconds+ ")";
        }
        let str = "DataValue:";
        if (this.value) {
            str += "\n   value:           " + node_opcua_variant_1.Variant.prototype.toString.apply(this.value); // this.value.toString();
        }
        else {
            str += "\n   value:            <null>";
        }
        str += "\n   statusCode:      " + (this.statusCode ? this.statusCode.toString() : "null");
        str += "\n   serverTimestamp: " + (this.serverTimestamp ? this.serverTimestamp.toISOString()
            + " $ " + toMicroNanoPico(this.serverPicoseconds)
            : "null"); // + "  " + (this.serverTimestamp ? this.serverTimestamp.getTime() :"-");
        str += "\n   sourceTimestamp: " + (this.sourceTimestamp ? this.sourceTimestamp.toISOString()
            + " $ " + toMicroNanoPico(this.sourcePicoseconds)
            : "null"); // + "  " + (this.sourceTimestamp ? this.sourceTimestamp.getTime() :"-");
        return str;
    }
    clone() {
        return new DataValue({
            serverPicoseconds: this.serverPicoseconds,
            serverTimestamp: this.serverTimestamp,
            sourcePicoseconds: this.sourcePicoseconds,
            sourceTimestamp: this.sourceTimestamp,
            statusCode: this.statusCode,
            value: this.value ? this.value.clone() : undefined
        });
    }
}
exports.DataValue = DataValue;
DataValue.possibleFields = [
    "value",
    "statusCode",
    "sourceTimestamp",
    "sourcePicoseconds",
    "serverTimestamp",
    "serverPicoseconds"
];
DataValue.schema = schemaDataValue;
DataValue.prototype.schema = DataValue.schema;
node_opcua_factory_1.registerSpecialVariantEncoder(DataValue);
function w(n) {
    return ("0000" + n).substr(-3);
}
function _partial_clone(dataValue) {
    const cloneDataValue = new DataValue();
    cloneDataValue.value = dataValue.value;
    cloneDataValue.statusCode = dataValue.statusCode;
    return cloneDataValue;
}
function apply_timestamps(dataValue, timestampsToReturn, attributeId) {
    node_opcua_assert_1.assert(attributeId > 0);
    node_opcua_assert_1.assert(dataValue.hasOwnProperty("serverTimestamp"));
    node_opcua_assert_1.assert(dataValue.hasOwnProperty("sourceTimestamp"));
    let cloneDataValue = null;
    let now = null;
    // apply timestamps
    switch (timestampsToReturn) {
        case TimestampsToReturn_enum_1.TimestampsToReturn.Neither:
            cloneDataValue = cloneDataValue || _partial_clone(dataValue);
            break;
        case TimestampsToReturn_enum_1.TimestampsToReturn.Server:
            cloneDataValue = cloneDataValue || _partial_clone(dataValue);
            cloneDataValue.serverTimestamp = dataValue.serverTimestamp;
            cloneDataValue.serverPicoseconds = dataValue.serverPicoseconds;
            if (!cloneDataValue.serverTimestamp) {
                now = now || node_opcua_date_time_1.getCurrentClock();
                cloneDataValue.serverTimestamp = now.timestamp;
                cloneDataValue.serverPicoseconds = now.picoseconds;
            }
            break;
        case TimestampsToReturn_enum_1.TimestampsToReturn.Source:
            cloneDataValue = cloneDataValue || _partial_clone(dataValue);
            cloneDataValue.sourceTimestamp = dataValue.sourceTimestamp;
            cloneDataValue.sourcePicoseconds = dataValue.sourcePicoseconds;
            break;
        default:
            node_opcua_assert_1.assert(timestampsToReturn === TimestampsToReturn_enum_1.TimestampsToReturn.Both);
            cloneDataValue = cloneDataValue || _partial_clone(dataValue);
            cloneDataValue.serverTimestamp = dataValue.serverTimestamp;
            cloneDataValue.serverPicoseconds = dataValue.serverPicoseconds;
            if (!cloneDataValue.serverTimestamp) {
                now = now || node_opcua_date_time_1.getCurrentClock();
                cloneDataValue.serverTimestamp = now.timestamp;
                cloneDataValue.serverPicoseconds = now.picoseconds;
            }
            cloneDataValue.sourceTimestamp = dataValue.sourceTimestamp;
            cloneDataValue.sourcePicoseconds = dataValue.sourcePicoseconds;
            break;
    }
    // unset sourceTimestamp unless AttributeId is Value
    if (attributeId !== node_opcua_data_model_1.AttributeIds.Value) {
        cloneDataValue.sourceTimestamp = null;
    }
    return cloneDataValue;
}
exports.apply_timestamps = apply_timestamps;
function apply_timestamps2(dataValue, timestampsToReturn, attributeId) {
    node_opcua_assert_1.assert(attributeId > 0);
    node_opcua_assert_1.assert(dataValue.hasOwnProperty("serverTimestamp"));
    node_opcua_assert_1.assert(dataValue.hasOwnProperty("sourceTimestamp"));
    const cloneDataValue = new DataValue({});
    cloneDataValue.value = dataValue.value;
    cloneDataValue.statusCode = dataValue.statusCode;
    const now = node_opcua_date_time_1.getCurrentClock();
    // apply timestamps
    switch (timestampsToReturn) {
        case TimestampsToReturn_enum_1.TimestampsToReturn.Server:
            cloneDataValue.serverTimestamp = dataValue.serverTimestamp;
            cloneDataValue.serverPicoseconds = dataValue.serverPicoseconds;
            cloneDataValue.serverTimestamp = now.timestamp;
            cloneDataValue.serverPicoseconds = now.picoseconds;
            break;
        case TimestampsToReturn_enum_1.TimestampsToReturn.Source:
            cloneDataValue.sourceTimestamp = dataValue.sourceTimestamp;
            cloneDataValue.sourcePicoseconds = dataValue.sourcePicoseconds;
            break;
        case TimestampsToReturn_enum_1.TimestampsToReturn.Both:
            cloneDataValue.serverTimestamp = dataValue.serverTimestamp;
            cloneDataValue.serverPicoseconds = dataValue.serverPicoseconds;
            cloneDataValue.serverTimestamp = now.timestamp;
            cloneDataValue.serverPicoseconds = now.picoseconds;
            cloneDataValue.sourceTimestamp = dataValue.sourceTimestamp;
            cloneDataValue.sourcePicoseconds = dataValue.sourcePicoseconds;
            break;
    }
    // unset sourceTimestamp unless AttributeId is Value
    if (attributeId !== node_opcua_data_model_1.AttributeIds.Value) {
        cloneDataValue.sourceTimestamp = null;
    }
    return cloneDataValue;
}
/*
 * @method _clone_with_array_replacement
 * @param dataValue
 * @param result
 * @return {DataValue}
 * @private
 * @static
 */
function _clone_with_array_replacement(dataValue, result) {
    const statusCode = result.statusCode === node_opcua_status_code_1.StatusCodes.Good ? dataValue.statusCode : result.statusCode;
    const clonedDataValue = new DataValue({
        statusCode,
        serverTimestamp: dataValue.serverTimestamp,
        serverPicoseconds: dataValue.serverPicoseconds,
        sourceTimestamp: dataValue.sourceTimestamp,
        sourcePicoseconds: dataValue.sourcePicoseconds,
        value: {
            dataType: node_opcua_variant_1.DataType.Null
        }
    });
    clonedDataValue.value.dataType = dataValue.value.dataType;
    clonedDataValue.value.arrayType = dataValue.value.arrayType;
    clonedDataValue.value.dimensions = result.dimensions;
    clonedDataValue.value.value = result.array;
    return clonedDataValue;
}
function canRange(dataValue) {
    return dataValue.value && ((dataValue.value.arrayType !== node_opcua_variant_1.VariantArrayType.Scalar) ||
        ((dataValue.value.arrayType === node_opcua_variant_1.VariantArrayType.Scalar) && (dataValue.value.dataType === node_opcua_variant_1.DataType.ByteString))
        ||
            ((dataValue.value.arrayType === node_opcua_variant_1.VariantArrayType.Scalar) && (dataValue.value.dataType === node_opcua_variant_1.DataType.String)));
}
/**
 * return a deep copy of the dataValue by applying indexRange if necessary on  Array/Matrix
 * @param dataValue {DataValue}
 * @param indexRange {NumericalRange}
 * @return {DataValue}
 */
function extractRange(dataValue, indexRange) {
    const variant = dataValue.value;
    if (indexRange && canRange(dataValue)) {
        // let's extract an array of elements corresponding to the indexRange
        const result = indexRange.extract_values(variant.value, variant.dimensions);
        dataValue = _clone_with_array_replacement(dataValue, result);
    }
    else {
        // clone the whole data Value
        dataValue = dataValue.clone();
    }
    return dataValue;
}
exports.extractRange = extractRange;
function sameDate(date1, date2) {
    if (date1 === date2) {
        return true;
    }
    if (date1 && date2 === null) {
        return false;
    }
    if (date1 === null && date2) {
        return false;
    }
    if (date1 === null || date2 === null) {
        return false;
    }
    return date1.getTime() === date2.getTime();
}
function sourceTimestampHasChanged(dataValue1, dataValue2) {
    return !sameDate(dataValue1.sourceTimestamp, dataValue2.sourceTimestamp)
        || (dataValue1.sourcePicoseconds !== dataValue2.sourcePicoseconds);
}
exports.sourceTimestampHasChanged = sourceTimestampHasChanged;
function serverTimestampHasChanged(dataValue1, dataValue2) {
    return !sameDate(dataValue1.serverTimestamp, dataValue2.serverTimestamp)
        || (dataValue1.serverPicoseconds !== dataValue2.serverPicoseconds);
}
exports.serverTimestampHasChanged = serverTimestampHasChanged;
function timestampHasChanged(dataValue1, dataValue2, timestampsToReturn) {
    // TODO:    timestampsToReturn = timestampsToReturn || { key: "Neither"};
    if (timestampsToReturn === undefined) {
        return sourceTimestampHasChanged(dataValue1, dataValue2); // || serverTimestampHasChanged(dataValue1, dataValue2);
    }
    switch (timestampsToReturn) {
        case TimestampsToReturn_enum_1.TimestampsToReturn.Neither:
            return false;
        case TimestampsToReturn_enum_1.TimestampsToReturn.Both:
            return sourceTimestampHasChanged(dataValue1, dataValue2) ||
                serverTimestampHasChanged(dataValue1, dataValue2);
        case TimestampsToReturn_enum_1.TimestampsToReturn.Source:
            return sourceTimestampHasChanged(dataValue1, dataValue2);
        default:
            node_opcua_assert_1.assert(timestampsToReturn === TimestampsToReturn_enum_1.TimestampsToReturn.Server);
            return serverTimestampHasChanged(dataValue1, dataValue2);
    }
}
exports.timestampHasChanged = timestampHasChanged;
function sameStatusCode(statusCode1, statusCode2) {
    return statusCode1.value === statusCode2.value;
}
exports.sameStatusCode = sameStatusCode;
/**
 * @method sameDataValue
 * @param v1 {DataValue}
 * @param v2 {DataValue}
 * @param [timestampsToReturn {TimestampsToReturn}]
 * @return {boolean} true if data values are identical
 */
function sameDataValue(v1, v2, timestampsToReturn) {
    if (v1 === v2) {
        return true;
    }
    if (v1 && !v2) {
        return false;
    }
    if (v2 && !v1) {
        return false;
    }
    if (!sameStatusCode(v1.statusCode, v2.statusCode)) {
        return false;
    }
    /*
    //
    // For performance reason, sourceTimestamp is
    // used to determine if a dataValue has changed.
    // if sourceTimestamp and sourcePicoseconds are identical
    // then we make the assumption that Variant value is identical too.
    // This will prevent us to deep compare potential large arrays.
    // but before this is possible, we need to implement a mechanism
    // that ensure that date() is always strictly increasing
    if ((v1.sourceTimestamp && v2.sourceTimestamp) && !sourceTimestampHasChanged(v1, v2)) {
        return true;
    }
    */
    if (timestampHasChanged(v1, v2, timestampsToReturn)) {
        return false;
    }
    return node_opcua_variant_1.sameVariant(v1.value, v2.value);
}
exports.sameDataValue = sameDataValue;
//# sourceMappingURL=datavalue.js.map