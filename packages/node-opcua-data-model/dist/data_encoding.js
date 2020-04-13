"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isDataEncoding(dataEncoding) {
    return (dataEncoding && typeof dataEncoding.name === "string");
}
exports.isDataEncoding = isDataEncoding;
const validEncoding = ["DefaultBinary", "DefaultXml"];
function isValidDataEncoding(dataEncoding) {
    if (!dataEncoding) {
        return true;
    }
    if (dataEncoding.name) {
        dataEncoding = dataEncoding.name;
    }
    if (dataEncoding && (dataEncoding.name || dataEncoding.text)) {
        // tslint:disable:no-console
        console.log(" isValidDataEncoding => expecting a string here , not a LocalizedText or a QualifiedName ");
        return false;
    }
    if (!(dataEncoding && typeof dataEncoding === "string")) {
        return true;
    }
    return validEncoding.indexOf(dataEncoding) !== -1;
}
exports.isValidDataEncoding = isValidDataEncoding;
//# sourceMappingURL=data_encoding.js.map