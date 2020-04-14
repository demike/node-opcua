/// <reference types="node" />
/**
 * @method decompose_message_body_in_chunks
 *
 * @param messageBody
 * @param msgType
 * @param chunkSize
 * @return {Array}
 *
 * wrap a message body into one or more messageChunks
 * (  use this method to build fake data blocks in tests)
 */
export declare function decompose_message_body_in_chunks(messageBody: Buffer, msgType: string, chunkSize: number): Buffer[];
