"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function adjustBrowseDirection(browseDirection, defaultValue) {
    // istanbul ignore next
    if (browseDirection === null || browseDirection === undefined) {
        return defaultValue;
    }
    return browseDirection;
}
exports.adjustBrowseDirection = adjustBrowseDirection;
//# sourceMappingURL=adjust_browse_direction.js.map