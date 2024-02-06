import { BaseOutputParser } from 'langchain/schema/output_parser';
import { LLMChain } from 'langchain/chains';
import { BaseLanguageModel, BaseLanguageModelCallOptions } from 'langchain/base_language';
import { ICommonObject } from '../../src';
export declare const CATEGORY = "Output Parsers";
export declare const formatResponse: (response: string | object) => string | object;
export declare const injectOutputParser: (outputParser: BaseOutputParser<unknown>, chain: LLMChain<string | object | BaseLanguageModel<any, BaseLanguageModelCallOptions>>, promptValues?: ICommonObject | undefined) => ICommonObject | undefined;
