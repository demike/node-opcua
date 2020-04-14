/// <reference types="node" />
/**
 * @module node-opcua-utils
 */
import { EventEmitter } from "events";
export interface IWatchdogData2 {
    key: number;
    subscriber: ISubscriber;
    timeout: number;
    lastSeen: number;
    visitCount: number;
}
export interface ISubscriber {
    _watchDog?: WatchDog;
    _watchDogData?: IWatchdogData2;
    watchdogReset: () => void;
    keepAlive?: () => void;
    onClientSeen?: (t: Date) => void;
}
export declare class WatchDog extends EventEmitter {
    /**
     * returns the number of subscribers using the WatchDog object.
     */
    readonly subscriberCount: number;
    private readonly _watchdogDataMap;
    private _counter;
    private _currentTime;
    private _timer;
    private readonly _visitSubscriberB;
    constructor();
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
    addSubscriber(subscriber: ISubscriber, timeout: number): number;
    removeSubscriber(subscriber: ISubscriber): void;
    shutdown(): void;
    private _visit_subscriber;
    private _start_timer;
    private _stop_timer;
}
