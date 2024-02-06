"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const googlepalm_1 = require("langchain/embeddings/googlepalm");
class GooglePaLMEmbedding_Embeddings {
    constructor() {
        this.label = 'Google PaLM Embeddings';
        this.name = 'googlePaLMEmbeddings';
        this.version = 1.0;
        this.type = 'GooglePaLMEmbeddings';
        this.icon = 'Google_PaLM_Logo.svg';
        this.category = 'Embeddings';
        this.description = 'Google MakerSuite PaLM API to generate embeddings for a given text';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(googlepalm_1.GooglePaLMEmbeddings)];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['googleMakerSuite']
        };
        this.inputs = [
            {
                label: 'Model Name',
                name: 'modelName',
                type: 'options',
                options: [
                    {
                        label: 'models/embedding-gecko-001',
                        name: 'models/embedding-gecko-001'
                    }
                ],
                default: 'models/embedding-gecko-001',
                optional: true
            }
        ];
    }
    async init(nodeData, _, options) {
        const modelName = nodeData.inputs?.modelName;
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const googleMakerSuiteKey = (0, utils_1.getCredentialParam)('googleMakerSuiteKey', credentialData, nodeData);
        const obj = {
            modelName: modelName,
            apiKey: googleMakerSuiteKey
        };
        const model = new googlepalm_1.GooglePaLMEmbeddings(obj);
        return model;
    }
}
module.exports = { nodeClass: GooglePaLMEmbedding_Embeddings };
//# sourceMappingURL=GooglePaLMEmbedding.js.map