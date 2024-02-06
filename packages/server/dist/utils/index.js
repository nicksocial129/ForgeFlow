"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllValuesFromJson = exports.replaceChatHistory = exports.checkMemorySessionId = exports.redactCredentialWithPasswordType = exports.transformToCredentialEntity = exports.decryptCredentialData = exports.encryptCredentialData = exports.getEncryptionKey = exports.generateEncryptKey = exports.getEncryptionKeyPath = exports.isFlowValidForStream = exports.findAvailableConfigs = exports.mapMimeTypeToInputField = exports.isSameOverrideConfig = exports.isStartNodeDependOnInput = exports.replaceInputsWithConfig = exports.resolveVariables = exports.getVariableValue = exports.clearSessionMemoryFromViewMessageDialog = exports.clearAllSessionMemory = exports.buildLangchain = exports.getEndingNode = exports.getStartingNodes = exports.constructGraphs = exports.getNodeModulesPackagePath = exports.getUserHome = exports.databaseEntities = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = __importDefault(require("./logger"));
const lodash_1 = require("lodash");
const flowise_components_1 = require("flowise-components");
const crypto_1 = require("crypto");
const crypto_js_1 = require("crypto-js");
const ChatFlow_1 = require("../database/entities/ChatFlow");
const ChatMessage_1 = require("../database/entities/ChatMessage");
const Credential_1 = require("../database/entities/Credential");
const Tool_1 = require("../database/entities/Tool");
const Assistant_1 = require("../database/entities/Assistant");
const QUESTION_VAR_PREFIX = 'question';
const CHAT_HISTORY_VAR_PREFIX = 'chat_history';
const REDACTED_CREDENTIAL_VALUE = '_FLOWISE_BLANK_07167752-1a71-43b1-bf8f-4f32252165db';
exports.databaseEntities = {
    ChatFlow: ChatFlow_1.ChatFlow,
    ChatMessage: ChatMessage_1.ChatMessage,
    Tool: Tool_1.Tool,
    Credential: Credential_1.Credential,
    Assistant: Assistant_1.Assistant
};
/**
 * Returns the home folder path of the user if
 * none can be found it falls back to the current
 * working directory
 *
 */
const getUserHome = () => {
    let variableName = 'HOME';
    if (process.platform === 'win32') {
        variableName = 'USERPROFILE';
    }
    if (process.env[variableName] === undefined) {
        // If for some reason the variable does not exist
        // fall back to current folder
        return process.cwd();
    }
    return process.env[variableName];
};
exports.getUserHome = getUserHome;
/**
 * Returns the path of node modules package
 * @param {string} packageName
 * @returns {string}
 */
const getNodeModulesPackagePath = (packageName) => {
    const checkPaths = [
        path_1.default.join(__dirname, '..', 'node_modules', packageName),
        path_1.default.join(__dirname, '..', '..', 'node_modules', packageName),
        path_1.default.join(__dirname, '..', '..', '..', 'node_modules', packageName),
        path_1.default.join(__dirname, '..', '..', '..', '..', 'node_modules', packageName),
        path_1.default.join(__dirname, '..', '..', '..', '..', '..', 'node_modules', packageName)
    ];
    for (const checkPath of checkPaths) {
        if (fs_1.default.existsSync(checkPath)) {
            return checkPath;
        }
    }
    return '';
};
exports.getNodeModulesPackagePath = getNodeModulesPackagePath;
/**
 * Construct graph and node dependencies score
 * @param {IReactFlowNode[]} reactFlowNodes
 * @param {IReactFlowEdge[]} reactFlowEdges
 * @param {boolean} isNondirected
 */
const constructGraphs = (reactFlowNodes, reactFlowEdges, isNondirected = false) => {
    const nodeDependencies = {};
    const graph = {};
    for (let i = 0; i < reactFlowNodes.length; i += 1) {
        const nodeId = reactFlowNodes[i].id;
        nodeDependencies[nodeId] = 0;
        graph[nodeId] = [];
    }
    for (let i = 0; i < reactFlowEdges.length; i += 1) {
        const source = reactFlowEdges[i].source;
        const target = reactFlowEdges[i].target;
        if (Object.prototype.hasOwnProperty.call(graph, source)) {
            graph[source].push(target);
        }
        else {
            graph[source] = [target];
        }
        if (isNondirected) {
            if (Object.prototype.hasOwnProperty.call(graph, target)) {
                graph[target].push(source);
            }
            else {
                graph[target] = [source];
            }
        }
        nodeDependencies[target] += 1;
    }
    return { graph, nodeDependencies };
};
exports.constructGraphs = constructGraphs;
/**
 * Get starting nodes and check if flow is valid
 * @param {INodeDependencies} graph
 * @param {string} endNodeId
 */
