/**
 * @module node-opcua-secure-channel
 */
/**
 * SequenceNumberGenerator manages a monotonically increasing sequence number.
 * @class SequenceNumberGenerator
 * @constructor
 *
 * @see OPC Unified Architecture, Part 6 -  $6.4.2 page 36 -
 *
 * The SequenceNumber shall also monotonically increase for all messages and shall not wrap
 * around until it is greater than 4294966271 (UInt32.MaxValue – 1024). The first number after
 * the wrap around shall be less than 1024. Note that this requirement means that
 * SequenceNumbers do not reset when a new TokenId is issued.
 * The SequenceNumber shall be incremented by exactly one for each MessageChunk sent unless
 * the communication channel was interrupted and re-established. Gaps are permitted between the
 * SequenceNumber for the last MessageChunk received before the interruption and the
 */
export declare class SequenceNumberGenerator {
    static MAXVALUE: number;
    private _counter;
    constructor();
    next(): number;
    future(): number;
    private _set;
}
