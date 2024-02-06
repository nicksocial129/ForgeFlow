"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const agents_1 = require("langchain/agents");
const tools_1 = require("langchain/tools");
const js_yaml_1 = require("js-yaml");
const src_1 = require("../../../src");
class OpenAPIToolkit_Tools {
    constructor() {
        this.label = 'OpenAPI Toolkit';
        this.name = 'openAPIToolkit';
        this.version = 1.0;
        this.type = 'OpenAPIToolkit';
        this.icon = 'openapi.png';
        this.category = 'Tools';
        this.description = 'Load OpenAPI specification';
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            description: 'Only needed if the YAML OpenAPI Spec requires authentication',
            optional: true,
            credentialNames: ['openAPIAuth']
        };
        this.inputs = [
            {
                label: 'Language Model',
                name: 'model',
                type: 'BaseLanguageModel'
            },
            {
                label: 'YAML File',
                name: 'yamlFile',
                type: 'file',
                fileType: '.yaml'
            }
        ];
        this.baseClasses = [this.type, 'Tool'];
    }
    async init(nodeData, _, options) {
        const model = nodeData.inputs?.model;
        const yamlFileBase64 = nodeData.inputs?.yamlFile;
        const credentialData = await (0, src_1.getCredentialData)(nodeData.credential ?? '', options);
        const openAPIToken = (0, src_1.getCredentialParam)('openAPIToken', credentialData, nodeData);
        const splitDataURI = yamlFileBase64.split(',');
        splitDataURI.pop();
        const bf = Buffer.from(splitDataURI.pop() || '', 'base64');
        const utf8String = bf.toString('utf-8');
        const data = (0, js_yaml_1.load)(utf8String);
        if (!data) {
            throw new Error('Failed to load OpenAPI spec');
        }
        const headers = {
            'Content-Type': 'application/json'
        };
        if (openAPIToken)
            headers.Authorization = `Bearer ${openAPIToken}`;
        const toolkit = new agents_1.OpenApiToolkit(new tools_1.JsonSpec(data), model, headers);
        return toolkit.tools;
    }
}
module.exports = { nodeClass: OpenAPIToolkit_Tools };
//# sourceMappingURL=OpenAPIToolkit.js.map