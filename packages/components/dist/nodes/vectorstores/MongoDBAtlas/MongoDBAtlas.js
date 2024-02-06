"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const mongodb_1 = require("mongodb");
const mongodb_atlas_1 = require("langchain/vectorstores/mongodb_atlas");
const document_1 = require("langchain/document");
const utils_1 = require("../../../src/utils");
class MongoDBAtlas_VectorStores {
    constructor() {
        //@ts-ignore
        this.vectorStoreMethods = {
            async upsert(nodeData, options) {
                const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
                const databaseName = nodeData.inputs?.databaseName;
                const collectionName = nodeData.inputs?.collectionName;
                const indexName = nodeData.inputs?.indexName;
                let textKey = nodeData.inputs?.textKey;
                let embeddingKey = nodeData.inputs?.embeddingKey;
                const embeddings = nodeData.inputs?.embeddings;
                let mongoDBConnectUrl = (0, utils_1.getCredentialParam)('mongoDBConnectUrl', credentialData, nodeData);
                const docs = nodeData.inputs?.document;
                const flattenDocs = docs && docs.length ? (0, lodash_1.flatten)(docs) : [];
                const finalDocs = [];
                for (let i = 0; i < flattenDocs.length; i += 1) {
                    if (flattenDocs[i] && flattenDocs[i].pageContent) {
                        const document = new document_1.Document(flattenDocs[i]);
                        finalDocs.push(document);
                    }
                }
                const mongoClient = new mongodb_1.MongoClient(mongoDBConnectUrl);
                const collection = mongoClient.db(databaseName).collection(collectionName);
                if (!textKey || textKey === '')
                    textKey = 'text';
                if (!embeddingKey || embeddingKey === '')
                    embeddingKey = 'embedding';
                const mongoDBAtlasVectorSearch = new mongodb_atlas_1.MongoDBAtlasVectorSearch(embeddings, {
                    collection,
                    indexName,
                    textKey,
                    embeddingKey
                });
                try {
                    await mongoDBAtlasVectorSearch.addDocuments(finalDocs);
                }
                catch (e) {
                    throw new Error(e);
                }
            }
        };
        this.label = 'MongoDB Atlas';
        this.name = 'mongoDBAtlas';
        this.version = 1.0;
        this.description = `Upsert embedded data and perform similarity search upon query using MongoDB Atlas, a managed cloud mongodb database`;
        this.type = 'MongoDB Atlas';
        this.icon = 'mongodb.png';
        this.category = 'Vector Stores';
        this.baseClasses = [this.type, 'VectorStoreRetriever', 'BaseRetriever'];
        this.badge = 'NEW';
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['mongoDBUrlApi']
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
                label: 'Database',
                name: 'databaseName',
                placeholder: '<DB_NAME>',
                type: 'string'
            },
            {
                label: 'Collection Name',
                name: 'collectionName',
                placeholder: '<COLLECTION_NAME>',
                type: 'string'
            },
            {
                label: 'Index Name',
                name: 'indexName',
                placeholder: '<VECTOR_INDEX_NAME>',
                type: 'string'
            },
            {
                label: 'Content Field',
                name: 'textKey',
                description: 'Name of the field (column) that contains the actual content',
                type: 'string',
                default: 'text',
                additionalParams: true,
                optional: true
            },
            {
                label: 'Embedded Field',
                name: 'embeddingKey',
                description: 'Name of the field (column) that contains the Embedding',
                type: 'string',
                default: 'embedding',
                additionalParams: true,
                optional: true
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
                label: 'MongoDB Retriever',
                name: 'retriever',
                baseClasses: this.baseClasses
            },
            {
                label: 'MongoDB Vector Store',
                name: 'vectorStore',
                baseClasses: [this.type, ...(0, utils_1.getBaseClasses)(mongodb_atlas_1.MongoDBAtlasVectorSearch)]
            }
        ];
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const databaseName = nodeData.inputs?.databaseName;
        const collectionName = nodeData.inputs?.collectionName;
        const indexName = nodeData.inputs?.indexName;
        let textKey = nodeData.inputs?.textKey;
        let embeddingKey = nodeData.inputs?.embeddingKey;
        const embeddings = nodeData.inputs?.embeddings;
        const topK = nodeData.inputs?.topK;
        const k = topK ? parseFloat(topK) : 4;
        const output = nodeData.outputs?.output;
        let mongoDBConnectUrl = (0, utils_1.getCredentialParam)('mongoDBConnectUrl', credentialData, nodeData);
        const mongoClient = new mongodb_1.MongoClient(mongoDBConnectUrl);
        const collection = mongoClient.db(databaseName).collection(collectionName);
        if (!textKey || textKey === '')
            textKey = 'text';
        if (!embeddingKey || embeddingKey === '')
            embeddingKey = 'embedding';
        const vectorStore = new mongodb_atlas_1.MongoDBAtlasVectorSearch(embeddings, {
            collection,
            indexName,
            textKey,
            embeddingKey
        });
        if (output === 'retriever') {
            return vectorStore.asRetriever(k);
        }
        else if (output === 'vectorStore') {
            ;
            vectorStore.k = k;
            return vectorStore;
        }
        return vectorStore;
    }
}
module.exports = { nodeClass: MongoDBAtlas_VectorStores };
//# sourceMappingURL=MongoDBAtlas.js.map