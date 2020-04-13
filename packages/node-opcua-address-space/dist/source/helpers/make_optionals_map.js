"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space
 */
const node_opcua_assert_1 = require("node-opcua-assert");
/**
 * @method makeOptionalsMap
 * @param optionals
 * transform  optional into a map
 * @internal
 */
function makeOptionalsMap(optionals) {
    const resultMap = {};
    if (!optionals) {
        return resultMap;
    }
    node_opcua_assert_1.assert(optionals instanceof Array);
    function insertInMap(map, s) {
        const key = s[0];
        if (!map[key]) {
            map[key] = {};
        }
        if (s.length > 1) {
            insertInMap(map[key], s.splice(1));
        }
    }
    for (const opt of optionals) {
        const s = opt.split(".");
        insertInMap(resultMap, s);
    }
    return resultMap;
}
exports.makeOptionalsMap = makeOptionalsMap;
//# sourceMappingURL=make_optionals_map.js.map