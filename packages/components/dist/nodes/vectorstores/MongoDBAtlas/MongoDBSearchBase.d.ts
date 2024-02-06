import { ICommonObject, INodeData, INodeOutputsValue, INodeParams } from '../../../src';
import { Embeddings } from 'langchain/embeddings/base';
import { VectorStore } from 'langchain/vectorstores/base';
import { Document } from 'langchain/document';
import { Collection, MongoClient } from 'mongodb';
export declare abstract class MongoDBSearchBase {
    label: string;
    name: string;
    version: number;
    description: string;
    type: string;
    icon: string;
    category: string;
    badge: string;
    baseClasses: string[];
    inputs: INodeParams[];
    credential: INodeParams;
    outputs: INodeOutputsValue[];
    mongoClient: MongoClient;
    protected constructor();
    abstract constructVectorStore(embeddings: Embeddings, collection: Collection, indexName: string, textKey: string, embeddingKey: string, docs: Document<Record<string, any>>[] | undefined): Promise<VectorStore>;
    init(nodeData: INodeData, _: string, options: ICommonObject, docs: Document<Record<string, any>>[] | undefined): Promise<any>;
}
