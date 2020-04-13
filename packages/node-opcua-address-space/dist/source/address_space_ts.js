"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:max-classes-per-file
/**
 * @module node-opcua-address-space
 */
const events_1 = require("events");
var EUEngineeringUnit;
(function (EUEngineeringUnit) {
    EUEngineeringUnit[EUEngineeringUnit["degree_celsius"] = 0] = "degree_celsius";
    // to be continued
})(EUEngineeringUnit = exports.EUEngineeringUnit || (exports.EUEngineeringUnit = {}));
const address_space_1 = require("../src/address_space");
class AddressSpace {
    constructor() {
        /* empty */
    }
    static create() {
        return new address_space_1.AddressSpace();
    }
}
exports.AddressSpace = AddressSpace;
var load_nodeset2_1 = require("./loader/load_nodeset2");
exports.generateAddressSpace = load_nodeset2_1.generateAddressSpace;
//# sourceMappingURL=address_space_ts.js.map