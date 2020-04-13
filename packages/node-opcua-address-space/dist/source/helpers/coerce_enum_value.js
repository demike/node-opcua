"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space
 */
const node_opcua_assert_1 = require("node-opcua-assert");
const _ = require("underscore");
const node_opcua_common_1 = require("node-opcua-common");
const node_opcua_data_model_1 = require("node-opcua-data-model");
function coerceEnumValues(enumValues) {
    if (_.isArray(enumValues)) {
        //
        return _.map(enumValues, (en) => {
            node_opcua_assert_1.assert(en.hasOwnProperty("value"));
            node_opcua_assert_1.assert(en.hasOwnProperty("displayName"));
            return new node_opcua_common_1.EnumValueType({
                displayName: node_opcua_data_model_1.coerceLocalizedText(en.displayName),
                value: en.value,
            });
        });
    }
    else {
        return coerceEnumValues(_.map(enumValues, (value, key) => {
            return new node_opcua_common_1.EnumValueType({
                description: node_opcua_data_model_1.coerceLocalizedText(key),
                displayName: node_opcua_data_model_1.coerceLocalizedText(key),
                value,
            });
        }));
    }
}
exports.coerceEnumValues = coerceEnumValues;
//# sourceMappingURL=coerce_enum_value.js.map