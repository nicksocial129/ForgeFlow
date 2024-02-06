import { ICommonObject, INodeData, INodeOutputsValue, INodeParams } from '../../../src';
import { ClientOptions } from '@elastic/elasticsearch';
import { ElasticClientArgs } from 'langchain/vectorstores/elasticsearch';
import { Embeddings } from 'langchain/embeddings/base';
import { VectorStore } from 'langchain/vectorstores/base';
import { Document } from 'langchain/document';
export declare abstract class ElasticSearchBase {
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
    protected constructor();
    abstract constructVectorStore(embeddings: Embeddings, elasticSearchClientArgs: ElasticClientArgs, docs: Document<Record<string, any>>[] | undefined): Promise<VectorStore>;
    init(nodeData: INodeData, _: string, options: ICommonObject, docs: Document<Record<string, any>>[] | undefined): Promise<any>;
    protected prepareConnectionOptions(endPoint: string | undefined, cloudId: string | undefined, credentialData: ICommonObject, nodeData: INodeData): ClientOptions;
    protected prepareClientArgs(endPoint: string | undefined, cloudId: string | undefined, credentialData: ICommonObject, nodeData: INodeData, similarityMeasure: string, indexName: string): ElasticClientArgs;
}
