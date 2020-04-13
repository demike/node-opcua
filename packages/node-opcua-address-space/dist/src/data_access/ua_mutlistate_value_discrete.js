"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space.DataAccess
 */
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_variant_1 = require("node-opcua-variant");
const node_opcua_basic_types_1 = require("node-opcua-basic-types");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const node_opcua_data_model_1 = require("node-opcua-data-model");
const ua_variable_1 = require("../ua_variable");
function install_synchronisation(variable) {
    variable.on("value_changed", (value) => {
        const valueAsTextNode = variable.valueAsText || variable.getComponentByName("ValueAsText");
        if (!valueAsTextNode) {
            return;
        }
        const valueAsText1 = variable._findValueAsText(value.value.value);
        valueAsTextNode.setValueFromSource(valueAsText1);
    });
    variable.emit("value_changed", variable.readValue());
}
class UAMultiStateValueDiscrete extends ua_variable_1.UAVariable {
    setValue(value) {
        if (typeof value === "string") {
            const enumValues = this.enumValues.readValue().value.value;
            const selected = enumValues.filter((a) => a.displayName.text === value)[0];
            if (selected) {
                this._setValue(selected.value);
            }
            else {
                throw new Error("cannot find enum string " + value + " in " + enumValues.toString());
            }
        }
        else {
            this._setValue(node_opcua_basic_types_1.coerceUInt64(value));
        }
    }
    getValueAsString() {
        return this.valueAsText.readValue().value.value.text;
    }
    getValueAsNumber() {
        return this.readValue().value.value;
    }
    isValueInRange(value) {
        if (this.enumValues) {
            if (!this._isValueInRange(node_opcua_basic_types_1.coerceInt32(value.value))) {
                return node_opcua_status_code_1.StatusCodes.BadOutOfRange;
            }
        }
        return node_opcua_status_code_1.StatusCodes.Good;
    }
    clone(options1, optionalFilter, extraInfo) {
        const variable1 = ua_variable_1.UAVariable.prototype.clone.call(this, options1, optionalFilter, extraInfo);
        return promoteToMultiStateValueDiscrete(variable1);
    }
    /**
     * @private
     */
    _isValueInRange(value) {
        // MultiStateValueDiscreteType
        const enumValues = this.enumValues.readValue().value.value;
        const e = enumValues.findIndex((x) => node_opcua_basic_types_1.coerceInt32(x.value) === value);
        return !(e === -1);
    }
    /**
     *
     * @private
     */
    _enumValueIndex() {
        // construct an index to quickly find a EnumValue from a value
        const enumValues = this.enumValues.readValue().value.value;
        const enumValueIndex = {};
        enumValues.forEach((e) => { enumValueIndex[e.value[1]] = e; });
        return enumValueIndex;
    }
    /**
     *
     * @private
     */
    _setValue(value) {
        // check that value is in bound
        if (!this._isValueInRange(node_opcua_basic_types_1.coerceInt32(value))) {
            throw new Error("UAMultiStateValueDiscrete#_setValue out of range " + value);
        }
        const dataType = this._getDataType();
        if (dataType === node_opcua_variant_1.DataType.Int64 || dataType === node_opcua_variant_1.DataType.UInt64) {
            this.setValueFromSource({ dataType, value });
        }
        else {
            const valueN = value[1];
            this.setValueFromSource({ dataType, value: valueN });
        }
    }
    /**
     *
     * @private
     */
    _findValueAsText(value) {
        const enumValueIndex = this._enumValueIndex();
        if (value === undefined) {
            throw new Error("Unexpected undefined value");
        }
        if (value instanceof Array) {
            value = value[1];
        }
        node_opcua_assert_1.assert(!(value instanceof node_opcua_variant_1.Variant));
        let valueAsText1 = "Invalid";
        if (enumValueIndex[value]) {
            valueAsText1 = enumValueIndex[value].displayName;
        }
        const result = new node_opcua_variant_1.Variant({
            dataType: node_opcua_variant_1.DataType.LocalizedText,
            value: node_opcua_data_model_1.coerceLocalizedText(valueAsText1)
        });
        return result;
    }
    _getDataType() {
        const dataTypeStr = node_opcua_variant_1.DataType[this.dataType.value];
        return node_opcua_variant_1.DataType[dataTypeStr];
    }
    /**
     *
     * @private
     */
    _post_initialize() {
        // find the enum value type
        install_synchronisation(this);
    }
}
exports.UAMultiStateValueDiscrete = UAMultiStateValueDiscrete;
function promoteToMultiStateValueDiscrete(node) {
    if (node instanceof UAMultiStateValueDiscrete) {
        return node; // already promoted
    }
    Object.setPrototypeOf(node, UAMultiStateValueDiscrete.prototype);
    node_opcua_assert_1.assert(node instanceof UAMultiStateValueDiscrete, "should now  be a State Machine");
    node._post_initialize();
    return node;
}
exports.promoteToMultiStateValueDiscrete = promoteToMultiStateValueDiscrete;
//# sourceMappingURL=ua_mutlistate_value_discrete.js.map