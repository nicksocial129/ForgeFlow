"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("langchain/document_loaders/base");
const document_1 = require("langchain/document");
const axios_1 = __importDefault(require("axios"));
const utils_1 = require("../../../src/utils");
class Airtable_DocumentLoaders {
    constructor() {
        this.label = 'Airtable';
        this.name = 'airtable';
        this.version = 1.0;
        this.type = 'Document';
        this.icon = 'airtable.svg';
        this.category = 'Document Loaders';
        this.description = `Load data from Airtable table`;
        this.baseClasses = [this.type];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['airtableApi']
        };
        this.inputs = [
            {
                label: 'Text Splitter',
                name: 'textSplitter',
                type: 'TextSplitter',
                optional: true
            },
            {
                label: 'Base Id',
                name: 'baseId',
                type: 'string',
                placeholder: 'app11RobdGoX0YNsC',
                description: 'If your table URL looks like: https://airtable.com/app11RobdGoX0YNsC/tblJdmvbrgizbYICO/viw9UrP77Id0CE4ee, app11RovdGoX0YNsC is the base id'
            },
            {
                label: 'Table Id',
                name: 'tableId',
                type: 'string',
                placeholder: 'tblJdmvbrgizbYICO',
                description: 'If your table URL looks like: https://airtable.com/app11RobdGoX0YNsC/tblJdmvbrgizbYICO/viw9UrP77Id0CE4ee, tblJdmvbrgizbYICO is the table id'
            },
            {
                label: 'Return All',
                name: 'returnAll',
                type: 'boolean',
                default: true,
                additionalParams: true,
                description: 'If all results should be returned or only up to a given limit'
            },
            {
                label: 'Limit',
                name: 'limit',
                type: 'number',
                default: 100,
                additionalParams: true,
                description: 'Number of results to return'
            },
            {
                label: 'Metadata',
                name: 'metadata',
                type: 'json',
                optional: true,
                additionalParams: true
            }
        ];
    }
    async init(nodeData, _, options) {
        const baseId = nodeData.inputs?.baseId;
        const tableId = nodeData.inputs?.tableId;
        const returnAll = nodeData.inputs?.returnAll;
        const limit = nodeData.inputs?.limit;
        const textSplitter = nodeData.inputs?.textSplitter;
        const metadata = nodeData.inputs?.metadata;
        const credentialData = await (0, utils_1.getCredentialData)(nodeData.credential ?? '', options);
        const accessToken = (0, utils_1.getCredentialParam)('accessToken', credentialData, nodeData);
        const airtableOptions = {
            baseId,
            tableId,
            returnAll,
            accessToken,
            limit: limit ? parseInt(limit, 10) : 100
        };
        const loader = new AirtableLoader(airtableOptions);
        let docs = [];
        if (textSplitter) {
            docs = await loader.loadAndSplit(textSplitter);
        }
        else {
            docs = await loader.load();
        }
        if (metadata) {
            const parsedMetadata = typeof metadata === 'object' ? metadata : JSON.parse(metadata);
            let finaldocs = [];
            for (const doc of docs) {
                const newdoc = {
                    ...doc,
                    metadata: {
                        ...doc.metadata,
                        ...parsedMetadata
                    }
                };
                finaldocs.push(newdoc);
            }
            return finaldocs;
        }
        return docs;
    }
}
class AirtableLoader extends base_1.BaseDocumentLoader {
    constructor({ baseId, tableId, accessToken, limit = 100, returnAll = false }) {
        super();
        this.baseId = baseId;
        this.tableId = tableId;
        this.accessToken = accessToken;
        this.limit = limit;
        this.returnAll = returnAll;
    }
    async load() {
        if (this.returnAll) {
            return this.loadAll();
        }
        return this.loadLimit();
    }
    async fetchAirtableData(url, params) {
        try {
            const headers = {
                Authorization: `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
                Accept: 'application/json'
            };
            const response = await axios_1.default.get(url, { params, headers });
            return response.data;
        }
        catch (error) {
            throw new Error(`Failed to fetch ${url} from Airtable: ${error}`);
        }
    }
    createDocumentFromPage(page) {
        // Generate the URL
        const pageUrl = `https://api.airtable.com/v0/${this.baseId}/${this.tableId}/${page.id}`;
        // Return a langchain document
        return new document_1.Document({
            pageContent: JSON.stringify(page.fields, null, 2),
            metadata: {
                url: pageUrl
            }
        });
    }
    async loadLimit() {
        const params = { maxRecords: this.limit };
        const data = await this.fetchAirtableData(`https://api.airtable.com/v0/${this.baseId}/${this.tableId}`, params);
        if (data.records.length === 0) {
            return [];
        }
        return data.records.map((page) => this.createDocumentFromPage(page));
    }
    async loadAll() {
        const params = { pageSize: 100 };
        let data;
        let returnPages = [];
        do {
            data = await this.fetchAirtableData(`https://api.airtable.com/v0/${this.baseId}/${this.tableId}`, params);
            returnPages.push.apply(returnPages, data.records);
            params.offset = data.offset;
        } while (data.offset !== undefined);
        return returnPages.map((page) => this.createDocumentFromPage(page));
    }
}
module.exports = {
    nodeClass: Airtable_DocumentLoaders
};
//# sourceMappingURL=Airtable.js.map