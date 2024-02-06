"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chains_1 = require("langchain/chains");
const utils_1 = require("../../../src/utils");
const prompts_1 = require("langchain/prompts");
const handler_1 = require("../../../src/handler");
const lodash_1 = require("lodash");
const document_1 = require("langchain/document");
let systemMessage = `The following is a friendly conversation between a human and an AI. The AI is talkative and provides lots of specific details from its context. If the AI does not know the answer to a question, it truthfully says it does not know.`;
class ConversationChain_Chains {
    constructor() {
        this.label = 'Conversation Chain';
        this.name = 'conversationChain';
        this.version = 1.0;
        this.type = 'ConversationChain';
        this.icon = 'chain.svg';
        this.category = 'Chains';
        this.description = 'Chat models specific conversational chain with memory';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(chains_1.ConversationChain)];
        this.inputs = [
            {
                label: 'Language Model',
                name: 'model',
                type: 'BaseChatModel'
            },
            {
                label: 'Memory',
                name: 'memory',
                type: 'BaseMemory'
            },
            {
                label: 'Document',
                name: 'document',
                type: 'Document',
                description: 'Include whole document into the context window, if you get maximum context length error, please use model with higher context window like Claude 100k, or gpt4 32k',
                optional: true,
                list: true
            },
            {
                label: 'System Message',
                name: 'systemMessagePrompt',
                type: 'string',
                rows: 4,
                additionalParams: true,
                optional: true,
                placeholder: 'You are a helpful assistant that write codes'
            }
        ];
    }
    async init(nodeData) {
        const model = nodeData.inputs?.model;
        const memory = nodeData.inputs?.memory;
        const prompt = nodeData.inputs?.systemMessagePrompt;
        const docs = nodeData.inputs?.document;
        const flattenDocs = docs && docs.length ? (0, lodash_1.flatten)(docs) : [];
        const finalDocs = [];
        for (let i = 0; i < flattenDocs.length; i += 1) {
            if (flattenDocs[i] && flattenDocs[i].pageContent) {
                finalDocs.push(new document_1.Document(flattenDocs[i]));
            }
        }
        let finalText = '';
        for (let i = 0; i < finalDocs.length; i += 1) {
            finalText += finalDocs[i].pageContent;
        }
        const replaceChar = ['{', '}'];
        for (const char of replaceChar)
            finalText = finalText.replaceAll(char, '');
        if (finalText)
            systemMessage = `${systemMessage}\nThe AI has the following context:\n${finalText}`;
        const obj = {
            llm: model,
            memory,
            verbose: process.env.DEBUG === 'true' ? true : false
        };
        const chatPrompt = prompts_1.ChatPromptTemplate.fromMessages([
            prompts_1.SystemMessagePromptTemplate.fromTemplate(prompt ? `${prompt}\n${systemMessage}` : systemMessage),
            new prompts_1.MessagesPlaceholder(memory.memoryKey ?? 'chat_history'),
            prompts_1.HumanMessagePromptTemplate.fromTemplate('{input}')
        ]);
        obj.prompt = chatPrompt;
        const chain = new chains_1.ConversationChain(obj);
        return chain;
    }
    async run(nodeData, input, options) {
        const chain = nodeData.instance;
        const memory = nodeData.inputs?.memory;
        memory.returnMessages = true; // Return true for BaseChatModel
        if (options && options.chatHistory) {
            const chatHistoryClassName = memory.chatHistory.constructor.name;
            // Only replace when its In-Memory
            if (chatHistoryClassName && chatHistoryClassName === 'ChatMessageHistory') {
                memory.chatHistory = (0, utils_1.mapChatHistory)(options);
            }
        }
        chain.memory = memory;
        const loggerHandler = new handler_1.ConsoleCallbackHandler(options.logger);
        const callbacks = await (0, handler_1.additionalCallbacks)(nodeData, options);
        if (options.socketIO && options.socketIOClientId) {
            const handler = new handler_1.CustomChainHandler(options.socketIO, options.socketIOClientId);
            const res = await chain.call({ input }, [loggerHandler, handler, ...callbacks]);
            return res?.response;
        }
        else {
            const res = await chain.call({ input }, [loggerHandler, ...callbacks]);
            return res?.response;
        }
    }
}
module.exports = { nodeClass: ConversationChain_Chains };
//# sourceMappingURL=ConversationChain.js.map