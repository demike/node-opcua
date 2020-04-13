"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/***
 * @module node-opcua-guid
 */
const regexGUID = /^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}/;
/**
 * checks if provided string is a valid Guid
 * a valid GUID has the form  XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXX
 * when X is a hexadecimal digit
 *
 * @method isValidGuid
 * @param guid - the GUID to test for validaty
 * @return  - true if the string is a valid GUID.
 */
function isValidGuid(guid) {
    return regexGUID.test(guid);
}
exports.isValidGuid = isValidGuid;
//                             1         2         3
//                   012345678901234567890123456789012345
exports.emptyGuid = "00000000-0000-0000-0000-000000000000";
//# sourceMappingURL=guid.js.map