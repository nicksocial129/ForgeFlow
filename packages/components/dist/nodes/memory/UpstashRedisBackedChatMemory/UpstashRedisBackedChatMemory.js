"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const memory_1 = require("langchain/memory");
const upstash_redis_1 = require("langchain/stores/message/upstash_redis");
class UpstashRedisBackedChatMemory_Memory {
    constructor() {
        //@ts-ignore
        this.memoryMethods = {
            async clearSessionMemory(nodeData, options) {
                const redis = await initalizeUpstashRedis(nodeData, options);
                const sessionId = nodeData.inputs?.sessionId;
                const chatId = options?.chatId;
                options.logger.info(`Clearing Upstash Redis memory session ${sessionId ? sessionId : chatId}`);
                await redis.clear();
                options.logger.info(`Successfully cleared Upstash Redis memory session ${sessionId ? sessionId : chatId}`);
            },
            async getChatMessages(nodeData, options) {
                const redis = await initalizeUpstashRedis(nodeData, options);
                const key = 'chat_history';
                const memoryResult = await redis.loadMemoryVariables({});
                return (0, utils_1.serializeChatHistory)(memoryResult[key]);
            }
        };
        this.label = 'Upstash Redis-Backed Chat Memory';
        this.name = 'upstashRedisBackedChatMemory';
        this.version = 1.0;
        this.type = 'UpstashRedisBackedChatMemory';
        this.icon = 'upstash.svg';
        this.category = 'Memory';
        this.description = 'Summarizes the conversation and stores the memory in Upstash Redis server';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(memory_1.BufferMemory)];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            description: 'Configure password authentication on your upstash redis instance',
            credentialNames: ['upstashRedisMemoryApi']
        };
        this.inputs = [
            {
                label: 'Upstash Redis REST URL',
                name: 'baseURL',
                type: 'string',
                placeholder: 'https://<your-url>.upstash.io'
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
                label: 'Session Timeouts',
                name: 'sessionTTL',
                type: 'number',
                description: 'Omit this parameter to make sessions never expire',
                additionalParams: true,
                optional: true
            }
        ];
    }
    async init(nodeData, _, options) {
        return initalizeUpstashRedis(nodeData, options);
    }
}
const initalizeUpstashRedis = async (nodeData, options) => {
    const baseURL = nodeData.inputs?.baseURL;
    const sessionId = nodeData.inputs?.sessionId;
    const sessionTTL = nodeData.inputs?.sessionTTL;
    const chatId = options?.chatId;
    let isSessionIdUsingChatMessageId = false;
    if (!sessionId && chatId)
        isSessionIdUsingChatMessageId = true;
    const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
    const upstashRestToken = (0, utils_1.getCredentialParam)('upstashRestToken', credentialData, nodeData);
    const redisChatMessageHistory = new upstash_redis_1.UpstashRedisChatMessageHistory({
        sessionId: sessionId ? sessionId : chatId,
        sessionTTL: sessionTTL ? parseInt(sessionTTL, 10) : undefined,
        config: {
            url: baseURL,
            token: upstashRestToken
        }
    });
    const memory = new BufferMemoryExtended({
        memoryKey: 'chat_history',
        chatHistory: redisChatMessageHistory,
        isSessionIdUsingChatMessageId
    });
    return memory;
};
class BufferMemoryExtended extends memory_1.BufferMemory {
    constructor(fields) {
        super(fields);
        this.isSessionIdUsingChatMessageId = false;
        this.isSessionIdUsingChatMessageId = fields.isSessionIdUsingChatMessageId;
    }
}
module.exports = { nodeClass: UpstashRedisBackedChatMemory_Memory };
//# sourceMappingURL=UpstashRedisBackedChatMemory.js.map