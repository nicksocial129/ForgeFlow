import { LLMChain } from 'langchain/chains';
import { BaseChatModel } from 'langchain/chat_models/base';
import { VectorStore } from 'langchain/dist/vectorstores/base';
import { PromptTemplate } from 'langchain/prompts';
declare class TaskCreationChain extends LLMChain {
    constructor(prompt: PromptTemplate, llm: BaseChatModel);
    static from_llm(llm: BaseChatModel): LLMChain;
}
declare class TaskPrioritizationChain extends LLMChain {
    constructor(prompt: PromptTemplate, llm: BaseChatModel);
    static from_llm(llm: BaseChatModel): TaskPrioritizationChain;
}
declare class ExecutionChain extends LLMChain {
    constructor(prompt: PromptTemplate, llm: BaseChatModel);
    static from_llm(llm: BaseChatModel): LLMChain;
}
interface Task {
    task_id: number;
    task_name: string;
}
export declare function get_top_tasks(vectorStore: VectorStore, query: string, k: number): Promise<string[]>;
export declare class BabyAGI {
    taskList: Array<Task>;
    taskCreationChain: TaskCreationChain;
    taskPrioritizationChain: TaskPrioritizationChain;
    executionChain: ExecutionChain;
    taskIdCounter: number;
    vectorStore: VectorStore;
    maxIterations: number;
    topK: number;
    constructor(taskCreationChain: TaskCreationChain, taskPrioritizationChain: TaskPrioritizationChain, executionChain: ExecutionChain, vectorStore: VectorStore, maxIterations: number, topK: number);
    addTask(task: Task): void;
    printTaskList(): void;
    printNextTask(task: Task): void;
    printTaskResult(result: string): void;
    getInputKeys(): string[];
    getOutputKeys(): string[];
    call(inputs: Record<string, any>): Promise<string>;
    static fromLLM(llm: BaseChatModel, vectorstore: VectorStore, maxIterations?: number, topK?: number): BabyAGI;
}
export {};
