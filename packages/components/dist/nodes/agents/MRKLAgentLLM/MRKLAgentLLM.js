"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const agents_1 = require("langchain/agents");
const utils_1 = require("../../../src/utils");
const lodash_1 = require("lodash");
const handler_1 = require("../../../src/handler");
class MRKLAgentLLM_Agents {
    constructor() {
        this.label = 'ReAct Agent for LLMs';
        this.name = 'mrklAgentLLM';
        this.version = 1.0;
        this.type = 'AgentExecutor';
        this.category = 'Agents';
        this.icon = 'agent.svg';
        this.description = 'Agent that uses the ReAct logic to decide what action to take, optimized to be used with LLMs';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(agents_1.AgentExecutor)];
        this.inputs = [
            {
                label: 'Allowed Tools',
                name: 'tools',
                type: 'Tool',
                list: true
            },
            {
                label: 'Language Model',
                name: 'model',
                type: 'BaseLanguageModel'
            }
        ];
    }
    async init(nodeData) {
        const model = nodeData.inputs?.model;
        let tools = nodeData.inputs?.tools;
        tools = (0, lodash_1.flatten)(tools);
        const executor = await (0, agents_1.initializeAgentExecutorWithOptions)(tools, model, {
            agentType: 'zero-shot-react-description',
            verbose: process.env.DEBUG === 'true' ? true : false
        });
        return executor;
    }
    async run(nodeData, input, options) {
        const executor = nodeData.instance;
        const callbacks = await (0, handler_1.additionalCallbacks)(nodeData, options);
        const result = await executor.call({ input }, [...callbacks]);
        return result?.output;
    }
}
module.exports = { nodeClass: MRKLAgentLLM_Agents };
//# sourceMappingURL=MRKLAgentLLM.js.map