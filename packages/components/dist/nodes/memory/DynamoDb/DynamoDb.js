"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../../../src");
const dynamodb_1 = require("langchain/stores/message/dynamodb");
const memory_1 = require("langchain/memory");
class DynamoDb_Memory {
    constructor() {
        //@ts-ignore
        this.memoryMethods = {
            async clearSessionMemory(nodeData, options) {
                const dynamodbMemory = await initalizeDynamoDB(nodeData, options);
                const sessionId = nodeData.inputs?.sessionId;
                const chatId = options?.chatId;
                options.logger.info(`Clearing DynamoDb memory session ${sessionId ? sessionId : chatId}`);
                await dynamodbMemory.clear();
                options.logger.info(`Successfully cleared DynamoDb memory session ${sessionId ? sessionId : chatId}`);
            },
            async getChatMessages(nodeData, options) {
                const memoryKey = nodeData.inputs?.memoryKey;
                const dynamodbMemory = await initalizeDynamoDB(nodeData, options);
                const key = memoryKey ?? 'chat_history';
                const memoryResult = await dynamodbMemory.loadMemoryVariables({});
                return (0, src_1.serializeChatHistory)(memoryResult[key]);
            }
        };
        this.label = 'DynamoDB Chat Memory';
        this.name = 'DynamoDBChatMemory';
        this.version = 1.0;
        this.type = 'DynamoDBChatMemory';
        this.icon = 'dynamodb.svg';
        this.category = 'Memory';
        this.description = 'Stores the conversation in dynamo db table';
        this.baseClasses = [this.type, ...(0, src_1.getBaseClasses)(memory_1.BufferMemory)];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['dynamodbMemoryApi']
        };
        this.inputs = [
            {
                label: 'Table Name',
                name: 'tableName',
                type: 'string'
            },
            {
                label: 'Partition Key',
                name: 'partitionKey',
                type: 'string'
            },
            {
                label: 'Region',
                name: 'region',
                type: 'string',
                description: 'The aws region in which table is located',
                placeholder: 'us-east-1'
            },
            {
                label: 'Session ID',
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
        return initalizeDynamoDB(nodeData, options);
    }
}
const initalizeDynamoDB = async (nodeData, options) => {
    const tableName = nodeData.inputs?.tableName;
    const partitionKey = nodeData.inputs?.partitionKey;
    const sessionId = nodeData.inputs?.sessionId;
    const region = nodeData.inputs?.region;
    const memoryKey = nodeData.inputs?.memoryKey;
    const chatId = options.chatId;
    let isSessionIdUsingChatMessageId = false;
    if (!sessionId && chatId)
        isSessionIdUsingChatMessageId = true;
    const credentialData = await (0, src_1.getCredentialData)(nodeData.credential ?? '', options);
    const accessKeyId = (0, src_1.getCredentialParam)('accessKey', credentialData, nodeData);
    const secretAccessKey = (0, src_1.getCredentialParam)('secretAccessKey', credentialData, nodeData);
    const dynamoDb = new dynamodb_1.DynamoDBChatMessageHistory({
        tableName,
        partitionKey,
        sessionId: sessionId ? sessionId : chatId,
        config: {
            region,
            credentials: {
                accessKeyId,
                secretAccessKey
            }
        }
    });
    const memory = new BufferMemoryExtended({
        memoryKey: memoryKey ?? 'chat_history',
        chatHistory: dynamoDb,
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
module.exports = { nodeClass: DynamoDb_Memory };
//# sourceMappingURL=DynamoDb.js.map