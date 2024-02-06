"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const cohere_1 = require("langchain/embeddings/cohere");
class CohereEmbedding_Embeddings {
    constructor() {
        this.label = 'Cohere Embeddings';
        this.name = 'cohereEmbeddings';
        this.version = 1.0;
        this.type = 'CohereEmbeddings';
        this.icon = 'cohere.png';
        this.category = 'Embeddings';
        this.description = 'Cohere API to generate embeddings for a given text';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(cohere_1.CohereEmbeddings)];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['cohereApi']
        };
        this.inputs = [
            {
                label: 'Model Name',
                name: 'modelName',
                type: 'options',
                options: [
                    {
                        label: 'embed-english-v2.0',
                        name: 'embed-english-v2.0'
                    },
                    {
                        label: 'embed-english-light-v2.0',
                        name: 'embed-english-light-v2.0'
                    },
                    {
                        label: 'embed-multilingual-v2.0',
                        name: 'embed-multilingual-v2.0'
                    }
                ],
                default: 'embed-english-v2.0',
                optional: true
            }
        ];
    }
    async init(nodeData, _, options) {
        const modelName = nodeData.inputs?.modelName;
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const cohereApiKey = (0, utils_1.getCredentialParam)('cohereApiKey', credentialData, nodeData);
        const obj = {
            apiKey: cohereApiKey
        };
        if (modelName)
            obj.modelName = modelName;
        const model = new cohere_1.CohereEmbeddings(obj);
        return model;
    }
}
module.exports = { nodeClass: CohereEmbedding_Embeddings };
//# sourceMappingURL=CohereEmbedding.js.map