"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-utils
 */
/**
 * @method getObjectClassName
 * @param obj
 * @return {string}
 */
function getObjectClassName(obj) {
    return Object.prototype.toString.call(obj).slice(8, -1);
}
exports.getObjectClassName = getObjectClassName;
//# sourceMappingURL=object_classname.js.map