const getStartingNodes = (graph, endNodeId) => {
    const visited = new Set();
    const queue = [[endNodeId, 0]];
    const depthQueue = {
        [endNodeId]: 0
    };
    let maxDepth = 0;
    let startingNodeIds = [];
    while (queue.length > 0) {
        const [currentNode, depth] = queue.shift();
        if (visited.has(currentNode)) {
            continue;
        }
        visited.add(currentNode);
        if (depth > maxDepth) {
            maxDepth = depth;
            startingNodeIds = [currentNode];
        }
        else if (depth === maxDepth) {
            startingNodeIds.push(currentNode);
        }
        for (const neighbor of graph[currentNode]) {
            if (!visited.has(neighbor)) {
                queue.push([neighbor, depth + 1]);
                depthQueue[neighbor] = depth + 1;
            }
        }
    }
    const depthQueueReversed = {};
    for (const nodeId in depthQueue) {
        if (Object.prototype.hasOwnProperty.call(depthQueue, nodeId)) {
            depthQueueReversed[nodeId] = Math.abs(depthQueue[nodeId] - maxDepth);
        }
    }
    return { startingNodeIds, depthQueue: depthQueueReversed };
};
exports.getStartingNodes = getStartingNodes;
/**
 * Get ending node and check if flow is valid
 * @param {INodeDependencies} nodeDependencies
 * @param {INodeDirectedGraph} graph
 */
