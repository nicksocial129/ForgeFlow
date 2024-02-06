"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../../../src");
const momento_1 = require("langchain/cache/momento");
const sdk_1 = require("@gomomento/sdk");
class MomentoCache {
    constructor() {
        this.label = 'Momento Cache';
        this.name = 'momentoCache';
        this.version = 1.0;
        this.type = 'MomentoCache';
        this.description = 'Cache LLM response using Momento, a distributed, serverless cache';
        this.icon = 'momento.png';
        this.category = 'Cache';
        this.baseClasses = [this.type, ...(0, src_1.getBaseClasses)(momento_1.MomentoCache)];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            optional: true,
            credentialNames: ['momentoCacheApi']
        };
        this.inputs = [];
    }
    async init(nodeData, _, options) {
        const credentialData = await (0, src_1.getCredentialData)(nodeData.credential ?? '', options);
        const apiKey = (0, src_1.getCredentialParam)('momentoApiKey', credentialData, nodeData);
        const cacheName = (0, src_1.getCredentialParam)('momentoCache', credentialData, nodeData);
        // See https://github.com/momentohq/client-sdk-javascript for connection options
        const client = new sdk_1.CacheClient({
            configuration: sdk_1.Configurations.Laptop.v1(),
            credentialProvider: sdk_1.CredentialProvider.fromString({
                apiKey: apiKey
            }),
            defaultTtlSeconds: 60 * 60 * 24
        });
        let momentoCache = await momento_1.MomentoCache.fromProps({
            client,
            cacheName: cacheName
        });
        return momentoCache;
    }
}
module.exports = { nodeClass: MomentoCache };
//# sourceMappingURL=MomentoCache.js.map