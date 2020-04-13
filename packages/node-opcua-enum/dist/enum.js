"use strict";
/**
 * @module node-opcua-enum
 *
 */
// tslint:disable:no-bitwise
// tslint:disable:max-classes-per-file
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Represents an Item of an Enum.
 *
 * @class Enum
 */
class EnumItem {
    /**
     *
     * @param key the enum key
     * @param value the enum value
     */
    constructor(key, value) {
        this.key = key;
        this.value = value;
    }
    /**
     * Checks if the EnumItem is the same as the passing object.
     * @method is
     * @param  {EnumItem | String | Number} item The object to check with.
     * @return {Boolean}                          The check result.
     */
    is(item) {
        if (item instanceof EnumItem) {
            return this.value === item.value;
        }
        else if (typeof item === "string") {
            return this.key === item;
        }
        else {
            return this.value === item;
        }
    }
    /**
     * Checks if the flagged EnumItem has the passing object.
     * @method has
     * @param  {EnumItem | String |Number} value The object to check with.
     * @return {Boolean}                            The check result.
     */
    has(value) {
        if (value instanceof EnumItem) {
            return (value.value & this.value) !== 0;
        }
        else if (typeof value === "string") {
            return this.key.indexOf(value) >= 0;
        }
        else {
            return (value & this.value) !== 0;
        }
    }
    /**
     * Returns String representation of this EnumItem.
     * @method toString
     * @return {String} String representation of this EnumItem.
     */
    toString() {
        return this.key;
    }
    /**
     * Returns JSON object representation of this EnumItem.
     * @method toJSON
     * @return {String} JSON object representation of this EnumItem.
     */
    toJSON() {
        return this.key;
    }
    /**
     * Returns the value to compare with.
     * @method valueOf
     * @return {String} The value to compare with.
     */
    valueOf() {
        return this.value;
    }
}
exports.EnumItem = EnumItem;
// check if enum is flaggable
function checkIsFlaggable(enums) {
    for (const e of enums) {
        if (!(e.value !== 0 && !(e.value & e.value - 1))) {
            return false;
        }
    }
    return true;
}
/**
 * @class Enum
 * @constructor
 * Represents an Enum with enum items.
 * @param {Array || Object}  map     This are the enum items.
 */
class Enum {
    constructor(map) {
        this.enumItems = [];
        let mm = null;
        let isFlaggable = null;
        if (Array.isArray(map)) {
            // create map as flaggable enum
            mm = {};
            for (let i = 0; i < map.length; i++) {
                mm[map[i]] = 1 << i;
            }
            isFlaggable = true;
        }
        else {
            mm = map;
        }
        for (const key of Object.keys(mm)) {
            const val = mm[key];
            if (undefined === val) {
                continue;
            }
            const kv = new EnumItem(key, val);
            const pThis = this;
            pThis[key] = kv;
            pThis[val] = kv;
            this.enumItems.push(kv);
        }
        if (!isFlaggable) {
            isFlaggable = checkIsFlaggable(this.enumItems);
        }
        this._isFlaggable = isFlaggable;
    }
    /**
     * Returns the appropriate EnumItem.
     * @method get
     * @param  key The object to get with.
     * @return the get result.
     */
    get(key) {
        const pThis = this;
        if (key instanceof EnumItem) {
            if (!pThis[key.key]) {
                throw new Error("Invalid key");
            }
            return key;
        }
        if (key === null || key === undefined) {
            return null;
        }
        const prop = pThis[key];
        if (prop) {
            return prop;
        }
        else if (this._isFlaggable) {
            if (typeof key === "string") {
                return this._getByString(key);
            }
            else if (typeof key === "number") {
                return this._getByNum(key);
            }
        }
        return null;
    }
    getDefaultValue() {
        return this.enumItems[0];
    }
    toString() {
        return this.enumItems.join(" , ");
    }
    _getByString(key) {
        const pThis = this;
        const parts = key.split(" | ");
        let val = 0;
        for (const part of parts) {
            const item = pThis[part];
            if (undefined === item) {
                return null;
            }
            val |= item.value;
        }
        const kv = new EnumItem(key, val);
        // add in cache for later
        let prop = pThis[val];
        if (prop === undefined) {
            pThis[val] = kv;
        }
        prop = pThis[key];
        if (prop === undefined) {
            pThis[key] = kv;
        }
        return kv;
    }
    _getByNum(key) {
        if (key === 0) {
            return null;
        }
        const pThis = this;
        let name;
        let c = 1;
        for (let i = 0; c < key; i++) {
            if ((c & key) === c) {
                const item = pThis[c];
                if (undefined === item) {
                    return null;
                }
                if (name) {
                    name = name + " | " + item.key;
                }
                else {
                    name = item.key;
                }
            }
            c *= 2;
        }
        const kv = new EnumItem(name, key);
        // add in cache for later
        pThis[name] = kv;
        pThis[key] = kv;
        return kv;
    }
}
exports.Enum = Enum;
//# sourceMappingURL=enum.js.map