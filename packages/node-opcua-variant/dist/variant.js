"use strict";
/**
 * @module node-opcua-variant
 */
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("underscore");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_basic_types_1 = require("node-opcua-basic-types");
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_factory_1 = require("node-opcua-factory");
const utils = require("node-opcua-utils");
const node_opcua_extension_object_1 = require("node-opcua-extension-object");
const DataType_enum_1 = require("./DataType_enum");
const VariantArrayType_enum_1 = require("./VariantArrayType_enum");
// tslint:disable:no-bitwise
const schemaVariant = node_opcua_factory_1.buildStructuredType({
    baseType: "BaseUAObject",
    fields: [{
            defaultValue: () => DataType_enum_1.DataType.Null,
            documentation: "the variant type.",
            fieldType: "DataType",
            name: "dataType",
        }, {
            defaultValue: VariantArrayType_enum_1.VariantArrayType.Scalar,
            fieldType: "VariantArrayType",
            name: "arrayType",
        }, {
            defaultValue: null,
            fieldType: "Any",
            name: "value",
        }, {
            defaultValue: null,
            documentation: "the matrix dimensions",
            fieldType: "UInt32",
            isArray: true,
            name: "dimensions",
        }],
    name: "Variant",
});
function _coerceVariant(variantLike) {
    const value = (variantLike instanceof Variant) ? variantLike : new Variant(variantLike);
    node_opcua_assert_1.assert(value instanceof Variant);
    return value;
}
class Variant extends node_opcua_factory_1.BaseUAObject {
    constructor(options) {
        super();
        options = constructHook(options);
        options = options ? options : {};
        this.dataType = DataType_enum_1.DataType.Null;
        this.arrayType = VariantArrayType_enum_1.VariantArrayType.Scalar;
        const schema = schemaVariant;
        /**
         * the variant type.
         * @property dataType
         * @type {DataType}
         * @default  0
         */
        this.setDataType(node_opcua_factory_1.initialize_field(schema.fields[0], options.dataType));
        /**
         * @property arrayType
         * @type {VariantArrayType}
         * @default  0
         */
        this.setArrayType(node_opcua_factory_1.initialize_field(schema.fields[1], options.arrayType));
        /**
         * @property value
         * @default  null
         */
        this.value = node_opcua_factory_1.initialize_field(schema.fields[2], options.value);
        /**
         * the matrix dimensions
         * @property dimensions
         * @type {UInt32[]}
         * @default  null
         */
        this.dimensions = node_opcua_factory_1.initialize_field_array(schema.fields[3], options.dimensions);
        if (options.dataType === DataType_enum_1.DataType.ExtensionObject) {
            if (this.arrayType === VariantArrayType_enum_1.VariantArrayType.Scalar) {
                /* istanbul ignore next */
                if (this.value && !(this.value instanceof node_opcua_extension_object_1.ExtensionObject)) {
                    throw new Error("A variant with DataType.ExtensionObject must have a ExtensionObject value");
                }
            }
            else {
                for (const e of this.value) {
                    /* istanbul ignore next */
                    if (e && !(e instanceof node_opcua_extension_object_1.ExtensionObject)) {
                        throw new Error("A variant with DataType.ExtensionObject must have a ExtensionObject value");
                    }
                }
            }
        }
    }
    // Define Enumeration setters
    setDataType(value) {
        const coercedValue = DataType_enum_1._enumerationDataType.get(value);
        /* istanbul ignore next */
        if (coercedValue === undefined || coercedValue === null) {
            throw new Error("value cannot be coerced to DataType: " + value);
        }
        this.dataType = coercedValue.value;
    }
    setArrayType(value) {
        const coercedValue = VariantArrayType_enum_1._enumerationVariantArrayType.get(value);
        /* istanbul ignore next */
        if (coercedValue === undefined || coercedValue === null) {
            throw new Error("value cannot be coerced to VariantArrayType: " + value);
        }
        this.arrayType = coercedValue.value;
    }
    encode(stream) {
        encodeVariant(this, stream);
    }
    decode(stream) {
        internalDecodeVariant(this, stream);
    }
    decodeDebug(stream, options) {
        decodeDebugVariant(this, stream, options);
    }
    toString() {
        return variantToString(this);
    }
    isValid() {
        return isValidVariant(this.arrayType, this.dataType, this.value, this.dimensions);
    }
    clone() {
        return new Variant(this);
    }
}
exports.Variant = Variant;
Variant.schema = schemaVariant;
Variant.coerce = _coerceVariant;
Variant.prototype.schema = schemaVariant;
function variantToString(self, options) {
    function toString(value) {
        switch (self.dataType) {
            case DataType_enum_1.DataType.ByteString:
                return value ? "0x" + value.toString("hex") : "<null>";
            case DataType_enum_1.DataType.Boolean:
                return value.toString();
            case DataType_enum_1.DataType.DateTime:
                return value ? (value.toISOString ? value.toISOString() : value.toString()) : "<null>";
            default:
                return value ? value.toString(options) : "0";
        }
    }
    function f(value) {
        if (value === undefined || (value === null && typeof value === "object")) {
            return "<null>";
        }
        return toString(value);
    }
    let data = VariantArrayType_enum_1.VariantArrayType[self.arrayType];
    if (self.dimensions && self.dimensions.length > 0) {
        data += "[ " + self.dimensions.join(",") + " ]";
    }
    data += "<" + DataType_enum_1.DataType[self.dataType] + ">";
    if (self.arrayType === VariantArrayType_enum_1.VariantArrayType.Scalar) {
        data += ", value: " + f(self.value);
    }
    else if ((self.arrayType === VariantArrayType_enum_1.VariantArrayType.Array) || (self.arrayType === VariantArrayType_enum_1.VariantArrayType.Matrix)) {
        if (!self.value) {
            data += ", null";
        }
        else {
            const a = [];
            node_opcua_assert_1.assert(_.isArray(self.value) || (self.value.buffer instanceof ArrayBuffer));
            for (let i = 0; i < Math.min(10, self.value.length); i++) {
                a[i] = self.value[i];
            }
            if (self.value.length > 10) {
                a.push("...");
            }
            data += ", l= " + self.value.length + ", value=[" + a.map(f).join(",") + "]";
        }
    }
    return "Variant(" + data + ")";
}
/***
 * @private
 */
