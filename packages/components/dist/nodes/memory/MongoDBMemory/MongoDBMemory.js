"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../../../src");
const mongodb_1 = require("langchain/stores/message/mongodb");
const memory_1 = require("langchain/memory");
const schema_1 = require("langchain/schema");
const mongodb_2 = require("mongodb");
class MongoDB_Memory {
    constructor() {
        //@ts-ignore
        this.memoryMethods = {
            async clearSessionMemory(nodeData, options) {
                const mongodbMemory = await initializeMongoDB(nodeData, options);
                const sessionId = nodeData.inputs?.sessionId;
                const chatId = options?.chatId;
                options.logger.info(`Clearing MongoDB memory session ${sessionId ? sessionId : chatId}`);
                await mongodbMemory.clear();
                options.logger.info(`Successfully cleared MongoDB memory session ${sessionId ? sessionId : chatId}`);
            },
            async getChatMessages(nodeData, options) {
                const memoryKey = nodeData.inputs?.memoryKey;
                const mongodbMemory = await initializeMongoDB(nodeData, options);
                const key = memoryKey ?? 'chat_history';
                const memoryResult = await mongodbMemory.loadMemoryVariables({});
                return (0, src_1.serializeChatHistory)(memoryResult[key]);
            }
        };
        this.label = 'MongoDB Atlas Chat Memory';
        this.name = 'MongoDBAtlasChatMemory';
        this.version = 1.0;
        this.type = 'MongoDBAtlasChatMemory';
        this.icon = 'mongodb.png';
        this.category = 'Memory';
        this.description = 'Stores the conversation in MongoDB Atlas';
        this.baseClasses = [this.type, ...(0, src_1.getBaseClasses)(memory_1.BufferMemory)];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['mongoDBUrlApi']
        };
        this.inputs = [
            {
                label: 'Database',
                name: 'databaseName',
                placeholder: '<DB_NAME>',
                type: 'string'
            },
            {
                label: 'Collection Name',
                name: 'collectionName',
                placeholder: '<COLLECTION_NAME>',
                type: 'string'
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
        return initializeMongoDB(nodeData, options);
    }
}
const initializeMongoDB = async (nodeData, options) => {
    const databaseName = nodeData.inputs?.databaseName;
    const collectionName = nodeData.inputs?.collectionName;
    const sessionId = nodeData.inputs?.sessionId;
    const memoryKey = nodeData.inputs?.memoryKey;
    const chatId = options?.chatId;
    let isSessionIdUsingChatMessageId = false;
    if (!sessionId && chatId)
        isSessionIdUsingChatMessageId = true;
    const credentialData = await (0, src_1.getCredentialData)(nodeData.credential ?? '', options);
    let mongoDBConnectUrl = (0, src_1.getCredentialParam)('mongoDBConnectUrl', credentialData, nodeData);
    const client = new mongodb_2.MongoClient(mongoDBConnectUrl);
    await client.connect();
    const collection = client.db(databaseName).collection(collectionName);
    const mongoDBChatMessageHistory = new mongodb_1.MongoDBChatMessageHistory({
        collection,
        sessionId: sessionId ? sessionId : chatId
    });
    mongoDBChatMessageHistory.getMessages = async () => {
        const document = await collection.findOne({
            sessionId: mongoDBChatMessageHistory.sessionId
        });
        const messages = document?.messages || [];
        return messages.map(schema_1.mapStoredMessageToChatMessage);
    };
    mongoDBChatMessageHistory.addMessage = async (message) => {
        const messages = [message].map((msg) => msg.toDict());
        await collection.updateOne({ sessionId: mongoDBChatMessageHistory.sessionId }, {
            $push: { messages: { $each: messages } }
        }, { upsert: true });
    };
    mongoDBChatMessageHistory.clear = async () => {
        await collection.deleteOne({ sessionId: mongoDBChatMessageHistory.sessionId });
    };
    return new BufferMemoryExtended({
        memoryKey: memoryKey ?? 'chat_history',
        chatHistory: mongoDBChatMessageHistory,
        isSessionIdUsingChatMessageId
    });
};
class BufferMemoryExtended extends memory_1.BufferMemory {
    constructor(fields) {
        super(fields);
        this.isSessionIdUsingChatMessageId = false;
        this.isSessionIdUsingChatMessageId = fields.isSessionIdUsingChatMessageId;
    }
}
module.exports = { nodeClass: MongoDB_Memory };
//# sourceMappingURL=MongoDBMemory.js.map