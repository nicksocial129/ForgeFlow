"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chains_1 = require("langchain/chains");
const utils_1 = require("../../../src/utils");
const handler_1 = require("../../../src/handler");
class OpenApiChain_Chains {
    constructor() {
        this.label = 'OpenAPI Chain';
        this.name = 'openApiChain';
        this.version = 1.0;
        this.type = 'OpenAPIChain';
        this.icon = 'openapi.png';
        this.category = 'Chains';
        this.description = 'Chain that automatically select and call APIs based only on an OpenAPI spec';
        this.baseClasses = [this.type, ...(0, utils_1.getBaseClasses)(chains_1.APIChain)];
        this.inputs = [
            {
                label: 'ChatOpenAI Model',
                name: 'model',
                type: 'ChatOpenAI'
            },
            {
                label: 'YAML Link',
                name: 'yamlLink',
                type: 'string',
                placeholder: 'https://api.speak.com/openapi.yaml',
                description: 'If YAML link is provided, uploaded YAML File will be ignored and YAML link will be used instead'
            },
            {
                label: 'YAML File',
                name: 'yamlFile',
                type: 'file',
                fileType: '.yaml',
                description: 'If YAML link is provided, uploaded YAML File will be ignored and YAML link will be used instead'
            },
            {
                label: 'Headers',
                name: 'headers',
                type: 'json',
                additionalParams: true,
                optional: true
            }
        ];
    }
    async init(nodeData) {
        return await initChain(nodeData);
    }
    async run(nodeData, input, options) {
        const chain = await initChain(nodeData);
        const loggerHandler = new handler_1.ConsoleCallbackHandler(options.logger);
        const callbacks = await (0, handler_1.additionalCallbacks)(nodeData, options);
        if (options.socketIO && options.socketIOClientId) {
            const handler = new handler_1.CustomChainHandler(options.socketIO, options.socketIOClientId);
            const res = await chain.run(input, [loggerHandler, handler, ...callbacks]);
            return res;
        }
        else {
            const res = await chain.run(input, [loggerHandler, ...callbacks]);
            return res;
        }
    }
}
const initChain = async (nodeData) => {
    const model = nodeData.inputs?.model;
    const headers = nodeData.inputs?.headers;
    const yamlLink = nodeData.inputs?.yamlLink;
    const yamlFileBase64 = nodeData.inputs?.yamlFile;
    let yamlString = '';
    if (yamlLink) {
        yamlString = yamlLink;
    }
    else {
        const splitDataURI = yamlFileBase64.split(',');
        splitDataURI.pop();
        const bf = Buffer.from(splitDataURI.pop() || '', 'base64');
        yamlString = bf.toString('utf-8');
    }
    return await (0, chains_1.createOpenAPIChain)(yamlString, {
        llm: model,
        headers: typeof headers === 'object' ? headers : headers ? JSON.parse(headers) : {},
        verbose: process.env.DEBUG === 'true' ? true : false
    });
};
module.exports = { nodeClass: OpenApiChain_Chains };
//# sourceMappingURL=OpenAPIChain.js.map