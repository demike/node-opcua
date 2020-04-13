"use strict";
/**
 * @module node-opcua-status-code
 */
// tslint:disable:no-bitwise
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("underscore");
const node_opcua_assert_1 = require("node-opcua-assert");
function warnLog(...args) {
    /* istanbul ignore next */
    // tslint:disable-next-line:no-console
    console.warn.apply(console, args);
}
/**
 * StatusCode Special bits
 */
exports.extraStatusCodeBits = {
    /**
     *  **StructureChanged** 15:15
     *   Indicates that the structure of the associated data value has changed since the last
     *   Notification.
     *  - Clients should not process the data value unless they re-read the metadata.
     *  - Servers shall set this bit if the DataTypeEncoding used for a Variable changes.
     *  - Servers shall also set this bit if the EnumStrings Property of the DataType of the Variable changes.
     *  - This bit is provided to warn Clients that parse complex data values that their parsing
     *    routines could fail because the serialized form of the data value has changed.
     *  - This bit has meaning only for StatusCodes returned as part of a data change Notification
     *    or the HistoryRead. StatusCodes used in other contexts shall always set this bit to zero.
     */
    StructureChanged: (0x1 << 15),
    /**
     * **SemanticsChanged** 14:14  Semantics of the associated data value have changed. Clients should not process the data
     *   value until they re-read the metadata associated with the Variable.
     * - Servers should set this bit if the metadata has changed in way that could cause application errors if the
     * - Client does not re-read the metadata. For example, a change to the engineering units
     *   could create problems if the Client uses the value to perform calculations.
     * - Part 8 defines the conditions where a Server shall set this bit for a DA Variable.
     * - Other specifications may define additional conditions.
     * - A Server may define other conditions that cause this bit to be set. This bit has meaning only for StatusCodes returned as part of a data change Notification
     *   or the HistoryRead. StatusCodes used in other contexts shall always set this bit to zero.
     */
    SemanticChanged: (0x1 << 14),
    // Reserved         12:13  Reserved for future use. Shall always be zero.
    /**
     * **InfoType**         10:11
     * The type of information contained in the info bits. These bits have the following meanings:
     *
     * | Meaning                           |value | description|
     * |-----------------------------------|------|----------------------------------------------------|
     * |                         NotUsed   | 00   | The info bits are not used and shall be set to zero. |
     * |                         DataValue | 01   | The StatusCode and its info bits are associated with a data value returned from the Server. This flag is only used in combination with StatusCodes defined in Part 8. |
     * |                         Reserved  |1X    | Reserved for future use. The info bits shall be ignored.|
     */
    InfoTypeDataValue: (0x1 << 10),
    // InfoBits         0:9    Additional information bits that qualify the StatusCode.
    //                         The structure of these bits depends on the Info Type field.
    //
    // LimitBits        8:9    The limit bits associated with the data value. The limits bits have the
    //                         following meanings:
    //                         Limit     Bits   Description
    //                         None      00     The value is free to change.
    //                         Low       01     The value is at the lower limit for the data source.
    //                         High      10     The value is at the higher limit for the data source.
    //                         Constant  11     The value is constant and cannot change.
    LimitLow: (0x1 << 8),
    LimitHigh: (0x2 << 8),
    LimitConstant: (0x3 << 8),
    /**
     * **Overflow**         7:7
     * - This bit shall only be set if the MonitoredItem queue size is greater than 1.
     * - If this bit is set, not every detected change has been returned since the Server’s
     *  queue buffer for the MonitoredItem reached its limit and had to purge out data.
     *
     */
    Overflow: (0x1 << 7),
    // Reserved         5:6    Reserved for future use. Shall always be zero.
    // HistorianBits    0:4    These bits are set only when reading historical data. They indicate where the data value
    //                         came from and provide information that affects how the Client uses the data value.
    //                         The historian bits have the following meaning:
    //                         Raw            XXX00      A raw data value.
    //                         Calculated     XXX01      A data value which was calculated.
    //                         Interpolated   XXX10      A data value which was interpolated.
    //                         Reserved       XXX11      Undefined.
    //                         Partial        XX1XX      A data value which was calculated with an incomplete interval.
    //                         Extra Data     X1XXX      A raw data value that hides other data at the same timestamp.
    //                         Multi Value    1XXXX      Multiple values match the Aggregate criteria (i.e. multiple
    //                                                   minimum values at different timestamps within the same interval).
    //                         Part 11 describes how these bits are used in more detail.
    /** historical data contains a data value which was calculated. */
    HistorianCalculated: 0x1 << 0,
    /** historical data contains a data value which was interpolated. */
    HistorianInterpolated: 0x2 << 0,
    /** historical data contains a data value which was calculated with an incomplete interval. */
    HistorianPartial: 0x1 << 2,
    /** historical data contains a raw data value that hides other data at the same timestamp. */
    HistorianExtraData: 0x1 << 3,
    /** Multiple values match the Aggregate criteria (i.e. multiple minimum values at different timestamps within the same interval). */
    HistorianMultiValue: 0x1 << 4
};
/**
 * a particular StatusCode , with it's value , name and description
 */