const getEndingNode = (nodeDependencies, graph) => {
    let endingNodeId = '';
    Object.keys(graph).forEach((nodeId) => {
        if (Object.keys(nodeDependencies).length === 1) {
            endingNodeId = nodeId;
        }
        else if (!graph[nodeId].length && nodeDependencies[nodeId] > 0) {
            endingNodeId = nodeId;
        }
    });
    return endingNodeId;
};
exports.getEndingNode = getEndingNode;
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
const buildLangchain = async (startingNodeIds, reactFlowNodes, graph, depthQueue, componentNodes, question, chatHistory, chatId, chatflowid, appDataSource, overrideConfig, cachePool, isUpsert, stopNodeId) => {
    var _a;
    const flowNodes = (0, lodash_1.cloneDeep)(reactFlowNodes);
    // Create a Queue and add our initial node in it
    const nodeQueue = [];
    const exploredNode = {};
    // In the case of infinite loop, only max 3 loops will be executed
    const maxLoop = 3;
    for (let i = 0; i < startingNodeIds.length; i += 1) {
        nodeQueue.push({ nodeId: startingNodeIds[i], depth: 0 });
        exploredNode[startingNodeIds[i]] = { remainingLoop: maxLoop, lastSeenDepth: 0 };
    }
    while (nodeQueue.length) {
        const { nodeId, depth } = nodeQueue.shift();
        const reactFlowNode = flowNodes.find((nd) => nd.id === nodeId);
        const nodeIndex = flowNodes.findIndex((nd) => nd.id === nodeId);
        if (!reactFlowNode || reactFlowNode === undefined || nodeIndex < 0)
            continue;
        try {
            const nodeInstanceFilePath = componentNodes[reactFlowNode.data.name].filePath;
            const nodeModule = await (_a = nodeInstanceFilePath, Promise.resolve().then(() => __importStar(require(_a))));
            const newNodeInstance = new nodeModule.nodeClass();
            let flowNodeData = (0, lodash_1.cloneDeep)(reactFlowNode.data);
            if (overrideConfig)
                flowNodeData = (0, exports.replaceInputsWithConfig)(flowNodeData, overrideConfig);
            const reactFlowNodeData = (0, exports.resolveVariables)(flowNodeData, flowNodes, question, chatHistory);
            if (isUpsert &&
                ((stopNodeId && reactFlowNodeData.id === stopNodeId) || (!stopNodeId && reactFlowNodeData.category === 'Vector Stores'))) {
                logger_1.default.debug(`[server]: Upserting ${reactFlowNode.data.label} (${reactFlowNode.data.id})`);
                await newNodeInstance.vectorStoreMethods['upsert'].call(newNodeInstance, reactFlowNodeData, {
                    chatId,
                    chatflowid,
                    appDataSource,
                    databaseEntities: exports.databaseEntities,
                    logger: logger_1.default,
                    cachePool
                });
                logger_1.default.debug(`[server]: Finished upserting ${reactFlowNode.data.label} (${reactFlowNode.data.id})`);
                break;
            }
            else {
                logger_1.default.debug(`[server]: Initializing ${reactFlowNode.data.label} (${reactFlowNode.data.id})`);
                flowNodes[nodeIndex].data.instance = await newNodeInstance.init(reactFlowNodeData, question, {
                    chatId,
                    chatflowid,
                    appDataSource,
                    databaseEntities: exports.databaseEntities,
                    logger: logger_1.default,
                    cachePool
                });
                logger_1.default.debug(`[server]: Finished initializing ${reactFlowNode.data.label} (${reactFlowNode.data.id})`);
            }
        }
        catch (e) {
            logger_1.default.error(e);
            throw new Error(e);
        }
        const neighbourNodeIds = graph[nodeId];
        const nextDepth = depth + 1;
        // Find other nodes that are on the same depth level
        const sameDepthNodeIds = Object.keys(depthQueue).filter((key) => depthQueue[key] === nextDepth);
        for (const id of sameDepthNodeIds) {
            if (neighbourNodeIds.includes(id))
                continue;
            neighbourNodeIds.push(id);
        }
        for (let i = 0; i < neighbourNodeIds.length; i += 1) {
            const neighNodeId = neighbourNodeIds[i];
            // If nodeId has been seen, cycle detected
            if (Object.prototype.hasOwnProperty.call(exploredNode, neighNodeId)) {
                const { remainingLoop, lastSeenDepth } = exploredNode[neighNodeId];
                if (lastSeenDepth === nextDepth)
                    continue;
                if (remainingLoop === 0) {
                    break;
                }
                const remainingLoopMinusOne = remainingLoop - 1;
                exploredNode[neighNodeId] = { remainingLoop: remainingLoopMinusOne, lastSeenDepth: nextDepth };
                nodeQueue.push({ nodeId: neighNodeId, depth: nextDepth });
            }
            else {
                exploredNode[neighNodeId] = { remainingLoop: maxLoop, lastSeenDepth: nextDepth };
                nodeQueue.push({ nodeId: neighNodeId, depth: nextDepth });
            }
        }
    }
    return flowNodes;
};
exports.buildLangchain = buildLangchain;
/**
 * Clear all session memories on the canvas
 * @param {IReactFlowNode[]} reactFlowNodes
 * @param {IComponentNodes} componentNodes
 * @param {string} chatId
 * @param {DataSource} appDataSource
 * @param {string} sessionId
 */
const clearAllSessionMemory = async (reactFlowNodes, componentNodes, chatId, appDataSource, sessionId) => {
    var _a;
    for (const node of reactFlowNodes) {
        if (node.data.category !== 'Memory' && node.data.type !== 'OpenAIAssistant')
            continue;
        const nodeInstanceFilePath = componentNodes[node.data.name].filePath;
        const nodeModule = await (_a = nodeInstanceFilePath, Promise.resolve().then(() => __importStar(require(_a))));
        const newNodeInstance = new nodeModule.nodeClass();
        if (sessionId && node.data.inputs) {
            node.data.inputs.sessionId = sessionId;
        }
        if (newNodeInstance.memoryMethods && newNodeInstance.memoryMethods.clearSessionMemory) {
            await newNodeInstance.memoryMethods.clearSessionMemory(node.data, { chatId, appDataSource, databaseEntities: exports.databaseEntities, logger: logger_1.default });
        }
    }
};
exports.clearAllSessionMemory = clearAllSessionMemory;
/**
 * Clear specific session memory from View Message Dialog UI
 * @param {IReactFlowNode[]} reactFlowNodes
 * @param {IComponentNodes} componentNodes
 * @param {string} chatId
 * @param {DataSource} appDataSource
 * @param {string} sessionId
 * @param {string} memoryType
 */
