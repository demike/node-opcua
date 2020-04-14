import { UAFileType } from "node-opcua-address-space";
/**
 *
 */
export interface FileOptions {
    /**
     * the filaname of the physical file which is managed by the OPCUA filetpye
     */
    filename: string;
    /**
     * the maximum allowed size of the  phisical file.
     */
    maxSize?: number;
    /**
     * an optional mimeType
     */
    mineType?: string;
}
/**
 *
 */
export declare class FileTypeData {
    filename: string;
    maxSize: number;
    mimeType: string;
    private file;
    private _openCount;
    private _fileSize;
    constructor(options: FileOptions, file: UAFileType);
    openCount: number;
    fileSize: number;
    /**
     * refresh position and size
     * this method should be call by the server if the file
     * is modified externally
     *
     */
    refresh(): Promise<void>;
}
export declare function getFileData(opcuaFile2: UAFileType): FileTypeData;
export declare const defaultMaxSize = 100000000;
/**
 * bind all methods of a UAFileType OPCUA node
 * @param file the OPCUA Node that has a typeDefinition of FileType
 * @param options the options
 */
export declare function installFileType(file: UAFileType, options: FileOptions): void;
