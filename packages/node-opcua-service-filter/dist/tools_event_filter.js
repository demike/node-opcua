"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-service-filter
 */
// tslint:disable:object-literal-shorthand
// tslint:disable:only-arrow-functions
// tslint:disable:max-line-length
const _ = require("underscore");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_constants_1 = require("node-opcua-constants");
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_debug_1 = require("node-opcua-debug");
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const node_opcua_variant_1 = require("node-opcua-variant");
const imports_1 = require("./imports");
const debugLog = node_opcua_debug_1.make_debugLog(__filename);
const doDebug = node_opcua_debug_1.checkDebugFlag(__filename);
/**
 * helper to construct event filters:
 * construct a simple event filter
 *
 *
 * @example
 *
 *     constructEventFilter(["SourceName","Message","ReceiveTime"]);
 *
 *     constructEventFilter(["SourceName",{namespaceIndex:2 , "MyData"}]);
 *     constructEventFilter(["SourceName","2:MyData" ]);
 *
 *     constructEventFilter(["SourceName" ,["EnabledState","EffectiveDisplayName"] ]);
 *     constructEventFilter(["SourceName" ,"EnabledState.EffectiveDisplayName" ]);
 *
 */
function constructEventFilter(arrayOfNames, conditionTypes) {
    if (!_.isArray(arrayOfNames)) {
        return constructEventFilter([arrayOfNames], conditionTypes);
    }
    if (conditionTypes && !_.isArray(conditionTypes)) {
        return constructEventFilter(arrayOfNames, [conditionTypes]);
    }
    if (!(arrayOfNames instanceof Array)) {
        throw new Error("internal error");
    }
    // replace "string" element in the form A.B.C into [ "A","B","C"]
    const arrayOfNames2 = arrayOfNames.map((path) => {
        if (typeof path !== "string") {
            return path;
        }
        return path.split(".");
    });
    const arrayOfNames3 = arrayOfNames2.map((path) => {
        if (_.isArray(path)) {
            return path.map(node_opcua_data_model_1.stringToQualifiedName);
        }
        return path;
    });
    // replace "string" elements in arrayOfName with QualifiedName in namespace 0
    const arrayOfNames4 = arrayOfNames3.map((s) => {
        return (typeof s === "string") ? node_opcua_data_model_1.stringToQualifiedName(s) : s;
    });
    // construct browse paths array
    const browsePaths = arrayOfNames4.map((s) => {
        return _.isArray(s) ? s : [s];
    });
    // Part 4 page 127:
    // In some cases the same BrowsePath will apply to multiple EventTypes. If the Client specifies the BaseEventType
    // in the SimpleAttributeOperand then the Server shall evaluate the BrowsePath without considering the Type.
    // [..]
    // The SimpleAttributeOperand structure allows the Client to specify any Attribute, however, the Server is only
    // required to support the Value Attribute for Variable Nodes and the NodeId Attribute for Object Nodes.
    // That said, profiles defined in Part 7 may make support for additional Attributes mandatory.
    let selectClauses = browsePaths.map((browsePath) => {
        return new imports_1.SimpleAttributeOperand({
            attributeId: node_opcua_data_model_1.AttributeIds.Value,
            browsePath,
            indexRange: undefined,
            typeDefinitionId: node_opcua_nodeid_1.makeNodeId(node_opcua_constants_1.ObjectTypeIds.BaseEventType) // i=2041
        });
    });
    if (conditionTypes && conditionTypes instanceof Array) {
        const extraSelectClauses = conditionTypes.map((nodeId) => {
            return new imports_1.SimpleAttributeOperand({
                attributeId: node_opcua_data_model_1.AttributeIds.NodeId,
                browsePath: undefined,
                indexRange: undefined,
                typeDefinitionId: nodeId // conditionType for instance
            });
        });
        selectClauses = selectClauses.concat(extraSelectClauses);
    }
    const filter = new imports_1.EventFilter({
        selectClauses: selectClauses,
        whereClause: {
            elements: [ // ContentFilterElement
            // {
            //    filterOperator: FilterOperator.IsNull,
            //    filterOperands: [ //
            //        new ElementOperand({
            //            index: 123
            //        }),
            //        new AttributeOperand({
            //            nodeId: "i=10",
            //            alias: "someText",
            //            browsePath: { //RelativePath
            //
            //            },
            //            attributeId: AttributeIds.Value
            //        })
            //    ]
            // }
            ]
        }
    });
    return filter;
}
exports.constructEventFilter = constructEventFilter;
/**
 * @class SimpleAttributeOperand
 * @method toPath
 * @return {String}
 *
 * @example:
 *
 *
 */