const clearSessionMemoryFromViewMessageDialog = async (reactFlowNodes, componentNodes, chatId, appDataSource, sessionId, memoryType) => {
    var _a;
    if (!sessionId)
        return;
    for (const node of reactFlowNodes) {
        if (node.data.category !== 'Memory' && node.data.type !== 'OpenAIAssistant')
            continue;
        if (memoryType && node.data.label !== memoryType)
            continue;
        const nodeInstanceFilePath = componentNodes[node.data.name].filePath;
        const nodeModule = await (_a = nodeInstanceFilePath, Promise.resolve().then(() => __importStar(require(_a))));
        const newNodeInstance = new nodeModule.nodeClass();
        if (sessionId && node.data.inputs)
            node.data.inputs.sessionId = sessionId;
        if (newNodeInstance.memoryMethods && newNodeInstance.memoryMethods.clearSessionMemory) {
            await newNodeInstance.memoryMethods.clearSessionMemory(node.data, { chatId, appDataSource, databaseEntities: exports.databaseEntities, logger: logger_1.default });
            return;
        }
    }
};
exports.clearSessionMemoryFromViewMessageDialog = clearSessionMemoryFromViewMessageDialog;
/**
 * Get variable value from outputResponses.output
 * @param {string} paramValue
 * @param {IReactFlowNode[]} reactFlowNodes
 * @param {string} question
 * @param {boolean} isAcceptVariable
 * @returns {string}
 */
const getVariableValue = (paramValue, reactFlowNodes, question, chatHistory, isAcceptVariable = false) => {
    let returnVal = paramValue;
    const variableStack = [];
    const variableDict = {};
    let startIdx = 0;
    const endIdx = returnVal.length - 1;
    while (startIdx < endIdx) {
        const substr = returnVal.substring(startIdx, startIdx + 2);
        // Store the opening double curly bracket
        if (substr === '{{') {
            variableStack.push({ substr, startIdx: startIdx + 2 });
        }
        // Found the complete variable
        if (substr === '}}' && variableStack.length > 0 && variableStack[variableStack.length - 1].substr === '{{') {
            const variableStartIdx = variableStack[variableStack.length - 1].startIdx;
            const variableEndIdx = startIdx;
            const variableFullPath = returnVal.substring(variableStartIdx, variableEndIdx);
            /**
             * Apply string transformation to convert special chars:
             * FROM: hello i am ben\n\n\thow are you?
             * TO: hello i am benFLOWISE_NEWLINEFLOWISE_NEWLINEFLOWISE_TABhow are you?
             */
            if (isAcceptVariable && variableFullPath === QUESTION_VAR_PREFIX) {
                variableDict[`{{${variableFullPath}}}`] = (0, flowise_components_1.handleEscapeCharacters)(question, false);
            }
            if (isAcceptVariable && variableFullPath === CHAT_HISTORY_VAR_PREFIX) {
                variableDict[`{{${variableFullPath}}}`] = (0, flowise_components_1.handleEscapeCharacters)(typeof chatHistory === 'string' ? chatHistory : (0, flowise_components_1.convertChatHistoryToText)(chatHistory), false);
            }
            // Split by first occurrence of '.' to get just nodeId
            const [variableNodeId, _] = variableFullPath.split('.');
            const executedNode = reactFlowNodes.find((nd) => nd.id === variableNodeId);
            if (executedNode) {
                const variableValue = (0, lodash_1.get)(executedNode.data, 'instance');
                if (isAcceptVariable) {
                    variableDict[`{{${variableFullPath}}}`] = variableValue;
                }
                else {
                    returnVal = variableValue;
                }
            }
            variableStack.pop();
        }
        startIdx += 1;
    }
    if (isAcceptVariable) {
        const variablePaths = Object.keys(variableDict);
        variablePaths.sort(); // Sort by length of variable path because longer path could possibly contains nested variable
        variablePaths.forEach((path) => {
            const variableValue = variableDict[path];
            // Replace all occurrence
            returnVal = returnVal.split(path).join(variableValue);
        });
        return returnVal;
    }
    return returnVal;
};
exports.getVariableValue = getVariableValue;
/**
 * Loop through each inputs and resolve variable if neccessary
 * @param {INodeData} reactFlowNodeData
 * @param {IReactFlowNode[]} reactFlowNodes
 * @param {string} question
 * @returns {INodeData}
 */