exports.VARIANT_ARRAY_MASK = 0x80;
/***
 * @private
 */
exports.VARIANT_ARRAY_DIMENSIONS_MASK = 0x40;
/***
 * @private
 */
exports.VARIANT_TYPE_MASK = 0x3f;
/***
 * @private
 */
function encodeVariant(variant, stream) {
    let encodingByte = variant.dataType;
    if (variant.arrayType === VariantArrayType_enum_1.VariantArrayType.Array || variant.arrayType === VariantArrayType_enum_1.VariantArrayType.Matrix) {
        encodingByte |= exports.VARIANT_ARRAY_MASK;
    }
    if (variant.dimensions) {
        node_opcua_assert_1.assert(variant.arrayType === VariantArrayType_enum_1.VariantArrayType.Matrix);
        node_opcua_assert_1.assert(variant.dimensions.length >= 1);
        encodingByte |= exports.VARIANT_ARRAY_DIMENSIONS_MASK;
    }
    node_opcua_basic_types_1.encodeUInt8(encodingByte, stream);
    if (variant.arrayType === VariantArrayType_enum_1.VariantArrayType.Array || variant.arrayType === VariantArrayType_enum_1.VariantArrayType.Matrix) {
        encodeVariantArray(variant.dataType, stream, variant.value);
    }
    else {
        const encode = get_encoder(variant.dataType);
        encode(variant.value, stream);
    }
    if ((encodingByte & exports.VARIANT_ARRAY_DIMENSIONS_MASK) === exports.VARIANT_ARRAY_DIMENSIONS_MASK && variant.dimensions) {
        encodeDimension(variant.dimensions, stream);
    }
}
exports.encodeVariant = encodeVariant;
/***
 * @private
 */
