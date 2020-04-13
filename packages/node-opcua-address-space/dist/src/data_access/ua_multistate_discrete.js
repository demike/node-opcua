"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space.DataAccess
 */
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const node_opcua_variant_1 = require("node-opcua-variant");
const node_opcua_variant_2 = require("node-opcua-variant");
const _ = require("underscore");
const ua_variable_1 = require("../ua_variable");
/**
 * @class UAMultiStateDiscrete
 */
class UAMultiStateDiscrete extends ua_variable_1.UAVariable {
    getValue() {
        return this.readValue().value.value;
    }
    getValueAsString() {
        const index = this.getValue();
        const arr = this.enumStrings.readValue().value.value;
        node_opcua_assert_1.assert(_.isArray(arr));
        return arr[index].text.toString();
    }
    getIndex(value) {
        const arr = this.enumStrings.readValue().value.value;
        node_opcua_assert_1.assert(_.isArray(arr));
        const index = arr.findIndex((a) => a.text === value);
        return index;
    }
    setValue(value) {
        if (typeof (value) === "string") {
            const index = this.getIndex(value);
            if (index < 0) {
                throw new Error("UAMultiStateDiscrete#setValue invalid multi state value provided : " + value);
            }
            return this.setValue(index);
        }
        const arrayEnumStrings = this.enumStrings.readValue().value.value;
        if (value >= arrayEnumStrings.length) {
            throw new Error("UAMultiStateDiscrete#setValue BadOutOfRange " + value);
        }
        node_opcua_assert_1.assert(_.isFinite(value));
        return this.setValueFromSource(new node_opcua_variant_2.Variant({ dataType: node_opcua_variant_1.DataType.UInt32, value }));
    }
    isValueInRange(value) {
        if (this.enumStrings) {
            const arrayEnumStrings = this.enumStrings.readValue().value.value;
            // MultiStateDiscreteType
            node_opcua_assert_1.assert(value.dataType === node_opcua_variant_1.DataType.UInt32);
            if (value.value >= arrayEnumStrings.length) {
                return node_opcua_status_code_1.StatusCodes.BadOutOfRange;
            }
        }
        return node_opcua_status_code_1.StatusCodes.Good;
    }
    _post_initialize() {
        /* empty */
    }
    clone(options1, optionalFilter, extraInfo) {
        const variable1 = ua_variable_1.UAVariable.prototype.clone.call(this, options1, optionalFilter, extraInfo);
        return promoteToMultiStateDiscrete(variable1);
    }
}
exports.UAMultiStateDiscrete = UAMultiStateDiscrete;
function promoteToMultiStateDiscrete(node) {
    if (node instanceof UAMultiStateDiscrete) {
        return node; // already promoted
    }
    Object.setPrototypeOf(node, UAMultiStateDiscrete.prototype);
    node_opcua_assert_1.assert(node instanceof UAMultiStateDiscrete, "should now  be a State Machine");
    node._post_initialize();
    return node;
}
exports.promoteToMultiStateDiscrete = promoteToMultiStateDiscrete;
//# sourceMappingURL=ua_multistate_discrete.js.map