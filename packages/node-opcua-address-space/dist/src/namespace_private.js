"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space.Private
 */
const node_opcua_assert_1 = require("node-opcua-assert");
function isValidModellingRule(ruleName) {
    // let restrict to Mandatory or Optional for the time being
    return ruleName === null || ruleName === "Mandatory" || ruleName === "Optional";
}
/**
 * @param references
 * @param modellingRule
 * @private
 */
function UANamespace_process_modelling_rule(references, modellingRule) {
    if (modellingRule) {
        node_opcua_assert_1.assert(isValidModellingRule(modellingRule), "expecting a valid modelling rule");
        const modellingRuleName = "ModellingRule_" + modellingRule;
        // assert(this.findNode(modellingRuleName),"Modelling rule must exist");
        references.push({
            nodeId: modellingRuleName,
            referenceType: "HasModellingRule"
        });
    }
}
exports.UANamespace_process_modelling_rule = UANamespace_process_modelling_rule;
//# sourceMappingURL=namespace_private.js.map