function simpleAttributeOperandToPath(self) {
    if (!self.browsePath) {
        return "";
    }
    return self.browsePath.map((a) => {
        return a.name;
    }).join("/");
}
/**
 * @class SimpleAttributeOperand
 * @method toShortString
 * @return {String}
 *
 * @example:
 *
 *
 */
function simpleAttributeOperandToShortString(self, addressSpace // Address Space
) {
    let str = "";
    if (addressSpace) {
        const n = addressSpace.findNode(self.typeDefinitionId);
        str += n.BrowseName.toString();
    }
    str += "[" + self.typeDefinitionId.toString() + "]" + simpleAttributeOperandToPath(self);
    return str;
}
exports.simpleAttributeOperandToShortString = simpleAttributeOperandToShortString;
function assert_valid_event_data(eventData) {
    node_opcua_assert_1.assert(_.isFunction(eventData.resolveSelectClause));
    node_opcua_assert_1.assert(_.isFunction(eventData.readValue));
}
/**
 *
 * @method extractEventField
 * extract a eventField from a event node, matching the given selectClause
 * @param eventData
 * @param selectClause
 */
function extractEventField(eventData, selectClause) {
    assert_valid_event_data(eventData);
    node_opcua_assert_1.assert(selectClause instanceof imports_1.SimpleAttributeOperand);
    selectClause.browsePath = selectClause.browsePath || [];
    if (selectClause.browsePath.length === 0 && selectClause.attributeId === node_opcua_data_model_1.AttributeIds.NodeId) {
        const eventSource = eventData.$eventDataSource;
        const addressSpace = eventSource.addressSpace;
        const conditionTypeNodeId = node_opcua_nodeid_1.resolveNodeId("ConditionType");
        const conditionType = addressSpace.findObjectType(conditionTypeNodeId);
        // "ns=0;i=2782" => ConditionType
        // "ns=0;i=2041" => BaseEventType
        if (selectClause.typeDefinitionId.toString() !== "ns=0;i=2782") {
            // not a ConditionType
            // but could be on of its derived type. for instance ns=0;i=2881 => AcknowledgeableConditionType
            const typeDefinitionObj = addressSpace.findObjectType(selectClause.typeDefinitionId);
            if (!typeDefinitionObj.isSupertypeOf(conditionType)) {
                // tslint:disable-next-line:no-console
                console.warn(" ", typeDefinitionObj ? typeDefinitionObj.browseName.toString() : "????");
                // tslint:disable-next-line:no-console
                console.warn("this case is not handled yet : selectClause.typeDefinitionId = " + selectClause.typeDefinitionId.toString());
                const eventSource1 = eventData.$eventDataSource;
                return new node_opcua_variant_1.Variant({ dataType: node_opcua_variant_1.DataType.NodeId, value: eventSource1.nodeId });
            }
        }
        const eventSourceTypeDefinition = eventSource.typeDefinitionObj;
        if (!eventSourceTypeDefinition) {
            // eventSource is a EventType class
            return new node_opcua_variant_1.Variant();
        }
        if (!eventSourceTypeDefinition.isSupertypeOf(conditionType)) {
            return new node_opcua_variant_1.Variant();
        }
        // Yeh : our EventType is a Condition Type !
        return new node_opcua_variant_1.Variant({ dataType: node_opcua_variant_1.DataType.NodeId, value: eventSource.nodeId });
    }
    const handle = eventData.resolveSelectClause(selectClause);
    if (handle !== null) {
        const value = eventData.readValue(handle, selectClause);
        node_opcua_assert_1.assert(value instanceof node_opcua_variant_1.Variant);
        return value;
    }
    else {
        // Part 4 - 7.17.3
        // A null value is returned in the corresponding event field in the Publish response if the selected
        // field is not part of the Event or an error was returned in the selectClauseResults of the EventFilterResult.
        // return new Variant({dataType: DataType.StatusCode, value: browsePathResult.statusCode});
        return new node_opcua_variant_1.Variant();
    }
}
/**
 * @method extractEventFields
 * extract a array of eventFields from a event node, matching the selectClauses
 * @param selectClauses
 * @param eventData : a pseudo Node that provides a browse Method and a readValue(nodeId)
 */
function extractEventFields(selectClauses, eventData) {
    assert_valid_event_data(eventData);
    node_opcua_assert_1.assert(_.isArray(selectClauses));
    node_opcua_assert_1.assert(selectClauses.length === 0 || selectClauses[0] instanceof imports_1.SimpleAttributeOperand);
    return selectClauses.map(extractEventField.bind(null, eventData));
}
exports.extractEventFields = extractEventFields;
//# sourceMappingURL=tools_event_filter.js.map