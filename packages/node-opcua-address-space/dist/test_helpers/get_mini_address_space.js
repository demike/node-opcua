"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space
 */
const node_opcua_assert_1 = require("node-opcua-assert");
const source_1 = require("../source");
const get_address_space_fixture_1 = require("./get_address_space_fixture");
exports.mini_nodeset = "mini.Node.Set2.xml";
exports.empty_nodeset = "fixture_empty_nodeset2.xml";
exports.get_mini_nodeset_filename = () => get_address_space_fixture_1.getAddressSpaceFixture(exports.mini_nodeset);
exports.get_empty_nodeset_filename = () => get_address_space_fixture_1.getAddressSpaceFixture(exports.empty_nodeset);
// tslint:disable:no-var-requires
// tslint:disable:max-line-length
const thenify = require("thenify");
function getMiniAddressSpace(...args) {
    const callback = args[0];
    const addressSpace = source_1.AddressSpace.create();
    // register namespace 1 (our namespace);
    const serverNamespace = addressSpace.registerNamespace("http://MYNAMESPACE");
    node_opcua_assert_1.assert(serverNamespace.index === 1);
    source_1.generateAddressSpace(addressSpace, exports.get_mini_nodeset_filename(), (err) => {
        // istanbul ignore next
        if (err) {
            // tslint:disable:no-console
            console.log("err =", err);
        }
        callback(err || null, addressSpace);
    });
}
exports.getMiniAddressSpace = getMiniAddressSpace;
module.exports.getMiniAddressSpace = thenify.withCallback(module.exports.getMiniAddressSpace);
//# sourceMappingURL=get_mini_address_space.js.map