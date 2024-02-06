import { z } from 'zod';
import { CallbackManagerForToolRun } from 'langchain/callbacks';
import { StructuredTool, ToolParams } from 'langchain/tools';
export interface BaseDynamicToolInput extends ToolParams {
    name: string;
    description: string;
    code: string;
    returnDirect?: boolean;
}
export interface DynamicStructuredToolInput<T extends z.ZodObject<any, any, any, any> = z.ZodObject<any, any, any, any>> extends BaseDynamicToolInput {
    func?: (input: z.infer<T>, runManager?: CallbackManagerForToolRun) => Promise<string>;
    schema: T;
}
export declare class DynamicStructuredTool<T extends z.ZodObject<any, any, any, any> = z.ZodObject<any, any, any, any>> extends StructuredTool {
    name: string;
    description: string;
    code: string;
    func: DynamicStructuredToolInput['func'];
    schema: T;
    constructor(fields: DynamicStructuredToolInput<T>);
    protected _call(arg: z.output<T>): Promise<string>;
}
