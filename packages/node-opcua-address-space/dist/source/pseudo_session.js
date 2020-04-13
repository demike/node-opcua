"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space
 */
const async = require("async");
const _ = require("underscore");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_data_value_1 = require("node-opcua-data-value");
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const node_opcua_pseudo_session_1 = require("node-opcua-pseudo-session");
const node_opcua_service_browse_1 = require("node-opcua-service-browse");
const node_opcua_service_call_1 = require("node-opcua-service-call");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const node_opcua_types_1 = require("node-opcua-types");
const continuation_point_manager_1 = require("./continuation_points/continuation_point_manager");
const call_helpers_1 = require("./helpers/call_helpers");
const session_context_1 = require("./session_context");
/**
 * Pseudo session is an helper object that exposes the same async methods
 * than the ClientSession. It can be used on a server address space.
 *
 * Code reused !
 * The primary benefit of this object  is that its makes advanced OPCUA
 * operations that uses browse, translate, read, write etc similar
 * whether we work inside a server or through a client session.
 *
 * @param addressSpace {AddressSpace}
 * @constructor
 */
class PseudoSession {
    constructor(addressSpace, server, session) {
        this.requestedMaxReferencesPerNode = 0;
        this.addressSpace = addressSpace;
        this.server = server || {};
        this.session = session || {
            channel: {
                clientCertificate: null,
                securityMode: node_opcua_types_1.MessageSecurityMode.None,
                securityPolicy: "http://opcfoundation.org/UA/SecurityPolicy#None" // SecurityPolicy.None
            }
        };
        this.continuationPointManager = new continuation_point_manager_1.ContinuationPointManager();
    }
    browse(nodesToBrowse, callback) {
        setImmediate(() => {
            const isArray = _.isArray(nodesToBrowse);
            if (!isArray) {
                nodesToBrowse = [nodesToBrowse];
            }
            let results = [];
            for (let browseDescription of nodesToBrowse) {
                browseDescription.referenceTypeId = node_opcua_nodeid_1.resolveNodeId(browseDescription.referenceTypeId);
                browseDescription = new node_opcua_service_browse_1.BrowseDescription(browseDescription);
                const nodeId = node_opcua_nodeid_1.resolveNodeId(browseDescription.nodeId);
                const r = this.addressSpace.browseSingleNode(nodeId, browseDescription);
                results.push(r);
            }
            // handle continuation points
            results = results.map((result) => {
                node_opcua_assert_1.assert(!result.continuationPoint);
                const truncatedResult = this.continuationPointManager.register(this.requestedMaxReferencesPerNode, result.references || []);
                node_opcua_assert_1.assert(truncatedResult.statusCode === node_opcua_status_code_1.StatusCodes.Good);
                truncatedResult.statusCode = result.statusCode;
                return new node_opcua_service_browse_1.BrowseResult(truncatedResult);
            });
            callback(null, isArray ? results : results[0]);
        });
    }
    read(nodesToRead, callback) {
        const isArray = _.isArray(nodesToRead);
        if (!isArray) {
            nodesToRead = [nodesToRead];
        }
        setImmediate(() => {
            // xx const context = new SessionContext({ session: null });
            const dataValues = nodesToRead.map((nodeToRead) => {
                node_opcua_assert_1.assert(!!nodeToRead.nodeId, "expecting a nodeId");
                node_opcua_assert_1.assert(!!nodeToRead.attributeId, "expecting a attributeId");
                const nodeId = nodeToRead.nodeId;
                const attributeId = nodeToRead.attributeId;
                const indexRange = nodeToRead.indexRange;
                const dataEncoding = nodeToRead.dataEncoding;
                const obj = this.addressSpace.findNode(nodeId);
                if (!obj) {
                    return new node_opcua_data_value_1.DataValue({ statusCode: node_opcua_status_code_1.StatusCodes.BadNodeIdUnknown });
                }
                const context = session_context_1.SessionContext.defaultContext;
                const dataValue = obj.readAttribute(context, attributeId, indexRange, dataEncoding);
                return dataValue;
            });
            callback(null, isArray ? dataValues : dataValues[0]);
        });
    }
    browseNext(continuationPoints, releaseContinuationPoints, callback) {
        setImmediate(() => {
            if (continuationPoints instanceof Buffer) {
                return this.browseNext([continuationPoints], releaseContinuationPoints, (err, _results) => {
                    if (err) {
                        return callback(err);
                    }
                    callback(null, _results[0]);
                });
                return;
            }
            const session = this;
            let results;
            if (releaseContinuationPoints) {
                // releaseContinuationPoints = TRUE
                //   passed continuationPoints shall be reset to free resources in
                //   the Server. The continuation points are released and the results
                //   and diagnosticInfos arrays are empty.
                results = continuationPoints.map((continuationPoint) => {
                    return session.continuationPointManager.cancel(continuationPoint);
                });
            }
            else {
                // let extract data from continuation points
                // releaseContinuationPoints = FALSE
                //   passed continuationPoints shall be used to get the next set of
                //   browse information.
                results = continuationPoints.map((continuationPoint) => {
                    return session.continuationPointManager.getNext(continuationPoint);
                });
            }
            results = results.map((r) => new node_opcua_service_browse_1.BrowseResult(r));
            callback(null, results);
        });
    }
    call(methodsToCall, callback) {
        const isArray = _.isArray(methodsToCall);
        if (!isArray) {
            methodsToCall = [methodsToCall];
        }
        async.map(methodsToCall, (methodToCall, innerCallback) => {
            const callMethodRequest = new node_opcua_service_call_1.CallMethodRequest(methodToCall);
            call_helpers_1.callMethodHelper(this.server, this.session, this.addressSpace, callMethodRequest, (err, result) => {
                let callMethodResult;
                if (err) {
                    callMethodResult = new node_opcua_service_call_1.CallMethodResult({
                        statusCode: node_opcua_status_code_1.StatusCodes.BadInternalError
                    });
                }
                else {
                    callMethodResult = new node_opcua_service_call_1.CallMethodResult(result);
                }
                innerCallback(null, callMethodResult);
            });
        }, (err, callMethodResults) => {
            callback(null, isArray ? callMethodResults : callMethodResults[0]);
        });
    }
    getArgumentDefinition(methodId, callback) {
        return node_opcua_pseudo_session_1.getArgumentDefinitionHelper(this, methodId, callback);
    }
    translateBrowsePath(browsePaths, callback) {
        const isArray = _.isArray(browsePaths);
        if (!isArray) {
            browsePaths = [browsePaths];
        }
        // xx const context = new SessionContext({ session: null });
        const browsePathResults = browsePaths.map((browsePath) => {
            return this.addressSpace.browsePath(browsePath);
        });
        callback(null, isArray ? browsePathResults : browsePathResults[0]);
    }
}
exports.PseudoSession = PseudoSession;
// tslint:disable:no-var-requires
// tslint:disable:max-line-length
const thenify = require("thenify");
PseudoSession.prototype.read = thenify.withCallback(PseudoSession.prototype.read);
PseudoSession.prototype.browse = thenify.withCallback(PseudoSession.prototype.browse);
PseudoSession.prototype.browseNext = thenify.withCallback(PseudoSession.prototype.browseNext);
PseudoSession.prototype.getArgumentDefinition = thenify.withCallback(PseudoSession.prototype.getArgumentDefinition);
PseudoSession.prototype.call = thenify.withCallback(PseudoSession.prototype.call);
PseudoSession.prototype.translateBrowsePath = thenify.withCallback(PseudoSession.prototype.translateBrowsePath);
//# sourceMappingURL=pseudo_session.js.map