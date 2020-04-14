/// <reference types="node" />
declare type encode_decode_round_trip_testCallback = (buffer: Buffer, encoding: any, options: any) => void;
/**
 * @method encode_decode_round_trip_test
 * @param obj  : object to test ( the object must provide a binaryStoreSize,encode,decode method
 * @param [options]
 * @param callback_buffer
 * @return {*}
 */
export declare function encode_decode_round_trip_test(obj: any, options?: any, callback_buffer?: encode_decode_round_trip_testCallback): any;
export declare function json_encode_decode_round_trip_test(obj: any, options: any, callbackBuffer?: any): any;
export {};