const resolveVariables = (reactFlowNodeData, reactFlowNodes, question, chatHistory) => {
    var _a;
    let flowNodeData = (0, lodash_1.cloneDeep)(reactFlowNodeData);
    const types = 'inputs';
    const getParamValues = (paramsObj) => {
        var _a, _b;
        for (const key in paramsObj) {
            const paramValue = paramsObj[key];
            if (Array.isArray(paramValue)) {
                const resolvedInstances = [];
                for (const param of paramValue) {
                    const resolvedInstance = (0, exports.getVariableValue)(param, reactFlowNodes, question, chatHistory);
                    resolvedInstances.push(resolvedInstance);
                }
                paramsObj[key] = resolvedInstances;
            }
            else {
                const isAcceptVariable = (_b = (_a = reactFlowNodeData.inputParams.find((param) => param.name === key)) === null || _a === void 0 ? void 0 : _a.acceptVariable) !== null && _b !== void 0 ? _b : false;
                const resolvedInstance = (0, exports.getVariableValue)(paramValue, reactFlowNodes, question, chatHistory, isAcceptVariable);
                paramsObj[key] = resolvedInstance;
            }
        }
    };
    const paramsObj = (_a = flowNodeData[types]) !== null && _a !== void 0 ? _a : {};
    getParamValues(paramsObj);
    return flowNodeData;
};
exports.resolveVariables = resolveVariables;
/**
 * Loop through each inputs and replace their value with override config values
 * @param {INodeData} flowNodeData
 * @param {ICommonObject} overrideConfig
 * @returns {INodeData}
 */
const replaceInputsWithConfig = (flowNodeData, overrideConfig) => {
    var _a;
    const types = 'inputs';
    const getParamValues = (paramsObj) => {
        var _a;
        for (const config in overrideConfig) {
            // If overrideConfig[key] is object
            if (overrideConfig[config] && typeof overrideConfig[config] === 'object') {
                const nodeIds = Object.keys(overrideConfig[config]);
                if (nodeIds.includes(flowNodeData.id)) {
                    paramsObj[config] = overrideConfig[config][flowNodeData.id];
                    continue;
                }
            }
            let paramValue = (_a = overrideConfig[config]) !== null && _a !== void 0 ? _a : paramsObj[config];
            // Check if boolean
            if (paramValue === 'true')
                paramValue = true;
            else if (paramValue === 'false')
                paramValue = false;
            paramsObj[config] = paramValue;
        }
    };
    const paramsObj = (_a = flowNodeData[types]) !== null && _a !== void 0 ? _a : {};
    getParamValues(paramsObj);
    return flowNodeData;
};
exports.replaceInputsWithConfig = replaceInputsWithConfig;
/**
 * Rebuild flow if LLMChain has dependency on other chains
 * User Question => Prompt_0 => LLMChain_0 => Prompt-1 => LLMChain_1
 * @param {IReactFlowNode[]} startingNodes
 * @returns {boolean}
 */
const isStartNodeDependOnInput = (startingNodes, nodes) => {
    var _a;
    for (const node of startingNodes) {
        if (node.data.category === 'Cache')
            return true;
        for (const inputName in node.data.inputs) {
            const inputVariables = (0, flowise_components_1.getInputVariables)(node.data.inputs[inputName]);
            if (inputVariables.length > 0)
                return true;
        }
    }
    const whitelistNodeNames = ['vectorStoreToDocument', 'autoGPT', 'chatPromptTemplate', 'promptTemplate']; //If these nodes are found, chatflow cannot be reused
    for (const node of nodes) {
        if (node.data.name === 'chatPromptTemplate' || node.data.name === 'promptTemplate') {
            let promptValues = {};
            const promptValuesRaw = (_a = node.data.inputs) === null || _a === void 0 ? void 0 : _a.promptValues;
            if (promptValuesRaw) {
                try {
                    promptValues = typeof promptValuesRaw === 'object' ? promptValuesRaw : JSON.parse(promptValuesRaw);
                }
                catch (exception) {
                    console.error(exception);
                }
            }
            if ((0, exports.getAllValuesFromJson)(promptValues).includes(`{{${QUESTION_VAR_PREFIX}}}`))
                return true;
        }
        else if (whitelistNodeNames.includes(node.data.name))
            return true;
    }
    return false;
};
exports.isStartNodeDependOnInput = isStartNodeDependOnInput;
/**
 * Rebuild flow if new override config is provided
 * @param {boolean} isInternal
 * @param {ICommonObject} existingOverrideConfig
 * @param {ICommonObject} newOverrideConfig
 * @returns {boolean}
 */
