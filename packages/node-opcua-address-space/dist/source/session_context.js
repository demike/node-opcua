"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space
 */
const _ = require("underscore");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_crypto_1 = require("node-opcua-crypto");
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_types_1 = require("node-opcua-types");
function getUserName(userIdentityToken) {
    if (userIdentityToken instanceof node_opcua_types_1.AnonymousIdentityToken) {
        return "anonymous";
    }
    if (userIdentityToken instanceof node_opcua_types_1.X509IdentityToken) {
        const certInfo = node_opcua_crypto_1.exploreCertificate(userIdentityToken.certificateData);
        const userName = certInfo.tbsCertificate.subject.commonName || "";
        if (typeof userName !== "string") {
            throw new Error("Invalid username");
        }
        return userName;
    }
    if (userIdentityToken instanceof node_opcua_types_1.UserNameIdentityToken) {
        if (userIdentityToken.policyId === "anonymous") {
            return "anonymous";
        }
        node_opcua_assert_1.assert(userIdentityToken.hasOwnProperty("userName"));
        return userIdentityToken.userName;
    }
    throw new Error("Invalid user identity token");
}
class SessionContext {
    constructor(options) {
        this.continuationPoints = {};
        options = options || {};
        this.session = options.session;
        this.object = options.object;
        this.server = options.server;
        this.currentTime = undefined;
    }
    /**
     * getCurrentUserRole
     *
     * guest   => anonymous user (unauthenticated)
     * default => default authenticated user
     *
     */
    getCurrentUserRole() {
        if (!this.session) {
            return "default";
        }
        node_opcua_assert_1.assert(this.session != null, "expecting a session");
        const userIdentityToken = this.session.userIdentityToken;
        if (!userIdentityToken) {
            throw new Error("session object must provide a userIdentityToken");
        }
        const username = getUserName(userIdentityToken);
        if (username === "anonymous") {
            return "guest";
        }
        if (!this.server || !this.server.userManager) {
            return "default";
        }
        node_opcua_assert_1.assert(this.server != null, "expecting a server");
        if (!_.isFunction(this.server.userManager.getUserRole)) {
            return "default";
        }
        return this.server.userManager.getUserRole(username);
    }
    /**
     * @method checkPermission
     * @param node
     * @param action
     * @return {Boolean}
     */
    checkPermission(node, action) {
        // tslint:disable:no-bitwise
        const lNode = node;
        node_opcua_assert_1.assert(node_opcua_data_model_1.AccessLevelFlag.hasOwnProperty(action));
        const actionFlag = node_opcua_data_model_1.makeAccessLevelFlag(action);
        if (!lNode._permissions) {
            return (lNode.userAccessLevel & actionFlag) === actionFlag;
        }
        const permission = lNode._permissions[action];
        if (!permission) {
            return (lNode.userAccessLevel & actionFlag) === actionFlag;
        }
        const userRole = this.getCurrentUserRole();
        if (userRole === "default") {
            return (lNode.userAccessLevel & actionFlag) === actionFlag;
        }
        if (permission[0] === "*") {
            // accept all except...
            const str = "!" + userRole;
            if (permission.findIndex((x) => x === str) >= 0) {
                return false; // user is explicitly denied
            }
            return true;
        }
        else {
            // deny all, unless specify
            if (permission.findIndex((x) => x === userRole) >= 0) {
                return true; // user is explicitly denied
            }
            return false;
        }
    }
}
exports.SessionContext = SessionContext;
SessionContext.defaultContext = new SessionContext({});
//# sourceMappingURL=session_context.js.map