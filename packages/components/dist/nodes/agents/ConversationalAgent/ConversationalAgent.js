"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const agents_1 = require("langchain/agents");
const utils_1 = require("../../../src/utils");
const lodash_1 = require("lodash");
const handler_1 = require("../../../src/handler");
const DEFAULT_PREFIX = `Assistant is a large language model trained by OpenAI.

Assistant is designed to be able to assist with a wide range of tasks, from answering simple questions to providing in-depth explanations and discussions on a wide range of topics. As a language model, Assistant is able to generate human-like text based on the input it receives, allowing it to engage in natural-sounding conversations and provide responses that are coherent and relevant to the topic at hand.

Assistant is constantly learning and improving, and its capabilities are constantly evolving. It is able to process and understand large amounts of text, and can use this knowledge to provide accurate and informative responses to a wide range of questions. Additionally, Assistant is able to generate its own text based on the input it receives, allowing it to engage in discussions and provide explanations and descriptions on a wide range of topics.

Overall, Assistant is a powerful system that can help with a wide range of tasks and provide valuable insights and information on a wide range of topics. Whether you need help with a specific question or just want to have a conversation about a particular topic, Assistant is here to assist.`;
class ConversationalAgent_Agents {
    constructor() {
        this.label = 'Conversational Agent';
        this.name = 'conversationalAgent';
        this.version = 2.0;
        this.type = 'AgentExecutor';
        this.category = 'Agents';
        this.icon = 'agent.svg';
        this.description = 'Conversational agent for a chat model. It will utilize chat specific prompts';
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
                type: 'BaseChatModel'
            },
            {
                label: 'Memory',
                name: 'memory',
                type: 'BaseChatMemory'
            },
            {
                label: 'System Message',
                name: 'systemMessage',
                type: 'string',
                rows: 4,
                default: DEFAULT_PREFIX,
                optional: true,
                additionalParams: true
            }
        ];
    }
    async init(nodeData) {
        const model = nodeData.inputs?.model;
        let tools = nodeData.inputs?.tools;
        tools = (0, lodash_1.flatten)(tools);
        const memory = nodeData.inputs?.memory;
        const systemMessage = nodeData.inputs?.systemMessage;
        const obj = {
            agentType: 'chat-conversational-react-description',
            verbose: process.env.DEBUG === 'true' ? true : false
        };
        const agentArgs = {};
        if (systemMessage) {
            agentArgs.systemMessage = systemMessage;
        }
        if (Object.keys(agentArgs).length)
            obj.agentArgs = agentArgs;
        const executor = await (0, agents_1.initializeAgentExecutorWithOptions)(tools, model, obj);
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
        const callbacks = await (0, handler_1.additionalCallbacks)(nodeData, options);
        const result = await executor.call({ input }, [...callbacks]);
        return result?.output;
    }
}
module.exports = { nodeClass: ConversationalAgent_Agents };
//# sourceMappingURL=ConversationalAgent.js.map