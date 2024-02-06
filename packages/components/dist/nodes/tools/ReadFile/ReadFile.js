"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const tools_1 = require("langchain/tools");
const node_1 = require("langchain/stores/file/node");
class ReadFile_Tools {
    constructor() {
        this.label = 'Read File';
        this.name = 'readFile';
        this.version = 1.0;
        this.type = 'ReadFile';
        this.icon = 'readfile.svg';
        this.category = 'Tools';
        this.description = 'Read file from disk';
        this.baseClasses = [this.type, 'Tool', ...(0, utils_1.getBaseClasses)(tools_1.ReadFileTool)];
        this.inputs = [
            {
                label: 'Base Path',
                name: 'basePath',
                placeholder: `C:\\Users\\User\\Desktop`,
                type: 'string',
                optional: true
            }
        ];
    }
    async init(nodeData) {
        const basePath = nodeData.inputs?.basePath;
        const store = basePath ? new node_1.NodeFileStore(basePath) : new node_1.NodeFileStore();
        return new tools_1.ReadFileTool({ store });
    }
}
module.exports = { nodeClass: ReadFile_Tools };
//# sourceMappingURL=ReadFile.js.map