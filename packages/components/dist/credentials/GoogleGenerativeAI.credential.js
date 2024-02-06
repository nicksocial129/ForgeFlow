"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class GoogleGenerativeAICredential {
    constructor() {
        this.label = 'Google Generative AI';
        this.name = 'googleGenerativeAI';
        this.version = 1.0;
        this.description = 'Get your <a target="_blank" href="https://ai.google.dev/tutorials/setup">API Key</a> here.';
        this.inputs = [
            {
                label: 'Google AI API Key',
                name: 'googleGenerativeAPIKey',
                type: 'password'
            }
        ];
    }
}
module.exports = { credClass: GoogleGenerativeAICredential };
//# sourceMappingURL=GoogleGenerativeAI.credential.js.map