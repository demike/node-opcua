/**
 * @module node-opcua-data-access
 */
export { EUInformation } from "node-opcua-types";
import { EUInformation } from "node-opcua-types";
export declare function commonCodeToUInt(code: string): number;
export declare function makeEUInformation(symbol: string, shortName: string, longName: string): EUInformation;
export declare const standardUnits: {
    ampere: EUInformation;
    bar: EUInformation;
    becquerel: EUInformation;
    centimetre: EUInformation;
    cubic_centimetre: EUInformation;
    cubic_centimetre_per_second: EUInformation;
    cubic_metre: EUInformation;
    cubic_metre_per_hour: EUInformation;
    curie: EUInformation;
    curie_per_kilogram: EUInformation;
    degree: EUInformation;
    degree_celsius: EUInformation;
    degree_fahrenheit: EUInformation;
    dots_per_inch: EUInformation;
    electron_volt: EUInformation;
    farad: EUInformation;
    gigabecquerel: EUInformation;
    gram: EUInformation;
    joule: EUInformation;
    kelvin: EUInformation;
    kilo_electron_volt: EUInformation;
    kilobecquerel: EUInformation;
    kilohertz: EUInformation;
    mega_electron_volt: EUInformation;
    megawatt: EUInformation;
    metre: EUInformation;
    microsecond: EUInformation;
    millimetre: EUInformation;
    millisecond: EUInformation;
    newton: EUInformation;
    percent: EUInformation;
    pixel: EUInformation;
    second: EUInformation;
    volt: EUInformation;
    watt: EUInformation;
};
