"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const json_1 = require("langchain/document_loaders/fs/json");
class Json_DocumentLoaders {
    constructor() {
        this.label = 'Json File';
        this.name = 'jsonFile';
        this.version = 1.0;
        this.type = 'Document';
        this.icon = 'json.svg';
        this.category = 'Document Loaders';
        this.description = `Load data from JSON files`;
        this.baseClasses = [this.type];
        this.inputs = [
            {
                label: 'Json File',
                name: 'jsonFile',
                type: 'file',
                fileType: '.json'
            },
            {
                label: 'Text Splitter',
                name: 'textSplitter',
                type: 'TextSplitter',
                optional: true
            },
            {
                label: 'Pointers Extraction (separated by commas)',
                name: 'pointersName',
                type: 'string',
                description: 'Extracting multiple pointers',
                placeholder: 'Enter pointers name',
                optional: true
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
        const jsonFileBase64 = nodeData.inputs?.jsonFile;
        const pointersName = nodeData.inputs?.pointersName;
        const metadata = nodeData.inputs?.metadata;
        let pointers = [];
        if (pointersName) {
            const outputString = pointersName.replace(/[^a-zA-Z0-9,]+/g, ',');
            pointers = outputString.split(',').map((pointer) => '/' + pointer.trim());
        }
        let alldocs = [];
        let files = [];
        if (jsonFileBase64.startsWith('[') && jsonFileBase64.endsWith(']')) {
            files = JSON.parse(jsonFileBase64);
        }
        else {
            files = [jsonFileBase64];
        }
        for (const file of files) {
            const splitDataURI = file.split(',');
            splitDataURI.pop();
            const bf = Buffer.from(splitDataURI.pop() || '', 'base64');
            const blob = new Blob([bf]);
            const loader = new json_1.JSONLoader(blob, pointers.length != 0 ? pointers : undefined);
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
module.exports = { nodeClass: Json_DocumentLoaders };
//# sourceMappingURL=Json.js.map