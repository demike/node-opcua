"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_opcua_basic_types_1 = require("node-opcua-basic-types");
const node_opcua_factory_1 = require("node-opcua-factory");
function coerceLocalizedText(value) {
    if (value === undefined || value === null) {
        return null;
    }
    if (typeof value === "string") {
        return new LocalizedText({ locale: null, text: value });
    }
    if (value instanceof LocalizedText) {
        return value;
    }
    if (!value.hasOwnProperty("text")) {
        // tslint:disable:no-console
        console.log("value = ", value);
        throw new Error("cannot coerce to coerceLocalizedText");
    }
    return new LocalizedText(value);
}
exports.coerceLocalizedText = coerceLocalizedText;
// --------------------------------------------------------------------------------------------
// see Part 3 - $8.5 page 63
const schemaLocalizedText = node_opcua_factory_1.buildStructuredType({
    name: "LocalizedText",
    baseType: "BaseUAObject",
    fields: [
        {
            name: "locale",
            fieldType: "LocaleId"
        },
        {
            name: "text",
            fieldType: "UAString",
            defaultValue: () => null
        }
    ]
});
schemaLocalizedText.coerce = coerceLocalizedText;
class LocalizedText extends node_opcua_factory_1.BaseUAObject {
    /**
     *
     * @class LocalizedText
     * @constructor
     * @extends BaseUAObject
     * @param  options {Object}
     */
    constructor(options) {
        super();
        const schema = schemaLocalizedText;
        options = options || {};
        /* istanbul ignore next */
        if (node_opcua_factory_1.parameters.debugSchemaHelper) {
            node_opcua_factory_1.check_options_correctness_against_schema(this, schema, options);
        }
        /**
         * @property locale
         * @type {UAString}
         */
        this.locale = node_opcua_factory_1.initialize_field(schema.fields[0], options.locale);
        /**
         * @property text
         * @type {UAString}
         */
        this.text = node_opcua_factory_1.initialize_field(schema.fields[1], options.text);
    }
    static get schema() {
        return schemaLocalizedText;
    }
    get schema() {
        return schemaLocalizedText;
    }
    // xx static encodingDefaultBinary = makeExpandedNodeId(0, 0);
    // xx static encodingDefaultXml = makeExpandedNodeId(0, 0);
    static coerce(value) {
        return coerceLocalizedText(value);
    }
    toString() {
        return "locale=" + this.locale + " text=" + this.text;
    }
    // OPCUA Part 6 $ 5.2.2.14 : localizedText have a special encoding
    encode(stream) {
        // tslint:disable:no-bitwise
        const encodingMask = getLocalizeText_EncodingByte(this);
        node_opcua_basic_types_1.encodeByte(encodingMask, stream);
        if ((encodingMask & 0x01) === 0x01) {
            node_opcua_basic_types_1.encodeString(this.locale, stream);
        }
        if ((encodingMask & 0x02) === 0x02) {
            node_opcua_basic_types_1.encodeString(this.text, stream);
        }
    }
    decodeDebug(stream, options) {
        let cursorBefore;
        const tracer = options.tracer;
        tracer.trace("start", options.name + "(" + "LocalizedText" + ")", stream.length, stream.length);
        cursorBefore = stream.length;
        const encodingMask = node_opcua_basic_types_1.decodeByte(stream);
        tracer.trace("member", "encodingByte", "0x" + encodingMask.toString(16), cursorBefore, stream.length, "Mask");
        cursorBefore = stream.length;
        if ((encodingMask & 0x01) === 0x01) {
            this.locale = node_opcua_basic_types_1.decodeString(stream);
            tracer.trace("member", "locale", this.locale, cursorBefore, stream.length, "locale");
            cursorBefore = stream.length;
        }
        else {
            this.locale = null;
        }
        if ((encodingMask & 0x02) === 0x02) {
            this.text = node_opcua_basic_types_1.decodeString(stream);
            tracer.trace("member", "text", this.text, cursorBefore, stream.length, "text");
            // cursor_before = stream.length;
        }
        else {
            this.text = null;
        }
        tracer.trace("end", options.name, stream.length, stream.length);
    }
    decode(stream) {
        const encodingMask = node_opcua_basic_types_1.decodeByte(stream);
        if ((encodingMask & 0x01) === 0x01) {
            this.locale = node_opcua_basic_types_1.decodeString(stream);
        }
        else {
            this.locale = null;
        }
        if ((encodingMask & 0x02) === 0x02) {
            this.text = node_opcua_basic_types_1.decodeString(stream);
        }
        else {
            this.text = null;
        }
    }
}
exports.LocalizedText = LocalizedText;
LocalizedText.possibleFields = [
    "locale",
    "text"
];
// not an extension object registerClassDefinition("LocalizedText", LocalizedText);
node_opcua_factory_1.registerSpecialVariantEncoder(LocalizedText);
function getLocalizeText_EncodingByte(localizedText) {
    let encodingMask = 0;
    if (localizedText.locale) {
        encodingMask |= 0x01;
    }
    if (localizedText.text) {
        encodingMask |= 0x02;
    }
    return encodingMask;
}
const emptyLocalizedText = new LocalizedText({});
function encodeLocalizedText(value, stream) {
    if (value) {
        value.encode(stream);
    }
    else {
        emptyLocalizedText.encode(stream);
    }
}
exports.encodeLocalizedText = encodeLocalizedText;
function decodeLocalizedText(stream) {
    const value = new LocalizedText({});
    value.decode(stream);
    return value;
}
exports.decodeLocalizedText = decodeLocalizedText;
//# sourceMappingURL=localized_text.js.map