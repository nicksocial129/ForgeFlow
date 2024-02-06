"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const tools_1 = require("langchain/tools");
const toolkits_1 = require("langchain/agents/toolkits");
class Retriever_Tools {
    constructor() {
        this.label = 'Retriever Tool';
        this.name = 'retrieverTool';
        this.version = 1.0;
        this.type = 'RetrieverTool';
        this.icon = 'retriever-tool.png';
        this.category = 'Tools';
        this.description = 'Use a retriever as allowed tool for agent';
        this.baseClasses = [this.type, 'DynamicTool', ...(0, utils_1.getBaseClasses)(tools_1.DynamicTool)];
        this.inputs = [
            {
                label: 'Retriever Name',
                name: 'name',
                type: 'string',
                placeholder: 'search_state_of_union'
            },
            {
                label: 'Retriever Description',
                name: 'description',
                type: 'string',
                description: 'When should agent uses to retrieve documents',
                rows: 3,
                placeholder: 'Searches and returns documents regarding the state-of-the-union.'
            },
            {
                label: 'Retriever',
                name: 'retriever',
                type: 'BaseRetriever'
            }
        ];
    }
    async init(nodeData) {
        const name = nodeData.inputs?.name;
        const description = nodeData.inputs?.description;
        const retriever = nodeData.inputs?.retriever;
        const tool = (0, toolkits_1.createRetrieverTool)(retriever, {
            name,
            description
        });
        return tool;
    }
}
module.exports = { nodeClass: Retriever_Tools };
//# sourceMappingURL=RetrieverTool.js.map