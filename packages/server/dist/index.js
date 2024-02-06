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
exports.getInstance = exports.start = exports.getAllChatFlow = exports.getChatId = exports.App = void 0;
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const fs = __importStar(require("fs"));
const express_basic_auth_1 = __importDefault(require("express-basic-auth"));
const socket_io_1 = require("socket.io");
const logger_1 = __importDefault(require("./utils/logger"));
const logger_2 = require("./utils/logger");
const uuid_1 = require("uuid");
const openai_1 = __importDefault(require("openai"));
const typeorm_1 = require("typeorm");
const Interface_1 = require("./Interface");
const utils_1 = require("./utils");
const lodash_1 = require("lodash");
const DataSource_1 = require("./DataSource");
const NodesPool_1 = require("./NodesPool");
const ChatFlow_1 = require("./database/entities/ChatFlow");
const ChatMessage_1 = require("./database/entities/ChatMessage");
const Credential_1 = require("./database/entities/Credential");
const Tool_1 = require("./database/entities/Tool");
const Assistant_1 = require("./database/entities/Assistant");
const ChatflowPool_1 = require("./ChatflowPool");
const CachePool_1 = require("./CachePool");
const rateLimit_1 = require("./utils/rateLimit");
const apiKey_1 = require("./utils/apiKey");
const XSS_1 = require("./utils/XSS");
const axios_1 = __importDefault(require("axios"));
const langchainhub_1 = require("langchainhub");
const hub_1 = require("./utils/hub");
class App {
    constructor() {
        this.AppDataSource = (0, DataSource_1.getDataSource)();
        this.app = (0, express_1.default)();
    }
    async initDatabase() {
        // Initialize database
        this.AppDataSource.initialize()
            .then(async () => {
            logger_1.default.info('📦 [server]: Data Source has been initialized!');
            // Run Migrations Scripts
            await this.AppDataSource.runMigrations({ transaction: 'each' });
            // Initialize nodes pool
            this.nodesPool = new NodesPool_1.NodesPool();
            await this.nodesPool.initialize();
            // Initialize chatflow pool
            this.chatflowPool = new ChatflowPool_1.ChatflowPool();
            // Initialize API keys
            await (0, apiKey_1.getAPIKeys)();
            // Initialize encryption key
            await (0, utils_1.getEncryptionKey)();
            // Initialize Rate Limit
            const AllChatFlow = await getAllChatFlow();
            await (0, rateLimit_1.initializeRateLimiter)(AllChatFlow);
            // Initialize cache pool
            this.cachePool = new CachePool_1.CachePool();
        })
            .catch((err) => {
            logger_1.default.error('❌ [server]: Error during Data Source initialization:', err);
        });
    }
    async config(socketIO) {
        // Limit is needed to allow sending/receiving base64 encoded string
        this.app.use(express_1.default.json({ limit: '50mb' }));
        this.app.use(express_1.default.urlencoded({ limit: '50mb', extended: true }));
        if (process.env.NUMBER_OF_PROXIES && parseInt(process.env.NUMBER_OF_PROXIES) > 0)
            this.app.set('trust proxy', parseInt(process.env.NUMBER_OF_PROXIES));
        // Allow access from *
        this.app.use((0, cors_1.default)());
        // Switch off the default 'X-Powered-By: Express' header
        this.app.disable('x-powered-by');
        // Add the expressRequestLogger middleware to log all requests
        this.app.use(logger_2.expressRequestLogger);
        // Add the sanitizeMiddleware to guard against XSS
        this.app.use(XSS_1.sanitizeMiddleware);
        if (process.env.FLOWISE_USERNAME && process.env.FLOWISE_PASSWORD) {
            const username = process.env.FLOWISE_USERNAME;
            const password = process.env.FLOWISE_PASSWORD;
            const basicAuthMiddleware = (0, express_basic_auth_1.default)({
                users: { [username]: password }
            });
            const whitelistURLs = [
                '/api/v1/verify/apikey/',
                '/api/v1/chatflows/apikey/',
                '/api/v1/public-chatflows',
                '/api/v1/public-chatbotConfig',
                '/api/v1/prediction/',
                '/api/v1/vector/upsert/',
                '/api/v1/node-icon/',
                '/api/v1/components-credentials-icon/',
                '/api/v1/chatflows-streaming',
                '/api/v1/openai-assistants-file',
                '/api/v1/ip'
            ];
            this.app.use((req, res, next) => {
                if (req.url.includes('/api/v1/')) {
                    whitelistURLs.some((url) => req.url.includes(url)) ? next() : basicAuthMiddleware(req, res, next);
                }
                else
                    next();
            });
        }
        const upload = (0, multer_1.default)({ dest: `${path_1.default.join(__dirname, '..', 'uploads')}/` });
        // ----------------------------------------
        // Configure number of proxies in Host Environment
        // ----------------------------------------
        this.app.get('/api/v1/ip', (request, response) => {
            response.send({
                ip: request.ip,
                msg: 'See the returned IP address in the response. If it matches your current IP address ( which you can get by going to http://ip.nfriedly.com/ or https://api.ipify.org/ ), then the number of proxies is correct and the rate limiter should now work correctly. If not, increase the number of proxies by 1 until the IP address matches your own. Visit https://docs.flowiseai.com/deployment#rate-limit-setup-guide for more information.'
            });
        });
        // ----------------------------------------
        // Components
        // ----------------------------------------
        // Get all component nodes
        this.app.get('/api/v1/nodes', (req, res) => {
            const returnData = [];
            for (const nodeName in this.nodesPool.componentNodes) {
                const clonedNode = (0, lodash_1.cloneDeep)(this.nodesPool.componentNodes[nodeName]);
                returnData.push(clonedNode);
            }
            return res.json(returnData);
        });
        // Get all component credentials
        this.app.get('/api/v1/components-credentials', async (req, res) => {
            const returnData = [];
            for (const credName in this.nodesPool.componentCredentials) {
                const clonedCred = (0, lodash_1.cloneDeep)(this.nodesPool.componentCredentials[credName]);
                returnData.push(clonedCred);
            }
            return res.json(returnData);
        });
        // Get specific component node via name
        this.app.get('/api/v1/nodes/:name', (req, res) => {
            if (Object.prototype.hasOwnProperty.call(this.nodesPool.componentNodes, req.params.name)) {
                return res.json(this.nodesPool.componentNodes[req.params.name]);
            }
            else {
                throw new Error(`Node ${req.params.name} not found`);
            }
        });
        // Get component credential via name
        this.app.get('/api/v1/components-credentials/:name', (req, res) => {
            if (!req.params.name.includes('&amp;')) {
                if (Object.prototype.hasOwnProperty.call(this.nodesPool.componentCredentials, req.params.name)) {
                    return res.json(this.nodesPool.componentCredentials[req.params.name]);
                }
                else {
                    throw new Error(`Credential ${req.params.name} not found`);
                }
            }
            else {
                const returnResponse = [];
                for (const name of req.params.name.split('&amp;')) {
                    if (Object.prototype.hasOwnProperty.call(this.nodesPool.componentCredentials, name)) {
                        returnResponse.push(this.nodesPool.componentCredentials[name]);
                    }
                    else {
                        throw new Error(`Credential ${name} not found`);
                    }
                }
                return res.json(returnResponse);
            }
        });
        // Returns specific component node icon via name
        this.app.get('/api/v1/node-icon/:name', (req, res) => {
            if (Object.prototype.hasOwnProperty.call(this.nodesPool.componentNodes, req.params.name)) {
                const nodeInstance = this.nodesPool.componentNodes[req.params.name];
                if (nodeInstance.icon === undefined) {
                    throw new Error(`Node ${req.params.name} icon not found`);
                }
                if (nodeInstance.icon.endsWith('.svg') || nodeInstance.icon.endsWith('.png') || nodeInstance.icon.endsWith('.jpg')) {
                    const filepath = nodeInstance.icon;
                    res.sendFile(filepath);
                }
                else {
                    throw new Error(`Node ${req.params.name} icon is missing icon`);
                }
            }
            else {
                throw new Error(`Node ${req.params.name} not found`);
            }
        });
        // Returns specific component credential icon via name
        this.app.get('/api/v1/components-credentials-icon/:name', (req, res) => {
            if (Object.prototype.hasOwnProperty.call(this.nodesPool.componentCredentials, req.params.name)) {
                const credInstance = this.nodesPool.componentCredentials[req.params.name];
                if (credInstance.icon === undefined) {
                    throw new Error(`Credential ${req.params.name} icon not found`);
                }
                if (credInstance.icon.endsWith('.svg') || credInstance.icon.endsWith('.png') || credInstance.icon.endsWith('.jpg')) {
                    const filepath = credInstance.icon;
                    res.sendFile(filepath);
                }
                else {
                    throw new Error(`Credential ${req.params.name} icon is missing icon`);
                }
            }
            else {
                throw new Error(`Credential ${req.params.name} not found`);
            }
        });
        // load async options
        this.app.post('/api/v1/node-load-method/:name', async (req, res) => {
            const nodeData = req.body;
            if (Object.prototype.hasOwnProperty.call(this.nodesPool.componentNodes, req.params.name)) {
                try {
                    const nodeInstance = this.nodesPool.componentNodes[req.params.name];
                    const methodName = nodeData.loadMethod || '';
                    const returnOptions = await nodeInstance.loadMethods[methodName].call(nodeInstance, nodeData, {
                        appDataSource: this.AppDataSource,
                        databaseEntities: utils_1.databaseEntities
                    });
                    return res.json(returnOptions);
                }
                catch (error) {
                    return res.json([]);
                }
            }
            else {
                res.status(404).send(`Node ${req.params.name} not found`);
                return;
            }
        });
        // ----------------------------------------
        // Chatflows
        // ----------------------------------------
        // Get all chatflows
        this.app.get('/api/v1/chatflows', async (req, res) => {
            const chatflows = await getAllChatFlow();
            return res.json(chatflows);
        });
        // Get specific chatflow via api key
        this.app.get('/api/v1/chatflows/apikey/:apiKey', async (req, res) => {
            try {
                const apiKey = await (0, apiKey_1.getApiKey)(req.params.apiKey);
                if (!apiKey)
                    return res.status(401).send('Unauthorized');
                const chatflows = await this.AppDataSource.getRepository(ChatFlow_1.ChatFlow)
                    .createQueryBuilder('cf')
                    .where('cf.apikeyid = :apikeyid', { apikeyid: apiKey.id })
                    .orWhere('cf.apikeyid IS NULL')
                    .orWhere('cf.apikeyid = ""')
                    .orderBy('cf.name', 'ASC')
                    .getMany();
                if (chatflows.length >= 1)
                    return res.status(200).send(chatflows);
                return res.status(404).send('Chatflow not found');
            }
            catch (err) {
                return res.status(500).send(err === null || err === void 0 ? void 0 : err.message);
            }
        });
        // Get specific chatflow via id
        this.app.get('/api/v1/chatflows/:id', async (req, res) => {
            const chatflow = await this.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOneBy({
                id: req.params.id
            });
            if (chatflow)
                return res.json(chatflow);
            return res.status(404).send(`Chatflow ${req.params.id} not found`);
        });
        // Get specific chatflow via id (PUBLIC endpoint, used when sharing chatbot link)
        this.app.get('/api/v1/public-chatflows/:id', async (req, res) => {
            const chatflow = await this.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOneBy({
                id: req.params.id
            });
            if (chatflow && chatflow.isPublic)
                return res.json(chatflow);
            else if (chatflow && !chatflow.isPublic)
                return res.status(401).send(`Unauthorized`);
            return res.status(404).send(`Chatflow ${req.params.id} not found`);
        });
        // Get specific chatflow chatbotConfig via id (PUBLIC endpoint, used to retrieve config for embedded chat)
        // Safe as public endpoint as chatbotConfig doesn't contain sensitive credential
        this.app.get('/api/v1/public-chatbotConfig/:id', async (req, res) => {
            const chatflow = await this.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOneBy({
                id: req.params.id
            });
            if (chatflow && chatflow.chatbotConfig) {
                try {
                    const parsedConfig = JSON.parse(chatflow.chatbotConfig);
                    return res.json(parsedConfig);
                }
                catch (e) {
                    return res.status(500).send(`Error parsing Chatbot Config for Chatflow ${req.params.id}`);
                }
            }
            return res.status(404).send(`Chatbot Config for Chatflow ${req.params.id} not found`);
        });
        // Save chatflow
        this.app.post('/api/v1/chatflows', async (req, res) => {
            const body = req.body;
            const newChatFlow = new ChatFlow_1.ChatFlow();
            Object.assign(newChatFlow, body);
            const chatflow = this.AppDataSource.getRepository(ChatFlow_1.ChatFlow).create(newChatFlow);
            const results = await this.AppDataSource.getRepository(ChatFlow_1.ChatFlow).save(chatflow);
            return res.json(results);
        });
        // Update chatflow
        this.app.put('/api/v1/chatflows/:id', async (req, res) => {
            const chatflow = await this.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOneBy({
                id: req.params.id
            });
            if (!chatflow) {
                res.status(404).send(`Chatflow ${req.params.id} not found`);
                return;
            }
            const body = req.body;
            const updateChatFlow = new ChatFlow_1.ChatFlow();
            Object.assign(updateChatFlow, body);
            updateChatFlow.id = chatflow.id;
            (0, rateLimit_1.createRateLimiter)(updateChatFlow);
            this.AppDataSource.getRepository(ChatFlow_1.ChatFlow).merge(chatflow, updateChatFlow);
            const result = await this.AppDataSource.getRepository(ChatFlow_1.ChatFlow).save(chatflow);
            // chatFlowPool is initialized only when a flow is opened
            // if the user attempts to rename/update category without opening any flow, chatFlowPool will be undefined
            if (this.chatflowPool) {
                // Update chatflowpool inSync to false, to build Langchain again because data has been changed
                this.chatflowPool.updateInSync(chatflow.id, false);
            }
            return res.json(result);
        });
        // Delete chatflow via id
        this.app.delete('/api/v1/chatflows/:id', async (req, res) => {
            const results = await this.AppDataSource.getRepository(ChatFlow_1.ChatFlow).delete({ id: req.params.id });
            return res.json(results);
        });
        // Check if chatflow valid for streaming
        this.app.get('/api/v1/chatflows-streaming/:id', async (req, res) => {
            var _a;
            const chatflow = await this.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOneBy({
                id: req.params.id
            });
            if (!chatflow)
                return res.status(404).send(`Chatflow ${req.params.id} not found`);
            /*** Get Ending Node with Directed Graph  ***/
            const flowData = chatflow.flowData;
            const parsedFlowData = JSON.parse(flowData);
            const nodes = parsedFlowData.nodes;
            const edges = parsedFlowData.edges;
            const { graph, nodeDependencies } = (0, utils_1.constructGraphs)(nodes, edges);
            const endingNodeId = (0, utils_1.getEndingNode)(nodeDependencies, graph);
            if (!endingNodeId)
                return res.status(500).send(`Ending node ${endingNodeId} not found`);
            const endingNodeData = (_a = nodes.find((nd) => nd.id === endingNodeId)) === null || _a === void 0 ? void 0 : _a.data;
            if (!endingNodeData)
                return res.status(500).send(`Ending node ${endingNodeId} data not found`);
            if (endingNodeData && endingNodeData.category !== 'Chains' && endingNodeData.category !== 'Agents') {
                return res.status(500).send(`Ending node must be either a Chain or Agent`);
            }
            const obj = {
                isStreaming: (0, utils_1.isFlowValidForStream)(nodes, endingNodeData)
            };
            return res.json(obj);
        });
        // ----------------------------------------
        // ChatMessage
        // ----------------------------------------
        // Get all chatmessages from chatflowid
        this.app.get('/api/v1/chatmessage/:id', async (req, res) => {
            var _a, _b, _c, _d, _e, _f, _g;
            const sortOrder = (_a = req.query) === null || _a === void 0 ? void 0 : _a.order;
            const chatId = (_b = req.query) === null || _b === void 0 ? void 0 : _b.chatId;
            const memoryType = (_c = req.query) === null || _c === void 0 ? void 0 : _c.memoryType;
            const sessionId = (_d = req.query) === null || _d === void 0 ? void 0 : _d.sessionId;
            const startDate = (_e = req.query) === null || _e === void 0 ? void 0 : _e.startDate;
            const endDate = (_f = req.query) === null || _f === void 0 ? void 0 : _f.endDate;
            let chatTypeFilter = (_g = req.query) === null || _g === void 0 ? void 0 : _g.chatType;
            if (chatTypeFilter) {
                try {
                    const chatTypeFilterArray = JSON.parse(chatTypeFilter);
                    if (chatTypeFilterArray.includes(Interface_1.chatType.EXTERNAL) && chatTypeFilterArray.includes(Interface_1.chatType.INTERNAL)) {
                        chatTypeFilter = undefined;
                    }
                    else if (chatTypeFilterArray.includes(Interface_1.chatType.EXTERNAL)) {
                        chatTypeFilter = Interface_1.chatType.EXTERNAL;
                    }
                    else if (chatTypeFilterArray.includes(Interface_1.chatType.INTERNAL)) {
                        chatTypeFilter = Interface_1.chatType.INTERNAL;
                    }
                }
                catch (e) {
                    return res.status(500).send(e);
                }
            }
            const chatmessages = await this.getChatMessage(req.params.id, chatTypeFilter, sortOrder, chatId, memoryType, sessionId, startDate, endDate);
            return res.json(chatmessages);
        });
        // Get internal chatmessages from chatflowid
        this.app.get('/api/v1/internal-chatmessage/:id', async (req, res) => {
            const chatmessages = await this.getChatMessage(req.params.id, Interface_1.chatType.INTERNAL);
            return res.json(chatmessages);
        });
        // Add chatmessages for chatflowid
        this.app.post('/api/v1/chatmessage/:id', async (req, res) => {
            const body = req.body;
            const results = await this.addChatMessage(body);
            return res.json(results);
        });
        // Delete all chatmessages from chatId
        this.app.delete('/api/v1/chatmessage/:id', async (req, res) => {
            var _a, _b, _c, _d, _e, _f;
            const chatflowid = req.params.id;
            const chatflow = await this.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOneBy({
                id: chatflowid
            });
            if (!chatflow) {
                res.status(404).send(`Chatflow ${chatflowid} not found`);
                return;
            }
            const chatId = (_b = (_a = req.query) === null || _a === void 0 ? void 0 : _a.chatId) !== null && _b !== void 0 ? _b : (await getChatId(chatflowid));
            const memoryType = (_c = req.query) === null || _c === void 0 ? void 0 : _c.memoryType;
            const sessionId = (_d = req.query) === null || _d === void 0 ? void 0 : _d.sessionId;
            const chatType = (_e = req.query) === null || _e === void 0 ? void 0 : _e.chatType;
            const isClearFromViewMessageDialog = (_f = req.query) === null || _f === void 0 ? void 0 : _f.isClearFromViewMessageDialog;
            const flowData = chatflow.flowData;
            const parsedFlowData = JSON.parse(flowData);
            const nodes = parsedFlowData.nodes;
            if (isClearFromViewMessageDialog) {
                await (0, utils_1.clearSessionMemoryFromViewMessageDialog)(nodes, this.nodesPool.componentNodes, chatId, this.AppDataSource, sessionId, memoryType);
            }
            else {
                await (0, utils_1.clearAllSessionMemory)(nodes, this.nodesPool.componentNodes, chatId, this.AppDataSource, sessionId);
            }
            const deleteOptions = { chatflowid, chatId };
            if (memoryType)
                deleteOptions.memoryType = memoryType;
            if (sessionId)
                deleteOptions.sessionId = sessionId;
            if (chatType)
                deleteOptions.chatType = chatType;
            const results = await this.AppDataSource.getRepository(ChatMessage_1.ChatMessage).delete(deleteOptions);
            return res.json(results);
        });
        // ----------------------------------------
        // Credentials
        // ----------------------------------------
        // Create new credential
        this.app.post('/api/v1/credentials', async (req, res) => {
            const body = req.body;
            const newCredential = await (0, utils_1.transformToCredentialEntity)(body);
            const credential = this.AppDataSource.getRepository(Credential_1.Credential).create(newCredential);
            const results = await this.AppDataSource.getRepository(Credential_1.Credential).save(credential);
            return res.json(results);
        });
        // Get all credentials
        this.app.get('/api/v1/credentials', async (req, res) => {
            if (req.query.credentialName) {
                let returnCredentials = [];
                if (Array.isArray(req.query.credentialName)) {
                    for (let i = 0; i < req.query.credentialName.length; i += 1) {
                        const name = req.query.credentialName[i];
                        const credentials = await this.AppDataSource.getRepository(Credential_1.Credential).findBy({
                            credentialName: name
                        });
                        returnCredentials.push(...credentials);
                    }
                }
                else {
                    const credentials = await this.AppDataSource.getRepository(Credential_1.Credential).findBy({
                        credentialName: req.query.credentialName
                    });
                    returnCredentials = [...credentials];
                }
                return res.json(returnCredentials);
            }
            else {
                const credentials = await this.AppDataSource.getRepository(Credential_1.Credential).find();
                const returnCredentials = [];
                for (const credential of credentials) {
                    returnCredentials.push((0, lodash_1.omit)(credential, ['encryptedData']));
                }
                return res.json(returnCredentials);
            }
        });
        // Get specific credential
        this.app.get('/api/v1/credentials/:id', async (req, res) => {
            const credential = await this.AppDataSource.getRepository(Credential_1.Credential).findOneBy({
                id: req.params.id
            });
            if (!credential)
                return res.status(404).send(`Credential ${req.params.id} not found`);
            // Decrpyt credentialData
            const decryptedCredentialData = await (0, utils_1.decryptCredentialData)(credential.encryptedData, credential.credentialName, this.nodesPool.componentCredentials);
            const returnCredential = Object.assign(Object.assign({}, credential), { plainDataObj: decryptedCredentialData });
            return res.json((0, lodash_1.omit)(returnCredential, ['encryptedData']));
        });
        // Update credential
        this.app.put('/api/v1/credentials/:id', async (req, res) => {
            const credential = await this.AppDataSource.getRepository(Credential_1.Credential).findOneBy({
                id: req.params.id
            });
            if (!credential)
                return res.status(404).send(`Credential ${req.params.id} not found`);
            const body = req.body;
            const updateCredential = await (0, utils_1.transformToCredentialEntity)(body);
            this.AppDataSource.getRepository(Credential_1.Credential).merge(credential, updateCredential);
            const result = await this.AppDataSource.getRepository(Credential_1.Credential).save(credential);
            return res.json(result);
        });
        // Delete all chatmessages from chatflowid
        this.app.delete('/api/v1/credentials/:id', async (req, res) => {
            const results = await this.AppDataSource.getRepository(Credential_1.Credential).delete({ id: req.params.id });
            return res.json(results);
        });
        // ----------------------------------------
        // Tools
        // ----------------------------------------
        // Get all tools
        this.app.get('/api/v1/tools', async (req, res) => {
            const tools = await this.AppDataSource.getRepository(Tool_1.Tool).find();
            return res.json(tools);
        });
        // Get specific tool
        this.app.get('/api/v1/tools/:id', async (req, res) => {
            const tool = await this.AppDataSource.getRepository(Tool_1.Tool).findOneBy({
                id: req.params.id
            });
            return res.json(tool);
        });
        // Add tool
        this.app.post('/api/v1/tools', async (req, res) => {
            const body = req.body;
            const newTool = new Tool_1.Tool();
            Object.assign(newTool, body);
            const tool = this.AppDataSource.getRepository(Tool_1.Tool).create(newTool);
            const results = await this.AppDataSource.getRepository(Tool_1.Tool).save(tool);
            return res.json(results);
        });
        // Update tool
        this.app.put('/api/v1/tools/:id', async (req, res) => {
            const tool = await this.AppDataSource.getRepository(Tool_1.Tool).findOneBy({
                id: req.params.id
            });
            if (!tool) {
                res.status(404).send(`Tool ${req.params.id} not found`);
                return;
            }
            const body = req.body;
            const updateTool = new Tool_1.Tool();
            Object.assign(updateTool, body);
            this.AppDataSource.getRepository(Tool_1.Tool).merge(tool, updateTool);
            const result = await this.AppDataSource.getRepository(Tool_1.Tool).save(tool);
            return res.json(result);
        });
        // Delete tool
        this.app.delete('/api/v1/tools/:id', async (req, res) => {
            const results = await this.AppDataSource.getRepository(Tool_1.Tool).delete({ id: req.params.id });
            return res.json(results);
        });
        // ----------------------------------------
        // Assistant
        // ----------------------------------------
        // Get all assistants
        this.app.get('/api/v1/assistants', async (req, res) => {
            const assistants = await this.AppDataSource.getRepository(Assistant_1.Assistant).find();
            return res.json(assistants);
        });
        // Get specific assistant
        this.app.get('/api/v1/assistants/:id', async (req, res) => {
            const assistant = await this.AppDataSource.getRepository(Assistant_1.Assistant).findOneBy({
                id: req.params.id
            });
            return res.json(assistant);
        });
        // Get assistant object
        this.app.get('/api/v1/openai-assistants/:id', async (req, res) => {
            var _a;
            const credentialId = req.query.credential;
            const credential = await this.AppDataSource.getRepository(Credential_1.Credential).findOneBy({
                id: credentialId
            });
            if (!credential)
                return res.status(404).send(`Credential ${credentialId} not found`);
            // Decrpyt credentialData
            const decryptedCredentialData = await (0, utils_1.decryptCredentialData)(credential.encryptedData);
            const openAIApiKey = decryptedCredentialData['openAIApiKey'];
            if (!openAIApiKey)
                return res.status(404).send(`OpenAI ApiKey not found`);
            const openai = new openai_1.default({ apiKey: openAIApiKey });
            const retrievedAssistant = await openai.beta.assistants.retrieve(req.params.id);
            const resp = await openai.files.list();
            const existingFiles = (_a = resp.data) !== null && _a !== void 0 ? _a : [];
            if (retrievedAssistant.file_ids && retrievedAssistant.file_ids.length) {
                ;
                retrievedAssistant.files = existingFiles.filter((file) => retrievedAssistant.file_ids.includes(file.id));
            }
            return res.json(retrievedAssistant);
        });
        // List available assistants
        this.app.get('/api/v1/openai-assistants', async (req, res) => {
            const credentialId = req.query.credential;
            const credential = await this.AppDataSource.getRepository(Credential_1.Credential).findOneBy({
                id: credentialId
            });
            if (!credential)
                return res.status(404).send(`Credential ${credentialId} not found`);
            // Decrpyt credentialData
            const decryptedCredentialData = await (0, utils_1.decryptCredentialData)(credential.encryptedData);
            const openAIApiKey = decryptedCredentialData['openAIApiKey'];
            if (!openAIApiKey)
                return res.status(404).send(`OpenAI ApiKey not found`);
            const openai = new openai_1.default({ apiKey: openAIApiKey });
            const retrievedAssistants = await openai.beta.assistants.list();
            return res.json(retrievedAssistants.data);
        });
        // Add assistant
        this.app.post('/api/v1/assistants', async (req, res) => {
            var _a, _b, _c, _d, _e, _f, _g;
            const body = req.body;
            if (!body.details)
                return res.status(500).send(`Invalid request body`);
            const assistantDetails = JSON.parse(body.details);
            try {
                const credential = await this.AppDataSource.getRepository(Credential_1.Credential).findOneBy({
                    id: body.credential
                });
                if (!credential)
                    return res.status(404).send(`Credential ${body.credential} not found`);
                // Decrpyt credentialData
                const decryptedCredentialData = await (0, utils_1.decryptCredentialData)(credential.encryptedData);
                const openAIApiKey = decryptedCredentialData['openAIApiKey'];
                if (!openAIApiKey)
                    return res.status(404).send(`OpenAI ApiKey not found`);
                const openai = new openai_1.default({ apiKey: openAIApiKey });
                let tools = [];
                if (assistantDetails.tools) {
                    for (const tool of (_a = assistantDetails.tools) !== null && _a !== void 0 ? _a : []) {
                        tools.push({
                            type: tool
                        });
                    }
                }
                if (assistantDetails.uploadFiles) {
                    // Base64 strings
                    let files = [];
                    const fileBase64 = assistantDetails.uploadFiles;
                    if (fileBase64.startsWith('[') && fileBase64.endsWith(']')) {
                        files = JSON.parse(fileBase64);
                    }
                    else {
                        files = [fileBase64];
                    }
                    const uploadedFiles = [];
                    for (const file of files) {
                        const splitDataURI = file.split(',');
                        const filename = (_c = (_b = splitDataURI.pop()) === null || _b === void 0 ? void 0 : _b.split(':')[1]) !== null && _c !== void 0 ? _c : '';
                        const bf = Buffer.from(splitDataURI.pop() || '', 'base64');
                        const filePath = path_1.default.join((0, utils_1.getUserHome)(), '.flowise', 'openai-assistant', filename);
                        if (!fs.existsSync(path_1.default.join((0, utils_1.getUserHome)(), '.flowise', 'openai-assistant'))) {
                            fs.mkdirSync(path_1.default.dirname(filePath), { recursive: true });
                        }
                        if (!fs.existsSync(filePath)) {
                            fs.writeFileSync(filePath, bf);
                        }
                        const createdFile = await openai.files.create({
                            file: fs.createReadStream(filePath),
                            purpose: 'assistants'
                        });
                        uploadedFiles.push(createdFile);
                        fs.unlinkSync(filePath);
                    }
                    assistantDetails.files = [...assistantDetails.files, ...uploadedFiles];
                }
                if (!assistantDetails.id) {
                    const newAssistant = await openai.beta.assistants.create({
                        name: assistantDetails.name,
                        description: assistantDetails.description,
                        instructions: assistantDetails.instructions,
                        model: assistantDetails.model,
                        tools,
                        file_ids: ((_d = assistantDetails.files) !== null && _d !== void 0 ? _d : []).map((file) => file.id)
                    });
                    assistantDetails.id = newAssistant.id;
                }
                else {
                    const retrievedAssistant = await openai.beta.assistants.retrieve(assistantDetails.id);
                    let filteredTools = (0, lodash_1.uniqWith)([...retrievedAssistant.tools, ...tools], lodash_1.isEqual);
                    filteredTools = filteredTools.filter((tool) => !(tool.type === 'function' && !tool.function));
                    await openai.beta.assistants.update(assistantDetails.id, {
                        name: assistantDetails.name,
                        description: (_e = assistantDetails.description) !== null && _e !== void 0 ? _e : '',
                        instructions: (_f = assistantDetails.instructions) !== null && _f !== void 0 ? _f : '',
                        model: assistantDetails.model,
                        tools: filteredTools,
                        file_ids: (0, lodash_1.uniqWith)([
                            ...retrievedAssistant.file_ids,
                            ...((_g = assistantDetails.files) !== null && _g !== void 0 ? _g : []).map((file) => file.id)
                        ], lodash_1.isEqual)
                    });
                }
                const newAssistantDetails = Object.assign({}, assistantDetails);
                if (newAssistantDetails.uploadFiles)
                    delete newAssistantDetails.uploadFiles;
                body.details = JSON.stringify(newAssistantDetails);
            }
            catch (error) {
                return res.status(500).send(`Error creating new assistant: ${error}`);
            }
            const newAssistant = new Assistant_1.Assistant();
            Object.assign(newAssistant, body);
            const assistant = this.AppDataSource.getRepository(Assistant_1.Assistant).create(newAssistant);
            const results = await this.AppDataSource.getRepository(Assistant_1.Assistant).save(assistant);
            return res.json(results);
        });
        // Update assistant
        this.app.put('/api/v1/assistants/:id', async (req, res) => {
            var _a, _b, _c, _d, _e;
            const assistant = await this.AppDataSource.getRepository(Assistant_1.Assistant).findOneBy({
                id: req.params.id
            });
            if (!assistant) {
                res.status(404).send(`Assistant ${req.params.id} not found`);
                return;
            }
            try {
                const openAIAssistantId = (_a = JSON.parse(assistant.details)) === null || _a === void 0 ? void 0 : _a.id;
                const body = req.body;
                const assistantDetails = JSON.parse(body.details);
                const credential = await this.AppDataSource.getRepository(Credential_1.Credential).findOneBy({
                    id: body.credential
                });
                if (!credential)
                    return res.status(404).send(`Credential ${body.credential} not found`);
                // Decrpyt credentialData
                const decryptedCredentialData = await (0, utils_1.decryptCredentialData)(credential.encryptedData);
                const openAIApiKey = decryptedCredentialData['openAIApiKey'];
                if (!openAIApiKey)
                    return res.status(404).send(`OpenAI ApiKey not found`);
                const openai = new openai_1.default({ apiKey: openAIApiKey });
                let tools = [];
                if (assistantDetails.tools) {
                    for (const tool of (_b = assistantDetails.tools) !== null && _b !== void 0 ? _b : []) {
                        tools.push({
                            type: tool
                        });
                    }
                }
                if (assistantDetails.uploadFiles) {
                    // Base64 strings
                    let files = [];
                    const fileBase64 = assistantDetails.uploadFiles;
                    if (fileBase64.startsWith('[') && fileBase64.endsWith(']')) {
                        files = JSON.parse(fileBase64);
                    }
                    else {
                        files = [fileBase64];
                    }
                    const uploadedFiles = [];
                    for (const file of files) {
                        const splitDataURI = file.split(',');
                        const filename = (_d = (_c = splitDataURI.pop()) === null || _c === void 0 ? void 0 : _c.split(':')[1]) !== null && _d !== void 0 ? _d : '';
                        const bf = Buffer.from(splitDataURI.pop() || '', 'base64');
                        const filePath = path_1.default.join((0, utils_1.getUserHome)(), '.flowise', 'openai-assistant', filename);
                        if (!fs.existsSync(path_1.default.join((0, utils_1.getUserHome)(), '.flowise', 'openai-assistant'))) {
                            fs.mkdirSync(path_1.default.dirname(filePath), { recursive: true });
                        }
                        if (!fs.existsSync(filePath)) {
                            fs.writeFileSync(filePath, bf);
                        }
                        const createdFile = await openai.files.create({
                            file: fs.createReadStream(filePath),
                            purpose: 'assistants'
                        });
                        uploadedFiles.push(createdFile);
                        fs.unlinkSync(filePath);
                    }
                    assistantDetails.files = [...assistantDetails.files, ...uploadedFiles];
                }
                const retrievedAssistant = await openai.beta.assistants.retrieve(openAIAssistantId);
                let filteredTools = (0, lodash_1.uniqWith)([...retrievedAssistant.tools, ...tools], lodash_1.isEqual);
                filteredTools = filteredTools.filter((tool) => !(tool.type === 'function' && !tool.function));
                await openai.beta.assistants.update(openAIAssistantId, {
                    name: assistantDetails.name,
                    description: assistantDetails.description,
                    instructions: assistantDetails.instructions,
                    model: assistantDetails.model,
                    tools: filteredTools,
                    file_ids: (0, lodash_1.uniqWith)([...retrievedAssistant.file_ids, ...((_e = assistantDetails.files) !== null && _e !== void 0 ? _e : []).map((file) => file.id)], lodash_1.isEqual)
                });
                const newAssistantDetails = Object.assign(Object.assign({}, assistantDetails), { id: openAIAssistantId });
                if (newAssistantDetails.uploadFiles)
                    delete newAssistantDetails.uploadFiles;
                const updateAssistant = new Assistant_1.Assistant();
                body.details = JSON.stringify(newAssistantDetails);
                Object.assign(updateAssistant, body);
                this.AppDataSource.getRepository(Assistant_1.Assistant).merge(assistant, updateAssistant);
                const result = await this.AppDataSource.getRepository(Assistant_1.Assistant).save(assistant);
                return res.json(result);
            }
            catch (error) {
                return res.status(500).send(`Error updating assistant: ${error}`);
            }
        });
        // Delete assistant
        this.app.delete('/api/v1/assistants/:id', async (req, res) => {
            const assistant = await this.AppDataSource.getRepository(Assistant_1.Assistant).findOneBy({
                id: req.params.id
            });
            if (!assistant) {
                res.status(404).send(`Assistant ${req.params.id} not found`);
                return;
            }
            try {
                const assistantDetails = JSON.parse(assistant.details);
                const credential = await this.AppDataSource.getRepository(Credential_1.Credential).findOneBy({
                    id: assistant.credential
                });
                if (!credential)
                    return res.status(404).send(`Credential ${assistant.credential} not found`);
                // Decrpyt credentialData
                const decryptedCredentialData = await (0, utils_1.decryptCredentialData)(credential.encryptedData);
                const openAIApiKey = decryptedCredentialData['openAIApiKey'];
                if (!openAIApiKey)
                    return res.status(404).send(`OpenAI ApiKey not found`);
                const openai = new openai_1.default({ apiKey: openAIApiKey });
                const results = await this.AppDataSource.getRepository(Assistant_1.Assistant).delete({ id: req.params.id });
                if (req.query.isDeleteBoth)
                    await openai.beta.assistants.del(assistantDetails.id);
                return res.json(results);
            }
            catch (error) {
                if (error.status === 404 && error.type === 'invalid_request_error')
                    return res.send('OK');
                return res.status(500).send(`Error deleting assistant: ${error}`);
            }
        });
        // Download file from assistant
        this.app.post('/api/v1/openai-assistants-file', async (req, res) => {
            const filePath = path_1.default.join((0, utils_1.getUserHome)(), '.flowise', 'openai-assistant', req.body.fileName);
            //raise error if file path is not absolute
            if (!path_1.default.isAbsolute(filePath))
                return res.status(500).send(`Invalid file path`);
            //raise error if file path contains '..'
            if (filePath.includes('..'))
                return res.status(500).send(`Invalid file path`);
            //only return from the .flowise openai-assistant folder
            if (!(filePath.includes('.flowise') && filePath.includes('openai-assistant')))
                return res.status(500).send(`Invalid file path`);
            res.setHeader('Content-Disposition', 'attachment; filename=' + path_1.default.basename(filePath));
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
        });
        // ----------------------------------------
        // Configuration
        // ----------------------------------------
        this.app.get('/api/v1/flow-config/:id', async (req, res) => {
            const chatflow = await this.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOneBy({
                id: req.params.id
            });
            if (!chatflow)
                return res.status(404).send(`Chatflow ${req.params.id} not found`);
            const flowData = chatflow.flowData;
            const parsedFlowData = JSON.parse(flowData);
            const nodes = parsedFlowData.nodes;
            const availableConfigs = (0, utils_1.findAvailableConfigs)(nodes, this.nodesPool.componentCredentials);
            return res.json(availableConfigs);
        });
        this.app.post('/api/v1/node-config', async (req, res) => {
            const nodes = [{ data: req.body }];
            const availableConfigs = (0, utils_1.findAvailableConfigs)(nodes, this.nodesPool.componentCredentials);
            return res.json(availableConfigs);
        });
        this.app.get('/api/v1/version', async (req, res) => {
            const getPackageJsonPath = () => {
                const checkPaths = [
                    path_1.default.join(__dirname, '..', 'package.json'),
                    path_1.default.join(__dirname, '..', '..', 'package.json'),
                    path_1.default.join(__dirname, '..', '..', '..', 'package.json'),
                    path_1.default.join(__dirname, '..', '..', '..', '..', 'package.json'),
                    path_1.default.join(__dirname, '..', '..', '..', '..', '..', 'package.json')
                ];
                for (const checkPath of checkPaths) {
                    if (fs.existsSync(checkPath)) {
                        return checkPath;
                    }
                }
                return '';
            };
            const packagejsonPath = getPackageJsonPath();
            if (!packagejsonPath)
                return res.status(404).send('Version not found');
            try {
                const content = await fs.promises.readFile(packagejsonPath, 'utf8');
                const parsedContent = JSON.parse(content);
                return res.json({ version: parsedContent.version });
            }
            catch (error) {
                return res.status(500).send(`Version not found: ${error}`);
            }
        });
        // ----------------------------------------
        // Upsert
        // ----------------------------------------
        this.app.post('/api/v1/vector/upsert/:id', upload.array('files'), (req, res, next) => (0, rateLimit_1.getRateLimiter)(req, res, next), async (req, res) => {
            await this.buildChatflow(req, res, undefined, false, true);
        });
        this.app.post('/api/v1/vector/internal-upsert/:id', async (req, res) => {
            await this.buildChatflow(req, res, undefined, true, true);
        });
        // ----------------------------------------
        // Prompt from Hub
        // ----------------------------------------
        this.app.post('/api/v1/load-prompt', async (req, res) => {
            try {
                let hub = new langchainhub_1.Client();
                const prompt = await hub.pull(req.body.promptName);
                const templates = (0, hub_1.parsePrompt)(prompt);
                return res.json({ status: 'OK', prompt: req.body.promptName, templates: templates });
            }
            catch (e) {
                return res.json({ status: 'ERROR', prompt: req.body.promptName, error: e === null || e === void 0 ? void 0 : e.message });
            }
        });
        this.app.post('/api/v1/prompts-list', async (req, res) => {
            try {
                const tags = req.body.tags ? `tags=${req.body.tags}` : '';
                // Default to 100, TODO: add pagination and use offset & limit
                const url = `https://api.hub.langchain.com/repos/?limit=100&${tags}has_commits=true&sort_field=num_likes&sort_direction=desc&is_archived=false`;
                axios_1.default.get(url).then((response) => {
                    if (response.data.repos) {
                        return res.json({ status: 'OK', repos: response.data.repos });
                    }
                });
            }
            catch (e) {
                return res.json({ status: 'ERROR', repos: [] });
            }
        });
        // ----------------------------------------
        // Prediction
        // ----------------------------------------
        // Send input message and get prediction result (External)
        this.app.post('/api/v1/prediction/:id', upload.array('files'), (req, res, next) => (0, rateLimit_1.getRateLimiter)(req, res, next), async (req, res) => {
            await this.buildChatflow(req, res, socketIO);
        });
        // Send input message and get prediction result (Internal)
        this.app.post('/api/v1/internal-prediction/:id', async (req, res) => {
            await this.buildChatflow(req, res, socketIO, true);
        });
        // ----------------------------------------
        // Marketplaces
        // ----------------------------------------
        // Get all chatflows for marketplaces
        this.app.get('/api/v1/marketplaces/chatflows', async (req, res) => {
            const marketplaceDir = path_1.default.join(__dirname, '..', 'marketplaces', 'chatflows');
            const jsonsInDir = fs.readdirSync(marketplaceDir).filter((file) => path_1.default.extname(file) === '.json');
            const templates = [];
            jsonsInDir.forEach((file, index) => {
                const filePath = path_1.default.join(__dirname, '..', 'marketplaces', 'chatflows', file);
                const fileData = fs.readFileSync(filePath);
                const fileDataObj = JSON.parse(fileData.toString());
                const template = {
                    id: index,
                    name: file.split('.json')[0],
                    flowData: fileData.toString(),
                    badge: fileDataObj === null || fileDataObj === void 0 ? void 0 : fileDataObj.badge,
                    description: (fileDataObj === null || fileDataObj === void 0 ? void 0 : fileDataObj.description) || ''
                };
                templates.push(template);
            });
            const FlowiseDocsQnA = templates.find((tmp) => tmp.name === 'Flowise Docs QnA');
            const FlowiseDocsQnAIndex = templates.findIndex((tmp) => tmp.name === 'Flowise Docs QnA');
            if (FlowiseDocsQnA && FlowiseDocsQnAIndex > 0) {
                templates.splice(FlowiseDocsQnAIndex, 1);
                templates.unshift(FlowiseDocsQnA);
            }
            return res.json(templates);
        });
        // Get all tools for marketplaces
        this.app.get('/api/v1/marketplaces/tools', async (req, res) => {
            const marketplaceDir = path_1.default.join(__dirname, '..', 'marketplaces', 'tools');
            const jsonsInDir = fs.readdirSync(marketplaceDir).filter((file) => path_1.default.extname(file) === '.json');
            const templates = [];
            jsonsInDir.forEach((file, index) => {
                const filePath = path_1.default.join(__dirname, '..', 'marketplaces', 'tools', file);
                const fileData = fs.readFileSync(filePath);
                const fileDataObj = JSON.parse(fileData.toString());
                const template = Object.assign(Object.assign({}, fileDataObj), { id: index, templateName: file.split('.json')[0] });
                templates.push(template);
            });
            return res.json(templates);
        });
        // ----------------------------------------
        // API Keys
        // ----------------------------------------
        const addChatflowsCount = async (keys, res) => {
            if (keys) {
                const updatedKeys = [];
                //iterate through keys and get chatflows
                for (const key of keys) {
                    const chatflows = await this.AppDataSource.getRepository(ChatFlow_1.ChatFlow)
                        .createQueryBuilder('cf')
                        .where('cf.apikeyid = :apikeyid', { apikeyid: key.id })
                        .getMany();
                    const linkedChatFlows = [];
                    chatflows.map((cf) => {
                        linkedChatFlows.push({
                            flowName: cf.name,
                            category: cf.category,
                            updatedDate: cf.updatedDate
                        });
                    });
                    key.chatFlows = linkedChatFlows;
                    updatedKeys.push(key);
                }
                return res.json(updatedKeys);
            }
            return res.json(keys);
        };
        // Get api keys
        this.app.get('/api/v1/apikey', async (req, res) => {
            const keys = await (0, apiKey_1.getAPIKeys)();
            return addChatflowsCount(keys, res);
        });
        // Add new api key
        this.app.post('/api/v1/apikey', async (req, res) => {
            const keys = await (0, apiKey_1.addAPIKey)(req.body.keyName);
            return addChatflowsCount(keys, res);
        });
        // Update api key
        this.app.put('/api/v1/apikey/:id', async (req, res) => {
            const keys = await (0, apiKey_1.updateAPIKey)(req.params.id, req.body.keyName);
            return addChatflowsCount(keys, res);
        });
        // Delete new api key
        this.app.delete('/api/v1/apikey/:id', async (req, res) => {
            const keys = await (0, apiKey_1.deleteAPIKey)(req.params.id);
            return addChatflowsCount(keys, res);
        });
        // Verify api key
        this.app.get('/api/v1/verify/apikey/:apiKey', async (req, res) => {
            try {
                const apiKey = await (0, apiKey_1.getApiKey)(req.params.apiKey);
                if (!apiKey)
                    return res.status(401).send('Unauthorized');
                return res.status(200).send('OK');
            }
            catch (err) {
                return res.status(500).send(err === null || err === void 0 ? void 0 : err.message);
            }
        });
        // ----------------------------------------
        // Serve UI static
        // ----------------------------------------
        const packagePath = (0, utils_1.getNodeModulesPackagePath)('flowise-ui');
        const uiBuildPath = path_1.default.join(packagePath, 'build');
        const uiHtmlPath = path_1.default.join(packagePath, 'build', 'index.html');
        this.app.use('/', express_1.default.static(uiBuildPath));
        // All other requests not handled will return React app
        this.app.use((req, res) => {
            res.sendFile(uiHtmlPath);
        });
    }
    /**
     * Validate API Key
     * @param {Request} req
     * @param {Response} res
     * @param {ChatFlow} chatflow
     */
    async validateKey(req, chatflow) {
        var _a, _b, _c;
        const chatFlowApiKeyId = chatflow.apikeyid;
        if (!chatFlowApiKeyId)
            return true;
        const authorizationHeader = (_b = (_a = req.headers['Authorization']) !== null && _a !== void 0 ? _a : req.headers['authorization']) !== null && _b !== void 0 ? _b : '';
        if (chatFlowApiKeyId && !authorizationHeader)
            return false;
        const suppliedKey = authorizationHeader.split(`Bearer `).pop();
        if (suppliedKey) {
            const keys = await (0, apiKey_1.getAPIKeys)();
            const apiSecret = (_c = keys.find((key) => key.id === chatFlowApiKeyId)) === null || _c === void 0 ? void 0 : _c.apiSecret;
            if (!(0, apiKey_1.compareKeys)(apiSecret, suppliedKey))
                return false;
            return true;
        }
        return false;
    }
    /**
     * Method that get chat messages.
     * @param {string} chatflowid
     * @param {chatType} chatType
     * @param {string} sortOrder
     * @param {string} chatId
     * @param {string} memoryType
     * @param {string} sessionId
     * @param {string} startDate
     * @param {string} endDate
     */
    async getChatMessage(chatflowid, chatType, sortOrder = 'ASC', chatId, memoryType, sessionId, startDate, endDate) {
        let fromDate;
        if (startDate)
            fromDate = new Date(startDate);
        let toDate;
        if (endDate)
            toDate = new Date(endDate);
        return await this.AppDataSource.getRepository(ChatMessage_1.ChatMessage).find({
            where: {
                chatflowid,
                chatType,
                chatId,
                memoryType: memoryType !== null && memoryType !== void 0 ? memoryType : (chatId ? (0, typeorm_1.IsNull)() : undefined),
                sessionId: sessionId !== null && sessionId !== void 0 ? sessionId : (chatId ? (0, typeorm_1.IsNull)() : undefined),
                createdDate: toDate && fromDate ? (0, typeorm_1.Between)(fromDate, toDate) : undefined
            },
            order: {
                createdDate: sortOrder === 'DESC' ? 'DESC' : 'ASC'
            }
        });
    }
    /**
     * Method that add chat messages.
     * @param {Partial<IChatMessage>} chatMessage
     */
    async addChatMessage(chatMessage) {
        const newChatMessage = new ChatMessage_1.ChatMessage();
        Object.assign(newChatMessage, chatMessage);
        const chatmessage = this.AppDataSource.getRepository(ChatMessage_1.ChatMessage).create(newChatMessage);
        return await this.AppDataSource.getRepository(ChatMessage_1.ChatMessage).save(chatmessage);
    }
    /**
     * Method that find memory label that is connected within chatflow
     * In a chatflow, there should only be 1 memory node
     * @param {IReactFlowNode[]} nodes
     * @param {IReactFlowEdge[]} edges
     * @returns {string | undefined}
     */
    findMemoryLabel(nodes, edges) {
        const memoryNodes = nodes.filter((node) => node.data.category === 'Memory');
        const memoryNodeIds = memoryNodes.map((mem) => mem.data.id);
        for (const edge of edges) {
            if (memoryNodeIds.includes(edge.source)) {
                const memoryNode = nodes.find((node) => node.data.id === edge.source);
                return memoryNode;
            }
        }
        return undefined;
    }
    /**
     * Build Chatflow
     * @param {Request} req
     * @param {Response} res
     * @param {Server} socketIO
     * @param {boolean} isInternal
     * @param {boolean} isUpsert
     */
    async buildChatflow(req, res, socketIO, isInternal = false, isUpsert = false) {
        var _a;
        var _b, _c, _d, _e, _f, _g, _h, _j, _k;
        try {
            const chatflowid = req.params.id;
            let incomingInput = req.body;
            let nodeToExecuteData;
            const chatflow = await this.AppDataSource.getRepository(ChatFlow_1.ChatFlow).findOneBy({
                id: chatflowid
            });
            if (!chatflow)
                return res.status(404).send(`Chatflow ${chatflowid} not found`);
            const chatId = (_d = (_b = incomingInput.chatId) !== null && _b !== void 0 ? _b : (_c = incomingInput.overrideConfig) === null || _c === void 0 ? void 0 : _c.sessionId) !== null && _d !== void 0 ? _d : (0, uuid_1.v4)();
            const userMessageDateTime = new Date();
            if (!isInternal) {
                const isKeyValidated = await this.validateKey(req, chatflow);
                if (!isKeyValidated)
                    return res.status(401).send('Unauthorized');
            }
            let isStreamValid = false;
            const files = req.files || [];
            if (files.length) {
                const overrideConfig = Object.assign({}, req.body);
                for (const file of files) {
                    const fileData = fs.readFileSync(file.path, { encoding: 'base64' });
                    const dataBase64String = `data:${file.mimetype};base64,${fileData},filename:${file.filename}`;
                    const fileInputField = (0, utils_1.mapMimeTypeToInputField)(file.mimetype);
                    if (overrideConfig[fileInputField]) {
                        overrideConfig[fileInputField] = JSON.stringify([...JSON.parse(overrideConfig[fileInputField]), dataBase64String]);
                    }
                    else {
                        overrideConfig[fileInputField] = JSON.stringify([dataBase64String]);
                    }
                }
                incomingInput = {
                    question: (_e = req.body.question) !== null && _e !== void 0 ? _e : 'hello',
                    overrideConfig,
                    history: [],
                    socketIOClientId: req.body.socketIOClientId,
                    stopNodeId: req.body.stopNodeId
                };
            }
            /*** Get chatflows and prepare data  ***/
            const flowData = chatflow.flowData;
            const parsedFlowData = JSON.parse(flowData);
            const nodes = parsedFlowData.nodes;
            const edges = parsedFlowData.edges;
            /*   Reuse the flow without having to rebuild (to avoid duplicated upsert, recomputation, reinitialization of memory) when all these conditions met:
             * - Node Data already exists in pool
             * - Still in sync (i.e the flow has not been modified since)
             * - Existing overrideConfig and new overrideConfig are the same
             * - Flow doesn't start with/contain nodes that depend on incomingInput.question
             * - Its not an Upsert request
             * TODO: convert overrideConfig to hash when we no longer store base64 string but filepath
             ***/
            const isFlowReusable = () => {
                return (Object.prototype.hasOwnProperty.call(this.chatflowPool.activeChatflows, chatflowid) &&
                    this.chatflowPool.activeChatflows[chatflowid].inSync &&
                    this.chatflowPool.activeChatflows[chatflowid].endingNodeData &&
                    (0, utils_1.isSameOverrideConfig)(isInternal, this.chatflowPool.activeChatflows[chatflowid].overrideConfig, incomingInput.overrideConfig) &&
                    !(0, utils_1.isStartNodeDependOnInput)(this.chatflowPool.activeChatflows[chatflowid].startingNodes, nodes) &&
                    !isUpsert);
            };
            if (isFlowReusable()) {
                nodeToExecuteData = this.chatflowPool.activeChatflows[chatflowid].endingNodeData;
                isStreamValid = (0, utils_1.isFlowValidForStream)(nodes, nodeToExecuteData);
                logger_1.default.debug(`[server]: Reuse existing chatflow ${chatflowid} with ending node ${nodeToExecuteData.label} (${nodeToExecuteData.id})`);
            }
            else {
                /*** Get Ending Node with Directed Graph  ***/
                const { graph, nodeDependencies } = (0, utils_1.constructGraphs)(nodes, edges);
                const directedGraph = graph;
                const endingNodeId = (0, utils_1.getEndingNode)(nodeDependencies, directedGraph);
                if (!endingNodeId)
                    return res.status(500).send(`Ending node ${endingNodeId} not found`);
                const endingNodeData = (_f = nodes.find((nd) => nd.id === endingNodeId)) === null || _f === void 0 ? void 0 : _f.data;
                if (!endingNodeData)
                    return res.status(500).send(`Ending node ${endingNodeId} data not found`);
                if (endingNodeData && endingNodeData.category !== 'Chains' && endingNodeData.category !== 'Agents' && !isUpsert) {
                    return res.status(500).send(`Ending node must be either a Chain or Agent`);
                }
                if (endingNodeData.outputs &&
                    Object.keys(endingNodeData.outputs).length &&
                    !Object.values(endingNodeData.outputs).includes(endingNodeData.name) &&
                    !isUpsert) {
                    return res
                        .status(500)
                        .send(`Output of ${endingNodeData.label} (${endingNodeData.id}) must be ${endingNodeData.label}, can't be an Output Prediction`);
                }
                isStreamValid = (0, utils_1.isFlowValidForStream)(nodes, endingNodeData);
                let chatHistory = incomingInput.history;
                if (((_g = endingNodeData.inputs) === null || _g === void 0 ? void 0 : _g.memory) &&
                    !incomingInput.history &&
                    (incomingInput.chatId || ((_h = incomingInput.overrideConfig) === null || _h === void 0 ? void 0 : _h.sessionId))) {
                    const memoryNodeId = (_j = endingNodeData.inputs) === null || _j === void 0 ? void 0 : _j.memory.split('.')[0].replace('{{', '');
                    const memoryNode = nodes.find((node) => node.data.id === memoryNodeId);
                    if (memoryNode) {
                        chatHistory = await (0, utils_1.replaceChatHistory)(memoryNode, incomingInput, this.AppDataSource, utils_1.databaseEntities, logger_1.default);
                    }
                }
                /*** Get Starting Nodes with Non-Directed Graph ***/
                const constructedObj = (0, utils_1.constructGraphs)(nodes, edges, true);
                const nonDirectedGraph = constructedObj.graph;
                const { startingNodeIds, depthQueue } = (0, utils_1.getStartingNodes)(nonDirectedGraph, endingNodeId);
                const startingNodes = nodes.filter((nd) => startingNodeIds.includes(nd.id));
                logger_1.default.debug(`[server]: Start building chatflow ${chatflowid}`);
                /*** BFS to traverse from Starting Nodes to Ending Node ***/
                const reactFlowNodes = await (0, utils_1.buildLangchain)(startingNodeIds, nodes, graph, depthQueue, this.nodesPool.componentNodes, incomingInput.question, chatHistory, chatId, chatflowid, this.AppDataSource, incomingInput === null || incomingInput === void 0 ? void 0 : incomingInput.overrideConfig, this.cachePool, isUpsert, incomingInput.stopNodeId);
                if (isUpsert) {
                    this.chatflowPool.add(chatflowid, undefined, startingNodes, incomingInput === null || incomingInput === void 0 ? void 0 : incomingInput.overrideConfig);
                    return res.status(201).send('Successfully Upserted');
                }
                const nodeToExecute = reactFlowNodes.find((node) => node.id === endingNodeId);
                if (!nodeToExecute)
                    return res.status(404).send(`Node ${endingNodeId} not found`);
                if (incomingInput.overrideConfig) {
                    nodeToExecute.data = (0, utils_1.replaceInputsWithConfig)(nodeToExecute.data, incomingInput.overrideConfig);
                }
                const reactFlowNodeData = (0, utils_1.resolveVariables)(nodeToExecute.data, reactFlowNodes, incomingInput.question, chatHistory);
                nodeToExecuteData = reactFlowNodeData;
                this.chatflowPool.add(chatflowid, nodeToExecuteData, startingNodes, incomingInput === null || incomingInput === void 0 ? void 0 : incomingInput.overrideConfig);
            }
            const nodeInstanceFilePath = this.nodesPool.componentNodes[nodeToExecuteData.name].filePath;
            const nodeModule = await (_a = nodeInstanceFilePath, Promise.resolve().then(() => __importStar(require(_a))));
            const nodeInstance = new nodeModule.nodeClass();
            logger_1.default.debug(`[server]: Running ${nodeToExecuteData.label} (${nodeToExecuteData.id})`);
            let sessionId = undefined;
            if (nodeToExecuteData.instance)
                sessionId = (0, utils_1.checkMemorySessionId)(nodeToExecuteData.instance, chatId);
            const memoryNode = this.findMemoryLabel(nodes, edges);
            const memoryType = memoryNode === null || memoryNode === void 0 ? void 0 : memoryNode.data.label;
            let chatHistory = incomingInput.history;
            if (memoryNode && !incomingInput.history && (incomingInput.chatId || ((_k = incomingInput.overrideConfig) === null || _k === void 0 ? void 0 : _k.sessionId))) {
                chatHistory = await (0, utils_1.replaceChatHistory)(memoryNode, incomingInput, this.AppDataSource, utils_1.databaseEntities, logger_1.default);
            }
            let result = isStreamValid
                ? await nodeInstance.run(nodeToExecuteData, incomingInput.question, {
                    chatflowid,
                    chatHistory,
                    socketIO,
                    socketIOClientId: incomingInput.socketIOClientId,
                    logger: logger_1.default,
                    appDataSource: this.AppDataSource,
                    databaseEntities: utils_1.databaseEntities,
                    analytic: chatflow.analytic,
                    chatId
                })
                : await nodeInstance.run(nodeToExecuteData, incomingInput.question, {
                    chatflowid,
                    chatHistory,
                    logger: logger_1.default,
                    appDataSource: this.AppDataSource,
                    databaseEntities: utils_1.databaseEntities,
                    analytic: chatflow.analytic,
                    chatId
                });
            result = typeof result === 'string' ? { text: result } : result;
            // Retrieve threadId from assistant if exists
            if (typeof result === 'object' && result.assistant) {
                sessionId = result.assistant.threadId;
            }
            const userMessage = {
                role: 'userMessage',
                content: incomingInput.question,
                chatflowid,
                chatType: isInternal ? Interface_1.chatType.INTERNAL : Interface_1.chatType.EXTERNAL,
                chatId,
                memoryType,
                sessionId,
                createdDate: userMessageDateTime
            };
            await this.addChatMessage(userMessage);
            let resultText = '';
            if (result.text)
                resultText = result.text;
            else if (result.json)
                resultText = '```json\n' + JSON.stringify(result.json, null, 2);
            else
                resultText = JSON.stringify(result, null, 2);
            const apiMessage = {
                role: 'apiMessage',
                content: resultText,
                chatflowid,
                chatType: isInternal ? Interface_1.chatType.INTERNAL : Interface_1.chatType.EXTERNAL,
                chatId,
                memoryType,
                sessionId
            };
            if (result === null || result === void 0 ? void 0 : result.sourceDocuments)
                apiMessage.sourceDocuments = JSON.stringify(result.sourceDocuments);
            if (result === null || result === void 0 ? void 0 : result.usedTools)
                apiMessage.usedTools = JSON.stringify(result.usedTools);
            if (result === null || result === void 0 ? void 0 : result.fileAnnotations)
                apiMessage.fileAnnotations = JSON.stringify(result.fileAnnotations);
            await this.addChatMessage(apiMessage);
            logger_1.default.debug(`[server]: Finished running ${nodeToExecuteData.label} (${nodeToExecuteData.id})`);
            // Only return ChatId when its Internal OR incoming input has ChatId, to avoid confusion when calling API
            if (incomingInput.chatId || isInternal)
                result.chatId = chatId;
            return res.json(result);
        }
        catch (e) {
            logger_1.default.error('[server]: Error:', e);
            return res.status(500).send(e.message);
        }
    }
    async stopApp() {
        try {
            const removePromises = [];
            await Promise.all(removePromises);
        }
        catch (e) {
            logger_1.default.error(`❌[server]: Flowise Server shut down error: ${e}`);
        }
    }
}
exports.App = App;
/**
 * Get first chat message id
 * @param {string} chatflowid
 * @returns {string}
 */
async function getChatId(chatflowid) {
    // first chatmessage id as the unique chat id
    const firstChatMessage = await (0, DataSource_1.getDataSource)()
        .getRepository(ChatMessage_1.ChatMessage)
        .createQueryBuilder('cm')
        .select('cm.id')
        .where('chatflowid = :chatflowid', { chatflowid })
        .orderBy('cm.createdDate', 'ASC')
        .getOne();
    return firstChatMessage ? firstChatMessage.id : '';
}
exports.getChatId = getChatId;
let serverApp;
async function getAllChatFlow() {
    return await (0, DataSource_1.getDataSource)().getRepository(ChatFlow_1.ChatFlow).find();
}
exports.getAllChatFlow = getAllChatFlow;
async function start() {
    serverApp = new App();
    const port = parseInt(process.env.PORT || '', 10) || 3000;
    const server = http_1.default.createServer(serverApp.app);
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: '*'
        }
    });
    await serverApp.initDatabase();
    await serverApp.config(io);
    server.listen(port, () => {
        logger_1.default.info(`⚡️ [server]: Flowise Server is listening at ${port}`);
    });
}
exports.start = start;
function getInstance() {
    return serverApp;
}
exports.getInstance = getInstance;
//# sourceMappingURL=index.js.map