"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chains_1 = require("langchain/chains");
const utils_1 = require("../../../src/utils");
const handler_1 = require("../../../src/handler");
class RetrievalQAChain_Chains {
    constructor() {
        this.label = 'Retrieval QA Chain';
        this.name = 'retrievalQAChain';
        this.version = 1.0;
        this.type = 'RetrievalQAChain';
        this.icon = 'chain.svg';
        this.category = 'Chains';
        this.description = 'QA chain to answer a question based on the retrieved documents';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(chains_1.RetrievalQAChain)];
        this.inputs = [
            {
                label: 'Language Model',
                name: 'model',
                type: 'BaseLanguageModel'
            },
            {
                label: 'Vector Store Retriever',
                name: 'vectorStoreRetriever',
                type: 'BaseRetriever'
            }
        ];
    }
    async init(nodeData) {
        const model = nodeData.inputs?.model;
        const vectorStoreRetriever = nodeData.inputs?.vectorStoreRetriever;
        const chain = chains_1.RetrievalQAChain.fromLLM(model, vectorStoreRetriever, { verbose: process.env.DEBUG === 'true' ? true : false });
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
module.exports = { nodeClass: RetrievalQAChain_Chains };
//# sourceMappingURL=RetrievalQAChain.js.map