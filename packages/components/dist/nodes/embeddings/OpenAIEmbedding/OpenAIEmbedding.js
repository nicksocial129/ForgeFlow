"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const openai_1 = require("langchain/embeddings/openai");
class OpenAIEmbedding_Embeddings {
    constructor() {
        this.label = 'OpenAI Embeddings';
        this.name = 'openAIEmbeddings';
        this.version = 1.0;
        this.type = 'OpenAIEmbeddings';
        this.icon = 'openai.png';
        this.category = 'Embeddings';
        this.description = 'OpenAI API to generate embeddings for a given text';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(openai_1.OpenAIEmbeddings)];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['openAIApi']
        };
        this.inputs = [
            {
                label: 'Strip New Lines',
                name: 'stripNewLines',
                type: 'boolean',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Batch Size',
                name: 'batchSize',
                type: 'number',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Timeout',
                name: 'timeout',
                type: 'number',
                optional: true,
                additionalParams: true
            },
            {
                label: 'BasePath',
                name: 'basepath',
                type: 'string',
                optional: true,
                additionalParams: true
            }
        ];
    }
    async init(nodeData, _, options) {
        const stripNewLines = nodeData.inputs?.stripNewLines;
        const batchSize = nodeData.inputs?.batchSize;
        const timeout = nodeData.inputs?.timeout;
        const basePath = nodeData.inputs?.basepath;
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const openAIApiKey = (0, utils_1.getCredentialParam)('openAIApiKey', credentialData, nodeData);
        const obj = {
            openAIApiKey
        };
        if (stripNewLines)
            obj.stripNewLines = stripNewLines;
        if (batchSize)
            obj.batchSize = parseInt(batchSize, 10);
        if (timeout)
            obj.timeout = parseInt(timeout, 10);
        const model = new openai_1.OpenAIEmbeddings(obj, { basePath });
        return model;
    }
}
module.exports = { nodeClass: OpenAIEmbedding_Embeddings };
//# sourceMappingURL=OpenAIEmbedding.js.map