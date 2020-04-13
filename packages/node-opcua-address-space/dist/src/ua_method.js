"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space
 */
// tslint:disable:no-console
const chalk_1 = require("chalk");
const node_opcua_assert_1 = require("node-opcua-assert");
const _ = require("underscore");
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_data_model_2 = require("node-opcua-data-model");
const node_opcua_data_value_1 = require("node-opcua-data-value");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const node_opcua_variant_1 = require("node-opcua-variant");
const node_opcua_variant_2 = require("node-opcua-variant");
const base_node_1 = require("./base_node");
const base_node_private_1 = require("./base_node_private");
const namespace_1 = require("./namespace");
function default_check_valid_argument(arg) {
    return arg.constructor.name === "Argument";
    /*
        var Argument  = require("./_generated_/_auto_generated_Argument").Argument;
        return arg instanceof Argument
    */
}
class UAMethod extends base_node_1.BaseNode {
    constructor(options) {
        super(options);
        this.nodeClass = node_opcua_data_model_2.NodeClass.Method;
        this.value = options.value;
        this.methodDeclarationId = options.methodDeclarationId;
    }
    static checkValidArgument(args) {
        return default_check_valid_argument(args);
    }
    get typeDefinitionObj() {
        return super.typeDefinitionObj;
    }
    get parent() {
        return super.parent;
    }
    getExecutableFlag(context) {
        if (!_.isFunction(this._asyncExecutionFunction)) {
            return false;
        }
        if (this._getExecutableFlag) {
            return this._getExecutableFlag(context);
        }
        return true;
    }
    readAttribute(context, attributeId) {
        const options = {};
        switch (attributeId) {
            case node_opcua_data_model_1.AttributeIds.Executable:
                options.value = { dataType: node_opcua_variant_2.DataType.Boolean, value: this.getExecutableFlag(context) };
                options.statusCode = node_opcua_status_code_1.StatusCodes.Good;
                break;
            case node_opcua_data_model_1.AttributeIds.UserExecutable:
                options.value = { dataType: node_opcua_variant_2.DataType.Boolean, value: this.getExecutableFlag(context) };
                options.statusCode = node_opcua_status_code_1.StatusCodes.Good;
                break;
            default:
                return base_node_1.BaseNode.prototype.readAttribute.call(this, context, attributeId);
        }
        return new node_opcua_data_value_1.DataValue(options);
    }
    getInputArguments() {
        return this._getArguments("InputArguments");
    }
    getOutputArguments() {
        return this._getArguments("OutputArguments");
    }
    bindMethod(async_func) {
        node_opcua_assert_1.assert(_.isFunction(async_func));
        this._asyncExecutionFunction = async_func;
    }
    execute(inputArguments, context, callback) {
        if (!callback) {
            throw new Error("execute need to be promisified");
        }
        node_opcua_assert_1.assert(inputArguments === null || _.isArray(inputArguments));
        inputArguments = inputArguments || [];
        inputArguments = inputArguments.map(node_opcua_variant_1.Variant.coerce);
        node_opcua_assert_1.assert(inputArguments.length === 0 || inputArguments[0] instanceof node_opcua_variant_1.Variant);
        node_opcua_assert_1.assert(_.isObject(context));
        node_opcua_assert_1.assert(_.isFunction(callback));
        // a context object must be provided
        if (!context.object) {
            context.object = this.parent;
        }
        node_opcua_assert_1.assert(context.object instanceof base_node_1.BaseNode);
        if (!this._asyncExecutionFunction) {
            console.log("Method " + this.nodeId.toString() + " " + this.browseName.toString() + "_ has not been bound");
            return callback(null, { statusCode: node_opcua_status_code_1.StatusCodes.BadInternalError });
        }
        if (!this.getExecutableFlag(context)) {
            console.log("Method " + this.nodeId.toString() + " " + this.browseName.toString() + "_ is not executable");
            // todo : find the correct Status code to return here
            return callback(null, { statusCode: node_opcua_status_code_1.StatusCodes.BadMethodInvalid });
        }
        // verify that input arguments are correct
        // todo :
        const inputArgumentResults = [];
        const inputArgumentDiagnosticInfos = [];
        try {
            this._asyncExecutionFunction.call(this, inputArguments, context, (err, callMethodResult) => {
                if (err) {
                    console.log(err.message);
                    console.log(err);
                }
                callMethodResult = callMethodResult || {};
                callMethodResult.statusCode = callMethodResult.statusCode || node_opcua_status_code_1.StatusCodes.Good;
                callMethodResult.outputArguments = callMethodResult.outputArguments || [];
                callMethodResult.inputArgumentResults = inputArgumentResults;
                callMethodResult.inputArgumentDiagnosticInfos = inputArgumentDiagnosticInfos;
                // verify that output arguments are correct according to schema
                // Todo : ...
                const outputArgsDef = this.getOutputArguments();
                // xx assert(outputArgsDef.length === callMethodResponse.outputArguments.length,
                // xx     "_asyncExecutionFunction did not provide the expected number of output arguments");
                // to be continued ...
                callback(err, callMethodResult);
            });
        }
        catch (err) {
            // tslint:disable:no-console
            console.log(chalk_1.default.red("ERR in method  handler"), err.message);
            console.error(err.stack);
            const callMethodResponse = { statusCode: node_opcua_status_code_1.StatusCodes.BadInternalError };
            callback(err, callMethodResponse);
        }
    }
    clone(options, optionalFilter, extraInfo) {
        node_opcua_assert_1.assert(!options.componentOf || options.componentOf, "trying to create an orphan method ?");
        options = options || {};
        options = _.extend(_.clone(options), {
            methodDeclarationId: this.nodeId
        });
        options.references = options.references || [];
        const addressSpace = this.addressSpace;
        namespace_1._handle_hierarchy_parent(addressSpace, options.references, options);
        const clonedMethod = base_node_private_1._clone.call(this, UAMethod, options, optionalFilter, extraInfo);
        clonedMethod._asyncExecutionFunction = this._asyncExecutionFunction;
        clonedMethod._getExecutableFlag = this._getExecutableFlag;
        if (options.componentOf) {
            const m = options.componentOf.getMethodByName(clonedMethod.browseName.name);
            node_opcua_assert_1.assert(m);
        }
        return clonedMethod;
    }
    _getArguments(name) {
        node_opcua_assert_1.assert(name === "InputArguments" || name === "OutputArguments");
        const argsVariable = this.getPropertyByName(name);
        if (!argsVariable) {
            return [];
        }
        node_opcua_assert_1.assert(argsVariable.nodeClass === node_opcua_data_model_2.NodeClass.Variable);
        const args = argsVariable.readValue().value.value;
        // a list of extension object
        node_opcua_assert_1.assert(_.isArray(args));
        node_opcua_assert_1.assert(args.length === 0 || UAMethod.checkValidArgument(args[0]));
        return args;
    }
}
exports.UAMethod = UAMethod;
// tslint:disable:no-var-requires
// tslint:disable:max-line-length
const thenify = require("thenify");
UAMethod.prototype.execute = thenify.withCallback(UAMethod.prototype.execute);
//# sourceMappingURL=ua_method.js.map