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
const node_opcua_extension_object_1 = require("node-opcua-extension-object");
const node_opcua_variant_1 = require("node-opcua-variant");
const client_dynamic_extension_object_1 = require("./client_dynamic_extension_object");
const extra_data_type_manager_1 = require("./extra_data_type_manager");
const resolve_dynamic_extension_object_1 = require("./resolve_dynamic_extension_object");
function getExtraDataTypeManager(session) {
    return __awaiter(this, void 0, void 0, function* () {
        const sessionPriv = session;
        if (!sessionPriv.$$extraDataTypeManager) {
            const extraDataTypeManager = new extra_data_type_manager_1.ExtraDataTypeManager();
            yield client_dynamic_extension_object_1.extractNamespaceDataType(session, extraDataTypeManager);
            sessionPriv.$$extraDataTypeManager = extraDataTypeManager;
        }
        return sessionPriv.$$extraDataTypeManager;
    });
}
exports.getExtraDataTypeManager = getExtraDataTypeManager;
function promoteOpaqueStructure(session, dataValues) {
    return __awaiter(this, void 0, void 0, function* () {
        // count number of Opaque Structures
        const dataValuesToFix = dataValues.filter((dataValue) => dataValue.value.dataType === node_opcua_variant_1.DataType.ExtensionObject &&
            dataValue.value.value instanceof node_opcua_extension_object_1.OpaqueStructure);
        if (dataValuesToFix.length === 0) {
            return;
        }
        // construct dataTypeManager if not already present
        const extraDataTypeManager = yield getExtraDataTypeManager(session);
        const promises = dataValuesToFix.map((dataValue) => __awaiter(this, void 0, void 0, function* () {
            resolve_dynamic_extension_object_1.resolveDynamicExtensionObject(dataValue.value, extraDataTypeManager);
        }));
        yield Promise.all(promises);
    });
}
exports.promoteOpaqueStructure = promoteOpaqueStructure;
//# sourceMappingURL=promote_opaque_structure.js.map