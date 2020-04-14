import { TCP_transport } from "./tcp_transport";
export declare type ErrorCallback = (err?: Error) => void;
/**
 * a ClientTCP_transport connects to a remote server socket and
 * initiates a communication with a HEL/ACK transaction.
 * It negotiates the communication parameters with the other end.
 *
 * @class ClientTCP_transport
 * @extends TCP_transport
 * @constructor
 * @example
 *
 *    ```javascript
 *    const transport = ClientTCP_transport(url);
 *
 *    transport.timeout = 1000;
 *
 *    transport.connect(function(err)) {
 *         if (err) {
 *            // cannot connect
 *         } else {
 *            // connected
 *
 *         }
 *    });
 *    ....
 *
 *    transport.write(message_chunk,'F');
 *
 *    ....
 *
 *    transport.on("message",function(message_chunk) {
 *        // do something with message from server...
 *    });
 *
 *
 *    ```
 *
 *
 */
export declare class ClientTCP_transport extends TCP_transport {
    endpointUrl: string;
    serverUri: string;
    numberOfRetry: number;
    private connected;
    private parameters?;
    private _counter;
    constructor();
    dispose(): void;
    connect(endpointUrl: string, callback: ErrorCallback): void;
    protected on_socket_ended(err: Error | null): void;
    private _handle_ACK_response;
    private _send_HELLO_request;
    private _on_ACK_response;
    private _perform_HEL_ACK_transaction;
}
