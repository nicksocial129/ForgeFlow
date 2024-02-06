"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const google_genai_1 = require("@langchain/google-genai");
class GoogleGenerativeAI_ChatModels {
    constructor() {
        this.label = 'ChatGoogleGenerativeAI';
        this.name = 'chatGoogleGenerativeAI';
        this.version = 1.0;
        this.type = 'ChatGoogleGenerativeAI';
        this.icon = 'gemini.png';
        this.category = 'Chat Models';
        this.description = 'Wrapper around Google Gemini large language models that use the Chat endpoint';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(google_genai_1.ChatGoogleGenerativeAI)];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['googleGenerativeAI'],
            optional: false,
            description: 'Google Generative AI credential.'
        };
        this.inputs = [
            {
                label: 'Cache',
                name: 'cache',
                type: 'BaseCache',
                optional: true
            },
            {
                label: 'Model Name',
                name: 'modelName',
                type: 'options',
                options: [
                    {
                        label: 'gemini-pro',
                        name: 'gemini-pro'
                    }
                ],
                default: 'gemini-pro',
                optional: true
            },
            {
                label: 'Temperature',
                name: 'temperature',
                type: 'number',
                step: 0.1,
                default: 0.9,
                optional: true
            },
            {
                label: 'Max Output Tokens',
                name: 'maxOutputTokens',
                type: 'number',
                step: 1,
                optional: true,
                additionalParams: true
            },
            {
                label: 'Top Probability',
                name: 'topP',
                type: 'number',
                step: 0.1,
                optional: true,
                additionalParams: true
            }
        ];
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const apiKey = (0, utils_1.getCredentialParam)('googleGenerativeAPIKey', credentialData, nodeData);
        const temperature = nodeData.inputs?.temperature;
        const modelName = nodeData.inputs?.modelName;
        const maxOutputTokens = nodeData.inputs?.maxOutputTokens;
        const topP = nodeData.inputs?.topP;
        const cache = nodeData.inputs?.cache;
        const obj = {
            apiKey: apiKey,
            modelName: modelName,
            maxOutputTokens: 2048
        };
        if (maxOutputTokens)
            obj.maxOutputTokens = parseInt(maxOutputTokens, 10);
        const model = new google_genai_1.ChatGoogleGenerativeAI(obj);
        if (topP)
            model.topP = parseFloat(topP);
        if (cache)
            model.cache = cache;
        if (temperature)
            model.temperature = parseFloat(temperature);
        return model;
    }
}
module.exports = { nodeClass: GoogleGenerativeAI_ChatModels };
//# sourceMappingURL=ChatGoogleGenerativeAI.js.map