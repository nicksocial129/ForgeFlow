"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const googlevertexai_1 = require("langchain/embeddings/googlevertexai");
const utils_1 = require("../../../src/utils");
class GoogleVertexAIEmbedding_Embeddings {
    constructor() {
        this.label = 'GoogleVertexAI Embeddings';
        this.name = 'googlevertexaiEmbeddings';
        this.version = 1.0;
        this.type = 'GoogleVertexAIEmbeddings';
        this.icon = 'vertexai.svg';
        this.category = 'Embeddings';
        this.description = 'Google vertexAI API to generate embeddings for a given text';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(googlevertexai_1.GoogleVertexAIEmbeddings)];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['googleVertexAuth'],
            optional: true,
            description: 'Google Vertex AI credential. If you are using a GCP service like Cloud Run, or if you have installed default credentials on your local machine, you do not need to set this credential.'
        };
        this.inputs = [
            {
                label: 'Model Name',
                name: 'modelName',
                type: 'options',
                options: [
                    {
                        label: 'textembedding-gecko@001',
                        name: 'textembedding-gecko@001'
                    },
                    {
                        label: 'textembedding-gecko@latest',
                        name: 'textembedding-gecko@latest'
                    },
                    {
                        label: 'textembedding-gecko-multilingual@latest',
                        name: 'textembedding-gecko-multilingual@latest'
                    }
                ],
                default: 'textembedding-gecko@001',
                optional: true
            }
        ];
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const modelName = nodeData.inputs?.modelName;
        const googleApplicationCredentialFilePath = (0, utils_1.getCredentialParam)('googleApplicationCredentialFilePath', credentialData, nodeData);
        const googleApplicationCredential = (0, utils_1.getCredentialParam)('googleApplicationCredential', credentialData, nodeData);
        const projectID = (0, utils_1.getCredentialParam)('projectID', credentialData, nodeData);
        const authOptions = {};
        if (Object.keys(credentialData).length !== 0) {
            if (!googleApplicationCredentialFilePath && !googleApplicationCredential)
                throw new Error('Please specify your Google Application Credential');
            if (!googleApplicationCredentialFilePath && !googleApplicationCredential)
                throw new Error('Error: More than one component has been inputted. Please use only one of the following: Google Application Credential File Path or Google Credential JSON Object');
            if (googleApplicationCredentialFilePath && !googleApplicationCredential)
                authOptions.keyFile = googleApplicationCredentialFilePath;
            else if (!googleApplicationCredentialFilePath && googleApplicationCredential)
                authOptions.credentials = JSON.parse(googleApplicationCredential);
            if (projectID)
                authOptions.projectId = projectID;
        }
        const obj = {};
        if (modelName)
            obj.model = modelName;
        if (Object.keys(authOptions).length !== 0)
            obj.authOptions = authOptions;
        const model = new googlevertexai_1.GoogleVertexAIEmbeddings(obj);
        return model;
    }
}
module.exports = { nodeClass: GoogleVertexAIEmbedding_Embeddings };
//# sourceMappingURL=GoogleVertexAIEmbedding.js.map