function decodeDebugVariant(self, stream, options) {
    const tracer = options.tracer;
    const encodingByte = node_opcua_basic_types_1.decodeUInt8(stream);
    const isArray = ((encodingByte & exports.VARIANT_ARRAY_MASK) === exports.VARIANT_ARRAY_MASK);
    const hasDimension = ((encodingByte & exports.VARIANT_ARRAY_DIMENSIONS_MASK) === exports.VARIANT_ARRAY_DIMENSIONS_MASK);
    self.dataType = (encodingByte & exports.VARIANT_TYPE_MASK);
    tracer.dump("dataType:  ", self.dataType);
    tracer.dump("isArray:   ", isArray ? "true" : "false");
    tracer.dump("dimension: ", hasDimension);
    const decode = node_opcua_factory_1.findBuiltInType(DataType_enum_1.DataType[self.dataType]).decode;
    /* istanbul ignore next */
    if (!decode) {
        throw new Error("Variant.decode : cannot find decoder for type " + DataType_enum_1.DataType[self.dataType]);
    }
    const cursorBefore = stream.length;
    if (isArray) {
        self.arrayType = hasDimension ? VariantArrayType_enum_1.VariantArrayType.Matrix : VariantArrayType_enum_1.VariantArrayType.Array;
        _decodeVariantArrayDebug(stream, decode, tracer, self.dataType);
    }
    else {
        self.arrayType = VariantArrayType_enum_1.VariantArrayType.Scalar;
        self.value = decode(stream);
        tracer.trace("member", "Variant", self.value, cursorBefore, stream.length, DataType_enum_1.DataType[self.dataType]);
    }
    // ArrayDimensions
    // Int32[]
    //  The length of each dimension.
    //    This field is only present if the array dimensions flag is set in the encoding mask.
    //    The lower rank dimensions appear first in the array.
    //    All dimensions shall be specified and shall be greater than zero.
    //    If ArrayDimensions are inconsistent with the ArrayLength then the decoder shall
    //   stop and raise a BadDecodingError.
    if (hasDimension) {
        self.dimensions = decodeDimension(stream);
        const verification = calculate_product(self.dimensions);
    }
}
function internalDecodeVariant(self, stream) {
    const encodingByte = node_opcua_basic_types_1.decodeUInt8(stream);
    const isArray = ((encodingByte & exports.VARIANT_ARRAY_MASK) === exports.VARIANT_ARRAY_MASK);
    const hasDimension = ((encodingByte & exports.VARIANT_ARRAY_DIMENSIONS_MASK) === exports.VARIANT_ARRAY_DIMENSIONS_MASK);
    self.dataType = (encodingByte & exports.VARIANT_TYPE_MASK);
    if (isArray) {
        self.arrayType = hasDimension ? VariantArrayType_enum_1.VariantArrayType.Matrix : VariantArrayType_enum_1.VariantArrayType.Array;
        self.value = decodeVariantArray(self.dataType, stream);
    }
    else {
        self.arrayType = VariantArrayType_enum_1.VariantArrayType.Scalar;
        const decode = get_decoder(self.dataType);
        self.value = decode(stream);
    }
    if (hasDimension) {
        self.dimensions = decodeDimension(stream);
        const verification = calculate_product(self.dimensions);
        /* istanbul ignore next */
        if (verification !== self.value.length) {
            throw new Error("BadDecodingError");
        }
    }
}
/***
 * @private
 */
