"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_opcua_factory_1 = require("node-opcua-factory");
const utils = require("node-opcua-utils");
var AccessLevelFlag;
(function (AccessLevelFlag) {
    AccessLevelFlag[AccessLevelFlag["CurrentRead"] = 1] = "CurrentRead";
    AccessLevelFlag[AccessLevelFlag["CurrentWrite"] = 2] = "CurrentWrite";
    AccessLevelFlag[AccessLevelFlag["HistoryRead"] = 4] = "HistoryRead";
    AccessLevelFlag[AccessLevelFlag["HistoryWrite"] = 8] = "HistoryWrite";
    AccessLevelFlag[AccessLevelFlag["SemanticChange"] = 16] = "SemanticChange";
    AccessLevelFlag[AccessLevelFlag["StatusWrite"] = 32] = "StatusWrite";
    AccessLevelFlag[AccessLevelFlag["TimestampWrite"] = 64] = "TimestampWrite";
    AccessLevelFlag[AccessLevelFlag["NONE"] = 2048] = "NONE";
    AccessLevelFlag[AccessLevelFlag["None"] = 2048] = "None";
})(AccessLevelFlag = exports.AccessLevelFlag || (exports.AccessLevelFlag = {}));
function convertAccessLevelFlagToByte(accessLevel) {
    return accessLevel & 0x3F;
}
exports.convertAccessLevelFlagToByte = convertAccessLevelFlagToByte;
// @example
//      makeAccessLevelFlag("CurrentRead | CurrentWrite").should.eql(0x03);
function makeAccessLevelFlag(str) {
    if (typeof str === "number") {
        const value = str;
        if (value === 0) {
            return AccessLevelFlag.None;
        }
        return value;
    }
    let accessFlag;
    if (str === "" || str === null) {
        accessFlag = AccessLevelFlag.None;
    }
    else {
        const flags = str.split(" | ");
        accessFlag = 0;
        for (const flag of flags) {
            accessFlag |= AccessLevelFlag[flag];
        }
    }
    if (utils.isNullOrUndefined(accessFlag)) {
        throw new Error("Invalid access flag specified '" + str + "' should be one of " + AccessLevelFlag.toString());
    }
    return accessFlag;
}
exports.makeAccessLevelFlag = makeAccessLevelFlag;
exports.coerceAccessLevelFlag = makeAccessLevelFlag;
function randomAccessLevel() {
    return AccessLevelFlag.CurrentRead;
}
exports.randomAccessLevel = randomAccessLevel;
// tslint:disable:no-bitwise
function accessLevelFlagToString(accessLevelFlag) {
    const retVal = [];
    if (accessLevelFlag & AccessLevelFlag.CurrentRead) {
        retVal.push("CurrentRead");
    }
    if (accessLevelFlag & AccessLevelFlag.CurrentWrite) {
        retVal.push("CurrentWrite");
    }
    if (accessLevelFlag & AccessLevelFlag.StatusWrite) {
        retVal.push("StatusWrite");
    }
    if (accessLevelFlag & AccessLevelFlag.TimestampWrite) {
        retVal.push("TimestampWrite");
    }
    if (accessLevelFlag & AccessLevelFlag.HistoryRead) {
        retVal.push("HistoryRead");
    }
    if (accessLevelFlag & AccessLevelFlag.HistoryWrite) {
        retVal.push("HistoryWrite");
    }
    if (accessLevelFlag & AccessLevelFlag.SemanticChange) {
        retVal.push("SemanticChange");
    }
    if (retVal.length === 0) {
        retVal.push("None");
    }
    return retVal.join(" | ");
}
exports.accessLevelFlagToString = accessLevelFlagToString;
node_opcua_factory_1.registerBasicType({
    name: "AccessLevelFlag",
    subType: "Byte",
    defaultValue: () => AccessLevelFlag.CurrentRead | AccessLevelFlag.CurrentWrite,
    coerce: (value) => makeAccessLevelFlag(value),
    decode: (stream) => {
        const code = stream.readUInt8();
        return (code ? AccessLevelFlag[code] : AccessLevelFlag.NONE);
    },
    encode: (value, stream) => stream.writeUInt8(value & 0x8F),
    random: randomAccessLevel
});
//# sourceMappingURL=access_level.js.map