"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("./core");
class BabyAGI_Agents {
    constructor() {
        this.label = 'BabyAGI';
        this.name = 'babyAGI';
        this.version = 1.0;
        this.type = 'BabyAGI';
        this.category = 'Agents';
        this.icon = 'babyagi.jpg';
        this.description = 'Task Driven Autonomous Agent which creates new task and reprioritizes task list based on objective';
        this.baseClasses = ['BabyAGI'];
        this.inputs = [
            {
                label: 'Chat Model',
                name: 'model',
                type: 'BaseChatModel'
            },
            {
                label: 'Vector Store',
                name: 'vectorStore',
                type: 'VectorStore'
            },
            {
                label: 'Task Loop',
                name: 'taskLoop',
                type: 'number',
                default: 3
            }
        ];
    }
    async init(nodeData) {
        const model = nodeData.inputs?.model;
        const vectorStore = nodeData.inputs?.vectorStore;
        const taskLoop = nodeData.inputs?.taskLoop;
        const k = vectorStore?.k ?? 4;
        const babyAgi = core_1.BabyAGI.fromLLM(model, vectorStore, parseInt(taskLoop, 10), k);
        return babyAgi;
    }
    async run(nodeData, input) {
        const executor = nodeData.instance;
        const objective = input;
        const res = await executor.call({ objective });
        return res;
    }
}
module.exports = { nodeClass: BabyAGI_Agents };
//# sourceMappingURL=BabyAGI.js.map