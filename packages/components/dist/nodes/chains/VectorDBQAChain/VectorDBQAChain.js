"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const chains_1 = require("langchain/chains");
const handler_1 = require("../../../src/handler");
class VectorDBQAChain_Chains {
    constructor() {
        this.label = 'VectorDB QA Chain';
        this.name = 'vectorDBQAChain';
        this.version = 1.0;
        this.type = 'VectorDBQAChain';
        this.icon = 'chain.svg';
        this.category = 'Chains';
        this.description = 'QA chain for vector databases';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(chains_1.VectorDBQAChain)];
        this.inputs = [
            {
                label: 'Language Model',
                name: 'model',
                type: 'BaseLanguageModel'
            },
            {
                label: 'Vector Store',
                name: 'vectorStore',
                type: 'VectorStore'
            }
        ];
    }
    async init(nodeData) {
        const model = nodeData.inputs?.model;
        const vectorStore = nodeData.inputs?.vectorStore;
        const chain = chains_1.VectorDBQAChain.fromLLM(model, vectorStore, {
            k: vectorStore?.k ?? 4,
            verbose: process.env.DEBUG === 'true' ? true : false
        });
        return chain;
    }
    async run(nodeData, input, options) {
        const chain = nodeData.instance;
        const obj = {
            query: input
        };
        const loggerHandler = new handler_1.ConsoleCallbackHandler(options.logger);
        const callbacks = await (0, handler_1.additionalCallbacks)(nodeData, options);
        if (options.socketIO && options.socketIOClientId) {
            const handler = new handler_1.CustomChainHandler(options.socketIO, options.socketIOClientId);
            const res = await chain.call(obj, [loggerHandler, handler, ...callbacks]);
            return res?.text;
        }
        else {
            const res = await chain.call(obj, [loggerHandler, ...callbacks]);
            return res?.text;
        }
    }
}
module.exports = { nodeClass: VectorDBQAChain_Chains };
//# sourceMappingURL=VectorDBQAChain.js.map