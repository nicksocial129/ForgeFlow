"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ZapierNLAApi {
    constructor() {
        this.label = 'Zapier NLA API';
        this.name = 'zapierNLAApi';
        this.version = 1.0;
        this.inputs = [
            {
                label: 'Zapier NLA Api Key',
                name: 'zapierNLAApiKey',
                type: 'password'
            }
        ];
    }
}
module.exports = { credClass: ZapierNLAApi };
//# sourceMappingURL=ZapierNLAApi.credential.js.map