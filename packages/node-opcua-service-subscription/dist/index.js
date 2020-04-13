"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-service-subscription
 */
var node_opcua_types_1 = require("node-opcua-types");
exports.NotificationData = node_opcua_types_1.NotificationData;
exports.MonitoringMode = node_opcua_types_1.MonitoringMode;
exports.DataChangeTrigger = node_opcua_types_1.DataChangeTrigger;
exports.CreateSubscriptionRequest = node_opcua_types_1.CreateSubscriptionRequest;
exports.CreateSubscriptionResponse = node_opcua_types_1.CreateSubscriptionResponse;
exports.ModifySubscriptionRequest = node_opcua_types_1.ModifySubscriptionRequest;
exports.ModifySubscriptionResponse = node_opcua_types_1.ModifySubscriptionResponse;
exports.MonitoringParameters = node_opcua_types_1.MonitoringParameters;
exports.MonitoredItemCreateRequest = node_opcua_types_1.MonitoredItemCreateRequest;
exports.MonitoredItemCreateResult = node_opcua_types_1.MonitoredItemCreateResult;
exports.CreateMonitoredItemsRequest = node_opcua_types_1.CreateMonitoredItemsRequest;
exports.CreateMonitoredItemsResponse = node_opcua_types_1.CreateMonitoredItemsResponse;
exports.SubscriptionAcknowledgement = node_opcua_types_1.SubscriptionAcknowledgement;
exports.PublishRequest = node_opcua_types_1.PublishRequest;
exports.NotificationMessage = node_opcua_types_1.NotificationMessage;
exports.DataChangeNotification = node_opcua_types_1.DataChangeNotification;
exports.StatusChangeNotification = node_opcua_types_1.StatusChangeNotification;
exports.EventNotificationList = node_opcua_types_1.EventNotificationList;
exports.PublishResponse = node_opcua_types_1.PublishResponse;
exports.RepublishRequest = node_opcua_types_1.RepublishRequest;
exports.RepublishResponse = node_opcua_types_1.RepublishResponse;
exports.DeleteMonitoredItemsRequest = node_opcua_types_1.DeleteMonitoredItemsRequest;
exports.DeleteMonitoredItemsResponse = node_opcua_types_1.DeleteMonitoredItemsResponse;
exports.SetPublishingModeRequest = node_opcua_types_1.SetPublishingModeRequest;
exports.SetPublishingModeResponse = node_opcua_types_1.SetPublishingModeResponse;
exports.DeleteSubscriptionsRequest = node_opcua_types_1.DeleteSubscriptionsRequest;
exports.DeleteSubscriptionsResponse = node_opcua_types_1.DeleteSubscriptionsResponse;
exports.MonitoredItemNotification = node_opcua_types_1.MonitoredItemNotification;
exports.MonitoredItemModifyRequest = node_opcua_types_1.MonitoredItemModifyRequest;
exports.MonitoredItemModifyResult = node_opcua_types_1.MonitoredItemModifyResult;
exports.ModifyMonitoredItemsRequest = node_opcua_types_1.ModifyMonitoredItemsRequest;
exports.ModifyMonitoredItemsResponse = node_opcua_types_1.ModifyMonitoredItemsResponse;
exports.SetMonitoringModeRequest = node_opcua_types_1.SetMonitoringModeRequest;
exports.SetMonitoringModeResponse = node_opcua_types_1.SetMonitoringModeResponse;
exports.EventFilterResult = node_opcua_types_1.EventFilterResult;
exports.ContentFilterResult = node_opcua_types_1.ContentFilterResult;
exports.ContentFilterElementResult = node_opcua_types_1.ContentFilterElementResult;
exports.EventFieldList = node_opcua_types_1.EventFieldList;
exports.DataChangeFilter = node_opcua_types_1.DataChangeFilter;
exports.AggregateFilter = node_opcua_types_1.AggregateFilter;
exports.SetTriggeringRequest = node_opcua_types_1.SetTriggeringRequest;
exports.SetTriggeringResponse = node_opcua_types_1.SetTriggeringResponse;
exports.TransferResult = node_opcua_types_1.TransferResult;
exports.TransferSubscriptionsRequest = node_opcua_types_1.TransferSubscriptionsRequest;
exports.TransferSubscriptionsResponse = node_opcua_types_1.TransferSubscriptionsResponse;
__export(require("./deadband_checker"));
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_types_2 = require("node-opcua-types");
node_opcua_assert_1.assert(node_opcua_types_2.PublishResponse.schema.fields[1].name === "subscriptionId");
node_opcua_types_2.PublishResponse.schema.fields[1].defaultValue = 0xFFFFFFFF;
node_opcua_assert_1.assert(node_opcua_types_2.MonitoringParameters.schema.fields[0].name === "clientHandle");
node_opcua_types_2.MonitoringParameters.schema.fields[0].defaultValue = 0xFFFFFFFF;
//# sourceMappingURL=index.js.map