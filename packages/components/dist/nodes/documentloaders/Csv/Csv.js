"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const csv_1 = require("langchain/document_loaders/fs/csv");
class Csv_DocumentLoaders {
    constructor() {
        this.label = 'Csv File';
        this.name = 'csvFile';
        this.version = 1.0;
        this.type = 'Document';
        this.icon = 'Csv.png';
        this.category = 'Document Loaders';
        this.description = `Load data from CSV files`;
        this.baseClasses = [this.type];
        this.inputs = [
            {
                label: 'Csv File',
                name: 'csvFile',
                type: 'file',
                fileType: '.csv'
            },
            {
                label: 'Text Splitter',
                name: 'textSplitter',
                type: 'TextSplitter',
                optional: true
            },
            {
                label: 'Single Column Extraction',
                name: 'columnName',
                type: 'string',
                description: 'Extracting a single column',
                placeholder: 'Enter column name',
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
        const csvFileBase64 = nodeData.inputs?.csvFile;
        const columnName = nodeData.inputs?.columnName;
        const metadata = nodeData.inputs?.metadata;
        let alldocs = [];
        let files = [];
        if (csvFileBase64.startsWith('[') && csvFileBase64.endsWith(']')) {
            files = JSON.parse(csvFileBase64);
        }
        else {
            files = [csvFileBase64];
        }
        for (const file of files) {
            const splitDataURI = file.split(',');
            splitDataURI.pop();
            const bf = Buffer.from(splitDataURI.pop() || '', 'base64');
            const blob = new Blob([bf]);
            const loader = new csv_1.CSVLoader(blob, columnName.trim().length === 0 ? undefined : columnName.trim());
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
module.exports = { nodeClass: Csv_DocumentLoaders };
//# sourceMappingURL=Csv.js.map