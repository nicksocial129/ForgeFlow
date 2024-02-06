"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const bedrock_1 = require("langchain/embeddings/bedrock");
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
class AWSBedrockEmbedding_Embeddings {
    constructor() {
        this.label = 'AWS Bedrock Embeddings';
        this.name = 'AWSBedrockEmbeddings';
        this.version = 3.0;
        this.type = 'AWSBedrockEmbeddings';
        this.icon = 'awsBedrock.png';
        this.category = 'Embeddings';
        this.description = 'AWSBedrock embedding models to generate embeddings for a given text';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(bedrock_1.BedrockEmbeddings)];
        this.credential = {
            label: 'AWS Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['awsApi'],
            optional: true
        };
        this.inputs = [
            {
                label: 'Region',
                name: 'region',
                type: 'options',
                options: [
                    { label: 'af-south-1', name: 'af-south-1' },
                    { label: 'ap-east-1', name: 'ap-east-1' },
                    { label: 'ap-northeast-1', name: 'ap-northeast-1' },
                    { label: 'ap-northeast-2', name: 'ap-northeast-2' },
                    { label: 'ap-northeast-3', name: 'ap-northeast-3' },
                    { label: 'ap-south-1', name: 'ap-south-1' },
                    { label: 'ap-south-2', name: 'ap-south-2' },
                    { label: 'ap-southeast-1', name: 'ap-southeast-1' },
                    { label: 'ap-southeast-2', name: 'ap-southeast-2' },
                    { label: 'ap-southeast-3', name: 'ap-southeast-3' },
                    { label: 'ap-southeast-4', name: 'ap-southeast-4' },
                    { label: 'ap-southeast-5', name: 'ap-southeast-5' },
                    { label: 'ap-southeast-6', name: 'ap-southeast-6' },
                    { label: 'ca-central-1', name: 'ca-central-1' },
                    { label: 'ca-west-1', name: 'ca-west-1' },
                    { label: 'cn-north-1', name: 'cn-north-1' },
                    { label: 'cn-northwest-1', name: 'cn-northwest-1' },
                    { label: 'eu-central-1', name: 'eu-central-1' },
                    { label: 'eu-central-2', name: 'eu-central-2' },
                    { label: 'eu-north-1', name: 'eu-north-1' },
                    { label: 'eu-south-1', name: 'eu-south-1' },
                    { label: 'eu-south-2', name: 'eu-south-2' },
                    { label: 'eu-west-1', name: 'eu-west-1' },
                    { label: 'eu-west-2', name: 'eu-west-2' },
                    { label: 'eu-west-3', name: 'eu-west-3' },
                    { label: 'il-central-1', name: 'il-central-1' },
                    { label: 'me-central-1', name: 'me-central-1' },
                    { label: 'me-south-1', name: 'me-south-1' },
                    { label: 'sa-east-1', name: 'sa-east-1' },
                    { label: 'us-east-1', name: 'us-east-1' },
                    { label: 'us-east-2', name: 'us-east-2' },
                    { label: 'us-gov-east-1', name: 'us-gov-east-1' },
                    { label: 'us-gov-west-1', name: 'us-gov-west-1' },
                    { label: 'us-west-1', name: 'us-west-1' },
                    { label: 'us-west-2', name: 'us-west-2' }
                ],
                default: 'us-east-1'
            },
            {
                label: 'Model Name',
                name: 'model',
                type: 'options',
                options: [
                    { label: 'amazon.titan-embed-text-v1', name: 'amazon.titan-embed-text-v1' },
                    { label: 'amazon.titan-embed-g1-text-02', name: 'amazon.titan-embed-g1-text-02' },
                    { label: 'cohere.embed-english-v3', name: 'cohere.embed-english-v3' },
                    { label: 'cohere.embed-multilingual-v3', name: 'cohere.embed-multilingual-v3' }
                ],
                default: 'amazon.titan-embed-text-v1'
            },
            {
                label: 'Custom Model Name',
                name: 'customModel',
                description: 'If provided, will override model selected from Model Name option',
                type: 'string',
                optional: true
            }
        ];
    }
    async init(nodeData, _, options) {
        const iRegion = nodeData.inputs?.region;
        const iModel = nodeData.inputs?.model;
        const customModel = nodeData.inputs?.customModel;
        const obj = {
            model: customModel ?? iModel,
            region: iRegion
        };
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        if (credentialData && Object.keys(credentialData).length !== 0) {
            const credentialApiKey = (0, utils_1.getCredentialParam)('awsKey', credentialData, nodeData);
            const credentialApiSecret = (0, utils_1.getCredentialParam)('awsSecret', credentialData, nodeData);
            const credentialApiSession = (0, utils_1.getCredentialParam)('awsSession', credentialData, nodeData);
            obj.credentials = {
                accessKeyId: credentialApiKey,
                secretAccessKey: credentialApiSecret,
                sessionToken: credentialApiSession
            };
        }
        const client = new client_bedrock_runtime_1.BedrockRuntimeClient({
            region: obj.region,
            credentials: obj.credentials
        });
        const model = new bedrock_1.BedrockEmbeddings(obj);
        // Avoid Illegal Invocation
        model.embedQuery = async (document) => {
            return await embedText(document, client, iModel);
        };
        model.embedDocuments = async (documents) => {
            return Promise.all(documents.map((document) => embedText(document, client, iModel)));
        };
        return model;
    }
}
const embedText = async (text, client, model) => {
    // replace newlines, which can negatively affect performance.
    const cleanedText = text.replace(/\n/g, ' ');
    const res = await client.send(new client_bedrock_runtime_1.InvokeModelCommand({
        modelId: model,
        body: JSON.stringify({
            inputText: cleanedText
        }),
        contentType: 'application/json',
        accept: 'application/json'
    }));
    try {
        const body = new TextDecoder().decode(res.body);
        return JSON.parse(body).embedding;
    }
    catch (e) {
        throw new Error('An invalid response was returned by Bedrock.');
    }
};
module.exports = { nodeClass: AWSBedrockEmbedding_Embeddings };
//# sourceMappingURL=AWSBedrockEmbedding.js.map