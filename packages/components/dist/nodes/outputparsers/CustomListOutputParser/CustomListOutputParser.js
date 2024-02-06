"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../../../src");
const output_parser_1 = require("langchain/schema/output_parser");
const output_parsers_1 = require("langchain/output_parsers");
const OutputParserHelpers_1 = require("../OutputParserHelpers");
class CustomListOutputParser {
    constructor() {
        this.label = 'Custom List Output Parser';
        this.name = 'customListOutputParser';
        this.version = 1.0;
        this.type = 'CustomListOutputParser';
        this.description = 'Parse the output of an LLM call as a list of values.';
        this.icon = 'list.png';
        this.category = OutputParserHelpers_1.CATEGORY;
        this.baseClasses = [this.type, ...(0, src_1.getBaseClasses)(output_parser_1.BaseOutputParser)];
        this.inputs = [
            {
                label: 'Length',
                name: 'length',
                type: 'number',
                default: 5,
                step: 1,
                description: 'Number of values to return'
            },
            {
                label: 'Separator',
                name: 'separator',
                type: 'string',
                description: 'Separator between values',
                default: ','
            },
            {
                label: 'Autofix',
                name: 'autofixParser',
                type: 'boolean',
                optional: true,
                description: 'In the event that the first call fails, will make another call to the model to fix any errors.'
            }
        ];
    }
    async init(nodeData) {
        const separator = nodeData.inputs?.separator;
        const lengthStr = nodeData.inputs?.length;
        const autoFix = nodeData.inputs?.autofixParser;
        let length = 5;
        if (lengthStr)
            length = parseInt(lengthStr, 10);
        const parser = new output_parsers_1.CustomListOutputParser({ length: length, separator: separator });
        Object.defineProperty(parser, 'autoFix', {
            enumerable: true,
            configurable: true,
            writable: true,
            value: autoFix
        });
        return parser;
    }
}
module.exports = { nodeClass: CustomListOutputParser };
//# sourceMappingURL=CustomListOutputParser.js.map