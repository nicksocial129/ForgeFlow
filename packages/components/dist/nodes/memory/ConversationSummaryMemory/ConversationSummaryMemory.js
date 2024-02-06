"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const memory_1 = require("langchain/memory");
class ConversationSummaryMemory_Memory {
    constructor() {
        this.label = 'Conversation Summary Memory';
        this.name = 'conversationSummaryMemory';
        this.version = 1.0;
        this.type = 'ConversationSummaryMemory';
        this.icon = 'memory.svg';
        this.category = 'Memory';
        this.description = 'Summarizes the conversation and stores the current summary in memory';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(memory_1.ConversationSummaryMemory)];
        this.inputs = [
            {
                label: 'Chat Model',
                name: 'model',
                type: 'BaseChatModel'
            },
            {
                label: 'Memory Key',
                name: 'memoryKey',
                type: 'string',
                default: 'chat_history'
            },
            {
                label: 'Input Key',
                name: 'inputKey',
                type: 'string',
                default: 'input'
            }
        ];
    }
    async init(nodeData) {
        const model = nodeData.inputs?.model;
        const memoryKey = nodeData.inputs?.memoryKey;
        const inputKey = nodeData.inputs?.inputKey;
        const obj = {
            llm: model,
            returnMessages: true,
            memoryKey,
            inputKey
        };
        return new memory_1.ConversationSummaryMemory(obj);
    }
}
module.exports = { nodeClass: ConversationSummaryMemory_Memory };
//# sourceMappingURL=ConversationSummaryMemory.js.map