const isSameOverrideConfig = (isInternal, existingOverrideConfig, newOverrideConfig) => {
    if (isInternal) {
        if (existingOverrideConfig && Object.keys(existingOverrideConfig).length)
            return false;
        return true;
    }
    // If existing and new overrideconfig are the same
    if (existingOverrideConfig &&
        Object.keys(existingOverrideConfig).length &&
        newOverrideConfig &&
        Object.keys(newOverrideConfig).length &&
        (0, lodash_1.isEqual)(existingOverrideConfig, newOverrideConfig)) {
        return true;
    }
    // If there is no existing and new overrideconfig
    if (!existingOverrideConfig && !newOverrideConfig)
        return true;
    return false;
};
exports.isSameOverrideConfig = isSameOverrideConfig;
/**
 * Map MimeType to InputField
 * @param {string} mimeType
 * @returns {Promise<string>}
 */
const mapMimeTypeToInputField = (mimeType) => {
    switch (mimeType) {
        case 'text/plain':
            return 'txtFile';
        case 'application/pdf':
            return 'pdfFile';
        case 'application/json':
            return 'jsonFile';
        case 'text/csv':
            return 'csvFile';
        case 'application/json-lines':
        case 'application/jsonl':
        case 'text/jsonl':
            return 'jsonlinesFile';
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            return 'docxFile';
        case 'application/vnd.yaml':
        case 'application/x-yaml':
        case 'text/vnd.yaml':
        case 'text/x-yaml':
        case 'text/yaml':
            return 'yamlFile';
        default:
            return '';
    }
};
exports.mapMimeTypeToInputField = mapMimeTypeToInputField;
/**
 * Find all available input params config
 * @param {IReactFlowNode[]} reactFlowNodes
 * @param {IComponentCredentials} componentCredentials
 * @returns {IOverrideConfig[]}
 */
const findAvailableConfigs = (reactFlowNodes, componentCredentials) => {
    var _a, _b, _c, _d, _e;
    const configs = [];
    for (const flowNode of reactFlowNodes) {
        for (const inputParam of flowNode.data.inputParams) {
            let obj;
            if (inputParam.type === 'file') {
                obj = {
                    node: flowNode.data.label,
                    nodeId: flowNode.data.id,
                    label: inputParam.label,
                    name: 'files',
                    type: (_a = inputParam.fileType) !== null && _a !== void 0 ? _a : inputParam.type
                };
            }
            else if (inputParam.type === 'options') {
                obj = {
                    node: flowNode.data.label,
                    nodeId: flowNode.data.id,
                    label: inputParam.label,
                    name: inputParam.name,
                    type: inputParam.options
                        ? (_b = inputParam.options) === null || _b === void 0 ? void 0 : _b.map((option) => {
                            return option.name;
                        }).join(', ')
                        : 'string'
                };
            }
            else if (inputParam.type === 'credential') {
                // get component credential inputs
                for (const name of (_c = inputParam.credentialNames) !== null && _c !== void 0 ? _c : []) {
                    if (Object.prototype.hasOwnProperty.call(componentCredentials, name)) {
                        const inputs = (_e = (_d = componentCredentials[name]) === null || _d === void 0 ? void 0 : _d.inputs) !== null && _e !== void 0 ? _e : [];
                        for (const input of inputs) {
                            obj = {
                                node: flowNode.data.label,
                                nodeId: flowNode.data.id,
                                label: input.label,
                                name: input.name,
                                type: input.type === 'password' ? 'string' : input.type
                            };
                            configs.push(obj);
                        }
                    }
                }
                continue;
            }
            else {
                obj = {
                    node: flowNode.data.label,
                    nodeId: flowNode.data.id,
                    label: inputParam.label,
                    name: inputParam.name,
                    type: inputParam.type === 'password' ? 'string' : inputParam.type
                };
            }
            if (!configs.some((config) => JSON.stringify(config) === JSON.stringify(obj))) {
                configs.push(obj);
            }
        }
    }
    return configs;
};
exports.findAvailableConfigs = findAvailableConfigs;
/**
 * Check to see if flow valid for stream
 * @param {IReactFlowNode[]} reactFlowNodes
 * @param {INodeData} endingNodeData
 * @returns {boolean}
 */
