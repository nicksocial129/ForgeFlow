"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const memory_1 = require("langchain/memory");
const node_fetch_1 = __importDefault(require("node-fetch"));
const memory_2 = require("langchain/memory");
class MotorMemory_Memory {
    constructor() {
        //@ts-ignore
        this.memoryMethods = {
            async clearSessionMemory(nodeData, options) {
                const motorhead = await initalizeMotorhead(nodeData, options);
                const sessionId = nodeData.inputs?.sessionId;
                const chatId = options?.chatId;
                options.logger.info(`Clearing Motorhead memory session ${sessionId ? sessionId : chatId}`);
                await motorhead.clear();
                options.logger.info(`Successfully cleared Motorhead memory session ${sessionId ? sessionId : chatId}`);
            },
            async getChatMessages(nodeData, options) {
                const memoryKey = nodeData.inputs?.memoryKey;
                const motorhead = await initalizeMotorhead(nodeData, options);
                const key = memoryKey ?? 'chat_history';
                const memoryResult = await motorhead.loadMemoryVariables({});
                return (0, memory_2.getBufferString)(memoryResult[key]);
            }
        };
        this.label = 'Motorhead Memory';
        this.name = 'motorheadMemory';
        this.version = 1.0;
        this.type = 'MotorheadMemory';
        this.icon = 'motorhead.png';
        this.category = 'Memory';
        this.description = 'Use Motorhead Memory to store chat conversations';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(memory_1.MotorheadMemory)];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            optional: true,
            description: 'Only needed when using hosted solution - https://getmetal.io',
            credentialNames: ['motorheadMemoryApi']
        };
        this.inputs = [
            {
                label: 'Base URL',
                name: 'baseURL',
                type: 'string',
                optional: true,
                description: 'To use the online version, leave the URL blank. More details at https://getmetal.io.'
            },
            {
                label: 'Session Id',
                name: 'sessionId',
                type: 'string',
                description: 'If not specified, the first CHAT_MESSAGE_ID will be used as sessionId',
                default: '',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Memory Key',
                name: 'memoryKey',
                type: 'string',
                default: 'chat_history',
                additionalParams: true
            }
        ];
    }
    async init(nodeData, _, options) {
        return initalizeMotorhead(nodeData, options);
    }
}
const initalizeMotorhead = async (nodeData, options) => {
    const memoryKey = nodeData.inputs?.memoryKey;
    const baseURL = nodeData.inputs?.baseURL;
    const sessionId = nodeData.inputs?.sessionId;
    const chatId = options?.chatId;
    let isSessionIdUsingChatMessageId = false;
    if (!sessionId && chatId)
        isSessionIdUsingChatMessageId = true;
    const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
    const apiKey = (0, utils_1.getCredentialParam)('apiKey', credentialData, nodeData);
    const clientId = (0, utils_1.getCredentialParam)('clientId', credentialData, nodeData);
    let obj = {
        returnMessages: true,
        sessionId: sessionId ? sessionId : chatId,
        memoryKey
    };
    if (baseURL) {
        obj = {
            ...obj,
            url: baseURL
        };
    }
    else {
        obj = {
            ...obj,
            apiKey,
            clientId
        };
    }
    if (isSessionIdUsingChatMessageId)
        obj.isSessionIdUsingChatMessageId = true;
    const motorheadMemory = new MotorheadMemoryExtended(obj);
    // Get messages from sessionId
    await motorheadMemory.init();
    return motorheadMemory;
};
class MotorheadMemoryExtended extends memory_1.MotorheadMemory {
    constructor(fields) {
        super(fields);
        this.isSessionIdUsingChatMessageId = false;
        this.isSessionIdUsingChatMessageId = fields.isSessionIdUsingChatMessageId;
    }
    async clear() {
        try {
            await this.caller.call(node_fetch_1.default, `${this.url}/sessions/${this.sessionId}/memory`, {
                //@ts-ignore
                signal: this.timeout ? AbortSignal.timeout(this.timeout) : undefined,
                headers: this._getHeaders(),
                method: 'DELETE'
            });
        }
        catch (error) {
            console.error('Error deleting session: ', error);
        }
        // Clear the superclass's chat history
        await this.chatHistory.clear();
        await super.clear();
    }
}
module.exports = { nodeClass: MotorMemory_Memory };
//# sourceMappingURL=MotorheadMemory.js.map