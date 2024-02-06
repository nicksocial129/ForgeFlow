"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CUSTOM_QUESTION_GENERATOR_CHAIN_PROMPT = exports.refine_template = exports.refine_question_template = exports.map_reduce_template = exports.default_map_reduce_template = exports.qa_template = exports.default_qa_template = void 0;
exports.default_qa_template = `Use the following pieces of context to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer.

{context}

Question: {question}
Helpful Answer:`;
exports.qa_template = `Use the following pieces of context to answer the question at the end.

{context}

Question: {question}
Helpful Answer:`;
exports.default_map_reduce_template = `Given the following extracted parts of a long document and a question, create a final answer. 
If you don't know the answer, just say that you don't know. Don't try to make up an answer.

{summaries}

Question: {question}
Helpful Answer:`;
exports.map_reduce_template = `Given the following extracted parts of a long document and a question, create a final answer. 

{summaries}

Question: {question}
Helpful Answer:`;
const refine_question_template = (sysPrompt) => {
    let returnPrompt = '';
    if (sysPrompt)
        returnPrompt = `Context information is below. 
---------------------
{context}
---------------------
Given the context information and not prior knowledge, ${sysPrompt}
Answer the question: {question}.
Answer:`;
    if (!sysPrompt)
        returnPrompt = `Context information is below. 
---------------------
{context}
---------------------
Given the context information and not prior knowledge, answer the question: {question}.
Answer:`;
    return returnPrompt;
};
exports.refine_question_template = refine_question_template;
exports.refine_template = `The original question is as follows: {question}
We have provided an existing answer: {existing_answer}
We have the opportunity to refine the existing answer (only if needed) with some more context below.
------------
{context}
------------
Given the new context, refine the original answer to better answer the question. 
If you can't find answer from the context, return the original answer.`;
exports.CUSTOM_QUESTION_GENERATOR_CHAIN_PROMPT = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question, answer in the same language as the follow up question. include it in the standalone question.

Chat History:
{chat_history}
Follow Up Input: {question}
Standalone question:`;
//# sourceMappingURL=prompts.js.map