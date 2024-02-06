"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../../../src");
const score_threshold_1 = require("langchain/retrievers/score_threshold");
class SimilarityThresholdRetriever_Retrievers {
    constructor() {
        this.label = 'Similarity Score Threshold Retriever';
        this.name = 'similarityThresholdRetriever';
        this.version = 1.0;
        this.type = 'SimilarityThresholdRetriever';
        this.icon = 'similaritythreshold.svg';
        this.category = 'Retrievers';
        this.description = 'Return results based on the minimum similarity percentage';
        this.baseClasses = [this.type, 'BaseRetriever'];
        this.inputs = [
            {
                label: 'Vector Store',
                name: 'vectorStore',
                type: 'VectorStore'
            },
            {
                label: 'Minimum Similarity Score (%)',
                name: 'minSimilarityScore',
                description: 'Finds results with at least this similarity score',
                type: 'number',
                default: 80,
                step: 1
            },
            {
                label: 'Max K',
                name: 'maxK',
                description: `The maximum number of results to fetch`,
                type: 'number',
                default: 20,
                step: 1
            },
            {
                label: 'K Increment',
                name: 'kIncrement',
                description: `How much to increase K by each time. It'll fetch N results, then N + kIncrement, then N + kIncrement * 2, etc.`,
                type: 'number',
                default: 2,
                step: 1
            }
        ];
        this.outputs = [
            {
                label: 'Similarity Threshold Retriever',
                name: 'retriever',
                baseClasses: this.baseClasses
            },
            {
                label: 'Document',
                name: 'document',
                baseClasses: ['Document']
            },
            {
                label: 'Text',
                name: 'text',
                baseClasses: ['string', 'json']
            }
        ];
    }
    async init(nodeData, input) {
        const vectorStore = nodeData.inputs?.vectorStore;
        const minSimilarityScore = nodeData.inputs?.minSimilarityScore;
        const maxK = nodeData.inputs?.maxK;
        const kIncrement = nodeData.inputs?.kIncrement;
        const output = nodeData.outputs?.output;
        const retriever = score_threshold_1.ScoreThresholdRetriever.fromVectorStore(vectorStore, {
            minSimilarityScore: minSimilarityScore ? minSimilarityScore / 100 : 0.9,
            maxK: maxK ? parseInt(maxK, 10) : 100,
            kIncrement: kIncrement ? parseInt(kIncrement, 10) : 2
        });
        if (output === 'retriever')
            return retriever;
        else if (output === 'document')
            return await retriever.getRelevantDocuments(input);
        else if (output === 'text') {
            let finaltext = '';
            const docs = await retriever.getRelevantDocuments(input);
            for (const doc of docs)
                finaltext += `${doc.pageContent}\n`;
            return (0, src_1.handleEscapeCharacters)(finaltext, false);
        }
        return retriever;
    }
}
module.exports = { nodeClass: SimilarityThresholdRetriever_Retrievers };
//# sourceMappingURL=SimilarityThresholdRetriever.js.map