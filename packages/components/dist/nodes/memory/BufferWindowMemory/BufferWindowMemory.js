"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const memory_1 = require("langchain/memory");
class BufferWindowMemory_Memory {
    constructor() {
        this.label = 'Buffer Window Memory';
        this.name = 'bufferWindowMemory';
        this.version = 1.0;
        this.type = 'BufferWindowMemory';
        this.icon = 'memory.svg';
        this.category = 'Memory';
        this.description = 'Uses a window of size k to surface the last k back-and-forth to use as memory';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(memory_1.BufferWindowMemory)];
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
            },
            {
                label: 'Size',
                name: 'k',
                type: 'number',
                default: '4',
                description: 'Window of size k to surface the last k back-and-forth to use as memory.'
            }
        ];
    }
    async init(nodeData) {
        const memoryKey = nodeData.inputs?.memoryKey;
        const inputKey = nodeData.inputs?.inputKey;
        const k = nodeData.inputs?.k;
        const obj = {
            returnMessages: true,
            memoryKey: memoryKey,
            inputKey: inputKey,
            k: parseInt(k, 10)
        };
        return new memory_1.BufferWindowMemory(obj);
    }
}
module.exports = { nodeClass: BufferWindowMemory_Memory };
//# sourceMappingURL=BufferWindowMemory.js.map