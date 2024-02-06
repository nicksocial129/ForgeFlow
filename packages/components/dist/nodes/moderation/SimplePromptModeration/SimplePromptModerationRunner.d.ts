import { Moderation } from '../Moderation';
export declare class SimplePromptModerationRunner implements Moderation {
    private readonly denyList;
    private readonly moderationErrorMessage;
    constructor(denyList: string, moderationErrorMessage: string);
    checkForViolations(input: string): Promise<string>;
}
