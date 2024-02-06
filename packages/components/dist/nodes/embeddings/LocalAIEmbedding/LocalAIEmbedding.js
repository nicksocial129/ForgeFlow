"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = require("langchain/embeddings/openai");
class LocalAIEmbedding_Embeddings {
    constructor() {
        this.label = 'LocalAI Embeddings';
        this.name = 'localAIEmbeddings';
        this.version = 1.0;
        this.type = 'LocalAI Embeddings';
        this.icon = 'localai.png';
        this.category = 'Embeddings';
        this.description = 'Use local embeddings models like llama.cpp';
        this.baseClasses = [this.type, 'Embeddings'];
        this.inputs = [
            {
                label: 'Base Path',
                name: 'basePath',
                type: 'string',
                placeholder: 'http://localhost:8080/v1'
            },
            {
                label: 'Model Name',
                name: 'modelName',
                type: 'string',
                placeholder: 'text-embedding-ada-002'
            }
        ];
    }
    async init(nodeData) {
        const modelName = nodeData.inputs?.modelName;
        const basePath = nodeData.inputs?.basePath;
        const obj = {
            modelName,
            openAIApiKey: 'sk-'
        };
        const model = new openai_1.OpenAIEmbeddings(obj, { basePath });
        return model;
    }
}
module.exports = { nodeClass: LocalAIEmbedding_Embeddings };
//# sourceMappingURL=LocalAIEmbedding.js.map