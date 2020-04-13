"use strict";
/**
 * @module node-opcua-data-model
 */
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:no-bitwise
var WriteMask;
(function (WriteMask) {
    WriteMask[WriteMask["AccessLevel"] = 1] = "AccessLevel";
    WriteMask[WriteMask["ArrayDimensions"] = 2] = "ArrayDimensions";
    WriteMask[WriteMask["BrowseName"] = 4] = "BrowseName";
    WriteMask[WriteMask["ContainsNoLoops"] = 8] = "ContainsNoLoops";
    WriteMask[WriteMask["DataType"] = 16] = "DataType";
    WriteMask[WriteMask["Description"] = 32] = "Description";
    WriteMask[WriteMask["DisplayName"] = 64] = "DisplayName";
    WriteMask[WriteMask["EventNotifier"] = 128] = "EventNotifier";
    WriteMask[WriteMask["Executable"] = 256] = "Executable";
    WriteMask[WriteMask["Historizing"] = 512] = "Historizing";
    WriteMask[WriteMask["InverseName"] = 1024] = "InverseName";
    WriteMask[WriteMask["IsAbstract"] = 2048] = "IsAbstract";
    WriteMask[WriteMask["MinimumSamplingInterval"] = 4096] = "MinimumSamplingInterval";
    WriteMask[WriteMask["NodeClass"] = 8192] = "NodeClass";
    WriteMask[WriteMask["NodeId"] = 16384] = "NodeId";
    WriteMask[WriteMask["Symmetric"] = 32768] = "Symmetric";
    WriteMask[WriteMask["UserAccessLevel"] = 65536] = "UserAccessLevel";
    WriteMask[WriteMask["UserExecutable"] = 131072] = "UserExecutable";
    WriteMask[WriteMask["UserWriteMask"] = 262144] = "UserWriteMask";
    WriteMask[WriteMask["ValueRank"] = 524288] = "ValueRank";
    WriteMask[WriteMask["WriteMask"] = 1048576] = "WriteMask";
    WriteMask[WriteMask["ValueForVariableType"] = 2097152] = "ValueForVariableType"; // Indicates if the Value Attribute is writable for a VariableType.
    // It does not apply for
    // Variables since this is handled by the AccessLevel and UserAccessLevel
    // Attributes for the Variable. For Variables this bit shall be set to 0.
    // Reserved 22:31 Reserved for future use. Shall always be zero.
})(WriteMask = exports.WriteMask || (exports.WriteMask = {}));
//# sourceMappingURL=write_mask.js.map