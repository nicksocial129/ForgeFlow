"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const memory_1 = require("langchain/memory");
class BufferMemory_Memory {
    constructor() {
        this.label = 'Buffer Memory';
        this.name = 'bufferMemory';
        this.version = 1.0;
        this.type = 'BufferMemory';
        this.icon = 'memory.svg';
        this.category = 'Memory';
        this.description = 'Remembers previous conversational back and forths directly';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(memory_1.BufferMemory)];
        this.inputs = [
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
        const memoryKey = nodeData.inputs?.memoryKey;
        const inputKey = nodeData.inputs?.inputKey;
        return new memory_1.BufferMemory({
            returnMessages: true,
            memoryKey,
            inputKey
        });
    }
}
module.exports = { nodeClass: BufferMemory_Memory };
//# sourceMappingURL=BufferMemory.js.map