function decodeVariant(stream) {
    const value = new Variant({});
    value.decode(stream);
    return value;
}
exports.decodeVariant = decodeVariant;
function constructHook(options) {
    options = options || {};
    let isArrayTypeUnspecified = (options.arrayType === undefined);
    if (options.constructor.name === "Variant") {
        const opts = {
            arrayType: options.arrayType,
            dataType: options.dataType,
            dimensions: options.dimensions,
            value: options.value,
        };
        if (opts.dataType === DataType_enum_1.DataType.ExtensionObject) {
            if (opts.arrayType === VariantArrayType_enum_1.VariantArrayType.Scalar) {
                if (opts.value && opts.value.constructor) {
                    opts.value = new opts.value.constructor(opts.value);
                }
            }
            else {
                opts.value = opts.value.map((e) => {
                    if (e && e.constructor) {
                        return new e.constructor(e);
                    }
                    return null;
                });
            }
        }
        else if (opts.arrayType !== VariantArrayType_enum_1.VariantArrayType.Scalar) {
            opts.value = coerceVariantArray(options.dataType, options.value);
        }
        return opts;
    }
    node_opcua_assert_1.assert(options);
    options.dataType = options.dataType || DataType_enum_1.DataType.Null;
    // dataType could be a string
    if (typeof options.dataType === "string") {
        const d = node_opcua_factory_1.findBuiltInType(options.dataType);
        /* istanbul ignore next */
        if (!d) {
            throw new Error("Cannot find data type buildIn");
        }
        const t = DataType_enum_1._enumerationDataType.get(d.name);
        /* istanbul ignore next */
        if (t === null) {
            throw new Error("DataType: invalid " + options.dataType);
        }
        options.dataType = t.value;
    }
    // array type could be a string
    if (typeof options.arrayType === "string") {
        const at = VariantArrayType_enum_1.VariantArrayType[options.arrayType];
        /* istanbul ignore next */
        if (utils.isNullOrUndefined(at)) {
            throw new Error("ArrayType: invalid " + options.arrayType);
        }
        options.arrayType = at;
    }
    if (isArrayTypeUnspecified && _.isArray(options.value)) {
        // when using UInt64 ou Int64 arrayType must be specified , as automatic detection cannot be made
        /* istanbul ignore next */
        if ((options.dataType === DataType_enum_1.DataType.UInt64 || options.dataType === DataType_enum_1.DataType.Int64)) {
            // we do nothing here ....
            throw new Error("Variant#constructor : when using UInt64 ou Int64" +
                " arrayType must be specified , as automatic detection cannot be made");
        }
        else {
            options.arrayType = VariantArrayType_enum_1.VariantArrayType.Array;
            isArrayTypeUnspecified = false;
        }
    }
    if (options.arrayType !== VariantArrayType_enum_1.VariantArrayType.Scalar && !isArrayTypeUnspecified) {
        node_opcua_assert_1.assert(options.arrayType === VariantArrayType_enum_1.VariantArrayType.Array || options.arrayType === VariantArrayType_enum_1.VariantArrayType.Matrix);
        /* istanbul ignore else */
        if (options.arrayType === VariantArrayType_enum_1.VariantArrayType.Array) {
            options.value = options.value || [];
            const value1 = coerceVariantArray(options.dataType, options.value);
            node_opcua_assert_1.assert(value1 !== options.value);
            options.value = value1;
        }
        else {
            node_opcua_assert_1.assert(options.arrayType === VariantArrayType_enum_1.VariantArrayType.Matrix);
            options.value = options.value || [];
            options.value = coerceVariantArray(options.dataType, options.value);
            /* istanbul ignore next */
            if (!options.dimensions) {
                throw new Error("Matrix Variant : missing dimensions");
            }
            /* istanbul ignore next */
            if (options.value.length !== calculate_product(options.dimensions)) {
                throw new Error("Matrix Variant : invalid value size");
            }
        }
    }
    else {
        node_opcua_assert_1.assert(options.arrayType === VariantArrayType_enum_1.VariantArrayType.Scalar || options.arrayType === undefined);
        options.arrayType = VariantArrayType_enum_1.VariantArrayType.Scalar;
        const tmp = options.value;
        // scalar
        options.value = coerceVariantType(options.dataType, options.value);
        /* istanbul ignore next */
        if (!isValidVariant(options.arrayType, options.dataType, options.value, null)) {
            throw new Error("Invalid variant arrayType: " + options.arrayType.toString() +
                "  dataType: " + options.dataType.toString() + " value:" + options.value);
        }
    }
    if (options.dimensions) {
        node_opcua_assert_1.assert(options.arrayType === VariantArrayType_enum_1.VariantArrayType.Matrix, "dimension can only provided if variant is a matrix");
    }
    return options;
}
function calculate_product(array) {
    /* istanbul ignore next */
    if (!array) {
        return 0;
    }
    return array.reduce((n, p) => n * p, 1);
}
function get_encoder(dataType) {
    const dataTypeAsString = DataType_enum_1.DataType[dataType];
    const encode = node_opcua_factory_1.findBuiltInType(dataTypeAsString).encode;
    /* istanbul ignore next */
    if (!encode) {
        throw new Error("Cannot find encode function for dataType " + dataTypeAsString);
    }
    return encode;
}
function get_decoder(dataType) {
    const dataTypeAsString = DataType_enum_1.DataType[dataType];
    const decode = node_opcua_factory_1.findBuiltInType(dataTypeAsString).decode;
    /* istanbul ignore next */
    if (!decode) {
        throw new Error("Variant.decode : cannot find decoder for type " + dataTypeAsString);
    }
    return decode;
}
const displayWarning = true;
function convertTo(dataType, arrayTypeConstructor, value) {
    if (arrayTypeConstructor && value instanceof arrayTypeConstructor) {
        const newArray = new value.constructor(value.length); // deep copy
        /* istanbul ignore if */
        if (newArray instanceof Buffer) {
            // required for nodejs 4.x
            value.copy(newArray);
        }
        else {
            newArray.set(value);
        }
        return newArray;
    }
    const coerceFunc = coerceVariantType.bind(null, dataType);
    const n = value.length;
    const newArr = arrayTypeConstructor ? new arrayTypeConstructor(n) : new Array(n);
    for (let i = 0; i < n; i++) {
        newArr[i] = coerceFunc(value[i]);
    }
    // istanbul ignore next
    if (arrayTypeConstructor && displayWarning && n > 10) {
        // tslint:disable-next-line:no-console
        console.log("Warning ! an array containing  " + DataType_enum_1.DataType[dataType] +
            " elements has been provided as a generic array. ");
        // tslint:disable-next-line:no-console
        console.log("          This is inefficient as every array value will " +
            "have to be coerced and verified against the expected type");
        // tslint:disable-next-line:no-console
        console.log("          It is highly recommended that you use a " +
            " typed array ", arrayTypeConstructor.constructor.name, " instead");
    }
    return newArr;
}
const typedArrayHelpers = {};
function _getHelper(dataType) {
    return typedArrayHelpers[DataType_enum_1.DataType[dataType]];
}
function coerceVariantArray(dataType, value) {
    const helper = _getHelper(dataType);
    if (helper) {
        return helper.coerce(value);
    }
    else {
        return convertTo(dataType, null, value);
    }
}
function encodeTypedArray(arrayTypeConstructor, stream, value) {
    node_opcua_assert_1.assert(value instanceof arrayTypeConstructor);
    node_opcua_assert_1.assert(value.buffer instanceof ArrayBuffer);
    node_opcua_basic_types_1.encodeUInt32(value.length, stream);
    stream.writeArrayBuffer(value.buffer, value.byteOffset, value.byteLength);
}
function encodeGeneralArray(dataType, stream, value) {
    const arr = value || [];
    node_opcua_assert_1.assert(arr instanceof Array);
    node_opcua_assert_1.assert(_.isFinite(arr.length));
    node_opcua_basic_types_1.encodeUInt32(arr.length, stream);
    const encode = get_encoder(dataType);
    let i;
    const n = arr.length;
    for (i = 0; i < n; i++) {
        encode(arr[i], stream);
    }
}
function encodeVariantArray(dataType, stream, value) {
    if (value.buffer) {
        try {
            return _getHelper(dataType).encode(stream, value);
        }
        catch (err) {
            /* istanbul ignore next */
            // tslint:disable-next-line:no-console
            console.log("encodeVariantArray error : DATATYPE", dataType, "\nvalue", value.length);
        }
    }
    return encodeGeneralArray(dataType, stream, value);
}
function decodeTypedArray(arrayTypeConstructor, stream) {
    const length = node_opcua_basic_types_1.decodeUInt32(stream);
    /* istanbul ignore next */
    if (length === 0xFFFFFFFF) {
        return null;
    }
    const byteLength = length * arrayTypeConstructor.BYTES_PER_ELEMENT;
    const arr = stream.readArrayBuffer(byteLength);
    const value = new arrayTypeConstructor(arr.buffer);
    node_opcua_assert_1.assert(value.length === length);
    return value;
}
function decodeGeneralArray(dataType, stream) {
    const length = node_opcua_basic_types_1.decodeUInt32(stream);
    /* istanbul ignore next */
    if (length === 0xFFFFFFFF) {
        return null;
    }
    const decode = get_decoder(dataType);
    const arr = [];
    for (let i = 0; i < length; i++) {
        arr.push(decode(stream));
    }
    return arr;
}
function decodeVariantArray(dataType, stream) {
    const helper = _getHelper(dataType);
    if (helper) {
        return helper.decode(stream);
    }
    else {
        return decodeGeneralArray(dataType, stream);
    }
}
function _declareTypeArrayHelper(dataType, typedArrayConstructor) {
    typedArrayHelpers[DataType_enum_1.DataType[dataType]] = {
        coerce: convertTo.bind(null, dataType, typedArrayConstructor),
        decode: decodeTypedArray.bind(null, typedArrayConstructor),
        encode: encodeTypedArray.bind(null, typedArrayConstructor),
    };
}
_declareTypeArrayHelper(DataType_enum_1.DataType.Float, Float32Array);
_declareTypeArrayHelper(DataType_enum_1.DataType.Double, Float64Array);
_declareTypeArrayHelper(DataType_enum_1.DataType.SByte, Int8Array);
_declareTypeArrayHelper(DataType_enum_1.DataType.Byte, Uint8Array);
_declareTypeArrayHelper(DataType_enum_1.DataType.Int16, Int16Array);
_declareTypeArrayHelper(DataType_enum_1.DataType.Int32, Int32Array);
_declareTypeArrayHelper(DataType_enum_1.DataType.UInt16, Uint16Array);
_declareTypeArrayHelper(DataType_enum_1.DataType.UInt32, Uint32Array);
function _decodeVariantArrayDebug(stream, decode, tracer, dataType) {
    let cursorBefore = stream.length;
    const length = node_opcua_basic_types_1.decodeUInt32(stream);
    let i;
    let element;
    tracer.trace("start_array", "Variant", length, cursorBefore, stream.length);
    const n1 = Math.min(10, length);
    // display a maximum of 10 elements
    for (i = 0; i < n1; i++) {
        tracer.trace("start_element", "", i);
        cursorBefore = stream.length;
        element = decode(stream);
        // arr.push(element);
        tracer.trace("member", "Variant", element, cursorBefore, stream.length, DataType_enum_1.DataType[dataType]);
        tracer.trace("end_element", "", i);
    }
    // keep reading
    if (length >= n1) {
        for (i = n1; i < length; i++) {
            decode(stream);
        }
        tracer.trace("start_element", "", n1);
        tracer.trace("member", "Variant", "...", cursorBefore, stream.length, DataType_enum_1.DataType[dataType]);
        tracer.trace("end_element", "", n1);
    }
    tracer.trace("end_array", "Variant", stream.length);
}
function decodeDimension(stream) {
    return decodeGeneralArray(DataType_enum_1.DataType.UInt32, stream);
}
function encodeDimension(dimensions, stream) {
    return encodeGeneralArray(DataType_enum_1.DataType.UInt32, stream, dimensions);
}
function isEnumerationItem(value) {
    return (value instanceof Object && (value.hasOwnProperty("value")) && value.hasOwnProperty("key"));
}
function coerceVariantType(dataType, value) {
    /* eslint max-statements: ["error",1000], complexity: ["error",1000]*/
    if (value === undefined) {
        value = null;
    }
    if (isEnumerationItem(value)) {
        // OPCUA Specification 1.0.3 5.8.2 encoding rules for various dataType:
        // [...]Enumeration are always encoded as Int32 on the wire [...]
        /* istanbul ignore next */
        if (dataType !== DataType_enum_1.DataType.Int32) {
            throw new Error("expecting DataType.Int32 for enumeration values ;" +
                " got DataType." + dataType.toString() + " instead");
        }
    }
    switch (dataType) {
        case DataType_enum_1.DataType.Null:
            value = null;
            break;
        case DataType_enum_1.DataType.LocalizedText:
            if (!value || !value.schema || value.schema !== node_opcua_data_model_1.LocalizedText.schema) {
                value = new node_opcua_data_model_1.LocalizedText(value);
            }
            break;
        case DataType_enum_1.DataType.QualifiedName:
            if (!value || !value.schema || value.schema !== node_opcua_data_model_1.QualifiedName.schema) {
                value = new node_opcua_data_model_1.QualifiedName(value);
            }
            break;
        case DataType_enum_1.DataType.Int16:
        case DataType_enum_1.DataType.UInt16:
        case DataType_enum_1.DataType.Int32:
        case DataType_enum_1.DataType.UInt32:
            node_opcua_assert_1.assert(value !== undefined);
            if (isEnumerationItem(value)) {
                // value is a enumeration of some sort
                value = value.value;
            }
            else {
                value = parseInt(value, 10);
            }
            /* istanbul ignore next */
            if (!_.isFinite(value)) {
                // xx console.log("xxx ", value, ttt);
                throw new Error("expecting a number " + value);
            }
            break;
        case DataType_enum_1.DataType.UInt64:
            value = node_opcua_basic_types_1.coerceUInt64(value);
            break;
        case DataType_enum_1.DataType.Int64:
            value = node_opcua_basic_types_1.coerceInt64(value);
            break;
        case DataType_enum_1.DataType.ExtensionObject:
            break;
        case DataType_enum_1.DataType.DateTime:
            node_opcua_assert_1.assert(value === null || value instanceof Date);
            break;
        case DataType_enum_1.DataType.String:
            node_opcua_assert_1.assert(typeof value === "string" || value === null);
            break;
        case DataType_enum_1.DataType.ByteString:
            value = (typeof value === "string") ? Buffer.from(value) : value;
            // istanbul ignore next
            if (!(value === null || value instanceof Buffer)) {
                throw new Error("ByteString should be null or a Buffer");
            }
            node_opcua_assert_1.assert(value === null || value instanceof Buffer);
            break;
        default:
            node_opcua_assert_1.assert(dataType !== undefined && dataType !== null, "Invalid DataType");
            break;
        case DataType_enum_1.DataType.NodeId:
            break;
    }
    return value;
}
exports.coerceVariantType = coerceVariantType;
function isValidScalarVariant(dataType, value) {
    node_opcua_assert_1.assert(value === null
        || DataType_enum_1.DataType.Int64 === dataType
        || DataType_enum_1.DataType.ByteString === dataType
        || DataType_enum_1.DataType.UInt64 === dataType
        || !(value instanceof Array));
    node_opcua_assert_1.assert(value === null || !(value instanceof Int32Array));
    node_opcua_assert_1.assert(value === null || !(value instanceof Uint32Array));
    switch (dataType) {
        case DataType_enum_1.DataType.NodeId:
            return node_opcua_basic_types_1.isValidNodeId(value);
        case DataType_enum_1.DataType.String:
            return typeof value === "string" || utils.isNullOrUndefined(value);
        case DataType_enum_1.DataType.Int64:
            return node_opcua_basic_types_1.isValidInt64(value);
        case DataType_enum_1.DataType.UInt64:
            return node_opcua_basic_types_1.isValidUInt64(value);
        case DataType_enum_1.DataType.UInt32:
            return node_opcua_basic_types_1.isValidUInt32(value);
        case DataType_enum_1.DataType.Int32:
            return node_opcua_basic_types_1.isValidInt32(value);
        case DataType_enum_1.DataType.UInt16:
            return node_opcua_basic_types_1.isValidUInt16(value);
        case DataType_enum_1.DataType.Int16:
            return node_opcua_basic_types_1.isValidInt16(value);
        case DataType_enum_1.DataType.Byte:
            return node_opcua_basic_types_1.isValidUInt8(value);
        case DataType_enum_1.DataType.SByte:
            return node_opcua_basic_types_1.isValidInt8(value);
        case DataType_enum_1.DataType.Boolean:
            return node_opcua_basic_types_1.isValidBoolean(value);
        case DataType_enum_1.DataType.ByteString:
            return node_opcua_basic_types_1.isValidByteString(value);
        default:
            return true;
    }
}
function isValidArrayVariant(dataType, value) {
    if (dataType === DataType_enum_1.DataType.Float && value instanceof Float32Array) {
        return true;
    }
    else if (dataType === DataType_enum_1.DataType.Double && value instanceof Float64Array) {
        return true;
    }
    else if (dataType === DataType_enum_1.DataType.SByte && (value instanceof Int8Array)) {
        return true;
    }
    else if (dataType === DataType_enum_1.DataType.Byte && (value instanceof Buffer || value instanceof Uint8Array)) {
        return true;
    }
    else if (dataType === DataType_enum_1.DataType.Int16 && value instanceof Int16Array) {
        return true;
    }
    else if (dataType === DataType_enum_1.DataType.Int32 && value instanceof Int32Array) {
        return true;
    }
    else if (dataType === DataType_enum_1.DataType.UInt16 && value instanceof Uint16Array) {
        return true;
    }
    else if (dataType === DataType_enum_1.DataType.UInt32 && value instanceof Uint32Array) {
        return true;
    }
    // array values can be store in Buffer, Float32Array
    node_opcua_assert_1.assert(_.isArray(value));
    for (const valueItem of value) {
        if (!isValidScalarVariant(dataType, valueItem)) {
            return false;
        }
    }
    return true;
}
/*istanbul ignore next*/
function isValidMatrixVariant(dataType, value, dimensions) {
    if (!dimensions) {
        return false;
    }
    if (!isValidArrayVariant(dataType, value)) {
        return false;
    }
    return true;
}
function isValidVariant(arrayType, dataType, value, dimensions) {
    switch (arrayType) {
        case VariantArrayType_enum_1.VariantArrayType.Scalar:
            return isValidScalarVariant(dataType, value);
        case VariantArrayType_enum_1.VariantArrayType.Array:
            return isValidArrayVariant(dataType, value);
        default:
            node_opcua_assert_1.assert(arrayType === VariantArrayType_enum_1.VariantArrayType.Matrix);
            return isValidMatrixVariant(dataType, value, dimensions);
    }
}
exports.isValidVariant = isValidVariant;
function buildVariantArray(dataType, nbElements, defaultValue) {
    let value;
    switch (dataType) {
        case DataType_enum_1.DataType.Float:
            value = new Float32Array(nbElements);
            break;
        case DataType_enum_1.DataType.Double:
            value = new Float64Array(nbElements);
            break;
        case DataType_enum_1.DataType.UInt32:
            value = new Uint32Array(nbElements);
            break;
        case DataType_enum_1.DataType.Int32:
            value = new Int32Array(nbElements);
            break;
        case DataType_enum_1.DataType.UInt16:
            value = new Uint16Array(nbElements);
            break;
        case DataType_enum_1.DataType.Int16:
            value = new Int16Array(nbElements);
            break;
        case DataType_enum_1.DataType.Byte:
            value = new Uint8Array(nbElements);
            break;
        case DataType_enum_1.DataType.SByte:
            value = new Int8Array(nbElements);
            break;
        default:
            value = new Array(nbElements);
    }
    if (defaultValue !== undefined) {
        for (let i = 0; i < nbElements; i++) {
            value[i] = defaultValue;
        }
    }
    return value;
}
exports.buildVariantArray = buildVariantArray;
// old version of nodejs do not provide a Buffer#equals test
const oldNodeVersion = (process.versions.node && process.versions.node.substring(0, 1) === "0");
function __check_same_array(arr1, arr2) {
    if (!arr1 || !arr2) {
        return !arr1 && !arr2;
    }
    if (arr1.length !== arr2.length) {
        return false;
    }
    if (arr1.length === 0 && 0 === arr2.length) {
        return true;
    }
    if (!oldNodeVersion && arr1.buffer) {
        // v1 and v2 are TypedArray (such as Int32Array...)
        // this is the most efficient way to compare 2 buffers but it doesn't work with node <= 0.12
        node_opcua_assert_1.assert(arr2.buffer);
        // compare byte by byte
        const b1 = Buffer.from(arr1.buffer, arr1.byteOffset, arr1.byteLength);
        const b2 = Buffer.from(arr2.buffer, arr2.byteOffset, arr2.byteLength);
        return b1.equals(b2);
    }
    const n = arr1.length;
    for (let i = 0; i < n; i++) {
        if (!_.isEqual(arr1[i], arr2[i])) {
            return false;
        }
    }
    return true;
}
/***
 *  returns true if the two variant represent the same value
 * @param v1 the first variant to compare
 * @param v2  the variant to compare with
 */
