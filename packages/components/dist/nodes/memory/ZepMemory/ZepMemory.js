"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zep_1 = require("langchain/memory/zep");
const memory_1 = require("langchain/memory");
const utils_1 = require("../../../src/utils");
class ZepMemory_Memory {
    constructor() {
        //@ts-ignore
        this.memoryMethods = {
            async clearSessionMemory(nodeData, options) {
                const zep = await initalizeZep(nodeData, options);
                const sessionId = nodeData.inputs?.sessionId;
                const chatId = options?.chatId;
                options.logger.info(`Clearing Zep memory session ${sessionId ? sessionId : chatId}`);
                await zep.clear();
                options.logger.info(`Successfully cleared Zep memory session ${sessionId ? sessionId : chatId}`);
            },
            async getChatMessages(nodeData, options) {
                const memoryKey = nodeData.inputs?.memoryKey;
                const aiPrefix = nodeData.inputs?.aiPrefix;
                const humanPrefix = nodeData.inputs?.humanPrefix;
                const zep = await initalizeZep(nodeData, options);
                const key = memoryKey ?? 'chat_history';
                const memoryResult = await zep.loadMemoryVariables({});
                return (0, memory_1.getBufferString)(memoryResult[key], humanPrefix, aiPrefix);
            }
        };
        this.label = 'Zep Memory';
        this.name = 'ZepMemory';
        this.version = 2.0;
        this.type = 'ZepMemory';
        this.icon = 'zep.png';
        this.category = 'Memory';
        this.description = 'Summarizes the conversation and stores the memory in zep server';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(zep_1.ZepMemory)];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            optional: true,
            description: 'Configure JWT authentication on your Zep instance (Optional)',
            credentialNames: ['zepMemoryApi']
        };
        this.inputs = [
            {
                label: 'Base URL',
                name: 'baseURL',
                type: 'string',
                default: 'http://127.0.0.1:8000'
            },
            {
                label: 'Session Id',
                name: 'sessionId',
                type: 'string',
                description: 'If not specified, a random id will be used. Learn <a target="_blank" href="https://docs.flowiseai.com/memory/long-term-memory#ui-and-embedded-chat">more</a>',
                default: '',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Size',
                name: 'k',
                type: 'number',
                placeholder: '10',
                description: 'Window of size k to surface the last k back-and-forth to use as memory.',
                additionalParams: true,
                optional: true
            },
            {
                label: 'AI Prefix',
                name: 'aiPrefix',
                type: 'string',
                default: 'ai',
                additionalParams: true
            },
            {
                label: 'Human Prefix',
                name: 'humanPrefix',
                type: 'string',
                default: 'human',
                additionalParams: true
            },
            {
                label: 'Memory Key',
                name: 'memoryKey',
                type: 'string',
                default: 'chat_history',
                additionalParams: true
            },
            {
                label: 'Input Key',
                name: 'inputKey',
                type: 'string',
                default: 'input',
                additionalParams: true
            },
            {
                label: 'Output Key',
                name: 'outputKey',
                type: 'string',
                default: 'text',
                additionalParams: true
            }
        ];
    }
    async init(nodeData, _, options) {
        return await initalizeZep(nodeData, options);
    }
}
const initalizeZep = async (nodeData, options) => {
    const baseURL = nodeData.inputs?.baseURL;
    const aiPrefix = nodeData.inputs?.aiPrefix;
    const humanPrefix = nodeData.inputs?.humanPrefix;
    const memoryKey = nodeData.inputs?.memoryKey;
    const inputKey = nodeData.inputs?.inputKey;
    const k = nodeData.inputs?.k;
    const chatId = options?.chatId;
    let isSessionIdUsingChatMessageId = false;
    let sessionId = '';
    if (!nodeData.inputs?.sessionId && chatId) {
        isSessionIdUsingChatMessageId = true;
        sessionId = chatId;
    }
    else {
        sessionId = nodeData.inputs?.sessionId;
    }
    const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
    const apiKey = (0, utils_1.getCredentialParam)('apiKey', credentialData, nodeData);
    const obj = {
        baseURL,
        sessionId: sessionId ? sessionId : chatId,
        aiPrefix,
        humanPrefix,
        returnMessages: true,
        memoryKey,
        inputKey,
        isSessionIdUsingChatMessageId,
        k: k ? parseInt(k, 10) : undefined
    };
    if (apiKey)
        obj.apiKey = apiKey;
    return new ZepMemoryExtended(obj);
};
class ZepMemoryExtended extends zep_1.ZepMemory {
    constructor(fields) {
        super(fields);
        this.isSessionIdUsingChatMessageId = false;
        this.isSessionIdUsingChatMessageId = fields.isSessionIdUsingChatMessageId;
        this.lastN = fields.k;
    }
    async loadMemoryVariables(values, overrideSessionId = '') {
        if (overrideSessionId) {
            super.sessionId = overrideSessionId;
        }
        return super.loadMemoryVariables({ ...values, lastN: this.lastN });
    }
    async saveContext(inputValues, outputValues, overrideSessionId = '') {
        if (overrideSessionId) {
            super.sessionId = overrideSessionId;
        }
        return super.saveContext(inputValues, outputValues);
    }
    async clear(overrideSessionId = '') {
        if (overrideSessionId) {
            super.sessionId = overrideSessionId;
        }
        return super.clear();
    }
}
module.exports = { nodeClass: ZepMemory_Memory };
//# sourceMappingURL=ZepMemory.js.map