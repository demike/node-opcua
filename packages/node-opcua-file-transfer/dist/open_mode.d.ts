/**
 * @module node-opcua-file-transfer-server
 */
export declare enum OpenFileModeMask {
    ReadBit = 1,
    WriteBit = 2,
    EraseExistingBit = 4,
    AppendBit = 8
}
export declare enum OpenFileMode {
    /**
     *       Read         bit 0   The file is opened for reading. If this bit is not
     *                            set the Read Method cannot be executed.
     */
    Read = 1,
    /**
     *      Write         bit 1   The file is opened for writing. If this bit is not
     *                            set the Write Method cannot be executed.
     *
     */
    Write = 2,
    ReadWrite = 3,
    /**
     *
     *  WriteEraseExisting
     *      EraseExisting 2   This bit can only be set if the file is opened for writing
     *                        (Write bit is set). The existing content of the file is
     *                        erased and an empty file is provided.
     */
    WriteEraseExisting = 6,
    ReadWriteEraseExisting = 7,
    /**
     *      Append        3   When the Append bit is set the file is opened at end
     *                        of the file, otherwise at begin of the file.
     *                        The SetPosition Method can be used to change the position.
     */
    WriteAppend = 10,
    ReadWriteAppend = 11
}
