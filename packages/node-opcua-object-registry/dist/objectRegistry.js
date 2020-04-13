"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-object-registry
 */
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_debug_1 = require("node-opcua-debug");
const _ = require("underscore");
const gRegistries = [];
let hashCounter = 1;
class ObjectRegistry {
    constructor(objectType) {
        this._objectType = objectType;
        this._cache = {};
        gRegistries.push(this);
    }
    getClassName() {
        return this._objectType ? this._objectType.name : "<???>";
    }
    register(obj) {
        if (!this._objectType) {
            this._objectType = obj.constructor;
        }
        if (!obj._____hash) {
            obj._____hash = hashCounter;
            hashCounter += 1;
            this._cache[obj._____hash] = obj;
        }
        // istanbul ignore next
        if (ObjectRegistry.doDebug) {
            obj._____trace = node_opcua_debug_1.trace_from_this_projet_only();
        }
    }
    unregister(obj) {
        this._cache[obj._____hash] = null;
        delete this._cache[obj._____hash];
    }
    count() {
        return Object.keys(this._cache).length;
    }
    toString() {
        const className = this.getClassName();
        let str = " className :" + className + " found => " + this.count() + " object leaking\n";
        _.forEach(this._cache, (obj /*,key*/) => {
            str += obj.constructor.name + " " + obj.toString() + "\n";
        });
        if (ObjectRegistry.doDebug) {
            _.forEach(this._cache, (obj, key) => {
                const cachedObject = this._cache[key];
                node_opcua_assert_1.assert(cachedObject.hasOwnProperty("_____trace"));
                str += "   " + key + cachedObject._____trace + "\n";
            });
        }
        return str;
    }
}
exports.ObjectRegistry = ObjectRegistry;
ObjectRegistry.doDebug = false;
ObjectRegistry.registries = gRegistries;
//# sourceMappingURL=objectRegistry.js.map