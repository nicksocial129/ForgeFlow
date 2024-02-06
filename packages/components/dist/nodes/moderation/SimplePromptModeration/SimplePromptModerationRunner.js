"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimplePromptModerationRunner = void 0;
class SimplePromptModerationRunner {
    constructor(denyList, moderationErrorMessage) {
        this.denyList = '';
        this.moderationErrorMessage = '';
        this.denyList = denyList;
        if (denyList.indexOf('\n') === -1) {
            this.denyList += '\n';
        }
        this.moderationErrorMessage = moderationErrorMessage;
    }
    async checkForViolations(input) {
        this.denyList.split('\n').forEach((denyListItem) => {
            if (denyListItem && denyListItem !== '' && input.toLowerCase().includes(denyListItem.toLowerCase())) {
                throw Error(this.moderationErrorMessage);
            }
        });
        return Promise.resolve(input);
    }
}
exports.SimplePromptModerationRunner = SimplePromptModerationRunner;
//# sourceMappingURL=SimplePromptModerationRunner.js.map