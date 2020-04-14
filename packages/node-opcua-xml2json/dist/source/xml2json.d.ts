/**
 * @module node-opcua-xml2json
 * node -> see if https://github.com/isaacs/sax-js could be used instead
 */
export declare type SimpleCallback = (err?: Error) => void;
export declare type Callback<T> = (err?: Error | null, result?: T) => void;
export interface Parser {
    [key: string]: ReaderState;
}
export interface XmlAttributes {
    [key: string]: string;
}
export interface ReaderStateParser {
    parser?: ParserLike;
    init?: (this: IReaderState, name: string, attrs: XmlAttributes, parent: IReaderState, engine: Xml2Json) => void;
    finish?: (this: IReaderState) => void;
    startElement?: (this: IReaderState, name: string, attrs: XmlAttributes) => void;
    endElement?: (this: IReaderState, name: string) => void;
}
export interface ParserLike {
    [key: string]: ReaderStateParserLike;
}
export interface ReaderStateParserLike {
    parser?: ParserLike;
    init?: (this: any, name: string, attrs: XmlAttributes, parent: IReaderState, engine: Xml2Json) => void;
    finish?: (this: any) => void;
    startElement?: (this: any, name: string, attrs: XmlAttributes) => void;
    endElement?: (this: any, name: string) => void;
}
export interface IReaderState {
    _on_init(elementName: string, attrs: XmlAttributes, parent: IReaderState, level: number, engine: Xml2Json): void;
    _on_finish(): void;
    _on_startElement(level: number, elementName: string, attrs: XmlAttributes): void;
    _on_endElement(level: number, elementName: string): void;
    _on_endElement2(level: number, elementName: string): void;
    _on_text(text: string): void;
}
declare type withPojoLambda = (name: string, pojo: any) => void;
/**
 * @class ReaderState
 * @private
 * @param options
 * @param [options.parser=null]  {map<ReaderState|options}}
 * @param [options.init|null]
 * @param [options.finish]
 * @param [options.startElement]
 * @param [options.endElement]
 */
export declare class ReaderState implements IReaderState {
    _init?: (name: string, attrs: XmlAttributes, parent: IReaderState, engine: Xml2Json) => void;
    _finish?: () => void;
    _startElement?: (name: string, attrs: XmlAttributes) => void;
    _endElement?: (name: string) => void;
    parser: any;
    attrs?: XmlAttributes;
    chunks: any[];
    text: string;
    name?: string;
    level: number;
    currentLevel: number;
    engine?: Xml2Json;
    parent?: IReaderState;
    root?: Xml2Json;
    data?: any;
    constructor(options: ReaderStateParser | ReaderState);
    /**
     * @method _on_init
     * @param elementName  - the name of the element
     * @param attrs
     * @param parent
     * @param level
     * @param engine
     * @protected
     */
    _on_init(elementName: string, attrs: XmlAttributes, parent: IReaderState, level: number, engine: Xml2Json): void;
    _on_finish(): void;
    /**
     * @param level
     * @param elementName   - the name of the element
     * @param attrs
     * @protected
     */
    _on_startElement(level: number, elementName: string, attrs: XmlAttributes): void;
    _on_endElement2(level: number, elementName: string): void;
    /**
     * @method _on_endElement
     * @protected
     */
    _on_endElement(level: number, elementName: string): void;
    /**
     * @method _on_text
     * @param text {String} the text found inside the element
     * @protected
     */
    _on_text(text: string): void;
    startPojo(elementName: string, attrs: XmlAttributes, withPojo: withPojoLambda): void;
}
/**
 * @class Xml2Json
 * @param options - the state machine as  a ReaderState node.
 * @param [options.parser=null]  {ReaderState}
 * @param [options.init|null]
 * @param [options.finish]
 * @param [options.startElement]
 * @param [options.endElement]
 * @constructor
 *
 * @example
 *  var parser = new Xml2Json({
 *       parser: {
 *           'person': {
 *               init: function(name,attrs) {
 *                   this.parent.root.obj = {};
 *                   this.obj =  this.parent.root.obj;
 *                   this.obj['name'] = attrs['name'];
 *               },
 *               parser: {
 *                   'address': {
 *                       finish: function(){
 *                           this.parent.obj['address'] = this.text;
 *                       }
 *                   }
 *               }
 *           }
 *       }
 *   });
 *
 * var xml_string =  "<employees>" +
 * "  <person name='John'>" +
 * "     <address>Paris</address>" +
 * "   </person>" +
 * "</employees>";
 *
 * parser.parseString(xml_string, function() {
 *       parser.obj.should.eql({name: 'John',address: 'Paris'});
 *       done();
 *   });
 */
export declare class Xml2Json {
    currentLevel: number;
    _pojo: {};
    private state_stack;
    private current_state;
    constructor(options?: ReaderStateParser);
    /**
     * @method parseString
     * @async
     */
    parseString(xml_text: string): Promise<any>;
    parseString(xml_text: string, callback: Callback<any> | SimpleCallback): void;
    /**
     * @method  parse
     * @async
     * @param xmlFile - the name of the xml file to parse.
     */
    parse(xmlFile: string): Promise<any>;
    parse(xmlFile: string, callback: Callback<any> | SimpleCallback): void;
    /**
     * @param new_state
     * @param name
     * @param attr
     * @private
     * @internal
     */
    _promote(new_state: IReaderState, level: number, name?: string, attr?: XmlAttributes): void;
    /**
     *
     * @private
     * @internal
     */
    _demote(cur_state: IReaderState, level: number, elementName: string): void;
    private _prepareParser;
}
declare class ReaderState2 implements IReaderState {
    _stack: any;
    _pojo: any;
    _element: any;
    text: string;
    _withPojo: withPojoLambda;
    private parent?;
    private engine?;
    private initLevel;
    constructor();
    _on_init(elementName: string, attrs: XmlAttributes, parent: IReaderState, level: number, engine: Xml2Json): void;
    _on_finish(): void;
    _on_startElement(level: number, elementName: string, attrs: XmlAttributes): void;
    _on_endElement2(level: number, elementName: string): void;
    _on_endElement(level: number, elementName: string): void;
    _on_text(text: string): void;
}
export declare const json_extractor: ReaderState2;
export declare const json_parser: ReaderStateParser;
export {};
