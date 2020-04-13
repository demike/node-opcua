"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-common
 */
const events_1 = require("events");
const fs = require("fs");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_crypto_1 = require("node-opcua-crypto");
function _load_certificate(certificateFilename) {
    const der = node_opcua_crypto_1.readCertificate(certificateFilename);
    return der;
}
function _load_private_key_pem(privateKeyFilename) {
    return node_opcua_crypto_1.readKeyPem(privateKeyFilename);
}
/**
 * an object that provides a certificate and a privateKey
 * @class OPCUASecureObject
 * @param options
 * @param options.certificateFile {string}
 * @param options.privateKeyFile {string}
 * @constructor
 */
class OPCUASecureObject extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.certificate = null;
        this.certificateChain = null;
        this.privateKeyPEM = null;
        node_opcua_assert_1.assert(typeof options.certificateFile === "string");
        node_opcua_assert_1.assert(typeof options.privateKeyFile === "string");
        this.certificateFile = options.certificateFile || "invalid certificate file";
        this.privateKeyFile = options.privateKeyFile || "invalid private key file";
    }
    getCertificate() {
        if (!this.certificate) {
            const certChain = this.getCertificateChain();
            this.certificate = node_opcua_crypto_1.split_der(certChain)[0];
        }
        return this.certificate;
    }
    getCertificateChain() {
        if (!this.certificateChain) {
            node_opcua_assert_1.assert(fs.existsSync(this.certificateFile), "Certificate file must exist :" + this.certificateFile);
            this.certificateChain = _load_certificate(this.certificateFile);
        }
        return this.certificateChain;
    }
    getPrivateKey() {
        if (!this.privateKeyPEM) {
            node_opcua_assert_1.assert(fs.existsSync(this.certificateFile), "private file must exist :" + this.certificateFile);
            this.privateKeyPEM = _load_private_key_pem(this.privateKeyFile);
        }
        return this.privateKeyPEM;
    }
}
exports.OPCUASecureObject = OPCUASecureObject;
//# sourceMappingURL=opcua_secure_object.js.map