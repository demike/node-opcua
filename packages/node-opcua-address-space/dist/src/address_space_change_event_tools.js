"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space
 */
const chalk_1 = require("chalk");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_common_1 = require("node-opcua-common");
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_data_model_2 = require("node-opcua-data-model");
const node_opcua_enum_1 = require("node-opcua-enum");
const verbFlags = new node_opcua_enum_1.Enum({
    //                         NodeAdded        0         Indicates the affected Node has been added.
    NodeAdded: 0x01,
    //                         NodeDeleted      1         Indicates the affected Node has been deleted.
    NodeDeleted: 0x02,
    //                         ReferenceAdded   2         Indicates a Reference has been added. The affected Node may
    ReferenceAdded: 0x04,
    //                                                    be either a SourceNode or TargetNode. Note that an added
    //                                                    bidirectional Reference is reflected by two ChangeStructures.
    //                         ReferenceDeleted 3         Indicates a Reference has been deleted. The affected Node may
    //                                                    be either a SourceNode or TargetNode. Note that a deleted
    //                                                    bidirectional Reference is reflected by two ChangeStructures.
    ReferenceDeleted: 0x08,
    //                         DataTypeChanged  4         This verb may be used only for affected Nodes that are
    //                                                    Variables or VariableTypes. It indicates that the DataType
    //                                                    Attribute has changed.
    DataTypeChanged: 0x10
});
function makeVerb(verbs) {
    const e = verbFlags.get(verbs);
    node_opcua_assert_1.assert(e !== null);
    return e.value;
}
function _handle_add_reference_change_event(node1, node2id) {
    const addressSpace = node1.addressSpace;
    const node2 = addressSpace.findNode(node2id);
    if (node1.nodeVersion || (node2 && node2.nodeVersion)) {
        // a event has to be send
        addressSpace.modelChangeTransaction(() => {
            function _getTypeDef(node) {
                if (node.nodeClass === node_opcua_data_model_1.NodeClass.Object || node.nodeClass === node_opcua_data_model_1.NodeClass.Variable) {
                    return node.typeDefinitionObj.nodeId;
                }
                return null;
            }
            let modelChangeTgt = new node_opcua_common_1.ModelChangeStructureDataType({
                affected: node1.nodeId,
                affectedType: _getTypeDef(node1),
                verb: makeVerb("ReferenceAdded")
            });
            addressSpace._collectModelChange(null, modelChangeTgt);
            modelChangeTgt = new node_opcua_common_1.ModelChangeStructureDataType({
                affected: node2.nodeId,
                affectedType: _getTypeDef(node2),
                verb: makeVerb("ReferenceAdded")
            });
            addressSpace._collectModelChange(null, modelChangeTgt);
        });
    }
}
exports._handle_add_reference_change_event = _handle_add_reference_change_event;
try {
    node_opcua_common_1.ModelChangeStructureDataType.prototype.toString = function (options) {
        if (!options) {
            return "";
        }
        const addressSpace = options.addressSpace;
        function n(nodeId) {
            if (!nodeId || nodeId.isEmpty()) {
                return "";
            }
            const node = addressSpace.findNode(nodeId);
            return "\"" + nodeId.toString() +
                "\"" + chalk_1.default.yellow(" /* " + (node ? node.browseName.toString() : "???") + " */");
        }
        let str = "{ verb:" + verbFlags.get(this.verb).key + ",";
        str += " affected: " + n(this.affected) + ",";
        str += " type: " + n(this.affectedType) + " }";
        return str;
    };
}
catch (err) {
    //
}
function _handle_model_change_event(node) {
    const addressSpace = node.addressSpace;
    //
    const parent = node.parent;
    if (parent && parent.nodeVersion) {
        addressSpace.modelChangeTransaction(() => {
            let typeDefinitionNodeId = null;
            if (node.nodeClass === node_opcua_data_model_1.NodeClass.Object || node.nodeClass === node_opcua_data_model_1.NodeClass.Variable) {
                typeDefinitionNodeId = node.typeDefinitionObj.nodeId;
            }
            const modelChange1 = new node_opcua_common_1.ModelChangeStructureDataType({
                affected: node.nodeId,
                affectedType: typeDefinitionNodeId,
                verb: makeVerb("NodeAdded")
            });
            addressSpace._collectModelChange(null, modelChange1);
            const modelChangeSrc = new node_opcua_common_1.ModelChangeStructureDataType({
                affected: parent.nodeId,
                affectedType: null,
                verb: makeVerb("ReferenceAdded")
            });
            addressSpace._collectModelChange(null, modelChangeSrc);
            // bidirectional
            if (node.nodeVersion) {
                const modelChangeTgt = new node_opcua_common_1.ModelChangeStructureDataType({
                    affected: node.nodeId,
                    affectedType: typeDefinitionNodeId,
                    verb: makeVerb("ReferenceAdded")
                });
                addressSpace._collectModelChange(null, modelChangeTgt);
            }
        });
    }
}
exports._handle_model_change_event = _handle_model_change_event;
function _handle_delete_node_model_change_event(node) {
    const addressSpace = node.addressSpace;
    // get backward references
    const references = node.findReferencesEx("HierarchicalReferences", node_opcua_data_model_2.BrowseDirection.Inverse);
    const parentNodes = references.map((r) => {
        return addressSpace.findNode(r.nodeId);
    });
    const versionableNodes = parentNodes.filter((n) => !!n.nodeVersion);
    if (versionableNodes.length >= 1 || !!node.nodeVersion) {
        addressSpace.modelChangeTransaction(() => {
            // ...
            for (const r of references) {
                const target = addressSpace.findNode(r.nodeId);
                const modelChangeSrc_l = new node_opcua_common_1.ModelChangeStructureDataType({
                    affected: target.nodeId,
                    affectedType: null,
                    verb: makeVerb("ReferenceDeleted")
                });
                addressSpace._collectModelChange(null, modelChangeSrc_l);
            }
            const modelChangeSrc = new node_opcua_common_1.ModelChangeStructureDataType({
                affected: node.nodeId,
                affectedType: node.typeDefinition,
                verb: makeVerb("NodeDeleted")
            });
            addressSpace._collectModelChange(null, modelChangeSrc);
        });
    }
}
exports._handle_delete_node_model_change_event = _handle_delete_node_model_change_event;
//# sourceMappingURL=address_space_change_event_tools.js.map