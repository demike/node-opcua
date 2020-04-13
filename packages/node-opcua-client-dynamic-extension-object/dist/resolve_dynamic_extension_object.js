"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_opcua_binary_stream_1 = require("node-opcua-binary-stream");
const node_opcua_extension_object_1 = require("node-opcua-extension-object");
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const node_opcua_variant_1 = require("node-opcua-variant");
function resolveDynamicExtensionObjectV(opaque, extraDataType) {
    try {
        const namespaceUri = extraDataType.namespaceArray[opaque.nodeId.namespace];
        const expandedNodeId = node_opcua_nodeid_1.ExpandedNodeId.fromNodeId(opaque.nodeId, namespaceUri);
        const typeDictionary = extraDataType.getTypeDictionaryForNamespace(opaque.nodeId.namespace);
        const Constructor = extraDataType.getExtensionObjectConstructorFromBinaryEncoding(opaque.nodeId);
        const object = new Constructor();
        const stream = new node_opcua_binary_stream_1.BinaryStream(opaque.buffer);
        object.decode(stream);
        return object;
    }
    catch (err) {
        // tslint:disable-next-line:no-console
        console.log("resolveDynamicExtensionObjectV err = ", err);
        return opaque;
    }
}
function resolveDynamicExtensionObject(variant, extraDataType) {
    return __awaiter(this, void 0, void 0, function* () {
        if (variant.dataType !== node_opcua_variant_1.DataType.ExtensionObject) {
            return;
        }
        if (variant.arrayType !== node_opcua_variant_1.VariantArrayType.Scalar) {
            if (variant.value instanceof Array) {
                variant.value = variant.value.map((v) => {
                    if (!(v instanceof node_opcua_extension_object_1.OpaqueStructure)) {
                        return v;
                    }
                    const obj = resolveDynamicExtensionObjectV(v, extraDataType);
                    return obj;
                });
            }
            return;
        }
        if (!(variant.value instanceof node_opcua_extension_object_1.OpaqueStructure)) {
            return;
        }
        variant.value = resolveDynamicExtensionObjectV(variant.value, extraDataType);
    });
}
exports.resolveDynamicExtensionObject = resolveDynamicExtensionObject;
//# sourceMappingURL=resolve_dynamic_extension_object.js.map