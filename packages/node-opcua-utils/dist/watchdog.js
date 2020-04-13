"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-utils
 */
const events_1 = require("events");
const node_opcua_assert_1 = require("node-opcua-assert");
const _ = require("underscore");
function has_expired(watchDogData, currentTime) {
    const elapsedTime = currentTime - watchDogData.lastSeen;
    return elapsedTime > watchDogData.timeout;
}
function keepAliveFunc() {
    const self = this;
    node_opcua_assert_1.assert(self._watchDog instanceof WatchDog);
    if (!self._watchDogData) {
        throw new Error("Internal error");
    }
    node_opcua_assert_1.assert(_.isNumber(self._watchDogData.key));
    self._watchDogData.lastSeen = Date.now();
    if (self.onClientSeen) {
        self.onClientSeen(new Date(self._watchDogData.lastSeen));
    }
}
class WatchDog extends events_1.EventEmitter {
    constructor() {
        super();
        this._watchdogDataMap = {};
        this._counter = 0;
        this._currentTime = Date.now();
        this._visitSubscriberB = this._visit_subscriber.bind(this);
        this._timer = null; // as NodeJS.Timer;
    }
    /**
     * returns the number of subscribers using the WatchDog object.
     */
    get subscriberCount() {
        return Object.keys(this._watchdogDataMap).length;
    }
    /**
     * add a subscriber to the WatchDog.
     * @method addSubscriber
     *
     * add a subscriber to the WatchDog.
     *
     * This method modifies the subscriber be adding a
     * new method to it called 'keepAlive'
     * The subscriber must also provide a "watchdogReset". watchdogReset will be called
     * if the subscriber failed to call keepAlive withing the timeout period.
     * @param subscriber
     * @param timeout
     * @return the numerical key associated with this subscriber
     */
    addSubscriber(subscriber, timeout) {
        const self = this;
        self._currentTime = Date.now();
        timeout = timeout || 1000;
        node_opcua_assert_1.assert(_.isNumber(timeout), " invalid timeout ");
        node_opcua_assert_1.assert(_.isFunction(subscriber.watchdogReset), " the subscriber must provide a watchdogReset method ");
        node_opcua_assert_1.assert(!_.isFunction(subscriber.keepAlive));
        self._counter += 1;
        const key = self._counter;
        subscriber._watchDog = self;
        subscriber._watchDogData = {
            key,
            lastSeen: self._currentTime,
            subscriber,
            timeout,
            visitCount: 0
        };
        self._watchdogDataMap[key] = subscriber._watchDogData;
        if (subscriber.onClientSeen) {
            subscriber.onClientSeen(new Date(subscriber._watchDogData.lastSeen));
        }
        subscriber.keepAlive = keepAliveFunc.bind(subscriber);
        // start timer when the first subscriber comes in
        if (self.subscriberCount === 1) {
            node_opcua_assert_1.assert(self._timer === null);
            this._start_timer();
        }
        return key;
    }
    removeSubscriber(subscriber) {
        if (!subscriber._watchDog) {
            return; // already removed !!!
        }
        if (!subscriber._watchDogData) {
            throw new Error("Internal error");
        }
        node_opcua_assert_1.assert(subscriber._watchDog instanceof WatchDog);
        node_opcua_assert_1.assert(_.isNumber(subscriber._watchDogData.key));
        node_opcua_assert_1.assert(_.isFunction(subscriber.keepAlive));
        node_opcua_assert_1.assert(this._watchdogDataMap.hasOwnProperty(subscriber._watchDogData.key));
        delete this._watchdogDataMap[subscriber._watchDogData.key];
        delete subscriber._watchDog;
        delete subscriber._watchDogData;
        delete subscriber.keepAlive;
        // delete timer when the last subscriber comes out
        if (this.subscriberCount === 0) {
            this._stop_timer();
        }
    }
    shutdown() {
        node_opcua_assert_1.assert(this._timer === null && Object.keys(this._watchdogDataMap).length === 0, " leaking subscriber in watchdog");
    }
    _visit_subscriber() {
        const self = this;
        self._currentTime = Date.now();
        const expiredSubscribers = _.filter(self._watchdogDataMap, (watchDogData) => {
            watchDogData.visitCount += 1;
            return has_expired(watchDogData, self._currentTime);
        });
        // xx console.log("_visit_subscriber", _.map(expired_subscribers, _.property("key")));
        if (expiredSubscribers.length) {
            self.emit("timeout", expiredSubscribers);
        }
        expiredSubscribers.forEach((watchDogData) => {
            self.removeSubscriber(watchDogData.subscriber);
            watchDogData.subscriber.watchdogReset();
        });
        // xx self._current_time = Date.now();
    }
    _start_timer() {
        node_opcua_assert_1.assert(this._timer === null, " setInterval already called ?");
        this._timer = setInterval(this._visitSubscriberB, 1000);
    }
    _stop_timer() {
        node_opcua_assert_1.assert(this._timer !== null, "_stop_timer already called ?");
        if (this._timer !== null) {
            clearInterval(this._timer);
            this._timer = null;
        }
    }
}
exports.WatchDog = WatchDog;
//# sourceMappingURL=watchdog.js.map