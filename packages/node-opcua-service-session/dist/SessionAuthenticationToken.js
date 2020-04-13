"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-service-session
 */
const node_opcua_factory_1 = require("node-opcua-factory");
// OPC Unified Architecture, Part 4  $7.29 page 139
exports.schemaSessionAuthenticationToken = {
    name: "SessionAuthenticationToken",
    subType: "NodeId"
};
node_opcua_factory_1.registerBasicType(exports.schemaSessionAuthenticationToken);
//# sourceMappingURL=SessionAuthenticationToken.js.map