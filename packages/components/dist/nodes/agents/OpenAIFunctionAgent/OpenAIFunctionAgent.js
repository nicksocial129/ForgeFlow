"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const agents_1 = require("langchain/agents");
const utils_1 = require("../../../src/utils");
const lodash_1 = require("lodash");
const handler_1 = require("../../../src/handler");
class OpenAIFunctionAgent_Agents {
    constructor() {
        this.label = 'OpenAI Function Agent';
        this.name = 'openAIFunctionAgent';
        this.version = 3.0;
        this.type = 'AgentExecutor';
        this.category = 'Agents';
        this.icon = 'openai.png';
        this.description = `An agent that uses Function Calling to pick the tool and args to call`;
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(agents_1.AgentExecutor)];
        this.inputs = [
            {
                label: 'Allowed Tools',
                name: 'tools',
                type: 'Tool',
                list: true
            },
            {
                label: 'Memory',
                name: 'memory',
                type: 'BaseChatMemory'
            },
            {
                label: 'OpenAI/Azure Chat Model',
                name: 'model',
                type: 'BaseChatModel'
            },
            {
                label: 'System Message',
                name: 'systemMessage',
                type: 'string',
                rows: 4,
                optional: true,
                additionalParams: true
            }
        ];
    }
    async init(nodeData) {
        const model = nodeData.inputs?.model;
        const memory = nodeData.inputs?.memory;
        const systemMessage = nodeData.inputs?.systemMessage;
        let tools = nodeData.inputs?.tools;
        tools = (0, lodash_1.flatten)(tools);
        const executor = await (0, agents_1.initializeAgentExecutorWithOptions)(tools, model, {
            agentType: 'openai-functions',
            verbose: process.env.DEBUG === 'true' ? true : false,
            agentArgs: {
                prefix: systemMessage ?? `You are a helpful AI assistant.`
            }
        });
        if (memory)
            executor.memory = memory;
        return executor;
    }
    async run(nodeData, input, options) {
        const executor = nodeData.instance;
        const memory = nodeData.inputs?.memory;
        if (options && options.chatHistory) {
            const chatHistoryClassName = memory.chatHistory.constructor.name;
            // Only replace when its In-Memory
            if (chatHistoryClassName && chatHistoryClassName === 'ChatMessageHistory') {
                memory.chatHistory = (0, utils_1.mapChatHistory)(options);
                executor.memory = memory;
            }
        }
        ;
        executor.memory.returnMessages = true; // Return true for BaseChatModel
        const loggerHandler = new handler_1.ConsoleCallbackHandler(options.logger);
        const callbacks = await (0, handler_1.additionalCallbacks)(nodeData, options);
        if (options.socketIO && options.socketIOClientId) {
            const handler = new handler_1.CustomChainHandler(options.socketIO, options.socketIOClientId);
            const result = await executor.run(input, [loggerHandler, handler, ...callbacks]);
            return result;
        }
        else {
            const result = await executor.run(input, [loggerHandler, ...callbacks]);
            return result;
        }
    }
}
module.exports = { nodeClass: OpenAIFunctionAgent_Agents };
//# sourceMappingURL=OpenAIFunctionAgent.js.map