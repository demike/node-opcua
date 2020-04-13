"use strict";
/**
 * @module node-opcua-xml2json
 * node -> see if https://github.com/isaacs/sax-js could be used instead
 */
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:max-classes-per-file
// tslint:disable:no-var-requires
// tslint:disable:unified-signatures
const fs = require("fs");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_utils_1 = require("node-opcua-utils");
const _ = require("underscore");
const LtxParser = require("ltx/lib/parsers/ltx.js");
/**
 * @static
 * @private
 * @method _coerceParser
 * @param parser {map<ReaderState|options>}
 * @return {map}
 */
function _coerceParser(parser) {
    for (const name of Object.keys(parser)) {
        if (parser[name] && !(parser[name] instanceof ReaderState)) {
            // this is to prevent recursion
            const tmp = parser[name];
            delete parser[name];
            parser[name] = new ReaderState(tmp);
        }
    }
    return parser;
}
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
class ReaderState {
    constructor(options) {
        this.chunks = [];
        this.text = "";
        this.name = "";
        this.level = -1;
        this.currentLevel = -1;
        // ensure options object has only expected properties
        options.parser = options.parser || {};
        if (!(options instanceof ReaderState)) {
            const fields = _.keys(options);
            const invalid_fields = _.difference(fields, ["parser", "init", "finish", "startElement", "endElement"]);
            /* istanbul ignore next*/
            if (invalid_fields.length !== 0) {
                // tslint:disable:no-console
                throw new Error("Invalid filed detected in ReaderState Parser ! : " +
                    invalid_fields.join(" - ") +
                    " t =" + options.constructor.name);
            }
            this._init = options.init;
            this._finish = options.finish;
            this._startElement = options.startElement;
            this._endElement = options.endElement;
        }
        this.parser = _coerceParser(options.parser);
    }
    /**
     * @method _on_init
     * @param elementName  - the name of the element
     * @param attrs
     * @param parent
     * @param level
     * @param engine
     * @protected
     */
    _on_init(elementName, attrs, parent, level, engine) {
        this.name = elementName;
        this.parent = parent;
        this.engine = engine;
        this.data = {};
        this.level = level;
        this.currentLevel = this.level;
        this.attrs = attrs;
        node_opcua_assert_1.assert(this.attrs);
        if (this._init) {
            this._init(elementName, attrs, parent, engine);
        }
    }
    _on_finish() {
        if (this._finish) {
            this._finish();
        }
    }
    /**
     * @param level
     * @param elementName   - the name of the element
     * @param attrs
     * @protected
     */
    _on_startElement(level, elementName, attrs) {
        this.currentLevel = level;
        // console.log("wxxxx _on_startElement#" + this.name, elementName, this.currentLevel);
        this.chunks = [];
        this.text = "";
        if (this._startElement) {
            this._startElement(elementName, attrs);
        }
        if (this.engine && this.parser.hasOwnProperty(elementName)) {
            // console.log("promoting ", elementName, this.level);
            this.engine._promote(this.parser[elementName], level, elementName, attrs);
        }
    }
    _on_endElement2(level, elementName) {
        if (this._endElement) {
            this._endElement(elementName);
        }
    }
    /**
     * @method _on_endElement
     * @protected
     */
    _on_endElement(level, elementName) {
        // console.log("wxxxx _on_endElement#" + this.name, elementName, level, this.currentLevel);
        node_opcua_assert_1.assert(this.attrs);
        this.chunks = this.chunks || [];
        if (this.level > level) {
            // we end a child element of this node
            this._on_endElement2(level, elementName);
        }
        else if (this.level === level) {
            // we received the end event of this node
            // we need to finish
            this.text = this.chunks.join("");
            this.chunks = [];
            // this is the end
            this._on_finish();
            if (this.parent && this.parent.parser && this.parent.parser.hasOwnProperty(elementName)) {
                // console.log("xxx    demoting#" + this.name, elementName, this.level);
                this.engine._demote(this, level, elementName);
            }
        }
    }
    /**
     * @method _on_text
     * @param text {String} the text found inside the element
     * @protected
     */
    _on_text(text) {
        this.chunks = this.chunks || [];
        text = text.trim();
        if (text.length === 0) {
            return;
        }
        this.chunks.push(text);
    }
    startPojo(elementName, attrs, withPojo) {
        this.engine._promote(exports.json_extractor, this.engine.currentLevel, elementName, attrs);
        exports.json_extractor._withPojo = (name, pojo) => {
            withPojo(name, pojo);
            this.engine._demote(exports.json_extractor, this.engine.currentLevel, elementName);
        };
    }
}
exports.ReaderState = ReaderState;
const regexp = /(([^:]+):)?(.*)/;
function resolve_namespace(name) {
    const m = name.match(regexp);
    if (!m) {
        throw new Error("Invalid match");
    }
    return {
        ns: m[2],
        tag: m[3]
    };
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
class Xml2Json {
    constructor(options) {
        this.currentLevel = 0;
        this._pojo = {};
        this.state_stack = [];
        this.current_state = null;
        if (!options) {
            this.state_stack = [];
            this.current_state = null;
            this._promote(exports.json_extractor, 0);
            return;
        }
        const state = (options instanceof ReaderState)
            ? options : new ReaderState(options);
        state.root = this;
        this.state_stack = [];
        this.current_state = null;
        this._promote(state, 0);
    }
    parseString(xml_text, callback) {
        const parser = this._prepareParser(callback);
        parser.write(xml_text);
        parser.end();
    }
    parse(xmlFile, callback) {
        if (!callback) {
            throw new Error("internal error");
        }
        const readWholeFile = true;
        if (readWholeFile) {
            // slightly faster but require more memory ..
            fs.readFile(xmlFile, (err, data) => {
                if (err) {
                    return callback(err);
                }
                if (data[0] === 0xEF && data[1] === 0xBB && data[2] === 0xBF) {
                    data = data.slice(3);
                }
                const dataAsString = data.toString();
                const parser = this._prepareParser(callback);
                parser.write(dataAsString);
                parser.end();
            });
        }
        else {
            const Bomstrip = require("bomstrip");
            const parser = this._prepareParser(callback);
            fs.createReadStream(xmlFile, { autoClose: true, encoding: "utf8" })
                .pipe(new Bomstrip())
                .pipe(parser);
        }
    }
    /**
     * @param new_state
     * @param name
     * @param attr
     * @private
     * @internal
     */
    _promote(new_state, level, name, attr) {
        attr = attr || {};
        this.state_stack.push({
            backup: {},
            state: this.current_state
        });
        const parent = this.current_state;
        this.current_state = new_state;
        this.current_state._on_init(name || "???", attr, parent, level, this);
    }
    /**
     *
     * @private
     * @internal
     */
    _demote(cur_state, level, elementName) {
        ///  assert(this.current_state === cur_state);
        const { state, backup } = this.state_stack.pop();
        this.current_state = state;
        if (this.current_state) {
            this.current_state._on_endElement2(level, elementName);
        }
    }
    _prepareParser(callback) {
        node_opcua_assert_1.assert(callback instanceof Function);
        const parser = new LtxParser();
        this.currentLevel = 0;
        parser.on("startElement", (name, attrs) => {
            const tag_ns = resolve_namespace(name);
            this.currentLevel += 1;
            if (this.current_state) {
                this.current_state._on_startElement(this.currentLevel, tag_ns.tag, attrs);
            }
        });
        parser.on("endElement", (name) => {
            const tag_ns = resolve_namespace(name);
            if (this.current_state) {
                this.current_state._on_endElement(this.currentLevel, tag_ns.tag);
            }
            this.currentLevel -= 1;
            if (this.currentLevel === 0) {
                parser.emit("close");
            }
        });
        parser.on("text", (text) => {
            text = text.trim();
            if (text.length === 0) {
                return;
            }
            if (this.current_state) {
                this.current_state._on_text(text);
            }
        });
        parser.on("close", () => {
            if (callback) {
                callback(null, this._pojo);
            }
        });
        return parser;
    }
}
exports.Xml2Json = Xml2Json;
class ReaderState2 {
    constructor() {
        this.initLevel = 0;
        this._pojo = {};
        this._stack = [];
        this._element = {};
        this.text = "";
        this.parent = undefined;
        this._withPojo = (pojo) => {
        };
    }
    _on_init(elementName, attrs, parent, level, engine) {
        this.parent = parent;
        this.engine = engine;
        this.initLevel = level;
        if (this._stack.length === 0) {
            this._pojo = {};
            this._element = this._pojo;
        }
    }
    _on_finish() {
        /* empy */
    }
    _on_startElement(level, elementName, attrs) {
        this._stack.push(this._element);
        if (elementName.match(/^ListOf/)) {
            elementName = elementName.substring(6);
            const elName = node_opcua_utils_1.lowerFirstLetter(elementName);
            if (this._element instanceof Array) {
                const array = [];
                this._element.push(array);
                this._element = array;
            }
            else {
                this._element[elName] = [];
                this._element = this._element[elName];
            }
        }
        else {
            const elName = node_opcua_utils_1.lowerFirstLetter(elementName);
            if (this._element instanceof Array) {
                const obj = {};
                this._element.push(obj);
                this._element = obj;
            }
            else {
                this._element[elName] = {};
                this._element = this._element[elName];
            }
        }
    }
    _on_endElement2(level, elementName) {
        /* empty */
    }
    _on_endElement(level, elementName) {
        this._element = this._stack.pop();
        if (this.text.length > 0 && this._element) {
            const elName = node_opcua_utils_1.lowerFirstLetter(elementName);
            this._element[elName] = this.text;
            this.engine._pojo = this._pojo;
        }
        else {
            const elName = node_opcua_utils_1.lowerFirstLetter(elementName);
            if (this.initLevel === level) {
                if (this._withPojo) {
                    if (this.text.length) {
                        this._withPojo.call(null, elName, this.text);
                    }
                    else {
                        this._withPojo.call(null, elName, this._pojo);
                    }
                }
            }
        }
        this.text = "";
    }
    _on_text(text) {
        this.text = text;
    }
}
exports.json_extractor = new ReaderState2();
exports.json_parser = {
    init(elementName, attrs, parent, engine) {
        exports.json_extractor._on_init(elementName, attrs, parent, 0, engine);
    },
    finish() {
        this.parent._pojo = exports.json_extractor._pojo;
    }
};
// tslint:disable:no-var-requires
const thenify = require("thenify");
const opts = { multiArgs: false };
Xml2Json.prototype.parseString =
    thenify.withCallback(Xml2Json.prototype.parseString, opts);
Xml2Json.prototype.parse =
    thenify.withCallback(Xml2Json.prototype.parse, opts);
//# sourceMappingURL=xml2json.js.map