"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space.DataAccess
 */
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const node_opcua_variant_1 = require("node-opcua-variant");
const ua_variable_1 = require("../ua_variable");
const ua_data_item_1 = require("./ua_data_item");
function validate_value_range(range, variant) {
    if (variant.value < range.low || variant.value > range.high) {
        return false;
    }
    return true;
}
class UAAnalogItem extends ua_data_item_1.UADataItem {
    // -- Data Item
    isValueInRange(value) {
        node_opcua_assert_1.assert(value instanceof node_opcua_variant_1.Variant);
        // test dataType
        if (!this._validate_DataType(value.dataType)) {
            return node_opcua_status_code_1.StatusCodes.BadTypeMismatch;
        }
        // AnalogDataItem
        if (this.instrumentRange) {
            if (!validate_value_range(this.instrumentRange.readValue().value.value, value)) {
                return node_opcua_status_code_1.StatusCodes.BadOutOfRange;
            }
        }
        return node_opcua_status_code_1.StatusCodes.Good;
    }
}
exports.UAAnalogItem = UAAnalogItem;
ua_variable_1.UAVariable.prototype.isValueInRange = UAAnalogItem.prototype.isValueInRange;
//# sourceMappingURL=ua_analog_item.js.map