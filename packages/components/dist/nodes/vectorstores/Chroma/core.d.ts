import { Chroma, ChromaLibArgs } from 'langchain/vectorstores/chroma';
import { Embeddings } from 'langchain/embeddings/base';
import type { Collection } from 'chromadb';
interface ChromaAuth {
    chromaApiKey?: string;
}
export declare class ChromaExtended extends Chroma {
    chromaApiKey?: string;
    constructor(embeddings: Embeddings, args: ChromaLibArgs & Partial<ChromaAuth>);
    static fromExistingCollection(embeddings: Embeddings, dbConfig: ChromaLibArgs & Partial<ChromaAuth>): Promise<Chroma>;
    ensureCollection(): Promise<Collection>;
}
export {};
