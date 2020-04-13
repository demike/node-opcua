"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space
 */
const fs = require("fs");
const path = require("path");
function getAddressSpaceFixture(pathname) {
    // find test_fixtures
    let folder = path.join(__dirname, "./test_fixtures");
    if (!fs.existsSync(folder)) {
        folder = path.join(__dirname, "../test_helpers/test_fixtures");
        if (!fs.existsSync(folder)) {
            folder = path.join(__dirname, "../../test_helpers/test_fixtures");
            // istanbul ignore next
            if (!fs.existsSync(folder)) {
                // tslint:disable:no-console
                console.log(" cannot find test_fixtures folder ");
            }
        }
    }
    const filename = path.join(folder, pathname);
    // istanbul ignore next
    if (!fs.existsSync(filename)) {
        throw new Error(" cannot find fixture with name " + pathname);
    }
    return filename;
}
exports.getAddressSpaceFixture = getAddressSpaceFixture;
//# sourceMappingURL=get_address_space_fixture.js.map