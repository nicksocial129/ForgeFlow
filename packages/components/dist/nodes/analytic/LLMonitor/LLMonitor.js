"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class LLMonitor_Analytic {
    constructor() {
        this.label = 'LLMonitor';
        this.name = 'llmonitor';
        this.version = 1.0;
        this.type = 'LLMonitor';
        this.icon = 'llmonitor.png';
        this.category = 'Analytic';
        this.baseClasses = [this.type];
        this.inputs = [];
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['llmonitorApi']
        };
    }
}
module.exports = { nodeClass: LLMonitor_Analytic };
//# sourceMappingURL=LLMonitor.js.map