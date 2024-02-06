"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../../../src");
const output_parser_1 = require("langchain/schema/output_parser");
const output_parsers_1 = require("langchain/output_parsers");
const OutputParserHelpers_1 = require("../OutputParserHelpers");
const zod_1 = require("zod");
class StructuredOutputParser {
    constructor() {
        this.label = 'Structured Output Parser';
        this.name = 'structuredOutputParser';
        this.version = 1.0;
        this.type = 'StructuredOutputParser';
        this.description = 'Parse the output of an LLM call into a given (JSON) structure.';
        this.icon = 'structure.png';
        this.category = OutputParserHelpers_1.CATEGORY;
        this.baseClasses = [this.type, ...(0, src_1.getBaseClasses)(output_parser_1.BaseOutputParser)];
        this.inputs = [
            {
                label: 'Autofix',
                name: 'autofixParser',
                type: 'boolean',
                optional: true,
                description: 'In the event that the first call fails, will make another call to the model to fix any errors.'
            },
            {
                label: 'JSON Structure',
                name: 'jsonStructure',
                type: 'datagrid',
                description: 'JSON structure for LLM to return',
                datagrid: [
                    { field: 'property', headerName: 'Property', editable: true },
                    {
                        field: 'type',
                        headerName: 'Type',
                        type: 'singleSelect',
                        valueOptions: ['string', 'number', 'boolean'],
                        editable: true
                    },
                    { field: 'description', headerName: 'Description', editable: true, flex: 1 }
                ],
                default: [
                    {
                        property: 'answer',
                        type: 'string',
                        description: `answer to the user's question`
                    },
                    {
                        property: 'source',
                        type: 'string',
                        description: `sources used to answer the question, should be websites`
                    }
                ],
                additionalParams: true
            }
        ];
    }
    async init(nodeData) {
        const jsonStructure = nodeData.inputs?.jsonStructure;
        const autoFix = nodeData.inputs?.autofixParser;
        try {
            const structuredOutputParser = output_parsers_1.StructuredOutputParser.fromZodSchema(zod_1.z.object((0, src_1.convertSchemaToZod)(jsonStructure)));
            // NOTE: When we change Flowise to return a json response, the following has to be changed to: JsonStructuredOutputParser
            Object.defineProperty(structuredOutputParser, 'autoFix', {
                enumerable: true,
                configurable: true,
                writable: true,
                value: autoFix
            });
            return structuredOutputParser;
        }
        catch (exception) {
            throw new Error('Invalid JSON in StructuredOutputParser: ' + exception);
        }
    }
}
module.exports = { nodeClass: StructuredOutputParser };
//# sourceMappingURL=StructuredOutputParser.js.map