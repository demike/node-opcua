"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-data-model
 */
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_factory_1 = require("node-opcua-factory");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const node_opcua_basic_types_1 = require("node-opcua-basic-types");
const node_opcua_factory_2 = require("node-opcua-factory");
// --------------------------------------------------------------------------------------------
exports.schemaDiagnosticInfo = node_opcua_factory_1.buildStructuredType({
    name: "DiagnosticInfo",
    baseType: "BaseUAObject",
    fields: [
        {
            name: "namespaceUri",
            fieldType: "Int32",
            defaultValue: -1,
            documentation: "The symbolicId is defined within the context of a namespace."
        },
        {
            name: "symbolicId",
            fieldType: "Int32",
            defaultValue: -1,
            documentation: "The symbolicId shall be used to identify a vendor-specific error or condition"
        },
        {
            name: "locale",
            fieldType: "Int32",
            defaultValue: -1,
            documentation: "The locale part of the vendor-specific localized text describing the symbolic id."
        },
        { name: "localizedText", fieldType: "Int32", defaultValue: -1 },
        {
            name: "additionalInfo",
            fieldType: "String",
            defaultValue: null,
            documentation: "Vendor-specific diagnostic information."
        },
        {
            name: "innerStatusCode",
            fieldType: "StatusCode",
            defaultValue: node_opcua_status_code_1.StatusCodes.Good,
            documentation: "The StatusCode from the inner operation."
        },
        {
            name: "innerDiagnosticInfo",
            fieldType: "DiagnosticInfo",
            defaultValue: null,
            documentation: "The diagnostic info associated with the inner StatusCode."
        }
    ]
});
class DiagnosticInfo extends node_opcua_factory_1.BaseUAObject {
    /**
     *
     * @class DiagnosticInfo
     * @constructor
     * @extends BaseUAObject
     * @param  options {Object}
     */
    constructor(options) {
        options = options || {};
        super();
        const schema = exports.schemaDiagnosticInfo;
        /* istanbul ignore next */
        if (node_opcua_factory_1.parameters.debugSchemaHelper) {
            node_opcua_factory_2.check_options_correctness_against_schema(this, schema, options);
        }
        this.symbolicId = node_opcua_factory_2.initialize_field(schema.fields[0], options.symbolicId);
        this.namespaceURI = node_opcua_factory_2.initialize_field(schema.fields[1], options.namespaceURI);
        this.locale = node_opcua_factory_2.initialize_field(schema.fields[2], options.locale);
        this.localizedText = node_opcua_factory_2.initialize_field(schema.fields[3], options.localizedText);
        this.additionalInfo = node_opcua_factory_2.initialize_field(schema.fields[4], options.additionalInfo);
        this.innerStatusCode = node_opcua_factory_2.initialize_field(schema.fields[5], options.innerStatusCode);
        this.innerDiagnosticInfo = node_opcua_factory_2.initialize_field(schema.fields[6], options.innerDiagnosticInfo);
    }
    encode(stream) {
        encode_DiagnosticInfo(this, stream);
    }
    decode(stream) {
        decode_DiagnosticInfo(this, stream);
    }
    decodeDebug(stream, options) {
        decodeDebug_DiagnosticInfo(this, stream, options);
    }
}
exports.DiagnosticInfo = DiagnosticInfo;
DiagnosticInfo.schema = exports.schemaDiagnosticInfo;
DiagnosticInfo.possibleFields = [
    "symbolicId", "namespaceURI", "locale", "localizedText",
    "additionalInfo", "innerStatusCode", "innerDiagnosticInfo"
];
DiagnosticInfo.prototype.schema = DiagnosticInfo.schema;
DiagnosticInfo.schema.fields[6].schema = DiagnosticInfo.schema;
var DiagnosticInfo_EncodingByte;
(function (DiagnosticInfo_EncodingByte) {
    DiagnosticInfo_EncodingByte[DiagnosticInfo_EncodingByte["SymbolicId"] = 1] = "SymbolicId";
    DiagnosticInfo_EncodingByte[DiagnosticInfo_EncodingByte["NamespaceURI"] = 2] = "NamespaceURI";
    DiagnosticInfo_EncodingByte[DiagnosticInfo_EncodingByte["LocalizedText"] = 4] = "LocalizedText";
    DiagnosticInfo_EncodingByte[DiagnosticInfo_EncodingByte["Locale"] = 8] = "Locale";
    DiagnosticInfo_EncodingByte[DiagnosticInfo_EncodingByte["AdditionalInfo"] = 16] = "AdditionalInfo";
    DiagnosticInfo_EncodingByte[DiagnosticInfo_EncodingByte["InnerStatusCode"] = 32] = "InnerStatusCode";
    DiagnosticInfo_EncodingByte[DiagnosticInfo_EncodingByte["InnerDiagnosticInfo"] = 64] = "InnerDiagnosticInfo";
})(DiagnosticInfo_EncodingByte = exports.DiagnosticInfo_EncodingByte || (exports.DiagnosticInfo_EncodingByte = {}));
// tslint:disable:no-bitwise
function getDiagnosticInfoEncodingByte(diagnosticInfo) {
    node_opcua_assert_1.assert(diagnosticInfo);
    let encodingMask = 0;
    if (diagnosticInfo.symbolicId >= 0) {
        encodingMask |= DiagnosticInfo_EncodingByte.SymbolicId;
    }
    if (diagnosticInfo.namespaceURI >= 0) {
        encodingMask |= DiagnosticInfo_EncodingByte.NamespaceURI;
    }
    if (diagnosticInfo.localizedText >= 0) {
        encodingMask |= DiagnosticInfo_EncodingByte.LocalizedText;
    }
    if (diagnosticInfo.locale >= 0) {
        encodingMask |= DiagnosticInfo_EncodingByte.Locale;
    }
    if (diagnosticInfo.additionalInfo) {
        encodingMask |= DiagnosticInfo_EncodingByte.AdditionalInfo;
    }
    if (diagnosticInfo.innerStatusCode && diagnosticInfo.innerStatusCode !== node_opcua_status_code_1.StatusCodes.Good) {
        encodingMask |= DiagnosticInfo_EncodingByte.InnerStatusCode;
    }
    if (diagnosticInfo.innerDiagnosticInfo) {
        encodingMask |= DiagnosticInfo_EncodingByte.InnerDiagnosticInfo;
    }
    return encodingMask;
}
function encode_DiagnosticInfo(diagnosticInfo, stream) {
    const encodingMask = getDiagnosticInfoEncodingByte(diagnosticInfo);
    // write encoding byte
    node_opcua_basic_types_1.encodeByte(encodingMask, stream);
    // write symbolic id
    if (encodingMask & DiagnosticInfo_EncodingByte.SymbolicId) {
        node_opcua_basic_types_1.encodeInt32(diagnosticInfo.symbolicId, stream);
    }
    // write namespace uri
    if (encodingMask & DiagnosticInfo_EncodingByte.NamespaceURI) {
        node_opcua_basic_types_1.encodeInt32(diagnosticInfo.namespaceURI, stream);
    }
    // write locale
    if (encodingMask & DiagnosticInfo_EncodingByte.Locale) {
        node_opcua_basic_types_1.encodeInt32(diagnosticInfo.locale, stream);
    }
    // write localized text
    if (encodingMask & DiagnosticInfo_EncodingByte.LocalizedText) {
        node_opcua_basic_types_1.encodeInt32(diagnosticInfo.localizedText, stream);
    }
    // write additional info
    if (encodingMask & DiagnosticInfo_EncodingByte.AdditionalInfo) {
        node_opcua_basic_types_1.encodeString(diagnosticInfo.additionalInfo, stream);
    }
    // write inner status code
    if (encodingMask & DiagnosticInfo_EncodingByte.InnerStatusCode) {
        node_opcua_basic_types_1.encodeStatusCode(diagnosticInfo.innerStatusCode, stream);
    }
    // write  innerDiagnosticInfo
    if (encodingMask & DiagnosticInfo_EncodingByte.InnerDiagnosticInfo) {
        node_opcua_assert_1.assert(diagnosticInfo.innerDiagnosticInfo !== null, "missing innerDiagnosticInfo");
        if (diagnosticInfo.innerDiagnosticInfo) {
            encode_DiagnosticInfo(diagnosticInfo.innerDiagnosticInfo, stream);
        }
    }
}
function decodeDebug_DiagnosticInfo(diagnosticInfo, stream, options) {
    const tracer = options.tracer;
    tracer.trace("start", options.name + "(" + "DiagnosticInfo" + ")", stream.length, stream.length);
    let cursorBefore = stream.length;
    const encodingMask = node_opcua_basic_types_1.decodeByte(stream);
    tracer.trace("member", "encodingByte", "0x" + encodingMask.toString(16), cursorBefore, stream.length, "Mask");
    tracer.encoding_byte(encodingMask, DiagnosticInfo_EncodingByte, cursorBefore, stream.length);
    cursorBefore = stream.length;
    // read symbolic id
    if (encodingMask & DiagnosticInfo_EncodingByte.SymbolicId) {
        diagnosticInfo.symbolicId = node_opcua_basic_types_1.decodeInt32(stream);
        tracer.trace("member", "symbolicId", diagnosticInfo.symbolicId, cursorBefore, stream.length, "Int32");
        cursorBefore = stream.length;
    }
    // read namespace uri
    if (encodingMask & DiagnosticInfo_EncodingByte.NamespaceURI) {
        diagnosticInfo.namespaceURI = node_opcua_basic_types_1.decodeInt32(stream);
        tracer.trace("member", "symbolicId", diagnosticInfo.namespaceURI, cursorBefore, stream.length, "Int32");
        cursorBefore = stream.length;
    }
    // read locale
    if (encodingMask & DiagnosticInfo_EncodingByte.Locale) {
        diagnosticInfo.locale = node_opcua_basic_types_1.decodeInt32(stream);
        tracer.trace("member", "locale", diagnosticInfo.locale, cursorBefore, stream.length, "Int32");
        cursorBefore = stream.length;
    }
    // read localized text
    if (encodingMask & DiagnosticInfo_EncodingByte.LocalizedText) {
        diagnosticInfo.localizedText = node_opcua_basic_types_1.decodeInt32(stream);
        tracer.trace("member", "localizedText", diagnosticInfo.localizedText, cursorBefore, stream.length, "Int32");
        cursorBefore = stream.length;
    }
    // read additional info
    if (encodingMask & DiagnosticInfo_EncodingByte.AdditionalInfo) {
        diagnosticInfo.additionalInfo = node_opcua_basic_types_1.decodeString(stream);
        tracer.trace("member", "additionalInfo", diagnosticInfo.additionalInfo, cursorBefore, stream.length, "String");
        cursorBefore = stream.length;
    }
    // read inner status code
    if (encodingMask & DiagnosticInfo_EncodingByte.InnerStatusCode) {
        diagnosticInfo.innerStatusCode = node_opcua_basic_types_1.decodeStatusCode(stream);
        tracer.trace("member", "innerStatusCode", diagnosticInfo.innerStatusCode, cursorBefore, stream.length, "StatusCode");
        cursorBefore = stream.length;
    }
    // read inner status code
    if (encodingMask & DiagnosticInfo_EncodingByte.InnerDiagnosticInfo) {
        diagnosticInfo.innerDiagnosticInfo = new DiagnosticInfo({});
        if (diagnosticInfo.innerDiagnosticInfo) {
            diagnosticInfo.innerDiagnosticInfo.decodeDebug(stream, options);
        }
        tracer.trace("member", "innerDiagnosticInfo", diagnosticInfo.innerDiagnosticInfo, cursorBefore, stream.length, "DiagnosticInfo");
    }
    tracer.trace("end", options.name, stream.length, stream.length);
}
function decode_DiagnosticInfo(diagnosticInfo, stream) {
    const encodingMask = node_opcua_basic_types_1.decodeByte(stream);
    // read symbolic id
    if (encodingMask & DiagnosticInfo_EncodingByte.SymbolicId) {
        diagnosticInfo.symbolicId = node_opcua_basic_types_1.decodeInt32(stream);
    }
    // read namespace uri
    if (encodingMask & DiagnosticInfo_EncodingByte.NamespaceURI) {
        diagnosticInfo.namespaceURI = node_opcua_basic_types_1.decodeInt32(stream);
    }
    // read locale
    if (encodingMask & DiagnosticInfo_EncodingByte.Locale) {
        diagnosticInfo.locale = node_opcua_basic_types_1.decodeInt32(stream);
    }
    // read localized text
    if (encodingMask & DiagnosticInfo_EncodingByte.LocalizedText) {
        diagnosticInfo.localizedText = node_opcua_basic_types_1.decodeInt32(stream);
    }
    // read additional info
    if (encodingMask & DiagnosticInfo_EncodingByte.AdditionalInfo) {
        diagnosticInfo.additionalInfo = node_opcua_basic_types_1.decodeString(stream);
    }
    // read inner status code
    if (encodingMask & DiagnosticInfo_EncodingByte.InnerStatusCode) {
        diagnosticInfo.innerStatusCode = node_opcua_basic_types_1.decodeStatusCode(stream);
    }
    // read inner status code
    if (encodingMask & DiagnosticInfo_EncodingByte.InnerDiagnosticInfo) {
        diagnosticInfo.innerDiagnosticInfo = new DiagnosticInfo({});
        if (diagnosticInfo.innerDiagnosticInfo) {
            diagnosticInfo.innerDiagnosticInfo.decode(stream);
        }
    }
}
const emptyDiagnosticInfo = new DiagnosticInfo({});
function encodeDiagnosticInfo(value, stream) {
    if (value === null) {
        emptyDiagnosticInfo.encode(stream);
    }
    else {
        value.encode(stream);
    }
}
exports.encodeDiagnosticInfo = encodeDiagnosticInfo;
function decodeDiagnosticInfo(stream) {
    const value = new DiagnosticInfo({});
    value.decode(stream);
    return value;
}
exports.decodeDiagnosticInfo = decodeDiagnosticInfo;
// Note:
// the SymbolicId, NamespaceURI, LocalizedText and Locale fields are indexes in a string table which is returned
// in the response header. Only the index of the corresponding string in the string table is encoded. An index
// of −1 indicates that there is no value for the string.
//
node_opcua_factory_1.registerSpecialVariantEncoder(DiagnosticInfo);
//# sourceMappingURL=diagnostic_info.js.map