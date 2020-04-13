"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-data-model
 */
const node_opcua_assert_1 = require("node-opcua-assert");
const _ = require("underscore");
var AttributeIds;
(function (AttributeIds) {
    AttributeIds[AttributeIds["NodeId"] = 1] = "NodeId";
    AttributeIds[AttributeIds["NodeClass"] = 2] = "NodeClass";
    AttributeIds[AttributeIds["BrowseName"] = 3] = "BrowseName";
    AttributeIds[AttributeIds["DisplayName"] = 4] = "DisplayName";
    AttributeIds[AttributeIds["Description"] = 5] = "Description";
    AttributeIds[AttributeIds["WriteMask"] = 6] = "WriteMask";
    AttributeIds[AttributeIds["UserWriteMask"] = 7] = "UserWriteMask";
    AttributeIds[AttributeIds["IsAbstract"] = 8] = "IsAbstract";
    AttributeIds[AttributeIds["Symmetric"] = 9] = "Symmetric";
    AttributeIds[AttributeIds["InverseName"] = 10] = "InverseName";
    AttributeIds[AttributeIds["ContainsNoLoops"] = 11] = "ContainsNoLoops";
    AttributeIds[AttributeIds["EventNotifier"] = 12] = "EventNotifier";
    AttributeIds[AttributeIds["Value"] = 13] = "Value";
    AttributeIds[AttributeIds["DataType"] = 14] = "DataType";
    AttributeIds[AttributeIds["ValueRank"] = 15] = "ValueRank";
    AttributeIds[AttributeIds["ArrayDimensions"] = 16] = "ArrayDimensions";
    AttributeIds[AttributeIds["AccessLevel"] = 17] = "AccessLevel";
    AttributeIds[AttributeIds["UserAccessLevel"] = 18] = "UserAccessLevel";
    AttributeIds[AttributeIds["MinimumSamplingInterval"] = 19] = "MinimumSamplingInterval";
    AttributeIds[AttributeIds["Historizing"] = 20] = "Historizing";
    AttributeIds[AttributeIds["Executable"] = 21] = "Executable";
    AttributeIds[AttributeIds["UserExecutable"] = 22] = "UserExecutable";
    // new in 1.04
    AttributeIds[AttributeIds["DataTypeDefinition"] = 23] = "DataTypeDefinition";
    AttributeIds[AttributeIds["RolePermissions"] = 24] = "RolePermissions";
    AttributeIds[AttributeIds["UserRolePermissions"] = 25] = "UserRolePermissions";
    AttributeIds[AttributeIds["AccessRestrictions"] = 26] = "AccessRestrictions";
    AttributeIds[AttributeIds["AccessLevelEx"] = 27] = "AccessLevelEx";
    AttributeIds[AttributeIds["LAST"] = 27] = "LAST";
    AttributeIds[AttributeIds["INVALID"] = 999] = "INVALID";
})(AttributeIds = exports.AttributeIds || (exports.AttributeIds = {}));
// deprecated use getAttributeName(attributeId: AttributeIds);
exports.attributeNameById = _.invert(AttributeIds);
function isValidAttributeId(attributeId) {
    node_opcua_assert_1.assert(_.isFinite(attributeId));
    return attributeId >= 1 && attributeId <= AttributeIds.LAST;
}
exports.isValidAttributeId = isValidAttributeId;
//# sourceMappingURL=attributeIds.js.map