const isFlowValidForStream = (reactFlowNodes, endingNodeData) => {
    const streamAvailableLLMs = {
        'Chat Models': ['azureChatOpenAI', 'chatOpenAI', 'chatAnthropic', 'chatOllama', 'awsChatBedrock'],
        LLMs: ['azureOpenAI', 'openAI', 'ollama']
    };
    let isChatOrLLMsExist = false;
    for (const flowNode of reactFlowNodes) {
        const data = flowNode.data;
        if (data.category === 'Chat Models' || data.category === 'LLMs') {
            isChatOrLLMsExist = true;
            const validLLMs = streamAvailableLLMs[data.category];
            if (!validLLMs.includes(data.name))
                return false;
        }
    }
    let isValidChainOrAgent = false;
    if (endingNodeData.category === 'Chains') {
        // Chains that are not available to stream
        const blacklistChains = ['openApiChain', 'vectaraQAChain'];
        isValidChainOrAgent = !blacklistChains.includes(endingNodeData.name);
    }
    else if (endingNodeData.category === 'Agents') {
        // Agent that are available to stream
        const whitelistAgents = ['openAIFunctionAgent', 'csvAgent', 'airtableAgent', 'conversationalRetrievalAgent'];
        isValidChainOrAgent = whitelistAgents.includes(endingNodeData.name);
    }
    // If no output parser, flow is available to stream
    let isOutputParserExist = false;
    for (const flowNode of reactFlowNodes) {
        const data = flowNode.data;
        if (data.category.includes('Output Parser')) {
            isOutputParserExist = true;
        }
    }
    return isChatOrLLMsExist && isValidChainOrAgent && !isOutputParserExist;
};
exports.isFlowValidForStream = isFlowValidForStream;
/**
 * Returns the path of encryption key
 * @returns {string}
 */
const getEncryptionKeyPath = () => {
    return process.env.SECRETKEY_PATH
        ? path_1.default.join(process.env.SECRETKEY_PATH, 'encryption.key')
        : path_1.default.join(__dirname, '..', '..', 'encryption.key');
};
exports.getEncryptionKeyPath = getEncryptionKeyPath;
/**
 * Generate an encryption key
 * @returns {string}
 */
const generateEncryptKey = () => {
    return (0, crypto_1.randomBytes)(24).toString('base64');
};
exports.generateEncryptKey = generateEncryptKey;
/**
 * Returns the encryption key
 * @returns {Promise<string>}
 */
const getEncryptionKey = async () => {
    if (process.env.FLOWISE_SECRETKEY_OVERWRITE !== undefined && process.env.FLOWISE_SECRETKEY_OVERWRITE !== '') {
        return process.env.FLOWISE_SECRETKEY_OVERWRITE;
    }
    try {
        return await fs_1.default.promises.readFile((0, exports.getEncryptionKeyPath)(), 'utf8');
    }
    catch (error) {
        const encryptKey = (0, exports.generateEncryptKey)();
        await fs_1.default.promises.writeFile((0, exports.getEncryptionKeyPath)(), encryptKey);
        return encryptKey;
    }
};
exports.getEncryptionKey = getEncryptionKey;
/**
 * Encrypt credential data
 * @param {ICredentialDataDecrypted} plainDataObj
 * @returns {Promise<string>}
 */
const encryptCredentialData = async (plainDataObj) => {
    const encryptKey = await (0, exports.getEncryptionKey)();
    return crypto_js_1.AES.encrypt(JSON.stringify(plainDataObj), encryptKey).toString();
};
exports.encryptCredentialData = encryptCredentialData;
/**
 * Decrypt credential data
 * @param {string} encryptedData
 * @param {string} componentCredentialName
 * @param {IComponentCredentials} componentCredentials
 * @returns {Promise<ICredentialDataDecrypted>}
 */
const decryptCredentialData = async (encryptedData, componentCredentialName, componentCredentials) => {
    const encryptKey = await (0, exports.getEncryptionKey)();
    const decryptedData = crypto_js_1.AES.decrypt(encryptedData, encryptKey);
    const decryptedDataStr = decryptedData.toString(crypto_js_1.enc.Utf8);
    if (!decryptedDataStr)
        return {};
    try {
        if (componentCredentialName && componentCredentials) {
            const plainDataObj = JSON.parse(decryptedData.toString(crypto_js_1.enc.Utf8));
            return (0, exports.redactCredentialWithPasswordType)(componentCredentialName, plainDataObj, componentCredentials);
        }
        return JSON.parse(decryptedData.toString(crypto_js_1.enc.Utf8));
    }
    catch (e) {
        console.error(e);
        return {};
    }
};
exports.decryptCredentialData = decryptCredentialData;
/**
 * Transform ICredentialBody from req to Credential entity
 * @param {ICredentialReqBody} body
 * @returns {Credential}
 */
