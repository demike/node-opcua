"use strict";
/**
 * @module node-opcua-address-space
 */
// tslint:disable:no-console
// tslint:disable:max-line-length
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_constants_1 = require("node-opcua-constants");
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const doDebug = false;
function dumpReferencesHierarchy(_addressSpace) {
    const addressSpace = _addressSpace;
    function _dump(referenceType, level) {
        console.log(level, referenceType.browseName.toString(), "(", chalk_1.default.green(referenceType.getAllSubtypes().map((x) => x.browseName.toString()).join(" ")), ")");
        const subTypes = referenceType.findReferencesExAsObject("HasSubtype");
        for (const subType of subTypes) {
            _dump(subType, "     " + level);
        }
    }
    const references = addressSpace.findReferenceType(node_opcua_constants_1.ReferenceTypeIds.References);
    _dump(references, " ");
}
function create_minimalist_address_space_nodeset(addressSpace) {
    const namespace0 = addressSpace.registerNamespace("http://opcfoundation.org/UA/");
    node_opcua_assert_1.assert(namespace0.index === 0);
    function addReferenceType(browseName_, isAbstract, superType) {
        const tmp = browseName_.split("/");
        const inverseName = tmp[1];
        const browseName = tmp[0];
        const options = {
            browseName,
            inverseName,
            isAbstract,
            nodeClass: node_opcua_data_model_1.NodeClass.ReferenceType,
            nodeId: node_opcua_nodeid_1.resolveNodeId(node_opcua_constants_1.ReferenceTypeIds[browseName]),
            references: [],
            superType
        };
        const hasSubType = node_opcua_nodeid_1.resolveNodeId("HasSubtype");
        if (superType) {
            options.references.push({
                isForward: false,
                nodeId: superType.nodeId,
                referenceType: hasSubType
            });
        }
        const node = namespace0._createNode(options);
        node.propagate_back_references();
        return node;
    }
    // add references
    {
        // before we do any thing , we need to create the HasSubtype reference
        // which is required in the first to create the hierachy of References
        const hasSubtype = addReferenceType("HasSubtype/HasSupertype");
        const references = addReferenceType("References", true);
        {
            const nonHierarchicalReferences = addReferenceType("NonHierarchicalReferences", true, references);
            {
                const hasTypeDefinition = addReferenceType("HasTypeDefinition/TypeDefinitionOf", false, nonHierarchicalReferences);
                const hasModellingRule = addReferenceType("HasModellingRule/ModellingRuleOf", false, nonHierarchicalReferences);
                const hasEncoding = addReferenceType("HasEncoding/EncodingOf", false, nonHierarchicalReferences);
            }
        }
        {
            const hierarchicalReferences = addReferenceType("HierarchicalReferences", true, references);
            {
                const hasChild = addReferenceType("HasChild/ChildOf", true, hierarchicalReferences);
                {
                    const aggregates = addReferenceType("Aggregates/AggregatedBy", true, hasChild);
                    {
                        const hasComponent = addReferenceType("HasComponent/ComponentOf", false, aggregates);
                        const hasProperty = addReferenceType("HasProperty/PropertyOf", false, aggregates);
                        const hasHistoricalConfiguration = addReferenceType("HasHistoricalConfiguration/HistoricalConfigurationOf", false, aggregates);
                    }
                }
                {
                    // add a link to hasSubType
                    hasSubtype.addReference({
                        isForward: false,
                        nodeId: hasChild,
                        referenceType: hasSubtype
                    });
                }
            }
            {
                const organizes = addReferenceType("Organizes/OrganizedBy", false, hierarchicalReferences);
            }
            {
                const hasEventSource = addReferenceType("HasEventSource/EventSourceOf", false, hierarchicalReferences);
            }
        }
    }
    if (doDebug) {
        dumpReferencesHierarchy(addressSpace);
    }
    const baseObjectType = namespace0._createNode({
        browseName: "BaseObjectType",
        isAbstract: true,
        nodeClass: node_opcua_data_model_1.NodeClass.ObjectType,
        nodeId: node_opcua_nodeid_1.resolveNodeId(node_opcua_constants_1.ObjectTypeIds.BaseObjectType)
    });
    const baseVariableType = namespace0._createNode({
        browseName: "BaseVariableType",
        isAbstract: true,
        nodeClass: node_opcua_data_model_1.NodeClass.VariableType,
        nodeId: node_opcua_nodeid_1.resolveNodeId(node_opcua_constants_1.VariableTypeIds.BaseVariableType)
    });
    const propertyType = namespace0.addVariableType({
        browseName: "PropertyType",
        subtypeOf: baseVariableType
    });
    const baseDataVariableType = namespace0._createNode({
        browseName: "BaseDataVariableType",
        isAbstract: true,
        nodeClass: node_opcua_data_model_1.NodeClass.VariableType,
        nodeId: node_opcua_nodeid_1.resolveNodeId(node_opcua_constants_1.VariableTypeIds.BaseDataVariableType),
        subtypeOf: baseVariableType.nodeId
    });
    const modellingRule_Optional = namespace0._createNode({
        browseName: "Optional",
        nodeClass: node_opcua_data_model_1.NodeClass.Object,
        nodeId: node_opcua_nodeid_1.resolveNodeId(node_opcua_constants_1.ObjectIds.ModellingRule_Optional),
    });
    const modellingRule_Mandatory = namespace0._createNode({
        browseName: "Mandatory",
        nodeClass: node_opcua_data_model_1.NodeClass.Object,
        nodeId: node_opcua_nodeid_1.resolveNodeId(node_opcua_constants_1.ObjectIds.ModellingRule_Mandatory),
    });
    // add the root folder
    {
        const rootFolder = namespace0._createNode({
            browseName: "RootFolder",
            nodeClass: node_opcua_data_model_1.NodeClass.Object,
            nodeId: node_opcua_nodeid_1.resolveNodeId(node_opcua_constants_1.ObjectIds.RootFolder)
        });
        {
            const objectsFolder = namespace0.addObject({
                browseName: "Objects",
                nodeId: node_opcua_nodeid_1.resolveNodeId(node_opcua_constants_1.ObjectIds.ObjectsFolder),
                organizedBy: rootFolder
            });
            node_opcua_assert_1.assert(rootFolder.getFolderElementByName("Objects")
                .browseName.toString() === "Objects");
        }
        {
            const dataTypeFolder = namespace0.addObject({
                browseName: "DataType",
                nodeId: node_opcua_nodeid_1.resolveNodeId(node_opcua_constants_1.ObjectIds.DataTypesFolder),
                organizedBy: rootFolder
            });
            {
                const doubleDataType = namespace0._createNode({
                    browseName: "Double",
                    nodeClass: node_opcua_data_model_1.NodeClass.DataType,
                    nodeId: node_opcua_nodeid_1.resolveNodeId(node_opcua_constants_1.DataTypeIds.Double),
                    organizedBy: dataTypeFolder
                });
            }
        }
    }
}
exports.create_minimalist_address_space_nodeset = create_minimalist_address_space_nodeset;
//# sourceMappingURL=create_minimalist_address_space_nodeset.js.map