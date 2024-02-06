"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tools_1 = require("langchain/tools");
const utils_1 = require("../../../src/utils");
class AIPlugin {
    constructor() {
        this.label = 'AI Plugin';
        this.name = 'aiPlugin';
        this.version = 1.0;
        this.type = 'AIPlugin';
        this.icon = 'aiplugin.svg';
        this.category = 'Tools';
        this.description = 'Execute actions using ChatGPT Plugin Url';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(tools_1.AIPluginTool)];
        this.inputs = [
            {
                label: 'Plugin Url',
                name: 'pluginUrl',
                type: 'string',
                placeholder: 'https://www.klarna.com/.well-known/ai-plugin.json'
            }
        ];
    }
    async init(nodeData) {
        const pluginUrl = nodeData.inputs?.pluginUrl;
        const aiplugin = await tools_1.AIPluginTool.fromPluginUrl(pluginUrl);
        return aiplugin;
    }
}
module.exports = { nodeClass: AIPlugin };
//# sourceMappingURL=AIPlugin.js.map