const transformToCredentialEntity = async (body) => {
    const credentialBody = {
        name: body.name,
        credentialName: body.credentialName
    };
    if (body.plainDataObj) {
        const encryptedData = await (0, exports.encryptCredentialData)(body.plainDataObj);
        credentialBody.encryptedData = encryptedData;
    }
    const newCredential = new Credential_1.Credential();
    Object.assign(newCredential, credentialBody);
    return newCredential;
};
exports.transformToCredentialEntity = transformToCredentialEntity;
/**
 * Redact values that are of password type to avoid sending back to client
 * @param {string} componentCredentialName
 * @param {ICredentialDataDecrypted} decryptedCredentialObj
 * @param {IComponentCredentials} componentCredentials
 * @returns {ICredentialDataDecrypted}
 */
const redactCredentialWithPasswordType = (componentCredentialName, decryptedCredentialObj, componentCredentials) => {
    var _a;
    const plainDataObj = (0, lodash_1.cloneDeep)(decryptedCredentialObj);
    for (const cred in plainDataObj) {
        const inputParam = (_a = componentCredentials[componentCredentialName].inputs) === null || _a === void 0 ? void 0 : _a.find((inp) => inp.type === 'password' && inp.name === cred);
        if (inputParam) {
            plainDataObj[cred] = REDACTED_CREDENTIAL_VALUE;
        }
    }
    return plainDataObj;
};
exports.redactCredentialWithPasswordType = redactCredentialWithPasswordType;
/**
 * Replace sessionId with new chatId
 * Ex: after clear chat history, use the new chatId as sessionId
 * @param {any} instance
 * @param {string} chatId
 */
const checkMemorySessionId = (instance, chatId) => {
    if (instance.memory && instance.memory.isSessionIdUsingChatMessageId && chatId) {
        instance.memory.sessionId = chatId;
        instance.memory.chatHistory.sessionId = chatId;
    }
    if (instance.memory && instance.memory.sessionId)
        return instance.memory.sessionId;
    else if (instance.memory && instance.memory.chatHistory && instance.memory.chatHistory.sessionId)
        return instance.memory.chatHistory.sessionId;
    return undefined;
};
exports.checkMemorySessionId = checkMemorySessionId;
/**
 * Replace chatHistory if incomingInput.history is empty and sessionId/chatId is provided
 * @param {IReactFlowNode} memoryNode
 * @param {IncomingInput} incomingInput
 * @param {DataSource} appDataSource
 * @param {IDatabaseEntity} databaseEntities
 * @param {any} logger
 * @returns {string}
 */
const replaceChatHistory = async (memoryNode, incomingInput, appDataSource, databaseEntities, logger) => {
    var _a;
    var _b;
    const nodeInstanceFilePath = memoryNode.data.filePath;
    const nodeModule = await (_a = nodeInstanceFilePath, Promise.resolve().then(() => __importStar(require(_a))));
    const newNodeInstance = new nodeModule.nodeClass();
    if (((_b = incomingInput.overrideConfig) === null || _b === void 0 ? void 0 : _b.sessionId) && memoryNode.data.inputs) {
        memoryNode.data.inputs.sessionId = incomingInput.overrideConfig.sessionId;
    }
    if (newNodeInstance.memoryMethods && newNodeInstance.memoryMethods.getChatMessages) {
        return await newNodeInstance.memoryMethods.getChatMessages(memoryNode.data, {
            chatId: incomingInput.chatId,
            appDataSource,
            databaseEntities,
            logger
        });
    }
    return '';
};
exports.replaceChatHistory = replaceChatHistory;
/**
 * Get all values from a JSON object
 * @param {any} obj
 * @returns {any[]}
 */
const getAllValuesFromJson = (obj) => {
    const values = [];
    function extractValues(data) {
        if (typeof data === 'object' && data !== null) {
            if (Array.isArray(data)) {
                for (const item of data) {
                    extractValues(item);
                }
            }
            else {
                for (const key in data) {
                    extractValues(data[key]);
                }
            }
        }
        else {
            values.push(data);
        }
    }
    extractValues(obj);
    return values;
};
exports.getAllValuesFromJson = getAllValuesFromJson;
//# sourceMappingURL=index.js.map