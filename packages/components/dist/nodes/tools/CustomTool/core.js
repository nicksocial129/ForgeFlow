"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicStructuredTool = void 0;
const tools_1 = require("langchain/tools");
const vm2_1 = require("vm2");
/*
 * List of dependencies allowed to be import in vm2
 */
const availableDependencies = [
    '@dqbd/tiktoken',
    '@getzep/zep-js',
    '@huggingface/inference',
    '@pinecone-database/pinecone',
    '@supabase/supabase-js',
    'axios',
    'cheerio',
    'chromadb',
    'cohere-ai',
    'd3-dsv',
    'form-data',
    'graphql',
    'html-to-text',
    'langchain',
    'linkifyjs',
    'mammoth',
    'moment',
    'node-fetch',
    'pdf-parse',
    'pdfjs-dist',
    'playwright',
    'puppeteer',
    'srt-parser-2',
    'typeorm',
    'weaviate-ts-client'
];
class DynamicStructuredTool extends tools_1.StructuredTool {
    constructor(fields) {
        super(fields);
        this.name = fields.name;
        this.description = fields.description;
        this.code = fields.code;
        this.func = fields.func;
        this.returnDirect = fields.returnDirect ?? this.returnDirect;
        this.schema = fields.schema;
    }
    async _call(arg) {
        let sandbox = {};
        if (typeof arg === 'object' && Object.keys(arg).length) {
            for (const item in arg) {
                sandbox[`$${item}`] = arg[item];
            }
        }
        const defaultAllowBuiltInDep = [
            'assert',
            'buffer',
            'crypto',
            'events',
            'http',
            'https',
            'net',
            'path',
            'querystring',
            'timers',
            'tls',
            'url',
            'zlib'
        ];
        const builtinDeps = process.env.TOOL_FUNCTION_BUILTIN_DEP
            ? defaultAllowBuiltInDep.concat(process.env.TOOL_FUNCTION_BUILTIN_DEP.split(','))
            : defaultAllowBuiltInDep;
        const externalDeps = process.env.TOOL_FUNCTION_EXTERNAL_DEP ? process.env.TOOL_FUNCTION_EXTERNAL_DEP.split(',') : [];
        const deps = availableDependencies.concat(externalDeps);
        const options = {
            console: 'inherit',
            sandbox,
            require: {
                external: { modules: deps },
                builtin: builtinDeps
            }
        };
        const vm = new vm2_1.NodeVM(options);
        const response = await vm.run(`module.exports = async function() {${this.code}}()`, __dirname);
        return response;
    }
}
exports.DynamicStructuredTool = DynamicStructuredTool;
//# sourceMappingURL=core.js.map