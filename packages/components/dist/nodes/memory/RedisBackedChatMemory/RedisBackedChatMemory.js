"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const memory_1 = require("langchain/memory");
const ioredis_1 = require("langchain/stores/message/ioredis");
const schema_1 = require("langchain/schema");
const ioredis_2 = require("ioredis");
class RedisBackedChatMemory_Memory {
    constructor() {
        //@ts-ignore
        this.memoryMethods = {
            async clearSessionMemory(nodeData, options) {
                const redis = await initalizeRedis(nodeData, options);
                const sessionId = nodeData.inputs?.sessionId;
                const chatId = options?.chatId;
                options.logger.info(`Clearing Redis memory session ${sessionId ? sessionId : chatId}`);
                await redis.clear();
                options.logger.info(`Successfully cleared Redis memory session ${sessionId ? sessionId : chatId}`);
            },
            async getChatMessages(nodeData, options) {
                const memoryKey = nodeData.inputs?.memoryKey;
                const redis = await initalizeRedis(nodeData, options);
                const key = memoryKey ?? 'chat_history';
                const memoryResult = await redis.loadMemoryVariables({});
                return (0, utils_1.serializeChatHistory)(memoryResult[key]);
            }
        };
        this.label = 'Redis-Backed Chat Memory';
        this.name = 'RedisBackedChatMemory';
        this.version = 2.0;
        this.type = 'RedisBackedChatMemory';
        this.icon = 'redis.svg';
        this.category = 'Memory';
        this.description = 'Summarizes the conversation and stores the memory in Redis server';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(memory_1.BufferMemory)];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            optional: true,
            credentialNames: ['redisCacheApi', 'redisCacheUrlApi']
        };
        this.inputs = [
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
            },
            {
                label: 'Memory Key',
                name: 'memoryKey',
                type: 'string',
                default: 'chat_history',
                additionalParams: true
            },
            {
                label: 'Window Size',
                name: 'windowSize',
                type: 'number',
                description: 'Window of size k to surface the last k back-and-forth to use as memory.',
                additionalParams: true,
                optional: true
            }
        ];
    }
    async init(nodeData, _, options) {
        return await initalizeRedis(nodeData, options);
    }
}
const initalizeRedis = async (nodeData, options) => {
    const sessionId = nodeData.inputs?.sessionId;
    const sessionTTL = nodeData.inputs?.sessionTTL;
    const memoryKey = nodeData.inputs?.memoryKey;
    const windowSize = nodeData.inputs?.windowSize;
    const chatId = options?.chatId;
    let isSessionIdUsingChatMessageId = false;
    if (!sessionId && chatId)
        isSessionIdUsingChatMessageId = true;
    const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
    const redisUrl = (0, utils_1.getCredentialParam)('redisUrl', credentialData, nodeData);
    let client;
    if (!redisUrl || redisUrl === '') {
        const username = (0, utils_1.getCredentialParam)('redisCacheUser', credentialData, nodeData);
        const password = (0, utils_1.getCredentialParam)('redisCachePwd', credentialData, nodeData);
        const portStr = (0, utils_1.getCredentialParam)('redisCachePort', credentialData, nodeData);
        const host = (0, utils_1.getCredentialParam)('redisCacheHost', credentialData, nodeData);
        const sslEnabled = (0, utils_1.getCredentialParam)('redisCacheSslEnabled', credentialData, nodeData);
        const tlsOptions = sslEnabled === true ? { tls: { rejectUnauthorized: false } } : {};
        client = new ioredis_2.Redis({
            port: portStr ? parseInt(portStr) : 6379,
            host,
            username,
            password,
            ...tlsOptions
        });
    }
    else {
        client = new ioredis_2.Redis(redisUrl);
    }
    let obj = {
        sessionId: sessionId ? sessionId : chatId,
        client
    };
    if (sessionTTL) {
        obj = {
            ...obj,
            sessionTTL
        };
    }
    const redisChatMessageHistory = new ioredis_1.RedisChatMessageHistory(obj);
    redisChatMessageHistory.getMessages = async () => {
        const rawStoredMessages = await client.lrange(redisChatMessageHistory.sessionId, windowSize ? -windowSize : 0, -1);
        const orderedMessages = rawStoredMessages.reverse().map((message) => JSON.parse(message));
        return orderedMessages.map(schema_1.mapStoredMessageToChatMessage);
    };
    redisChatMessageHistory.addMessage = async (message) => {
        const messageToAdd = [message].map((msg) => msg.toDict());
        await client.lpush(redisChatMessageHistory.sessionId, JSON.stringify(messageToAdd[0]));
        if (sessionTTL) {
            await client.expire(redisChatMessageHistory.sessionId, sessionTTL);
        }
    };
    redisChatMessageHistory.clear = async () => {
        await client.del(redisChatMessageHistory.sessionId);
    };
    const memory = new BufferMemoryExtended({
        memoryKey: memoryKey ?? 'chat_history',
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
module.exports = { nodeClass: RedisBackedChatMemory_Memory };
//# sourceMappingURL=RedisBackedChatMemory.js.map