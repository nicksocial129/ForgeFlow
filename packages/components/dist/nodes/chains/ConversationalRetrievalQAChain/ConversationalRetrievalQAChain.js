"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const chains_1 = require("langchain/chains");
const memory_1 = require("langchain/memory");
const prompts_1 = require("langchain/prompts");
const handler_1 = require("../../../src/handler");
const prompts_2 = require("./prompts");
class ConversationalRetrievalQAChain_Chains {
    constructor() {
        this.label = 'Conversational Retrieval QA Chain';
        this.name = 'conversationalRetrievalQAChain';
        this.version = 1.0;
        this.type = 'ConversationalRetrievalQAChain';
        this.icon = 'chain.svg';
        this.category = 'Chains';
        this.description = 'Document QA - built on RetrievalQAChain to provide a chat history component';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(chains_1.ConversationalRetrievalQAChain)];
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
            },
            {
                label: 'Memory',
                name: 'memory',
                type: 'BaseMemory',
                optional: true,
                description: 'If left empty, a default BufferMemory will be used'
            },
            {
                label: 'Return Source Documents',
                name: 'returnSourceDocuments',
                type: 'boolean',
                optional: true
            },
            {
                label: 'System Message',
                name: 'systemMessagePrompt',
                type: 'string',
                rows: 4,
                additionalParams: true,
                optional: true,
                placeholder: 'I want you to act as a document that I am having a conversation with. Your name is "AI Assistant". You will provide me with answers from the given info. If the answer is not included, say exactly "Hmm, I am not sure." and stop after that. Refuse to answer any question not about the info. Never break character.'
            },
            {
                label: 'Chain Option',
                name: 'chainOption',
                type: 'options',
                options: [
                    {
                        label: 'MapReduceDocumentsChain',
                        name: 'map_reduce',
                        description: 'Suitable for QA tasks over larger documents and can run the preprocessing step in parallel, reducing the running time'
                    },
                    {
                        label: 'RefineDocumentsChain',
                        name: 'refine',
                        description: 'Suitable for QA tasks over a large number of documents.'
                    },
                    {
                        label: 'StuffDocumentsChain',
                        name: 'stuff',
                        description: 'Suitable for QA tasks over a small number of documents.'
                    }
                ],
                additionalParams: true,
                optional: true
            }
        ];
    }
    async init(nodeData) {
        const model = nodeData.inputs?.model;
        const vectorStoreRetriever = nodeData.inputs?.vectorStoreRetriever;
        const systemMessagePrompt = nodeData.inputs?.systemMessagePrompt;
        const returnSourceDocuments = nodeData.inputs?.returnSourceDocuments;
        const chainOption = nodeData.inputs?.chainOption;
        const externalMemory = nodeData.inputs?.memory;
        const obj = {
            verbose: process.env.DEBUG === 'true' ? true : false,
            questionGeneratorChainOptions: {
                template: prompts_2.CUSTOM_QUESTION_GENERATOR_CHAIN_PROMPT
            }
        };
        if (returnSourceDocuments)
            obj.returnSourceDocuments = returnSourceDocuments;
        if (chainOption === 'map_reduce') {
            obj.qaChainOptions = {
                type: 'map_reduce',
                combinePrompt: prompts_1.PromptTemplate.fromTemplate(systemMessagePrompt ? `${systemMessagePrompt}\n${prompts_2.map_reduce_template}` : prompts_2.default_map_reduce_template)
            };
        }
        else if (chainOption === 'refine') {
            const qprompt = new prompts_1.PromptTemplate({
                inputVariables: ['context', 'question'],
                template: (0, prompts_2.refine_question_template)(systemMessagePrompt)
            });
            const rprompt = new prompts_1.PromptTemplate({
                inputVariables: ['context', 'question', 'existing_answer'],
                template: prompts_2.refine_template
            });
            obj.qaChainOptions = {
                type: 'refine',
                questionPrompt: qprompt,
                refinePrompt: rprompt
            };
        }
        else {
            obj.qaChainOptions = {
                type: 'stuff',
                prompt: prompts_1.PromptTemplate.fromTemplate(systemMessagePrompt ? `${systemMessagePrompt}\n${prompts_2.qa_template}` : prompts_2.default_qa_template)
            };
        }
        if (externalMemory) {
            externalMemory.memoryKey = 'chat_history';
            externalMemory.inputKey = 'question';
            externalMemory.outputKey = 'text';
            externalMemory.returnMessages = true;
            if (chainOption === 'refine')
                externalMemory.outputKey = 'output_text';
            obj.memory = externalMemory;
        }
        else {
            const fields = {
                memoryKey: 'chat_history',
                inputKey: 'question',
                outputKey: 'text',
                returnMessages: true
            };
            if (chainOption === 'refine')
                fields.outputKey = 'output_text';
            obj.memory = new memory_1.BufferMemory(fields);
        }
        const chain = chains_1.ConversationalRetrievalQAChain.fromLLM(model, vectorStoreRetriever, obj);
        return chain;
    }
    async run(nodeData, input, options) {
        const chain = nodeData.instance;
        const returnSourceDocuments = nodeData.inputs?.returnSourceDocuments;
        const chainOption = nodeData.inputs?.chainOption;
        let model = nodeData.inputs?.model;
        // Temporary fix: https://github.com/hwchase17/langchainjs/issues/754
        model.streaming = false;
        chain.questionGeneratorChain.llm = model;
        const obj = { question: input };
        if (options && options.chatHistory && chain.memory) {
            const chatHistoryClassName = chain.memory.chatHistory.constructor.name;
            // Only replace when its In-Memory
            if (chatHistoryClassName && chatHistoryClassName === 'ChatMessageHistory') {
                ;
                chain.memory.chatHistory = (0, utils_1.mapChatHistory)(options);
            }
        }
        const loggerHandler = new handler_1.ConsoleCallbackHandler(options.logger);
        const callbacks = await (0, handler_1.additionalCallbacks)(nodeData, options);
        if (options.socketIO && options.socketIOClientId) {
            const handler = new handler_1.CustomChainHandler(options.socketIO, options.socketIOClientId, chainOption === 'refine' ? 4 : undefined, returnSourceDocuments);
            const res = await chain.call(obj, [loggerHandler, handler, ...callbacks]);
            if (chainOption === 'refine') {
                if (res.output_text && res.sourceDocuments) {
                    return {
                        text: res.output_text,
                        sourceDocuments: res.sourceDocuments
                    };
                }
                return res?.output_text;
            }
            if (res.text && res.sourceDocuments)
                return res;
            return res?.text;
        }
        else {
            const res = await chain.call(obj, [loggerHandler, ...callbacks]);
            if (res.text && res.sourceDocuments)
                return res;
            return res?.text;
        }
    }
}
module.exports = { nodeClass: ConversationalRetrievalQAChain_Chains };
//# sourceMappingURL=ConversationalRetrievalQAChain.js.map