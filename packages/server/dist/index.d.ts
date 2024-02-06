import express, { Request, Response } from 'express';
import { Server } from 'socket.io';
import { IChatFlow, IReactFlowNode, chatType, IChatMessage, IReactFlowEdge } from './Interface';
import { NodesPool } from './NodesPool';
import { ChatFlow } from './database/entities/ChatFlow';
import { ChatMessage } from './database/entities/ChatMessage';
import { ChatflowPool } from './ChatflowPool';
import { CachePool } from './CachePool';
export declare class App {
    app: express.Application;
    nodesPool: NodesPool;
    chatflowPool: ChatflowPool;
    cachePool: CachePool;
    AppDataSource: import("typeorm").DataSource;
    constructor();
    initDatabase(): Promise<void>;
    config(socketIO?: Server): Promise<void>;
    /**
     * Validate API Key
     * @param {Request} req
     * @param {Response} res
     * @param {ChatFlow} chatflow
     */
    validateKey(req: Request, chatflow: ChatFlow): Promise<boolean>;
    /**
     * Method that get chat messages.
     * @param {string} chatflowid
     * @param {chatType} chatType
     * @param {string} sortOrder
     * @param {string} chatId
     * @param {string} memoryType
     * @param {string} sessionId
     * @param {string} startDate
     * @param {string} endDate
     */
    getChatMessage(chatflowid: string, chatType: chatType | undefined, sortOrder?: string, chatId?: string, memoryType?: string, sessionId?: string, startDate?: string, endDate?: string): Promise<ChatMessage[]>;
    /**
     * Method that add chat messages.
     * @param {Partial<IChatMessage>} chatMessage
     */
    addChatMessage(chatMessage: Partial<IChatMessage>): Promise<ChatMessage>;
    /**
     * Method that find memory label that is connected within chatflow
     * In a chatflow, there should only be 1 memory node
     * @param {IReactFlowNode[]} nodes
     * @param {IReactFlowEdge[]} edges
     * @returns {string | undefined}
     */
    findMemoryLabel(nodes: IReactFlowNode[], edges: IReactFlowEdge[]): IReactFlowNode | undefined;
    /**
     * Build Chatflow
     * @param {Request} req
     * @param {Response} res
     * @param {Server} socketIO
     * @param {boolean} isInternal
     * @param {boolean} isUpsert
     */
    buildChatflow(req: Request, res: Response, socketIO?: Server, isInternal?: boolean, isUpsert?: boolean): Promise<express.Response<any, Record<string, any>>>;
    stopApp(): Promise<void>;
}
/**
 * Get first chat message id
 * @param {string} chatflowid
 * @returns {string}
 */
export declare function getChatId(chatflowid: string): Promise<string>;
export declare function getAllChatFlow(): Promise<IChatFlow[]>;
export declare function start(): Promise<void>;
export declare function getInstance(): App | undefined;
