"use strict";
/**
 * Types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorStoreRetriever = exports.PromptRetriever = exports.PromptTemplate = void 0;
/**
 * Classes
 */
const prompts_1 = require("langchain/prompts");
class PromptTemplate extends prompts_1.PromptTemplate {
    constructor(input) {
        super(input);
    }
}
exports.PromptTemplate = PromptTemplate;
const fixedTemplate = `Here is a question:
{input}
`;
class PromptRetriever {
    constructor(fields) {
        this.name = fields.name;
        this.description = fields.description;
        this.systemMessage = `${fields.systemMessage}\n${fixedTemplate}`;
    }
}
exports.PromptRetriever = PromptRetriever;
class VectorStoreRetriever {
    constructor(fields) {
        this.name = fields.name;
        this.description = fields.description;
        this.vectorStore = fields.vectorStore;
    }
}
exports.VectorStoreRetriever = VectorStoreRetriever;
//# sourceMappingURL=Interface.js.map