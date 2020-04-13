"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-common
 */
const crypto = require("crypto");
const node_opcua_assert_1 = require("node-opcua-assert");
function makeApplicationUrn(hostname, suffix) {
    // beware : Openssl doesn't support urn with length greater than 64 !!
    //          sometimes hostname length could be too long ...
    // application urn length must not exceed 64 car. to comply with openssl
    // see cryptoCA
    let hostnameHash = hostname;
    if (hostnameHash.length + 7 + suffix.length >= 64) {
        // we need to reduce the applicationUrn side => let's take
        // a portion of the hostname hash.
        hostnameHash = crypto.createHash("md5").update(hostname).digest("hex").substr(0, 16);
    }
    const applicationUrn = "urn:" + hostnameHash + ":" + suffix;
    node_opcua_assert_1.assert(applicationUrn.length <= 64);
    return applicationUrn;
}
exports.makeApplicationUrn = makeApplicationUrn;
//# sourceMappingURL=applicationurn.js.map