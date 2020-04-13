"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-factory
 */
// tslint:disable:no-console
const chalk_1 = require("chalk");
const _ = require("underscore");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_debug_1 = require("node-opcua-debug");
const factories_baseobject_1 = require("./factories_baseobject");
const debugLog = node_opcua_debug_1.make_debugLog(__filename);
const doDebug = node_opcua_debug_1.checkDebugFlag(__filename);
class DataTypeFactory {
    constructor(baseDataFactories) {
        this.imports = [];
        this._structureTypeConstructorByNameMap = {};
        this._structureTypeConstructorByEncodingNodeIdMap = {};
        this.defaultByteOrder = "LittleEndian";
        this.targetNamespace = "";
        this.baseDataFactories = baseDataFactories;
    }
    registerFactory(typeName, constructor) {
        /* istanbul ignore next */
        if (this.hasStructuredType(typeName)) {
            console.log(this.getStructureTypeConstructor(typeName));
            console.log("target namespace =", this.targetNamespace);
            throw new Error(" registerFactory  : " + typeName + " already registered");
        }
        this._structureTypeConstructorByNameMap[typeName] = constructor;
        Object.defineProperty(constructor.schema, "$typeDictionary", {
            enumerable: false,
            writable: false,
            value: this
        });
    }
    getStructureTypeConstructor(typeName) {
        const constructor = this._structureTypeConstructorByNameMap[typeName];
        if (constructor) {
            return constructor;
        }
        for (const factory of this.baseDataFactories) {
            const constructor2 = factory.getStructureTypeConstructor(typeName);
            if (constructor2) {
                return constructor2;
            }
        }
        throw new Error("Cannot find StructureType constructor for " + typeName);
    }
    hasStructuredType(typeName) {
        const flag = !!this._structureTypeConstructorByNameMap[typeName];
        if (flag) {
            return true;
        }
        for (const factory of this.baseDataFactories) {
            const flag2 = factory.hasStructuredType(typeName);
            if (flag2) {
                return true;
            }
        }
        return false;
    }
    getStructuredTypeSchema(typeName) {
        const constructor = this.getStructureTypeConstructor(typeName);
        return constructor.schema;
    }
    dump() {
        console.log(" dumping registered factories");
        console.log(" Factory ", Object.keys(this._structureTypeConstructorByNameMap)
            .sort().forEach((e) => e));
        console.log(" done");
    }
    registerClassDefinition(className, classConstructor) {
        this.registerFactory(className, classConstructor);
        const expandedNodeId = classConstructor.encodingDefaultBinary;
        this.associateWithBinaryEncoding(className, expandedNodeId);
    }
    associateWithBinaryEncoding(className, expandedNodeId) {
        const classConstructor = this.getStructureTypeConstructor(className);
        if (doDebug) {
            debugLog(" associateWithBinaryEncoding ", className, expandedNodeId.toString());
        }
        /* istanbul ignore next */
        if (!verifyExpandedNodeId(expandedNodeId)) {
            throw new Error("Invalid expandedNodeId");
        }
        const expandedNodeIdKey = makeExpandedNodeIdKey(expandedNodeId);
        /* istanbul ignore next */
        if (expandedNodeIdKey in this._structureTypeConstructorByEncodingNodeIdMap) {
            throw new Error(" Class " + className + " with ID " + expandedNodeId +
                "  already in constructorMap for  " + this._structureTypeConstructorByEncodingNodeIdMap[expandedNodeIdKey].name);
        }
        this._structureTypeConstructorByEncodingNodeIdMap[expandedNodeIdKey] = classConstructor;
    }
    getConstructor(expandedNodeId) {
        const expandedNodeIdKey = makeExpandedNodeIdKey(expandedNodeId);
        const constructor = this._structureTypeConstructorByEncodingNodeIdMap[expandedNodeIdKey];
        if (constructor) {
            return constructor;
        }
        for (const factory of this.baseDataFactories) {
            const constructor2 = factory.getConstructor(expandedNodeId);
            if (constructor2) {
                return constructor2;
            }
        }
        debugLog(chalk_1.default.red("#getConstructor : cannot find constructor for expandedId "), expandedNodeId.toString());
        return null;
    }
    hasConstructor(expandedNodeId) {
        if (!expandedNodeId) {
            return false;
        }
        /* istanbul ignore next */
        if (!verifyExpandedNodeId(expandedNodeId)) {
            console.log("Invalid expandedNodeId");
            return false;
        }
        const expandedNodeIdKey = makeExpandedNodeIdKey(expandedNodeId);
        const constructor = this._structureTypeConstructorByEncodingNodeIdMap[expandedNodeIdKey];
        if (constructor) {
            return true;
        }
        for (const factory of this.baseDataFactories) {
            const constructor2 = factory.getConstructor(expandedNodeId);
            if (constructor2) {
                return true;
            }
        }
        return false;
    }
    constructObject(expandedNodeId) {
        if (!verifyExpandedNodeId(expandedNodeId)) {
            throw new Error(" constructObject : invalid expandedNodeId provided " + expandedNodeId.toString());
        }
        const constructor = this.getConstructor(expandedNodeId);
        if (!constructor) {
            debugLog("Cannot find constructor for " + expandedNodeId.toString());
            return new factories_baseobject_1.BaseUAObject();
            // throw new Error("Cannot find constructor for " + expandedNodeId.toString());
        }
        return callConstructor(constructor);
    }
}
exports.DataTypeFactory = DataTypeFactory;
function verifyExpandedNodeId(expandedNodeId) {
    /* istanbul ignore next */
    if (expandedNodeId.value instanceof Buffer) {
        throw new Error("getConstructor not implemented for opaque nodeid");
    }
    if (expandedNodeId.namespace === 0) {
        if (expandedNodeId.namespaceUri === "http://opcfoundation.org/UA/" || !expandedNodeId.namespaceUri) {
            return true;
        }
        // When namespace is ZERO, namepaceUri must be "http://opcfoundation.org/UA/"  or nothing
        return false;
    }
    else {
        // expandedNodeId.namespace  !==0
        // in this case a valid expandedNodeId.namespaceUri  must be provided
        return !!expandedNodeId.namespaceUri && expandedNodeId.namespaceUri.length > 2;
    }
}
function makeExpandedNodeIdKey(expandedNodeId) {
    if (expandedNodeId.namespace === 0) {
        return expandedNodeId.value.toString();
    }
    return expandedNodeId.namespaceUri + "@" + expandedNodeId.value.toString();
}
function callConstructor(constructor) {
    node_opcua_assert_1.assert(_.isFunction(constructor));
    const constructorFunc = constructor.bind.apply(constructor, arguments);
    return new constructorFunc();
}
exports.callConstructor = callConstructor;
//# sourceMappingURL=datatype_factory.js.map