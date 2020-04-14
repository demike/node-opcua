/**
 * @module node-opcua-service-discovery
 */
import * as bonjour from "bonjour";
export declare function acquireBonjour(): bonjour.Bonjour;
export declare function releaseBonjour(): void;
export interface Announcement {
    port: number;
    path: string;
    name: string;
    capabilities: string[];
}
export declare function sameAnnouncement(a: Announcement, b: Announcement): boolean;
export declare function _announceServerOnMulticastSubnet(multicastDNS: bonjour.Bonjour, options: Announcement): Promise<bonjour.Service>;
export declare class BonjourHolder {
    announcement?: Announcement;
    private _multicastDNS?;
    private _service?;
    _announcedOnMulticastSubnet(options: Announcement): Promise<boolean>;
    _announcedOnMulticastSubnetWithCallback(options: Announcement, callback: (err: Error | null, result?: boolean) => void): void;
    _stop_announcedOnMulticastSubnet(): Promise<void>;
    _stop_announcedOnMulticastSubnetWithCallback(callback: (err: Error | null) => void): void;
}
