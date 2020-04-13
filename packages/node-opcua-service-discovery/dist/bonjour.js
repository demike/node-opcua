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
 * @module node-opcua-service-discovery
 */
// tslint:disable:no-console
const bonjour = require("bonjour");
const _ = require("underscore");
const util_1 = require("util");
const util_2 = require("util");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_debug_1 = require("node-opcua-debug");
const debugLog = node_opcua_debug_1.make_debugLog(__filename);
const doDebug = node_opcua_debug_1.checkDebugFlag(__filename);
let gBonjour;
let gBonjourRefCount = 0;
function acquireBonjour() {
    if (gBonjourRefCount === 0) {
        // will start the Bonjour service
        gBonjour = bonjour();
    }
    gBonjourRefCount++;
    return gBonjour;
}
exports.acquireBonjour = acquireBonjour;
function releaseBonjour() {
    gBonjourRefCount--;
    node_opcua_assert_1.assert(gBonjourRefCount >= 0);
    if (gBonjourRefCount === 0) {
        // will start the Bonjour service
        gBonjour.destroy();
        gBonjour = undefined;
    }
}
exports.releaseBonjour = releaseBonjour;
function sameAnnouncement(a, b) {
    return a.port === b.port &&
        a.path === b.path &&
        a.name === b.name &&
        a.capabilities.join(" ") === b.capabilities.join(" ");
}
exports.sameAnnouncement = sameAnnouncement;
function _announceServerOnMulticastSubnet(multicastDNS, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const port = options.port;
        node_opcua_assert_1.assert(_.isNumber(port));
        node_opcua_assert_1.assert(multicastDNS, "bonjour must have been initialized?");
        const params = {
            name: options.name,
            port,
            protocol: "tcp",
            txt: {
                caps: options.capabilities.join(","),
                path: options.path
            },
            type: "opcua-tcp"
        };
        const service = multicastDNS.publish(params);
        service.on("error", (err) => {
            debugLog("bonjour ERROR received ! ", err.message);
            debugLog("params = ", params);
        });
        // istanbul ignore next
        if (doDebug) {
            debugLog("Announcing ", params.name, "on port ", port, " txt ", JSON.stringify(params.txt));
        }
        service.start();
        return service;
    });
}
exports._announceServerOnMulticastSubnet = _announceServerOnMulticastSubnet;
class BonjourHolder {
    _announcedOnMulticastSubnet(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._service && this.announcement) {
                // verify that Announcement has changed
                if (sameAnnouncement(options, this.announcement)) {
                    debugLog(" Announcement ignored as it has been already made", options.name);
                    return false; // nothing changed
                }
            }
            node_opcua_assert_1.assert(!this._multicastDNS, "already called ?");
            this._multicastDNS = acquireBonjour();
            this._service = yield _announceServerOnMulticastSubnet(this._multicastDNS, options);
            this.announcement = options;
            return true;
        });
    }
    _announcedOnMulticastSubnetWithCallback(options, callback) {
        callback(new Error("Internal Error"));
    }
    _stop_announcedOnMulticastSubnet() {
        return __awaiter(this, void 0, void 0, function* () {
            debugLog("_stop_announcedOnMulticastSubnet = ");
            if (this._service) {
                // due to a wrong declaration of Service.stop in the d.ts file we
                // need to use a workaround here
                const this_service = this._service;
                this._service = undefined;
                this._multicastDNS = undefined;
                this.announcement = undefined;
                const proxy = (callback) => {
                    this_service.stop(() => {
                        callback();
                    });
                };
                const stop = util_2.promisify(proxy);
                yield stop.call(this);
                releaseBonjour();
                debugLog("stop announcement completed");
            }
        });
    }
    _stop_announcedOnMulticastSubnetWithCallback(callback) {
        callback(new Error("Internal Error"));
    }
}
exports.BonjourHolder = BonjourHolder;
BonjourHolder.prototype._announcedOnMulticastSubnetWithCallback =
    util_1.callbackify(BonjourHolder.prototype._announcedOnMulticastSubnet);
BonjourHolder.prototype._stop_announcedOnMulticastSubnetWithCallback =
    util_1.callbackify(BonjourHolder.prototype._stop_announcedOnMulticastSubnet);
//# sourceMappingURL=bonjour.js.map