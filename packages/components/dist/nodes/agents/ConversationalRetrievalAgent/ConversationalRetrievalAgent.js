"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const agents_1 = require("langchain/agents");
const utils_1 = require("../../../src/utils");
const lodash_1 = require("lodash");
const handler_1 = require("../../../src/handler");
const defaultMessage = `Do your best to answer the questions. Feel free to use any tools available to look up relevant information, only if necessary.`;
class ConversationalRetrievalAgent_Agents {
    constructor() {
        this.label = 'Conversational Retrieval Agent';
        this.name = 'conversationalRetrievalAgent';
        this.version = 3.0;
        this.type = 'AgentExecutor';
        this.category = 'Agents';
        this.icon = 'agent.svg';
        this.description = `An agent optimized for retrieval during conversation, answering questions based on past dialogue, all using OpenAI's Function Calling`;
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
                default: defaultMessage,
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
                prefix: systemMessage ?? defaultMessage
            },
            returnIntermediateSteps: true
        });
        executor.memory = memory;
        return executor;
    }
    async run(nodeData, input, options) {
        const executor = nodeData.instance;
        if (executor.memory) {
            ;
            executor.memory.memoryKey = 'chat_history';
            executor.memory.outputKey = 'output';
            executor.memory.returnMessages = true;
            const chatHistoryClassName = executor.memory.chatHistory.constructor.name;
            // Only replace when its In-Memory
            if (chatHistoryClassName && chatHistoryClassName === 'ChatMessageHistory') {
                ;
                executor.memory.chatHistory = (0, utils_1.mapChatHistory)(options);
            }
        }
        const loggerHandler = new handler_1.ConsoleCallbackHandler(options.logger);
        const callbacks = await (0, handler_1.additionalCallbacks)(nodeData, options);
        if (options.socketIO && options.socketIOClientId) {
            const handler = new handler_1.CustomChainHandler(options.socketIO, options.socketIOClientId);
            const result = await executor.call({ input }, [loggerHandler, handler, ...callbacks]);
            return result?.output;
        }
        else {
            const result = await executor.call({ input }, [loggerHandler, ...callbacks]);
            return result?.output;
        }
    }
}
module.exports = { nodeClass: ConversationalRetrievalAgent_Agents };
//# sourceMappingURL=ConversationalRetrievalAgent.js.map