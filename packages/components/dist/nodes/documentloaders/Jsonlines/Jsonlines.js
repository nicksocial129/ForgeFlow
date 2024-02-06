"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const json_1 = require("langchain/document_loaders/fs/json");
class Jsonlines_DocumentLoaders {
    constructor() {
        this.label = 'Json Lines File';
        this.name = 'jsonlinesFile';
        this.version = 1.0;
        this.type = 'Document';
        this.icon = 'jsonlines.svg';
        this.category = 'Document Loaders';
        this.description = `Load data from JSON Lines files`;
        this.baseClasses = [this.type];
        this.inputs = [
            {
                label: 'Jsonlines File',
                name: 'jsonlinesFile',
                type: 'file',
                fileType: '.jsonl'
            },
            {
                label: 'Text Splitter',
                name: 'textSplitter',
                type: 'TextSplitter',
                optional: true
            },
            {
                label: 'Pointer Extraction',
                name: 'pointerName',
                type: 'string',
                placeholder: 'Enter pointer name',
                optional: false
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
    async init(nodeData) {
        const textSplitter = nodeData.inputs?.textSplitter;
        const jsonLinesFileBase64 = nodeData.inputs?.jsonlinesFile;
        const pointerName = nodeData.inputs?.pointerName;
        const metadata = nodeData.inputs?.metadata;
        let alldocs = [];
        let files = [];
        let pointer = '/' + pointerName.trim();
        if (jsonLinesFileBase64.startsWith('[') && jsonLinesFileBase64.endsWith(']')) {
            files = JSON.parse(jsonLinesFileBase64);
        }
        else {
            files = [jsonLinesFileBase64];
        }
        for (const file of files) {
            const splitDataURI = file.split(',');
            splitDataURI.pop();
            const bf = Buffer.from(splitDataURI.pop() || '', 'base64');
            const blob = new Blob([bf]);
            const loader = new json_1.JSONLinesLoader(blob, pointer);
            if (textSplitter) {
                const docs = await loader.loadAndSplit(textSplitter);
                alldocs.push(...docs);
            }
            else {
                const docs = await loader.load();
                alldocs.push(...docs);
            }
        }
        if (metadata) {
            const parsedMetadata = typeof metadata === 'object' ? metadata : JSON.parse(metadata);
            let finaldocs = [];
            for (const doc of alldocs) {
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
        return alldocs;
    }
}
module.exports = { nodeClass: Jsonlines_DocumentLoaders };
//# sourceMappingURL=Jsonlines.js.map