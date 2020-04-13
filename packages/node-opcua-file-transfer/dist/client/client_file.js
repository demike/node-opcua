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
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_service_translate_browse_path_1 = require("node-opcua-service-translate-browse-path");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const node_opcua_variant_1 = require("node-opcua-variant");
const node_opcua_debug_1 = require("node-opcua-debug");
const debugLog = node_opcua_debug_1.make_debugLog("FileType");
const errorLog = node_opcua_debug_1.make_errorLog("FileType");
const doDebug = node_opcua_debug_1.checkDebugFlag("FileType");
const open_mode_1 = require("../open_mode");
var open_mode_2 = require("../open_mode");
exports.OpenFileMode = open_mode_2.OpenFileMode;
class ClientFile {
    constructor(session, nodeId) {
        this.fileHandle = 0;
        this.session = session;
        this.fileNodeId = nodeId;
    }
    open(mode) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mode === null || mode === undefined) {
                throw new Error("expecting a validMode " + open_mode_1.OpenFileMode[mode]);
            }
            if (this.fileHandle) {
                throw new Error("File has already be opened");
            }
            yield this.ensureInitialized();
            const result = yield this.session.call({
                inputArguments: [
                    { dataType: node_opcua_variant_1.DataType.Byte, value: mode }
                ],
                methodId: this.openMethodNodeId,
                objectId: this.fileNodeId
            });
            if (result.statusCode !== node_opcua_status_code_1.StatusCodes.Good) {
                debugLog("Cannot open file : ");
                throw new Error("cannot open file statusCode = " + result.statusCode.toString() + "mode = " + open_mode_1.OpenFileMode[mode]);
            }
            this.fileHandle = result.outputArguments[0].value;
            return this.fileHandle;
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.fileHandle) {
                throw new Error("File has node been opened yet");
            }
            yield this.ensureInitialized();
            const result = yield this.session.call({
                inputArguments: [
                    { dataType: node_opcua_variant_1.DataType.UInt32, value: this.fileHandle }
                ],
                methodId: this.closeMethodNodeId,
                objectId: this.fileNodeId
            });
            if (result.statusCode !== node_opcua_status_code_1.StatusCodes.Good) {
                debugLog("Cannot close file : ");
                throw new Error("cannot close file statusCode = " + result.statusCode.toString());
            }
            this.fileHandle = 0;
        });
    }
    getPosition() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureInitialized();
            if (!this.fileHandle) {
                throw new Error("File has node been opened yet");
            }
            const result = yield this.session.call({
                inputArguments: [
                    { dataType: node_opcua_variant_1.DataType.UInt32, value: this.fileHandle }
                ],
                methodId: this.getPositionNodeId,
                objectId: this.fileNodeId
            });
            if (result.statusCode !== node_opcua_status_code_1.StatusCodes.Good) {
                throw new Error("Error " + result.statusCode.toString());
            }
            return result.outputArguments[0].value;
        });
    }
    setPosition(position) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureInitialized();
            if (!this.fileHandle) {
                throw new Error("File has node been opened yet");
            }
            if (typeof position === "number") {
                position = [0, position];
            }
            const result = yield this.session.call({
                inputArguments: [
                    { dataType: node_opcua_variant_1.DataType.UInt32, value: this.fileHandle },
                    {
                        arrayType: node_opcua_variant_1.VariantArrayType.Scalar,
                        dataType: node_opcua_variant_1.DataType.UInt64,
                        value: position
                    }
                ],
                methodId: this.setPositionNodeId,
                objectId: this.fileNodeId
            });
            if (result.statusCode !== node_opcua_status_code_1.StatusCodes.Good) {
                throw new Error("Error " + result.statusCode.toString());
            }
            return;
        });
    }
    read(bytesToRead) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureInitialized();
            if (!this.fileHandle) {
                throw new Error("File has node been opened yet");
            }
            const result = yield this.session.call({
                inputArguments: [
                    { dataType: node_opcua_variant_1.DataType.UInt32, value: this.fileHandle },
                    {
                        arrayType: node_opcua_variant_1.VariantArrayType.Scalar,
                        dataType: node_opcua_variant_1.DataType.Int32,
                        value: bytesToRead
                    }
                ],
                methodId: this.readNodeId,
                objectId: this.fileNodeId
            });
            if (result.statusCode !== node_opcua_status_code_1.StatusCodes.Good) {
                throw new Error("Error " + result.statusCode.toString());
            }
            if (!result.outputArguments || result.outputArguments[0].dataType !== node_opcua_variant_1.DataType.ByteString) {
                throw new Error("Error invalid output");
            }
            return result.outputArguments[0].value;
        });
    }
    write(data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureInitialized();
            if (!this.fileHandle) {
                throw new Error("File has node been opened yet");
            }
            const result = yield this.session.call({
                inputArguments: [
                    { dataType: node_opcua_variant_1.DataType.UInt32, value: this.fileHandle },
                    {
                        arrayType: node_opcua_variant_1.VariantArrayType.Scalar,
                        dataType: node_opcua_variant_1.DataType.ByteString,
                        value: data
                    }
                ],
                methodId: this.writeNodeId,
                objectId: this.fileNodeId
            });
            if (result.statusCode !== node_opcua_status_code_1.StatusCodes.Good) {
                throw new Error("Error " + result.statusCode.toString());
            }
            return;
        });
    }
    openCount() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureInitialized();
            const nodeToRead = { nodeId: this.openCountNodeId, attributeId: node_opcua_data_model_1.AttributeIds.Value };
            const dataValue = yield this.session.read(nodeToRead);
            if (doDebug) {
                debugLog(" OpenCount ", nodeToRead.nodeId.toString(), dataValue.toString());
            }
            return dataValue.value.value;
        });
    }
    size() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureInitialized();
            const nodeToRead = { nodeId: this.sizeNodeId, attributeId: node_opcua_data_model_1.AttributeIds.Value };
            const dataValue = yield this.session.read(nodeToRead);
            return dataValue.value.value;
        });
    }
    extractMethodsIds() {
        return __awaiter(this, void 0, void 0, function* () {
            const browsePaths = [
                node_opcua_service_translate_browse_path_1.makeBrowsePath(this.fileNodeId, "/Open"),
                node_opcua_service_translate_browse_path_1.makeBrowsePath(this.fileNodeId, "/Close"),
                node_opcua_service_translate_browse_path_1.makeBrowsePath(this.fileNodeId, "/SetPosition"),
                node_opcua_service_translate_browse_path_1.makeBrowsePath(this.fileNodeId, "/GetPosition"),
                node_opcua_service_translate_browse_path_1.makeBrowsePath(this.fileNodeId, "/Write"),
                node_opcua_service_translate_browse_path_1.makeBrowsePath(this.fileNodeId, "/Read"),
                node_opcua_service_translate_browse_path_1.makeBrowsePath(this.fileNodeId, "/OpenCount"),
                node_opcua_service_translate_browse_path_1.makeBrowsePath(this.fileNodeId, "/Size")
            ];
            const results = yield this.session.translateBrowsePath(browsePaths);
            if (results[0].statusCode !== node_opcua_status_code_1.StatusCodes.Good) {
                throw new Error("fileType object does not expose mandatory Open Method");
            }
            if (results[1].statusCode !== node_opcua_status_code_1.StatusCodes.Good) {
                throw new Error("fileType object does not expose mandatory Close Method");
            }
            if (results[2].statusCode !== node_opcua_status_code_1.StatusCodes.Good) {
                throw new Error("fileType object does not expose mandatory SetPosition Method");
            }
            if (results[3].statusCode !== node_opcua_status_code_1.StatusCodes.Good) {
                throw new Error("fileType object does not expose mandatory GetPosition Method");
            }
            if (results[4].statusCode !== node_opcua_status_code_1.StatusCodes.Good) {
                throw new Error("fileType object does not expose mandatory Write Method");
            }
            if (results[5].statusCode !== node_opcua_status_code_1.StatusCodes.Good) {
                throw new Error("fileType object does not expose mandatory Read Method");
            }
            if (results[6].statusCode !== node_opcua_status_code_1.StatusCodes.Good) {
                throw new Error("fileType object does not expose mandatory OpenCount Variable");
            }
            if (results[7].statusCode !== node_opcua_status_code_1.StatusCodes.Good) {
                throw new Error("fileType object does not expose mandatory Size Variable");
            }
            if (false && doDebug) {
                results.map((x) => debugLog(x.toString()));
            }
            this.openMethodNodeId = results[0].targets[0].targetId;
            this.closeMethodNodeId = results[1].targets[0].targetId;
            this.setPositionNodeId = results[2].targets[0].targetId;
            this.getPositionNodeId = results[3].targets[0].targetId;
            this.writeNodeId = results[4].targets[0].targetId;
            this.readNodeId = results[5].targets[0].targetId;
            this.openCountNodeId = results[6].targets[0].targetId;
            this.sizeNodeId = results[7].targets[0].targetId;
        });
    }
    ensureInitialized() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.openMethodNodeId) {
                yield this.extractMethodsIds();
            }
        });
    }
}
exports.ClientFile = ClientFile;
/**
 * 5.2.10 UserRolePermissions
 *
 * The optional UserRolePermissions Attribute specifies the Permissions that apply to a Node for
 * all Roles granted to current Session. The value of the Attribute is an array of
 * RolePermissionType Structures (see Table 8).
 * Clients may determine their effective Permissions by logically ORing the Permissions for each
 * Role in the array.
 *  The value of this Attribute is derived from the rules used by the Server to map Sessions to
 * Roles. This mapping may be vendor specific or it may use the standard Role model defined in 4.8.
 * This Attribute shall not be writeable.
 * If not specified, the value of DefaultUserRolePermissions Property from the Namespace
 * Metadata Object associated with the Node is used instead. If the NamespaceMetadata Object
 * does not define the Property or does not exist, then the Server does not publish any information
 * about Roles mapped to the current Session.
 *
 *
 * 5.2.11 AccessRestrictions
 * The optional AccessRestrictions Attribute specifies the AccessRestrictions that apply to a Node.
 * Its data type is defined in 8.56. If a Server supports AccessRestrictions for a particular
 * Namespace it adds the DefaultAccessRestrictions Property to the NamespaceMetadata Object
 * for that Namespace (see Figure 8). If a particular Node in the Namespace needs to override
 * the default value the Server adds the AccessRestrictions Attribute to the Node.
 * If a Server implements a vendor specific access restriction model for a Namespace, it does not
 * add the DefaultAccessRestrictions Property to the NamespaceMetadata Object.
 *
 *
 * DefaultAccessRestrictions
 *
 */
//# sourceMappingURL=client_file.js.map