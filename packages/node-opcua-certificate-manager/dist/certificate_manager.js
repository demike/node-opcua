"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-certificate-manager
 */
// tslint:disable:no-empty
const chalk_1 = require("chalk");
const fs = require("fs");
const mkdirp = require("mkdirp");
const env_paths_1 = require("env-paths");
const node_opcua_debug_1 = require("node-opcua-debug");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const node_opcua_crypto_1 = require("node-opcua-crypto");
const node_opcua_pki_1 = require("node-opcua-pki");
const paths = env_paths_1.default("node-opcua");
const debugLog = node_opcua_debug_1.make_debugLog(__filename);
const errorLog = node_opcua_debug_1.make_errorLog(__filename);
const doDebug = node_opcua_debug_1.checkDebugFlag(__filename);
class OPCUACertificateManager extends node_opcua_pki_1.CertificateManager {
    /* */
    constructor(options) {
        options = options || {};
        const location = options.rootFolder || paths.config;
        if (!fs.existsSync(location)) {
            mkdirp.sync(location);
        }
        const _options = {
            keySize: 2048,
            location
        };
        super(_options);
        this.automaticallyAcceptUnknownCertificate = !!options.automaticallyAcceptUnknownCertificate;
    }
    checkCertificate(certificate, callback) {
        const checkCertificateStep2 = (err) => {
            if (err) {
                return callback(err, node_opcua_status_code_1.StatusCodes.BadInternalError);
            }
            super.verifyCertificate(certificate, (err1, status) => {
                if (err1) {
                    return callback(err1);
                }
                const statusCode = node_opcua_status_code_1.StatusCodes[status];
                if (!statusCode) {
                    return callback(new Error("Invalid statusCode " + status));
                }
                callback(null, statusCode);
            });
        };
        this._getCertificateStatus(certificate, (err, status0) => {
            if (err) {
                return callback(err);
            }
            if (status0 === "unknown") {
                const thumbprint = node_opcua_crypto_1.makeSHA1Thumbprint(certificate).toString("hex");
                // certificate has not bee seen before
                errorLog("Certificate with thumbprint " + thumbprint + "has not been seen before");
                if (this.automaticallyAcceptUnknownCertificate) {
                    errorLog("automaticallyAcceptUnknownCertificate = true");
                    errorLog("certificate with thumbprint " + thumbprint + " is now trusted");
                    this.trustCertificate(certificate, checkCertificateStep2);
                }
                else {
                    errorLog("automaticallyAcceptUnknownCertificate = false");
                    errorLog("certificate with thumbprint " + thumbprint + " is now rejected");
                    this.rejectCertificate(certificate, checkCertificateStep2);
                }
            }
            else {
                checkCertificateStep2(null);
            }
        });
    }
    getTrustStatus(certificate, callback) {
        this.isCertificateTrusted(certificate, (err, trustedStatus) => {
            callback(err, err ? undefined : node_opcua_status_code_1.StatusCodes[trustedStatus]);
        });
    }
}
exports.OPCUACertificateManager = OPCUACertificateManager;
// tslint:disable:no-var-requires
// tslint:disable:max-line-length
const thenify = require("thenify");
const opts = { multiArgs: false };
OPCUACertificateManager.prototype.checkCertificate =
    thenify.withCallback(OPCUACertificateManager.prototype.checkCertificate, opts);
OPCUACertificateManager.prototype.getTrustStatus =
    thenify.withCallback(OPCUACertificateManager.prototype.getTrustStatus, opts);
// also see OPCUA 1.02 part 4 :
//  - page 95  6.1.3 Determining if a Certificate is Trusted
// -  page 100 6.2.3 Validating a Software Certificate
//
function checkCertificateValidity(certificate) {
    // Is the  signature on the SoftwareCertificate valid .?
    if (!certificate) {
        // missing certificate
        return node_opcua_status_code_1.StatusCodes.BadSecurityChecksFailed;
    }
    // Has SoftwareCertificate passed its issue date and has it not expired ?
    // check dates
    const cert = node_opcua_crypto_1.exploreCertificateInfo(certificate);
    const now = new Date();
    if (cert.notBefore.getTime() > now.getTime()) {
        // certificate is not active yet
        // tslint:disable-next-line:no-console
        console.log(chalk_1.default.red(" Sender certificate is invalid : certificate is not active yet !") +
            "  not before date =" + cert.notBefore);
        return node_opcua_status_code_1.StatusCodes.BadCertificateTimeInvalid;
    }
    if (cert.notAfter.getTime() <= now.getTime()) {
        // certificate is obsolete
        // tslint:disable-next-line:no-console
        console.log(chalk_1.default.red(" Sender certificate is invalid : certificate has expired !") +
            " not after date =" + cert.notAfter);
        return node_opcua_status_code_1.StatusCodes.BadCertificateTimeInvalid;
    }
    // Has SoftwareCertificate has  been revoked by the issuer ?
    // TODO: check if certificate is revoked or not ...
    // StatusCodes.BadCertificateRevoked
    // is issuer Certificate  valid and has not been revoked by the CA that issued it. ?
    // TODO : check validity of issuer certificate
    // StatusCodes.BadCertificateIssuerRevoked
    // does the URI specified in the ApplicationDescription  match the URI in the Certificate ?
    // TODO : check ApplicationDescription of issuer certificate
    // return StatusCodes.BadCertificateUriInvalid
    return node_opcua_status_code_1.StatusCodes.Good;
}
exports.checkCertificateValidity = checkCertificateValidity;
//# sourceMappingURL=certificate_manager.js.map