class StatusCode {
    /**
     *  returns a status code that can be modified
     */
    static makeStatusCode(statusCode, optionalBits) {
        const _base = coerceStatusCode(statusCode);
        const tmp = new ModifiableStatusCode({ _base });
        if (optionalBits || typeof optionalBits === "number") {
            tmp.set(optionalBits);
        }
        return tmp;
    }
    get valueOf() {
        return this.value;
    }
    toString() {
        return this.name + " (0x" + ("0000" + this.value.toString(16)).substr(-8) + ")";
    }
    checkBit(mask) {
        return (this.value & mask) === mask;
    }
    /**returns true if the overflow bit is set */
    get hasOverflowBit() {
        return this.checkBit(exports.extraStatusCodeBits.Overflow);
    }
    /**returns true if the semanticChange bit is set */
    get hasSemanticChangedBit() {
        return this.checkBit(exports.extraStatusCodeBits.SemanticChanged);
    }
    /**returns true if the structureChange bit is set */
    get hasStructureChangedBit() {
        return this.checkBit(exports.extraStatusCodeBits.StructureChanged);
    }
    isNot(other) {
        node_opcua_assert_1.assert(other instanceof StatusCode);
        return this.value !== other.value;
    }
    equals(other) {
        node_opcua_assert_1.assert(other instanceof StatusCode);
        return this.value === other.value;
    }
    toJSON() {
        return { value: this.value };
    }
    toJSONFull() {
        return { value: this.value, name: this.name, description: this.description };
    }
}
exports.StatusCode = StatusCode;
Object.defineProperty(StatusCode.prototype, "value", { enumerable: true });
Object.defineProperty(StatusCode.prototype, "description", { enumerable: true });
Object.defineProperty(StatusCode.prototype, "name", { enumerable: true });
// tslint:disable:max-classes-per-file
class ConstantStatusCode extends StatusCode {
    /**
     *
     * @param options
     * @param options
     * @param options.value
     * @param options.description
     * @param options.name
     *
     */
    constructor(options) {
        super();
        this._value = options.value;
        this._description = options.description;
        this._name = options.name;
    }
    get value() {
        return this._value;
    }
    get name() {
        return this._name;
    }
    get description() {
        return this._description;
    }
}
exports.ConstantStatusCode = ConstantStatusCode;
Object.defineProperty(ConstantStatusCode.prototype, "_value", { enumerable: false, writable: true });
Object.defineProperty(ConstantStatusCode.prototype, "_description", { enumerable: false, writable: true });
Object.defineProperty(ConstantStatusCode.prototype, "_name", { enumerable: false, writable: true });
Object.defineProperty(ConstantStatusCode.prototype, "value", { enumerable: true });
Object.defineProperty(ConstantStatusCode.prototype, "description", { enumerable: true });
Object.defineProperty(ConstantStatusCode.prototype, "name", { enumerable: true });
function encodeStatusCode(statusCode, stream) {
    stream.writeUInt32(statusCode.value);
}
exports.encodeStatusCode = encodeStatusCode;
/** @internal construct status codes fast search indexes */
const statusCodesReversedMap = {};
/**
 * returns the StatusCode corresponding to the provided value, if any
 * @note: if code is not known , then StatusCodes.Bad will be returned
 * @param code
 */
