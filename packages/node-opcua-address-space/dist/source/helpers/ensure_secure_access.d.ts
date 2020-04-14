import { BaseNode } from "../address_space_ts";
/**
 * make sure that the given ia node can only be read
 * by Admistrrator user on a encrypted channel
 * @param node
 */
export declare function ensureObjectIsSecure(node: BaseNode): void;
