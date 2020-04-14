export declare function setDebugFlag(scriptFullPath: string, flag: boolean): void;
export declare function checkDebugFlag(scriptFullPath: string): boolean;
/**
 * @method make_debugLog
 * @param scriptFullPath:string
 * @return returns a  debugLog function that will write message to the console
 * if the DEBUG environment variable indicates that the provided source file shall display debug trace
 *
 */
export declare function make_debugLog(scriptFullPath: string): (...arg: any[]) => void;
export declare function make_errorLog(context: string): (...arg: any[]) => void;
