"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const string_1 = require("./string");
function validateLocaleId(value) {
    // TODO : check that localeID is well-formed
    // see part 3 $8.4 page 63
    return true;
}
exports.validateLocaleId = validateLocaleId;
function encodeLocaleId(localeId, stream) {
    return string_1.encodeUAString(localeId, stream);
}
exports.encodeLocaleId = encodeLocaleId;
function decodeLocaleId(stream) {
    return string_1.decodeUAString(stream);
}
exports.decodeLocaleId = decodeLocaleId;
//# sourceMappingURL=localeid.js.map