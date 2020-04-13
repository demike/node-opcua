"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-hostname
 */
const dns = require("dns");
const os = require("os");
const util_1 = require("util");
function trim(str, length) {
    if (!length) {
        return str;
    }
    return str.substr(0, Math.min(str.length, length));
}
function fqdn(callback) {
    const uqdn = os.hostname();
    dns.lookup(uqdn, { hints: dns.ADDRCONFIG }, (err1, ip) => {
        if (err1) {
            return callback(err1);
        }
        dns.lookupService(ip, 0, (err2, _fqdn) => {
            if (err2) {
                return callback(err2);
            }
            _fqdn = _fqdn.replace(".localdomain", "");
            callback(null, _fqdn);
        });
    });
}
let _fullyQualifiedDomainNameInCache;
/**
 * extract FullyQualifiedDomainName of this computer
 */
function extractFullyQualifiedDomainName() {
    return __awaiter(this, void 0, void 0, function* () {
        if (_fullyQualifiedDomainNameInCache) {
            return _fullyQualifiedDomainNameInCache;
        }
        if (false && process.platform === "win32") {
            // http://serverfault.com/a/73643/251863
            const env = process.env;
            _fullyQualifiedDomainNameInCache = env.COMPUTERNAME
                + ((env.USERDNSDOMAIN && env.USERDNSDOMAIN.length > 0) ? "." + env.USERDNSDOMAIN : "");
        }
        else {
            try {
                _fullyQualifiedDomainNameInCache = yield util_1.promisify(fqdn)();
                if (/sethostname/.test(_fullyQualifiedDomainNameInCache)) {
                    throw new Error("Detecting fqdn  on windows !!!");
                }
            }
            catch (err) {
                // fall back to old method
                _fullyQualifiedDomainNameInCache = os.hostname();
            }
        }
        return _fullyQualifiedDomainNameInCache;
    });
}
exports.extractFullyQualifiedDomainName = extractFullyQualifiedDomainName;
function prepareFQDN() {
    return __awaiter(this, void 0, void 0, function* () {
        _fullyQualifiedDomainNameInCache = yield extractFullyQualifiedDomainName();
    });
}
exports.prepareFQDN = prepareFQDN;
function getFullyQualifiedDomainName(optional_max_length) {
    return _fullyQualifiedDomainNameInCache
        ? trim(_fullyQualifiedDomainNameInCache, optional_max_length)
        : "%FQDN%";
}
exports.getFullyQualifiedDomainName = getFullyQualifiedDomainName;
function resolveFullyQualifiedDomainName(str) {
    if (!str.match(/%FQDN%/)) {
        return str;
    }
    if (!_fullyQualifiedDomainNameInCache) {
        throw new Error("FullyQualifiedDomainName computation is not completed yet");
    }
    return str.replace("%FQDN%", _fullyQualifiedDomainNameInCache);
}
exports.resolveFullyQualifiedDomainName = resolveFullyQualifiedDomainName;
// note : under windows ... echo %COMPUTERNAME%.%USERDNSDOMAIN%
prepareFQDN();
//# sourceMappingURL=hostname.js.map