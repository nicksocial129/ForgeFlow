import { IComponentCredentials, IComponentNodes, ICredentialDataDecrypted, ICredentialReqBody, IDepthQueue, INodeData, INodeDependencies, INodeDirectedGraph, IOverrideConfig, IReactFlowEdge, IReactFlowNode, IncomingInput } from '../Interface';
import { ICommonObject, IDatabaseEntity, IMessage } from 'flowise-components';
import { Credential } from '../database/entities/Credential';
import { DataSource } from 'typeorm';
import { CachePool } from '../CachePool';
export declare const databaseEntities: IDatabaseEntity;
/**
 * Returns the home folder path of the user if
 * none can be found it falls back to the current
 * working directory
 *
 */
export declare const getUserHome: () => string;
/**
 * Returns the path of node modules package
 * @param {string} packageName
 * @returns {string}
 */
export declare const getNodeModulesPackagePath: (packageName: string) => string;
/**
 * Construct graph and node dependencies score
 * @param {IReactFlowNode[]} reactFlowNodes
 * @param {IReactFlowEdge[]} reactFlowEdges
 * @param {boolean} isNondirected
 */
export declare const constructGraphs: (reactFlowNodes: IReactFlowNode[], reactFlowEdges: IReactFlowEdge[], isNondirected?: boolean) => {
    graph: INodeDirectedGraph;
    nodeDependencies: INodeDependencies;
};
/**
 * Get starting nodes and check if flow is valid
 * @param {INodeDependencies} graph
 * @param {string} endNodeId
 */
export declare const getStartingNodes: (graph: INodeDirectedGraph, endNodeId: string) => {
    startingNodeIds: string[];
    depthQueue: IDepthQueue;
};
/**
 * Get ending node and check if flow is valid
 * @param {INodeDependencies} nodeDependencies
 * @param {INodeDirectedGraph} graph
 */
export declare const getEndingNode: (nodeDependencies: INodeDependencies, graph: INodeDirectedGraph) => string;
/**
 * Build langchain from start to end
 * @param {string[]} startingNodeIds
 * @param {IReactFlowNode[]} reactFlowNodes
 * @param {INodeDirectedGraph} graph
 * @param {IDepthQueue} depthQueue
 * @param {IComponentNodes} componentNodes
 * @param {string} question
 * @param {string} chatId
 * @param {string} chatflowid
 * @param {DataSource} appDataSource
 * @param {ICommonObject} overrideConfig
 * @param {CachePool} cachePool
 */
export declare const buildLangchain: (startingNodeIds: string[], reactFlowNodes: IReactFlowNode[], graph: INodeDirectedGraph, depthQueue: IDepthQueue, componentNodes: IComponentNodes, question: string, chatHistory: IMessage[] | string, chatId: string, chatflowid: string, appDataSource: DataSource, overrideConfig?: ICommonObject, cachePool?: CachePool, isUpsert?: boolean, stopNodeId?: string) => Promise<IReactFlowNode[]>;
/**
 * Clear all session memories on the canvas
 * @param {IReactFlowNode[]} reactFlowNodes
 * @param {IComponentNodes} componentNodes
 * @param {string} chatId
 * @param {DataSource} appDataSource
 * @param {string} sessionId
 */
export declare const clearAllSessionMemory: (reactFlowNodes: IReactFlowNode[], componentNodes: IComponentNodes, chatId: string, appDataSource: DataSource, sessionId?: string) => Promise<void>;
/**
 * Clear specific session memory from View Message Dialog UI
 * @param {IReactFlowNode[]} reactFlowNodes
 * @param {IComponentNodes} componentNodes
 * @param {string} chatId
 * @param {DataSource} appDataSource
 * @param {string} sessionId
 * @param {string} memoryType
 */
export declare const clearSessionMemoryFromViewMessageDialog: (reactFlowNodes: IReactFlowNode[], componentNodes: IComponentNodes, chatId: string, appDataSource: DataSource, sessionId?: string, memoryType?: string) => Promise<void>;
/**
 * Get variable value from outputResponses.output
 * @param {string} paramValue
 * @param {IReactFlowNode[]} reactFlowNodes
 * @param {string} question
 * @param {boolean} isAcceptVariable
 * @returns {string}
 */
export declare const getVariableValue: (paramValue: string, reactFlowNodes: IReactFlowNode[], question: string, chatHistory: IMessage[] | string, isAcceptVariable?: boolean) => string;
/**
 * Loop through each inputs and resolve variable if neccessary
 * @param {INodeData} reactFlowNodeData
 * @param {IReactFlowNode[]} reactFlowNodes
 * @param {string} question
 * @returns {INodeData}
 */
