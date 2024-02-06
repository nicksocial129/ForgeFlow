"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../src/utils");
const tools_1 = require("langchain/tools");
const node_1 = require("langchain/stores/file/node");
class WriteFile_Tools {
    constructor() {
        this.label = 'Write File';
        this.name = 'writeFile';
        this.version = 1.0;
        this.type = 'WriteFile';
        this.icon = 'writefile.svg';
        this.category = 'Tools';
        this.description = 'Write file to disk';
        this.baseClasses = [this.type, 'Tool', ...(0, utils_1.getBaseClasses)(tools_1.WriteFileTool)];
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
        return new tools_1.WriteFileTool({ store });
    }
}
module.exports = { nodeClass: WriteFile_Tools };
//# sourceMappingURL=WriteFile.js.map