"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_opcua_types_1 = require("node-opcua-types");
const node_opcua_data_model_1 = require("node-opcua-data-model");
function isChannelSecure(channel) {
    if (channel.securityMode === node_opcua_types_1.MessageSecurityMode.SignAndEncrypt) {
        return true;
    }
    return false;
}
function newIsUserReadable(context) {
    if (context) {
        if (!context.session) {
            console.log(" context has no session", context);
            return false;
        }
        if (!context.session.channel) {
            console.log(" context has no channel", context);
            return false;
        }
        if (!isChannelSecure(context.session.channel))
            return false;
        return true;
    }
    return false;
}
function replaceMethod(obj, method, func) {
    const oldMethod = obj[method];
    if (!oldMethod) {
        throw new Error("Icannot find method " + method + " on object " + obj.browseName.toString());
    }
    obj[method] = function (...args) {
        const ret = func.apply(this, args);
        if (!ret) {
            return false;
        }
        return oldMethod.apply(this, args);
    };
}
/**
 * make sure that the given ia node can only be read
 * by Admistrrator user on a encrypted channel
 * @param node
 */
function ensureObjectIsSecure(node) {
    if (node.nodeClass == node_opcua_data_model_1.NodeClass.Variable) {
        replaceMethod(node, "isUserReadable", newIsUserReadable);
        const variable = node;
        variable.setPermissions({
            CurrentRead: ["!*", "Supervisor", "ConfigAdmin", "SystemAdmin"],
            CurrentWrite: ["!*"]
        });
    }
    const children = node.findReferencesAsObject("Aggregates", true);
    for (const child of children) {
        ensureObjectIsSecure(child);
    }
}
exports.ensureObjectIsSecure = ensureObjectIsSecure;
//# sourceMappingURL=ensure_secure_access.js.map