export declare const resolveVariables: (reactFlowNodeData: INodeData, reactFlowNodes: IReactFlowNode[], question: string, chatHistory: IMessage[] | string) => INodeData;
/**
 * Loop through each inputs and replace their value with override config values
 * @param {INodeData} flowNodeData
 * @param {ICommonObject} overrideConfig
 * @returns {INodeData}
 */
export declare const replaceInputsWithConfig: (flowNodeData: INodeData, overrideConfig: ICommonObject) => INodeData;
/**
 * Rebuild flow if LLMChain has dependency on other chains
 * User Question => Prompt_0 => LLMChain_0 => Prompt-1 => LLMChain_1
 * @param {IReactFlowNode[]} startingNodes
 * @returns {boolean}
 */
export declare const isStartNodeDependOnInput: (startingNodes: IReactFlowNode[], nodes: IReactFlowNode[]) => boolean;
/**
 * Rebuild flow if new override config is provided
 * @param {boolean} isInternal
 * @param {ICommonObject} existingOverrideConfig
 * @param {ICommonObject} newOverrideConfig
 * @returns {boolean}
 */
export declare const isSameOverrideConfig: (isInternal: boolean, existingOverrideConfig?: ICommonObject, newOverrideConfig?: ICommonObject) => boolean;
/**
 * Map MimeType to InputField
 * @param {string} mimeType
 * @returns {Promise<string>}
 */
export declare const mapMimeTypeToInputField: (mimeType: string) => "" | "txtFile" | "pdfFile" | "jsonFile" | "csvFile" | "jsonlinesFile" | "docxFile" | "yamlFile";
/**
 * Find all available input params config
 * @param {IReactFlowNode[]} reactFlowNodes
 * @param {IComponentCredentials} componentCredentials
 * @returns {IOverrideConfig[]}
 */
export declare const findAvailableConfigs: (reactFlowNodes: IReactFlowNode[], componentCredentials: IComponentCredentials) => IOverrideConfig[];
/**
 * Check to see if flow valid for stream
 * @param {IReactFlowNode[]} reactFlowNodes
 * @param {INodeData} endingNodeData
 * @returns {boolean}
 */
export declare const isFlowValidForStream: (reactFlowNodes: IReactFlowNode[], endingNodeData: INodeData) => boolean;
/**
 * Returns the path of encryption key
 * @returns {string}
 */
export declare const getEncryptionKeyPath: () => string;
/**
 * Generate an encryption key
 * @returns {string}
 */
export declare const generateEncryptKey: () => string;
/**
 * Returns the encryption key
 * @returns {Promise<string>}
 */
export declare const getEncryptionKey: () => Promise<string>;
/**
 * Encrypt credential data
 * @param {ICredentialDataDecrypted} plainDataObj
 * @returns {Promise<string>}
 */
export declare const encryptCredentialData: (plainDataObj: ICredentialDataDecrypted) => Promise<string>;
/**
 * Decrypt credential data
 * @param {string} encryptedData
 * @param {string} componentCredentialName
 * @param {IComponentCredentials} componentCredentials
 * @returns {Promise<ICredentialDataDecrypted>}
 */
export declare const decryptCredentialData: (encryptedData: string, componentCredentialName?: string, componentCredentials?: IComponentCredentials) => Promise<ICredentialDataDecrypted>;
/**
 * Transform ICredentialBody from req to Credential entity
 * @param {ICredentialReqBody} body
 * @returns {Credential}
 */
export declare const transformToCredentialEntity: (body: ICredentialReqBody) => Promise<Credential>;
/**
 * Redact values that are of password type to avoid sending back to client
 * @param {string} componentCredentialName
 * @param {ICredentialDataDecrypted} decryptedCredentialObj
 * @param {IComponentCredentials} componentCredentials
 * @returns {ICredentialDataDecrypted}
 */
export declare const redactCredentialWithPasswordType: (componentCredentialName: string, decryptedCredentialObj: ICredentialDataDecrypted, componentCredentials: IComponentCredentials) => ICredentialDataDecrypted;
/**
 * Replace sessionId with new chatId
 * Ex: after clear chat history, use the new chatId as sessionId
 * @param {any} instance
 * @param {string} chatId
 */
export declare const checkMemorySessionId: (instance: any, chatId: string) => string | undefined;
/**
 * Replace chatHistory if incomingInput.history is empty and sessionId/chatId is provided
 * @param {IReactFlowNode} memoryNode
 * @param {IncomingInput} incomingInput
 * @param {DataSource} appDataSource
 * @param {IDatabaseEntity} databaseEntities
 * @param {any} logger
 * @returns {string}
 */
export declare const replaceChatHistory: (memoryNode: IReactFlowNode, incomingInput: IncomingInput, appDataSource: DataSource, databaseEntities: IDatabaseEntity, logger: any) => Promise<string>;
/**
 * Get all values from a JSON object
 * @param {any} obj
 * @returns {any[]}
 */
export declare const getAllValuesFromJson: (obj: any) => any[];
