"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const docx_1 = require("langchain/document_loaders/fs/docx");
class Docx_DocumentLoaders {
    constructor() {
        this.label = 'Docx File';
        this.name = 'docxFile';
        this.version = 1.0;
        this.type = 'Document';
        this.icon = 'Docx.png';
        this.category = 'Document Loaders';
        this.description = `Load data from DOCX files`;
        this.baseClasses = [this.type];
        this.inputs = [
            {
                label: 'Docx File',
                name: 'docxFile',
                type: 'file',
                fileType: '.docx'
            },
            {
                label: 'Text Splitter',
                name: 'textSplitter',
                type: 'TextSplitter',
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
        const docxFileBase64 = nodeData.inputs?.docxFile;
        const metadata = nodeData.inputs?.metadata;
        let alldocs = [];
        let files = [];
        if (docxFileBase64.startsWith('[') && docxFileBase64.endsWith(']')) {
            files = JSON.parse(docxFileBase64);
        }
        else {
            files = [docxFileBase64];
        }
        for (const file of files) {
            const splitDataURI = file.split(',');
            splitDataURI.pop();
            const bf = Buffer.from(splitDataURI.pop() || '', 'base64');
            const blob = new Blob([bf]);
            const loader = new docx_1.DocxLoader(blob);
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
module.exports = { nodeClass: Docx_DocumentLoaders };
//# sourceMappingURL=Docx.js.map