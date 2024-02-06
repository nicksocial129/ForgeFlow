"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MotorheadMemoryApi {
    constructor() {
        this.label = 'Motorhead Memory API';
        this.name = 'motorheadMemoryApi';
        this.version = 1.0;
        this.description =
            'Refer to <a target="_blank" href="https://docs.getmetal.io/misc-get-keys">official guide</a> on how to create API key and Client ID on Motorhead Memory';
        this.inputs = [
            {
                label: 'Client ID',
                name: 'clientId',
                type: 'string'
            },
            {
                label: 'API Key',
                name: 'apiKey',
                type: 'password'
            }
        ];
    }
}
module.exports = { credClass: MotorheadMemoryApi };
//# sourceMappingURL=MotorheadMemoryApi.credential.js.map