function sameVariant(v1, v2) {
    if (v1 === v2) {
        return true;
    }
    if ((!v1 && v2) || (v1 && !v2)) {
        return false;
    }
    if (v1.arrayType !== v2.arrayType) {
        return false;
    }
    if (v1.dataType !== v2.dataType) {
        return false;
    }
    if (v1.value === v2.value) {
        return true;
    }
    if (v1.arrayType === VariantArrayType_enum_1.VariantArrayType.Scalar) {
        if (Array.isArray(v1.value) && Array.isArray(v2.value)) {
            return __check_same_array(v1.value, v2.value);
        }
        if (Buffer.isBuffer(v1.value) && Buffer.isBuffer(v2.value)) {
            return v1.value.equals(v2.value);
        }
    }
    if (v1.arrayType === VariantArrayType_enum_1.VariantArrayType.Array) {
        return __check_same_array(v1.value, v2.value);
    }
    else if (v1.arrayType === VariantArrayType_enum_1.VariantArrayType.Matrix) {
        if (!__check_same_array(v1.dimensions, v2.dimensions)) {
            return false;
        }
        return __check_same_array(v1.value, v2.value);
    }
    return false;
}
exports.sameVariant = sameVariant;
// ---------------------------------------------------------------------------------------------------------
node_opcua_factory_1.registerSpecialVariantEncoder(Variant);
//# sourceMappingURL=variant.js.map