function getStatusCodeFromCode(code) {
    const codeWithoutInfoBits = (code & 0xFFFF0000) >>> 0;
    const infoBits = code & 0x0000FFFF;
    let sc = statusCodesReversedMap[codeWithoutInfoBits];
    /* istanbul ignore if */
    if (!sc) {
        sc = _generated_status_codes_1.StatusCodes.Bad;
        console.log("expecting a known StatusCode but got 0x" + codeWithoutInfoBits.toString(16), " code was 0x" + code.toString(16));
        warnLog("expecting a known StatusCode but got 0x" + codeWithoutInfoBits.toString(16), " code was 0x" + code.toString(16));
    }
    if (infoBits) {
        const tmp = new ModifiableStatusCode({ _base: sc });
        tmp.set(infoBits);
        sc = tmp;
    }
    return sc;
}
exports.getStatusCodeFromCode = getStatusCodeFromCode;
function decodeStatusCode(stream) {
    const code = stream.readUInt32();
    return getStatusCodeFromCode(code);
}
exports.decodeStatusCode = decodeStatusCode;
class ModifiableStatusCode extends StatusCode {
    constructor(options) {
        super();
        this._base = options._base;
        this._extraBits = 0;
        if (this._base instanceof ModifiableStatusCode) {
            this._extraBits = this._base._extraBits;
            this._base = this._base._base;
        }
    }
    get value() {
        return this._base.value + this._extraBits;
    }
    get name() {
        return this._base.name + this._getExtraName();
    }
    get description() {
        return this._base.description;
    }
    set(bit) {
        if (typeof bit === "string") {
            const bitsArray = bit.split(" | ");
            if (bitsArray.length > 1) {
                for (const bitArray of bitsArray) {
                    this.set(bitArray);
                }
                return;
            }
            const tmp = exports.extraStatusCodeBits[bit];
            /* istanbul ignore next */
            if (!tmp) {
                throw new Error("Invalid StatusCode Bit " + bit);
            }
            bit = tmp;
        }
        this._extraBits = this._extraBits | bit;
    }
    unset(bit) {
        if (typeof bit === "string") {
            const bitsArray = bit.split(" | ");
            if (bitsArray.length > 1) {
                for (const bitArray of bitsArray) {
                    this.unset(bitArray);
                }
                return;
            }
            const tmp = exports.extraStatusCodeBits[bit];
            /* istanbul ignore next */
            if (!tmp) {
                throw new Error("Invalid StatusCode Bit " + bit);
            }
            bit = tmp;
        }
        this._extraBits = this._extraBits & (~bit >>> 0);
    }
    _getExtraName() {
        const self = this;
        const str = [];
        _.forEach(exports.extraStatusCodeBits, (value, key) => {
            if ((self._extraBits & value) === value) {
                str.push(key);
            }
        });
        /* istanbul ignore next */
        if (str.length === 0) {
            return "";
        }
        return "#" + str.join("|");
    }
}
exports.ModifiableStatusCode = ModifiableStatusCode;
// hide private properties
Object.defineProperty(ModifiableStatusCode.prototype, "_base", { enumerable: false, writable: true });
Object.defineProperty(ModifiableStatusCode.prototype, "_extraBits", { enumerable: false, writable: true });
const _generated_status_codes_1 = require("./_generated_status_codes");
var _generated_status_codes_2 = require("./_generated_status_codes");
exports.StatusCodes = _generated_status_codes_2.StatusCodes;
function coerceStatusCode(statusCode) {
    if (statusCode instanceof StatusCode) {
        return statusCode;
    }
    if (statusCode.hasOwnProperty("value")) {
        return getStatusCodeFromCode(statusCode.value);
    }
    if (typeof statusCode === "number") {
        return getStatusCodeFromCode(statusCode);
    }
    const _StatusCodes = _generated_status_codes_1.StatusCodes;
    if (!_StatusCodes[statusCode]) {
        throw new Error("Cannot find StatusCode " + statusCode);
    }
    return _StatusCodes[statusCode];
}
exports.coerceStatusCode = coerceStatusCode;
_.forEach(Object.keys(_generated_status_codes_1.StatusCodes), (name) => {
    const code = _generated_status_codes_1.StatusCodes[name];
    statusCodesReversedMap[code.value.toString()] = code;
});
_generated_status_codes_1.StatusCodes.makeStatusCode = StatusCode.makeStatusCode;
//# sourceMappingURL=opcua_status_code.js.map