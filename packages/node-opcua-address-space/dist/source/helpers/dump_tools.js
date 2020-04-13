"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space
 */
// tslint:disable:no-console
const chalk_1 = require("chalk");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_types_1 = require("node-opcua-types");
const reference_1 = require("../../src/reference");
function referenceTypeToString(addressSpace, referenceTypeId) {
    // istanbul ignore next
    if (!referenceTypeId) {
        return "<null> ";
    }
    else {
        const referenceType = addressSpace.findNode(referenceTypeId);
        return referenceTypeId.toString() + " " +
            referenceType.browseName.toString() + "/" +
            referenceType.inverseName.text;
    }
}
exports.referenceTypeToString = referenceTypeToString;
function nodeIdInfo(addressSpace, nodeId) {
    const obj = addressSpace.findNode(nodeId);
    const name = obj ? obj.browseName.toString() : " <????>";
    return nodeId.toString() + " [ " + name + " ]";
}
function dumpReferenceDescription(addressSpace, referenceDescription) {
    node_opcua_assert_1.assert(referenceDescription.referenceTypeId); // must be known;
    console.log(chalk_1.default.red("referenceDescription"));
    console.log("    referenceTypeId : ", referenceTypeToString(addressSpace, referenceDescription.referenceTypeId));
    console.log("    isForward       : ", referenceDescription.isForward ? "true" : "false");
    console.log("    nodeId          : ", nodeIdInfo(addressSpace, referenceDescription.nodeId));
    console.log("    browseName      : ", referenceDescription.browseName.toString());
    console.log("    nodeClass       : ", referenceDescription.nodeClass.toString());
    console.log("    typeDefinition  : ", nodeIdInfo(addressSpace, referenceDescription.typeDefinition));
}
exports.dumpReferenceDescription = dumpReferenceDescription;
function dumpReferenceDescriptions(addressSpace, referenceDescriptions) {
    referenceDescriptions.forEach((r) => dumpReferenceDescription(addressSpace, r));
}
exports.dumpReferenceDescriptions = dumpReferenceDescriptions;
function dumpBrowseDescription(node, _browseDescription) {
    const browseDescription = new node_opcua_types_1.BrowseDescription(_browseDescription);
    const addressSpace = node.addressSpace;
    console.log(" Browse Node :");
    if (browseDescription.nodeId) {
        console.log(" nodeId : ", chalk_1.default.cyan(browseDescription.nodeId.toString()));
    }
    console.log(" nodeId : ", chalk_1.default.cyan(node.browseName.toString()), "(", node.nodeId.toString(), ")");
    console.log("   referenceTypeId :", referenceTypeToString(addressSpace, browseDescription.referenceTypeId));
    console.log("   browseDirection :", chalk_1.default.cyan(node_opcua_data_model_1.BrowseDirection[browseDescription.browseDirection]));
    console.log("   includeSubType  :", browseDescription.includeSubtypes ? "true" : "false");
    console.log("   nodeClassMask   :", browseDescription.nodeClassMask);
    console.log("   resultMask      :", browseDescription.resultMask);
}
exports.dumpBrowseDescription = dumpBrowseDescription;
/**
 * @method dumpReferences
 * @param addressSpace    {AddressSpace}
 * @param references  {Array<Reference>|null}
 * @static
 */
function dumpReferences(addressSpace, references) {
    node_opcua_assert_1.assert(addressSpace);
    for (const reference of references) {
        const referenceType = reference_1.resolveReferenceType(addressSpace, reference);
        if (!referenceType) {
            // unknown type ... this may happen when the address space is not fully build
            return;
        }
        const dir = reference.isForward ? "(=>)" : "(<-)";
        const objectName = nodeIdInfo(addressSpace, reference.nodeId);
        console.log(" referenceType : ", dir, referenceType
            ? referenceType.browseName.toString()
            : reference.referenceType.toString(), " ", objectName);
    }
}
exports.dumpReferences = dumpReferences;
//# sourceMappingURL=dump_tools.js.map