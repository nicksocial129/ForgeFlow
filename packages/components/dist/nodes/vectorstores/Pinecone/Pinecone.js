"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const pinecone_1 = require("@pinecone-database/pinecone");
const pinecone_2 = require("langchain/vectorstores/pinecone");
const document_1 = require("langchain/document");
const utils_1 = require("../../../src/utils");
class Pinecone_VectorStores {
    constructor() {
        //@ts-ignore
        this.vectorStoreMethods = {
            async upsert(nodeData, options) {
                const index = nodeData.inputs?.pineconeIndex;
                const pineconeNamespace = nodeData.inputs?.pineconeNamespace;
                const docs = nodeData.inputs?.document;
                const embeddings = nodeData.inputs?.embeddings;
                const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
                const pineconeApiKey = (0, utils_1.getCredentialParam)('pineconeApiKey', credentialData, nodeData);
                const pineconeEnv = (0, utils_1.getCredentialParam)('pineconeEnv', credentialData, nodeData);
                const client = new pinecone_1.Pinecone({
                    apiKey: pineconeApiKey,
                    environment: pineconeEnv
                });
                const pineconeIndex = client.Index(index);
                const flattenDocs = docs && docs.length ? (0, lodash_1.flatten)(docs) : [];
                const finalDocs = [];
                for (let i = 0; i < flattenDocs.length; i += 1) {
                    if (flattenDocs[i] && flattenDocs[i].pageContent) {
                        finalDocs.push(new document_1.Document(flattenDocs[i]));
                    }
                }
                const obj = {
                    pineconeIndex
                };
                if (pineconeNamespace)
                    obj.namespace = pineconeNamespace;
                try {
                    await pinecone_2.PineconeStore.fromDocuments(finalDocs, embeddings, obj);
                }
                catch (e) {
                    throw new Error(e);
                }
            }
        };
        this.label = 'Pinecone';
        this.name = 'pinecone';
        this.version = 1.0;
        this.type = 'Pinecone';
        this.icon = 'pinecone.png';
        this.category = 'Vector Stores';
        this.description = `Upsert embedded data and perform similarity search upon query using Pinecone, a leading fully managed hosted vector database`;
        this.baseClasses = [this.type, 'VectorStoreRetriever', 'BaseRetriever'];
        this.badge = 'NEW';
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['pineconeApi']
        };
        this.inputs = [
            {
                label: 'Document',
                name: 'document',
                type: 'Document',
                list: true,
                optional: true
            },
            {
                label: 'Embeddings',
                name: 'embeddings',
                type: 'Embeddings'
            },
            {
                label: 'Pinecone Index',
                name: 'pineconeIndex',
                type: 'string'
            },
            {
                label: 'Pinecone Namespace',
                name: 'pineconeNamespace',
                type: 'string',
                placeholder: 'my-first-namespace',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Pinecone Metadata Filter',
                name: 'pineconeMetadataFilter',
                type: 'json',
                optional: true,
                additionalParams: true
            },
            {
                label: 'Top K',
                name: 'topK',
                description: 'Number of top results to fetch. Default to 4',
                placeholder: '4',
                type: 'number',
                additionalParams: true,
                optional: true
            }
        ];
        this.outputs = [
            {
                label: 'Pinecone Retriever',
                name: 'retriever',
                baseClasses: this.baseClasses
            },
            {
                label: 'Pinecone Vector Store',
                name: 'vectorStore',
                baseClasses: [this.type, ...(0, utils_1.getBaseClasses)(pinecone_2.PineconeStore)]
            }
        ];
    }
    async init(nodeData, _, options) {
        const index = nodeData.inputs?.pineconeIndex;
        const pineconeNamespace = nodeData.inputs?.pineconeNamespace;
        const pineconeMetadataFilter = nodeData.inputs?.pineconeMetadataFilter;
        const docs = nodeData.inputs?.document;
        const embeddings = nodeData.inputs?.embeddings;
        const output = nodeData.outputs?.output;
        const topK = nodeData.inputs?.topK;
        const k = topK ? parseFloat(topK) : 4;
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const pineconeApiKey = (0, utils_1.getCredentialParam)('pineconeApiKey', credentialData, nodeData);
        const pineconeEnv = (0, utils_1.getCredentialParam)('pineconeEnv', credentialData, nodeData);
        const client = new pinecone_1.Pinecone({
            apiKey: pineconeApiKey,
            environment: pineconeEnv
        });
        const pineconeIndex = client.Index(index);
        const flattenDocs = docs && docs.length ? (0, lodash_1.flatten)(docs) : [];
        const finalDocs = [];
        for (let i = 0; i < flattenDocs.length; i += 1) {
            if (flattenDocs[i] && flattenDocs[i].pageContent) {
                finalDocs.push(new document_1.Document(flattenDocs[i]));
            }
        }
        const obj = {
            pineconeIndex
        };
        if (pineconeNamespace)
            obj.namespace = pineconeNamespace;
        if (pineconeMetadataFilter) {
            const metadatafilter = typeof pineconeMetadataFilter === 'object' ? pineconeMetadataFilter : JSON.parse(pineconeMetadataFilter);
            obj.filter = metadatafilter;
        }
        const vectorStore = await pinecone_2.PineconeStore.fromExistingIndex(embeddings, obj);
        if (output === 'retriever') {
            const retriever = vectorStore.asRetriever(k);
            return retriever;
        }
        else if (output === 'vectorStore') {
            ;
            vectorStore.k = k;
            return vectorStore;
        }
        return vectorStore;
    }
}
module.exports = { nodeClass: Pinecone_VectorStores };
//# sourceMappingURL=Pinecone.js.map